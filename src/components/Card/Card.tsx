import React from "react";
import { CardItem, CardType, Config, SchemeIni, Snippet, VisualConfig } from "../../types/marketplace-types";

import { LOCALSTORAGE_KEYS, CUSTOM_APP_PATH } from "../../constants";
import {
  getLocalStorageDataFromKey,
  parseIni,
  initializeSnippets,
  parseCSS,
  injectUserCSS,
} from "../../logic/Utils";
import TrashIcon from "../Icons/TrashIcon";
import DownloadIcon from "../Icons/DownloadIcon";
import { openModal } from "../../logic/LaunchModals";
import AuthorsDiv from "./AuthorsDiv";
import TagsDiv from "./TagsDiv";
import Button from "../Button";

type CardProps = {
  // From `fetchExtensionManifest()`, `fetchThemeManifest()`, and snippets.json
  item: CardItem | Snippet;

  CONFIG: Config;

  // From `appendCard()`
  updateColourSchemes: (SchemeIni, string) => void;
  updateActiveTheme: (string) => void;
  type: CardType;
  visual: VisualConfig;
  key: string;
  activeThemeKey?: string;
};

export default class Card extends React.Component<CardProps, {
  installed: boolean
  // TODO: Can I remove `stars` from `this`? Or maybe just put everything in `state`?
  stars: number;
  tagsExpanded: boolean;
}> {
  // Theme stuff
  // cssURL?: string;
  // schemesURL?: string;
  // include?: string[];
  // // Snippet stuff
  // code?: string;
  // description?: string;
  tags: string[];

  // Added locally
  menuType;
  localStorageKey: string;

  constructor(props: CardProps) {
    super(props);

    // Added locally
    // this.menuType = Spicetify.ReactComponent.Menu | "div";
    this.menuType = Spicetify.ReactComponent.Menu;

    const prefix = props.type === "snippet" ? "snippet:" : `${props.item.user}/${props.item.repo}/`;

    let cardId = "";
    if (props.type === "snippet") cardId = props.item.title.replaceAll(" ", "-");
    else if (props.type === "theme") cardId = props.item.manifest?.usercss || "";
    else if (props.type === "extension") cardId = props.item.manifest?.main || "";

    this.localStorageKey = `marketplace:installed:${prefix}${cardId}`;

    Object.assign(this, props);

    // Needs to be after Object.assign so an undefined 'tags' field doesn't overwrite the default []
    this.tags = props.item.tags || [];
    if (props.item.include) this.tags.push("external JS");

    this.state = {
      // Initial value. Used to trigger a re-render.
      // isInstalled() is used for all other intents and purposes
      installed: localStorage.getItem(this.localStorageKey) !== null,

      // TODO: Can I remove `stars` from `this`? Or maybe just put everything in `state`?
      stars: this.props.item.stars || 0,
      tagsExpanded: false,
    };
  }

  // Using this because it gets the live value ('installed' is stuck after a re-render)
  isInstalled() {
    return localStorage.getItem(this.localStorageKey) !== null;
  }

  async componentDidMount() {
    // Refresh stars if on "Installed" tab with stars enabled
    if (this.props.CONFIG.activeTab === "Installed" &&
      this.props.CONFIG.visual.stars && this.props.type !== "snippet") {
      // https://docs.github.com/en/rest/reference/repos#get-a-repository
      const url = `https://api.github.com/repos/${this.props.item.user}/${this.props.item.repo}`;
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
    if (this.props.type === "extension") {
      if (this.isInstalled()) {
        console.log("Extension already installed, removing");
        this.removeExtension();
      } else {
        this.installExtension();
      }
      openModal("RELOAD");
    } else if (this.props.type === "theme") {
      const themeKey = localStorage.getItem("marketplace:theme-installed");
      const previousTheme = themeKey ? getLocalStorageDataFromKey(themeKey, {}) : {};
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
      if (this.props.item.manifest?.include || previousTheme.include) openModal("RELOAD");
    } else if (this.props.type === "snippet") {
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
    // TODO: can I clean this up so it's less repetition?
    localStorage.setItem(this.localStorageKey, JSON.stringify({
      manifest: this.props.item?.manifest,
      type: this.props.type,
      title: this.props.item.title,
      subtitle: this.props.item.subtitle,
      authors: this.props.item.authors,
      user: this.props.item.user,
      repo: this.props.item.repo,
      branch: this.props.item.branch,
      imageURL: this.props.item.imageURL,
      extensionURL: this.props.item.extensionURL,
      readmeURL: this.props.item.readmeURL,
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

    let parsedSchemes: SchemeIni = {};
    if (this.props.item.schemesURL) {
      const schemesResponse = await fetch(this.props.item.schemesURL);
      const colourSchemes = await schemesResponse.text();
      parsedSchemes = parseIni(colourSchemes);
    }

    const firstSchemeName = Object.keys(parsedSchemes)[0];
    console.log(parsedSchemes, firstSchemeName);
    const activeScheme = firstSchemeName || null;

    // Add to localstorage (this stores a copy of all the card props in the localstorage)
    // TODO: refactor/clean this up
    localStorage.setItem(this.localStorageKey, JSON.stringify({
      // TODO: can I clean this up so it's less repetition?
      manifest: this.props.item?.manifest,
      type: this.props.type,
      title: this.props.item.title,
      subtitle: this.props.item.subtitle,
      authors: this.props.item.authors,
      user: this.props.item.user,
      repo: this.props.item.repo,
      branch: this.props.item.branch,
      imageURL: this.props.item.imageURL,
      extensionURL: this.props.item.extensionURL,
      readmeURL: this.props.item.readmeURL,
      stars: this.state.stars,
      tags: this.tags,
      // Theme stuff
      cssURL: this.props.item.cssURL,
      schemesURL: this.props.item.schemesURL,
      include: this.props.item.include,
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

    if (!this.props.item.include) {
      // Add new theme css
      this.fetchAndInjectUserCSS(this.localStorageKey);
      // Update the active theme in Grid state, triggers state change and re-render
      this.props.updateActiveTheme(this.localStorageKey);
      // Update schemes in Grid, triggers state change and re-render
      this.props.updateColourSchemes(parsedSchemes, activeScheme);
    }

    this.setState({ installed: true });
  }

  removeTheme(themeKey?: string | null) {
    // If don't specify theme, remove the currently installed theme
    themeKey = themeKey || localStorage.getItem(LOCALSTORAGE_KEYS.themeInstalled);

    const themeValue = themeKey && localStorage.getItem(themeKey);

    if (themeKey && themeValue) {
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
      this.fetchAndInjectUserCSS(null);
      // Update the active theme in Grid state
      this.props.updateActiveTheme(null);
      // Removes the current colour scheme
      this.props.updateColourSchemes(null, null);

      this.setState({ installed: false });
    }
  }

  installSnippet() {
    console.log(`Installing snippet ${this.localStorageKey}`);
    localStorage.setItem(this.localStorageKey, JSON.stringify({
      code: this.props.item.code,
      title: this.props.item.title,
      description: this.props.item.description,
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

  /**
   * Update the user.css in the DOM
   * @param {string | null} theme The theme localStorageKey or null, if we want to reset the theme
   */
  async fetchAndInjectUserCSS(theme) {
    try {
      const userCSS = theme
        ? await parseCSS(this.props.item as CardItem)
        : undefined;
      injectUserCSS(userCSS);
    } catch (error) {
      console.warn(error);
    }
  }

  openReadme() {
    if (this.props.item?.manifest && this.props.item?.manifest?.readme) {
      Spicetify.Platform.History.push({
        pathname: `${CUSTOM_APP_PATH}/readme`,
        state: {
          data: {
            title: this.props.item.title,
            user: this.props.item.user,
            repo: this.props.item.repo,
            branch: this.props.item.branch,
            readmeURL: this.props.item.readmeURL,
          },
        },
      });
    } else {
      Spicetify.showNotification("No page was found");
    }
  }

  render() {
    // Cache this for performance
    const IS_INSTALLED = this.isInstalled();
    // console.log(`Rendering ${this.localStorageKey} - is ${IS_INSTALLED ? "" : "not"} installed`);

    // Kill the card if it has been uninstalled on the "Installed" tab
    // TODO: is this kosher, or is there a better way to handle?
    if (this.props.CONFIG.activeTab === "Installed" && !IS_INSTALLED) {
      console.log("Card item not installed");
      return null;
    }

    const cardClasses = ["main-card-card", `marketplace-card--${this.props.type}`];
    if (IS_INSTALLED) cardClasses.push("marketplace-card--installed");

    const detail: string[] = [];
    // this.visual.type && detail.push(this.type);
    if (this.props.type !== "snippet" && this.props.visual.stars) {
      detail.push(`★ ${this.state.stars}`);
    }

    return (
      <div className={cardClasses.join(" ")} onClick={() => this.openReadme()}>
        <div className="main-card-draggable" draggable="true">
          <div className="main-card-imageContainer">
            <div className="main-cardImage-imageWrapper">
              <div>
                <img
                  alt=""
                  aria-hidden="false"
                  draggable="false"
                  loading="lazy"
                  src={this.props.item.imageURL}
                  className="main-image-image main-cardImage-image"
                  onError={(e) => {
                    // Set to transparent PNG to remove the placeholder icon
                    // https://png-pixel.com
                    e.currentTarget.setAttribute("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII");

                    // Add class for styling
                    e.currentTarget.closest(".main-cardImage-imageWrapper")?.classList.add("main-cardImage-imageWrapper--error");
                  }}
                />
              </div>
            </div>
          </div>
          <div className="main-card-cardMetadata">
            <a
              draggable="false"
              title={this.props.type === "snippet" ? this.props.item.title : this.props.item.manifest?.name}
              className="main-cardHeader-link"
              dir="auto"
              href={`https://github.com/${this.props.item.user}/${this.props.item.repo}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="main-cardHeader-text main-type-balladBold">
                {this.props.item.title}
              </div>
            </a>
            <div className="main-cardSubHeader-root main-type-mestoBold marketplace-cardSubHeader">
              {/* Add authors if they exist */}
              {this.props.item.authors && <AuthorsDiv authors={this.props.item.authors} />}
              <span>{detail.join(" ‒ ")}</span>
            </div>
            <p className="marketplace-card-desc">
              {this.props.type === "snippet" ? this.props.item.description : this.props.item.manifest?.description}
            </p>
            {this.tags.length ? (
              <div className="marketplace-card__bottom-meta main-type-mestoBold">
                <TagsDiv tags={this.tags} showTags={this.props.CONFIG.visual.tags} />
              </div>
            ) : null}
            {IS_INSTALLED && (
              <div className="marketplace-card__bottom-meta main-type-mestoBold">
                ✓ Installed
              </div>
            )}
            <div className="main-card-PlayButtonContainer">
              <Button classes={["marketplace-installButton"]}
                type="circle"
                // If it is installed, it will remove it when button is clicked, if not it will save
                label={IS_INSTALLED ? "Remove" : "Save"}
                onClick={(e) => {
                  e.stopPropagation();
                  this.buttonClicked();
                }}
              >
                {/*If the extension, theme, or snippet is already installed, it will display trash, otherwise it displays download*/}
                {IS_INSTALLED ? <TrashIcon /> : <DownloadIcon />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
