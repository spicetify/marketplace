import React from "react";
import { withTranslation } from "react-i18next";

import { fetchAppManifest, fetchExtensionManifest, fetchThemeManifest, getBlacklist, getNextPage, getTaggedRepos } from "../logic/FetchRemotes";
import { getScrollViewport, sortCardItems } from "../logic/Utils";
import type { AuthorPageData, CardItem, CardType, Config, RepoSearchItem, RepoTopic, SchemeIni } from "../types/marketplace-types";
import Button from "./Button";
import Card from "./Card/Card";
import BackIcon from "./Icons/BackIcon";
import GitHubIcon from "./Icons/GitHubIcon";
import LoadingIcon from "./Icons/LoadingIcon";

type AuthorSection = {
  type: CardType;
  topic: RepoTopic;
  // Key in the "tabs" translations
  tab: string;
  fetchItems: (repo: RepoSearchItem) => Promise<CardItem[] | null>;
};

const SECTIONS: AuthorSection[] = [
  {
    type: "extension",
    topic: "spicetify-extensions",
    tab: "Extensions",
    // Never hide installed items here, so the page shows everything the creator published
    fetchItems: (repo) => fetchExtensionManifest(repo.contents_url, repo.default_branch, repo.stargazers_count)
  },
  {
    type: "theme",
    topic: "spicetify-themes",
    tab: "Themes",
    fetchItems: (repo) => fetchThemeManifest(repo.contents_url, repo.default_branch, repo.stargazers_count)
  },
  {
    type: "app",
    topic: "spicetify-apps",
    tab: "Apps",
    fetchItems: (repo) => fetchAppManifest(repo.contents_url, repo.default_branch, repo.stargazers_count)
  }
];

// GitHub search returns at most 1000 results, so at most 10 pages of 100
const MAX_SEARCH_PAGES = 10;

class AuthorPage extends React.Component<
  {
    author: AuthorPageData;
    CONFIG: Config;
    activeThemeKey?: string;
    // From Grid, so installing a theme here updates the same state as on the tabs
    updateColourSchemes: (schemes: SchemeIni, activeScheme: string | null) => void;
    updateActiveTheme: (themeKey: string) => void;
    // TODO: there's probably a better way to make TS not complain about the withTranslation HOC
    t: (key: string, options?: Record<string, unknown>) => string;
  },
  {
    // One list per section, or null while loading
    items: CardItem[][] | null;
    failed: boolean;
  }
> {
  state = {
    items: null as CardItem[][] | null,
    failed: false
  };

  unmounted = false;

  componentDidMount() {
    getScrollViewport()?.scrollTo(0, 0);
    this.loadItems();
  }

  componentWillUnmount() {
    this.unmounted = true;
  }

  async loadItems() {
    const { author, CONFIG } = this.props;

    // Blacklisted repos must never be listed, so show nothing if the blacklist can't be loaded
    const blacklist = await getBlacklist();
    if (this.unmounted) return;
    if (!blacklist) {
      this.setState({ items: [], failed: true });
      return;
    }

    let failed = false;
    const items = await Promise.all(
      SECTIONS.map(async (section) => {
        const repos: RepoSearchItem[] = [];
        let page: number | null = 0;
        for (let count = 0; page !== null && count < MAX_SEARCH_PAGES; count++) {
          const pageOfRepos = await getTaggedRepos(section.topic, page, blacklist, CONFIG.visual.showArchived, CONFIG.sort, author.login);
          if (pageOfRepos.failed) {
            failed = true;
            break;
          }
          repos.push(...pageOfRepos.items);
          page = getNextPage(page, pageOfRepos);
        }

        const repoItems = await Promise.all(
          repos.map(async (repo) => {
            const itemsInRepo = await section.fetchItems(repo);
            return (itemsInRepo ?? []).map((item) => ({
              ...item,
              archived: repo.archived,
              lastUpdated: repo.pushed_at,
              created: repo.created_at
            }));
          })
        );

        const sectionItems = repoItems.flat();
        sortCardItems(sectionItems, CONFIG.sort);
        return sectionItems;
      })
    );

    if (this.unmounted) return;
    this.setState({ items, failed });
  }

  render() {
    const { t, author, CONFIG } = this.props;
    const { items, failed } = this.state;
    const itemCount = items?.reduce((total, sectionItems) => total + sectionItems.length, 0) ?? 0;

    // Cards hide uninstalled items and re-download installed ones on the Installed tab,
    // so they must not think they're on it when the page was opened from there
    const cardConfig = { ...CONFIG, activeTab: "Author" };

    return (
      <section className="contentSpacing marketplace-author-page">
        <div className="marketplace-header">
          <div className="marketplace-header__left">
            <Button classes={["marketplace-header__button"]} label={t("authorPage.back")} onClick={() => Spicetify.Platform.History.goBack()}>
              <BackIcon /> {t("authorPage.back")}
            </Button>
          </div>
          <div className="marketplace-header__right">
            <Button
              classes={["marketplace-header__button"]}
              label={t("github")}
              onClick={() => window.open(`https://github.com/${author.login}`, "_blank")}
            >
              <GitHubIcon /> {t("github")}
            </Button>
          </div>
        </div>
        <div className="marketplace-author">
          <img
            className="marketplace-author__avatar"
            src={`https://github.com/${author.login}.png?size=256`}
            alt=""
            draggable="false"
            onError={(e) => {
              e.currentTarget.style.visibility = "hidden";
            }}
          />
          <div className="marketplace-author__info">
            <h1 className="marketplace-author__name" title={author.name} dir="auto">
              {author.name}
            </h1>
            {author.name !== author.login ? <span className="marketplace-author__detail">@{author.login}</span> : null}
            {items && !failed ? <span className="marketplace-author__detail">{t("authorPage.itemCount", { count: itemCount })}</span> : null}
          </div>
        </div>
        {items?.map((sectionItems, index) => {
          const section = SECTIONS[index];
          if (!sectionItems.length) return null;

          return (
            <div className="marketplace-content" key={section.type}>
              <h2 className="marketplace-card-type-heading">{t(`tabs.${section.tab}`)}</h2>
              <div className="marketplace-grid main-gridContainer-gridContainer main-gridContainer-fixedWidth">
                {sectionItems.map((item) => (
                  <Card
                    item={item}
                    key={`${section.type}:${item.user}/${item.repo}:${item.title}`}
                    CONFIG={cardConfig}
                    visual={CONFIG.visual}
                    type={section.type}
                    activeThemeKey={this.props.activeThemeKey}
                    updateColourSchemes={this.props.updateColourSchemes}
                    updateActiveTheme={this.props.updateActiveTheme}
                  />
                ))}
              </div>
            </div>
          );
        })}
        {items && (failed || !itemCount) ? (
          <div className="marketplace-author__message">
            {failed ? t("authorPage.loadError", { name: author.name }) : t("authorPage.empty", { name: author.name })}
          </div>
        ) : null}
        <footer className="marketplace-footer">{items ? <div style={{ height: "64px" }} /> : <LoadingIcon />}</footer>
      </section>
    );
  }
}

export default withTranslation()(AuthorPage);
