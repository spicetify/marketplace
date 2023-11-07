import React from "react";
import { withTranslation } from "react-i18next";
import semver from "semver";
import { Option } from "react-dropdown";
const Spicetify = window.Spicetify;

import { CardItem, CardType, Config, SchemeIni, Snippet, TabItemConfig } from "../types/marketplace-types";
import { getLocalStorageDataFromKey,
  generateSchemesOptions,
  injectColourScheme,
  generateSortOptions,
  sortCardItems,
} from "../logic/Utils";
import { LOCALSTORAGE_KEYS, ITEMS_PER_REQUEST, MARKETPLACE_VERSION, LATEST_RELEASE_URL } from "../constants";
import { openModal } from "../logic/LaunchModals";
import {
  getTaggedRepos,
  fetchExtensionManifest, fetchThemeManifest, fetchAppManifest,
  fetchCssSnippets, getBlacklist,
} from "../logic/FetchRemotes";
import LoadMoreIcon from "./Icons/LoadMoreIcon";
import LoadingIcon from "./Icons/LoadingIcon";
import SettingsIcon from "./Icons/SettingsIcon";
import ThemeDeveloperToolsIcon from "./Icons/ThemeDeveloperToolsIcon";
import SortBox from "./Sortbox";
import { TopBarContent } from "./TabBar";
import Card from "./Card/Card";
import Button from "./Button";
import DownloadIcon from "./Icons/DownloadIcon";

class Grid extends React.Component<
{
  title: string,
  CONFIG: Config,
  updateAppConfig: (CONFIG: Config) => void,
  // TODO: there's probably a better way to make TS not complain about the withTranslation HOC
  t: (key: string) => string,
},
{
  version: string,
  newUpdate: boolean,
  searchValue: string,
  cards: Card[],
  tabs: TabItemConfig[],
  rest: boolean,
  endOfList: boolean,
  activeThemeKey?: string,
  schemes: SchemeIni,
  activeScheme?: string | null,
}
> {
  constructor(props) {
    super(props);
    Object.assign(this, props);
    this.updateAppConfig = props.updateAppConfig.bind(this);

    // Fetches the sorting options, fetched from SortBox.js
    this.sortConfig = {
      by: getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.sort, "top"),
    };

    this.state = {
      version: MARKETPLACE_VERSION,
      newUpdate: false,
      searchValue: "",
      cards: [],
      tabs: props.CONFIG.tabs,
      rest: true,
      endOfList: false,
      schemes: props.CONFIG.theme.schemes,
      activeScheme: props.CONFIG.theme.activeScheme,
      activeThemeKey: props.CONFIG.theme.activeThemeKey,
    };
  }

  searchRequested: boolean;
  endOfList = false;
  lastScroll = 0;
  requestQueue: never[][] = [];
  requestPage = 0;
  cardList: Card[] = [];
  sortConfig: { by: string };
  // TODO: why are these set up funny
  // To get to the other side
  gridUpdateTabs: (() => void) | null;
  gridUpdatePostsVisual: (() => void) | null;
  checkScroll: (e: Event) => void;
  CONFIG: Config;
  updateAppConfig: (CONFIG: Config) => void;
  BLACKLIST: string[] | undefined;

  // TODO: should I put this in Grid state?
  getInstalledTheme() {
    const installedThemeKey = localStorage.getItem(LOCALSTORAGE_KEYS.themeInstalled);
    if (!installedThemeKey) return null;

    const installedThemeDataStr = localStorage.getItem(installedThemeKey);
    if (!installedThemeDataStr) return null;

    const installedTheme = JSON.parse(installedThemeDataStr);
    return installedTheme;
  }

  newRequest(amount: number | undefined) {
    this.cardList = [];
    const queue = [];
    this.requestQueue.unshift(queue);
    this.loadAmount(queue, amount);
  }

  /**
   * @param {CardItem} item
   * @param type The type of card
   */
  appendCard(item: CardItem | Snippet, type: CardType, activeTab: string) {
    if (activeTab !== this.props.CONFIG.activeTab) return;

    const card = <Card
      item={item}
      // Set key prop so items don't get stuck when switching tabs
      key={`${this.props.CONFIG.activeTab}:${item.user}:${item.title}`}
      CONFIG={this.CONFIG}
      visual={this.props.CONFIG.visual}
      type={type}
      // This isn't used other than to trigger a re-render
      activeThemeKey={this.state.activeThemeKey}
      // Pass along the functions to update Grid state on apply
      updateColourSchemes={this.updateColourSchemes.bind(this)}
      updateActiveTheme={this.setActiveTheme.bind(this)}
    />;

    this.cardList.push(card as unknown as Card);
  }

  // TODO: this isn't currently used, but it will be used for sorting (based on the SortBox component)
  updateSort(sortByValue) {
    if (sortByValue) {
      this.sortConfig.by = sortByValue;
      localStorage.setItem(LOCALSTORAGE_KEYS.sort, sortByValue);
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
    this.cardList = this.cardList.map((card, index) => {
      return <Card {...card.props}
        key={index.toString()} CONFIG={this.CONFIG} />;
    }) as unknown as Card[];
    this.setState({ cards: [...this.cardList] });
  }

  switchTo(option: Option) {
    this.CONFIG.activeTab = option.value;
    localStorage.setItem(LOCALSTORAGE_KEYS.activeTab, option.value);
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
  async loadPage(queue: never[]) {
    // Store value for comparison later
    const activeTab = this.CONFIG.activeTab;
    switch (activeTab) {
    case "Extensions": {
      const pageOfRepos = await getTaggedRepos("spicetify-extensions", this.requestPage, this.BLACKLIST);
      const extensions: CardItem[] = [];
      for (const repo of pageOfRepos.items) {
        const repoExtensions = await fetchExtensionManifest(
          repo.contents_url,
          repo.default_branch,
          repo.stargazers_count,
          this.CONFIG.visual.hideInstalled,
        );

        // I believe this stops the requests when switching tabs?
        if (this.requestQueue.length > 1 && queue !== this.requestQueue[0]) {
          // Stop this queue from continuing to fetch and append to cards list
          return -1;
        }

        if (repoExtensions && repoExtensions.length) {
          extensions.push(...repoExtensions.map((extension) => ({
            ...extension, lastUpdated: repo.pushed_at, created: repo.created_at,
          })));
        }
      }

      sortCardItems(extensions, localStorage.getItem("marketplace:sort") || "stars");

      for (const extension of extensions) {
        this.appendCard(extension, "extension", activeTab);
      }
      this.setState({ cards: this.cardList });

      // First result is null or -1 so it coerces to 1
      const currentPage = this.requestPage > -1 && this.requestPage ? this.requestPage : 1;
      // Sets the amount of items that have thus been fetched
      const soFarResults = ITEMS_PER_REQUEST * (currentPage - 1) + pageOfRepos.page_count;
      const remainingResults = pageOfRepos.total_count - soFarResults;

      // If still have more results, return next page number to fetch
      console.debug(`Parsed ${soFarResults}/${pageOfRepos.total_count} extensions`);
      if (remainingResults > 0) return currentPage + 1;
      else console.debug("No more extension results");
      break;
    } case "Installed": {
      const installedStuff = {
        theme: getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.installedThemes, []),
        extension: getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.installedExtensions, []),
        snippet: getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.installedSnippets, []),
      };

      for (const type in installedStuff) {
        if (installedStuff[type].length) {
          const installedOfType: CardItem[] = [];
          installedStuff[type].forEach(async (itemKey) => {
            // TODO: err handling
            const installedItem = getLocalStorageDataFromKey(itemKey);
            // I believe this stops the requests when switching tabs?
            if (this.requestQueue.length > 1 && queue !== this.requestQueue[0]) {
              // Stop this queue from continuing to fetch and append to cards list
              return -1;
            }

            installedOfType.push(installedItem);
          });

          sortCardItems(installedOfType, localStorage.getItem("marketplace:sort") || "stars");

          for (const item of installedOfType) {
            this.appendCard(item, type as CardType, activeTab);
          }
        }
      }
      this.setState({ cards: this.cardList });
      break;

      // Don't need to return a page number because
      // installed extension do them all in one go, since it's local
    } case "Themes": {
      const pageOfRepos = await getTaggedRepos("spicetify-themes", this.requestPage, this.BLACKLIST);
      const themes: CardItem[] = [];
      for (const repo of pageOfRepos.items) {
        const repoThemes = await fetchThemeManifest(
          repo.contents_url,
          repo.default_branch,
          repo.stargazers_count,
        );

        // I believe this stops the requests when switching tabs?
        if (this.requestQueue.length > 1 && queue !== this.requestQueue[0]) {
          // Stop this queue from continuing to fetch and append to cards list
          return -1;
        }

        if (repoThemes && repoThemes.length) {
          themes.push(...repoThemes.map(
            (theme) => ({
              ...theme,
              lastUpdated: repo.pushed_at,
              created: repo.created_at,
            }),
          ));
        }
      }
      this.setState({ cards: this.cardList });

      sortCardItems(themes, localStorage.getItem("marketplace:sort") || "stars");

      for (const theme of themes) {
        this.appendCard(theme, "theme", activeTab);
      }

      // First request is null, so coerces to 1
      const currentPage = this.requestPage > -1 && this.requestPage ? this.requestPage : 1;
      // -1 because the page number is 1-indexed
      const soFarResults = ITEMS_PER_REQUEST * (currentPage - 1) + pageOfRepos.page_count;
      const remainingResults = pageOfRepos.total_count - soFarResults;

      console.debug(`Parsed ${soFarResults}/${pageOfRepos.total_count} themes`);
      if (remainingResults > 0) return currentPage + 1;
      else console.debug("No more theme results");
      break;
    }
    case "Apps": {
      const pageOfRepos = await getTaggedRepos("spicetify-apps", this.requestPage, this.BLACKLIST);
      const apps: CardItem[] = [];

      for (const repo of pageOfRepos.items) {
        const repoApps = await fetchAppManifest(
          repo.contents_url,
          repo.default_branch,
          repo.stargazers_count,
        );
        // I believe this stops the requests when switching tabs?
        if (this.requestQueue.length > 1 && queue !== this.requestQueue[0]) {
          // Stop this queue from continuing to fetch and append to cards list
          return -1;
        }

        if (repoApps && repoApps.length) {
          apps.push(...repoApps.map((app) => ({
            ...app,
            lastUpdated: repo.pushed_at,
            created: repo.created_at,
          })));
        }
      }
      this.setState({ cards: this.cardList });

      sortCardItems(apps, localStorage.getItem("marketplace:sort") || "stars");

      for (const app of apps) {
        this.appendCard(app, "app", activeTab);
      }

      // First request is null, so coerces to 1
      const currentPage = this.requestPage > -1 && this.requestPage ? this.requestPage : 1;
      // -1 because the page number is 1-indexed
      const soFarResults = ITEMS_PER_REQUEST * (currentPage - 1) + pageOfRepos.page_count;
      const remainingResults = pageOfRepos.total_count - soFarResults;

      console.debug(`Parsed ${soFarResults}/${pageOfRepos.total_count} apps`);
      if (remainingResults > 0) return currentPage + 1;
      else console.debug("No more app results");
      break;
    } case "Snippets": {
      const snippets = await fetchCssSnippets();

      if (this.requestQueue.length > 1 && queue !== this.requestQueue[0]) {
        // Stop this queue from continuing to fetch and append to cards list
        return -1;
      }

      if (snippets && snippets.length) {
        sortCardItems(snippets, localStorage.getItem("marketplace:sort") || "stars");
        snippets.forEach((snippet) => this.appendCard(snippet, "snippet", activeTab));
        this.setState({ cards: this.cardList });
      }
    }}

    this.setState({ rest: true, endOfList: true });
    this.endOfList = true;

    return 0;
  }
  /**
   * Load a new set of extensions
   * @param {any} queue An array of the extensions to be loaded
   * @param {number} [quantity] Amount of extensions to be loaded per page. (Defaults to ITEMS_PER_REQUEST constant)
   */
  async loadAmount(queue: never[], quantity: number = ITEMS_PER_REQUEST) {
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
   * @param schemes Object with the colour schemes
   * @param activeScheme The name of the active colour scheme (a key in the schemes object)
   */
  updateColourSchemes(schemes: SchemeIni, activeScheme: string | null) {
    console.debug("updateColourSchemes", schemes, activeScheme);
    this.CONFIG.theme.schemes = schemes;
    this.CONFIG.theme.activeScheme = activeScheme;
    if (activeScheme) Spicetify.Config.color_scheme = activeScheme;

    if (schemes && activeScheme && schemes[activeScheme]) {
      injectColourScheme(this.CONFIG.theme.schemes[activeScheme]);
    } else {
      // Reset schemes if none sent
      injectColourScheme(null);
    }

    // Save to localstorage
    const installedThemeKey = getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.themeInstalled);
    const installedThemeData = getLocalStorageDataFromKey(installedThemeKey);
    if (installedThemeData) {
      installedThemeData.activeScheme = activeScheme;
      console.debug(installedThemeData);
      localStorage.setItem(installedThemeKey, JSON.stringify(installedThemeData));
    } else {
      console.debug("No installed theme data");
    }

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
    // Checks for new Marketplace updates
    fetch(LATEST_RELEASE_URL).then(res => res.json()).then(
      result => {
        if (result.message) throw result;
        this.setState({
          version: result.name,
        });

        try {
          this.setState({ newUpdate: semver.gt(this.state.version, MARKETPLACE_VERSION) });
        } catch (err) {
          console.error(err);
        }
      },
      error => {
        console.error("Failed to check for updates", error);
      },
    );

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
  componentWillUnmount(): void {
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
   */
  // Add scroll event listener with type
  isScrolledBottom(event: Event): void {
    const viewPort = event.target as HTMLElement;
    if ((viewPort.scrollTop + viewPort.clientHeight) >= viewPort.scrollHeight) {
      // At bottom, load more posts
      this.loadMore();
    }
  }

  setActiveTheme(themeKey: string) {
    this.CONFIG.theme.activeThemeKey = themeKey;
    this.setState({ activeThemeKey: themeKey });
  }

  // TODO: clean this up. It worked when I was using state, but state seems like pointless overhead.
  getActiveScheme() {
    return this.state.activeScheme;
  }

  render() {
    const { t } = this.props;
    return (
      <section className="contentSpacing">
        <div className="marketplace-header">
          <div className="marketplace-header__left">
            {this.state.newUpdate
              ? <button type="button" title={t("grid.newUpdate")} className="marketplace-header-icon-button" id="marketplace-update"
                onClick={() => openModal("UPDATE")}
              >
                <DownloadIcon />
                &nbsp;{this.state.version}
              </button>
              : null}
            {/* Generate a new box for sorting options */}
            <h2 className="marketplace-header__label">{t("grid.sort.label")}</h2>
            <SortBox
              onChange={(value) => this.updateSort(value)}
              sortBoxOptions={generateSortOptions(t)}
              sortBySelectedFn={(a) => a.key === this.CONFIG.sort} />
          </div>
          <div className="marketplace-header__right">
            {/* Show theme developer tools button if themeDevTools is enabled */}
            {this.CONFIG.visual.themeDevTools
              ? <Spicetify.ReactComponent.TooltipWrapper label={t("devTools.title")} renderInline={true} placement="bottom">
                <button type="button" aria-label={t("devTools.title")} className="marketplace-header-icon-button"
                  onClick={() => openModal("THEME_DEV_TOOLS")}>
                  <ThemeDeveloperToolsIcon/>
                </button>
              </Spicetify.ReactComponent.TooltipWrapper>
              : null}
            {/* Show colour scheme dropdown if there is a theme with schemes installed */}
            {this.state.activeScheme ? <SortBox
              onChange={(value) => this.updateColourSchemes(this.state.schemes, value)}
              // TODO: Make this compatible with the changes to the theme install process: need to create a method to update the scheme options without a full reload.
              sortBoxOptions={generateSchemesOptions(this.state.schemes)}
              // It doesn't work when I directly use CONFIG.theme.activeScheme in the sortBySelectedFn
              // because it hardcodes the value into the fn
              sortBySelectedFn={(a) => a.key === this.getActiveScheme()} /> : null}
            <div className="searchbar--bar__wrapper">
              <input
                className="searchbar-bar"
                type="text"
                placeholder={`${t("grid.search")} ${t(`tabs.${this.CONFIG.activeTab}`)}...`}
                value={this.state.searchValue}
                onChange={(event) => {
                  this.setState({ searchValue: event.target.value });
                }} />
            </div>
            <Spicetify.ReactComponent.TooltipWrapper label={t("settings.title")} renderInline={true} placement="bottom">
              <button type="button" aria-label={t("settings.title")} className="marketplace-header-icon-button" id="marketplace-settings-button"
                onClick={() => openModal("SETTINGS", this.CONFIG, this.updateAppConfig)}
              >
                <SettingsIcon />
              </button>
            </Spicetify.ReactComponent.TooltipWrapper>
          </div>
        </div>
        {/* Add a header and grid for each card type if it has any cards */}
        {[
          { handle: "extension", name: "Extensions" },
          { handle: "theme", name: "Themes" },
          { handle: "snippet", name: "Snippets" },
          { handle: "app", name: "Apps" },
        ].map((cardType) => {
          const cardsOfType = this.cardList.filter((card) => card.props.type === cardType.handle)
            .filter((card) => {
              const searchValue = this.state.searchValue.trim().toLowerCase();
              const { title, user, authors, tags } = card.props.item;

              return !searchValue ||
                title.toLowerCase().includes(searchValue) ||
                user?.toLowerCase().includes(searchValue) ||
                authors?.some((author) => author.name.toLowerCase().includes(searchValue)) ||
                tags?.some((tag) => tag.toLowerCase().includes(searchValue));
            })
            .map((card) => {
              // Clone the cards and update the prop to trigger re-render
              return React.cloneElement(card, {
                activeThemeKey: this.state.activeThemeKey,
                key: card.key,
              });
            }).filter((card, index, cards) => // Filter out duplicates to prevent spamming
              cards.findIndex((c) => c.key === card.key) === index,
            );

          if (cardsOfType.length) {
            return (
              // Add a header for the card type
              <>
                {/* Add a header for the card type */}
                <h2 className="marketplace-card-type-heading">{t(`tabs.${cardType.name}`)}</h2>
                {/* Add the grid and cards */}
                <div className="marketplace-grid main-gridContainer-gridContainer main-gridContainer-fixedWidth"
                  data-tab={this.CONFIG.activeTab}
                  data-card-type={t(`tabs.${cardType.name}`)} // This is used for the "no installed x" in css
                >
                  {cardsOfType}
                </div>
              </>
            );
          }
          return null;
        })}
        {/* Add snippets button if on snippets tab */}
        {this.CONFIG.activeTab === "Snippets"
          ? <Button classes={["marketplace-add-snippet-btn"]} onClick={() => openModal("ADD_SNIPPET")}>+ {t("grid.addCSS")}</Button>
          : null}
        <footer className="marketplace-footer">
          {!this.state.endOfList && (this.state.rest && this.state.cards.length > 0 ? <LoadMoreIcon onClick={this.loadMore.bind(this)} /> : <LoadingIcon />)}
        </footer>
        <TopBarContent
          switchCallback={this.switchTo.bind(this)}
          links={this.CONFIG.tabs}
          activeLink={this.CONFIG.activeTab} />
      </section>
    );
  }
}

export default withTranslation()(Grid);
