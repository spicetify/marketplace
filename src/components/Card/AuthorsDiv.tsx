import React from 'react';
import { Author } from '../../types/marketplace-types';

export default (props: {
  authors: Author[];
}) => {
  // Add a div with author links inside
  const authorsDiv = (
    <div className="marketplace-card__authors">
      { props.authors.map((author) => {
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
          >
            {author.name}
          </a>
        );
      })}
    </div>
  );

  return authorsDiv;
};
