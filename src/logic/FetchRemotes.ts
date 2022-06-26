import { CardItem, Manifest, RepoType, Snippet } from "../types/marketplace-types";
import { processAuthors } from "./Utils";
import { BLACKLIST_URL, THEMES_URL } from "../constants";
import snippetsJSON from "../../resources/snippets";
import appsManifest from "../../resources/manifests/apps";

// TODO: add sort type, order, etc?
// https://docs.github.com/en/github/searching-for-information-on-github/searching-on-github/searching-for-repositories#search-by-topic
// https://docs.github.com/en/rest/reference/search#search-repositories

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
export function buildThemeCardData(manifest: Manifest, user?: string, repo?: string, branch?: string, stars?: number) {
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
export async function buildExtensionCardData(
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

// TODO: Update these docs
/**
* Fetch custom apps from a repo and format data for generating cards
* @param contents_url The repo's GitHub API contents_url (e.g. "https://api.github.com/repos/theRealPadster/spicetify-hide-podcasts/contents/{+path}")
* @param branch The repo's default branch (e.g. main or master)
* @param stars The number of stars the repo has
* @returns Extension info for card (or null)
*/
// The optional params are only used when using github topics
export function buildAppCardData(manifest: Manifest, user?: string, repo?: string, branch?: string, stars?: number) {
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
  // TODO: clean this up to use a lookup map or something...
  if (type === "theme") {
    const manifest = await fetch(THEMES_URL).then(res => res.json()).catch(() => null);
    return manifest;
  } else if (type === "app") {
    // const manifest = await fetch(APPS_URL).then(res => res.json()).catch(() => null);
    const manifest = appsManifest;
    return manifest;
  }
};

/**
* It fetches the blacklist.json file from the GitHub repository and returns the array of blocked repos.
* @returns String array of blacklisted repos
*/
export const fetchBlacklist = async () => {
  const json = await fetch(BLACKLIST_URL).then(res => res.json()).catch(() => ({}));
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
