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
        /** @type { { type: string; stars: string; } } */
        this.visual;
        /** @type { string } */
        this.imageURL;
        // this.menuType = Spicetify.ReactComponent.Menu | "div";
        this.menuType = Spicetify.ReactComponent.Menu;
        /** @type { { name: string; description: string; main: string; preview: string; } } */
        this.manifest;
        /** @type { string } */
        this.title;
        /** @type { number } */
        this.stars;
        this.localStorageKey = "marketplace:installed:" + props.manifest.main;

        Object.assign(this, props);

        this.state = {
            installed: localStorage.getItem(this.localStorageKey) !== null,
        };
    }

    installExtension() {
        console.log(`Installing extension ${this.localStorageKey}`);
        localStorage.setItem(this.localStorageKey, JSON.stringify(this.manifest));
        console.log("Installed");
        this.setState({ installed: true });
        // console.log(JSON.parse(localStorage.getItem(this.localStorageKey)));
    }

    removeExtension() {
        const extValue = localStorage.getItem(this.localStorageKey);
        // console.log(JSON.parse(extValue));
        if (extValue) {
            console.log(`Removing extension ${this.localStorageKey}`);
            localStorage.removeItem(this.localStorageKey);
            console.log("Removed");
            this.setState({ installed: false });
            openReloadModal();
        } else {
            console.log(`Extension ${this.localStorageKey} not found`);
        }
    }

    render() {
        const cardClasses = ["main-card-card"];
        if (this.state.installed) cardClasses.push("marketplace-card--installed");

        let detail = [];
        // this.visual.type && detail.push(this.type);
        this.visual.stars && detail.push(`★ ${this.stars}`);
        return react.createElement(Spicetify.ReactComponent.RightClickMenu || "div", {
            menu: react.createElement(this.menuType, {}),
        }, react.createElement("div", {
            className: cardClasses.join(" "),
            // onClick: (event) => {
            //     // TODO: Navigate to a page for the extension info on card click.
            //     // We might want to add some href for a page for the extension
            //     // History.push(this.href);
            //     // event.preventDefault();
            // },
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
        }))), react.createElement("div", {
            className: "main-card-PlayButtonContainer",
        }, react.createElement("button", {
            className: "main-playButton-PlayButton main-playButton-primary",
            "aria-label": this.state.installed ? Spicetify.Locale.get("remove") : Spicetify.Locale.get("save"),
            style: { "--size": "40px" },
            onClick: (event) => {
                event.preventDefault();
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
        ), react.createElement("br"),
        this.manifest.description,
        this.state.installed && react.createElement("div", {
            className: "marketplace-card__bottom-meta main-type-mestoBold",
            as: "div",
        }, "✓ installed"),
        ))));
    }
}
