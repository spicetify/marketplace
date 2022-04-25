/**
 * Get localStorage data (or fallback value), given a key
 * @param {string} key The localStorage key
 * @param {any} fallback Fallback value if the key is not found
 * @returns The data stored in localStorage, or the fallback value if not found
 */
export const getLocalStorageDataFromKey = (key: string, fallback?: any) => {
  const data = localStorage.getItem(key);
  if (data) {
    return JSON.parse(data);
  } else {
    return fallback;
  }
};

/**
 * Convert hexadeciaml string to rgb values
 * @param {string} hex 3 or 6 character hex string
 * @returns Array of RGB values
 */
export const hexToRGB = (hex) => {
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
export const parseIni = (data) => {
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
export const initializeSnippets = (snippets) => {
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
 * Format an array of authors, given the data from the manifest and the repo owner.
 * @param {{ name: string; url: string; }[]} authors Array of authors
 * @param {string} user The repo owner
 * @returns {{ name: string; url: string; }[]} The authors, with anything missing added
 */
export const processAuthors = (authors, user) => {
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
export const generateSchemesOptions = (schemes) => {
  // e.g. [ { key: "red", value: "Red" }, { key: "dark", value: "Dark" } ]
  if (!schemes) return [];
  return Object.keys(schemes).map(schemeName => ({ key: schemeName, value: schemeName }));
};

// Reset any Marketplace localStorage keys (effectively resetting it completely)
export const resetMarketplace = () => {
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

// NOTE: Keep in sync with extension.js
export const injectColourScheme = (scheme) => {
  // Remove any existing Spicetify scheme
  const existingColorsCSS = document.querySelector("link[href='colors.css']");
  if (existingColorsCSS) existingColorsCSS.remove();

  // Remove any existing marketplace scheme
  const existingMarketplaceSchemeCSS = document.querySelector("style.marketplaceCSS.marketplaceScheme");
  if (existingMarketplaceSchemeCSS) existingMarketplaceSchemeCSS.remove();

  if (scheme) {
    // Add new marketplace scheme
    const schemeTag = document.createElement("style");
    schemeTag.classList.add("marketplaceCSS");
    schemeTag.classList.add("marketplaceScheme");

    let injectStr = ":root {";
    const themeIniKeys = Object.keys(scheme);
    themeIniKeys.forEach((key) => {
      injectStr += `--spice-${key}: #${scheme[key]};`;
      injectStr += `--spice-rgb-${key}: ${hexToRGB(scheme[key])};`;
    });
    injectStr += "}";
    schemeTag.innerHTML = injectStr;
    document.head.appendChild(schemeTag);
  } else {
    // Re-add default user.css
    let originalColorsCSS = document.createElement("link");
    originalColorsCSS.setAttribute("rel", "stylesheet");
    originalColorsCSS.setAttribute("href", "colors.css");
    originalColorsCSS.classList.add("userCSS");
    document.head.appendChild(originalColorsCSS);
  }
}
