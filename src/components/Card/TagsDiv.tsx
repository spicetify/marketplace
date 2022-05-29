import React from "react";

import { MAX_TAGS } from "../../constants";

const TagsDiv = (props: {
  tags: string[];
  showTags: boolean;
}) => {
  const [expanded, setExpanded] = React.useState(false);

  const generateTags = (tags) => {
    return tags.reduce((accum, tag) => {
      // Render tags if enabled. Always render external JS tag
      if (props.showTags || tag === "external JS") {
        accum.push(
          React.createElement("li", {
            className: "marketplace-card__tag",
            draggable: false,
            "data-tag": tag,
          }, tag),
        );
      }
      return accum;
    }, []);
  };

  const baseTags = props.tags.slice(0, MAX_TAGS);
  const extraTags = props.tags.slice(MAX_TAGS);

  // Render the tags list and add expand button if there are more tags
  // TODO: JSX needs to return a single element,
  // so may need to adjust the css that had it returning an array before...
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

  // return [tagsList, extraTags.length && !expanded
  //   ? <button
  //       className="marketplace-card__tags-more-btn"
  //       onClick={(e) => {
  //         e.stopPropagation();
  //         setExpanded(true);
  //       }}
  //     >...</button>
  //     : null
  // ];
};

export default TagsDiv;
