// TODO: this will be the extension in which we run the init code

// @ts-check

// NAME: Spicetify Marketplace Extension
// AUTHOR: theRealPadster, CharlieS1103
// DESCRIPTION: Companion extension for Spicetify Marketplace

/// <reference path="../spicetify-cli/globals.d.ts" />

(function MarketplaceExtension() {
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
    };

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
        if (!extensionManifest) return;

        console.log("Initializing extension: ", extensionManifest);
        console.log("TODO: not implemented (need to get user, repo, and branch - or init differently)");

        // const script = document.createElement("script");
        // script.defer = true;

        // if (main[0]  === "/") main = main.slice(1);

        // script.src = `https://cdn.jsdelivr.net/gh/${user}/${repo}@${branch}/${main}`;
        // document.body.appendChild(script);
    };

    console.log("Loaded Marketplace extension");

    const installedExtensions = getInstalledExtensions();
    console.log("installedExtensions", installedExtensions);

    installedExtensions.forEach((extensionKey) => initializeExtension(extensionKey));
})();
