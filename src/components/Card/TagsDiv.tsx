import { t } from "i18next";
import React, { type DetailedReactHTMLElement } from "react";

import { MAX_TAGS } from "../../constants";

const TagsDiv = (props: {
  tags: string[];
  showTags: boolean;
}) => {
  const [expanded, setExpanded] = React.useState(false);

  // Map of english names for tags so that the css can identify them for colouring
  const englishTagMap = {
    [t("grid.externalJS")]: "external JS",
    [t("grid.archived")]: "archived",
    [t("grid.dark")]: "dark",
    [t("grid.light")]: "light"
  };

  const generateTags = (tags: string[]) => {
    // Stop duplicate tags from appearing
    const uniqueTags = tags.filter((item, pos, arr) => arr.indexOf(item) === pos);

    return uniqueTags.reduce<
      DetailedReactHTMLElement<
        {
          className: string;
          draggable: false;
          "data-tag": string;
        },
        HTMLElement
      >[]
    >((accum, tag) => {
      const englishTag = englishTagMap[tag] || tag;
      // Render tags if enabled. Always render external JS and archived tags
      if (props.showTags || tag === t("grid.externalJS") || tag === t("grid.archived")) {
        accum.push(
          React.createElement(
            "li",
            {
              className: "marketplace-card__tag",
              draggable: false,
              "data-tag": englishTag
            },
            tag
          )
        );
      }
      return accum;
    }, []);
  };
  // Sort tags so that externalJS and archived tags come first
  let baseTags = props.tags.sort((a) => (a === t("grid.externalJS") || a === t("grid.archived") ? -1 : 1));
  let extraTags: string[] = [];
  // If there are more than one extra tags, slice them and add an expand button
  if (baseTags.length - MAX_TAGS > 1) {
    extraTags = props.tags.slice(MAX_TAGS);
    baseTags = baseTags.slice(0, MAX_TAGS);
  }

  // Render the tags list and add expand button if there are more tags
  return (
    <div className="marketplace-card__tags-container">
      <ul className="marketplace-card__tags">
        {generateTags(baseTags)}
        {extraTags.length && expanded ? generateTags(extraTags) : null}
      </ul>
      {extraTags.length && !expanded ? (
        <button
          className="marketplace-card__tags-more-btn"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(true);
          }}
        >
          ...
        </button>
      ) : null}
    </div>
  );
};

export default TagsDiv;
