import { version } from "../package.json";
import type { TabItemConfig } from "./types/marketplace-types";

export const MARKETPLACE_VERSION = version;

const STORAGE_KEY_PREFIX = "marketplace";
export const LOCALSTORAGE_KEYS = {
  installedExtensions: `${STORAGE_KEY_PREFIX}:installed-extensions`,
  installedSnippets: `${STORAGE_KEY_PREFIX}:installed-snippets`,
  installedThemes: `${STORAGE_KEY_PREFIX}:installed-themes`,
  activeTab: `${STORAGE_KEY_PREFIX}:active-tab`,
  tabs: `${STORAGE_KEY_PREFIX}:tabs`,
  sort: `${STORAGE_KEY_PREFIX}:sort`,
  // Theme installed store the localsorage key of the theme (e.g. marketplace:installed:NYRI4/Comfy-spicetify/user.css)
  themeInstalled: `${STORAGE_KEY_PREFIX}:theme-installed`,
  localTheme: `${STORAGE_KEY_PREFIX}:local-theme`,
  albumArtBasedColor: `${STORAGE_KEY_PREFIX}:albumArtBasedColors`,
  albumArtBasedColorMode: `${STORAGE_KEY_PREFIX}:albumArtBasedColorsMode`,
  albumArtBasedColorVibrancy: `${STORAGE_KEY_PREFIX}:albumArtBasedColorsVibrancy`,
  colorShift: `${STORAGE_KEY_PREFIX}:colorShift`
};

// Initalize topbar tabs
// Data initalized in TabBar.js
export const ALL_TABS: TabItemConfig[] = [
  { name: "Extensions", enabled: true },
  { name: "Themes", enabled: true },
  { name: "Snippets", enabled: true },
  { name: "Apps", enabled: true },
  { name: "Installed", enabled: true }
];

// Max GitHub API items per page
// https://docs.github.com/en/rest/reference/search#search-repositories
export const ITEMS_PER_REQUEST = 100;

export const CUSTOM_APP_PATH = "/marketplace";

// Used in Card.tsx
export const MAX_TAGS = 4;

export const SNIPPETS_PAGE_URL = "https://github.com/spicetify/marketplace/blob/main/resources/snippets.json";

export const SNIPPETS_URL = "https://raw.githubusercontent.com/spicetify/marketplace/main/resources/snippets.json";

export const BLACKLIST_URL = "https://raw.githubusercontent.com/spicetify/marketplace/main/resources/blacklist.json";

export const RELEASES_URL = "https://github.com/spicetify/marketplace/releases";

export const LATEST_RELEASE_URL = "https://api.github.com/repos/spicetify/marketplace/releases/latest";
