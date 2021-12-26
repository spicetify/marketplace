/* eslint-disable no-redeclare, no-unused-vars */
// TODO: Migrate more things to this file
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

const getLocalStorageDataFromKey = (key, fallback) => {
    const str = localStorage.getItem(key);
    if (!str) return fallback;

    const obj = JSON.parse(str);
    return obj;
};
