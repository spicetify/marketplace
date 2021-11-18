// @ts-check

// NAME: Spicetify Marketplace Extension
// AUTHOR: theRealPadster, CharlieS1103
// DESCRIPTION: Companion extension for Spicetify Marketplace

/// <reference path="../../spicetify-cli/globals.d.ts" />

const hexToRGB = (hex) => {
    if (hex.length != 6) {
        throw "Only six-digit hex colors are allowed.";
    }

    const aRgbHex = hex.match(/.{1,2}/g);
    const aRgb = [
        parseInt(aRgbHex[0], 16),
        parseInt(aRgbHex[1], 16),
        parseInt(aRgbHex[2], 16),
    ];
    return aRgb;
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
        //Theme installed needs to store a link similar to this ("https://raw.githubusercontent.com/CharlieS1103/Dreary/main/")
        "themeInstalled": "marketplace:theme-installed",
    };

    const injectColourScheme = (scheme) => {
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
    };

    const installedThemeKey = LocalStorage.get(LOCALSTORAGE_KEYS.themeInstalled);

    // TODO: tidy this up
    if (installedThemeKey) {
        const installedThemeDataStr = LocalStorage.get(installedThemeKey);

        if (installedThemeDataStr) {
            const installedThemeData = JSON.parse(installedThemeDataStr);

            // Inject colour scheme
            const parsedSchemes = installedThemeData.schemes;
            console.log(parsedSchemes);
            const activeScheme = installedThemeData.schemes[installedThemeData.activeScheme];
            injectColourScheme(activeScheme);

            // Remove default css
            const existingUserThemeCSS = document.querySelector("link[href='user.css']");
            // TODO: what about if we remove the theme? Should we re-add the user.css?
            if (existingUserThemeCSS) existingUserThemeCSS.remove();

            // Remove any existing marketplace theme
            const existingMarketplaceThemeCSS = document.querySelector("link.marketplaceCSS");
            if (existingMarketplaceThemeCSS) existingMarketplaceThemeCSS.remove();

            // Add theme css
            const newUserThemeCSS = document.createElement("link");
            // Using jsdelivr since github raw doesn't provide mimetypes
            // TODO: this should probably be the URL stored in localstorage actually (i.e. put this url in localstorage)
            const cssUrl = `https://cdn.jsdelivr.net/gh/${installedThemeData.user}/${installedThemeData.repo}/${installedThemeData.manifest.usercss}`;
            newUserThemeCSS.href = cssUrl;
            newUserThemeCSS.rel = "stylesheet";
            newUserThemeCSS.classList.add("userCSS", "marketplaceCSS");
            document.body.appendChild(newUserThemeCSS);
        }
    }

    const getInstalledExtensions = () => {
        const installedExtensionsStr = LocalStorage.get(LOCALSTORAGE_KEYS.installedExtensions) || "[]";
        const installedExtensions = JSON.parse(installedExtensionsStr);
        return installedExtensions;
    };

    const getExtensionFromKey = (key) => {
        const manifestStr = LocalStorage.get(key);
        if (!manifestStr) return null;

        const manifest = JSON.parse(manifestStr);
        return manifest;
    };

    const initializeExtension = (extensionKey) => {
        const extensionManifest = getExtensionFromKey(extensionKey);
        // Abort if no manifest found or no extension URL (i.e. a theme)
        if (!extensionManifest || !extensionManifest.extensionURL) return;

        console.log("Initializing extension: ", extensionManifest);

        // e.g. https://raw.githubusercontent.com/CharlieS1103/spicetify-extensions/main/featureshuffle/featureshuffle.js
        // eslint-disable-next-line no-useless-escape
        const regex_result = extensionManifest.extensionURL.match(/https:\/\/raw\.githubusercontent\.com\/(?<user>[^\/]+)\/(?<repo>[^\/]+)\/(?<branch>[^\/]+)\//);
        // TODO: err handling?
        if (!regex_result || !regex_result.groups) return;

        const { user, repo, branch } = regex_result.groups;
        if (!user || !repo || !branch) return;

        const main = extensionManifest.manifest.main[0]  === "/"
            ? extensionManifest.manifest.main.slice(1)
            : extensionManifest.manifest.main;

        const script = document.createElement("script");
        script.defer = true;
        script.src = `https://cdn.jsdelivr.net/gh/${user}/${repo}@${branch}/${main}`;
        document.body.appendChild(script);
    };

    console.log("Loaded Marketplace extension");

    const installedExtensions = getInstalledExtensions();

    installedExtensions.forEach((extensionKey) => initializeExtension(extensionKey));
})();
