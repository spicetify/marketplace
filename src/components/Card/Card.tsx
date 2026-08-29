import { t } from "i18next";
import React, { type Key } from "react";
import { withTranslation } from "react-i18next";

import { CUSTOM_APP_PATH, LOCALSTORAGE_KEYS, SNIPPETS_PAGE_URL } from "../../constants";
import { openModal } from "../../logic/LaunchModals";
import { marketplaceStorage } from "../../logic/Storage";
import { generateKey, getLocalStorageDataFromKey, initializeSnippets, injectUserCSS, parseCSS, parseIni } from "../../logic/Utils";
import type { CardItem, CardType, Config, SchemeIni, Snippet, VisualConfig } from "../../types/marketplace-types";
import Button from "../Button";
import DownloadIcon from "../Icons/DownloadIcon";
import GitHubIcon from "../Icons/GitHubIcon";
import TrashIcon from "../Icons/TrashIcon";
import Tooltip from "../Tooltip";
import AuthorsDiv from "./AuthorsDiv";
import TagsDiv from "./TagsDiv";

const Spicetify = window.Spicetify;

function readStoredStringArray(value: string | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

type PreparedTheme = {
  activeScheme: string | null;
  item: CardItem;
  parsedSchemes: SchemeIni;
  record: string;
  userCSS?: string;
};

let themeOperationQueue: Promise<void> = Promise.resolve();

function queueThemeOperation<T>(operation: () => Promise<T>) {
  const result = themeOperationQueue.then(operation);
  themeOperationQueue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

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

export class Card extends React.Component<
  CardProps,
  {
    installed: boolean;
    // TODO: Can I remove `stars` from `this`? Or maybe just put everything in `state`?
    stars: number;
    tagsExpanded: boolean;
    externalUrl: string;
    lastUpdated: string | undefined;
    created: string | undefined;
  }
> {
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
    if (props.item.archived) this.tags.push(t("grid.archived"));

    this.state = {
      // Initial value. Used to trigger a re-render.
      // isInstalled() is used for all other intents and purposes
      installed: marketplaceStorage.getItem(this.localStorageKey) !== null,

      // TODO: Can I remove `stars` from `this`? Or maybe just put everything in `state`?
      stars: this.props.item.stars || 0,
      tagsExpanded: false,
      externalUrl:
        this.props.item.user && this.props.item.repo // These won't exist for snippets
          ? `https://github.com/${this.props.item.user}/${this.props.item.repo}`
          : "",
      lastUpdated: this.props.item.user && this.props.item.repo ? this.props.item.lastUpdated : undefined,
      created: this.props.item.user && this.props.item.repo ? this.props.item.created : undefined
    };
  }

  // Using this because it gets the live value ('installed' is stuck after a re-render)
  isInstalled() {
    return marketplaceStorage.getItem(this.localStorageKey) !== null;
  }

  handleOperationError(error: unknown) {
    console.error(`Failed to update ${this.props.type} "${this.props.item.title}"`, error);
    Spicetify.showNotification(t("notifications.marketplaceOperationError"), true);
  }

  async componentDidMount() {
    try {
      await this.refreshInstalledItem();
    } catch (error) {
      this.handleOperationError(error);
    }
  }

  async refreshInstalledItem() {
    // Refresh stars if on "Installed" tab with stars enabled
    if (this.props.CONFIG.activeTab === "Installed" && this.props.type !== "snippet") {
      // https://docs.github.com/en/rest/reference/repos#get-a-repository
      const url = `https://api.github.com/repos/${this.props.item.user}/${this.props.item.repo}`;
      // TODO: This implementation could probably be improved.
      // It might have issues when quickly switching between tabs.
      const repoData = await fetch(url).then((res) => res.json());
      const { stargazers_count, pushed_at } = repoData;

      const stateUpdate = { stars: 0, lastUpdated: undefined };
      if (this.state.stars !== stargazers_count && this.props.CONFIG.visual.stars) {
        stateUpdate.stars = stargazers_count;
        console.debug(`Stars updated to: ${stargazers_count}`);
      }
      if (this.state.lastUpdated !== pushed_at) {
        stateUpdate.lastUpdated = pushed_at;
        console.debug(`New update pushed at: ${pushed_at}`);
        switch (this.props.type) {
          case "extension":
            await this.installExtension();
            break;
          case "theme":
            await this.installTheme(true);
            break;
        }
      }
    }
  }

  async buttonClicked() {
    try {
      await this.performButtonAction();
    } catch (error) {
      this.handleOperationError(error);
    }
  }

  async performButtonAction() {
    if (this.props.type === "extension") {
      if (this.isInstalled()) {
        console.debug("Extension already installed, removing");
        await this.removeExtension();
      } else {
        await this.installExtension();
      }
      // Wait for the storage write to persist before offering to reload.
      openModal("RELOAD");
    } else if (this.props.type === "theme") {
      const shouldReload = await this.toggleTheme();
      if (shouldReload) openModal("RELOAD");
    } else if (this.props.type === "app") {
      // Open repo in new tab
      window.open(this.state.externalUrl, "_blank");
    } else if (this.props.type === "snippet") {
      if (this.isInstalled()) {
        console.debug("Snippet already installed, removing");
        await this.removeSnippet();
      } else {
        await this.installSnippet();
      }
    } else {
      console.error("Unknown card type");
    }
  }

  async installExtension() {
    console.debug(`Installing extension ${this.localStorageKey}`);
    // Add to localstorage (this stores a copy of all the card props in the localstorage)
    // TODO: can I clean this up so it's less repetition?
    if (!this.props.item) {
      Spicetify.showNotification(t("notifications.extensionInstallationError"), true);
      return;
    }
    const { manifest, title, subtitle, authors, user, repo, branch, imageURL, extensionURL, readmeURL, lastUpdated, created } = this.props.item;
    const record = JSON.stringify({
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
      created
    });
    await marketplaceStorage.mutateAsync((storage) => {
      storage.set(this.localStorageKey, record);
      const installedExtensions = readStoredStringArray(storage.get(LOCALSTORAGE_KEYS.installedExtensions));
      if (!installedExtensions.includes(this.localStorageKey)) {
        storage.set(LOCALSTORAGE_KEYS.installedExtensions, JSON.stringify([...installedExtensions, this.localStorageKey]));
      }
    });

    console.debug("Installed");
    this.setState({ installed: true });
  }

  async removeExtension() {
    const extValue = marketplaceStorage.getItem(this.localStorageKey);
    if (extValue) {
      console.debug(`Removing extension ${this.localStorageKey}`);
      await marketplaceStorage.mutateAsync((storage) => {
        storage.delete(this.localStorageKey);
        const installedExtensions = readStoredStringArray(storage.get(LOCALSTORAGE_KEYS.installedExtensions));
        storage.set(LOCALSTORAGE_KEYS.installedExtensions, JSON.stringify(installedExtensions.filter((key) => key !== this.localStorageKey)));
      });

      console.debug("Removed");
      this.setState({ installed: false });
    }
  }

  async prepareTheme(update = false): Promise<PreparedTheme | null> {
    const item = this.props.item as CardItem;
    if (!item) {
      Spicetify.showNotification(t("notifications.themeInstallationError"), true);
      return null;
    }

    let parsedSchemes: SchemeIni = {};
    let currentScheme: string | null = null;

    if (update) {
      // Preserve color schemes from localstorage
      const { schemes, activeScheme } = getLocalStorageDataFromKey(this.localStorageKey, {});
      parsedSchemes = schemes;
      currentScheme = activeScheme;
    } else if (item.schemesURL) {
      const schemesResponse = await fetch(item.schemesURL);
      if (!schemesResponse.ok) throw new Error(`Failed to fetch theme schemes: ${schemesResponse.status}`);
      const colourSchemes = await schemesResponse.text();
      parsedSchemes = parseIni(colourSchemes);
    }

    const activeScheme = currentScheme || Object.keys(parsedSchemes)[0] || null;
    console.debug(parsedSchemes, activeScheme);

    // Add to localstorage (this stores a copy of all the card props in the localstorage)
    // TODO: refactor/clean this up

    const {
      manifest,
      title,
      subtitle,
      authors,
      user,
      repo,
      branch,
      imageURL,
      extensionURL,
      readmeURL,
      cssURL,
      schemesURL,
      include,
      lastUpdated,
      created
    } = item;

    const record = JSON.stringify({
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
      created
    });

    let userCSS: string | undefined;
    if (!item.include) {
      const tld = window.sessionStorage.getItem("marketplace-request-tld") || undefined;
      userCSS = await parseCSS(item, tld);
    }

    return { activeScheme, item, parsedSchemes, record, userCSS };
  }

  async installPreparedTheme({ activeScheme, item, parsedSchemes, record, userCSS }: PreparedTheme, previousThemeKey?: string | null) {
    console.debug(`Installing theme ${this.localStorageKey}`);
    await marketplaceStorage.mutateAsync((storage) => {
      const installedThemes = readStoredStringArray(storage.get(LOCALSTORAGE_KEYS.installedThemes)).filter(
        (key) => key !== previousThemeKey && key !== this.localStorageKey
      );
      if (previousThemeKey && previousThemeKey !== this.localStorageKey) storage.delete(previousThemeKey);
      storage.set(this.localStorageKey, record);
      storage.set(LOCALSTORAGE_KEYS.installedThemes, JSON.stringify([...installedThemes, this.localStorageKey]));
      storage.set(LOCALSTORAGE_KEYS.themeInstalled, this.localStorageKey);
    });

    console.debug("Installed");

    if (!item.include) {
      injectUserCSS(userCSS);
      // Update the active theme in Grid state, triggers state change and re-render
      this.props.updateActiveTheme(this.localStorageKey);
      // Update schemes in Grid, triggers state change and re-render
      this.props.updateColourSchemes(parsedSchemes, activeScheme as string);

      // Add to Spicetify.Config
      const name = this.props.item.manifest?.name;
      // @ts-expect-error: Cannot assign to 'current_theme' because it is a read-only property
      if (name) Spicetify.Config.current_theme = name;
      // @ts-expect-error: Cannot assign to 'color_scheme' because it is a read-only property
      if (activeScheme) Spicetify.Config.color_scheme = activeScheme;
    } else if (previousThemeKey && previousThemeKey !== this.localStorageKey) {
      injectUserCSS();
      this.props.updateActiveTheme(null);
      this.props.updateColourSchemes(null, null);
      // @ts-expect-error: Cannot assign to 'current_theme' because it is a read-only property
      Spicetify.Config.current_theme = "marketplace";
      // @ts-expect-error: Cannot assign to 'color_scheme' because it is a read-only property
      Spicetify.Config.color_scheme = "marketplace";
    }

    this.setState({ installed: true });
  }

  async installTheme(update = false) {
    await queueThemeOperation(async () => {
      const preparedTheme = await this.prepareTheme(update);
      const activeThemeKey = marketplaceStorage.getItem(LOCALSTORAGE_KEYS.themeInstalled);
      if (preparedTheme) await this.installPreparedTheme(preparedTheme, activeThemeKey);
    });
  }

  async toggleTheme() {
    return queueThemeOperation(async () => {
      const themeKey = marketplaceStorage.getItem(LOCALSTORAGE_KEYS.themeInstalled);
      const previousTheme = themeKey ? getLocalStorageDataFromKey(themeKey, {}) : {};

      if (this.isInstalled()) {
        console.debug("Theme already installed, removing");
        await this.removeThemeNow(this.localStorageKey);
      } else {
        const localTheme = marketplaceStorage.getItem(LOCALSTORAGE_KEYS.localTheme);
        if (localTheme !== null && localTheme.toLowerCase() !== "marketplace") {
          Spicetify.showNotification(t("notifications.wrongLocalTheme"), true, 5000);
          return false;
        }

        const preparedTheme = await this.prepareTheme();
        if (!preparedTheme) return false;

        await this.installPreparedTheme(preparedTheme, themeKey);
      }

      return Boolean(this.props.item.manifest?.include || previousTheme.include);
    });
  }

  async removeThemeNow(defaultThemeKey?: string | null) {
    // If don't specify theme, remove the currently installed theme
    const themeKey = defaultThemeKey || marketplaceStorage.getItem(LOCALSTORAGE_KEYS.themeInstalled);

    const themeValue = themeKey && marketplaceStorage.getItem(themeKey);

    if (themeKey && themeValue) {
      console.debug(`Removing theme ${themeKey}`);
      await marketplaceStorage.mutateAsync((storage) => {
        storage.delete(themeKey);
        storage.delete(LOCALSTORAGE_KEYS.themeInstalled);
        const installedThemes = readStoredStringArray(storage.get(LOCALSTORAGE_KEYS.installedThemes));
        storage.set(LOCALSTORAGE_KEYS.installedThemes, JSON.stringify(installedThemes.filter((key) => key !== themeKey)));
      });

      console.debug("Removed");

      // Removes the current theme CSS
      injectUserCSS();
      // Update the active theme in Grid state
      this.props.updateActiveTheme(null);
      // Removes the current colour scheme
      this.props.updateColourSchemes(null, null);

      // Restore Spicetify.Config
      // @ts-expect-error: Cannot assign to 'current_theme' because it is a read-only property
      Spicetify.Config.current_theme = "marketplace";
      // @ts-expect-error: Cannot assign to 'color_scheme' because it is a read-only property
      Spicetify.Config.color_scheme = "marketplace";

      this.setState({ installed: false });
    }
  }

  async installSnippet() {
    console.debug(`Installing snippet ${this.localStorageKey}`);
    await marketplaceStorage.mutateAsync((storage) => {
      storage.set(
        this.localStorageKey,
        JSON.stringify({
          code: this.props.item.code,
          title: this.props.item.title,
          description: this.props.item.description,
          imageURL: this.props.item.imageURL
        })
      );

      const installedSnippetKeys = readStoredStringArray(storage.get(LOCALSTORAGE_KEYS.installedSnippets));
      if (!installedSnippetKeys.includes(this.localStorageKey)) {
        storage.set(LOCALSTORAGE_KEYS.installedSnippets, JSON.stringify([...installedSnippetKeys, this.localStorageKey]));
      }
    });

    const installedSnippetKeys = getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.installedSnippets, []);
    initializeSnippets(installedSnippetKeys.map((key) => getLocalStorageDataFromKey(key)));
    this.setState({ installed: true });
  }

  async removeSnippet() {
    await marketplaceStorage.mutateAsync((storage) => {
      storage.delete(this.localStorageKey);
      const installedSnippetKeys = readStoredStringArray(storage.get(LOCALSTORAGE_KEYS.installedSnippets));
      storage.set(LOCALSTORAGE_KEYS.installedSnippets, JSON.stringify(installedSnippetKeys.filter((key) => key !== this.localStorageKey)));
    });

    const installedSnippetKeys = getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.installedSnippets, []);
    initializeSnippets(installedSnippetKeys.map((key) => getLocalStorageDataFromKey(key)));
    this.setState({ installed: false });
  }

  openReadme() {
    if (this.props.item?.manifest?.readme) {
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
            isInstalled: this.isInstalled.bind(this)
          }
        }
      });
    } else {
      Spicetify.showNotification(t("notifications.noReadmeFile"), true);
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
      // biome-ignore lint/a11y/noStaticElementInteractions: Not static
      <div
        className={cardClasses.join(" ")}
        onClick={() => {
          if (this.props.type === "snippet") {
            const processedName = this.props.item.title.replace(/\n/g, "");

            if (getLocalStorageDataFromKey(`marketplace:installed:snippet:${processedName}`)?.custom)
              return openModal("EDIT_SNIPPET", undefined, undefined, this.props);

            openModal("VIEW_SNIPPET", undefined, undefined, this.props, this.buttonClicked.bind(this));
          } else this.openReadme();
        }}
      >
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
                    e.currentTarget.setAttribute(
                      "src",
                      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII"
                    );

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
              href={this.props.type !== "snippet" ? this.state.externalUrl : SNIPPETS_PAGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="main-cardHeader-text main-type-balladBold">{this.props.item.title}</div>
            </a>
            <div className="main-cardSubHeader-root main-type-mestoBold marketplace-cardSubHeader">
              {/* Add authors if they exist */}
              {this.props.item.authors && <AuthorsDiv authors={this.props.item.authors} />}
              <span>{detail.join(" ‒ ")}</span>
            </div>
            <p className="marketplace-card-desc">
              {this.props.type === "snippet" ? this.props.item.description : this.props.item.manifest?.description}
            </p>
            {this.props.item.lastUpdated && (
              <p className="marketplace-card-desc">
                {t("grid.lastUpdated", {
                  val: new Date(this.props.item.lastUpdated),
                  formatParams: {
                    val: { year: "numeric", month: "long", day: "numeric" }
                  }
                })}
              </p>
            )}
            {this.tags.length ? (
              <div className="marketplace-card__bottom-meta main-type-mestoBold">
                <TagsDiv tags={this.tags} showTags={this.props.CONFIG.visual.tags} />
              </div>
            ) : null}
            {IS_INSTALLED && <div className="marketplace-card__bottom-meta main-type-mestoBold">✓ {t("grid.installed")}</div>}
            <Tooltip label={this.props.type === "app" ? t("github") : IS_INSTALLED ? t("remove") : t("install")} renderInline={true}>
              <div className="main-card-PlayButtonContainer">
                <Button
                  classes={["marketplace-installButton"]}
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
            </Tooltip>
          </div>
        </div>
      </div>
    );
  }
}

export default withTranslation()(Card);
