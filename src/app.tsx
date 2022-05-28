// import styles from './styles/app.module.scss'
import React from 'react'
import { Config } from './types/marketplace-types';

// TODO: the mono-stylesheet doesn't seem to import nested component stylesheets properly on build?
// import './styles/styles.scss';
import './styles/components/_grid.scss';
import './styles/components/_card.scss';
import './styles/components/_settings.scss';
import './styles/components/_reload-modal.scss';
import './styles/components/_add-snippet-modal.scss';
import './styles/components/_readme-pages.scss';
import './styles/components/_fixes.scss';

import Grid from './components/Grid';
import ReadmePage from './components/ReadmePage';
import { getLocalStorageDataFromKey } from '../logic/Utils';
import { ALL_TABS, LOCALSTORAGE_KEYS, CUSTOM_APP_PATH } from './constants';

class App extends React.Component<{}, {count: number, CONFIG: any}> {
  state = {
    count: 0,
    CONFIG: {} as Config,
  };

  CONFIG: Config;
	constructor(props: any) {
		super(props);

    // Get tabs config from local storage
    let tabsString = getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.tabs, null);
    let tabs:any[] = [];
    try {
      tabs = JSON.parse(tabsString);
      if (!Array.isArray(tabs)) {
        throw new Error("Could not parse marketplace tabs key");
      } else if (tabs.length === 0) {
        throw new Error("Empty marketplace tabs key");
      } else if (tabs.filter(tab => !tab).length > 0) {
        throw new Error("Falsey marketplace tabs key");
      }
    } catch {
      tabs = ALL_TABS;
      localStorage.setItem(LOCALSTORAGE_KEYS.tabs, JSON.stringify(tabs));
    }

    // Get active theme
    let schemes = [];
    let activeScheme = null;
    try {
      const installedThemeKey = getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.themeInstalled, null);
      if (installedThemeKey) {
        const installedTheme = getLocalStorageDataFromKey(installedThemeKey, null);
        if (!installedTheme) throw new Error("No installed theme data");

        schemes = installedTheme.schemes;
        activeScheme = installedTheme.activeScheme;
      } else {
        console.log("No theme set as installed");
      }
    } catch (err) {
      console.error(err);
    }

    this.CONFIG = {
      // Fetch the settings and set defaults. Used in Settings.js
      visual: {
        stars: JSON.parse(getLocalStorageDataFromKey("marketplace:stars", true)),
        tags: JSON.parse(getLocalStorageDataFromKey("marketplace:tags", true)),
        hideInstalled: JSON.parse(getLocalStorageDataFromKey("marketplace:hideInstalled", false)),
        colorShift: JSON.parse(getLocalStorageDataFromKey("marketplace:colorShift", false)),
        // Legacy from reddit app
        type: JSON.parse(getLocalStorageDataFromKey("marketplace:type", false)),
        // I was considering adding watchers as "followers" but it looks like the value is a duplicate
        // of stargazers, and the subscribers_count isn't returned in the main API call we make
        // https://github.community/t/bug-watchers-count-is-the-duplicate-of-stargazers-count/140865/4
        followers: JSON.parse(getLocalStorageDataFromKey("marketplace:followers", false)),
      },
      tabs,
      activeTab: getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.activeTab, tabs[0]),
      theme: {
        activeThemeKey: getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.themeInstalled, null),
        schemes,
        activeScheme,
      },
    };

    if (!this.CONFIG.activeTab || !this.CONFIG.tabs.filter(tab => tab.name === this.CONFIG.activeTab).length) {
      this.CONFIG.activeTab = this.CONFIG.tabs[0].name;
    }
	}

  updateConfig = (config: any) => {
    this.CONFIG = {...config};
    console.log('updated config', this.CONFIG);
    this.setState({
      CONFIG: {...config},
    });
  }

  render() {
    const { location } = Spicetify.Platform.History;
    // If page state set to display readme, render it
    // (This location state data comes from Card.openReadme())
    if (location.pathname === `${CUSTOM_APP_PATH}/readme`) {
      return <ReadmePage title='Spicetify Marketplace - Readme' data={location.state.data} />;
    } // Otherwise, render the main Grid
    else {
      return <Grid title="Spicetify Marketplace" CONFIG={this.CONFIG} triggerRefresh={this.updateConfig} />
    }
  }
}

export default App;
