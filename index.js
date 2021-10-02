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

// Define a function called "render" to specify app entry point
// This function will be used to mount app to main view.
// eslint-disable-next-line
function render() {
    // console.log('outer render');
    return react.createElement(Grid, { title: "Spicetify Marketplace" });
}

let servicesString = localStorage.getItem("reddit:services") || `["spotify","makemeaplaylist","SpotifyPlaylists","music","edm","popheads"]`;
let services = [];
try {
    services = JSON.parse(servicesString);
    if (!Array.isArray(services)) {
        throw new Error("");
    }
} catch {
    services = ["spotify", "makemeaplaylist", "SpotifyPlaylists", "music", "edm", "popheads"];
    localStorage.setItem("reddit:services", JSON.stringify(services));
}
// eslint-disable-next-line no-redeclare
const CONFIG = {
    visual: {
        type: localStorage.getItem("reddit:type") === "true",
        upvotes: localStorage.getItem("reddit:upvotes") === "true",
        followers: localStorage.getItem("reddit:followers") === "true",
        longDescription: localStorage.getItem("reddit:longDescription") === "true",
    },
    services,
    lastService: localStorage.getItem("reddit:last-service"),
};

if (!CONFIG.lastService || !CONFIG.services.includes(CONFIG.lastService)) {
    CONFIG.lastService = CONFIG.services[0];
}
let sortConfig = {
    by: localStorage.getItem("reddit:sort-by") || "top",
    time: localStorage.getItem("reddit:sort-time") || "month",
};
let cardList = [];
let endOfList = false;
let lastScroll = 0;
let requestQueue = [];
let requestAfter = null;

// eslint-disable-next-line no-unused-vars
let gridUpdateTabs, gridUpdatePostsVisual;

// eslint-disable-next-line no-unused-vars
const typesLocale = {
    album: Spicetify.Locale.get("album"),
    song: Spicetify.Locale.get("song"),
    playlist: Spicetify.Locale.get("playlist"),
};

class Grid extends react.Component {
    constructor(props) {
        super(props);
        Object.assign(this, props);
        this.state = {
            cards: [],
            tabs: CONFIG.services,
            rest: true,
            endOfList: endOfList,
        };

        // console.log('grid constructor');
    }

    newRequest(amount) {
        cardList = [];
        const queue = [];
        requestQueue.unshift(queue);
        this.loadAmount(queue, amount);
    }

    appendCard(item) {
        item.visual = CONFIG.visual;
        cardList.push(react.createElement(Card, item));
        this.setState({ cards: cardList });
    }

    updateSort(sortByValue, sortTimeValue) {
        if (sortByValue) {
            sortConfig.by = sortByValue;
            localStorage.setItem("reddit:sort-by", sortByValue);
        }
        if (sortTimeValue) {
            sortConfig.time = sortTimeValue;
            localStorage.setItem("reddit:sort-time", sortTimeValue);
        }

        requestAfter = null;
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
            tabs: [...CONFIG.services],
        });
    }

    updatePostsVisual() {
        cardList = cardList.map(card => {
            return react.createElement(Card, card.props);
        });
        this.setState({ cards: [...cardList] });
    }

    switchTo(value) {
        CONFIG.lastService = value;
        localStorage.setItem("reddit:last-service", value);
        cardList = [];
        requestAfter = null;
        this.setState({
            cards: [],
            rest: false,
            endOfList: false,
        });
        endOfList = false;

        this.newRequest(30);
    }



    async loadPage(queue) {
        // let subMeta = await getSubreddit(requestAfter);

        let allRepos = await getAllRepos();

        console.log("All repos" + allRepos);

        for (const repo of allRepos.items) {
            let extensions = await fetchRepoExtensions(repo.contents_url, repo.default_branch);
            console.log(repo.name, extensions);
            if (requestQueue.length > 1 && queue !== requestQueue[0]) {
                // Stop this queue from continuing to fetch and append to cards list
                return -1;
            }

            if (extensions && extensions.length) {
                extensions.forEach((extension) => this.appendCard(extension));
            }
        }

        // TODO: idk what this does, so don't delete yet
        // if (subMeta.data.after) {
        //     return subMeta.data.after;
        // }

        this.setState({ rest: true, endOfList: true });
        endOfList = true;
        return null;
    }

    async loadAmount(queue, quantity = 50) {
        this.setState({ rest: false });
        quantity += cardList.length;

        requestAfter = await this.loadPage(queue);

        while (
            requestAfter &&
            requestAfter !== -1 &&
            cardList.length < quantity &&
            !this.state.endOfList
        ) {
            requestAfter = await this.loadPage(queue);
        }

        if (requestAfter === -1) {
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
        // console.log('componentDidMount');
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
        }, react.createElement("div", {
            className: "marketplace-header",
        }, react.createElement("h1", null, this.props.title),
        react.createElement(SortBox, {
            onChange: this.updateSort.bind(this),
            onServicesChange: this.updateTabs.bind(this),
        })), react.createElement("div", {
            id: "reddit-grid",
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
            links: CONFIG.services,
            activeLink: CONFIG.lastService,
        }));
    }
}

// TODO: add license filter or anything?
// TODO: add sort type, order, paging, etc?
// https://docs.github.com/en/github/searching-for-information-on-github/searching-on-github/searching-for-repositories#search-by-topic
// https://docs.github.com/en/rest/reference/search#search-repositories
/**
 * Query GitHub for all repos with the "spicetify-extensions" topic
 * @returns Array of search results
 */
async function getAllRepos() {
    // www is needed or it will block with "cross-origin" error.
    let url = `https://api.github.com/search/repositories?q=${encodeURIComponent("topic:spicetify-extensions")}`;

    // TODO: idk what this is, so don't delete yet
    // if (after) {
    //     url += `&after=${after}`
    // }
    // if (sortConfig.by.match(/top|controversial/) && sortConfig.time) {
    //     url += `&t=${sortConfig.time}`
    // }

    return await Spicetify.CosmosAsync.get(url);
}


function initializeExtension(manifest, user, repo, main, branch) {
    const script = document.createElement("script");
    script.defer = true;

    if (main[0]  === "/") main = main.slice(1);

    script.src = `https://cdn.jsdelivr.net/gh/${user}/${repo}@${branch}/${main}`;
    document.body.appendChild(script);
    // eval(script);
}

function installedExt(manifest) {
    let extArr = [];
    manifest.forEach((ext) => extArr.push(localStorage.getItem("marketplace:installed:" + ext.main)));
    return extArr;
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

// async function getSubreddit(after = "") {
//     // www is needed or it will block with "cross-origin" error.
//     let url = `https://www.reddit.com/r/${CONFIG.lastService}/${sortConfig.by}.json?limit=100&count=10&raw_json=1`;
//     if (after) {
//         url += `&after=${after}`;
//     }
//     if (sortConfig.by.match(/top|controversial/) && sortConfig.time) {
//         url += `&t=${sortConfig.time}`;
//     }

//     return await Spicetify.CosmosAsync.get(url);
// }

// TODO: can we add a return type here?
/**
 * Fetch an extension and format data for generating a card
 * @param {string} contents_url The repo's GitHub API contents_url (e.g. "https://api.github.com/repos/theRealPadster/spicetify-hide-podcasts/contents/{+path}")
 * @param {string} branch The repo's default branch (e.g. main or master)
 * @returns Extension info for card (or null)
 */
async function fetchRepoExtensions(contents_url, branch) {
    try {
        // TODO: use the original search full_name ("theRealPadster/spicetify-hide-podcasts") or something to get the url better?
        const regex_result = contents_url.match(/https:\/\/api\.github\.com\/repos\/(?<user>.+)\/(?<repo>.+)\/contents/);
        // TODO: err handling?
        if (!regex_result || !regex_result.groups) return null;
        const { user, repo } = regex_result.groups;

        let manifests = await getRepoManifest(user, repo, branch);
        console.log(`${user}/${repo}`, manifests);

        if (!Array.isArray(manifests)) manifests = [manifests];

        let installedExtsArr = installedExt(manifests);
        console.log(installedExtsArr);
        for (let i = 0; i < installedExtsArr.length; i++) {
            if (installedExtsArr[i] != null) {
                let multManifest = manifests[i];
                console.log(multManifest);
                initializeExtension(multManifest, user, repo, multManifest.main, branch);
            }
        }

        const parsedManifests = manifests.map((manifest) => ({
            manifest,
            title: manifest.name,
            subtitle: manifest.description,
            branch,
            imageURL: `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${manifest.preview}`,
            extensionURL: `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${manifest.main}`,
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
