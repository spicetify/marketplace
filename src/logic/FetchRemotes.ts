import { t } from "i18next";

import { BLACKLIST_URL, ITEMS_PER_REQUEST, SNIPPETS_URL } from "../constants";
import type { CardItem, RepoSearchItem, RepoSearchPage, RepoTopic, Snippet } from "../types/marketplace-types";
import { manifestSchema } from "./Schemas";
import { marketplaceStorage } from "./Storage";
import { addToSessionStorage, cacheInSessionStorage, isBlacklisted, processAuthors } from "./Utils";

// https://docs.github.com/en/github/searching-for-information-on-github/searching-on-github/searching-for-repositories#search-by-topic
// https://docs.github.com/en/rest/reference/search#search-repositories

/**
 * Map a Marketplace sort mode onto the closest GitHub search sort.
 *
 * Without an explicit `sort`, GitHub falls back to "best match", which ranks
 * heavily on popularity. New or low-star repos land on the last page, so the
 * recency sorts can never surface them. GitHub has no "created" sort, so the
 * created-date modes use `updated` to at least fetch recently-touched repos.
 */
function githubSortParams(sortMode: string) {
  switch (sortMode) {
    case "newest":
    case "lastUpdated":
      return "&sort=updated&order=desc";
    case "oldest":
    case "mostStale":
      return "&sort=updated&order=asc";
    default:
      return "&sort=stars&order=desc";
  }
}

/**
 * Keep only the fields Marketplace uses (plus a few for debugging) from a search result.
 * The full object has ~80 fields and makes each cached page about 1MB, which
 * fills the sessionStorage quota after a handful of pages.
 */
function trimRepoSearchItem(repo: RepoSearchItem): RepoSearchItem {
  return {
    full_name: repo.full_name,
    description: repo.description,
    html_url: repo.html_url,
    contents_url: repo.contents_url,
    default_branch: repo.default_branch,
    stargazers_count: repo.stargazers_count,
    archived: repo.archived,
    created_at: repo.created_at,
    pushed_at: repo.pushed_at,
    updated_at: repo.updated_at
  };
}

/**
 * Query GitHub for all repos with the requested topic
 * @param tag The tag ("topic") to search for
 * @param page The query page number
 * @returns Array of search results (filtered through the blacklist)
 */
export async function getTaggedRepos(tag: RepoTopic, page = 1, BLACKLIST: string[] = [], showArchived = false, sortMode = "stars") {
  // www is needed or it will block with "cross-origin" error.
  let url = `https://api.github.com/search/repositories?q=${encodeURIComponent(`topic:${tag}`)}&per_page=${ITEMS_PER_REQUEST}${githubSortParams(sortMode)}`;

  // We can test multiple pages with this URL (58 results), as well as broken iamges etc.
  // let url = `https://api.github.com/search/repositories?q=${encodeURIComponent("topic:spicetify")}`;
  if (page) url += `&page=${page}`;

  // Cache by the exact request, so sort modes that send the same GitHub query
  // (e.g. Newest and Last Updated) share results instead of fetching them twice.
  const allRepos: RepoSearchPage | null =
    JSON.parse(window.sessionStorage.getItem(url) || "null") ||
    (await fetch(url)
      .then((res) => res.json())
      .then((res) => (res?.items ? { total_count: res.total_count, items: res.items.map(trimRepoSearchItem) } : null))
      .catch(() => null));

  if (!allRepos?.items) {
    Spicetify.showNotification(t("notifications.tooManyRequests"), true, 5000);
    return { total_count: 0, page_count: 0, items: [] };
  }

  cacheInSessionStorage(url, JSON.stringify(allRepos));

  const filteredResults = {
    ...allRepos,
    // Include count of all items on the page, since we're filtering the blacklist below,
    // which can mess up the paging logic
    page_count: allRepos.items.length,
    items: allRepos.items.filter((item) => !isBlacklisted(item.html_url, BLACKLIST) && (showArchived || !item.archived))
  };

  return filteredResults;
}

/**
 * Work out which page of search results to request next.
 * Page 0 omits the `page` param, so GitHub returns page 1, and the next page is 2.
 * @param page The page just requested
 * @param pageOfRepos That page's results from getTaggedRepos
 * @returns The next page number, or null once every result has been loaded
 */
export function getNextPage(page: number, pageOfRepos: { page_count: number; total_count: number }) {
  const currentPage = page > 0 ? page : 1;
  // Count the unfiltered items, since the blacklist filter shrinks `items`
  const soFarResults = ITEMS_PER_REQUEST * (currentPage - 1) + pageOfRepos.page_count;
  return soFarResults < pageOfRepos.total_count ? currentPage + 1 : null;
}

// Workaround for not spamming console with 404s
const script = `
  self.addEventListener('message', async (event) => {
    const url = event.data;
    const response = await fetch(url);
    const data = await response.json().catch(() => null);
    self.postMessage(data);
  });
`;
const blob = new Blob([script], { type: "application/javascript" });
const workerURL = URL.createObjectURL(blob);

async function fetchRepoManifest(url: string) {
  const worker = new Worker(workerURL);
  return new Promise((resolver) => {
    const resolve = (data) => {
      worker.terminate();
      resolver(data);
    };

    worker.postMessage(url);
    worker.addEventListener("message", (event) => resolve(event.data), { once: true });
    worker.addEventListener("error", () => resolve(null), { once: true });
  });
}

// TODO: add try/catch here?
// TODO: can we add a return type here?
/**
 * Get the manifest object for a repo
 * @param user Owner username
 * @param repo Repo name
 * @param branch Default branch name (e.g. main or master)
 * @returns The manifest object
 */
async function getRepoManifest(user: string, repo: string, branch: string) {
  const key = `${user}-${repo}`;
  const sessionStorageItem = window.sessionStorage.getItem(key);
  const failedSessionStorageItems = JSON.parse(window.sessionStorage.getItem("noManifests") || "[]");
  const url = `https://raw.githubusercontent.com/${user}/${repo}/${branch}/manifest.json`;
  if (!sessionStorageItem && failedSessionStorageItems.includes(url)) return [];

  let manifests: ReturnType<typeof JSON.parse>;
  let loadedFromCache = false;

  if (sessionStorageItem) {
    try {
      manifests = JSON.parse(sessionStorageItem);
      loadedFromCache = true;
    } catch (error) {
      console.warn(`Invalid cached Marketplace manifest from ${user}/${repo}`, error);
      window.sessionStorage.removeItem(key);
      manifests = await fetchRepoManifest(url);
    }
  } else {
    manifests = await fetchRepoManifest(url);
  }

  if (!manifests) {
    addToSessionStorage([url], "noManifests");
    return [];
  }
  if (!Array.isArray(manifests)) manifests = [manifests];

  const parsedManifests = manifests.flatMap((manifest) => {
    const parsed = manifestSchema.safeParse(manifest);
    if (parsed.success) return [parsed.data];
    console.warn(`Invalid Marketplace manifest from ${user}/${repo}`, parsed.error);
    return [];
  });

  if (!loadedFromCache) cacheInSessionStorage(key, JSON.stringify(parsedManifests));
  return parsedManifests;
}

// TODO: can we add a return type here?
/**
 * Fetch extensions from a repo and format data for generating cards
 * @param contents_url The repo's GitHub API contents_url (e.g. "https://api.github.com/repos/theRealPadster/spicetify-hide-podcasts/contents/{+path}")
 * @param branch The repo's default branch (e.g. main or master)
 * @param stars The number of stars the repo has
 * @param hideInstalled Whether to hide installed items or not (defaults to `false`)
 * @returns Extension info for card (or null)
 */
export async function fetchExtensionManifest(contents_url: string, branch: string, stars: number, hideInstalled = false) {
  try {
    // TODO: use the original search full_name ("theRealPadster/spicetify-hide-podcasts") or something to get the url better?
    const regex_result = contents_url.match(/https:\/\/api\.github\.com\/repos\/(?<user>.+)\/(?<repo>.+)\/contents/);
    // TODO: err handling?
    if (!regex_result?.groups) return null;
    const { user, repo } = regex_result.groups;

    const manifests = await getRepoManifest(user, repo, branch);

    // Manifest is initially parsed
    const parsedManifests: CardItem[] = manifests.reduce((accum, manifest) => {
      // Check if manifest object is designated for Extensions
      if (manifest?.name && manifest.description && manifest.main) {
        const selectedBranch = manifest.branch || branch;
        const item = {
          manifest,
          title: manifest.name,
          subtitle: manifest.description,
          authors: processAuthors(manifest.authors, user),
          user,
          repo,
          branch: selectedBranch,

          imageURL: manifest.preview?.startsWith("http")
            ? manifest.preview
            : `https://raw.githubusercontent.com/${user}/${repo}/${selectedBranch}/${manifest.preview}`,
          extensionURL: manifest.main.startsWith("http")
            ? manifest.main
            : `https://raw.githubusercontent.com/${user}/${repo}/${selectedBranch}/${manifest.main}`,
          readmeURL: manifest.readme?.startsWith("http")
            ? manifest.readme
            : `https://raw.githubusercontent.com/${user}/${repo}/${selectedBranch}/${manifest.readme}`,
          stars,
          tags: manifest.tags
        };
        // Add to list unless we're hiding installed items and it's installed
        if (!(hideInstalled && marketplaceStorage.getItem(`marketplace:installed:${user}/${repo}/${manifest.main}`))) {
          accum.push(item);
        }
      }

      // else {
      //     console.error("Invalid manifest:", manifest);
      // }

      return accum;
    }, []);

    return parsedManifests;
  } catch {
    return null;
  }
}

// TODO: can we add a return type here?
/**
 * Fetch themes from a repo and format data for generating cards
 * @param contents_url The repo's GitHub API contents_url (e.g. "https://api.github.com/repos/theRealPadster/spicetify-hide-podcasts/contents/{+path}")
 * @param branch The repo's default branch (e.g. main or master)
 * @param stars The number of stars the repo has
 * @returns Extension info for card (or null)
 */
export async function fetchThemeManifest(contents_url: string, branch: string, stars: number) {
  try {
    const regex_result = contents_url.match(/https:\/\/api\.github\.com\/repos\/(?<user>.+)\/(?<repo>.+)\/contents/);
    // TODO: err handling?
    if (!regex_result?.groups) return null;
    const { user, repo } = regex_result.groups;

    const manifests = await getRepoManifest(user, repo, branch);

    // Manifest is initially parsed
    // const parsedManifests: ThemeCardItem[] = manifests.reduce((accum, manifest) => {
    const parsedManifests: CardItem[] = manifests.reduce((accum, manifest) => {
      // Check if manifest object is designated for a Theme
      if (manifest?.name && manifest?.usercss && manifest?.description) {
        const selectedBranch = manifest.branch || branch;
        const item = {
          manifest,
          title: manifest.name,
          subtitle: manifest.description,
          authors: processAuthors(manifest.authors, user),
          user,
          repo,
          branch: selectedBranch,
          imageURL: manifest.preview?.startsWith("http")
            ? manifest.preview
            : `https://raw.githubusercontent.com/${user}/${repo}/${selectedBranch}/${manifest.preview}`,
          readmeURL: manifest.readme?.startsWith("http")
            ? manifest.readme
            : `https://raw.githubusercontent.com/${user}/${repo}/${selectedBranch}/${manifest.readme}`,
          stars,
          tags: manifest.tags,
          // theme stuff
          cssURL: manifest.usercss.startsWith("http")
            ? manifest.usercss
            : `https://raw.githubusercontent.com/${user}/${repo}/${selectedBranch}/${manifest.usercss}`,
          // TODO: clean up indentation etc
          schemesURL: manifest.schemes
            ? manifest.schemes.startsWith("http")
              ? manifest.schemes
              : `https://raw.githubusercontent.com/${user}/${repo}/${selectedBranch}/${manifest.schemes}`
            : null,
          include: manifest.include
        };
        // If manifest is valid, add it to the list

        accum.push(item);
      }

      return accum;
    }, []);
    return parsedManifests;
  } catch {
    return null;
  }
}

/**
 * Fetch custom apps from a repo and format data for generating cards
 * @param contents_url The repo's GitHub API contents_url (e.g. "https://api.github.com/repos/theRealPadster/spicetify-hide-podcasts/contents/{+path}")
 * @param branch The repo's default branch (e.g. main or master)
 * @param stars The number of stars the repo has
 * @returns Extension info for card (or null)
 */
export async function fetchAppManifest(contents_url: string, branch: string, stars: number) {
  try {
    // TODO: use the original search full_name ("theRealPadster/spicetify-hide-podcasts") or something to get the url better?
    const regex_result = contents_url.match(/https:\/\/api\.github\.com\/repos\/(?<user>.+)\/(?<repo>.+)\/contents/);
    // TODO: err handling?
    if (!regex_result?.groups) return null;
    const { user, repo } = regex_result.groups;

    const manifests = await getRepoManifest(user, repo, branch);

    // Manifest is initially parsed
    const parsedManifests: CardItem[] = manifests.reduce((accum, manifest) => {
      // Check if manifest object is designated for a Custom App
      if (manifest?.name && manifest.description && !manifest.main && !manifest.usercss) {
        const selectedBranch = manifest.branch || branch;
        // TODO: tweak saved items
        const item = {
          manifest,
          title: manifest.name,
          subtitle: manifest.description,
          authors: processAuthors(manifest.authors, user),
          user,
          repo,
          branch: selectedBranch,

          imageURL: manifest.preview?.startsWith("http")
            ? manifest.preview
            : `https://raw.githubusercontent.com/${user}/${repo}/${selectedBranch}/${manifest.preview}`,
          // Custom Apps don't have an entry point; they're just listed so they can link out from the card
          // extensionURL: manifest.main.startsWith("http")
          //   ? manifest.main
          //   : `https://raw.githubusercontent.com/${user}/${repo}/${selectedBranch}/${manifest.main}`,
          readmeURL: manifest.readme?.startsWith("http")
            ? manifest.readme
            : `https://raw.githubusercontent.com/${user}/${repo}/${selectedBranch}/${manifest.readme}`,
          stars,
          tags: manifest.tags
        };

        // If manifest is valid, add it to the list

        accum.push(item);

        // else {
        //     console.error("Invalid manifest:", manifest);
        // }
      }
      return accum;
    }, []);

    return parsedManifests;
  } catch {
    return null;
  }
}

/**
 * It fetches the blacklist.json file from the GitHub repository and returns the array of blocked repos.
 * @returns String array of blacklisted repos
 */
export const getBlacklist = async () => {
  const json = await fetch(BLACKLIST_URL)
    .then((res) => res.json())
    .catch(() => ({}));
  return json.repos as string[] | undefined;
};

/**
 * It fetches the snippets.json file from the Github repository and returns it as an array of snippets.
 * @returns Array of snippets
 */
export const fetchCssSnippets = async (hideInstalled = false) => {
  const snippetsJSON = (await fetch(SNIPPETS_URL)
    .then((res) => res.json())
    .catch(() => [])) as Snippet[];
  if (!snippetsJSON.length) return [];

  const snippets = snippetsJSON.reduce<Snippet[]>((accum, snippet) => {
    const snip = { ...snippet } as Snippet;

    // Because the card component looks for an imageURL prop
    if (snip.preview) {
      snip.imageURL = snip.preview.startsWith("http")
        ? snip.preview
        : `https://raw.githubusercontent.com/spicetify/spicetify-marketplace/main/${snip.preview}`;
      snip.preview = undefined;
    }

    // Hide installed snippets if option is set and it's installed
    if (!(hideInstalled && marketplaceStorage.getItem(`marketplace:installed:snippet:${snip.title.replaceAll(" ", "-")}`))) {
      accum.push(snip);
    }

    return accum;
  }, []);

  return snippets;
};
