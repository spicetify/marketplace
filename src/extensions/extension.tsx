// NAME: Spicetify Marketplace Extension
// AUTHOR: theRealPadster, CharlieS1103
// DESCRIPTION: Companion extension for Spicetify Marketplace

import { t } from "i18next";

import { ITEMS_PER_REQUEST, LOCALSTORAGE_KEYS, MARKETPLACE_VERSION } from "@constants";
import { fetchAppManifest, fetchExtensionManifest, fetchThemeManifest, getBlacklist } from "@logic/FetchRemotes";
import {
  addExtensionToSpicetifyConfig,
  exportMarketplace,
  getAvailableTLD,
  getLocalStorageDataFromKey,
  getParamsFromGithubRaw,
  initAlbumArtBasedColor,
  initColorShiftLoop,
  initializeSnippets,
  injectColourScheme,
  // TODO: there's a slightly different copy of this function in Card.ts?
  injectUserCSS,
  isGithubRawUrl,
  parseCSS,
  resetMarketplace
} from "@logic/Utils";
import type { RepoType } from "@type/marketplace-types";

(async function init() {
  if (!Spicetify.LocalStorage || !Spicetify.showNotification) {
    setTimeout(init, 100);
    return;
  }

  // https://github.com/satya164/react-simple-code-editor/issues/86
  const reactSimpleCodeEditorFix = document.createElement("script");
  reactSimpleCodeEditorFix.innerHTML = "const global = globalThis;";
  document.body.appendChild(reactSimpleCodeEditorFix);

  // Show message on start.
  console.log(`Initializing Spicetify Marketplace v${MARKETPLACE_VERSION}`);

  // Expose useful methods in global context
  window.Marketplace = {
    // Should allow you to reset Marketplace from the dev console if it's b0rked
    reset: resetMarketplace,
    // Export all marketplace localstorage keys
    export: exportMarketplace,
    version: MARKETPLACE_VERSION
  };

  const tld = await getAvailableTLD();

  const initializeExtension = (extensionKey: string) => {
    const extensionManifest = getLocalStorageDataFromKey(extensionKey);
    // Abort if no manifest found or no extension URL (i.e. a theme)
    if (!extensionManifest || !extensionManifest.extensionURL) return;

    console.debug("Initializing extension: ", extensionManifest);

    const script = document.createElement("script");
    script.defer = true;
    script.src = extensionManifest.extensionURL;

    // If it's a github raw script, use jsdelivr
    if (isGithubRawUrl(script.src)) {
      const { user, repo, branch, filePath } = getParamsFromGithubRaw(extensionManifest.extensionURL);
      if (!user || !repo || !branch || !filePath) return;
      script.src = `https://cdn.jsdelivr.${tld}/gh/${user}/${repo}@${branch}/${filePath}`;
      if (filePath.endsWith(".mjs")) script.type = "module";
    }

    script.src = `${script.src}?time=${Date.now()}`;

    document.body.appendChild(script);

    // Add to Spicetify.Config
    addExtensionToSpicetifyConfig(extensionManifest.manifest?.main);
  };

  const initializeTheme = async (themeKey: string) => {
    const themeManifest = getLocalStorageDataFromKey(themeKey);
    // Abort if no manifest found
    if (!themeManifest) {
      console.debug("No theme manifest found");
      return;
    }

    console.debug("Initializing theme: ", themeManifest);

    // Inject colour scheme if found
    if (themeManifest.schemes) {
      const activeScheme = themeManifest.schemes[themeManifest.activeScheme];
      injectColourScheme(activeScheme);

      // Add to Spicetify.Config
      // @ts-expect-error: `color_scheme` is read-only type in types
      Spicetify.Config.color_scheme = themeManifest.activeScheme;
      if (localStorage.getItem(LOCALSTORAGE_KEYS.albumArtBasedColor) === "true") {
        initAlbumArtBasedColor(activeScheme);
      } else if (localStorage.getItem(LOCALSTORAGE_KEYS.colorShift) === "true") {
        initColorShiftLoop(themeManifest.schemes);
      }
    } else {
      console.warn("No schemes found for theme");
    }

    // Remove default css
    // TODO: what about if we remove the theme? Should we re-add the user.css/colors.css?
    // const existingUserThemeCSS = document.querySelector("link[href='user.css']");
    // if (existingUserThemeCSS) existingUserThemeCSS.remove();

    // Remove any existing marketplace theme
    const existingMarketplaceThemeCSS = document.querySelector("link.marketplaceCSS");
    if (existingMarketplaceThemeCSS) existingMarketplaceThemeCSS.remove();

    // Add theme css
    const userCSS = await parseCSS(themeManifest, tld);
    injectUserCSS(userCSS);

    // Add to Spicetify.Config
    // @ts-expect-error: `current_theme` is read-only type in types
    Spicetify.Config.current_theme = themeManifest.manifest?.name;

    // Inject any included js
    if (themeManifest.include?.length) {
      // console.log("Including js", installedThemeData.include);

      for (const script of themeManifest.include) {
        const newScript = document.createElement("script");
        let src = script;

        // If it's a github raw script, use jsdelivr
        if (isGithubRawUrl(script)) {
          const { user, repo, branch, filePath } = getParamsFromGithubRaw(script);
          if (!user || !repo || !branch || !filePath) return;
          src = `https://cdn.jsdelivr.${tld}/gh/${user}/${repo}@${branch}/${filePath}`;
          if (filePath.endsWith(".mjs")) newScript.type = "module";
        }
        // console.log({src});
        newScript.src = `${src}?time=${Date.now()}`;
        newScript.classList.add("marketplaceScript");
        document.body.appendChild(newScript);

        // Add to Spicetify.Config
        addExtensionToSpicetifyConfig(script);
      }
    }
  };

  console.log("Loaded Marketplace extension");

  const installedSnippetKeys = getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.installedSnippets, []);
  const installedSnippets = installedSnippetKeys.map((key) => getLocalStorageDataFromKey(key));
  initializeSnippets(installedSnippets);

  if (!tld) {
    if (window.navigator.onLine) {
      console.error(new Error("Unable to connect to the CDN, please check your Internet configuration."));
      Spicetify.showNotification(t("notifications.noCdnConnection"), true, 5000);
    } else {
      // Reload Marketplace extension in case the user couldn't connect to the CDN because they were offline
      window.addEventListener("online", init, { once: true });
    }

    return;
  }

  window.sessionStorage.setItem("marketplace-request-tld", tld);

  const installedExtensions = getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.installedExtensions, []);
  for (const extensionKey of installedExtensions) {
    initializeExtension(extensionKey);
  }

  const { current_theme: localTheme } = Spicetify.Config;
  localStorage.setItem(LOCALSTORAGE_KEYS.localTheme, localTheme);
  const installedTheme = localStorage.getItem(LOCALSTORAGE_KEYS.themeInstalled);
  if (installedTheme) {
    if (localTheme.toLocaleLowerCase() !== "marketplace") {
      Spicetify.showNotification(t("notifications.wrongLocalTheme"), true, 5000);
      return;
    }
    initializeTheme(installedTheme);
  }
})();

/**
 * TODO
 * @param type The repo type
 * @param pageNum The page number
 * @returns TODO
 */
async function queryRepos(type: RepoType, pageNum = 1) {
  const BLACKLIST = window.sessionStorage.getItem("marketplace:blacklist");

  let url = `https://api.github.com/search/repositories?per_page=${ITEMS_PER_REQUEST}&q=${encodeURIComponent(`topic:spicetify-${type}s`)}`;
  if (pageNum) url += `&page=${pageNum}`;

  const allRepos =
    JSON.parse(window.sessionStorage.getItem(`spicetify-${type}s-page-${pageNum}`) || "null") ||
    (await fetch(url)
      .then((res) => res.json())
      .catch(() => null));

  if (!allRepos?.items) {
    Spicetify.showNotification(t("notifications.tooManyRequests"), true, 5000);
    return { items: [] };
  }

  window.sessionStorage.setItem(`spicetify-${type}s-page-${pageNum}`, JSON.stringify(allRepos));

  const filteredResults = {
    ...allRepos,
    page_count: allRepos.items.length,
    items: allRepos.items.filter((item) => !BLACKLIST?.includes(item.html_url))
  };

  return filteredResults;
}

/**
 * TODO
 * @param type The repo type
 * @param pageNum The page number
 * @returns TODO
 */
async function loadPageRecursive(type: RepoType, pageNum: number) {
  const pageOfRepos = await queryRepos(type, pageNum);
  appendInformationToLocalStorage(pageOfRepos, type);

  // Sets the amount of items that have thus been fetched
  const soFarResults = ITEMS_PER_REQUEST * pageNum + pageOfRepos.page_count;
  console.debug({ pageOfRepos });
  const remainingResults = pageOfRepos.total_count - soFarResults;

  // If still have more results, recursively fetch next page
  console.debug(`Parsed ${soFarResults}/${pageOfRepos.total_count} ${type}s`);
  if (remainingResults > 0) return await loadPageRecursive(type, pageNum + 1);
  console.debug(`No more ${type} results`);
}

(async function initializePreload() {
  console.debug("Preloading extensions and themes...");
  window.sessionStorage.clear();
  const BLACKLIST = await getBlacklist();
  window.sessionStorage.setItem("marketplace:blacklist", JSON.stringify(BLACKLIST));

  // TODO: does this work?
  // The recursion isn't super clean...

  // Begin by getting the themes and extensions from github
  // const [extensionReposArray, themeReposArray] = await Promise.all([
  await Promise.all([loadPageRecursive("extension", 0), loadPageRecursive("theme", 0), loadPageRecursive("app", 0)]);

  // let extensionsNextPage = 1;
  // let themesNextPage = 1;
  // do {
  //     extensionReposArray = await loadPage("extension", extensionsNextPage);
  //     appendInformationToLocalStorage(extensionReposArray, "extension");
  // } while (extensionsNextPage);

  // do {
  //     themeReposArray = await loadPage("theme", themesNextPage);
  //     appendInformationToLocalStorage(themeReposArray, "theme");
  // } while (themesNextPage);
})();

async function appendInformationToLocalStorage(array, type: RepoType) {
  // This system should make it so themes and extensions are stored concurrently
  for (const repo of array.items) {
    if (type === "theme") await fetchThemeManifest(repo.contents_url, repo.default_branch, repo.stargazers_count);
    else if (type === "extension") await fetchExtensionManifest(repo.contents_url, repo.default_branch, repo.stargazers_count);
    else if (type === "app") await fetchAppManifest(repo.contents_url, repo.default_branch, repo.stargazers_count);
  }
}
