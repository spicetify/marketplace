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
/** @type {ReactDOM} */
const reactDOM = Spicetify.ReactDOM;
const {
    URI,
    React: { useState, useEffect, useCallback },
    // @ts-ignore
    Platform: { History },
} = Spicetify;
/* eslint-enable no-redeclare, no-unused-vars */

// eslint-disable-next-line no-unused-vars, no-redeclare
const LOCALSTORAGE_KEYS = {
    "installedExtensions": "marketplace:installed-extensions",
    "activeTab": "marketplace:active-tab",
    "tabs": "marketplace:tabs",
    "sortBy": "marketplace:sort-by",
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
    visual: {
        //Fetch the settings, defined in Settings.js
        type: localStorage.getItem("marketplace:type") === "true",
        stars: localStorage.getItem("marketplace:stars") === "true",
        hideInstalled: localStorage.getItem("marketplace:hideInstalled") === "true",
        // I was considering adding watchers as "followers" but it looks like the value is a duplicate
        // of stargazers, and the subscribers_count isn't returned in the main API call we make
        // https://github.community/t/bug-watchers-count-is-the-duplicate-of-stargazers-count/140865/4
        followers: localStorage.getItem("marketplace:followers") === "true",
    },
    tabs,
    activeTab: localStorage.getItem(LOCALSTORAGE_KEYS.activeTab),
    theme: {
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

// eslint-disable-next-line no-unused-vars, no-redeclare
let gridUpdateTabs, gridUpdatePostsVisual;

// eslint-disable-next-line no-unused-vars
const typesLocale = {
    // TODO: Remove these, unsure of their purpose.
    album: Spicetify.Locale.get("album"),
    song: Spicetify.Locale.get("song"),
    playlist: Spicetify.Locale.get("playlist"),
};

// eslint-disable-next-line no-unused-vars, no-redeclare
const getInstalledExtensions = () => {
    const installedExtensionsStr = localStorage.getItem(LOCALSTORAGE_KEYS.installedExtensions) || "[]";
    const installedExtensions = JSON.parse(installedExtensionsStr);
    return installedExtensions;
};

class Grid extends react.Component {
    constructor(props) {
        super(props);
        Object.assign(this, props);
        this.state = {
            cards: [],
            tabs: CONFIG.tabs,
            rest: true,
            endOfList: endOfList,
            // activeScheme: CONFIG.theme.activeScheme,
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
     * @param {"extension" | "theme"} type The type of card
     */
    appendCard(item, type) {
        item.visual = CONFIG.visual;
        // Set key prop so items don't get stuck when switching tabs
        item.key = `${CONFIG.activeTab}:${item.title}`;
        item.type = type;
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

        this.newRequest(30);
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

        this.newRequest(30);
    }

    // This is called from loadAmount in a loop until it has the requested amount of cards or runs out of results
    // Returns the next page number to fetch, or null if at end
    // TODO: maybe we should rename `loadPage()`, since it's slightly confusing when we have github pages as well
    async loadPage(queue) {
        if (CONFIG.activeTab === "Extensions") {
            let pageOfRepos = await getRepos(requestPage);
            for (const repo of pageOfRepos) {
                let extensions = await fetchRepoExtensions(repo.contents_url, repo.default_branch, repo.stargazers_count);

                // I believe this stops the requests when switching tabs?
                if (requestQueue.length > 1 && queue !== requestQueue[0]) {
                    // Stop this queue from continuing to fetch and append to cards list
                    return -1;
                }

                if (extensions && extensions.length) {
                    extensions.forEach((extension) => this.appendCard(extension, "extension"));
                }
            }

            // First request is null, so coerces to 1
            const currentPage = requestPage || 1;
            // -1 because the page number is 1-indexed
            const soFarResults = ITEMS_PER_REQUEST * (currentPage - 1) + pageOfRepos.length;
            const remainingResults = pageOfRepos.length - soFarResults;

            // If still have more results, return next page number to fetch
            if (remainingResults) return currentPage + 1;
        } else if (CONFIG.activeTab === "Installed") {
            const installedExtensions = getInstalledExtensions();
            installedExtensions.forEach(async (extensionKey) => {
                // TODO: err handling
                const extension = JSON.parse(localStorage.getItem(extensionKey));

                // I believe this stops the requests when switching tabs?
                if (requestQueue.length > 1 && queue !== requestQueue[0]) {
                    // Stop this queue from continuing to fetch and append to cards list
                    return -1;
                }

                // TODO: this needs to know which is a theme vs extension
                this.appendCard(extension, "extension");
            });

            // Don't need to return a page number because
            // installed extension do them all in one go, since it's local
        } else if (CONFIG.activeTab == "Themes") {
            let pageOfRepos = await getThemeRepos(requestPage);
            for (const repo of pageOfRepos) {

                let themes = await fetchThemes(repo.contents_url, repo.default_branch, repo.stargazers_count);
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
            const currentPage = requestPage || 1;
            // -1 because the page number is 1-indexed
            const soFarResults = ITEMS_PER_REQUEST * (currentPage - 1) + pageOfRepos.length;
            const remainingResults = pageOfRepos.length - soFarResults;
            if (remainingResults) return currentPage + 1;
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

    loadMore() {
        if (this.state.rest && !endOfList) {
            this.loadAmount(requestQueue[0], ITEMS_PER_REQUEST);
        }
    }

    updateColourScheme(scheme) {
        console.log("Injecting colour scheme", scheme);
        CONFIG.theme.activeScheme = scheme;
        this.injectColourScheme(CONFIG.theme.schemes[scheme]);

        // Save to localstorage
        const installedThemeKey = localStorage.getItem(LOCALSTORAGE_KEYS.themeInstalled);
        const installedThemeDataStr = localStorage.getItem(installedThemeKey);
        const installedThemeData = JSON.parse(installedThemeDataStr);
        installedThemeData.activeScheme = scheme;
        localStorage.setItem(installedThemeKey, JSON.stringify(installedThemeData));

        // TODO: can I put in a hook for when the activeScheme changes? or why do I have it in state??
        // this.setState({
        //     activeScheme: CONFIG.theme.activeScheme,
        // });
        // TODO: clean this up. The SortBox doesn't re-render (and update the selectedOption in the dropdown unless I set state...)
        this.setState({});
    }

    injectColourScheme (scheme) {
        // Remove any existing marketplace scheme
        const existingMarketplaceThemeCSS = document.querySelector("style.marketplaceCSS");
        if (existingMarketplaceThemeCSS) existingMarketplaceThemeCSS.remove();

        // Add new marketplace scheme
        const themeTag = document.createElement("style");
        themeTag.classList.add("marketplaceCSS");
        // const theme = document.querySelector('#theme');
        let injectStr = ":root {";
        const themeIniKeys = Object.keys(scheme);
        themeIniKeys.forEach((key) => {
            injectStr += `--spice-${key}: #${scheme[key]};`;
            injectStr += `--spice-rgb-${key}: ${hexToRGB(scheme[key])};`;
        });
        injectStr += "}";
        themeTag.innerHTML = injectStr;
        document.head.appendChild(themeTag);
    }

    // TODO: this isn't used yet. It would be great if we could add/remove themes without reloading the page
    // eslint-disable-next-line
    applyTheme(theme) {
        // Remove default css
        // TODO: what about if we remove the theme? Should we re-add the user.css/colors.css?
        const existingUserThemeCSS = document.querySelector("link[href='user.css']");
        if (existingUserThemeCSS) existingUserThemeCSS.remove();
        const existingColorsCSS = document.querySelector("link[href='colors.css']");
        if (existingColorsCSS) existingColorsCSS.remove();

        // Remove any existing marketplace theme
        const existingMarketplaceThemeCSS = document.querySelector("link.marketplaceCSS");
        if (existingMarketplaceThemeCSS) existingMarketplaceThemeCSS.remove();

        // Add theme css
        const newUserThemeCSS = document.createElement("link");
        // Using jsdelivr since github raw doesn't provide mimetypes
        // TODO: this should probably be the URL stored in localstorage actually (i.e. put this url in localstorage)
        const cssUrl = `https://cdn.jsdelivr.net/gh/${theme.user}/${theme.repo}@${theme.branch}/${theme.manifest.usercss}`;
        newUserThemeCSS.href = cssUrl;
        newUserThemeCSS.rel = "stylesheet";
        newUserThemeCSS.classList.add("userCSS", "marketplaceCSS");
        document.body.appendChild(newUserThemeCSS);
    }

    async componentDidMount() {
        gridUpdateTabs = this.updateTabs.bind(this);
        gridUpdatePostsVisual = this.updatePostsVisual.bind(this);

        this.configButton = new Spicetify.Menu.Item("Marketplace config", false, openConfig);
        this.configButton.register();

        const viewPort = document.querySelector("main .os-viewport");
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
        this.newRequest(30);
    }

    componentWillUnmount() {
        gridUpdateTabs = gridUpdatePostsVisual = null;
        const viewPort = document.querySelector("main .os-viewport");
        lastScroll = viewPort.scrollTop;
        viewPort.removeEventListener("scroll", this.checkScroll);
        this.configButton.deregister();
    }

    isScrolledBottom(event) {
        const viewPort = event.target;
        if ((viewPort.scrollTop + viewPort.clientHeight) >= viewPort.scrollHeight) {
            // At bottom, load more posts
            this.loadMore();
        }
    }

    // TODO: clean this up. It worked when I was using state, but state seems like pointless overhead.
    getActiveScheme() {
        return CONFIG.theme.activeScheme;
    }

    render() {
        return react.createElement("section", {
            className: "contentSpacing",
        },
        react.createElement("div", {
            className: "marketplace-header",
        }, react.createElement("h1", null, this.props.title),
        // TODO: don't show on all tabs
        // Show colour scheme dropdown if there is a theme with schemes installed
        CONFIG.theme.activeScheme ? react.createElement(SortBox, {
            onChange: this.updateColourScheme.bind(this),
            sortBoxOptions: generateSchemesOptions(CONFIG.theme.schemes),
            // It doesn't work when I directly use CONFIG.theme.activeScheme in the sortBySelectedFn
            // because it hardcodes the value into the fn
            sortBySelectedFn: (a) => a.key === this.getActiveScheme(),
        }) : null,

            // TODO: Add search bar and sort functionality
            // react.createElement("div", {
            //     className: "searchbar--bar__wrapper",
            // }, react.createElement("input", {
            //     className: "searchbar-bar",
            //     type: "text",
            //     placeholder: "Search for Extensions?",
            // })),

        ), react.createElement("div", {
            id: "marketplace-grid",
            className: "main-gridContainer-gridContainer",
            "data-tab": CONFIG.activeTab,
            style: {
                "--minimumColumnWidth": "180px",
            },
        }, [...cardList]), react.createElement("footer", {
            style: {
                margin: "auto",
                textAlign: "center",
            },
        }, !this.state.endOfList && (this.state.rest ? react.createElement(LoadMoreIcon, { onClick: this.loadMore.bind(this) }) : react.createElement(LoadingIcon)),
        ), react.createElement(TopBarContent, {
            switchCallback: this.switchTo.bind(this),
            links: CONFIG.tabs,
            activeLink: CONFIG.activeTab,
        }));
    }
}

// TODO: add license filter or anything?
// TODO: add sort type, order, etc?
// https://docs.github.com/en/github/searching-for-information-on-github/searching-on-github/searching-for-repositories#search-by-topic
// https://docs.github.com/en/rest/reference/search#search-repositories
/**
 * Query GitHub for all repos with the "spicetify-extensions" topic
 * @param {number} page The query page number
 * @returns Array of search results
 */
async function getRepos(page = 1) {
    // www is needed or it will block with "cross-origin" error.
    let url = `https://api.github.com/search/repositories?q=${encodeURIComponent("topic:spicetify-extensions")}&per_page=${ITEMS_PER_REQUEST}`;

    // We can test multiple pages with this URL (58 results), as well as broken iamges etc.
    // let url = `https://api.github.com/search/repositories?q=${encodeURIComponent("topic:spicetify")}`;
    if (page) url += `&page=${page}`;
    // Sorting params (not implemented for Marketplace yet)
    // if (sortConfig.by.match(/top|controversial/) && sortConfig.time) {
    //     url += `&t=${sortConfig.time}`
    const allRepos = await fetch(url).then(res => res.json()).catch(() => []);
    const filteredArray = allRepos.items.filter((item) => !BLACKLIST.includes(item.html_url));

    return filteredArray;
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
    const url = `https://raw.githubusercontent.com/${user}/${repo}/${branch}/manifest.json`;

    return await fetch(url).then(res => res.json()).catch(() => null);
}

// TODO: can we add a return type here?
/**
 * Fetch an extension and format data for generating a card
 * @param {string} contents_url The repo's GitHub API contents_url (e.g. "https://api.github.com/repos/theRealPadster/spicetify-hide-podcasts/contents/{+path}")
 * @param {string} branch The repo's default branch (e.g. main or master)
 * @param {number} stars The number of stars the repo has
 * @returns Extension info for card (or null)
 */
async function fetchRepoExtensions(contents_url, branch, stars) {
    try {
        // TODO: use the original search full_name ("theRealPadster/spicetify-hide-podcasts") or something to get the url better?
        const regex_result = contents_url.match(/https:\/\/api\.github\.com\/repos\/(?<user>.+)\/(?<repo>.+)\/contents/);
        // TODO: err handling?
        if (!regex_result || !regex_result.groups) return null;
        const { user, repo } = regex_result.groups;
        let manifests = await getRepoManifest(user, repo, branch);
        // If the manifest returned is not an array, initialize it as one
        if (!Array.isArray(manifests)) manifests = [manifests];

        // Manifest is initially parsed
        const parsedManifests = manifests.reduce((accum, manifest) => {
            const selectedBranch = manifest.branch || branch;
            const item = {
                manifest,
                title: manifest.name,
                subtitle: manifest.description,
                user,
                repo,
                branch: selectedBranch,
                imageURL: `https://raw.githubusercontent.com/${user}/${repo}/${selectedBranch}/${manifest.preview}`,
                extensionURL: `https://raw.githubusercontent.com/${user}/${repo}/${selectedBranch}/${manifest.main}`,
                readmeURL:  `https://raw.githubusercontent.com/${user}/${repo}/${selectedBranch}/${manifest.readme}`,
                stars,
            };

            // If manifest is valid, add it to the list
            if (manifest && manifest.name && manifest.description && manifest.main
            // TODO: Do we want to require a preview image or readme?
            // && manifest.preview && manifest.readme
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

async function fetchThemes(contents_url, branch, stars) {
    try {
        const regex_result = contents_url.match(/https:\/\/api\.github\.com\/repos\/(?<user>.+)\/(?<repo>.+)\/contents/);
        // TODO: err handling?
        if (!regex_result || !regex_result.groups) return null;
        const { user, repo } = regex_result.groups;
        let manifests = await getRepoManifest(user, repo, branch);
        // If the manifest returned is not an array, initialize it as one
        if (!Array.isArray(manifests)) manifests = [manifests];

        // Manifest is initially parsed
        const parsedManifests = manifests.reduce((accum, manifest) => {
            const selectedBranch = manifest.branch || branch;
            const item = {
                manifest,
                title: manifest.name,
                subtitle: manifest.description,
                user,
                repo,
                branch: selectedBranch,
                imageURL: `https://raw.githubusercontent.com/${user}/${repo}/${selectedBranch}/${manifest.preview}`,
                readmeURL: `https://raw.githubusercontent.com/${user}/${repo}/${selectedBranch}/${manifest.readme}`,
                stars,
                // theme stuff
                cssURL: `https://raw.githubusercontent.com/${user}/${repo}/${selectedBranch}/${manifest.usercss}`,
                schemesURL: manifest.schemes ? `https://raw.githubusercontent.com/${user}/${repo}/${selectedBranch}/${manifest.schemes}` : null,
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

async function getThemeRepos(page = 1) {
    // www is needed or it will block with "cross-origin" error.
    let url = `https://api.github.com/search/repositories?q=${encodeURIComponent("topic:spicetify-themes")}&per_page=${ITEMS_PER_REQUEST}`;

    // We can test multiple pages with this URL (58 results), as well as broken iamges etc.
    // let url = `https://api.github.com/search/repositories?q=${encodeURIComponent("topic:spicetify")}`;
    if (page) url += `&page=${page}`;
    // Sorting params (not implemented for Marketplace yet)
    // if (sortConfig.by.match(/top|controversial/) && sortConfig.time) {
    //     url += `&t=${sortConfig.time}`
    const allThemes = await fetch(url).then(res => res.json()).catch(() => []);

    const filteredArray = allThemes.items.filter((item) => !BLACKLIST.includes(item.html_url));
    return filteredArray;
}

async function getBlacklist() {
    const url = "https://raw.githubusercontent.com/CharlieS1103/spicetify-marketplace/main/blacklist.json";
    const jsonReturned = await fetch(url).then(res => res.json()).catch(() => {});
    return jsonReturned.repos;
}

function generateSchemesOptions(schemes) {
    if (!schemes) return [];
    // [
    //     { key: "hot", value: "Hot" },
    //     { key: "new", value: "New" },
    //     { key: "top", value: "Top" },
    //     { key: "rising", value: "Rising" },
    //     { key: "controversial", value: "Controversial" },
    // ]
    return Object.keys(schemes).map(schemeName => ({ key: schemeName, value: schemeName }));
}
