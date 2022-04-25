// import styles from './styles/app.module.scss'
import React from 'react'

// TODO: the mono-stylesheet doesn't seem to import the component stylesheets properly on build?
// import './styles/styles.scss'
import './styles/styles.css'

import Grid from './components/Grid';
import { getLocalStorageDataFromKey } from '../logic/Utils';
import { ALL_TABS, LOCALSTORAGE_KEYS } from './constants';

class App extends React.Component<{}, {count: number}> {
  state = {
    count: 0,
  };

  location: any;
  CONFIG: any;
	constructor(props: any) {
		super(props);
		this.location = Spicetify.Platform.History.location;

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
        const installedThemeDataStr = getLocalStorageDataFromKey(installedThemeKey, null);
        if (!installedThemeDataStr) throw new Error("No installed theme data");

        const installedTheme = JSON.parse(installedThemeDataStr);
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
      activeTab: localStorage.getItem(LOCALSTORAGE_KEYS.activeTab),
      theme: {
        activeThemeKey: localStorage.getItem(LOCALSTORAGE_KEYS.themeInstalled, null),
        schemes,
        activeScheme,
      },
    };

    if (!this.CONFIG.activeTab || !this.CONFIG.tabs.filter(tab => tab.name === this.CONFIG.activeTab).length) {
      this.CONFIG.activeTab = this.CONFIG.tabs[0].name;
    }
	}

  // onButtonClick = () => {
  //   this.setState((state) => {
  //     return {
  //       count: state.count+1,
  //     }
  //   });
  // };

  render() {
    // If page state set to display readme, render it
    // (This location state data comes from Card.openReadme())
    if (location.pathname === "/spicetify-marketplace/readme") {
      return <div>
        <h1>TODO: readme pages</h1>
      </div>;
      // return react.createElement(ReadmePage, {
      //     title: "Spicetify Marketplace - Readme",
      //     data: this.location.state.data,
      // });
    } // Otherwise, render the main Grid
    else {
      return <Grid title="Spicetify Marketplace" CONFIG={this.CONFIG} />
    }

    return <>
      <div className={styles.container}>
        <div className={styles.title}>{"My Custom App!"}</div>
        <button className={styles.button} onClick={this.onButtonClick}>{"Count up"}</button>
        <div className={styles.counter}>{this.state.count}</div>
      </div>
    </>
  }
}

export default App;
