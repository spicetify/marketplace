import { CardProps } from "../components/Card/Card";
import { Author, CardItem, ColourScheme, SchemeIni, Snippet, SortBoxOption } from "../types/marketplace-types";
import Chroma from "chroma-js";
import { LOCALSTORAGE_KEYS } from "../constants";
/**
 * Get localStorage data (or fallback value), given a key
 * @param key The localStorage key
 * @param fallback Fallback value if the key is not found
 * @returns The data stored in localStorage, or the fallback value if not found
 */
export const getLocalStorageDataFromKey = (key: string, fallback?: unknown) => {
  const data = localStorage.getItem(key);
  if (data) {
    try {
      // If it's json parse it
      return JSON.parse(data);
    } catch (err) {
      // If it's just a string or something
      return data;
    }
  } else {
    return fallback;
  }
};

/**
 * Convert hexadeciaml string to rgb values
 * @param hex 3 or 6 character hex string
 * @returns Array of RGB values
 */
const hexToRGB = (hex: string) => {
  if (hex.length === 3) {
    hex = hex.split("").map((char) => char + char).join("");
  } else if (hex.length != 6) {
    throw "Only 3- or 6-digit hex colours are allowed.";
  } else if (hex.match(/[^0-9a-f]/i)) {
    throw "Only hex colours are allowed.";
  }

  const aRgbHex = hex.match(/.{1,2}/g);
  if (!aRgbHex || aRgbHex.length !== 3) {
    throw "Could not parse hex colour.";
  }

  const aRgb = [
    parseInt(aRgbHex[0], 16),
    parseInt(aRgbHex[1], 16),
    parseInt(aRgbHex[2], 16),
  ];

  return aRgb;
};

/**
* Parse INI file into a colour scheme object
* @param data The INI file string data
* @returns Object containing the parsed colour schemes
*/
export const parseIni = (data: string) => {
  const regex = {
    section: /^\s*\[\s*([^\]]*)\s*\]\s*$/,
    param: /^\s*([^=]+?)\s*=\s*(.*?)\s*$/,
    comment: /^\s*;.*$/,
  };
  const value = {};
  const lines = data.split(/[\r\n]+/);
  let section: string | null = null;
  lines.forEach(function(line) {
    if (regex.comment.test(line)) {
      return;
    } else if (regex.param.test(line)) {
      // Discard color scheme if it contains xrdb
      if (line.includes("xrdb")) {
        delete value[section ?? ""];
        section = null;
        return;
      }

      const match: string[] | null = line.match(regex.param);

      // TODO: github copilot made this part, but I have no idea what it does
      // if (match?.length !== 3) {
      //   throw "Could not parse INI file.";
      // }

      if (section && match) {
        value[section][match[1]] = match[2].split(";")[0].trim();
      }
    } else if (regex.section.test(line)) {
      const match = line.match(regex.section);
      if (match) {
        value[match[1]] = {};
        section = match[1];
      }
    } else if (line.length == 0 && section) {
      section = null;
    }
  });
  return value;
};

/* Pretty much just reverse the above function */
export const unparseIni = (data: SchemeIni) => {
  let output = "";
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      if (typeof data[key] === "object") {
        output += `[${key}]\n`;
        for (const subKey in data[key]) {
          if (Object.prototype.hasOwnProperty.call(data[key], subKey)) {
            output += `${subKey}=${data[key][subKey]}\n`;
          }
        }
      } else {
        output += `${key}=${data[key]}\n`;
      }
    }
  }
  return output;
};

/**
* Loop through the snippets and add the contents of the code as a style tag in the DOM
* @param snippets The snippets to initialize
*/
// TODO: keep this in sync with the extension.js file
export const initializeSnippets = (snippets: Snippet[]) => {
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
  document.body.appendChild(style);
};

export const fileToBase64 = (file: File) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = (error) => {
      reject(error);
    };
  });
};

/**
 * Format an array of authors, given the data from the manifest and the repo owner.
 * @param authors Array of authors
 * @param user The repo owner
 * @returns The authors, with anything missing added
 */
export const processAuthors = (authors: Author[], user: string) => {
  let parsedAuthors: Author[] = [];

  if (authors && authors.length > 0) {
    parsedAuthors = authors.map((author) => ({
      name: author.name,
      url: sanitizeUrl(author.url),
    }));
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
* @returns Array of options for the schemes dropdown.
*/
export const generateSchemesOptions = (schemes: SchemeIni) => {
  // e.g. [ { key: "red", value: "Red" }, { key: "dark", value: "Dark" } ]
  if (!schemes) return [];
  return Object.keys(schemes).map(schemeName => (
    { key: schemeName, value: schemeName } as SortBoxOption
  ));
};

/**
 * Generate a list of options for the sort dropdown
 * @param t The string translation function
 * @returns The sort options for the sort dropdown
 */
export const generateSortOptions = (t: (key: string) => string) => {
  // TODO: It would be great if I could disable the options that don't apply for snippets
  // But it looks like that's not supported by the library
  // https://github.com/fraserxu/react-dropdown/pull/176
  // TODO: I could also just remove the options for snippets,
  // but then the sort resets when you switch tabs and it's disruptive

  return [
    { key: "stars", value: t("grid.sort.stars") },
    { key: "newest", value: t("grid.sort.newest") },
    { key: "oldest", value: t("grid.sort.oldest") },
    { key: "lastUpdated", value: t("grid.sort.lastUpdated") },
    { key: "mostStale", value: t("grid.sort.mostStale") },
    { key: "a-z", value: t("grid.sort.aToZ") },
    { key: "z-a", value: t("grid.sort.zToA") },
  ];
};
/**
 * Reset Marketplace localStorage keys
 * @param categories The categories to reset. If none provided, reset everything.
 */
export const resetMarketplace = (...categories: ("extensions" | "snippets" | "theme")[]) => {
  console.debug("Resetting Marketplace");

  const keysToRemove: string[] = [];

  // If no categories provided, reset everything
  if (categories.length === 0) {
    // Loop through all marketplace keys.
    // This includes extensions, themes, and snippets, as well as the Marketplace settings.
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("marketplace:")) {
        keysToRemove.push(key);
      }
    });
  }

  // If have categories, reset only those
  categories.forEach((category) => {
    if (category === "extensions") {
      // Remove the extensions themselves
      keysToRemove.push(...getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.installedExtensions, []));
      // Remove the list of extension keys
      keysToRemove.push(LOCALSTORAGE_KEYS.installedExtensions);
    } else if (category === "snippets") {
      keysToRemove.push(...getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.installedSnippets, []));
      keysToRemove.push(LOCALSTORAGE_KEYS.installedSnippets);
    } else if (category === "theme") {
      keysToRemove.push(...getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.installedThemes, []));
      keysToRemove.push(LOCALSTORAGE_KEYS.installedThemes);
      keysToRemove.push(LOCALSTORAGE_KEYS.themeInstalled);
    }
  });

  keysToRemove.forEach((key) => {
    localStorage.removeItem(key);
    console.debug(`Removed ${key}`);
  });

  console.debug("Marketplace has been reset");
  location.reload();
};

export const exportMarketplace = () => {
  // TODO: Export settings, extensions, snippets, themes, colour scheme
  const data = {};

  Object.keys(localStorage).forEach((key) => {
    // console.log(`${key}: ${localStorage.getItem(key)}`);
    if (key.startsWith("marketplace:")) {
      data[key] = localStorage.getItem(key);
    }
  });
  return data as JSON;
};

export const importMarketplace = (data : JSON) => {
  console.debug("Importing Marketplace");
  // First reset the marketplace
  resetMarketplace();
  // Then import the data
  Object.keys(data).forEach((key) => {
    localStorage.setItem(key, data[key]);
    console.debug(`Imported ${key}`);
  });
};

// NOTE: Keep in sync with extension.js
export const injectColourScheme = (scheme: ColourScheme | null) => {
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
    document.body.appendChild(schemeTag);
  }
};

/**
 * Update the user.css in the DOM
 * @param userCSS The contents of the new user.css
 */
export const injectUserCSS = (userCSS?: string) => {
  try {
    // Remove any existing Spicetify user.css
    const existingUserThemeCSS = document.querySelector("link[href='user.css']");
    if (existingUserThemeCSS) existingUserThemeCSS.remove();

    // Remove any existing marketplace scheme
    const existingMarketplaceUserCSS = document.querySelector("style.marketplaceCSS.marketplaceUserCSS");
    if (existingMarketplaceUserCSS) existingMarketplaceUserCSS.remove();

    if (userCSS) {
      // Add new marketplace scheme
      const userCssTag = document.createElement("style");
      userCssTag.classList.add("marketplaceCSS");
      userCssTag.classList.add("marketplaceUserCSS");
      userCssTag.innerHTML = userCSS;
      document.body.appendChild(userCssTag);
    } else {
      // Re-add default user.css
      const originalUserThemeCSS = document.createElement("link");
      originalUserThemeCSS.setAttribute("rel", "stylesheet");
      originalUserThemeCSS.setAttribute("href", "user.css");
      originalUserThemeCSS.classList.add("userCSS");
      document.body.appendChild(originalUserThemeCSS);
    }
  } catch (error) {
    console.warn(error);
  }
};

// I guess this is okay to not have an end condition on the interval
// because if they turn the setting on or off,
// closing the settings modal will reload the page
export const initColorShiftLoop = (schemes: SchemeIni) => {
  let i = 0;
  const NUM_SCHEMES = Object.keys(schemes).length;
  setInterval(() => {
    // Resets to zero when passes the last scheme
    i = i % NUM_SCHEMES;
    injectColourScheme(Object.values(schemes)[i]);
    i++;
  }, 60 * 1000);
};

export const getColorFromImage = async (image: string) => {
  let vibrancy = getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.albumArtBasedColorVibrancy);
  // Add a underscore before any uppercase characters, then make the whole string uppercase
  vibrancy = vibrancy.replace(/([A-Z])/g, "_$1").toUpperCase();
  const colorOptions = (await Spicetify.colorExtractor(image));
  const color = colorOptions[vibrancy];
  return color.substring(1);
};

export const generateColorPalette = async (mainColor: string, numColors: number) => {
  const mode = getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.albumArtBasedColorMode);
  // Add a hyphen before any uppercase characters
  const modeStr = mode.replace(/([A-Z])/g, "-$1").toLowerCase();
  //fetch `https://www.thecolorapi.com/scheme?hex=${mainColor}&mode=${modeStr}&count=${numColors}`
  const palette = await  fetch(`https://www.thecolorapi.com/scheme?hex=${mainColor}&mode=${modeStr}&count=${numColors}`)
    .then((response) => response.json());
  // create an array of the hex values for the colors while also removing the #
  const colorArray = palette.colors.map((color) => color.hex.value.substring(1));
  return colorArray;
};

async function waitForAlbumArt(): Promise<string | undefined> {
  // Only return when the album art is loaded
  return new Promise((resolve) => {
    setInterval(() => {
      const albumArtSrc = Spicetify.Player.data?.track?.metadata?.image_xlarge_url;
      if (albumArtSrc) {
        resolve(albumArtSrc);
      }
    }, 50);
  });
}

export const initAlbumArtBasedColor = (scheme: ColourScheme) => {
  // Add a listener for the album art changing
  // and update the color scheme accordingly
  Spicetify.Player.addEventListener("songchange", async () => {
    await sleep(1000);
    let albumArtSrc = Spicetify.Player.data?.track?.metadata?.image_xlarge_url;

    // If it doesn't exist, wait for it to load
    if (albumArtSrc == null) {
      albumArtSrc = await waitForAlbumArt();
    }

    if (albumArtSrc) {
      const numColors = new Set(Object.values(scheme)).size;
      const mainColor: string = await getColorFromImage(albumArtSrc);
      const newColors = await generateColorPalette(mainColor, numColors);
      /*  Find which keys share the same value in the current scheme, create a new scheme that has the value as the key and all the keys in the old scheme as the value
      i.e.
      { "color1": "#000000", "color2": "#000000", "color3": "#FFFFFF" } ->
      { "#000000": ["color1", "color2"], "#FFFFFF": ["color3"]}
      */
      let colorMap = new Map();
      for (const [key, value] of Object.entries(scheme)) {
        if (colorMap.has(value)) {
          colorMap.get(value).push(key);
        } else {
          colorMap.set(value, [key]);
        }
      }
      // Order the color map by how similar the colors are to eachother
      const orderedColorMap = new Map([...colorMap.entries()].sort((a, b) => {
        const aColor = Chroma(a[0]);
        const bColor = Chroma(b[0]);
        return aColor.get("lab.l") - bColor.get("lab.l");
      }));
      colorMap = orderedColorMap;
      // replace the keys in the color map with the new colors
      const newScheme = {};
      for (const [, value] of colorMap.entries()) {
        const newColor = newColors.shift();
        if (newColor) {
          for (const key of value) {
            newScheme[key] = newColor;
          }
        }
      }
      injectColourScheme(newScheme);
    }
  });
};

export const parseCSS = async (themeData: CardItem, tld?: string) => {
  if (!themeData.cssURL) throw new Error("No CSS URL provided");

  tld ||= await getAvailableTLD();

  const userCssUrl = isGithubRawUrl(themeData.cssURL)
  // TODO: this should probably be the URL stored in localstorage actually (i.e. put this url in localstorage)
    ? `https://cdn.jsdelivr.${tld}/gh/${themeData.user}/${themeData.repo}@${themeData.branch}/${themeData.manifest.usercss}`
    : themeData.cssURL;
  // TODO: Make this more versatile
  const assetsUrl = userCssUrl.replace("/user.css", "/assets/");

  console.debug("Parsing CSS: ", userCssUrl);
  let css = await fetch(`${userCssUrl}?time=${Date.now()}`).then(res => res.text());
  // console.log("Parsed CSS: ", css);

  const urls = css.matchAll(/url\(['|"](?<path>.+?)['|"]\)/gm) || [];

  for (const match of urls) {
    const url = match?.groups?.path;
    if (!url) continue;

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

export const isGithubRawUrl = (url: string) => {
  const parsedUrl = new URL(url);
  parsedUrl.host;

  return (parsedUrl.host === "raw.githubusercontent.com");
};

/**
 * Get user, repo, and branch from a GitHub raw URL
 * @param url Github Raw URL
 * @returns { { user: string, repo: string, branch: string, filePath: string } }
 */
export const getParamsFromGithubRaw = (url: string) => {
  const regex_result = url.match(/https:\/\/raw\.githubusercontent\.com\/(?<user>[^/]+)\/(?<repo>[^/]+)\/(?<branch>[^/]+)\/(?<filePath>.+$)/);
  // e.g. https://raw.githubusercontent.com/spicetify/spicetify-extensions/main/featureshuffle/featureshuffle.js

  const obj = {
    user: regex_result ? regex_result.groups?.user : null,
    repo: regex_result ? regex_result.groups?.repo : null,
    branch: regex_result ? regex_result.groups?.branch : null,
    filePath: regex_result ? regex_result.groups?.filePath : null,
  };

  return obj;
};

export function addToSessionStorage(items, key?) {
  if (!items) return;
  items.forEach((item) => {
    const itemKey = key || `${item.user}-${item.repo}`;

    // If the key already exists, it will append to it instead of overwriting it
    const existing = window.sessionStorage.getItem(itemKey);
    const parsed = existing ? JSON.parse(existing) : [];
    parsed.push(item);
    window.sessionStorage.setItem(itemKey, JSON.stringify(parsed));
  });
}
export function getInvalidCSS(): string[] {
  const unparsedCSS = document.querySelector("body > style.marketplaceCSS.marketplaceUserCSS");
  const classNameList = unparsedCSS?.innerHTML;
  const regex = new RegExp (`.-?[_a-zA-Z]+[_a-zA-Z0-9-]*\\s*{`, "g");
  if (!classNameList) return ["Error: Class name list not found; please create an issue"];
  const matches = classNameList.matchAll(regex);
  const invalidCssClassName: string[] = [];
  for (const match of matches) {
    // Check if match is the same class name as an html element
    const className = match[0].replace(/{/g, "").trim();
    const classesArr = className.split(" ");
    let element;
    for (let i = 0; i < classesArr.length; i++) {
      try {
        element = document.querySelector(`${classesArr[i]}`);
      }
      catch (e) {
        element = document.getElementsByClassName(`${className}`);
      }
      if (!element) {
        invalidCssClassName.push(className);
      }
    }
  }
  return invalidCssClassName;
}

export async function getMarkdownHTML(markdown: string, user: string, repo: string) {
  try {
    const postBody = {
      text: markdown,
      context: `${user}/${repo}`,
      mode: "gfm",
    };

    const response = await fetch("https://api.github.com/markdown", {
      method: "POST",
      body: JSON.stringify(postBody),
    });
    if (!response.ok) throw Spicetify.showNotification(`Error parsing markdown (HTTP ${response.status})`, true);

    const html = await response.text();

    return html;
  } catch (err) {
    return null;
  }
}

// This function is used to sleep for a certain amount of time
export function sleep(ms: number | undefined) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function generateKey(props: CardProps) {
  const prefix = props.type === "snippet" ? "snippet:" : `${props.item.user}/${props.item.repo}/`;

  let cardId: string;
  switch (props.type) {
  case "snippet":
    cardId = props.item.title.replaceAll(" ", "-");
    break;
  case "theme":
    cardId = props.item.manifest?.usercss || "";
    break;
  case "extension":
    cardId = props.item.manifest?.main || "";
    break;
  case "app":
    cardId = props.item.manifest?.name?.replaceAll(" ", "-") || "";
    break;
  }

  return `marketplace:installed:${prefix}${cardId}`;
}

export const sanitizeUrl = (url: string) => {
  const u = decodeURI(url).trim().toLowerCase();
  if (u.startsWith("javascript:") || u.startsWith("data:") || u.startsWith("vbscript:"))
    return "about:blank";
  return url;
};

export const addExtensionToSpicetifyConfig = (main?: string) => {
  if (!main) return;

  const name = main.split("/").pop();
  if (name && Spicetify.Config.extensions.indexOf(name) === -1) {
    Spicetify.Config.extensions.push(name);
  }
};

/**
 * Compare two card items/snippets by name.
 * This will use `title` for snippets and `manifest.name` for everything else.
 */
const compareNames = (a: CardItem | Snippet, b: CardItem | Snippet) => {
  // Snippets have a title, but no manifest
  const aName = a.title || a?.manifest?.name || "";
  const bName = b.title || b?.manifest?.name || "";
  return aName.localeCompare(bName);
};

/**
 * Compare two card items/snippets by created.
 * This is skipped for snippets, since they don't have a created property.
 */
const compareCreated = (a: CardItem | Snippet, b: CardItem | Snippet) => {
  // Abort compare if items are missing created
  if (a.created === undefined || b.created === undefined) return 0;

  const aDate = new Date(a.created);
  const bDate = new Date(b.created);
  return bDate.getTime() - aDate.getTime();
};

/**
 * Compare two card items/snippets by lastUpdated.
 * This is skipped for snippets, since they don't have a lastUpdated property.
 */
const compareUpdated = (a: CardItem | Snippet, b: CardItem | Snippet) => {
  // Abort compare if items are missing lastUpdated
  if (a.lastUpdated === undefined || b.lastUpdated === undefined) return 0;

  const aDate = new Date(a.lastUpdated);
  const bDate = new Date(b.lastUpdated);
  return bDate.getTime() - aDate.getTime();
};

export const sortCardItems = (cardItems: CardItem[] | Snippet[], sortMode: string) => {
  switch (sortMode) {
  case "a-z":
    cardItems.sort((a, b) => compareNames(a, b));
    break;
  case "z-a":
    cardItems.sort((a, b) => compareNames(b, a));
    break;
  case "newest":
    cardItems.sort((a, b) => compareCreated(a, b));
    break;
  case "oldest":
    cardItems.sort((a, b) => compareCreated(b, a));
    break;
  case "lastUpdated":
    cardItems.sort((a, b) => compareUpdated(a, b));
    break;
  case "mostStale":
    cardItems.sort((a, b) => compareUpdated(b, a));
    break;
  case "stars":
  default:
    cardItems.sort((a, b) => b.stars - a.stars);
    break;
  }
};

// Make a ping to the jsdelivr CDN to check if the user has an internet connection
export async function getAvailableTLD() {
  const tlds = ["net", "xyz"];

  for (const tld of tlds) {
    try {
      const response = await fetch(`https://cdn.jsdelivr.${tld}`, { redirect: "manual", cache: "no-cache" });
      if (response.type === "opaqueredirect") return tld;
    } catch (err) {
      console.error(err);
      continue;
    }
  }
}
