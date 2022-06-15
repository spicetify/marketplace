import React from "react";
import whatsNew from "spcr-whats-new";
import ReactMarkdown from "react-markdown";
import { RELEASE_CHANGELOG, MARKETPLACE_VERSION } from "../../../constants";

/* const changelogDetails = (
  <>
    <h2>0.6.1</h2>
    <ul>
      <li>Fixed Readme pages sometimes missing scrollbar{" "}
        <a href="https://github.com/spicetify/spicetify-marketplace/issues/113">(#113)</a>
      </li>
      <li>General improvements</li>
    </ul>
    <h2>0.6.0</h2>
    <ul>
      <li>Patched{" "}
        <a href="https://github.com/spicetify/spicetify-marketplace/commit/6636908f86be91b84e381c2a2424a37b394b5119">createPortal</a>
        {" "} error that makes Marketplace unable to start
      </li>
      <li>You can now preview snippets&apos; content by clicking on its card!{" "}
        <a href="https://github.com/spicetify/spicetify-marketplace/pull/225">(#225)</a>
      </li>
      <li>Snippets now have preview images, and you can add your own also{" "}
        <a href="https://github.com/spicetify/spicetify-marketplace/pull/226">(#226)</a>
      </li>
      <li>General improvements</li>
    </ul>
  </>
); */
let changelogBody: string;

const fetchRelease = async () => {
  await fetch(RELEASE_CHANGELOG)
    .then(res => res.json())
    .then(result => {
      // If API returns no error message then get release body
      if (!result.message) changelogBody = result.body;
    })
    .catch(err => console.error(err));
};

const Changelog = async () => {
  await fetchRelease();
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