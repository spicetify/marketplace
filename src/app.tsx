import i18n, { t } from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import React from "react";
import { initReactI18next, withTranslation } from "react-i18next";

import "./styles/styles.scss";
import Grid from "./components/Grid";
import ReadmePage from "./components/ReadmePage";
import { ALL_TABS, CUSTOM_APP_PATH, LOCALSTORAGE_KEYS } from "./constants";
import { hydrateMarketplaceStorage, marketplaceStorage } from "./logic/Storage";
import { getLocalStorageDataFromKey } from "./logic/Utils";
import locales from "./resources/locales";
import type { Config, TabItemConfig } from "./types/marketplace-types";

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .use(LanguageDetector)
  .init({
    // the translations
    resources: locales,
    detection: {
      order: ["navigator", "htmlTag"]
    },
    // lng: "en", // if you're using a language detector, do not define the lng option
    fallbackLng: "en",
    interpolation: {
      escapeValue: false // react already safes from xss => https://www.i18next.com/translation-function/interpolation#unescape
    }
  });

class App extends React.Component<
  {
    t: (key: string) => string;
  },
  {
    count: number;
    CONFIG: Config;
    storageReady: boolean;
  }
> {
  state = {
    count: 0,
    CONFIG: {} as Config,
    storageReady: false
  };

  CONFIG: Config;
  constructor(props) {
    super(props);
    this.CONFIG = this.createConfig();
    this.state.CONFIG = this.CONFIG;
  }

  createConfig() {
    // Get tabs config from local storage
    const tabsData = getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.tabs, null);
    let tabs: TabItemConfig[] = [];
    try {
      tabs = tabsData;

      if (!Array.isArray(tabs)) {
        throw new Error("Could not parse marketplace tabs key");
      }
      if (tabs.length === 0) {
        throw new Error("Empty marketplace tabs key");
      }
      if (tabs.filter((tab) => !tab).length > 0) {
        throw new Error("Falsey marketplace tabs key");
      }
    } catch {
      tabs = ALL_TABS;
      marketplaceStorage.setItem(LOCALSTORAGE_KEYS.tabs, JSON.stringify(tabs));
    }

    // Get active theme
    let schemes = {};
    let activeScheme = null;
    try {
      const installedThemeKey = getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.themeInstalled, null);
      if (installedThemeKey) {
        const installedTheme = getLocalStorageDataFromKey(installedThemeKey, null);
        if (!installedTheme) throw new Error("No installed theme data");

        schemes = installedTheme.schemes;
        activeScheme = installedTheme.activeScheme;
      } else {
        console.debug("No theme set as installed");
      }
    } catch (err) {
      console.error(err);
    }

    const config = {
      // Fetch the settings and set defaults. Used in Settings.js
      visual: {
        stars: JSON.parse(getLocalStorageDataFromKey("marketplace:stars", true)),
        tags: JSON.parse(getLocalStorageDataFromKey("marketplace:tags", true)),
        showArchived: JSON.parse(getLocalStorageDataFromKey("marketplace:showArchived", false)),
        hideInstalled: JSON.parse(getLocalStorageDataFromKey("marketplace:hideInstalled", false)),
        colorShift: JSON.parse(getLocalStorageDataFromKey("marketplace:colorShift", false)),
        themeDevTools: JSON.parse(getLocalStorageDataFromKey("marketplace:themeDevTools", false)),
        albumArtBasedColors: JSON.parse(getLocalStorageDataFromKey("marketplace:albumArtBasedColors", false)),
        albumArtBasedColorsMode: getLocalStorageDataFromKey("marketplace:albumArtBasedColorsMode") || "monochrome-light",
        albumArtBasedColorsVibrancy: getLocalStorageDataFromKey("marketplace:albumArtBasedColorsVibrancy") || "PROMINENT",
        // Legacy from reddit app
        type: JSON.parse(getLocalStorageDataFromKey("marketplace:type", false)),
        // I was considering adding watchers as "followers" but it looks like the value is a duplicate
        // of stargazers, and the subscribers_count isn't returned in the main API call we make
        // https://github.community/t/bug-watchers-count-is-the-duplicate-of-stargazers-count/140865/4
        followers: JSON.parse(getLocalStorageDataFromKey("marketplace:followers", false))
      },
      tabs,
      activeTab: getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.activeTab, tabs[0]),
      theme: {
        activeThemeKey: getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.themeInstalled, null),
        schemes,
        activeScheme
      },
      sort: getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.sort, "stars")
    };

    if (!config.activeTab || !config.tabs.filter((tab) => tab.name === config.activeTab).length) {
      config.activeTab = config.tabs[0].name;
    }

    return config;
  }

  async componentDidMount() {
    await hydrateMarketplaceStorage();
    this.CONFIG = this.createConfig();
    this.setState({
      CONFIG: this.CONFIG,
      storageReady: true
    });
  }

  updateConfig = (config: Config) => {
    this.CONFIG = { ...config };
    console.debug("updated config", this.CONFIG);
    this.setState({
      CONFIG: { ...config }
    });
  };

  render() {
    if (!this.state.storageReady) return null;

    const { location, replace } = Spicetify.Platform.History;
    // If page state set to display readme, render it
    // (This location state data comes from Card.openReadme())
    if (location.pathname === `${CUSTOM_APP_PATH}/readme`) {
      // If no data, redirect to main page
      if (!location.state?.data) {
        replace(CUSTOM_APP_PATH);
        return null;
      }
      return <ReadmePage title={t("readmePage.title")} data={location.state.data} />;
    }

    return <Grid title={t("grid.spicetifyMarketplace")} CONFIG={this.CONFIG} updateAppConfig={this.updateConfig} />;
  }
}

export default withTranslation()(App);
