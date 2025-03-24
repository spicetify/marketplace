import { t } from "i18next";

import {
  BLACKLIST_URL,
  CACHE_EXPIRATION_MS,
  IDB_BLACKLIST_STORE,
  IDB_MANIFEST_STORE,
  IDB_REPO_LIST_STORE,
  IDB_SNIPPETS_STORE,
  ITEMS_PER_REQUEST,
  SNIPPETS_URL
} from "@constants";
import { getCachedData, setCachedData } from "@logic/IndexedDbCache";
import { processAuthors } from "@logic/Utils";
import type { CardItem, RepoTopic, Snippet } from "@type/marketplace-types";

// TODO: add sort type, order, etc?
// https://docs.github.com/en/github/searching-for-information-on-github/searching-on-github/searching-for-repositories#search-by-topic
// https://docs.github.com/en/rest/reference/search#search-repositories

/**
 * Query GitHub for all repos with the requested topic
 * @param tag The tag ("topic") to search for
 * @param page The query page number
 * @returns Array of search results (filtered through the blacklist)
 */
export async function getTaggedRepos(tag: RepoTopic, page = 1, BLACKLIST: string[] = [], showArchived = false) {
  // www is needed or it will block with "cross-origin" error.
  let url = `https://api.github.com/search/repositories?q=${encodeURIComponent(`topic:${tag}`)}&per_page=${ITEMS_PER_REQUEST}`;

  // We can test multiple pages with this URL (58 results), as well as broken iamges etc.
  // let url = `https://api.github.com/search/repositories?q=${encodeURIComponent("topic:spicetify")}`;
  if (page) url += `&page=${page}`;
  // Sorting params (not implemented for Marketplace yet)
  // if (sortConfig.by.match(/top|controversial/) && sortConfig.time) {
  //     url += `&t=${sortConfig.time}`

  const cacheKey = url;
  const cachedResult = await getCachedData(IDB_REPO_LIST_STORE, cacheKey);
  if (cachedResult?.timestamp && Date.now() - cachedResult.timestamp < CACHE_EXPIRATION_MS) {
    return cachedResult.data;
  }

  const allRepos = await fetch(url)
    .then((res) => res.json())
    .catch(() => null);

  if (!allRepos?.items) {
    Spicetify.showNotification(t("notifications.tooManyRequests"), true, 5000);
    return { items: [] };
  }

  const filteredResults = {
    ...allRepos,
    // Include count of all items on the page, since we're filtering the blacklist below,
    // which can mess up the paging logic
    page_count: allRepos.items.length,
    items: allRepos.items.filter((item) => !BLACKLIST.includes(item.html_url) && (showArchived || !item.archived))
  };

  await setCachedData(IDB_REPO_LIST_STORE, cacheKey, filteredResults);
  return filteredResults;
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
  const cacheKey = `manifest-${user}-${repo}-${branch}`;

  const cachedManifest = await getCachedData(IDB_MANIFEST_STORE, cacheKey);
  if (cachedManifest?.timestamp && Date.now() - cachedManifest.timestamp < CACHE_EXPIRATION_MS) {
    return cachedManifest.data;
  }

  const url = `https://raw.githubusercontent.com/${user}/${repo}/${branch}/manifest.json`;

  let manifest = await fetchRepoManifest(url);
  if (!manifest) return null;
  if (!Array.isArray(manifest)) manifest = [manifest];

  await setCachedData(IDB_MANIFEST_STORE, cacheKey, manifest);
  return manifest;
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
    if (!regex_result || !regex_result.groups) return null;
    const { user, repo } = regex_result.groups;

    const manifests = await getRepoManifest(user, repo, branch);
    if (!manifests) return null;

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
        if (!(hideInstalled && localStorage.getItem(`marketplace:installed:${user}/${repo}/${manifest.main}`))) {
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
    if (!regex_result || !regex_result.groups) return null;
    const { user, repo } = regex_result.groups;

    const manifests = await getRepoManifest(user, repo, branch);
    if (!manifests) return null;

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
    if (!regex_result || !regex_result.groups) return null;
    const { user, repo } = regex_result.groups;

    const manifests = await getRepoManifest(user, repo, branch);
    if (!manifests) return null;

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
  const cacheKey = "blacklist-data";

  const cachedBlacklist = await getCachedData(IDB_BLACKLIST_STORE, cacheKey);
  if (cachedBlacklist?.timestamp && Date.now() - cachedBlacklist.timestamp < CACHE_EXPIRATION_MS) {
    return cachedBlacklist.data;
  }

  const json = await fetch(BLACKLIST_URL)
    .then((res) => res.json())
    .catch((error) => {
      console.error("Error fetching blacklist:", error);
      return { repos: [] };
    });
  const blacklist = (json.repos as string[] | undefined) || [];

  await setCachedData(IDB_BLACKLIST_STORE, cacheKey, blacklist);
  return blacklist;
};

/**
 * It fetches the snippets.json file from the Github repository and returns it as an array of snippets.
 * @returns Array of snippets
 */
export const fetchCssSnippets = async (hideInstalled = false) => {
  const cacheKey = "css-snippets-data";

  const cachedSnippets = await getCachedData(IDB_SNIPPETS_STORE, cacheKey);
  if (cachedSnippets?.timestamp && Date.now() - cachedSnippets.timestamp < CACHE_EXPIRATION_MS) {
    return cachedSnippets.data;
  }

  const snippetsJSON = (await fetch(SNIPPETS_URL)
    .then((res) => res.json())
    .catch((error) => {
      console.error("Error fetching CSS snippets:", error);
      return [];
    })) as Snippet[];

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
    if (!(hideInstalled && localStorage.getItem(`marketplace:installed:snippet:${snip.title.replaceAll(" ", "-")}`))) {
      accum.push(snip);
    }

    return accum;
  }, []);

  await setCachedData(IDB_SNIPPETS_STORE, cacheKey, snippets);
  return snippets;
};
