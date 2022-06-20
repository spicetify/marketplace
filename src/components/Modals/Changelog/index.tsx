import React from "react";
import whatsNew from "spcr-whats-new";
import ReactMarkdown from "react-markdown";
import { RELEASE_CHANGELOG, MARKETPLACE_VERSION } from "../../../constants";

const fetchReleaseBody = async () => {
  return fetch(RELEASE_CHANGELOG)
    .then((res) => res.json())
    .then((result) => {
      // If API returns no error message then get release body
      const body = !result.message
        ? result.body
        : null;
      return body;
    })
    .catch((err) => {
      console.error(err);
      return null;
    });
};

const Changelog = async () => {
  const changelogBody = await fetchReleaseBody();
  // If a release is not found then don't display changelog modal
  if (!changelogBody) return;
  whatsNew(
    "marketplace",
    MARKETPLACE_VERSION,
    {
      title: `✨ Marketplace v${MARKETPLACE_VERSION}`,
      content: <ReactMarkdown>{changelogBody}</ReactMarkdown>,
      isLarge: true,
    },
  );
};
export default Changelog;
