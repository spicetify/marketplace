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
  let parsedAuthors: { name: string; url: string }[] = [];

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

/**
 * Update the user.css in the DOM
 * @param {string} userCSS The contents of the new user.css
 */
export const injectUserCSS = (userCSS) => {
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
export const initColorShiftLoop = (schemes) => {
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

export const parseCSS = async (themeManifest) => {
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

/**
 * Get user, repo, and branch from a GitHub raw URL
 * @param {string} url Github Raw URL
 * @returns { { user: string, repo: string, branch: string, filePath: string } }
 */
export const getParamsFromGithubRaw = (url) => {
  const regex_result = url.match(/https:\/\/raw\.githubusercontent\.com\/(?<user>[^\/]+)\/(?<repo>[^\/]+)\/(?<branch>[^\/]+)\/(?<filePath>.+$)/);
  // e.g. https://raw.githubusercontent.com/spicetify/spicetify-extensions/main/featureshuffle/featureshuffle.js

  const obj = {
    user: regex_result ? regex_result.groups.user : null,
    repo: regex_result ? regex_result.groups.repo : null,
    branch: regex_result ? regex_result.groups.branch : null,
    filePath: regex_result ? regex_result.groups.filePath : null,
  };

  return obj;
};

export function addToSessionStorage(items, key?) {
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
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
