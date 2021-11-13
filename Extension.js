// @ts-check

// NAME: Spicetify Marketplace Extension
// AUTHOR: theRealPadster, CharlieS1103
// DESCRIPTION: Companion extension for Spicetify Marketplace

/// <reference path="../spicetify-cli/globals.d.ts" />

const parseIni = (data) => {
    const regex = {
        section: /^\s*\[\s*([^\]]*)\s*\]\s*$/,
        param: /^\s*([^=]+?)\s*=\s*(.*?)\s*$/,
        comment: /^\s*;.*$/,
    };
    let value = {};
    let lines = data.split(/[\r\n]+/);
    let section = null;
    lines.forEach(function(line) {
        if (regex.comment.test(line)) {
            return;
        } else if (regex.param.test(line)) {
            let match = line.match(regex.param);
            if (section) {
                value[section][match[1]] = match[2];
            } else {
                value[match[1]] = match[2];
            }
        } else if (regex.section.test(line)) {
            let match = line.match(regex.section);
            value[match[1]] = {};
            section = match[1];
        } else if (line.length == 0 && section) {
            section = null;
        }
    });
    return value;
};

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

    // console.log(LocalStorage.get(LOCALSTORAGE_KEYS.themeInstalled));

    const fetchSchemes = async (url) => {
        const response = await fetch(url);
        const text = await response.json();
        return text;
    };

    const injectColourScheme = (scheme) => {
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
    console.log(installedThemeKey);

    // TODO: tidy this up
    if (installedThemeKey) {
        const installedThemeDataStr = LocalStorage.get(installedThemeKey);

        if (installedThemeDataStr) {
            const installedThemeData = JSON.parse(installedThemeDataStr);
            // https://api.github.com/repos/CharlieS1103/Dreary/contents/Dreary/color.ini
            const iniUrl = `https://api.github.com/repos/${installedThemeData.user}/${installedThemeData.repo}/contents/${installedThemeData.manifest.schemes}`;
            // console.log(iniUrl);

            const colourSchemesResult = await fetchSchemes(iniUrl);
            const colourSchemes = atob(colourSchemesResult.content);
            const parsedSchemes = parseIni(colourSchemes);
            console.log(parsedSchemes);
            const firstScheme = Object.values(parsedSchemes)[0];
            injectColourScheme(firstScheme);
        }

        const existingUserThemeCSS = document.querySelector("link[href='user.css']");
        existingUserThemeCSS.remove();
        const newUserThemeCSS = document.createElement("link");
        newUserThemeCSS.href = LocalStorage.get(LOCALSTORAGE_KEYS.themeInstalled); // + "/user.css";
        // TODO: adding the rel="stylesheet" attribute makes it not load since github raw doesn't provide mimetypes
        // newUserThemeCSS.rel = "stylesheet";
        newUserThemeCSS.classList.add("userCSS", "marketplaceCSS");
        document.body.appendChild(newUserThemeCSS);
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
