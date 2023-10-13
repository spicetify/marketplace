import React, { Key } from "react";
import { withTranslation } from "react-i18next";
import { CardItem, CardType, Config, SchemeIni, Snippet, VisualConfig } from "../../types/marketplace-types";

import { LOCALSTORAGE_KEYS, CUSTOM_APP_PATH, SNIPPETS_PAGE_URL } from "../../constants";
import {
  getLocalStorageDataFromKey,
  parseIni,
  initializeSnippets,
  parseCSS,
  injectUserCSS,
  generateKey,
} from "../../logic/Utils";
import TrashIcon from "../Icons/TrashIcon";
import DownloadIcon from "../Icons/DownloadIcon";
import GitHubIcon from "../Icons/GitHubIcon";
import { openModal } from "../../logic/LaunchModals";
import AuthorsDiv from "./AuthorsDiv";
import TagsDiv from "./TagsDiv";
import Button from "../Button";
import { t } from "i18next";
const Spicetify = window.Spicetify;

export type CardProps = {
  // From `fetchExtensionManifest()`, `fetchThemeManifest()`, and snippets.json
  item: CardItem | Snippet;
  CONFIG: Config;
  // From `appendCard()`
  updateColourSchemes: (SchemeIni, string) => void;
  updateActiveTheme: (string) => void;
  type: CardType;
  visual: VisualConfig;
  activeThemeKey?: string;
};

class Card extends React.Component<CardProps, {
  installed: boolean
  // TODO: Can I remove `stars` from `this`? Or maybe just put everything in `state`?
  stars: number;
  tagsExpanded: boolean;
  externalUrl: string;
  lastUpdated: string | undefined;
  created: string | undefined;
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
  menuType: typeof Spicetify.ReactComponent.Menu;
  localStorageKey: string;
  key: Key | null = null;
  type = Card;

  constructor(props: CardProps) {
    super(props);

    // Added locally
    // this.menuType = Spicetify.ReactComponent.Menu | "div";
    this.menuType = Spicetify.ReactComponent.Menu;

    this.localStorageKey = generateKey(props);

    Object.assign(this, props);

    // Needs to be after Object.assign so an undefined 'tags' field doesn't overwrite the default []
    this.tags = props.item.tags || [];
    if (props.item.include) this.tags.push(t("grid.externalJS"));

    this.state = {
      // Initial value. Used to trigger a re-render.
      // isInstalled() is used for all other intents and purposes
      installed: localStorage.getItem(this.localStorageKey) !== null,

      // TODO: Can I remove `stars` from `this`? Or maybe just put everything in `state`?
      stars: this.props.item.stars || 0,
      tagsExpanded: false,
      externalUrl: (this.props.item.user && this.props.item.repo) // These won't exist for snippets
        ? `https://github.com/${this.props.item.user}/${this.props.item.repo}`
        : "",
      lastUpdated: (this.props.item.user && this.props.item.repo) ? this.props.item.lastUpdated : undefined,
      created: (this.props.item.user && this.props.item.repo) ? this.props.item.created : undefined,
    };
  }

  // Using this because it gets the live value ('installed' is stuck after a re-render)
  isInstalled() {
    return localStorage.getItem(this.localStorageKey) !== null;
  }

  async componentDidMount() {
    // Refresh stars if on "Installed" tab with stars enabled
    if (this.props.CONFIG.activeTab === "Installed" && this.props.type !== "snippet") {
      // https://docs.github.com/en/rest/reference/repos#get-a-repository
      const url = `https://api.github.com/repos/${this.props.item.user}/${this.props.item.repo}`;
      // TODO: This implementation could probably be improved.
      // It might have issues when quickly switching between tabs.
      const repoData = await fetch(url).then(res => res.json());
      const { stargazers_count, pushed_at } = repoData;

      const stateUpdate = { stars: 0, lastUpdated: undefined };
      if ((this.state.stars !== stargazers_count && this.props.CONFIG.visual.stars)) {
        stateUpdate.stars = stargazers_count;
        console.debug(`Stars updated to: ${stargazers_count}`);
      }
      if (this.state.lastUpdated !== pushed_at) {
        stateUpdate.lastUpdated = pushed_at;
        console.debug(`New update pushed at: ${pushed_at}`);
        switch (this.props.type) {
        case "extension":
          this.installExtension();
          break;
        case "theme":
          this.installTheme(true);
          break;
        }
      }
    }
  }

  buttonClicked() {
    if (this.props.type === "extension") {
      if (this.isInstalled()) {
        console.debug("Extension already installed, removing");
        this.removeExtension();
      } else {
        this.installExtension();
      }
      openModal("RELOAD");
    } else if (this.props.type === "theme") {
      const themeKey = localStorage.getItem(LOCALSTORAGE_KEYS.themeInstalled);
      const previousTheme = themeKey ? getLocalStorageDataFromKey(themeKey, {}) : {};

      if (this.isInstalled()) {
        console.debug("Theme already installed, removing");
        this.removeTheme(this.localStorageKey);
      } else {
        // Remove theme if already installed, then install the new theme
        this.removeTheme();
        this.installTheme();
      }

      // If the new or previous theme has JS, prompt to reload
      if (this.props.item.manifest?.include || previousTheme.include) openModal("RELOAD");
    } else if (this.props.type === "app") {
      // Open repo in new tab
      window.open(this.state.externalUrl, "_blank");
    } else if (this.props.type === "snippet") {
      if (this.isInstalled()) {
        console.debug("Snippet already installed, removing");
        this.removeSnippet();
      } else {
        this.installSnippet();
      }
    } else {
      console.error("Unknown card type");
    }
  }

  installExtension() {
    console.debug(`Installing extension ${this.localStorageKey}`);
    // Add to localstorage (this stores a copy of all the card props in the localstorage)
    // TODO: can I clean this up so it's less repetition?
    if (!this.props.item) {
      Spicetify.showNotification("There was an error installing extension", true);
      return;
    }
    const { manifest, title, subtitle, authors, user, repo, branch, imageURL, extensionURL, readmeURL, lastUpdated, created } = this.props.item;
    localStorage.setItem(this.localStorageKey, JSON.stringify({
      manifest,
      type: this.props.type,
      title,
      subtitle,
      authors,
      user,
      repo,
      branch,
      imageURL,
      extensionURL,
      readmeURL,
      stars: this.state.stars,
      lastUpdated,
      created,
    }));

    // Add to installed list if not there already
    const installedExtensions = getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.installedExtensions, []);
    if (installedExtensions.indexOf(this.localStorageKey) === -1) {
      installedExtensions.push(this.localStorageKey);
      localStorage.setItem(LOCALSTORAGE_KEYS.installedExtensions, JSON.stringify(installedExtensions));
    }

    console.debug("Installed");
    this.setState({ installed: true });
  }

  removeExtension() {
    const extValue = localStorage.getItem(this.localStorageKey);
    if (extValue) {
      console.debug(`Removing extension ${this.localStorageKey}`);
      // Remove from localstorage
      localStorage.removeItem(this.localStorageKey);

      // Remove from installed list
      const installedExtensions = getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.installedExtensions, []);
      const remainingInstalledExtensions = installedExtensions.filter((key) => key !== this.localStorageKey);
      localStorage.setItem(LOCALSTORAGE_KEYS.installedExtensions, JSON.stringify(remainingInstalledExtensions));

      console.debug("Removed");
      this.setState({ installed: false });
    }
  }

  async installTheme(update = false) {
    const { item } = this.props;
    if (!item) {
      Spicetify.showNotification("There was an error installing theme", true);
      return;
    }
    console.debug(`Installing theme ${this.localStorageKey}`);

    let parsedSchemes: SchemeIni = {};
    let currentScheme: string | null = null;

    if (update) {
      // Preserve color schemes from localstorage
      const { schemes, activeScheme } = getLocalStorageDataFromKey(this.localStorageKey, {});
      parsedSchemes = schemes;
      currentScheme = activeScheme;
    } else if (item.schemesURL) {
      const schemesResponse = await fetch(item.schemesURL);
      const colourSchemes = await schemesResponse.text();
      parsedSchemes = parseIni(colourSchemes);
    }

    const activeScheme = currentScheme || Object.keys(parsedSchemes)[0] || null;
    console.debug(parsedSchemes, activeScheme);

    // Add to localstorage (this stores a copy of all the card props in the localstorage)
    // TODO: refactor/clean this up

    const { manifest, title, subtitle, authors, user, repo, branch, imageURL, extensionURL, readmeURL, cssURL, schemesURL, include, lastUpdated, created } = item;

    localStorage.setItem(this.localStorageKey, JSON.stringify({
      manifest,
      type: this.props.type,
      title,
      subtitle,
      authors,
      user,
      repo,
      branch,
      imageURL,
      extensionURL,
      readmeURL,
      stars: this.state.stars,
      tags: this.tags,
      // Theme stuff
      cssURL,
      schemesURL,
      include,
      // Installed theme localstorage item has schemes, nothing else does
      schemes: parsedSchemes,
      activeScheme,
      lastUpdated,
      created,
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

    console.debug("Installed");

    // TODO: We'll also need to actually update the usercss etc, not just the colour scheme
    // e.g. the stuff from extension.js, like injectUserCSS() etc.

    if (!item.include) {
      // Add new theme css
      this.fetchAndInjectUserCSS(this.localStorageKey);
      // Update the active theme in Grid state, triggers state change and re-render
      this.props.updateActiveTheme(this.localStorageKey);
      // Update schemes in Grid, triggers state change and re-render
      this.props.updateColourSchemes(parsedSchemes, activeScheme as string);

      // Add to Spicetify.Config
      const name = this.props.item.manifest?.name;
      if (name) Spicetify.Config.current_theme = name;
      if (activeScheme) Spicetify.Config.color_scheme = activeScheme;
    }

    this.setState({ installed: true });
  }

  removeTheme(themeKey?: string | null) {
    // If don't specify theme, remove the currently installed theme
    themeKey = themeKey || localStorage.getItem(LOCALSTORAGE_KEYS.themeInstalled);

    const themeValue = themeKey && localStorage.getItem(themeKey);

    if (themeKey && themeValue) {
      console.debug(`Removing theme ${themeKey}`);

      // Remove from localstorage
      localStorage.removeItem(themeKey);

      // Remove record of installed theme
      localStorage.removeItem(LOCALSTORAGE_KEYS.themeInstalled);

      // Remove from installed list
      const installedThemes = getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.installedThemes, []);
      const remainingInstalledThemes = installedThemes.filter((key) => key !== themeKey);
      localStorage.setItem(LOCALSTORAGE_KEYS.installedThemes, JSON.stringify(remainingInstalledThemes));

      console.debug("Removed");

      // Removes the current theme CSS
      this.fetchAndInjectUserCSS(null);
      // Update the active theme in Grid state
      this.props.updateActiveTheme(null);
      // Removes the current colour scheme
      this.props.updateColourSchemes(null, null);

      // Restore Spicetify.Config
      Spicetify.Config.current_theme = Spicetify.Config.local_theme;
      Spicetify.Config.color_scheme = Spicetify.Config.local_color_scheme;

      this.setState({ installed: false });
    }
  }

  installSnippet() {
    console.debug(`Installing snippet ${this.localStorageKey}`);
    localStorage.setItem(this.localStorageKey, JSON.stringify({
      code: this.props.item.code,
      title: this.props.item.title,
      description: this.props.item.description,
      imageURL: this.props.item.imageURL,
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
      const tld = window.sessionStorage.getItem("marketplace-request-tld") || undefined;
      const userCSS = theme
        ? await parseCSS(this.props.item as CardItem, tld)
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
            type: this.props.type,
            install: this.buttonClicked.bind(this),
            isInstalled: this.isInstalled.bind(this),
          },
        },
      });
    } else {
      Spicetify.showNotification("No page was found", true);
    }
  }

  render() {
    // Cache this for performance
    const IS_INSTALLED = this.isInstalled();
    // console.log(`Rendering ${this.localStorageKey} - is ${IS_INSTALLED ? "" : "not"} installed`);

    // Kill the card if it has been uninstalled on the "Installed" tab
    if (this.props.CONFIG.activeTab === "Installed" && !IS_INSTALLED) {
      console.debug("Card item not installed");
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
      <div className={cardClasses.join(" ")} onClick={() => {
        if (this.props.type === "snippet") {
          const processedName = this.props.item.title.replace(/\n/g, "");

          if (getLocalStorageDataFromKey(`marketplace:installed:snippet:${processedName}`)?.custom)
            return openModal("EDIT_SNIPPET", undefined, undefined, this.props);

          openModal("VIEW_SNIPPET", undefined, undefined, this.props, this.buttonClicked.bind(this));
        } else this.openReadme();
      }
      }>
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
              href={this.props.type !== "snippet"
                ? this.state.externalUrl
                : SNIPPETS_PAGE_URL
              }
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
            {this.props.item.lastUpdated &&
            <p className="marketplace-card-desc">
              {t("grid.lastUpdated",
                { val: new Date(this.props.item.lastUpdated),
                  formatParams: {
                    val: { year: "numeric", month: "long", day: "numeric" },
                  },
                })
              }
            </p>}
            {this.tags.length ? (
              <div className="marketplace-card__bottom-meta main-type-mestoBold">
                <TagsDiv tags={this.tags} showTags={this.props.CONFIG.visual.tags} />
              </div>
            ) : null}
            {IS_INSTALLED && (
              <div className="marketplace-card__bottom-meta main-type-mestoBold">
                ✓ {t("grid.installed")}
              </div>
            )}
            <Spicetify.ReactComponent.TooltipWrapper
              label={this.props.type === "app" ? t("github") : IS_INSTALLED ? t("remove") : t("install")}
              renderInline={true}
            >
              <div className="main-card-PlayButtonContainer">
                <Button classes={["marketplace-installButton"]}
                  type="circle"
                  // If it is installed, it will remove it when button is clicked, if not it will save
                  // TODO: Refactor this using lookups or sth similar
                  label={this.props.type === "app" ? t("github") : IS_INSTALLED ? t("remove") : t("install")}
                  onClick={(e) => {
                    e.stopPropagation();
                    this.buttonClicked();
                  }}
                >
                  {/*If the extension, theme, or snippet is already installed, it will display trash, otherwise it displays download*/}
                  {/* TODO: Refactor this using lookups or sth similar */}
                  {this.props.type === "app" ? <GitHubIcon /> : IS_INSTALLED ? <TrashIcon /> : <DownloadIcon />}
                </Button>
              </div>
            </Spicetify.ReactComponent.TooltipWrapper>
          </div>
        </div>
      </div>
    );
  }
}

export default withTranslation()(Card);
