import { t } from "i18next";
import React from "react";
import { CUSTOM_APP_PATH } from "../../constants";
import { getGitHubLogin } from "../../logic/Utils";
import type { Author } from "../../types/marketplace-types";

const AuthorsDiv = (props: { authors: Author[] }) => {
  // Add a div with author links inside
  const authorsDiv = (
    <div className="marketplace-card__authors">
      {props.authors.map((author) => {
        // Authors linked to a GitHub profile open their creator page; other links open externally
        const login = getGitHubLogin(author.url);
        return (
          <a
            title={login ? t("authorPage.viewAll", { name: author.name }) : author.name}
            className="marketplace-card__author"
            href={author.url}
            draggable="false"
            dir="auto"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation();
              if (!login) return;

              e.preventDefault();
              Spicetify.Platform.History.push({ pathname: `${CUSTOM_APP_PATH}/author/${login}`, state: { name: author.name } });
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
