import type { Author } from "@type/marketplace-types";
import React from "react";

const AuthorsDiv = (props: {
  authors: Author[];
}) => {
  // Add a div with author links inside
  const authorsDiv = (
    <div className="marketplace-card__authors">
      {props.authors.map((author) => {
        return (
          <a
            title={author.name}
            className="marketplace-card__author"
            href={author.url}
            draggable="false"
            dir="auto"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            key={author.name + author.url}
          >
            {author.name}
          </a>
        );
      })}
    </div>
  );

  return authorsDiv;
};

export default AuthorsDiv;
