import React from "react";
import whatsNew from "spcr-whats-new";
import { RELEASE_CHANGELOG, MARKETPLACE_VERSION } from "../../../constants";
import { getMarkdownHTML } from "../../../logic/Utils";

const fetchReleaseBody = async () => {
  return fetch(RELEASE_CHANGELOG)
    .then((res) => res.json())
    .then((result) => {
      // If API returns no error message then get release body
      const body = !result.message ? result.body as string : null;
      if (body) return getMarkdownHTML(body, "spicetify", "spicetify-marketplace");
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
  whatsNew("marketplace", MARKETPLACE_VERSION, {
    title: `✨ Marketplace v${MARKETPLACE_VERSION}`,
    content: <div dangerouslySetInnerHTML={{ __html: changelogBody }}></div>,
    isLarge: true,
  });
};
export default Changelog;
