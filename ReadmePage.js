// eslint-disable-next-line no-unused-vars, no-redeclare
class ReadmePage extends react.Component {
    constructor(props) {
        super(props);
        Object.assign(this, props);

        // TODO: decide what data we want to pass in and how we want to store it
        // (this currently comes from Card.openReadme)
        /** @type { { title: string; readmeURL: string } } */
        this.data;

        // this.state = {};
    }

    render() {
        this.injectMarkdownLibs();

        // const mdContainer = document.createElement("zero-md");
        // mdContainer.setAttribute("src", readme);
        // const styleTemplate = document.createElement("template");
        // const styleTag = document.createElement("style");
        // styleTag.innerHTML = `
        // #marketplace-readme-container p { color: red !important; }
        // `;
        // styleTemplate.append(styleTag);
        // mdContainer.append(styleTemplate);

        // readmeModalContainer.append(
        //     mdContainer,
        // );

        return react.createElement("section", {
            className: "contentSpacing",
        },
        react.createElement("div", {
            className: "marketplace-header",
        }, react.createElement("h1", null, this.props.title),
        ),
        react.createElement("div", {
            id: "marketplace-readme",
            className: "marketplace-readme__container",
        }, /*react.createElement("h2", {}, this.data.title),*/
        react.createElement("zero-md", {
            src: this.data.readmeURL,
            // TODO: this doesn't work?
        }, react.createElement("template", {},
            react.createElement("style", {}, `
                #marketplace-readme-container p { color: red !important; }
            `))),
        ),
        );
    }

    injectMarkdownLibs() {
        // <!-- Lightweight client-side loader that feature-detects and load polyfills only when necessary -->
        // <script src="https://cdn.jsdelivr.net/npm/@webcomponents/webcomponentsjs@2/webcomponents-loader.min.js"></script>

        // <!-- Load the element definition -->
        // <script type="module" src="https://cdn.jsdelivr.net/gh/zerodevx/zero-md@1/src/zero-md.min.js"></script>

        // <!-- Simply set the `src` attribute to your MD file and win -->
        // <zero-md src="README.md"></zero-md>

        // @ts-ignore
        const alreadyInjected = !!window.ZeroMd;

        if (alreadyInjected) return;

        // Lightweight client-side loader that feature-detects and load polyfills only when necessary
        const wcScript = document.createElement("script");
        wcScript.defer = true;
        wcScript.src = "https://cdn.jsdelivr.net/npm/@webcomponents/webcomponentsjs@2/webcomponents-loader.min.js";
        document.body.appendChild(wcScript);

        // Load the element definition
        const zmdScript = document.createElement("script");
        zmdScript.defer = true;
        zmdScript.type = "module";
        zmdScript.src = "https://cdn.jsdelivr.net/gh/zerodevx/zero-md@1/src/zero-md.min.js";
        document.body.appendChild(zmdScript);
    }
}

