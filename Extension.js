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
        //Theme installed needs to store a link similar to this ("https://raw.githubusercontent.com/CharlieS1103/Dreary/main/")
        "themeInstalled": "marketplace:theme-installed",
    };
    console.log(LocalStorage.get(LOCALSTORAGE_KEYS.themeInstalled));
    if (LocalStorage.get(LOCALSTORAGE_KEYS.themeInstalled) != null) {
        let all = document.getElementsByTagName("*");
        for (let i = 0, max = all.length; i < max; i++) {
            // Error annoys me but don't feel like figuring out casting in JS + It works.
            if (all[i].href == "https://xpui.app.spotify.com/user.css") {
                all[i].remove();
                const usercss = document.createElement("link");
                usercss.href = LocalStorage.get(LOCALSTORAGE_KEYS.themeInstalled) + "/user.css";
                document.body.appendChild(usercss);
            }
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
        if (!extensionManifest) return;

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
