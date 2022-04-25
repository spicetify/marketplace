import React from "react";
import { getLocalStorageDataFromKey, generateSchemesOptions, injectColourScheme } from "../../logic/Utils";
import { LOCALSTORAGE_KEYS, ITEMS_PER_REQUEST } from "../constants";
import { openAddSnippetModal } from "../../logic/AddSnippetModal";
import {
  getExtensionRepos, fetchExtensionManifest,
  getThemeRepos, fetchThemeManifest,
  fetchCssSnippets, getBlacklist,
} from "../../logic/GetStuff";
import LoadMoreIcon from "./Icons/LoadMoreIcon";
import LoadingIcon from "./Icons/LoadingIcon";
import SettingsIcon from "./Icons/SettingsIcon";
import SortBox from "./Sortbox";
import { TopBarContent } from "./TabBar";
import Card from "./Card";

export default class Grid extends React.Component<
{
  title: string,
  CONFIG: any,
},
{
  // TODO: add types
  cards: any[],
  tabs: any,
  rest: boolean,
  endOfList: boolean,
  schemes: any,
  activeScheme: any,
  activeThemeKey: any,
}
> {
  constructor(props) {
    super(props);
    Object.assign(this, props);

    // Fetches the sorting options, fetched from SortBox.js
    this.sortConfig = {
      by: getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.sortBy, "top"),
    };

    this.state = {
      cards: [],
      tabs: props.CONFIG.tabs,
      rest: true,
      endOfList: false,
      schemes: props.CONFIG.theme.schemes,
      activeScheme: props.CONFIG.theme.activeScheme,
      activeThemeKey: props.CONFIG.theme.activeThemeKey,
    };
  }

  endOfList = false;
  lastScroll = 0;
  requestQueue: any[] = [];
  requestPage = 0;
  cardList: any[] = [];
  sortConfig: { by: string };
  // TODO: why are these set up funny?
  gridUpdateTabs: any;
  gridUpdatePostsVisual: any;
  checkScroll: any;
  CONFIG: any;
  BLACKLIST: any;

  // TODO: should I put this in Grid state?
  getInstalledTheme() {
    const installedThemeKey = localStorage.getItem(LOCALSTORAGE_KEYS.themeInstalled);
    if (!installedThemeKey) return null;

    const installedThemeDataStr = localStorage.getItem(installedThemeKey);
    if (!installedThemeDataStr) return null;

    const installedTheme = JSON.parse(installedThemeDataStr);
    return installedTheme;
  }

  newRequest(amount) {
    this.cardList = [];
    const queue = [];
    this.requestQueue.unshift(queue);
    this.loadAmount(queue, amount);
  }

  /**
   * @param {Object} item
   * @param {"extension" | "theme" | "snippet"} type The type of card
   */
  appendCard(item, type) {
    item.visual = this.props.CONFIG.visual;
    // Set key prop so items don't get stuck when switching tabs
    item.key = `${this.props.CONFIG.activeTab}:${item.title}`;
    item.type = type;
    // Pass along the functions to update Grid state on apply
    item.updateColourSchemes = this.updateColourSchemes.bind(this);
    item.updateActiveTheme = this.setActiveTheme.bind(this);
    // This isn't used other than to trigger a re-render
    item.activeThemeKey = this.state.activeThemeKey;
    item.CONFIG = this.CONFIG;
    this.cardList.push(React.createElement(Card, item));
    this.setState({ cards: this.cardList });
  }

  // TODO: this isn't currently used, but it will be used for sorting (based on the SortBox component)
  updateSort(sortByValue) {
    if (sortByValue) {
      this.sortConfig.by = sortByValue;
      localStorage.setItem(LOCALSTORAGE_KEYS.sortBy, sortByValue);
    }

    // this.requestPage = null;
    this.requestPage = 0;
    this.cardList = [];
    this.setState({
      cards: [],
      rest: false,
      endOfList: false,
    });
    this.endOfList = false;

    this.newRequest(ITEMS_PER_REQUEST);
  }

  updateTabs() {
    this.setState({
      tabs: [...this.props.CONFIG.tabs],
    });
  }

  updatePostsVisual() {
    this.cardList = this.cardList.map(card => {
      card.props.CONFIG = this.CONFIG;
      return React.createElement(Card, card.props);
    });
    this.setState({ cards: [...this.cardList] });
  }

  switchTo(value) {
    this.CONFIG.activeTab = value;
    localStorage.setItem(LOCALSTORAGE_KEYS.activeTab, value);
    this.cardList = [];
    // this.requestPage = null;
    this.requestPage = 0;
    this.setState({
      cards: [],
      rest: false,
      endOfList: false,
    });
    this.endOfList = false;

    this.newRequest(ITEMS_PER_REQUEST);
  }

  // This is called from loadAmount in a loop until it has the requested amount of cards or runs out of results
  // Returns the next page number to fetch, or null if at end
  // TODO: maybe we should rename `loadPage()`, since it's slightly confusing when we have github pages as well
  async loadPage(queue) {
    if (this.CONFIG.activeTab === "Extensions") {
      let pageOfRepos = await getExtensionRepos(this.requestPage, this.BLACKLIST);
      for (const repo of pageOfRepos.items) {
        let extensions = await fetchExtensionManifest(repo.contents_url, repo.default_branch, repo.stargazers_count, this.CONFIG.visual.hideInstalled);

        // I believe this stops the requests when switching tabs?
        if (this.requestQueue.length > 1 && queue !== this.requestQueue[0]) {
          // Stop this queue from continuing to fetch and append to cards list
          return -1;
        }

        if (extensions && extensions.length) {
          // console.log(`${repo.name} has ${extensions.length} extensions:`, extensions);
          extensions.forEach((extension) => this.appendCard(extension, "extension"));
        }
      }

      // First result is null or -1 so it coerces to 1
      const currentPage = this.requestPage > -1 && this.requestPage ? this.requestPage : 1;
      // Sets the amount of items that have thus been fetched
      const soFarResults = ITEMS_PER_REQUEST * (currentPage - 1) + pageOfRepos.page_count;
      const remainingResults = pageOfRepos.total_count - soFarResults;

      // If still have more results, return next page number to fetch
      console.log(`Parsed ${soFarResults}/${pageOfRepos.total_count} extensions`);
      if (remainingResults > 0) return currentPage + 1;
      else console.log("No more extension results");
    } else if (this.CONFIG.activeTab === "Installed") {
      const installedStuff = {
        theme: getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.installedThemes, []),
        extension: getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.installedExtensions, []),
        snippet: getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.installedSnippets, []),
      };

      for (const type in installedStuff) {
        if (installedStuff[type].length) {
          installedStuff[type].forEach(async (itemKey) => {
            // TODO: err handling
            const extension = getLocalStorageDataFromKey(itemKey);
            // I believe this stops the requests when switching tabs?
            if (this.requestQueue.length > 1 && queue !== this.requestQueue[0]) {
              // Stop this queue from continuing to fetch and append to cards list
              return -1;
            }

            this.appendCard(extension, type);
          });
        }
      }

      // Don't need to return a page number because
      // installed extension do them all in one go, since it's local
    } else if (this.CONFIG.activeTab == "Themes") {
      let pageOfRepos = await getThemeRepos(this.requestPage, this.BLACKLIST);
      for (const repo of pageOfRepos.items) {

        let themes = await fetchThemeManifest(repo.contents_url, repo.default_branch, repo.stargazers_count);
        // I believe this stops the requests when switching tabs?
        if (this.requestQueue.length > 1 && queue !== this.requestQueue[0]) {
          // Stop this queue from continuing to fetch and append to cards list
          return -1;
        }

        if (themes && themes.length) {
          themes.forEach((theme) => this.appendCard(theme, "theme"));
        }
      }

      // First request is null, so coerces to 1
      const currentPage = this.requestPage > -1 && this.requestPage ? this.requestPage : 1;
      // -1 because the page number is 1-indexed
      const soFarResults = ITEMS_PER_REQUEST * (currentPage - 1) + pageOfRepos.page_count;
      const remainingResults = pageOfRepos.total_count - soFarResults;

      console.log(`Parsed ${soFarResults}/${pageOfRepos.total_count} themes`);
      if (remainingResults > 0) return currentPage + 1;
      else console.log("No more theme results");
    } else if (this.CONFIG.activeTab == "Snippets") {
      let snippets = await fetchCssSnippets();

      if (this.requestQueue.length > 1 && queue !== this.requestQueue[0]) {
        // Stop this queue from continuing to fetch and append to cards list
        return -1;
      }
      if (snippets && snippets.length) {
        snippets.forEach((snippet) => this.appendCard(snippet, "snippet"));
      }
    }

    this.setState({ rest: true, endOfList: true });
    this.endOfList = true;
    // return null;
    // TODO: what does returning null mean?
    return 0
  }
  /**
   * Load a new set of extensions
   * @param {any} queue An array of the extensions to be loaded
   * @param {number} [quantity] Amount of extensions to be loaded per page. (Defaults to ITEMS_PER_REQUEST constant)
   */
  async loadAmount(queue, quantity = ITEMS_PER_REQUEST) {
    this.setState({ rest: false });
    quantity += this.cardList.length;

    this.requestPage = await this.loadPage(queue);

    while (
      this.requestPage &&
      this.requestPage !== -1 &&
      this.cardList.length < quantity &&
      !this.state.endOfList
    ) {
      this.requestPage = await this.loadPage(queue);
    }

    if (this.requestPage === -1) {
      this.requestQueue = this.requestQueue.filter(a => a !== queue);
      return;
    }

    // Remove this queue from queue list
    this.requestQueue.shift();
    this.setState({ rest: true });
  }

  /**
   * Load more items if there are more items to load.
   * @returns {void}
   */
  loadMore() {
    if (this.state.rest && !this.endOfList) {
      this.loadAmount(this.requestQueue[0], ITEMS_PER_REQUEST);
    }
  }

  /**
   * Update the colour schemes in the state + dropdown, and inject the active one
   * @param {any} schemes Object with the colour schemes
   * @param {string} activeScheme The name of the active colour scheme (a key in the schemes object)
   */
  updateColourSchemes(schemes, activeScheme) {
    console.log("updateColourSchemes", schemes, activeScheme);
    this.CONFIG.theme.schemes = schemes;
    this.CONFIG.theme.activeScheme = activeScheme;

    if (schemes && schemes[activeScheme]) {
      injectColourScheme(this.CONFIG.theme.schemes[activeScheme]);
    } else {
      // Reset schemes if none sent
      injectColourScheme(null);
    }

    // Save to localstorage
    const installedThemeKey = getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.themeInstalled);
    const installedThemeDataStr = getLocalStorageDataFromKey(installedThemeKey);
    const installedThemeData = JSON.parse(installedThemeDataStr);
    installedThemeData.activeScheme = activeScheme;
    localStorage.setItem(installedThemeKey, JSON.stringify(installedThemeData));

    this.setState({
      schemes,
      activeScheme,
    });
  }

  /**
   * The componentDidMount() method is called when the component is first loaded.
   * It checks if the cardList is already loaded. If it is, it checks if the lastScroll value is
   greater than 0.
  * If it is, it scrolls to the lastScroll value. If it isn't, it scrolls to the top of the page.
  * If the cardList isn't loaded, it loads the cardList.
  */
  async componentDidMount() {
    this.gridUpdateTabs = this.updateTabs.bind(this);
    this.gridUpdatePostsVisual = this.updatePostsVisual.bind(this);

    const viewPort = document.querySelector(".os-viewport");
    this.checkScroll = this.isScrolledBottom.bind(this);
    if (viewPort) {
      viewPort.addEventListener("scroll", this.checkScroll);
      if (this.cardList.length) { // Already loaded
        if (this.lastScroll > 0) {
          viewPort.scrollTo(0, this.lastScroll);
        }
        return;
      }
    }

    // Load blacklist
    this.BLACKLIST = await getBlacklist();
    this.newRequest(ITEMS_PER_REQUEST);
  }

  /**
   * When the component is unmounted, remove the scroll event listener.
   * @returns {void}
   */
  componentWillUnmount() {
    this.gridUpdateTabs = this.gridUpdatePostsVisual = null;
    const viewPort = document.querySelector(".os-viewport");
    if (viewPort) {
      this.lastScroll = viewPort.scrollTop;
      viewPort.removeEventListener("scroll", this.checkScroll);
    }
  }

  /**
   * If the user has scrolled to the bottom of the page, load more posts.
   * @param event - The event object that is passed to the callback function.
   * @returns {void}
   */
  isScrolledBottom(event) {
    const viewPort = event.target;
    if ((viewPort.scrollTop + viewPort.clientHeight) >= viewPort.scrollHeight) {
      // At bottom, load more posts
      this.loadMore();
    }
  }

  setActiveTheme(themeKey) {
    this.BLACKLIST.theme.activeThemeKey = themeKey;
    this.setState({ activeThemeKey: themeKey });
  }

  // TODO: clean this up. It worked when I was using state, but state seems like pointless overhead.
  getActiveScheme() {
    return this.state.activeScheme;
  }

  render() {
      return React.createElement("section", {
          className: "contentSpacing",
      },
      React.createElement("div", {
          className: "marketplace-header",
      }, React.createElement("h1", null, this.props.title),
      // Start of marketplace-header__right
      React.createElement("div", {
          className: "marketplace-header__right",
      },
      // Show colour scheme dropdown if there is a theme with schemes installed
      this.state.activeScheme ? React.createElement(SortBox, {
          onChange: (value) => this.updateColourSchemes(this.state.schemes, value),
          // TODO: Make this compatible with the changes to the theme install process: need to create a method to update the scheme options without a full reload.
          sortBoxOptions: generateSchemesOptions(this.state.schemes),
          // It doesn't work when I directly use CONFIG.theme.activeScheme in the sortBySelectedFn
          // because it hardcodes the value into the fn
          sortBySelectedFn: (a) => a.key === this.getActiveScheme(),
      }) : null,
      React.createElement("button", {
          className: "marketplace-settings-button",
          id: "marketplace-settings-button",

          // onClick: openConfig,
          onClick: () => { console.log('TODO: add settings modal')},
      }, SettingsIcon),
      // End of marketplace-header__right
      ),
          // TODO: Add search bar and sort functionality
          // React.createElement("div", {
          //     className: "searchbar--bar__wrapper",
          // }, React.createElement("input", {
          //     className: "searchbar-bar",
          //     type: "text",
          //     placeholder: "Search for Extensions?",
          // })),
      ),
      [ // Add a header and grid for each card type if it has any cards
          { handle: "extension", name: "Extensions" },
          { handle: "theme", name: "Themes" },
          { handle: "snippet", name: "Snippets" },
      ].map((cardType) => {
          const cardsOfType = this.cardList.filter((card) => card.props.type === cardType.handle)
              .map((card) => {
                  // Clone the cards and update the prop to trigger re-render
                  // TODO: is it possible to only re-render the theme cards whose status have changed?
                  const cardElement = React.cloneElement(card, {
                      activeThemeKey: this.state.activeThemeKey,
                  });
                  return cardElement;
              });

          if (cardsOfType.length) {
              return [
                  // Add a header for the card type
                  React.createElement("h2",
                      { className: "marketplace-card-type-heading" },
                      cardType.name),
                  // Add the grid and cards
                  React.createElement("div", {
                      className: "marketplace-grid main-gridContainer-gridContainer main-gridContainer-fixedWidth",
                      "data-tab": this.CONFIG.activeTab,
                      style: {
                          "--minimumColumnWidth": "180px",
                          "--column-width": "minmax(var(--minimumColumnWidth),1fr)",
                          "--column-count": "auto-fill",
                          "--grid-gap": "24px",
                      },
                  }, cardsOfType)];
          } else {
              return null;
          }
      }), React.createElement("footer", {
          style: {
              margin: "auto",
              textAlign: "center",
          },
      }, !this.state.endOfList && (this.state.rest ? React.createElement(LoadMoreIcon, { onClick: this.loadMore.bind(this) }) : React.createElement(LoadingIcon)),
      // Add snippets button if on snippets tab
      this.CONFIG.activeTab === "Snippets" ? React.createElement("button", {
          className: "marketplace-add-snippet-btn main-buttons-button main-button-secondary",
          onClick: openAddSnippetModal,
      }, "+Add CSS") : null,
      ), React.createElement(TopBarContent, {
          switchCallback: this.switchTo.bind(this),
          links: this.CONFIG.tabs,
          activeLink: this.CONFIG.activeTab,
      }));
  }
}
