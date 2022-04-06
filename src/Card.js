/// <reference path="ReloadModal.js" />

// eslint-disable-next-line no-redeclare, no-unused-vars
class Card extends react.Component {
    constructor(props) {
        super(props);

        this.MAX_TAGS = 4;

        // From `appendCard()`
        /** @type { { type: string; stars:   string; } } */
        this.visual;
        /** @type { "extension" | "theme" | "snippet" } */
        this.type;
        /** @type { (any, string) => void } */
        this.updateColourSchemes = props.updateColourSchemes;
        /** @type { (string) => void } */
        this.updateActiveTheme = props.updateActiveTheme;

        // From `fetchExtensionManifest()`, `fetchThemeManifest()`, and snippets.json
        /** @type { {
         * name: string;
         * description: string;
         * main: string;
         * authors: { name: string; url: string; }[];
         * preview: string;
         * readme: string;
         * tags?: string[];
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
        /** @type { { name: string; url: string; }[] } */
        this.authors;
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
        /** @type { string[] } */
        this.tags;

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

        // Needs to be after Object.assign so an undefined 'tags' field doesn't overwrite the default []
        this.tags = props.tags || [];
        if (props.include) this.tags.push("external JS");

        this.state = {
            // Initial value. Used to trigger a re-render.
            // isInstalled() is used for all other intents and purposes
            installed: localStorage.getItem(this.localStorageKey) !== null,

            // TODO: Can I remove `stars` from `this`? Or maybe just put everything in `state`?
            stars: this.stars,
            tagsExpanded: false,
        };
    }

    // Using this because it gets the live value ('installed' is stuck after a re-render)
    isInstalled() {
        return localStorage.getItem(this.localStorageKey) !== null;
    }

    async componentDidMount() {
        // Refresh stars if on "Installed" tab with stars enabled
        if (CONFIG.activeTab === "Installed" && CONFIG.visual.stars && this.type !== "snippet") {
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
            if (this.isInstalled()) {
                console.log("Extension already installed, removing");
                this.removeExtension();
            } else {
                this.installExtension();
            }
            openReloadModal();
        } else if (this.type === "theme") {
            const themeKey = localStorage.getItem("marketplace:theme-installed");
            const previousTheme = getLocalStorageDataFromKey(themeKey, {});
            console.log(previousTheme);
            console.log(themeKey);

            if (this.isInstalled()) {
                console.log("Theme already installed, removing");
                this.removeTheme(this.localStorageKey);
            } else {
                // Remove theme if already installed, then install the new theme
                this.removeTheme();
                this.installTheme();
            }

            // If the new or previous theme has JS, prompt to reload
            if (this.include || previousTheme.include) openReloadModal();
        } else if (this.type === "snippet") {
            if (this.isInstalled()) {
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
            authors: this.authors,
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

        const activeScheme = parsedSchemes ? Object.keys(parsedSchemes)[0] : null;

        // Add to localstorage (this stores a copy of all the card props in the localstorage)
        // TODO: refactor/clean this up
        localStorage.setItem(this.localStorageKey, JSON.stringify({
            manifest: this.manifest,
            type: this.type,
            title: this.title,
            subtitle: this.subtitle,
            authors: this.authors,
            user: this.user,
            repo: this.repo,
            branch: this.branch,
            imageURL: this.imageURL,
            extensionURL: this.extensionURL,
            readmeURL: this.readmeURL,
            stars: this.state.stars,
            tags: this.tags,
            // Theme stuff
            cssURL: this.cssURL,
            schemesURL: this.schemesURL,
            include: this.include,
            // Installed theme localstorage item has schemes, nothing else does
            schemes: parsedSchemes,
            activeScheme,
        }));

        // TODO: handle this differently?

        // Add to installed list if not there already
        const installedThemes = getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.installedThemes, []);
        if (installedThemes.indexOf(this.localStorageKey) === -1) {
            installedThemes.push(this.localStorageKey);
            localStorage.setItem(LOCALSTORAGE_KEYS.installedThemes, JSON.stringify(installedThemes));

            // const usercssURL = `https://raw.github.com/${this.user}/${this.repo}/${this.branch}/${this.manifest.usercss}`;
            localStorage.setItem(LOCALSTORAGE_KEYS.themeInstalled, this.localStorageKey);
        }

        console.log("Installed");

        // TODO: We'll also need to actually update the usercss etc, not just the colour scheme
        // e.g. the stuff from extension.js, like injectUserCSS() etc.

        if (!this.include) {
            // Add new theme css
            this.injectUserCSS(this.localStorageKey);
            // Update the active theme in Grid state, triggers state change and re-render
            this.updateActiveTheme(this.localStorageKey);
            // Update schemes in Grid, triggers state change and re-render
            this.updateColourSchemes(parsedSchemes, activeScheme);
        }

        this.setState({ installed: true });
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
            const installedThemes = getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.installedThemes, []);
            const remainingInstalledThemes = installedThemes.filter((key) => key !== themeKey);
            localStorage.setItem(LOCALSTORAGE_KEYS.installedThemes, JSON.stringify(remainingInstalledThemes));

            console.log("Removed");

            // Removes the current theme CSS
            this.injectUserCSS(null);
            // Update the active theme in Grid state
            this.updateActiveTheme(null);
            // Removes the current colour scheme
            this.updateColourSchemes(null);

            this.setState({ installed: false });
        }
    }

    installSnippet() {
        console.log(`Installing snippet ${this.localStorageKey}`);
        localStorage.setItem(this.localStorageKey, JSON.stringify({
            code: this.code,
            title: this.title,
            description: this.description,
        }));

        // Add to installed list if not there already
        const installedSnippetKeys = getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.installedSnippets, []);
        if (installedSnippetKeys.indexOf(this.localStorageKey) === -1) {
            installedSnippetKeys.push(this.localStorageKey);
            localStorage.setItem(LOCALSTORAGE_KEYS.installedSnippets, JSON.stringify(installedSnippetKeys));
        }
        const installedSnippets = installedSnippetKeys.map((key) => getLocalStorageDataFromKey(key));
        initializeSnippets(installedSnippets);

        this.setState({ installed: true });
    }

    removeSnippet() {
        localStorage.removeItem(this.localStorageKey);

        // Remove from installed list
        const installedSnippetKeys = getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.installedSnippets, []);
        const remainingInstalledSnippetKeys = installedSnippetKeys.filter((key) => key !== this.localStorageKey);
        localStorage.setItem(LOCALSTORAGE_KEYS.installedSnippets, JSON.stringify(remainingInstalledSnippetKeys));
        const remainingInstalledSnippets = remainingInstalledSnippetKeys.map((key) => getLocalStorageDataFromKey(key));
        initializeSnippets(remainingInstalledSnippets);

        this.setState({ installed: false });
    }

    openReadme() {
        if (this.manifest && this.manifest.readme) {
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

    generateAuthorsDiv() {
        // Add a div with author links inside
        const authorsDiv = (
            react.createElement("div", { className: "marketplace-card__authors" },
                this.authors.map((author) => {
                    return (
                        react.createElement("a", {
                            title: author.name,
                            className: "marketplace-card__author",
                            href: author.url,
                            draggable: false,
                            dir: "auto",
                            target: "_blank",
                            rel: "noopener noreferrer",
                            onClick: (e) => e.stopPropagation(),
                        }, author.name)
                    );
                }),
            )
        );

        return authorsDiv;
    }

    generateTags(tags) {
        return tags.reduce((accum, tag) => {
            // Render tags if enabled. Always render external JS tag
            if (CONFIG.visual.tags || tag === "external JS") {
                accum.push(
                    react.createElement("li", {
                        className: "marketplace-card__tag",
                        draggable: false,
                        "data-tag": tag,
                    }, tag),
                );
            }
            return accum;
        }, []);
    }

    generateTagsList() {
        const baseTags = this.tags.slice(0, this.MAX_TAGS);
        const extraTags = this.tags.slice(this.MAX_TAGS);

        // Add a ul with tags inside
        const tagsList = (
            react.createElement("ul", { className: "marketplace-card__tags" },
                this.generateTags(baseTags),
                // Show any extra tags if expanded
                extraTags.length && this.state.tagsExpanded
                    ? this.generateTags(extraTags)
                    : null,
            )
        );

        // Render the tags list and add expand button if there are more tags
        return [tagsList, extraTags.length && !this.state.tagsExpanded
            ? react.createElement("button", {
                className: "marketplace-card__tags-more-btn",
                onClick: (e) => {
                    e.stopPropagation();
                    this.setState({ tagsExpanded: true });
                },
            }, "...")
            : null];
    }

    render() {
        // Cache this for performance
        let IS_INSTALLED = this.isInstalled();
        // console.log(`Rendering ${this.localStorageKey} - is ${IS_INSTALLED ? "" : "not"} installed`);

        // Kill the card if it has been uninstalled on the "Installed" tab
        // TODO: is this kosher, or is there a better way to handle?
        if (CONFIG.activeTab === "Installed" && !IS_INSTALLED) {
            console.log("Card item not installed");
            return null;
        }

        const cardClasses = ["main-card-card", `marketplace-card--${this.type}`];
        if (IS_INSTALLED) cardClasses.push("marketplace-card--installed");

        let detail = [];
        // this.visual.type && detail.push(this.type);
        if (this.type !== "snippet" && this.visual.stars) {
            detail.push(`★ ${this.state.stars}`);
        }
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
        })))), react.createElement("div", {
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
        }, this.props.title)),  react.createElement("div", {
            className: "main-cardSubHeader-root main-type-mestoBold marketplace-cardSubHeader",
            as: "div",
        },
        // Add authors if they exist
        this.authors && this.generateAuthorsDiv(),
        react.createElement("span", null, detail.join(" ‒ ")),
        ), react.createElement("p", {
            className: "marketplace-card-desc",
        }, this.type === "snippet" ? this.props.description : this.manifest.description),
        this.tags.length ? react.createElement("div", {
            className: "marketplace-card__bottom-meta main-type-mestoBold",
            as: "div",
        }, this.generateTagsList()) : null,
        IS_INSTALLED && react.createElement("div", {
            className: "marketplace-card__bottom-meta main-type-mestoBold",
            as: "div",
        }, "✓ Installed"), react.createElement("div", {
            className: "main-card-PlayButtonContainer",
        }, react.createElement("button", {
            className: "main-playButton-PlayButton main-playButton-primary",
            // If it is installed, it will remove it when button is clicked, if not it will save
            "aria-label": IS_INSTALLED ? Spicetify.Locale.get("remove") : Spicetify.Locale.get("save"),
            style: { "--size": "40px", "cursor": "pointer" },
            onClick: (e) => {
                e.stopPropagation();
                this.buttonClicked();
            },
        },
        //If the extension, theme, or snippet is already installed, it will display trash, otherwise it displays download
        IS_INSTALLED ? TRASH_ICON : DOWNLOAD_ICON,
        )),
        ))));
    }

    // TODO: keep in sync with extension.js
    /**
     * Update the user.css in the DOM
     * @param {string | null} theme The theme localStorageKey or null, if we want to reset the theme
     */
    async injectUserCSS(theme) {
        try {
            // Remove any existing Spicetify user.css
            const existingUserThemeCSS = document.querySelector("link[href='user.css']");
            if (existingUserThemeCSS) existingUserThemeCSS.remove();

            // Remove any existing marketplace scheme
            const existingMarketplaceUserCSS = document.querySelector("style.marketplaceCSS.marketplaceUserCSS");
            if (existingMarketplaceUserCSS) existingMarketplaceUserCSS.remove();

            if (theme) {
                const userCSS = await this.parseCSS();

                // Add new marketplace scheme
                const userCssTag = document.createElement("style");
                userCssTag.classList.add("marketplaceCSS");
                userCssTag.classList.add("marketplaceUserCSS");
                userCssTag.innerHTML = userCSS;
                document.head.appendChild(userCssTag);
            } else {
                // Re-add default user.css
                const originalUserThemeCSS = document.createElement("link");
                originalUserThemeCSS.setAttribute("rel", "stylesheet");
                originalUserThemeCSS.setAttribute("href", "user.css");
                originalUserThemeCSS.classList.add("userCSS");
                document.head.appendChild(originalUserThemeCSS);
            }
        } catch (error) {
            console.warn(error);
        }
    }

    // TODO: keep in sync with extension.js
    async parseCSS() {

        const userCssUrl = this.cssURL.indexOf("raw.githubusercontent.com") > -1
            // TODO: this should probably be the URL stored in localstorage actually (i.e. put this url in localstorage)
            ? `https://cdn.jsdelivr.net/gh/${this.user}/${this.repo}@${this.branch}/${this.manifest.usercss}`
            : this.cssURL;
        // TODO: Make this more versatile
        const assetsUrl = userCssUrl.replace("/user.css", "/assets/");

        console.log("Parsing CSS: ", userCssUrl);
        let css = await fetch(userCssUrl).then(res => res.text());
        // console.log("Parsed CSS: ", css);

        // @ts-ignore
        let urls = css.matchAll(/url\(['|"](?<path>.+?)['|"]\)/gm) || [];

        for (const match of urls) {
            const url = match.groups.path;
            // console.log(url);
            // If it's a relative URL, transform it to HTTP URL
            if (!url.startsWith("http") && !url.startsWith("data")) {
                const newUrl = assetsUrl + url.replace(/\.\//g, "");
                css = css.replace(url, newUrl);
            }
        }

        // console.log("New CSS: ", css);

        return css;
    }
}
