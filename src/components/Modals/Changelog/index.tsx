import React from "react";
import whatsNew from "spcr-whats-new";
import { RELEASE_CHANGELOG, MARKETPLACE_VERSION } from "../../../constants";

const fetchReleaseBody = async () => {
  return fetch(RELEASE_CHANGELOG)
    .then((res) => res.json())
    .then(async (result) => {
      // If API returns no error message then get release body
      const body = !result.message ? result.body as string : null;
      if (body) return await getReadmeHTML(body);
      return body;
    })
    .catch((err) => {
      console.error(err);
      return null;
    });
};

const getReadmeHTML = async (readmeText: string) => {
  try {
    const postBody = {
      text: readmeText,
      context: `spicetify/spicetify-marketplace`,
      mode: "gfm",
    };

    const readmeHtmlRes = await fetch("https://api.github.com/markdown", {
      method: "POST",
      body: JSON.stringify(postBody),
    });
    if (!readmeHtmlRes.ok)
      throw Spicetify.showNotification(
        `Error parsing README (HTTP ${readmeHtmlRes.status})`,
      );

    const readmeHtml = await readmeHtmlRes.text();
    return readmeHtml;
  } catch (err) {
    console.error(err);
    return null;
  }
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
