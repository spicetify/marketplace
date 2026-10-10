import { t } from "i18next";
import React from "react";
import { CUSTOM_APP_PATH } from "../../constants";
import { getAuthorLogin } from "../../logic/Utils";
import type { Author } from "../../types/marketplace-types";

// `owner` is the owner of the item's repo, used when an author has no usable GitHub link
const AuthorsDiv = (props: { authors: Author[]; owner?: string }) => {
  // Add a div with author links inside
  const authorsDiv = (
    <div className="marketplace-card__authors">
      {props.authors.map((author) => {
        // Authors linked to GitHub open their creator page; links to other sites open externally
        const target = getAuthorLogin(author.url, props.owner);
        const login = target?.login;
        // On the repo owner's page, a name is only theirs if it's the manifest's only author
        const pageName = !target?.isRepoOwner || props.authors.length === 1 ? author.name : undefined;
        return (
          <a
            title={login ? t("authorPage.viewAll", { name: author.name }) : author.name}
            className="marketplace-card__author"
            href={login ? `https://github.com/${login}` : author.url}
            draggable="false"
            dir="auto"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation();
              if (!login) return;

              e.preventDefault();
              Spicetify.Platform.History.push({ pathname: `${CUSTOM_APP_PATH}/author/${login}`, state: { name: pageName } });
            }}
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
