/// <reference path="ReloadModal.js" />

// eslint-disable-next-line no-redeclare, no-unused-vars
class Card extends react.Component {
    constructor(props) {
        super(props);

        // From `appendCard()`
        /** @type { { type: string; stars: string; } } */
        this.visual;
        /** @type { "extension" | "theme" | "snippet" } */
        this.type;

        // From `fetchRepoExtensions()`, `fetchThemes()`, and snippets.json
        /** @type { {
         * name: string;
         * description: string;
         * main: string;
         * preview: string;
         * readme: string;
         * code?: string;
         * usercss?: string;
         * schemes?: string;
         * include?: string[]
         * } } */
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
        // Theme stuff
        /** @type { string? } */
        this.cssURL;
        /** @type { string? } */
        this.schemesURL;
        /** @type { string[]? } */
        this.include;
        // Snippet stuff
        /** @type { string? } */
        this.code;
        /** @type { string? } */
        this.description;

        // Added locally
        // this.menuType = Spicetify.ReactComponent.Menu | "div";
        this.menuType = Spicetify.ReactComponent.Menu;

        let prefix = props.type === "snippet" ? "snippet:" : `${props.user}/${props.repo}/`;

        let cardId = "";
        if (props.type === "snippet") cardId = props.title.replaceAll(" ", "-");
        else if (props.type === "theme") cardId = props.manifest.usercss;
        else if (props.type === "extension") cardId = props.manifest.main;

        this.localStorageKey = `marketplace:installed:${prefix}${cardId}`;

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
            const repoData = await fetch(url).then(res => res.json());

            if (this.state.stars !== repoData.stargazers_count) {
                this.setState({ stars: repoData.stargazers_count }, () => {
                    console.log(`Stars updated to: ${this.state.stars}; updating localstorage.`);
                    this.installExtension();
                });
            }
        }
    }

    buttonClicked() {
        if (this.type === "extension") {
            if (this.state.installed) {
                console.log("Extension already installed, removing");
                this.removeExtension();
            } else {
                this.installExtension();
            }
            openReloadModal();
        } else if (this.type === "theme") {
            if (this.state.installed) {
                console.log("Theme already installed, removing");
                this.removeTheme(this.localStorageKey);
            } else {
                // Remove theme if already installed, then install the new theme
                this.removeTheme();
                this.installTheme();
            }
            openReloadModal();
        } else if (this.type === "snippet") {
            if (this.state.installed) {
                console.log("Snippet already installed, removing");
                this.removeSnippet();
            } else {
                this.installSnippet();
            }
        } else {
            console.error("Unknown card type");
        }
    }

    installExtension() {
        console.log(`Installing extension ${this.localStorageKey}`);
        // Add to localstorage (this stores a copy of all the card props in the localstorage)
        // TODO: refactor/clean this up
        localStorage.setItem(this.localStorageKey, JSON.stringify({
            manifest: this.manifest,
            type: this.type,
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
        const installedExtensions = getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.installedExtensions, []);
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
            const installedExtensions = getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.installedExtensions, []);
            const remainingInstalledExtensions = installedExtensions.filter((key) => key !== this.localStorageKey);
            localStorage.setItem(LOCALSTORAGE_KEYS.installedExtensions, JSON.stringify(remainingInstalledExtensions));

            console.log("Removed");
            this.setState({ installed: false });
        }
    }

    async installTheme() {
        console.log(`Installing theme ${this.localStorageKey}`);

        let parsedSchemes = null;
        if (this.schemesURL) {
            const schemesResponse = await fetch(this.schemesURL);
            const colourSchemes = await schemesResponse.text();
            parsedSchemes = parseIni(colourSchemes);
        }
        console.log(parsedSchemes);

        // Add to localstorage (this stores a copy of all the card props in the localstorage)
        // TODO: refactor/clean this up
        localStorage.setItem(this.localStorageKey, JSON.stringify({
            manifest: this.manifest,
            type: this.type,
            title: this.title,
            subtitle: this.subtitle,
            user: this.user,
            repo: this.repo,
            branch: this.branch,
            imageURL: this.imageURL,
            extensionURL: this.extensionURL,
            readmeURL: this.readmeURL,
            stars: this.state.stars,
            // Theme stuff
            cssURL: this.cssURL,
            schemesURL: this.schemesURL,
            include: this.include,
            // Installed theme localstorage item has schemes, nothing else does
            schemes: parsedSchemes,
            activeScheme: parsedSchemes ? Object.keys(parsedSchemes)[0] : null,
        }));

        // TODO: handle this differently?

        // Add to installed list if not there already
        const installedExtensions = getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.installedExtensions, []);
        if (installedExtensions.indexOf(this.localStorageKey) === -1) {
            installedExtensions.push(this.localStorageKey);
            localStorage.setItem(LOCALSTORAGE_KEYS.installedExtensions, JSON.stringify(installedExtensions));

            // const usercssURL = `https://raw.github.com/${this.user}/${this.repo}/${this.branch}/${this.manifest.usercss}`;
            localStorage.setItem(LOCALSTORAGE_KEYS.themeInstalled, this.localStorageKey);
        }

        console.log("Installed");
        this.setState({ installed: true });
        // console.log(JSON.parse(localStorage.getItem(this.localStorageKey)));
    }

    removeTheme(themeKey = null) {
        // If don't specify theme, remove the currently installed theme
        themeKey = themeKey || localStorage.getItem(LOCALSTORAGE_KEYS.themeInstalled);

        const themeValue = themeKey && localStorage.getItem(themeKey);

        if (themeValue) {
            console.log(`Removing theme ${themeKey}`);

            // Remove from localstorage
            localStorage.removeItem(themeKey);

            // Remove record of installed theme
            localStorage.removeItem(LOCALSTORAGE_KEYS.themeInstalled);

            // Remove from installed list
            const installedExtensions = getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.installedExtensions, []);
            const remainingInstalledExtensions = installedExtensions.filter((key) => key !== themeKey);
            localStorage.setItem(LOCALSTORAGE_KEYS.installedExtensions, JSON.stringify(remainingInstalledExtensions));

            console.log("Removed");
            // TODO: this doesn't remove the "installed" state on the installed card
            // if you just install a new theme to replace the existing one
            this.setState({ installed: false });
        }
    }

    installSnippet() {
        console.log(`Installing Snippet ${this.localStorageKey}`);
        localStorage.setItem(this.localStorageKey, JSON.stringify({
            code: this.code,
            title: this.title,
            description: this.description,
        }));

        // Add to installed list if not there already
        const installedSnippetKeys = getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.snippetsInstalled, []);
        if (installedSnippetKeys.indexOf(this.localStorageKey) === -1) {
            installedSnippetKeys.push(this.localStorageKey);
            localStorage.setItem(LOCALSTORAGE_KEYS.installedSnippets, JSON.stringify(installedSnippetKeys));
        }
        const installedSnippets = installedSnippetKeys.map((key) => getLocalStorageDataFromKey(key));
        initializeSnippets(installedSnippets);

        this.setState({installed: true});
    }

    removeSnippet() {
        localStorage.removeItem(this.localStorageKey);

        // Remove from installed list
        const installedSnippetKeys = getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.snippetsInstalled, []);
        const remainingInstalledSnippetKeys = installedSnippetKeys.filter((key) => key !== this.localStorageKey);
        localStorage.setItem(LOCALSTORAGE_KEYS.installedSnippets, JSON.stringify(remainingInstalledSnippetKeys));
        const remainingInstalledSnippets = remainingInstalledSnippetKeys.map((key) => getLocalStorageDataFromKey(key));
        initializeSnippets(remainingInstalledSnippets);

        this.setState({installed: false});
    }

    openReadme() {
        if (this.manifest.readme) {
            Spicetify.Platform.History.push({
                pathname: "/spicetify-marketplace/readme",
                state: {
                    data: {
                        title: this.title,
                        user: this.user,
                        repo: this.repo,
                        branch: this.branch,
                        readmeURL: this.readmeURL,
                    },
                },
            });
        } else {
            Spicetify.showNotification("No page was found");
        }
    }

    render() {
        // Kill the card if it has been uninstalled on the "Installed" tab
        // TODO: is this kosher, or is there a better way to handle?
        console.log(this);
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
            onClick: () => this.openReadme(),
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
            //Create a div using normalized play button classes to use the css provided by themes
        }))), react.createElement("div", {
            className: "main-card-PlayButtonContainer",
        }, react.createElement("button", {
            className: "main-playButton-PlayButton main-playButton-primary",
            // If it is installed, it will remove it when button is clicked, if not it will save
            "aria-label": this.state.installed ? Spicetify.Locale.get("remove") : Spicetify.Locale.get("save"),
            style: { "--size": "40px", "cursor": "pointer"},
            onClick: (e) => {
                e.stopPropagation();
                this.buttonClicked();
            },
        },
        //If the extension, theme, or snippet is already installed, it will display trash, otherwise it displays download
        this.state.installed ? TRASH_ICON : DOWNLOAD_ICON,
        ))), react.createElement("div", {
            className: "main-card-cardMetadata",
        }, react.createElement("a", {
            draggable: "false",
            title: this.type === "snippet" ? this.props.title : this.manifest.name,
            className: "main-cardHeader-link",
            dir: "auto",
            href: "TODO: add some href here?",
        }, react.createElement("div", {
            className: "main-cardHeader-text main-type-balladBold",
            as: "div",
        }, this.props.title)), detail.length > 0 && react.createElement("div", {
            className: "main-cardSubHeader-root main-type-mestoBold marketplace-cardSubHeader",
            as: "div",
        },
        react.createElement("a", {

            title: this.user,
            draggable: "false",
            dir: "auto",
            href: "https://github.com/" + this.user,
        }, this.user),
        react.createElement("br", null, null),
        react.createElement("span", null, detail.join(" ‒ ")),
        ), react.createElement("p", {
            className: "marketplace-card-desc",
        }, this.type === "snippet" ? this.props.description : this.manifest.description),
        this.include && react.createElement("div", {
            className: "marketplace-card__bottom-meta main-type-mestoBold",
            as: "div",
        }, "Includes external JS"),
        this.state.installed && react.createElement("div", {
            className: "marketplace-card__bottom-meta main-type-mestoBold",
            as: "div",
        }, "✓ Installed"),
        ))));
    }
}
