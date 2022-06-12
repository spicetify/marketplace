import React from "react";
import whatsNew from "spcr-whats-new";
import { COMMIT_LIST, MARKETPLACE_VERSION } from "../../../constants";

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
const commitArray: string[] = [];

const changelogDetails = () => {
  fetch(COMMIT_LIST).then(res => res.json())
    .then(commits => {
      for (const { commit } of commits) {
        commitArray.push(
          commit.message.split("\n")[0],
        );
      }
    });
};

const Changelog = () => {
  changelogDetails();
  if (commitArray.length > 0) whatsNew(
    "marketplace",
    // This semver version is only used to trigger the Changelog modal and must be bumped simutaneously as MARKETPLACE_VERSION
    "1.0.1",
    {
      title: `✨ Marketplace v${MARKETPLACE_VERSION}`,
      content: <ul>
        {commitArray.map((title, index) =>
          <li key={index}>{title}</li>,
        )}
      </ul>,
      isLarge: true,
    },
  );
  else setTimeout(() => {
    console.log("No commit found, retrying");
    setTimeout(() => Changelog(), 1000);
  });
};
export default Changelog;