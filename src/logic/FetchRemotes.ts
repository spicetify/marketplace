import { Snippet } from '../types/marketplace-types';
import { CardItem } from '../types/marketplace-types';
import { processAuthors, addToSessionStorage } from './Utils';
import { ITEMS_PER_REQUEST } from '../constants';

// TODO: add sort type, order, etc?
// https://docs.github.com/en/github/searching-for-information-on-github/searching-on-github/searching-for-repositories#search-by-topic
// https://docs.github.com/en/rest/reference/search#search-repositories
/**
 * Query GitHub for all repos with the "spicetify-extensions" topic
 * @param {number} page The query page number
 * @returns Array of search results (filtered through the blacklist)
 */
export async function getExtensionRepos(page = 1, BLACKLIST:string[] = []) {
  // www is needed or it will block with "cross-origin" error.
  let url = `https://api.github.com/search/repositories?q=${encodeURIComponent("topic:spicetify-extensions")}&per_page=${ITEMS_PER_REQUEST}`;

  // We can test multiple pages with this URL (58 results), as well as broken iamges etc.
  // let url = `https://api.github.com/search/repositories?q=${encodeURIComponent("topic:spicetify")}`;
  if (page) url += `&page=${page}`;
  // Sorting params (not implemented for Marketplace yet)
  // if (sortConfig.by.match(/top|controversial/) && sortConfig.time) {
  //     url += `&t=${sortConfig.time}`
  const allRepos = await fetch(url).then(res => res.json()).catch(() => []);
  if (!allRepos.items) {
      Spicetify.showNotification("Too Many Requests, Cool Down.");
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
/**
* Get the manifest object for a repo
* @param {string} user Owner username
* @param {string} repo Repo name
* @param {string} branch Default branch name (e.g. main or master)
* @returns The manifest object
*/
async function getRepoManifest(user, repo, branch) {
  const sessionStorageItem = window.sessionStorage.getItem(`${user}-${repo}`);
  const failedSessionStorageItems = window.sessionStorage.getItem("noManifests");
  if (sessionStorageItem) {
    return JSON.parse(sessionStorageItem);
  }
  const url = `https://raw.githubusercontent.com/${user}/${repo}/${branch}/manifest.json`;
  if (failedSessionStorageItems?.includes(url)) {
    return null;
  }
  const manifest = await fetch(url).then(res => res.json()).catch(() => addToSessionStorage([url], "noManifests"));
  if (manifest) {
    window.sessionStorage.setItem(`${user}-${repo}`, JSON.stringify(manifest));
  }
  return manifest;
}

// TODO: can we add a return type here?
/**
* Fetch extensions from a repo and format data for generating cards
* @param {string} contents_url The repo's GitHub API contents_url (e.g. "https://api.github.com/repos/theRealPadster/spicetify-hide-podcasts/contents/{+path}")
* @param {string} branch The repo's default branch (e.g. main or master)
* @param {number} stars The number of stars the repo has
* @returns Extension info for card (or null)
*/
export async function fetchExtensionManifest(contents_url, branch, stars, hideInstalled = false) {
  try {
      // TODO: use the original search full_name ("theRealPadster/spicetify-hide-podcasts") or something to get the url better?
      let manifests;
      const regex_result = contents_url.match(/https:\/\/api\.github\.com\/repos\/(?<user>.+)\/(?<repo>.+)\/contents/);
      // TODO: err handling?
      if (!regex_result || !regex_result.groups) return null;
      const { user, repo } = regex_result.groups;

      manifests = await getRepoManifest(user, repo, branch);

      // If the manifest returned is not an array, initialize it as one
      if (!Array.isArray(manifests)) manifests = [manifests];

      // Manifest is initially parsed
      const parsedManifests: CardItem[] = manifests.reduce((accum, manifest) => {
          const selectedBranch = manifest.branch || branch;
          const item = {
              manifest,
              title: manifest.name,
              subtitle: manifest.description,
              authors: processAuthors(manifest.authors, user),
              user,
              repo,
              branch: selectedBranch,

              imageURL: manifest.preview && manifest.preview.startsWith("http")
                  ? manifest.preview
                  : `https://raw.githubusercontent.com/${user}/${repo}/${selectedBranch}/${manifest.preview}`,
              extensionURL: manifest.main.startsWith("http")
                  ? manifest.main
                  : `https://raw.githubusercontent.com/${user}/${repo}/${selectedBranch}/${manifest.main}`,
              readmeURL: manifest.readme && manifest.readme.startsWith("http")
                  ? manifest.readme
                  : `https://raw.githubusercontent.com/${user}/${repo}/${selectedBranch}/${manifest.readme}`,
              stars,
              tags: manifest.tags,
          };

          // If manifest is valid, add it to the list
          if (manifest && manifest.name && manifest.description && manifest.main
          ) {
              // Add to list unless we're hiding installed items and it's installed
              if (!(hideInstalled
                  && localStorage.getItem("marketplace:installed:" + `${user}/${repo}/${manifest.main}`))
              ) {
                  accum.push(item);
              }
          }
          // else {
          //     console.error("Invalid manifest:", manifest);
          // }

          return accum;
      }, []);

      return parsedManifests;
  }
  catch (err) {
      // console.warn(contents_url, err);
      return null;
  }
}

// TODO: can we add a return type here?
/**
* Fetch themes from a repo and format data for generating cards
* @param {string} contents_url The repo's GitHub API contents_url (e.g. "https://api.github.com/repos/theRealPadster/spicetify-hide-podcasts/contents/{+path}")
* @param {string} branch The repo's default branch (e.g. main or master)
* @param {number} stars The number of stars the repo has
* @returns Extension info for card (or null)
*/
export async function fetchThemeManifest(contents_url, branch, stars) {
  try {
      let manifests;
      const regex_result = contents_url.match(/https:\/\/api\.github\.com\/repos\/(?<user>.+)\/(?<repo>.+)\/contents/);
      // TODO: err handling?
      if (!regex_result || !regex_result.groups) return null;
      let { user, repo } = regex_result.groups;

      manifests = await getRepoManifest(user, repo, branch);

      // If the manifest returned is not an array, initialize it as one
      if (!Array.isArray(manifests)) manifests = [manifests];

      // Manifest is initially parsed
      // const parsedManifests: ThemeCardItem[] = manifests.reduce((accum, manifest) => {
      const parsedManifests: CardItem[] = manifests.reduce((accum, manifest) => {
          const selectedBranch = manifest.branch || branch;
          const item = {
              manifest,
              title: manifest.name,
              subtitle: manifest.description,
              authors: processAuthors(manifest.authors, user),
              user,
              repo,
              branch: selectedBranch,
              imageURL: manifest.preview && manifest.preview.startsWith("http")
                  ? manifest.preview
                  : `https://raw.githubusercontent.com/${user}/${repo}/${selectedBranch}/${manifest.preview}`,
              readmeURL: manifest.readme && manifest.readme.startsWith("http")
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
                  ? (
                      manifest.schemes.startsWith("http") ? manifest.schemes : `https://raw.githubusercontent.com/${user}/${repo}/${selectedBranch}/${manifest.schemes}`
                  )
                  : null,
              include: manifest.include,
          };
          // If manifest is valid, add it to the list
          if (manifest && manifest.name && manifest.usercss && manifest.description) {
              accum.push(item);
          }
          return accum;
      }, []);
      return parsedManifests;
  }
  catch (err) {
      // console.warn(contents_url, err);
      return null;
  }
}

/**
* Query the GitHub API for a page of theme repos (having "spicetify-themes" topic)
* @param {number} page The page to get (defaults to 1)
* @returns Array of GitHub API results, filtered through the blacklist
*/
export async function getThemeRepos(page = 1, BLACKLIST:string[] = []) {
  let url = `https://api.github.com/search/repositories?q=${encodeURIComponent("topic:spicetify-themes")}&per_page=${ITEMS_PER_REQUEST}`;

  // We can test multiple pages with this URL (58 results), as well as broken iamges etc.
  // let url = `https://api.github.com/search/repositories?q=${encodeURIComponent("topic:spicetify")}`;
  if (page) url += `&page=${page}`;
  // Sorting params (not implemented for Marketplace yet)
  // if (sortConfig.by.match(/top|controversial/) && sortConfig.time) {
  //     url += `&t=${sortConfig.time}`
  const allThemes = await fetch(url).then(res => res.json()).catch(() => []);
  if (!allThemes.items) {
      Spicetify.showNotification("Too Many Requests, Cool Down.");
  }
  const filteredResults = {
      ...allThemes,
      // Include count of all items on the page, since we're filtering the blacklist below,
      // which can mess up the paging logic
      page_count: allThemes.items.length,
      items: allThemes.items.filter(item => !BLACKLIST.includes(item.html_url)),
  };

  return filteredResults;
}

/**
* It fetches the blacklist.json file from the GitHub repository and returns the array of blocked repos.
* @returns {Promise<string[]>} String array of blacklisted repos
*/
export const getBlacklist = async () => {
  const url = "https://raw.githubusercontent.com/spicetify/spicetify-marketplace/main/blacklist.json";
  const jsonReturned = await fetch(url).then(res => res.json()).catch(() => { });
  return jsonReturned.repos;
};

/**
* It fetches the snippets.json file from the Github repository and returns it as a JSON object.
* @returns { Promise<Snippet[]> } Array of snippets
*/
export const fetchCssSnippets = async () => {
  const url = "https://raw.githubusercontent.com/spicetify/spicetify-marketplace/main/snippets.json";
  const json = await fetch(url).then(res => res.json()).catch(() => { });
  return json as Snippet[];
};
