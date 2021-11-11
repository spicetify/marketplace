/// <reference path="ReloadModal.js" />
const TRASH_ICON = react.createElement("svg", {
    height: "16",
    role: "img",
    width: "16",
    viewBox: "0 0 448 512",
    "aria-hidden": "true",
}, react.createElement("path", {
    d: "M53.21 467c1.562 24.84 23.02 45 47.9 45h245.8c24.88 0 46.33-20.16 47.9-45L416 128H32L53.21 467zM432 32H320l-11.58-23.16c-2.709-5.42-8.25-8.844-14.31-8.844H153.9c-6.061 0-11.6 3.424-14.31 8.844L128 32H16c-8.836 0-16 7.162-16 16V80c0 8.836 7.164 16 16 16h416c8.838 0 16-7.164 16-16V48C448 39.16 440.8 32 432 32z",
    fill: "currentColor",
}));

const DOWNLOAD_ICON = react.createElement("svg", {
    height: "16",
    role: "img",
    width: "16",
    viewBox: "0 0 512 512",
    "aria-hidden": "true",
}, react.createElement("path", {
    d: "M480 352h-133.5l-45.25 45.25C289.2 409.3 273.1 416 256 416s-33.16-6.656-45.25-18.75L165.5 352H32c-17.67 0-32 14.33-32 32v96c0 17.67 14.33 32 32 32h448c17.67 0 32-14.33 32-32v-96C512 366.3 497.7 352 480 352zM432 456c-13.2 0-24-10.8-24-24c0-13.2 10.8-24 24-24s24 10.8 24 24C456 445.2 445.2 456 432 456zM233.4 374.6C239.6 380.9 247.8 384 256 384s16.38-3.125 22.62-9.375l128-128c12.49-12.5 12.49-32.75 0-45.25c-12.5-12.5-32.76-12.5-45.25 0L288 274.8V32c0-17.67-14.33-32-32-32C238.3 0 224 14.33 224 32v242.8L150.6 201.4c-12.49-12.5-32.75-12.5-45.25 0c-12.49 12.5-12.49 32.75 0 45.25L233.4 374.6z",
    fill: "currentColor",
}));

// eslint-disable-next-line no-redeclare, no-unused-vars
class Card extends react.Component {
    constructor(props) {
        super(props);

        // From `appendCard()`
        /** @type { { type: string; stars: string; } } */
        this.visual;

        // From `fetchRepoExtensions()`
        /** @type { { name: string; description: string; main: string; preview: string; readme: string; } } */
        this.manifest;
        /** @type { string } */
        this.title;
        /** @type { string } */
        this.subtitle;
        /** @type { string } */
        this.repo;
        /** @type { string } */
        this.user;
        /** @type { string } */
        this.branch;
        /** @type { string } */
        this.imageURL;
        /** @type { string } */
        this.extensionURL;
        /** @type { string } */
        this.readmeURL;
        /** @type { number } */
        this.stars;

        // Added locally
        // this.menuType = Spicetify.ReactComponent.Menu | "div";
        this.menuType = Spicetify.ReactComponent.Menu;
        this.localStorageKey = "marketplace:installed:" + `${props.user}/${props.repo}/${props.manifest.main}`;

        Object.assign(this, props);

        this.state = {
            installed: localStorage.getItem(this.localStorageKey) !== null,
            // TODO: Can I remove `stars` from `this`? Or maybe just put everything in `state`?
            stars: this.stars,
        };
    }

    async componentDidMount() {
        // Refresh stars if on "Installed" tab with stars enabled
        if (CONFIG.activeTab === "Installed" && CONFIG.visual.stars) {
            // https://docs.github.com/en/rest/reference/repos#get-a-repository
            const url = `https://api.github.com/repos/${this.user}/${this.repo}`;
            // TODO: This implementation could probably be improved.
            // It might have issues when quickly switching between tabs.
            const repoData = await Spicetify.CosmosAsync.get(url);

            if (this.state.stars !== repoData.stargazers_count) {
                this.setState({ stars: repoData.stargazers_count }, () => {
                    console.log(`Stars updated to: ${this.state.stars}; updating localstorage.`);
                    this.installExtension();
                });
            }
        }
    }

    installExtension() {
        console.log(`Installing extension ${this.localStorageKey}`);
        // Add to localstorage (this stores a copy of all the card props in the localstorage)
        // TODO: refactor/clean this up
        localStorage.setItem(this.localStorageKey, JSON.stringify({
            manifest: this.manifest,
            title: this.title,
            subtitle: this.subtitle,
            user: this.user,
            repo: this.repo,
            branch: this.branch,
            imageURL: this.imageURL,
            extensionURL: this.extensionURL,
            readmeURL: this.readmeURL,
            stars: this.state.stars,
        }));

        // Add to installed list if not there already
        const installedExtensions = getInstalledExtensions();
        if (installedExtensions.indexOf(this.localStorageKey) === -1) {
            installedExtensions.push(this.localStorageKey);
            localStorage.setItem(LOCALSTORAGE_KEYS.installedExtensions, JSON.stringify(installedExtensions));
        }

        console.log("Installed");
        this.setState({ installed: true });
        // console.log(JSON.parse(localStorage.getItem(this.localStorageKey)));
    }

    removeExtension() {
        const extValue = localStorage.getItem(this.localStorageKey);
        // console.log(JSON.parse(extValue));
        if (extValue) {
            console.log(`Removing extension ${this.localStorageKey}`);
            // Remove from localstorage
            localStorage.removeItem(this.localStorageKey);

            // Remove from installed list
            const installedExtensions = getInstalledExtensions();
            const remainingInstalledExtensions = installedExtensions.filter((key) => key !== this.localStorageKey);
            localStorage.setItem(LOCALSTORAGE_KEYS.installedExtensions, JSON.stringify(remainingInstalledExtensions));

            console.log("Removed");
            this.setState({ installed: false });
            openReloadModal();
        }
    }

    openReadme() {
        // TODO: this seems to not work when I go back and click on it again.
        // It still runs but nothing happens.
        // Something with the location object (hash or something)?
        Spicetify.Platform.History.push({
            pathname: "/spicetify-marketplace",
            state: {
                page: "readme",
                data: {
                    title: this.title,
                    user: this.user,
                    repo: this.repo,
                    branch: this.branch,
                    readmeURL: this.readmeURL,
                },
            },
        });
    }

    render() {
        // Kill the card if it has been uninstalled on the "Installed" tab
        // TODO: is this kosher, or is there a better way to handle?
        if (CONFIG.activeTab === "Installed" && !this.state.installed) {
            console.log("extension not installed");
            return null;
        }

        const cardClasses = ["main-card-card"];
        if (this.state.installed) cardClasses.push("marketplace-card--installed");

        let detail = [];
        // this.visual.type && detail.push(this.type);
        this.visual.stars && detail.push(`★ ${this.state.stars}`);
        return react.createElement(Spicetify.ReactComponent.RightClickMenu || "div", {
            menu: react.createElement(this.menuType, {}),
        }, react.createElement("div", {
            className: cardClasses.join(" "),
            // onClick: () => this.openReadme(),
        }, react.createElement("div", {
            className: "main-card-draggable",
            draggable: "true",
        }, react.createElement("div", {
            className: "main-card-imageContainer",
        }, react.createElement("div", {
            className: "main-cardImage-imageWrapper",
        }, react.createElement("div", {
        }, react.createElement("img", {
            "aria-hidden": "false",
            draggable: "false",
            loading: "lazy",
            src: this.imageURL,
            className: "main-image-image main-cardImage-image",
            onError: (e) => {
                // Set to transparent PNG to remove the placeholder icon
                // https://png-pixel.com
                e.target.setAttribute("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII");

                // Add class for styling
                e.target.closest(".main-cardImage-imageWrapper").classList.add("main-cardImage-imageWrapper--error");
            },
        }))), react.createElement("div", {
            className: "main-card-PlayButtonContainer",
        }, react.createElement("button", {
            className: "main-playButton-PlayButton main-playButton-primary",
            "aria-label": this.state.installed ? Spicetify.Locale.get("remove") : Spicetify.Locale.get("save"),
            style: { "--size": "40px" },
            onClick: (e) => {
                e.stopPropagation();
                if (localStorage.getItem(this.localStorageKey) == null) {
                    this.installExtension();
                } else {
                    console.log("Extension already installed, removing");
                    this.removeExtension();
                }
            },
        },
        this.state.installed ? TRASH_ICON : DOWNLOAD_ICON,
        ))), react.createElement("div", {
            className: "main-card-cardMetadata",
        }, react.createElement("a", {
            draggable: "false",
            title: this.manifest.name,
            className: "main-cardHeader-link",
            dir: "auto",
            href: "TODO: add some href here?",
        }, react.createElement("div", {
            className: "main-cardHeader-text main-type-balladBold",
            as: "div",
        }, this.title)), detail.length > 0 && react.createElement("div", {
            className: "main-cardSubHeader-root main-type-mestoBold marketplace-cardSubHeader",
            as: "div",
        }, react.createElement("span", null, detail.join(" ‒ ")),
        ), react.createElement("p", {
            className: "marketplace-card-desc",
        }, this.manifest.description),
        this.state.installed && react.createElement("div", {
            className: "marketplace-card__bottom-meta main-type-mestoBold",
            as: "div",
        }, "✓ Installed"),
        ))));
    }
}
