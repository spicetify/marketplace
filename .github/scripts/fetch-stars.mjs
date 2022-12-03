import fetch from "node-fetch";

const MANIFEST_URL = "https://raw.githubusercontent.com/spicetify/spicetify-themes/generated-manifest/manifest.json";

/**
 * Get user, repo, and branch from a GitHub raw URL
 * @param {string} url Github Raw URL
 * @returns { { user: string, repo: string } }
 */
const getParamsFromGithubRaw = (url) => {
  const regex_result = url.match(/https:\/\/github\.com\/(?<user>[^/]+)\/(?<repo>[^/]+)/);
  // e.g. https://github.com/nimsandu/spicetify-bloom

  const obj = {
    user: regex_result ? regex_result.groups?.user : null,
    repo: regex_result ? regex_result.groups?.repo : null,
  };

  return obj;
};

const fetchStars = async () => {
  const manifest = await fetch(MANIFEST_URL).then((res) => res.json());

  const stars = await Promise.all(manifest.map(async (theme) => {
    if (!theme.repository) return 'Missing user or repo';

    const { user, repo } = getParamsFromGithubRaw(theme.repository);
    console.log(`Fetching stars for ${user}/${repo}`);

    const url = `https://api.github.com/repos/${user}/${repo}`;
    const response = await fetch(url).then((res) => res.json());
    return response.stargazers_count;
  }));

  return stars;
};

const stars = await fetchStars();
console.log(stars);
