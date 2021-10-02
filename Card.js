// eslint-disable-next-line no-redeclare, no-unused-vars
class Card extends react.Component {
    constructor(props) {
        super(props);
        /** @type { { type: string; upvotes: string; } } */
        this.visual;
        /** @type { string } */
        this.imageURL;
        // this.menuType = Spicetify.ReactComponent.Menu | "div";
        this.menuType = Spicetify.ReactComponent.Menu;
        /** @type { { name: string; description: string; main: string; preview: string; } } */
        this.manifest;
        /** @type { string } */
        this.title;
        this.localStorageKey = "marketplace:installed:" + props.manifest.main;

        // TODO: add state for installed status

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
            // TODO: probably don't need to since it will reload
            this.setState({ installed: true });
            location.reload();
        } else {
            console.log(`Extension ${this.localStorageKey} not found`);
        }
    }

    render() {
        const cardClasses = ["main-card-card"];
        if (this.state.installed) cardClasses.push("marketplace-card--installed");

        let detail = [];
        // if (this.state.installed) detail.push("✓ installed");
        // this.visual.type && detail.push(this.type);
        // this.visual.upvotes && detail.push(`▲ ${this.upvotes}`);
        return react.createElement(Spicetify.ReactComponent.RightClickMenu || "div", {
            menu: react.createElement(this.menuType, {}),
        }, react.createElement("div", {
            className: cardClasses.join(" "),
            onClick: (event) => {
                // We might want to add some href for a page for the extension
                // History.push(this.href);
                event.preventDefault();
                if (localStorage.getItem(this.localStorageKey) == null) {
                    this.installExtension();
                } else {
                    console.log("Extension already installed, removing");
                    this.removeExtension();
                }
            },
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
            "aria-label": Spicetify.Locale.get("play"),
            style: { "--size": "40px" },
            //onClick: ,
        },
        react.createElement("svg", {
            height: "16",
            role: "img",
            width: "16",
            viewBox: "0 0 24 24",
            "aria-hidden": "true",
        }, react.createElement("polygon", {
            points: "21.57 12 5.98 3 5.98 21 21.57 12",
            fill: "currentColor",
        }))))), react.createElement("div", {
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
        ),react.createElement("br"),
        this.manifest.description,
        this.state.installed && react.createElement("div", {
            className: "marketplace-card__bottom-meta main-type-mestoBold",
            as: "div",
        }, "✓ installed"),
        ))));
    }
}
