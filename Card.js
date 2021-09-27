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
        Object.assign(this, props);
        // console.log(this.manifest);

    }

    render() {
        let detail = [];
        // this.visual.type && detail.push(this.type);
        // this.visual.upvotes && detail.push(`▲ ${this.upvotes}`);

        return react.createElement(Spicetify.ReactComponent.RightClickMenu || "div", {
            menu: react.createElement(this.menuType, {}),
        }, react.createElement("div", {
            className: "main-card-card",
            onClick: (event) => {
                if (localStorage.getItem("marketplace:installed:" + this.manifest.main) == null){

                    localStorage.setItem("marketplace:installed:" + this.manifest.main, JSON.stringify(this.manifest));
                    console.log(JSON.parse(localStorage.getItem("marketplace:installed")));

                } else {
                    console.log("Already added.");
                }

            },
        }, react.createElement("div", {
            className: "main-card-draggable",
            draggable: "true"
        }, react.createElement("div", {
            className: "main-card-imageContainer"
        }, react.createElement("div", {
            className: "main-cardImage-imageWrapper"
        }, react.createElement("div", {
        }, react.createElement("img", {
            "aria-hidden": "false",
            draggable: "false",
            loading: "lazy",
            src: this.imageURL,
            className: "main-image-image main-cardImage-image"
        }))), react.createElement("div", {
            className: "main-card-PlayButtonContainer"
        }, react.createElement("button", {
            className: "main-playButton-PlayButton main-playButton-primary",
            "aria-label": Spicetify.Locale.get("play"),
            style: { "--size": "40px" },
        }, react.createElement("svg", {
            height: "16",
            role: "img",
            width: "16",
            viewBox: "0 0 24 24",
            "aria-hidden": "true"
        }, react.createElement("polygon", {
            points: "21.57 12 5.98 3 5.98 21 21.57 12",
            fill: "currentColor"
        }))))), react.createElement("div", {
            className: "main-card-cardMetadata"
        }, react.createElement("a", {
            draggable: "false",
            title: this.title,
            className: "main-cardHeader-link",
            dir: "auto",
            href: 'TODO: add some href here?'
        }, react.createElement("div", {
            className: "main-cardHeader-text main-type-balladBold",
            as: "div"
        }, this.title)), detail.length > 0 && react.createElement("div", {
            className: "main-cardSubHeader-root main-type-mestoBold reddit-cardSubHeader",
            as: "div",
        }, react.createElement("span", null, detail.join(" ‒ ")),
        ), //this.getFollowers(), this.getSubtitle(),
        ))));
    }
}
