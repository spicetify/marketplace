import { TabItemConfig } from "./types/marketplace-types";

import { version } from "../package.json";
export const MARKETPLACE_VERSION = version;

export const LOCALSTORAGE_KEYS = {
  "installedExtensions": "marketplace:installed-extensions",
  "installedSnippets": "marketplace:installed-snippets",
  "installedThemes": "marketplace:installed-themes",
  "activeTab": "marketplace:active-tab",
  "tabs": "marketplace:tabs",
  "sortBy": "marketplace:sort-by",
  // Theme installed store the localsorage key of the theme (e.g. marketplace:installed:NYRI4/Comfy-spicetify/user.css)
  "themeInstalled": "marketplace:theme-installed",
  "colorShift": "marketplace:colorShift",
};

// Initalize topbar tabs
// Data initalized in TabBar.js
export const ALL_TABS: TabItemConfig[] = [
  { name: "Extensions", enabled: true },
  { name: "Themes", enabled: true },
  { name: "Snippets", enabled: true },
  { name: "Apps", enabled: true },
  { name: "Installed", enabled: true },
];

// Max GitHub API items per page
// https://docs.github.com/en/rest/reference/search#search-repositories
export const ITEMS_PER_REQUEST = 100;

export const CUSTOM_APP_PATH = "/marketplace";

// Used in Card.tsx
export const MAX_TAGS = 4;

export const SNIPPETS_URL = "https://raw.githubusercontent.com/spicetify/spicetify-marketplace/main/resources/snippets.json";

export const SNIPPETS_PAGE_URL = "https://github.com/spicetify/spicetify-marketplace/blob/main/resources/snippets.json";

export const BLACKLIST_URL = "https://raw.githubusercontent.com/spicetify/spicetify-marketplace/main/resources/blacklist.json";

export const LATEST_RELEASE = "https://api.github.com/repos/spicetify/spicetify-marketplace/releases";

export const RELEASE_CHANGELOG = `https://api.github.com/repos/spicetify/spicetify-marketplace/releases/tags/v${MARKETPLACE_VERSION}`;
