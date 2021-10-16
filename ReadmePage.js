// eslint-disable-next-line no-unused-vars, no-redeclare
class ReadmePage extends react.Component {
    constructor(props) {
        super(props);
        Object.assign(this, props);

        // TODO: decide what data we want to pass in and how we want to store it
        // (this currently comes from Card.openReadme)
        /** @type { { title: string; user: string; repo: string; readmeURL: string; readmeDir: string; } } */
        this.data;

        this.state = { html: "<p>Loading...</p>" };
    }

    componentDidMount() {
        this.getReadmeHTML()
            .then((html) => this.setState({ html }));
    }

    render() {
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
            dangerouslySetInnerHTML: {
                __html: this.state.html,
            },
        }));

        // this.injectMarkdownLibs();
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

        // TODO: any relative images in the readme don't work (e.g. it resolves to https://xpui.app.spotify.com/screenshot.png)
        // return react.createElement("section", {
        //     className: "contentSpacing",
        // },
        // react.createElement("div", {
        //     className: "marketplace-header",
        // }, react.createElement("h1", null, this.props.title),
        // ),
        // react.createElement("div", {
        //     id: "marketplace-readme",
        //     className: "marketplace-readme__container",
        // }, /*react.createElement("h2", {}, this.data.title),*/
        // react.createElement("zero-md", {
        //     src: this.data.readmeURL,
        //     // TODO: this doesn't work?
        // }, react.createElement("template", {},
        //     react.createElement("style", {}, `
        //         #marketplace-readme-container p { color: red !important; }
        //     `))),
        // ),
        // );
    }

    async getReadmeHTML() {
        // TODO: it might not be the default readme - the endpoint also supports adding `/dir` to the end, to get a readme for a directory.
        // We should add support for that

        const url = `https://api.github.com/repos/${this.data.user}/${this.data.repo}/readme`;
        console.log("url", url);

        try {
            const body = await fetch(url, {
                method: "GET",
                headers: {
                    Accept: "application/vnd.github.html",
                },
            });

            if (!body.ok) throw new Error(`Error loading README (HTTP ${body.status})`);

            const html = await body.text();
            return html;
        } catch (err) {
            return `<p>${err.message}</p>`;
        }
    }

    injectMarkdownLibs() {
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

