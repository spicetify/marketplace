// Run "npm i @type/react" to have this type package available in workspace
/// <reference types="react" />
/// <reference types="react-dom" />
/// <reference path="../spicetify-cli/globals.d.ts" />
/// <reference path="../spicetify-cli/jsHelper/spicetifyWrapper.js" />
/// <reference path="Card.js" />
/// <reference path="Icons.js" />
/// <reference path="Settings.js" />
/// <reference path="SortBox.js" />
/// <reference path="TabBar.js" />
/// <reference path="ReadmePage.js" />

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
    "sortTime": "marketplace:sort-time",
};

// Define a function called "render" to specify app entry point
// This function will be used to mount app to main view.
// eslint-disable-next-line no-unused-vars
function render() {
    const { location } = Spicetify.Platform.History;

    // If page state set to display readme, render it
    // (This location state data comes from Card.openReadme())
    if (location.state.page === "readme") {
        return react.createElement(ReadmePage, {
            title: "Spicetify Marketplace - Readme",
            data: location.state.data,
        });
    } // Otherwise, render the main Grid
    else {
        return react.createElement(Grid, { title: "Spicetify Marketplace" });
    }
}

let tabsString = localStorage.getItem(LOCALSTORAGE_KEYS.tabs) || `["Marketplace", "Installed"]`;
let tabs = [];
try {
    tabs = JSON.parse(tabsString);
    if (!Array.isArray(tabs)) {
        throw new Error("");
    }
} catch {
    tabs = ["Marketplace", "Installed"];
    localStorage.setItem(LOCALSTORAGE_KEYS.tabs, JSON.stringify(tabs));
}
// eslint-disable-next-line no-redeclare
const CONFIG = {
    visual: {
        type: localStorage.getItem("marketplace:type") === "true",
        stars: localStorage.getItem("marketplace:stars") === "true",
        hideInstalled: localStorage.getItem("marketplace:hideInstalled") === "true",
        // I was considering adding watchers as "followers" but it looks like the value is a duplicate
        // of stargazers, and the subscribers_count isn't returned in the main API call we make
        // https://github.community/t/bug-watchers-count-is-the-duplicate-of-stargazers-count/140865/4
        followers: localStorage.getItem("marketplace:followers") === "true",
        longDescription: localStorage.getItem("marketplace:longDescription") === "true",
    },
    tabs,
    activeTab: localStorage.getItem(LOCALSTORAGE_KEYS.activeTab),
};

if (!CONFIG.activeTab || !CONFIG.tabs.includes(CONFIG.activeTab)) {
    CONFIG.activeTab = CONFIG.tabs[0];
}

// eslint-disable-next-line no-redeclare
let sortConfig = {
    by: localStorage.getItem(LOCALSTORAGE_KEYS.sortBy) || "top",
    time: localStorage.getItem(LOCALSTORAGE_KEYS.sortTime) || "month",
};
let cardList = [];
let endOfList = false;
let lastScroll = 0;
let requestQueue = [];
let requestPage = null;
// Default GitHub API items per page
const ITEMS_PER_REQUEST = 30;

// eslint-disable-next-line no-unused-vars, no-redeclare
let gridUpdateTabs, gridUpdatePostsVisual;

// eslint-disable-next-line no-unused-vars
const typesLocale = {
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
        };
    }

    newRequest(amount) {
        cardList = [];
        const queue = [];
        requestQueue.unshift(queue);
        this.loadAmount(queue, amount);
    }

    appendCard(item) {
        item.visual = CONFIG.visual;
        // Set key prop so items don't get stuck when switching tabs
        item.key = `${CONFIG.activeTab}:${item.title}`;
        cardList.push(react.createElement(Card, item));
        this.setState({ cards: cardList });
    }

    updateSort(sortByValue, sortTimeValue) {
        if (sortByValue) {
            sortConfig.by = sortByValue;
            localStorage.setItem(LOCALSTORAGE_KEYS.sortBy, sortByValue);
        }
        if (sortTimeValue) {
            sortConfig.time = sortTimeValue;
            localStorage.setItem(LOCALSTORAGE_KEYS.sortTime, sortTimeValue);
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
        if (CONFIG.activeTab === "Marketplace") {
            let pageOfRepos = await getRepos(requestPage);
            for (const repo of pageOfRepos.items) {
                let extensions = await fetchRepoExtensions(repo.contents_url, repo.default_branch, repo.stargazers_count);
                console.log(repo.name, extensions);

                // I believe this stops the requests when switching tabs?
                if (requestQueue.length > 1 && queue !== requestQueue[0]) {
                    // Stop this queue from continuing to fetch and append to cards list
                    return -1;
                }

                if (extensions && extensions.length) {
                    extensions.forEach((extension) => this.appendCard(extension));
                }
            }

            // First request is null, so coerces to 1
            const currentPage = requestPage || 1;
            // -1 because the page number is 1-indexed
            const soFarResults = ITEMS_PER_REQUEST * (currentPage - 1) + pageOfRepos.items.length;
            const remainingResults = pageOfRepos.total_count - soFarResults;

            // If still have more results, return next page number to fetch
            if (remainingResults) return currentPage + 1;
        } else if (CONFIG.activeTab === "Installed") {
            const installedExtensions = getInstalledExtensions();
            installedExtensions.forEach((extensionKey) => {
                // TODO: err handling
                const extension = JSON.parse(localStorage.getItem(extensionKey));

                // I believe this stops the requests when switching tabs?
                if (requestQueue.length > 1 && queue !== requestQueue[0]) {
                    // Stop this queue from continuing to fetch and append to cards list
                    return -1;
                }

                this.appendCard(extension);
            });

            // Don't need to return a page number because
            // installed extension do them all in one go, since it's local
        }

        this.setState({ rest: true, endOfList: true });
        endOfList = true;
        return null;
    }

    async loadAmount(queue, quantity = 50) {
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
            this.loadAmount(requestQueue[0], 50);
        }
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

    render() {
        return react.createElement("section", {
            className: "contentSpacing",
        },
        react.createElement("div", {
            className: "marketplace-header",
        }, react.createElement("h1", null, this.props.title),
        // TODO: Add search bar and sort functionality
        // react.createElement("div", {
        //     className: "searchbar--bar__wrapper",
        // }, react.createElement("input", {
        //     className: "searchbar-bar",
        //     type: "text",
        //     placeholder: "Search for Extensions?",
        // })),
        // react.createElement(SortBox, {
        //     onChange: this.updateSort.bind(this),
        //     onTabsChange: this.updateTabs.bind(this),
        // })
        ), react.createElement("div", {
            id: "marketplace-grid",
            className: "main-gridContainer-gridContainer",
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
// TODO: add sort type, order, paging, etc?
// https://docs.github.com/en/github/searching-for-information-on-github/searching-on-github/searching-for-repositories#search-by-topic
// https://docs.github.com/en/rest/reference/search#search-repositories
/**
 * Query GitHub for all repos with the "spicetify-extensions" topic
 * @param {number} page The query page number
 * @returns Array of search results
 */
async function getRepos(page = 1) {
    // www is needed or it will block with "cross-origin" error.
    let url = `https://api.github.com/search/repositories?q=${encodeURIComponent("topic:spicetify-extensions")}`;
    // We can test multiple pages with this URL (58 results), as well as broken iamges etc.
    // let url = `https://api.github.com/search/repositories?q=${encodeURIComponent("topic:spicetify")}`;
    if (page) url += `&page=${page}`;

    // Sorting params (not implemented for Marketplace yet)
    // if (sortConfig.by.match(/top|controversial/) && sortConfig.time) {
    //     url += `&t=${sortConfig.time}`
    // }

    return await Spicetify.CosmosAsync.get(url);
}

// e.g. "https://api.github.com/repos/theRealPadster/spicetify-hide-podcasts/contents/{+path}"
// async function getRepoContents(contents_url) {
//     const url = contents_url.replace("{+path}", "");
//     return await Spicetify.CosmosAsync.get(url);
// }

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

    return await Spicetify.CosmosAsync.get(url);
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
        console.log(`${user}/${repo}`, manifests);

        if (!Array.isArray(manifests)) manifests = [manifests];

        // Remove installed extensions from manifests list if we don't want to show them
        if (CONFIG.visual.hideInstalled) {
            manifests = manifests.filter((manifest) => !localStorage.getItem("marketplace:installed:" + `${user}/${repo}/${manifest.main}`));
        }

        // Manifest is initially parsed
        const parsedManifests = manifests.map((manifest) => ({
            manifest,
            title: manifest.name,
            subtitle: manifest.description,
            user,
            repo,
            branch,
            imageURL: `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${manifest.preview}`,
            extensionURL: `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${manifest.main}`,
            readmeURL:  `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${manifest.readme}`,
            stars,
        }));

        return parsedManifests;
    }
    catch (err) {
        console.warn(contents_url, err);
        return null;
    }
}

// function postMapper(posts) {
//     let mappedPosts = [];
//     posts.forEach(post => {
//         let uri = URI.from(post.data.url);
//         if (uri && (
//             uri.type == "playlist" ||
//             uri.type == "playlist-v2" ||
//             uri.type == "track" ||
//             uri.type == "album"
//         )) {
//             mappedPosts.push({
//                 uri: uri.toURI(),
//                 type: uri.type,
//                 title: post.data.title,
//                 upvotes: post.data.ups
//             });
//         }
//     });
//     return mappedPosts;
// }
