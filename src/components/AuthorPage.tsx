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

// Far more than any real creator publishes, while bounding the work one page can trigger
const MAX_REPOS_PER_SECTION = 200;
// Each manifest fetch starts a Web Worker, so only run a few at once
const MANIFEST_FETCH_CONCURRENCY = 6;

/**
 * Map over a list with at most `limit` calls in flight, stopping early once `stop()` is true.
 * @returns The results in list order (with holes for any items skipped after stopping)
 */
async function mapWithLimit<T, R>(list: T[], limit: number, fn: (item: T) => Promise<R>, stop: () => boolean) {
  const results: R[] = [];
  let next = 0;
  const worker = async () => {
    while (next < list.length && !stop()) {
      const index = next++;
      results[index] = await fn(list[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, list.length) }, worker));
  return results;
}

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
    // One list per section, filled in as each section loads
    items: CardItem[][];
    loading: boolean;
    failed: boolean;
  }
> {
  state = {
    items: SECTIONS.map((): CardItem[] => []),
    loading: true,
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
    try {
      await this.loadSections();
    } catch (error) {
      console.error("Failed to load the creator's items", error);
      if (!this.unmounted) this.setState({ failed: true });
    } finally {
      if (!this.unmounted) this.setState({ loading: false });
    }
  }

  async loadSections() {
    const { author, CONFIG } = this.props;
    const stopped = () => this.unmounted;

    // Blacklisted repos must never be listed, so show nothing if the blacklist can't be loaded
    const blacklist = await getBlacklist();
    if (stopped()) return;
    if (!blacklist) {
      this.setState({ failed: true });
      return;
    }

    // One section at a time, which spreads out the search requests
    for (const [index, section] of SECTIONS.entries()) {
      const repos: RepoSearchItem[] = [];
      let page: number | null = 0;
      while (page !== null && repos.length < MAX_REPOS_PER_SECTION) {
        const pageOfRepos = await getTaggedRepos(section.topic, page, blacklist, CONFIG.visual.showArchived, CONFIG.sort, author.login);
        if (stopped()) return;
        // Stop at the first failure (e.g. rate limited) instead of repeating it for every section
        if (pageOfRepos.failed) {
          this.setState({ failed: true });
          return;
        }
        repos.push(...pageOfRepos.items);
        page = getNextPage(page, pageOfRepos);
      }

      const repoItems = await mapWithLimit(
        repos.slice(0, MAX_REPOS_PER_SECTION),
        MANIFEST_FETCH_CONCURRENCY,
        async (repo) => {
          const itemsInRepo = await section.fetchItems(repo);
          return (itemsInRepo ?? []).map((item) => ({
            ...item,
            archived: repo.archived,
            lastUpdated: repo.pushed_at,
            created: repo.created_at
          }));
        },
        stopped
      );
      if (stopped()) return;

      const sectionItems = repoItems.flat();
      sortCardItems(sectionItems, CONFIG.sort);
      this.setState(({ items }) => ({ items: items.map((current, i) => (i === index ? sectionItems : current)) }));
    }
  }

  render() {
    const { t, author, CONFIG } = this.props;
    const { items, loading, failed } = this.state;
    const itemCount = items.reduce((total, sectionItems) => total + sectionItems.length, 0);

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
            src={`https://avatars.githubusercontent.com/${author.login}?s=256`}
            alt=""
            draggable="false"
            onError={(e) => {
              e.currentTarget.style.visibility = "hidden";
            }}
          />
          <div className="marketplace-author__info">
            {/* The heading is the GitHub username, which GitHub verifies. The name is from a manifest, so anyone can set it. */}
            <h1 className="marketplace-author__name" title={author.login}>
              {author.login}
            </h1>
            {author.name !== author.login ? (
              <span className="marketplace-author__detail" dir="auto">
                {author.name}
              </span>
            ) : null}
            {!loading && !failed ? <span className="marketplace-author__detail">{t("authorPage.itemCount", { count: itemCount })}</span> : null}
          </div>
        </div>
        {items.map((sectionItems, index) => {
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
        {!loading && (failed || !itemCount) ? (
          <div className="marketplace-author__message">
            {failed ? t("authorPage.loadError", { name: author.login }) : t("authorPage.empty", { name: author.login })}
          </div>
        ) : null}
        <footer className="marketplace-footer">{loading ? <LoadingIcon /> : <div style={{ height: "64px" }} />}</footer>
      </section>
    );
  }
}

export default withTranslation()(AuthorPage);
