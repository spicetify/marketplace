// @ts-check

// NAME: Spicetify Marketplace Extension
// AUTHOR: theRealPadster, CharlieS1103
// DESCRIPTION: Companion extension for Spicetify Marketplace

/// <reference path="../spicetify-cli/globals.d.ts" />

// Reset any Marketplace localStorage keys (effectively resetting it completely)
// eslint-disable-next-line no-redeclare
const resetMarketplace = () => {
    console.log("Resetting Marketplace");

    // Loop through and reset marketplace keys
    Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("marketplace:")) {
            localStorage.removeItem(key);
            console.log(`Removed ${key}`);
        }
    });

    console.log("Marketplace has been reset");
    location.reload();
};

// Expose useful methods in global context
// @ts-ignore
window.Marketplace = {
    // Should allow you to reset Marketplace from the dev console if it's b0rked
    reset: resetMarketplace,
};

// eslint-disable-next-line no-redeclare
const hexToRGB = (hex) => {
    if (hex.length === 3) {
        hex = hex.split("").map((char) => char + char).join("");
    } else if (hex.length != 6) {
        throw "Only 3- or 6-digit hex colours are allowed.";
    } else if (hex.match(/[^0-9a-f]/i)) {
        throw "Only hex colours are allowed.";
    }

    const aRgbHex = hex.match(/.{1,2}/g);
    const aRgb = [
        parseInt(aRgbHex[0], 16),
        parseInt(aRgbHex[1], 16),
        parseInt(aRgbHex[2], 16),
    ];
    return aRgb;
};

/**
 * Get user, repo, and branch from a GitHub raw URL
 * @param {string} url Github Raw URL
 * @returns { { user: string, repo: string, branch: string, filePath: string } }
 */
const getParamsFromGithubRaw = (url) => {
    // eslint-disable-next-line no-useless-escape
    const regex_result = url.match(/https:\/\/raw\.githubusercontent\.com\/(?<user>[^\/]+)\/(?<repo>[^\/]+)\/(?<branch>[^\/]+)\/(?<filePath>.+$)/);
    // e.g. https://raw.githubusercontent.com/CharlieS1103/spicetify-extensions/main/featureshuffle/featureshuffle.js

    const obj = {
        user: regex_result ? regex_result.groups.user : null,
        repo: regex_result ? regex_result.groups.repo : null,
        branch: regex_result ? regex_result.groups.branch : null,
        filePath: regex_result ? regex_result.groups.filePath : null,
    };

    return obj;
};

(async function MarketplaceExtension() {
    const { LocalStorage } = Spicetify;
    if (!(LocalStorage)) {
        // console.log('Not ready, waiting...');
        setTimeout(MarketplaceExtension, 1000);
        return;
    }

    // TODO: can we reference/require/import common files between extension and custom app?
    const LOCALSTORAGE_KEYS = {
        "installedExtensions": "marketplace:installed-extensions",
        "installedSnippets": "marketplace:installed-snippets",
        "installedThemes": "marketplace:installed-themes",
        "activeTab": "marketplace:active-tab",
        "tabs": "marketplace:tabs",
        // Theme installed store the localsorage key of the theme (e.g. marketplace:installed:NYRI4/Comfy-spicetify/user.css)
        "themeInstalled": "marketplace:theme-installed",
        "colorShift": "marketplace:colorShift",
    };

    const getLocalStorageDataFromKey = (key, fallback) => {
        return JSON.parse(localStorage.getItem(key)) ?? fallback;
    };

    const initializeExtension = (extensionKey) => {
        const extensionManifest = getLocalStorageDataFromKey(extensionKey);
        // Abort if no manifest found or no extension URL (i.e. a theme)
        if (!extensionManifest || !extensionManifest.extensionURL) return;

        console.log("Initializing extension: ", extensionManifest);

        const script = document.createElement("script");
        script.defer = true;
        script.src = extensionManifest.extensionURL;

        // If it's a github raw script, use jsdelivr
        if (script.src.indexOf("raw.githubusercontent.com") > -1) {
            const { user, repo, branch, filePath } = getParamsFromGithubRaw(extensionManifest.extensionURL);
            if (!user || !repo || !branch || !filePath) return;
            script.src = `https://cdn.jsdelivr.net/gh/${user}/${repo}@${branch}/${filePath}`;
        }

        script.src = `${script.src}?time=${Date.now()}`;

        document.body.appendChild(script);
    };

    /**
     * Loop through the snippets and add the contents of the code as a style tag in the DOM
     * @param { { title: string; description: string; code: string;}[] } snippets The snippets to initialize
     */
    // TODO: keep this in sync with the index.js file
    const initializeSnippets = (snippets) => {
        // Remove any existing marketplace snippets
        const existingSnippets = document.querySelector("style.marketplaceSnippets");
        if (existingSnippets) existingSnippets.remove();

        const style = document.createElement("style");
        const styleContent = snippets.reduce((accum, snippet) => {
            accum += `/* ${snippet.title} - ${snippet.description} */\n`;
            accum += `${snippet.code}\n`;
            return accum;
        }, "");

        style.innerHTML = styleContent;
        style.classList.add("marketplaceSnippets");
        document.head.appendChild(style);
    };

    // NOTE: Keep in sync with index.js
    const injectColourScheme = (scheme) => {
        try {
            // Remove any existing Spicetify scheme
            const existingColorsCSS = document.querySelector("link[href='colors.css']");
            if (existingColorsCSS) existingColorsCSS.remove();

            // Remove any existing marketplace scheme
            const existingMarketplaceSchemeCSS = document.querySelector("style.marketplaceCSS.marketplaceScheme");
            if (existingMarketplaceSchemeCSS) existingMarketplaceSchemeCSS.remove();

            // Add new marketplace scheme
            const schemeTag = document.createElement("style");
            schemeTag.classList.add("marketplaceCSS");
            schemeTag.classList.add("marketplaceScheme");
            // const theme = document.querySelector('#theme');
            let injectStr = ":root {";

            const themeIniKeys = Object.keys(scheme);
            themeIniKeys.forEach((key) => {
                injectStr += `--spice-${key}: #${scheme[key]};`;
                injectStr += `--spice-rgb-${key}: ${hexToRGB(scheme[key])};`;
            });
            injectStr += "}";
            schemeTag.innerHTML = injectStr;
            document.head.appendChild(schemeTag);
        } catch (error) {
            console.warn(error);
        }
    };

    /**
     * Update the user.css in the DOM
     * @param {string} userCSS The contents of the new user.css
     */
    const injectUserCSS = (userCSS) => {
        try {
            // Remove any existing Spicetify user.css
            const existingUserThemeCSS = document.querySelector("link[href='user.css']");
            if (existingUserThemeCSS) existingUserThemeCSS.remove();

            // Remove any existing marketplace scheme
            const existingMarketplaceUserCSS = document.querySelector("style.marketplaceCSS.marketplaceUserCSS");
            if (existingMarketplaceUserCSS) existingMarketplaceUserCSS.remove();

            // Add new marketplace scheme
            const userCssTag = document.createElement("style");
            userCssTag.classList.add("marketplaceCSS");
            userCssTag.classList.add("marketplaceUserCSS");
            userCssTag.innerHTML = userCSS;
            document.head.appendChild(userCssTag);
        } catch (error) {
            console.warn(error);
        }
    };

    // I guess this is okay to not have an end condition on the interval
    // because if they turn the setting on or off,
    // closing the settings modal will reload the page
    const initColorShiftLoop = (schemes) => {
        let i = 0;
        const NUM_SCHEMES = Object.keys(schemes).length;
        setInterval(() => {
            // Resets to zero when passes the last scheme
            i = i % NUM_SCHEMES;
            const style = document.createElement("style");
            style.className = "colorShift-style";
            style.innerHTML = `* {
                transition-duration: 400ms;
            }
            main-type-bass {
                transition-duration: unset !important;
            }`;

            document.body.appendChild(style);
            injectColourScheme(Object.values(schemes)[i]);
            i++;
            style.remove();
        }, 60 * 1000);
    };

    const parseCSS = async (themeManifest) => {

        const userCssUrl = themeManifest.cssURL.indexOf("raw.githubusercontent.com") > -1
        // TODO: this should probably be the URL stored in localstorage actually (i.e. put this url in localstorage)
            ? `https://cdn.jsdelivr.net/gh/${themeManifest.user}/${themeManifest.repo}@${themeManifest.branch}/${themeManifest.manifest.usercss}`
            : themeManifest.cssURL;
        // TODO: Make this more versatile
        const assetsUrl = userCssUrl.replace("/user.css", "/assets/");

        console.log("Parsing CSS: ", userCssUrl);
        let css = await fetch(`${userCssUrl}?time=${Date.now()}`).then(res => res.text());
        // console.log("Parsed CSS: ", css);

        let urls = css.matchAll(/url\(['|"](?<path>.+?)['|"]\)/gm) || [];

        for (const match of urls) {
            const url = match.groups.path;
            // console.log(url);
            // If it's a relative URL, transform it to HTTP URL
            if (!url.startsWith("http") && !url.startsWith("data")) {
                const newUrl = assetsUrl + url.replace(/\.\//g, "");
                css = css.replace(url, newUrl);
            }
        }

        // console.log("New CSS: ", css);

        return css;
    };

    const initializeTheme = async (themeKey) => {
        const themeManifest = getLocalStorageDataFromKey(themeKey);
        // Abort if no manifest found
        if (!themeManifest) {
            console.log("No theme manifest found");
            return;
        }

        console.log("Initializing theme: ", themeManifest);

        // Inject colour scheme if found
        if (themeManifest.schemes) {
            const activeScheme = themeManifest.schemes[themeManifest.activeScheme];
            injectColourScheme(activeScheme);

            if (localStorage.getItem(LOCALSTORAGE_KEYS.colorShift) === "true") {
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
        const userCSS = await parseCSS(themeManifest);
        injectUserCSS(userCSS);

        // Inject any included js
        if (themeManifest.include && themeManifest.include.length) {
            // console.log("Including js", installedThemeData.include);

            themeManifest.include.forEach((script) => {
                const newScript = document.createElement("script");
                let src = script;

                // If it's a github raw script, use jsdelivr
                if (script.indexOf("raw.githubusercontent.com") > -1) {
                    const { user, repo, branch, filePath } = getParamsFromGithubRaw(script);
                    src = `https://cdn.jsdelivr.net/gh/${user}/${repo}@${branch}/${filePath}`;
                }
                // console.log({src});
                newScript.src = `${src}?time=${Date.now()}`;
                newScript.classList.add("marketplaceScript");
                document.body.appendChild(newScript);
            });
        }
    };

    console.log("Loaded Marketplace extension");

    const installedThemeKey = LocalStorage.get(LOCALSTORAGE_KEYS.themeInstalled);
    if (installedThemeKey) initializeTheme(installedThemeKey);

    const installedSnippetKeys = getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.installedSnippets, []);
    const installedSnippets = installedSnippetKeys.map((key) => getLocalStorageDataFromKey(key));
    initializeSnippets(installedSnippets);

    const installedExtensions = getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.installedExtensions, []);
    installedExtensions.forEach((extensionKey) => initializeExtension(extensionKey));
})();

const ITEMS_PER_REQUEST = 100;

async function Blacklist() {
    const url = "https://raw.githubusercontent.com/CharlieS1103/spicetify-marketplace/main/blacklist.json";
    const jsonReturned = await fetch(url).then(res => res.json()).catch(() => {});
    return jsonReturned.repos;
}

/**
 * TODO
 * @param {"theme"|"extension"} type The repo type
 * @param {number} pageNum The page number
 * @returns TODO
 */
async function queryRepos(type, pageNum = 1) {
    const BLACKLIST = window.sessionStorage.getItem("marketplace:blacklist");

    let url = `https://api.github.com/search/repositories?per_page=${ITEMS_PER_REQUEST}`;
    if (type === "extension") url += `&q=${encodeURIComponent("topic:spicetify-extensions")}`;
    else if (type === "theme") url += `&q=${encodeURIComponent("topic:spicetify-themes")}`;
    if (pageNum) url += `&page=${pageNum}`;

    const allRepos = await fetch(url).then(res => res.json()).catch(() => []);
    if (!allRepos.items) {
        Spicetify.showNotification("Too Many Requests, Cool Down.");
    }

    const filteredResults = {
        ...allRepos,
        page_count: allRepos.items.length,
        items: allRepos.items.filter(item => !BLACKLIST.includes(item.html_url)),
    };

    return filteredResults;
}

/**
 * TODO
 * @param {"theme"|"extension"} type The repo type
 * @param {number} pageNum The page number
 * @returns TODO
 */
async function loadPageRecursive(type, pageNum) {
    const pageOfRepos = await queryRepos(type, pageNum);
    appendInformationToLocalStorage(pageOfRepos, type);

    // Sets the amount of items that have thus been fetched
    const soFarResults = ITEMS_PER_REQUEST * (pageNum - 1) + pageOfRepos.page_count;
    console.log({ pageOfRepos });
    const remainingResults = pageOfRepos.total_count - soFarResults;

    // If still have more results, recursively fetch next page
    console.log(`Parsed ${soFarResults}/${pageOfRepos.total_count} ${type}s`);
    if (remainingResults > 0) return await loadPageRecursive(type, pageNum + 1); // There are more results. currentPage + 1 is the next page to fetch.
    else console.log(`No more ${type} results`);
}

(async function initializePreload() {
    console.log("Preloading extensions and themes...");
    window.sessionStorage.clear();
    const BLACKLIST = await Blacklist();
    window.sessionStorage.setItem("marketplace:blacklist", JSON.stringify(BLACKLIST));

    // TODO: does this work?
    // The recursion isn't super clean...

    // Begin by getting the themes and extensions from github
    // const [extensionReposArray, themeReposArray] = await Promise.all([
    await Promise.all([
        loadPageRecursive("extension", 1),
        loadPageRecursive("theme", 1),
    ]);

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

async function appendInformationToLocalStorage(array, type) {
    // This system should make it so themes and extensions are stored concurrently
    for (const repo of array.items) {
        const data = (type === "theme")
            ? await fetchThemeManifest(repo.contents_url, repo.default_branch)
            : await fetchExtensionManifest(repo.contents_url, repo.default_branch);
        if (data) {
            addToSessionStorage(data);
            await sleep(5000);
        }
    }
}

// This function is used to fetch manifest of a theme and return it
async function fetchThemeManifest(contents_url, branch) {
    try {
        const regex_result = contents_url.match(/https:\/\/api\.github\.com\/repos\/(?<user>.+)\/(?<repo>.+)\/contents/);
        // TODO: err handling?
        if (!regex_result || !regex_result.groups) return null;
        let { user, repo } = regex_result.groups;
        let manifests = await getRepoManifest(user, repo, branch);
        // If the manifest returned is not an array, initialize it as one
        if (!Array.isArray(manifests)) manifests = [manifests];
        manifests.user = user;
        manifests.repo = repo;
        if (manifests[0] && manifests[0].name && manifests[0].usercss && manifests[0].description) {
            return manifests;
        }
        return null;
    }
    catch (err) {
        // console.warn(contents_url, err);
        return null;
    }
}

// This function is used to fetch manifest of an extension and return it
async function fetchExtensionManifest(contents_url, branch) {
    try {
        // TODO: use the original search full_name ("theRealPadster/spicetify-hide-podcasts") or something to get the url better?
        const regex_result = contents_url.match(/https:\/\/api\.github\.com\/repos\/(?<user>.+)\/(?<repo>.+)\/contents/);
        // TODO: err handling?
        if (!regex_result || !regex_result.groups) return null;
        const { user, repo } = regex_result.groups;
        let manifests = await getRepoManifest(user, repo, branch);
        // If the manifest returned is not an array, initialize it as one
        if (!Array.isArray(manifests)) manifests = [manifests];
        manifests.user = user;
        manifests.repo = repo;
        if (manifests[0] && manifests[0].name && manifests[0].description && manifests[0].main) {
            return manifests;
        }
        return null;
    }
    catch (err) {
        // console.warn(contents_url, err);
        return null;
    }
}

async function getRepoManifest(user, repo, branch) {
    const sessionStorageItem = window.sessionStorage.getItem(`${user}-${repo}`);
    const failedSessionStorageItems = window.sessionStorage.getItem("noManifests");
    if (sessionStorageItem) {
        return null;
    }
    const url = `https://raw.githubusercontent.com/${user}/${repo}/${branch}/manifest.json`;
    if (failedSessionStorageItems?.includes(url)) {
        return null;
    }
    return await fetch(url).then(res => res.json()).catch(() => addToSessionStorage([url], "noManifests"));
}

// This function appends an array to session storage
function addToSessionStorage(items, key) {
    if (!items || items == null) return;
    items.forEach(item => {
        if (!key) key = `${items.user}-${items.repo}`;
        // If the key already exists, it will append to it instead of overwriting it
        const existing = window.sessionStorage.getItem(key);
        const parsed = existing ? JSON.parse(existing) : [];
        parsed.push(item);
        window.sessionStorage.setItem(key, JSON.stringify(parsed));
    });
}

// This function is used to sleep for a certain amount of time
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
