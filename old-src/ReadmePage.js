// eslint-disable-next-line no-unused-vars, no-redeclare
class ReadmePage extends react.Component {
    constructor(props) {
        super(props);
        Object.assign(this, props);

        // TODO: decide what data we want to pass in and how we want to store it
        // (this currently comes from Card.openReadme)
        /** @type { { title: string; user: string; repo: string; branch: string; readmeURL: string; readmeDir: string; } } */
        this.data;

        this.state = { html: "<p>Loading...</p>" };
    }

    componentDidMount() {
        // Get and set readme html once loaded
        this.getReadmeHTML()
            .then((html) => this.setState({ html }));
    }

    componentDidUpdate() {
        // Add error handler in attempt to fix broken image urls
        // e.g. "screenshot.png" loads https://xpui.app.spotify.com/screenshot.png and breaks
        // so I turn it into https://raw.githubusercontent.com/theRealPadster/spicetify-hide-podcasts/main/screenshot.png
        // This works for urls relative to the repo root
        document.querySelectorAll("#marketplace-readme img").forEach((img) => {
            img.addEventListener("error", (e) => {
                // @ts-ignore
                const originalSrc = e.target.getAttribute("src");
                const fixedSrc = `https://raw.githubusercontent.com/${this.data.user}/${this.data.repo}/${this.data.branch}/${originalSrc}`;
                // @ts-ignore
                e.target.setAttribute("src", fixedSrc);
            }, { once: true });
        });
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
    }

    async getReadmeHTML() {
        try {
            const readmeTextRes = await fetch(this.data.readmeURL);
            if (!readmeTextRes.ok) throw Spicetify.showNotification(`Error loading README (HTTP ${readmeTextRes.status})`);

            const readmeText = await readmeTextRes.text();

            const postBody = {
                text: readmeText,
                context: `${this.data.user}/${this.data.repo}`,
                mode: "gfm",
            };

            const readmeHtmlRes = await fetch("https://api.github.com/markdown", {
                method: "POST",
                body: JSON.stringify(postBody),
            });
            if (!readmeHtmlRes.ok) throw Spicetify.showNotification(`Error parsing README (HTTP ${readmeHtmlRes.status})`);

            const readmeHtml = await readmeHtmlRes.text();

            if (readmeHtml == null) {
                Spicetify.Platform.History.goBack();
            }
            return readmeHtml;
        } catch (err) {
            Spicetify.Platform.History.goBack();
            return null;
        }
    }
}

