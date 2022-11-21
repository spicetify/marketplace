import { CardItem, Manifest, RepoType, Snippet } from "../types/marketplace-types";
import { processAuthors } from "./Utils";
import { BLACKLIST_URL, EXTENSIONS_URL, THEMES_URL, APPS_URL } from "../constants";
import snippetsJSON from "../../../../resources/snippets";

// TODO: Remove these once there are repos for them
import appsManifest from "../../../../resources/manifests/apps";
import extensionsManifest from "../../../../resources/manifests/extensions";

// TODO: add sort type, order, etc?
// https://docs.github.com/en/github/searching-for-information-on-github/searching-on-github/searching-for-repositories#search-by-topic
// https://docs.github.com/en/rest/reference/search#search-repositories

/**
 * Query GitHub for all repos with the requested topic
 * @param tag The tag ("topic") to search for
 * @param page The query page number
 * @returns Array of search results (filtered through the blacklist)
 */
export async function getTaggedRepos(tag: RepoTopic, page = 1, BLACKLIST:string[] = [], query?: string) {
  // www is needed or it will block with "cross-origin" error.
  let url = query
    ? `https://api.github.com/search/repositories?q=${encodeURIComponent(`${query}+topic:${tag}`)}&per_page=${ITEMS_PER_REQUEST}`
    : `https://api.github.com/search/repositories?q=${encodeURIComponent(`topic:${tag}`)}&per_page=${ITEMS_PER_REQUEST}`;

  // We can test multiple pages with this URL (58 results), as well as broken iamges etc.
  // let url = `https://api.github.com/search/repositories?q=${encodeURIComponent("topic:spicetify")}`;
  if (page) url += `&page=${page}`;
  // Sorting params (not implemented for Marketplace yet)
  // if (sortConfig.by.match(/top|controversial/) && sortConfig.time) {
  //     url += `&t=${sortConfig.time}`
  const allRepos = await fetch(url).then(res => res.json()).catch(() => []);
  if (!allRepos.items) {
    Spicetify.showNotification("Too Many Requests, Cool Down.", true);
    return;
  }
  const filteredResults = {
    ...allRepos,
    // Include count of all items on the page, since we're filtering the blacklist below,
    // which can mess up the paging logic
    page_count: allRepos.items.length,
    items: allRepos.items.filter(item => !BLACKLIST.includes(item.html_url)),
  };

  return filteredResults;
}

// TODO: add try/catch here?
// TODO: can we add a return type here?
// TODO: Update these docs
/**
* Fetch extensions from a repo and format data for generating cards
* @param contents_url The repo's GitHub API contents_url (e.g. "https://api.github.com/repos/theRealPadster/spicetify-hide-podcasts/contents/{+path}")
* @param branch The repo's default branch (e.g. main or master)
* @param stars The number of stars the repo has
* @returns Extension info for card (or null)
*/
// The optional params are only used when using github topics
export function buildExtensionCardData(
  manifest: Manifest,
  user?: string,
  repo?: string,
  branch?: string,
  stars?: number,
) {
  try {
    // TODO: figure this out...
    if (!user) user = "spicetify";
    if (!repo) repo = "spicetify-themes";
    if (!branch) branch = "generated-manifest";

    // Manifest is initially parsed
    const parsedManifest: CardItem = {
      manifest,
      title: manifest.name,
      subtitle: manifest.description,
      authors: processAuthors(manifest.authors, user === "spicetify" ? "user..." : user), // TODO: we need a fallback...
      user,
      repo,
      branch,
      imageURL: manifest.preview && manifest.preview.startsWith("http")
        ? manifest.preview
        : `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${manifest.preview}`,
      extensionURL: manifest.main.startsWith("http")
        ? manifest.main
        : `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${manifest.main}`,
      readmeURL: manifest.readme && manifest.readme.startsWith("http")
        ? manifest.readme
        : `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${manifest.readme}`,
      stars: stars ?? 0, // TODO: get stars working
      tags: manifest.tags || [],
      lastUpdated: "",
    };

    return parsedManifest;
  }
  catch (err) {
    // console.warn(contents_url, err);
    return null;
  }
}

// TODO: can we add a return type here?
// TODO: Update these docs
/**
* Fetch themes from a repo and format data for generating cards
* @param contents_url The repo's GitHub API contents_url (e.g. "https://api.github.com/repos/theRealPadster/spicetify-hide-podcasts/contents/{+path}")
* @param branch The repo's default branch (e.g. main or master)
* @param stars The number of stars the repo has
* @returns Extension info for card (or null)
*/
// The optional params are only used when using github topics
export function buildThemeCardData(
  manifest: Manifest,
  user?: string,
  repo?: string,
  branch?: string,
  stars?: number,
) {
  try {
    // TODO: figure this out...
    if (!user) user = "spicetify";
    if (!repo) repo = "spicetify-themes";
    if (!branch) branch = "generated-manifest";

    // Manifest is initially parsed
    const parsedManifest: CardItem = {
      manifest,
      title: manifest.name,
      subtitle: manifest.description,
      authors: processAuthors(manifest.authors, user === "spicetify" ? "user..." : user), // TODO: we need a fallback...
      // TODO: do we need these?
      user,
      repo,
      branch,
      imageURL: manifest.preview && manifest.preview.startsWith("http")
        ? manifest.preview
        : `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${manifest.preview}`,
      readmeURL: manifest.readme && manifest.readme.startsWith("http")
        ? manifest.readme
        : `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${manifest.readme}`,
      stars: stars ?? 0, // TODO: get stars working
      tags: manifest.tags || [],
      // theme stuff
      cssURL: manifest.usercss?.startsWith("http")
        ? manifest.usercss
        : `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${manifest.usercss}`,
      // TODO: clean up indentation etc
      schemesURL: manifest.schemes
        ? (
          manifest.schemes.startsWith("http") ? manifest.schemes : `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${manifest.schemes}`
        )
        : undefined,
      include: manifest.include,
      lastUpdated: "",
    };

    return parsedManifest;
  }
  catch (err) {
    // console.warn(contents_url, err);
    return null;
  }
}

// TODO: Update these docs
/**
* Fetch custom apps from a repo and format data for generating cards
* @param contents_url The repo's GitHub API contents_url (e.g. "https://api.github.com/repos/theRealPadster/spicetify-hide-podcasts/contents/{+path}")
* @param branch The repo's default branch (e.g. main or master)
* @param stars The number of stars the repo has
* @returns Extension info for card (or null)
*/
// The optional params are only used when using github topics
export function buildAppCardData(
  manifest: Manifest,
  user?: string,
  repo?: string,
  branch?: string,
  stars?: number,
) {
  try {
    // TODO: figure this out...
    // TODO: Update these once we get a repo for apps
    if (!user) user = "spicetify";
    if (!repo) repo = "spicetify-themes";
    if (!branch) branch = "generated-manifest";

    // Manifest is initially parsed
    const parsedManifest: CardItem = {
      manifest,
      title: manifest.name,
      subtitle: manifest.description,
      authors: processAuthors(manifest.authors, user === "spicetify" ? "user..." : user), // TODO: we need a fallback...
      user,
      repo,
      branch,
      imageURL: manifest.preview && manifest.preview.startsWith("http")
        ? manifest.preview
        : `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${manifest.preview}`,
      // Custom Apps don't have an entry point; they're just listed so they can link out from the card
      // extensionURL: manifest.main.startsWith("http")
      //   ? manifest.main
      //   : `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${manifest.main}`,
      readmeURL: manifest.readme && manifest.readme.startsWith("http")
        ? manifest.readme
        : `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${manifest.readme}`,
      stars: stars ?? 0, // TODO: get stars working
      tags: manifest.tags || [],
      lastUpdated: "",
    };

    return parsedManifest;
  }
  catch (err) {
    // console.warn(contents_url, err);
    return null;
  }
}

export const fetchMonoManifest = async (type: RepoType) => {
  /* TODO: swap this in place when we have URLs for everything
  const urls = {
    extension: EXTENSIONS_URL,
    theme: THEMES_URL,
    app: APPS_URL,
  };

  const manifest = await fetch(urls[type]).then(res => res.json()).catch((err) => {console.error(err); return [];});
  return manifest;
  */

  switch (type) {
  case "theme":
    return await fetch(THEMES_URL).then((res) => res.json()).catch((err) => {console.error(err); return [];});
  case "extension":
    return extensionsManifest as Manifest[];
  case "app":
    return appsManifest as Manifest[];
  }
};

/**
* It fetches the blacklist.json file from the GitHub repository and returns the array of blocked repos.
* @returns String array of blacklisted repos
*/
export const fetchBlacklist = async () => {
  const json = await fetch(BLACKLIST_URL).then((res) => res.json()).catch(() => ({}));
  return json.repos as string[] | undefined;
};

/**
* It fetches the snippets.json file from the Github repository and returns it as a JSON object.
* @returns Array of snippets
*/
export const fetchCssSnippets = async () => {
  const snippets = snippetsJSON.reduce<Snippet[]>((accum, snippet) => {
    const snip = { ...snippet } as Snippet;

    // Because the card component looks for an imageURL prop
    if (snip.preview) {
      snip.imageURL = snip.preview.startsWith("http")
        ? snip.preview
        : `https://raw.githubusercontent.com/spicetify/spicetify-marketplace/main/${snip.preview}`;
      delete snip.preview;
    }

    accum.push(snip);
    return accum;
  }, []);
  return snippets;
};
