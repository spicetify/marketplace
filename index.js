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

/** @type {React} */
const react = Spicetify.React;
/** @type {ReactDOM} */
const reactDOM = Spicetify.ReactDOM;
const {
    URI,
    React: { useState, useEffect, useCallback },
    Platform: { History },
} = Spicetify;

// Define a function called "render" to specify app entry point
// This function will be used to mount app to main view.
function render() {
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

let gridUpdateTabs, gridUpdatePostsVisual;

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

        let allExtensions = await getAllExtensions();

        console.log("All extensions" + allExtensions);
        // foo.items.forEach(async item => {
        //     // const repo = await getRepo(item.contents_url);
        //     let manifest = null;
        //     try {
        //         manifest = await getRepoManifest(item.contents_url);
        //         console.log(item.name, manifest);
        //     } catch (err) {
        //         console.error(item.name, 'no manifest');
        //     }
        // })

        // let posts = postMapper(subMeta.data.children);
        // for (const post of posts) {
        //     let item;
        //     switch (post.type) {
        //         case "playlist":
        //         case "playlist-v2":
        //             // item = await fetchPlaylist(post);
        //             item = await fetchExtension()
        //             break;
        //         case "track":
        //             item = await fetchTrack(post);
        //             break;
        //         case "album":
        //             item = await fetchAlbum(post);
        //             break;
        //     }
        //     if (requestQueue.length > 1 && queue !== requestQueue[0]) {
        //         // Stop this queue from continuing to fetch and append to cards list
        //         return -1;
        //     }

        //     item && this.appendCard(item);
        // }

        for (const extension of allExtensions.items) {
            let item;
            item = await fetchExtension(extension.contents_url);
            console.log(extension.name, item);
            if (requestQueue.length > 1 && queue !== requestQueue[0]) {
                // Stop this queue from continuing to fetch and append to cards list
                return -1;
            }

            item && this.appendCard(item);
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
            !this.endOfList
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
            className: "contentSpacing"
        }, react.createElement("div", {
            className: "reddit-header"
        }, react.createElement("h1", null, this.props.title),
        react.createElement(SortBox, {
            onChange: this.updateSort.bind(this),
            onServicesChange: this.updateTabs.bind(this),
        })), react.createElement("div", {
            id: "reddit-grid",
            className: "main-gridContainer-gridContainer",
            style: {
                "--minimumColumnWidth": "180px"
            },
        }, [...cardList]), react.createElement("footer", {
            style: {
                margin: "auto",
                textAlign: "center",
            }
        }, !this.state.endOfList && (this.state.rest ? react.createElement(LoadMoreIcon, { onClick: this.loadMore.bind(this) }) : react.createElement(LoadingIcon))
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
async function getAllExtensions() {
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

function initializeExtension(manifest,user, repo) {

    const script = document.createElement("script");
    script.defer = true;

    // script.onload = function () {
    // };

    script.src = `https://cdn.jsdelivr.net/gh/${user}/${repo}@master/${manifest.main}`;
    document.body.appendChild(script);
    // eval(script);

}

// e.g. "https://api.github.com/repos/theRealPadster/spicetify-hide-podcasts/contents/{+path}"
async function getRepoContents(contents_url) {
    const url = contents_url.replace("{+path}", "");
    return await Spicetify.CosmosAsync.get(url);
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
    return await Spicetify.CosmosAsync.get(url);
}

async function getSubreddit(after = "") {
    // www is needed or it will block with "cross-origin" error.
    var url = `https://www.reddit.com/r/${CONFIG.lastService}/${sortConfig.by}.json?limit=100&count=10&raw_json=1`;
    if (after) {
        url += `&after=${after}`;
    }
    if (sortConfig.by.match(/top|controversial/) && sortConfig.time) {
        url += `&t=${sortConfig.time}`;
    }

    return await Spicetify.CosmosAsync.get(url);
}

// TODO: can we add a return type here?
/**
 * Fetch an extension and format data for generating a card
 * @param {string} contents_url The repo's GitHub API contents_url (e.g. "https://api.github.com/repos/theRealPadster/spicetify-hide-podcasts/contents/{+path}")
 * @returns Extension info for card (or null)
 */
async function fetchExtension(contents_url) {
    try {
        // TODO: use the original search full_name ("theRealPadster/spicetify-hide-podcasts") or something to get the url better?
        const regex_result = contents_url.match(/https:\/\/api\.github\.com\/repos\/(?<user>.+)\/(?<repo>.+)\/contents/);
        // TODO: err handling?
        if (!regex_result || !regex_result.groups) return null;
        const { user, repo } = regex_result.groups;

        // TODO: how do i get the default branch name?
        const manifest = await getRepoManifest(user, repo, "main");
        console.log(`${user}/${repo}`, manifest);

        const installedExt = localStorage.getItem("marketplace:installed:" + manifest.main);
        console.log(installedExt);
        if (installedExt) { initializeExtension(manifest,user, repo);}

        return ({
            //  type: typesLocale.playlist,
            //  uri: 'spotify:user:therealpadster:playlist:4L4WIps1CJ8WU089ii38Cq',
            //  upvotes: 0,
            //  followersCount: 0,

            // This is the actual stuff we want
            manifest: manifest,
            title: manifest.name,
            subtitle: manifest.description,
            imageURL: `https://raw.githubusercontent.com/${user}/${repo}/main/${manifest.preview}`,
            extensionURL: `https://raw.githubusercontent.com/${user}/${repo}/main/${manifest.main}`
        });
    } catch (err) {
        console.warn(contents_url, err);
        // console.error(contents_url, 'no manifest');
        return null;
    }
}

async function fetchPlaylist(post) {
    try {
        const res = await Spicetify.CosmosAsync.get(
            `sp://core-playlist/v1/playlist/${post.uri}/metadata`,
            {
                policy: {
                    name: true,
                    picture: true,
                    followers: true,
                }
            }
        );

        const { metadata } = res;
        return ({
            type: typesLocale.playlist,
            uri: post.uri,
            title: metadata.name,
            subtitle: post.title,
            imageURL: "https://i.scdn.co/image/" + metadata.picture.split(":")[2],
            upvotes: post.upvotes,
            followersCount: metadata.followers,
        });
    } catch {
        return null;
    }
}

async function fetchAlbum(post) {
    const arg = post.uri.split(":")[2];
    try {
        const metadata = await Spicetify.CosmosAsync.get(`hm://album/v1/album-app/album/${arg}/desktop`);
        return ({
            type: typesLocale.album,
            uri: post.uri,
            title: metadata.name,
            subtitle: metadata.artists,
            imageURL: metadata.cover.uri,
            upvotes: post.upvotes,
        });
    } catch {
        return null;
    }
}

async function fetchTrack(post) {
    const arg = post.uri.split(":")[2];
    try {
        const metadata = await Spicetify.CosmosAsync.get(`https://api.spotify.com/v1/tracks/${arg}`);
        return ({
            type: typesLocale.song,
            uri: post.uri,
            title: metadata.name,
            subtitle: metadata.artists,
            imageURL: metadata.album.images[0].url,
            upvotes: post.upvotes,
        });
    } catch {
        return null;
    }
}

function postMapper(posts) {
    var mappedPosts = [];
    posts.forEach(post => {
        var uri = URI.from(post.data.url);
        if (uri && (
            uri.type == "playlist" ||
            uri.type == "playlist-v2" ||
            uri.type == "track" ||
            uri.type == "album"
        )) {
            mappedPosts.push({
                uri: uri.toURI(),
                type: uri.type,
                title: post.data.title,
                upvotes: post.data.ups
            });
        }
    });
    return mappedPosts;
}
