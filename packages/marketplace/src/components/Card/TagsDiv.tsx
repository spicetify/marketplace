import { t } from "i18next";
import React, { DetailedReactHTMLElement } from "react";

import { MAX_TAGS } from "../../constants";

const TagsDiv = (props: {
  tags: string[];
  showTags: boolean;
}) => {
  const [expanded, setExpanded] = React.useState(false);

  // Map of english names for tags so that the css can identify them for colouring
  const englishTagMap = {
    [t("grid.externalJS")]: "external JS",
    [t("grid.dark")]: "dark",
    [t("grid.light")]: "light",
  };

  const generateTags = (tags: string[]) => {
    // Stop duplicate tags from appearing
    const uniqueTags = tags.filter((item, pos, arr) => arr.indexOf(item) === pos);

    return uniqueTags.reduce<DetailedReactHTMLElement<{
      className: string;
      draggable: false;
      "data-tag": string;
    }, HTMLElement>[]>((accum, tag) => {
      const englishTag = englishTagMap[tag] || tag;
      // Render tags if enabled. Always render external JS tag
      if (props.showTags || tag === t("grid.externalJS")) {
        accum.push(
          React.createElement("li", {
            className: "marketplace-card__tag",
            draggable: false,
            "data-tag": englishTag,
          }, tag),
        );
      }
      return accum;
    }, []);
  };

  const baseTags = props.tags.slice(0, MAX_TAGS);
  const extraTags = props.tags.slice(MAX_TAGS);

  // Render the tags list and add expand button if there are more tags
  return (
    <div className="marketplace-card__tags-container">
      <ul className="marketplace-card__tags">
        { generateTags(baseTags) }
        { extraTags.length && expanded
          ? generateTags(extraTags)
          : null
        }
      </ul>
      { extraTags.length && !expanded
        ? <button
          className="marketplace-card__tags-more-btn"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(true);
          }}
        >...</button>
        : null
      }
    </div>
  );
};

export default TagsDiv;
