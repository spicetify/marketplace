/* eslint-disable no-redeclare, no-unused-vars */
// TODO: Migrate more things to this file

/**
 * Convert hexadeciaml string to rgb values
 * @param {string} hex 3 or 6 character hex string
 * @returns Array of RGB values
 */
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
 * Parse INI file into a colour scheme object
 * @param {string} data The INI file string data
 * @returns Object containing the parsed colour schemes
 */
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

/**
 * Loop through the snippets and add the contents of the code as a style tag in the DOM
* @param { { title: string; description: string; code: string;}[] } snippets The snippets to initialize
*/
// TODO: keep this in sync with the extension.js file
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

/**
 * Get localStorage data (or fallback value), given a key
 * @param {string} key The localStorage key
 * @param {any} fallback Fallback value if the key is not found
 * @returns The data stored in localStorage, or the fallback value if not found
 */
const getLocalStorageDataFromKey = (key, fallback) => {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
};

/**
 * Format an array of authors, given the data from the manifest and the repo owner.
 * @param {{ name: string; url: string; }[]} authors Array of authors
 * @param {string} user The repo owner
 * @returns {{ name: string; url: string; }[]} The authors, with anything missing added
 */
const processAuthors = (authors, user) => {
    let parsedAuthors = [];

    if (authors && authors.length > 0) {
        parsedAuthors = authors;
    } else {
        parsedAuthors.push({
            name: user,
            url: "https://github.com/" + user,
        });
    }

    return parsedAuthors;
};

/**
 * Generate a list of options for the schemes dropdown.
 * @param schemes The schemes object from the theme.
 * @returns {{ key: string; value: string; }[]} Array of options for the schemes dropdown.
 */
const generateSchemesOptions = (schemes) => {
    // e.g. [ { key: "red", value: "Red" }, { key: "dark", value: "Dark" } ]
    if (!schemes) return [];
    return Object.keys(schemes).map(schemeName => ({ key: schemeName, value: schemeName }));
};

/**
 * It fetches the blacklist.json file from the GitHub repository and returns the array of blocked repos.
 * @returns {Promise<string[]>} String array of blacklisted repos
 */
const getBlacklist = async () => {
    const url = "https://raw.githubusercontent.com/CharlieS1103/spicetify-marketplace/main/blacklist.json";
    const jsonReturned = await fetch(url).then(res => res.json()).catch(() => { });
    return jsonReturned.repos;
};

/**
 * It fetches the snippets.json file from the Github repository and returns it as a JSON object.
 * @returns { Promise<{ title: string; description: string; code: string;}[]> } Array of snippets
 */
const fetchCssSnippets = async () => {
    const url = "https://raw.githubusercontent.com/CharlieS1103/spicetify-marketplace/main/snippets.json";
    const json = await fetch(url).then(res => res.json()).catch(() => { });
    return json;
};

// Reset any Marketplace localStorage keys (effectively resetting it completely)
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
