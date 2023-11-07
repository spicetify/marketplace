import React from "react";
import { t } from "i18next";

import {
  LATEST_RELEASE_URL,
  MARKETPLACE_VERSION,
  RELEASES_URL,
} from "../../../constants";
import { getMarkdownHTML } from "../../../logic/Utils";

async function fetchLatestReleaseInfo(): Promise<{
  version: string;
  changelog: string | null;
} | null> {
  try {
    const result = await fetch(LATEST_RELEASE_URL);
    const resultJson = await result.json();
    const { body, tag_name, message } = resultJson;
    return body && tag_name && !message
      ? {
        version: tag_name.replace("v", ""),
        changelog: await getMarkdownHTML(
          body.match(/## What's Changed([\s\S]*?)\r\n\r/)[1],
          "spicetify",
          "spicetify-marketplace",
        ),
      }
      : null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

function UpdateModal(): React.ReactElement {
  const [releaseInfo, setReleaseInfo] = React.useState<{
    version: string;
    changelog: string | null;
  } | null>(null);

  React.useEffect(() => {
    fetchLatestReleaseInfo().then((releaseInfo) => setReleaseInfo(releaseInfo));
  }, []);

  return (
    <div id="marketplace-update-container">
      <div id="marketplace-update-description">
        <h4>{t("updateModal.description")}</h4>
        <a href={`${RELEASES_URL}/tag/v${MARKETPLACE_VERSION}`}>
          {t("updateModal.currentVersion", { version: MARKETPLACE_VERSION })}
        </a>
        <a href={`${RELEASES_URL}/tag/v${releaseInfo?.version}`}>
          {t("updateModal.latestVersion", { version: releaseInfo?.version })}
        </a>
      </div>
      <hr />
      <div id="marketplace-update-whats-changed">
        <h3 className="marketplace-update-header">
          {t("updateModal.whatsChanged")}
        </h3>
        <details>
          <summary>{t("updateModal.seeChangelog")}</summary>
          <ul
            dangerouslySetInnerHTML={{ __html: releaseInfo?.changelog ?? "" }}
          />
        </details>
      </div>
      <hr />
      <div id="marketplace-update-guide">
        <h3 className="marketplace-update-header">{t("updateModal.howToUpgrade")}</h3>
        <a href="https://github.com/spicetify/spicetify-marketplace/wiki/Installation">
          {t("updateModal.viewGuide")}
        </a>
      </div>
    </div>
  );
}

export default UpdateModal;
