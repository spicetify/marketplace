import React from "react";
import { withTranslation } from "react-i18next";
import { getMarkdownHTML } from "../logic/Utils";
import { CardType } from "../types/marketplace-types";
import Button from "./Button";
import DownloadIcon from "./Icons/DownloadIcon";
import GitHubIcon from "./Icons/GitHubIcon";
import LoadingIcon from "./Icons/LoadingIcon";
import TrashIcon from "./Icons/TrashIcon";

class ReadmePage extends React.Component<
{
  // props
  // TODO: decide what data we want to pass in and how we want to store it
  // (this currently comes from Card.openReadme)
  data: {
    title: string;
    user: string;
    repo: string;
    branch: string;
    readmeURL: string;
    readmeDir: string;
    type: CardType;
    install: () => void;
    isInstalled: () => boolean;
  },
  title: string,
  // TODO: there's probably a better way to make TS not complain about the withTranslation HOC
  t: (key: string) => string,
},
{
  isInstalled: boolean,
  // state
  html: string,
}
> {
  state = {
    isInstalled: this.props.data.isInstalled(),
    html: `<p>${this.props.t("readmePage.loading")}</p>`,
  };

  getReadmeHTML = async () => {
    return fetch(this.props.data.readmeURL)
      .then((res) => {
        if (!res.ok) throw Spicetify.showNotification(`${this.props.t("readmePage.errorLoading")} (HTTP ${res.status})`, true);
        return res.text();
      })
      .then((readmeText) => getMarkdownHTML(readmeText, this.props.data.user, this.props.data.repo))
      .then((html) => {
        if (!html) Spicetify.Platform.History.goBack();
        return html;
      })
      .catch((err) => {
        console.error(err);
        Spicetify.Platform.History.goBack();
        return null;
      });
  };

  componentDidMount() {
    // Get and set readme html once loaded
    this.getReadmeHTML()
      .then((html) => {
        if (html == null) return;
        this.setState({ html });
      });
  }

  componentDidUpdate() {
    // Make the page scrollable
    const main = document.querySelector("#marketplace-readme")?.closest("main");
    if (main) {
      const callScrollbar = setInterval(() => {
        if (!document.querySelector("#marketplace-readme")) {
          clearInterval(callScrollbar);
          main.style.removeProperty("overflow-y");
          return;
        }
        // TODO: see if it's possible to use some load event or mutation observer to do this
        main.style.overflowY = "visible";
        main.style.overflowY = "auto";
      }, 1000);
    }

    // Add error handler in attempt to fix broken image urls
    // e.g. "screenshot.png" loads https://xpui.app.spotify.com/screenshot.png and breaks
    // so I turn it into https://raw.githubusercontent.com/theRealPadster/spicetify-hide-podcasts/main/screenshot.png
    // This works for urls relative to the repo readme
    document.querySelectorAll("#marketplace-readme img").forEach((img) => {
      img.addEventListener("error", (e) => {
        const element = e.target as HTMLImageElement;
        const originalSrc = element.getAttribute("src");
        const fixedSrc = originalSrc?.charAt(0) === "/"
          ? `https://raw.githubusercontent.com/${this.props.data.user}/${this.props.data.repo}/${this.props.data.branch}/${originalSrc?.slice(1)}`
          : `${this.props.data.readmeURL.substring(0, this.props.data.readmeURL.lastIndexOf("/"))}/${originalSrc}`;
        element.setAttribute("src", fixedSrc);
      }, { once: true });
    });
  }

  buttonContent() {
    if (this.props.data.type === "app") {
      return {
        icon: <GitHubIcon />,
        text: this.props.t("github"),
      };
    } else if (this.state.isInstalled) {
      return {
        icon: <TrashIcon />,
        text: this.props.t("remove"),
      };
    } else {
      return {
        icon: <DownloadIcon />,
        text: this.props.t("install"),
      };
    }
  }

  render() {
    return (
      <section className="contentSpacing">
        <div className="marketplace-header">
          <div className="marketplace-header__left">
            <h1>{this.props.title}</h1>
          </div>
          <div className="marketplace-header__right">
            <Button
              classes={["marketplace-header__button"]}
              onClick={(e) => {
                e.preventDefault();
                this.props.data.install();
                this.setState({ isInstalled: !this.state.isInstalled });
              }}
              label={this.buttonContent().text}
            >
              {this.buttonContent().icon}
              {" "}
              {this.buttonContent().text}
            </Button>
          </div>
        </div>
        {this.state.html === "<p>Loading...</p>"
          ? <footer className="marketplace-footer"><LoadingIcon /></footer>
          : <div id="marketplace-readme" className="marketplace-readme__container" dangerouslySetInnerHTML={{ __html: this.state.html }}></div>}
      </section>
    );
  }
}

export default withTranslation()(ReadmePage);
