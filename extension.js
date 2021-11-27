// @ts-check

// NAME: Spicetify Marketplace Extension
// AUTHOR: theRealPadster, CharlieS1103
// DESCRIPTION: Companion extension for Spicetify Marketplace

/// <reference path="../spicetify-cli/globals.d.ts" />

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
        "activeTab": "marketplace:active-tab",
        "tabs": "marketplace:tabs",
        // Theme installed store the localsorage key of the theme (e.g. marketplace:installed:NYRI4/Comfy-spicetify/user.css)
        "themeInstalled": "marketplace:theme-installed",
    };

    const getInstalledExtensions = () => {
        const installedExtensionsStr = LocalStorage.get(LOCALSTORAGE_KEYS.installedExtensions) || "[]";
        const installedExtensions = JSON.parse(installedExtensionsStr);
        return installedExtensions;
    };

    const getLocalStorageDataFromKey = (key) => {
        const manifestStr = LocalStorage.get(key);
        if (!manifestStr) return null;

        const manifest = JSON.parse(manifestStr);
        return manifest;
    };

    const initializeExtension = (extensionKey) => {
        const extensionManifest = getLocalStorageDataFromKey(extensionKey);
        // Abort if no manifest found or no extension URL (i.e. a theme)
        if (!extensionManifest || !extensionManifest.extensionURL) return;

        console.log("Initializing extension: ", extensionManifest);

        const { user, repo, branch, filePath } = getParamsFromGithubRaw(extensionManifest.extensionURL);
        if (!user || !repo || !branch || !filePath) return;

        const script = document.createElement("script");
        script.defer = true;
        script.src = `https://cdn.jsdelivr.net/gh/${user}/${repo}@${branch}/${filePath}`;
        document.body.appendChild(script);
    };

    const injectColourScheme = (scheme) => {
        try {
            // Remove default scheme
            const existingColorsCSS = document.querySelector("link[href='colors.css']");
            if (existingColorsCSS) existingColorsCSS.remove();

            // Remove any existing marketplace scheme
            const existingMarketplaceThemeCSS = document.querySelector("style.marketplaceCSS");
            if (existingMarketplaceThemeCSS) existingMarketplaceThemeCSS.remove();

            // Add new marketplace scheme
            const themeTag = document.createElement("style");
            themeTag.classList.add("marketplaceCSS");
            // const theme = document.querySelector('#theme');
            let injectStr = ":root {";

            const themeIniKeys = Object.keys(scheme);
            themeIniKeys.forEach((key) => {
                injectStr += `--spice-${key}: #${scheme[key]};`;
                injectStr += `--spice-rgb-${key}: ${hexToRGB(scheme[key])};`;
            });
            injectStr += "}";
            themeTag.innerHTML = injectStr;
            document.head.appendChild(themeTag);
        } catch (error) {
            console.warn(error);
        }
    };

    const initializeTheme = (themeKey) => {
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
            let i = 0;
            if (localStorage.getItem("marketplace:colorShift") == "true") {
                setInterval(function () {
                    if (i > Object.keys(themeManifest.schemes).length) {
                        i=0;
                    }
                    injectColourScheme(Object.values(themeManifest.schemes)[i]);

                    i++;
                }, 10 * 1000);
            }
        } else {
            console.warn("No schemes found for theme");
        }

        // Remove default css
        // TODO: what about if we remove the theme? Should we re-add the user.css/colors.css?
        const existingUserThemeCSS = document.querySelector("link[href='user.css']");
        if (existingUserThemeCSS) existingUserThemeCSS.remove();

        // Remove any existing marketplace theme
        const existingMarketplaceThemeCSS = document.querySelector("link.marketplaceCSS");
        if (existingMarketplaceThemeCSS) existingMarketplaceThemeCSS.remove();

        // Add theme css
        const newUserThemeCSS = document.createElement("link");
        // Using jsdelivr since github raw doesn't provide mimetypes
        // TODO: this should probably be the URL stored in localstorage actually (i.e. put this url in localstorage)
        const cssUrl = `https://cdn.jsdelivr.net/gh/${themeManifest.user}/${themeManifest.repo}@${themeManifest.branch}/${themeManifest.manifest.usercss}`;
        newUserThemeCSS.href = cssUrl;
        newUserThemeCSS.rel = "stylesheet";
        newUserThemeCSS.classList.add("userCSS", "marketplaceCSS");
        document.body.appendChild(newUserThemeCSS);

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
                newScript.src = src;
                newScript.classList.add("marketplaceScript");
                document.body.appendChild(newScript);
            });
        }
    };

    console.log("Loaded Marketplace extension");

    const installedThemeKey = LocalStorage.get(LOCALSTORAGE_KEYS.themeInstalled);
    if (installedThemeKey) initializeTheme(installedThemeKey);

    const installedExtensions = getInstalledExtensions();
    installedExtensions.forEach((extensionKey) => initializeExtension(extensionKey));
})();
