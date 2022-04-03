/// <reference types="react" />
/// <reference types="react-dom" />
/// <reference path="../spicetify-cli/globals.d.ts" />
/// <reference path="../spicetify-cli/jsHelper/spicetifyWrapper.js" />
/// <reference path="src/Card.js" />
/// <reference path="src/Icons.js" />
/// <reference path="src/Settings.js" />
/// <reference path="src/SortBox.js" />
/// <reference path="src/TabBar.js" />
/// <reference path="src/ReadmePage.js" />
/// <reference path="src/Utils.js" />

/* eslint-disable no-redeclare, no-unused-vars */
/** @type {React} */
const react = Spicetify.React;
/** @type {import("react-dom")} */
const reactDOM = Spicetify.ReactDOM;
const {
    URI,
    React: { useState, useEffect, useCallback },
    // @ts-ignore
    Platform: { History },
} = Spicetify;
/* eslint-enable no-redeclare, no-unused-vars */

// eslint-disable-next-line no-redeclare
const LOCALSTORAGE_KEYS = {
    "installedExtensions": "marketplace:installed-extensions",
    "installedSnippets": "marketplace:installed-snippets",
    "installedThemes": "marketplace:installed-themes",
    "activeTab": "marketplace:active-tab",
    "tabs": "marketplace:tabs",
    "sortBy": "marketplace:sort-by",
    // Theme installed store the localsorage key of the theme (e.g. marketplace:installed:NYRI4/Comfy-spicetify/user.css)
    "themeInstalled": "marketplace:theme-installed",
};

// Define a function called "render" to specify app entry point
// This function will be used to mount app to main view.
// eslint-disable-next-line no-unused-vars
function render() {
    const { location } = Spicetify.Platform.History;

    // If page state set to display readme, render it
    // (This location state data comes from Card.openReadme())
    if (location.pathname === "/spicetify-marketplace/readme") {
        return react.createElement(ReadmePage, {
            title: "Spicetify Marketplace - Readme",
            data: location.state.data,
        });
    } // Otherwise, render the main Grid
    else {
        return react.createElement(Grid, { title: "Spicetify Marketplace" });
    }
}

// Initalize topbar tabs
// Data initalized in TabBar.js
// eslint-disable-next-line no-redeclare
const ALL_TABS = [
    { name: "Extensions", enabled: true },
    { name: "Themes", enabled: true },
    { name: "Snippets", enabled: true },
    { name: "Installed", enabled: true },
];
let tabsString = localStorage.getItem(LOCALSTORAGE_KEYS.tabs);
let tabs = [];
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
    const installedThemeKey = localStorage.getItem(LOCALSTORAGE_KEYS.themeInstalled);
    if (installedThemeKey) {
        const installedThemeDataStr = localStorage.getItem(installedThemeKey);
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

// eslint-disable-next-line no-redeclare
const CONFIG = {
    // Fetch the settings and set defaults. Used in Settings.js
    visual: {
        stars: JSON.parse(localStorage.getItem("marketplace:stars")) ?? true,
        tags: JSON.parse(localStorage.getItem("marketplace:tags")) ?? true,
        hideInstalled: JSON.parse(localStorage.getItem("marketplace:hideInstalled")) ?? false,
        colorShift: JSON.parse(localStorage.getItem("marketplace:colorShift")) ?? false,
        // Legacy from reddit app...
        type: JSON.parse(localStorage.getItem("marketplace:type")) ?? false,
        // I was considering adding watchers as "followers" but it looks like the value is a duplicate
        // of stargazers, and the subscribers_count isn't returned in the main API call we make
        // https://github.community/t/bug-watchers-count-is-the-duplicate-of-stargazers-count/140865/4
        followers: JSON.parse(localStorage.getItem("marketplace:followers")) ?? false,
    },
    tabs,
    activeTab: localStorage.getItem(LOCALSTORAGE_KEYS.activeTab),
    theme: {
        activeThemeKey: localStorage.getItem(LOCALSTORAGE_KEYS.themeInstalled) || null,
        schemes,
        activeScheme,
    },
};

if (!CONFIG.activeTab || !CONFIG.tabs.filter(tab => tab.name === CONFIG.activeTab).length) {
    CONFIG.activeTab = CONFIG.tabs[0].name;
}

// Fetches the sorting options, fetched from SortBox.js
// eslint-disable-next-line no-redeclare
let sortConfig = {
    by: localStorage.getItem(LOCALSTORAGE_KEYS.sortBy) || "top",
};
let cardList = [];
let endOfList = false;
let lastScroll = 0;
let requestQueue = [];
let requestPage = null;
// Max GitHub API items per page
// https://docs.github.com/en/rest/reference/search#search-repositories
const ITEMS_PER_REQUEST = 100;

let BLACKLIST = [];

// eslint-disable-next-line no-redeclare, no-unused-vars
let gridUpdateTabs, gridUpdatePostsVisual;

class Grid extends react.Component {
    constructor(props) {
        super(props);
        Object.assign(this, props);
        this.state = {
            cards: [],
            tabs: CONFIG.tabs,
            rest: true,
            endOfList: endOfList,
            schemes: CONFIG.theme.schemes,
            activeScheme: CONFIG.theme.activeScheme,
            activeThemeKey: CONFIG.theme.activeThemeKey,
        };
    }

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
        cardList = [];
        const queue = [];
        requestQueue.unshift(queue);
        this.loadAmount(queue, amount);
    }

    /**
     * @param {Object} item
     * @param {"extension" | "theme" | "snippet"} type The type of card
     */
    appendCard(item, type) {
        item.visual = CONFIG.visual;
        // Set key prop so items don't get stuck when switching tabs
        item.key = `${CONFIG.activeTab}:${item.title}`;
        item.type = type;
        // Pass along the functions to update Grid state on apply
        item.updateColourSchemes = this.updateColourSchemes.bind(this);
        item.updateActiveTheme = this.setActiveTheme.bind(this);
        // This isn't used other than to trigger a re-render
        item.activeThemeKey = this.state.activeThemeKey;
        cardList.push(react.createElement(Card, item));
        this.setState({ cards: cardList });
    }

    // TODO: this isn't currently used, but it will be used for sorting (based on the SortBox component)
    updateSort(sortByValue) {
        if (sortByValue) {
            sortConfig.by = sortByValue;
            localStorage.setItem(LOCALSTORAGE_KEYS.sortBy, sortByValue);
        }

        requestPage = null;
        cardList = [];
        this.setState({
            cards: [],
            rest: false,
            endOfList: false,
        });
        endOfList = false;

        this.newRequest(ITEMS_PER_REQUEST);
    }

    updateTabs() {
        this.setState({
            tabs: [...CONFIG.tabs],
        });
    }

    updatePostsVisual() {
        cardList = cardList.map(card => {
            return react.createElement(Card, card.props);
        });
        this.setState({ cards: [...cardList] });
    }

    switchTo(value) {
        CONFIG.activeTab = value;
        localStorage.setItem(LOCALSTORAGE_KEYS.activeTab, value);
        cardList = [];
        requestPage = null;
        this.setState({
            cards: [],
            rest: false,
            endOfList: false,
        });
        endOfList = false;

        this.newRequest(ITEMS_PER_REQUEST);
    }

    // This is called from loadAmount in a loop until it has the requested amount of cards or runs out of results
    // Returns the next page number to fetch, or null if at end
    // TODO: maybe we should rename `loadPage()`, since it's slightly confusing when we have github pages as well
    async loadPage(queue) {
        if (CONFIG.activeTab === "Extensions") {
            let pageOfRepos = await getExtensionRepos(requestPage);
            for (const repo of pageOfRepos.items) {
                let extensions = await fetchExtensionManifest(repo.contents_url, repo.default_branch, repo.stargazers_count);

                // I believe this stops the requests when switching tabs?
                if (requestQueue.length > 1 && queue !== requestQueue[0]) {
                    // Stop this queue from continuing to fetch and append to cards list
                    return -1;
                }

                if (extensions && extensions.length) {
                    // console.log(`${repo.name} has ${extensions.length} extensions:`, extensions);
                    extensions.forEach((extension) => this.appendCard(extension, "extension"));
                }
            }

            // First result is null or -1 so it coerces to 1
            const currentPage = requestPage > -1 && requestPage ? requestPage : 1;
            // Sets the amount of items that have thus been fetched
            const soFarResults = ITEMS_PER_REQUEST * (currentPage - 1) + pageOfRepos.page_count;
            const remainingResults = pageOfRepos.total_count - soFarResults;

            // If still have more results, return next page number to fetch
            console.log(`Parsed ${soFarResults}/${pageOfRepos.total_count} extensions`);
            if (remainingResults > 0) return currentPage + 1;
            else console.log("No more extension results");
        } else if (CONFIG.activeTab === "Installed") {
            const installedStuff = {
                theme: getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.installedThemes, []),
                extension: getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.installedExtensions, []),
                snippet: getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.installedSnippets, []),
            };

            for (const type in installedStuff) {
                if (installedStuff[type].length) {
                    installedStuff[type].forEach(async (itemKey) => {
                        // TODO: err handling
                        const extension = JSON.parse(localStorage.getItem(itemKey));
                        // I believe this stops the requests when switching tabs?
                        if (requestQueue.length > 1 && queue !== requestQueue[0]) {
                            // Stop this queue from continuing to fetch and append to cards list
                            return -1;
                        }

                        // @ts-ignore
                        this.appendCard(extension, type);
                    });
                }
            }

            // Don't need to return a page number because
            // installed extension do them all in one go, since it's local
        } else if (CONFIG.activeTab == "Themes") {
            let pageOfRepos = await getThemeRepos(requestPage);
            for (const repo of pageOfRepos.items) {

                let themes = await fetchThemeManifest(repo.contents_url, repo.default_branch, repo.stargazers_count);
                // I believe this stops the requests when switching tabs?
                if (requestQueue.length > 1 && queue !== requestQueue[0]) {
                    // Stop this queue from continuing to fetch and append to cards list
                    return -1;
                }

                if (themes && themes.length) {
                    themes.forEach((theme) => this.appendCard(theme, "theme"));
                }
            }

            // First request is null, so coerces to 1
            const currentPage = requestPage > -1 && requestPage ? requestPage : 1;
            // -1 because the page number is 1-indexed
            const soFarResults = ITEMS_PER_REQUEST * (currentPage - 1) + pageOfRepos.page_count;
            const remainingResults = pageOfRepos.total_count - soFarResults;

            console.log(`Parsed ${soFarResults}/${pageOfRepos.total_count} themes`);
            if (remainingResults > 0) return currentPage + 1;
            else console.log("No more theme results");
        } else if (CONFIG.activeTab == "Snippets") {
            let snippets = await fetchCssSnippets();

            if (requestQueue.length > 1 && queue !== requestQueue[0]) {
                // Stop this queue from continuing to fetch and append to cards list
                return -1;
            }
            if (snippets && snippets.length) {
                snippets.forEach((snippet) => this.appendCard(snippet, "snippet"));
            }

        }

        this.setState({ rest: true, endOfList: true });
        endOfList = true;
        return null;
    }
    /**
     * Load a new set of extensions
     * @param {any} queue An array of the extensions to be loaded
     * @param {number} [quantity] Amount of extensions to be loaded per page. (Defaults to ITEMS_PER_REQUEST constant)
     */
    async loadAmount(queue, quantity = ITEMS_PER_REQUEST) {
        this.setState({ rest: false });
        quantity += cardList.length;

        requestPage = await this.loadPage(queue);

        while (
            requestPage &&
            requestPage !== -1 &&
            cardList.length < quantity &&
            !this.state.endOfList
        ) {
            requestPage = await this.loadPage(queue);
        }

        if (requestPage === -1) {
            requestQueue = requestQueue.filter(a => a !== queue);
            return;
        }

        // Remove this queue from queue list
        requestQueue.shift();
        this.setState({ rest: true });
    }

    /**
     * Load more items if there are more items to load.
     * @returns {void}
     */
    loadMore() {
        if (this.state.rest && !endOfList) {
            this.loadAmount(requestQueue[0], ITEMS_PER_REQUEST);
        }
    }

    /**
     * Update the colour schemes in the state + dropdown, and inject the active one
     * @param {any} schemes Object with the colour schemes
     * @param {string} activeScheme The name of the active colour scheme (a key in the schemes object)
     */
    updateColourSchemes(schemes, activeScheme) {
        console.log("updateColourSchemes", schemes, activeScheme);
        CONFIG.theme.schemes = schemes;
        CONFIG.theme.activeScheme = activeScheme;

        if (schemes && schemes[activeScheme]) {
            this.injectColourScheme(CONFIG.theme.schemes[activeScheme]);
        } else {
            // Reset schemes if none sent
            this.injectColourScheme(null);
        }

        // Save to localstorage
        const installedThemeKey = localStorage.getItem(LOCALSTORAGE_KEYS.themeInstalled);
        const installedThemeDataStr = localStorage.getItem(installedThemeKey);
        const installedThemeData = JSON.parse(installedThemeDataStr);
        installedThemeData.activeScheme = activeScheme;
        localStorage.setItem(installedThemeKey, JSON.stringify(installedThemeData));

        this.setState({
            schemes,
            activeScheme,
        });
    }

    // NOTE: Keep in sync with extension.js
    injectColourScheme (scheme) {
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
     * The componentDidMount() method is called when the component is first loaded.
     * It checks if the cardList is already loaded. If it is, it checks if the lastScroll value is
     greater than 0.
    * If it is, it scrolls to the lastScroll value. If it isn't, it scrolls to the top of the page.
    * If the cardList isn't loaded, it loads the cardList.
    */
    async componentDidMount() {
        gridUpdateTabs = this.updateTabs.bind(this);
        gridUpdatePostsVisual = this.updatePostsVisual.bind(this);

        const viewPort = document.querySelector(".os-viewport");
        this.checkScroll = this.isScrolledBottom.bind(this);
        viewPort.addEventListener("scroll", this.checkScroll);

        if (cardList.length) { // Already loaded
            if (lastScroll > 0) {
                viewPort.scrollTo(0, lastScroll);
            }
            return;
        }

        // Load blacklist
        BLACKLIST = await getBlacklist();
        this.newRequest(ITEMS_PER_REQUEST);
    }

    /**
     * When the component is unmounted, remove the scroll event listener.
     * @returns {void}
     */
    componentWillUnmount() {
        gridUpdateTabs = gridUpdatePostsVisual = null;
        const viewPort = document.querySelector(".os-viewport");
        lastScroll = viewPort.scrollTop;
        viewPort.removeEventListener("scroll", this.checkScroll);
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
        CONFIG.theme.activeThemeKey = themeKey;
        this.setState({ activeThemeKey: themeKey });
    }

    // TODO: clean this up. It worked when I was using state, but state seems like pointless overhead.
    getActiveScheme() {
        return this.state.activeScheme;
    }

    render() {
        return react.createElement("section", {
            className: "contentSpacing",
        },
        react.createElement("div", {
            className: "marketplace-header",
        }, react.createElement("h1", null, this.props.title),
        // Start of marketplace-header__right
        react.createElement("div", {
            className: "marketplace-header__right",
        },
        // Show colour scheme dropdown if there is a theme with schemes installed
        this.state.activeScheme ? react.createElement(SortBox, {
            onChange: (value) => this.updateColourSchemes(this.state.schemes, value),
            // TODO: Make this compatible with the changes to the theme install process: need to create a method to update the scheme options without a full reload.
            sortBoxOptions: generateSchemesOptions(this.state.schemes),
            // It doesn't work when I directly use CONFIG.theme.activeScheme in the sortBySelectedFn
            // because it hardcodes the value into the fn
            sortBySelectedFn: (a) => a.key === this.getActiveScheme(),
        }) : null,
        react.createElement("button", {
            className: "marketplace-settings-button",
            id: "marketplace-settings-button",

            onClick: openConfig,
        }, SETTINGS_ICON),
        // End of marketplace-header__right
        ),
            // TODO: Add search bar and sort functionality
            // react.createElement("div", {
            //     className: "searchbar--bar__wrapper",
            // }, react.createElement("input", {
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
            const cardsOfType = cardList.filter((card) => card.props.type === cardType.handle)
                .map((card) => {
                    // Clone the cards and update the prop to trigger re-render
                    // TODO: is it possible to only re-render the theme cards whose status have changed?
                    const cardElement = react.cloneElement(card, {
                        activeThemeKey: this.state.activeThemeKey,
                    });
                    return cardElement;
                });

            if (cardsOfType.length) {
                return [
                    // Add a header for the card type
                    react.createElement("h2",
                        { className: "marketplace-card-type-heading" },
                        cardType.name),
                    // Add the grid and cards
                    react.createElement("div", {
                        className: "marketplace-grid main-gridContainer-gridContainer",
                        "data-tab": CONFIG.activeTab,
                        style: {
                            "--minimumColumnWidth": "180px",
                        },
                    }, cardsOfType)];
            } else {
                return null;
            }
        }), react.createElement("footer", {
            style: {
                margin: "auto",
                textAlign: "center",
            },
        }, !this.state.endOfList && (this.state.rest ? react.createElement(LoadMoreIcon, { onClick: this.loadMore.bind(this) }) : react.createElement(LoadingIcon)),
        // Add snippets button if on snippets tab
        CONFIG.activeTab === "Snippets" ? react.createElement("button", {
            className: "marketplace-add-snippet-btn main-buttons-button main-button-secondary",
            onClick: openAddSnippetModal,
        }, "+Add CSS") : null,
        ), react.createElement(TopBarContent, {
            switchCallback: this.switchTo.bind(this),
            links: CONFIG.tabs,
            activeLink: CONFIG.activeTab,
        }));
    }
}

// TODO: add sort type, order, etc?
// https://docs.github.com/en/github/searching-for-information-on-github/searching-on-github/searching-for-repositories#search-by-topic
// https://docs.github.com/en/rest/reference/search#search-repositories
/**
 * Query GitHub for all repos with the "spicetify-extensions" topic
 * @param {number} page The query page number
 * @returns Array of search results (filtered through the blacklist)
 */
async function getExtensionRepos(page = 1) {
    // www is needed or it will block with "cross-origin" error.
    let url = `https://api.github.com/search/repositories?q=${encodeURIComponent("topic:spicetify-extensions")}&per_page=${ITEMS_PER_REQUEST}`;

    // We can test multiple pages with this URL (58 results), as well as broken iamges etc.
    // let url = `https://api.github.com/search/repositories?q=${encodeURIComponent("topic:spicetify")}`;
    if (page) url += `&page=${page}`;
    // Sorting params (not implemented for Marketplace yet)
    // if (sortConfig.by.match(/top|controversial/) && sortConfig.time) {
    //     url += `&t=${sortConfig.time}`
    const allRepos = await fetch(url).then(res => res.json()).catch(() => []);
    if (!allRepos.items) {
        Spicetify.showNotification("Too Many Requests, Cool Down.");
    }
    const filteredResults = {
        ...allRepos,
        // Include count of all items on the page, since we're filtering the blacklist below,
        // which can mess up the paging logic
        page_count: allRepos.items.length,
        items: allRepos.items.filter(item => !BLACKLIST.includes(item.html_url)),
    };

    return filteredResults;
}

// TODO: add try/catch here?
// TODO: can we add a return type here?
/**
 * Get the manifest object for a repo
 * @param {string} user Owner username
 * @param {string} repo Repo name
 * @param {string} branch Default branch name (e.g. main or master)
 * @returns The manifest object
 */
async function getRepoManifest(user, repo, branch) {
    const sessionStorageItem = window.sessionStorage.getItem(`${user}-${repo}`);
    const failedSessionStorageItems = window.sessionStorage.getItem("noManifests");
    if (sessionStorageItem) {
        return JSON.parse(sessionStorageItem);
    }
    const url = `https://raw.githubusercontent.com/${user}/${repo}/${branch}/manifest.json`;
    if (failedSessionStorageItems.includes(url)) {
        return null;
    }
    const manifest = await fetch(url).then(res => res.json()).catch(() => addToSessionStorage([url], "noManifests"));
    if (manifest) {
        window.sessionStorage.setItem(`${user}-${repo}`, JSON.stringify(manifest));
    }
    return manifest;
}

// TODO: can we add a return type here?
/**
 * Fetch extensions from a repo and format data for generating cards
 * @param {string} contents_url The repo's GitHub API contents_url (e.g. "https://api.github.com/repos/theRealPadster/spicetify-hide-podcasts/contents/{+path}")
 * @param {string} branch The repo's default branch (e.g. main or master)
 * @param {number} stars The number of stars the repo has
 * @returns Extension info for card (or null)
 */
async function fetchExtensionManifest(contents_url, branch, stars) {
    try {
        // TODO: use the original search full_name ("theRealPadster/spicetify-hide-podcasts") or something to get the url better?
        let manifests;
        const regex_result = contents_url.match(/https:\/\/api\.github\.com\/repos\/(?<user>.+)\/(?<repo>.+)\/contents/);
        // TODO: err handling?
        if (!regex_result || !regex_result.groups) return null;
        const { user, repo } = regex_result.groups;

        manifests = await getRepoManifest(user, repo, branch);

        // If the manifest returned is not an array, initialize it as one
        if (!Array.isArray(manifests)) manifests = [manifests];

        // Manifest is initially parsed
        const parsedManifests = manifests.reduce((accum, manifest) => {
            const selectedBranch = manifest.branch || branch;
            const item = {
                manifest,
                title: manifest.name,
                subtitle: manifest.description,
                authors: processAuthors(manifest.authors, user),
                user,
                repo,
                branch: selectedBranch,

                imageURL: manifest.preview && manifest.preview.startsWith("http")
                    ? manifest.preview
                    : `https://raw.githubusercontent.com/${user}/${repo}/${selectedBranch}/${manifest.preview}`,
                extensionURL: manifest.main.startsWith("http")
                    ? manifest.main
                    : `https://raw.githubusercontent.com/${user}/${repo}/${selectedBranch}/${manifest.main}`,
                readmeURL: manifest.readme && manifest.readme.startsWith("http")
                    ? manifest.readme
                    : `https://raw.githubusercontent.com/${user}/${repo}/${selectedBranch}/${manifest.readme}`,
                stars,
                tags: manifest.tags,
            };

            // If manifest is valid, add it to the list
            if (manifest && manifest.name && manifest.description && manifest.main
            ) {
                // Add to list unless we're hiding installed items and it's installed
                if (!(CONFIG.visual.hideInstalled
                    && localStorage.getItem("marketplace:installed:" + `${user}/${repo}/${manifest.main}`))
                ) {
                    accum.push(item);
                }
            }
            // else {
            //     console.error("Invalid manifest:", manifest);
            // }

            return accum;
        }, []);

        return parsedManifests;
    }
    catch (err) {
        // console.warn(contents_url, err);
        return null;
    }
}

// TODO: can we add a return type here?
/**
 * Fetch themes from a repo and format data for generating cards
 * @param {string} contents_url The repo's GitHub API contents_url (e.g. "https://api.github.com/repos/theRealPadster/spicetify-hide-podcasts/contents/{+path}")
 * @param {string} branch The repo's default branch (e.g. main or master)
 * @param {number} stars The number of stars the repo has
 * @returns Extension info for card (or null)
 */
async function fetchThemeManifest(contents_url, branch, stars) {
    try {
        let manifests;
        const regex_result = contents_url.match(/https:\/\/api\.github\.com\/repos\/(?<user>.+)\/(?<repo>.+)\/contents/);
        // TODO: err handling?
        if (!regex_result || !regex_result.groups) return null;
        let { user, repo } = regex_result.groups;

        manifests = await getRepoManifest(user, repo, branch);

        // If the manifest returned is not an array, initialize it as one
        if (!Array.isArray(manifests)) manifests = [manifests];

        // Manifest is initially parsed
        const parsedManifests = manifests.reduce((accum, manifest) => {
            const selectedBranch = manifest.branch || branch;
            const item = {
                manifest,
                title: manifest.name,
                subtitle: manifest.description,
                authors: processAuthors(manifest.authors, user),
                user,
                repo,
                branch: selectedBranch,
                imageURL: manifest.preview && manifest.preview.startsWith("http")
                    ? manifest.preview
                    : `https://raw.githubusercontent.com/${user}/${repo}/${selectedBranch}/${manifest.preview}`,
                readmeURL: manifest.readme && manifest.readme.startsWith("http")
                    ? manifest.readme
                    : `https://raw.githubusercontent.com/${user}/${repo}/${selectedBranch}/${manifest.readme}`,
                stars,
                tags: manifest.tags,
                // theme stuff
                cssURL: manifest.usercss.startsWith("http")
                    ? manifest.usercss
                    : `https://raw.githubusercontent.com/${user}/${repo}/${selectedBranch}/${manifest.usercss}`,
                // TODO: clean up indentation etc
                schemesURL: manifest.schemes
                    ? (
                        manifest.schemes.startsWith("http") ? manifest.schemes : `https://raw.githubusercontent.com/${user}/${repo}/${selectedBranch}/${manifest.schemes}`
                    )
                    : null,
                include: manifest.include,
            };
            // If manifest is valid, add it to the list
            if (manifest && manifest.name && manifest.usercss && manifest.description) {
                accum.push(item);
            }
            return accum;
        }, []);
        return parsedManifests;
    }
    catch (err) {
        // console.warn(contents_url, err);
        return null;
    }
}

/**
 * Query the GitHub API for a page of theme repos (having "spicetify-themes" topic)
 * @param {number} page The page to get (defaults to 1)
 * @returns Array of GitHub API results, filtered through the blacklist
 */
async function getThemeRepos(page = 1) {
    let url = `https://api.github.com/search/repositories?q=${encodeURIComponent("topic:spicetify-themes")}&per_page=${ITEMS_PER_REQUEST}`;

    // We can test multiple pages with this URL (58 results), as well as broken iamges etc.
    // let url = `https://api.github.com/search/repositories?q=${encodeURIComponent("topic:spicetify")}`;
    if (page) url += `&page=${page}`;
    // Sorting params (not implemented for Marketplace yet)
    // if (sortConfig.by.match(/top|controversial/) && sortConfig.time) {
    //     url += `&t=${sortConfig.time}`
    const allThemes = await fetch(url).then(res => res.json()).catch(() => []);
    if (!allThemes.items) {
        Spicetify.showNotification("Too Many Requests, Cool Down.");
    }
    const filteredResults = {
        ...allThemes,
        // Include count of all items on the page, since we're filtering the blacklist below,
        // which can mess up the paging logic
        page_count: allThemes.items.length,
        items: allThemes.items.filter(item => !BLACKLIST.includes(item.html_url)),
    };

    return filteredResults;
}
function addToSessionStorage(items, key) {
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
