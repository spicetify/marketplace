import React from "react";
import { t } from "i18next";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs/components/prism-core";
import "prismjs/components/prism-css";

import {
  getLocalStorageDataFromKey,
  initializeSnippets,
  fileToBase64,
} from "../../../logic/Utils";
import { LOCALSTORAGE_KEYS } from "../../../constants";
import Button from "../../Button";
import { CardProps } from "../../Card/Card";
import { ModalType } from "../../../logic/LaunchModals";

const SnippetModal = (props: { content?: CardProps, type: ModalType, callback?: () => void }) => {
  const PREVIEW_IMAGE_ID = "marketplace-customCSS-preview";
  const [code, setCode] = React.useState(props.type === "ADD_SNIPPET" ? "" : props.content?.item.code || "");
  const [name, setName] = React.useState(props.type === "ADD_SNIPPET" ? "" : props.content?.item.title || "");
  const [description, setDescription] = React.useState(props.type === "ADD_SNIPPET" ? "" : props.content?.item.description || "");
  const [imageURL, setimageURL] = React.useState(props.type === "ADD_SNIPPET" ? "" : props.content?.item.imageURL || "");

  const processName = () => name.replace(/\n/g, "").replaceAll(" ", "-");
  const processCode = () => code.replace(/\n/g, "\\n");

  const localStorageKey = `marketplace:installed:snippet:${processName()}`;
  const [isInstalled, setInstalled] = React.useState(!!getLocalStorageDataFromKey(localStorageKey));

  const saveSnippet = () => {
    // const processedCode = processCode();
    const processedName = processName();
    const processedDescription = description.trim();

    if (isInstalled && props.type !== "EDIT_SNIPPET") {
      Spicetify.showNotification("That name is already taken!", true);
      return;
    }

    console.debug(`Installing snippet: ${processedName}`);
    if (props.content && props.content.item.title !== processedName) {
      // Remove from installed list
      console.debug(`Deleting outdated snippet: ${props.content.item.title}`);

      localStorage.removeItem(`marketplace:installed:snippet:${props.content.item.title}`);
      const installedSnippetKeys = getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.installedSnippets, []);
      const remainingInstalledSnippetKeys = installedSnippetKeys.filter((key: string) => key !== `marketplace:installed:snippet:${props.content?.item.title}`);
      localStorage.setItem(LOCALSTORAGE_KEYS.installedSnippets, JSON.stringify(remainingInstalledSnippetKeys));
    }

    localStorage.setItem(
      localStorageKey,
      JSON.stringify({
        title: processedName,
        code,
        description: processedDescription,
        imageURL,
        custom: true,
      }),
    );

    // Add to installed list if not there already
    const installedSnippetKeys = getLocalStorageDataFromKey(
      LOCALSTORAGE_KEYS.installedSnippets,
      [],
    );
    if (installedSnippetKeys.indexOf(localStorageKey) === -1) {
      installedSnippetKeys.push(localStorageKey);
      localStorage.setItem(
        LOCALSTORAGE_KEYS.installedSnippets,
        JSON.stringify(installedSnippetKeys),
      );
    }
    const installedSnippets = installedSnippetKeys.map((key: string) =>
      getLocalStorageDataFromKey(key),
    );
    initializeSnippets(installedSnippets);

    Spicetify.PopupModal.hide();
    if (props.type === "EDIT_SNIPPET") location.reload();
  };

  let inputElement: HTMLInputElement;
  const FileInputClick = () => {
    inputElement.click();
  };

  return (
    <div id="marketplace-add-snippet-container">
      <div className="marketplace-customCSS-input-container">
        <label htmlFor="marketplace-custom-css">{t("snippets.customCSS")}</label>
        <div className="marketplace-code-editor-wrapper marketplace-code-editor">
          <Editor
            value={code}
            onValueChange={code => setCode(code)}
            highlight={code => highlight(code, languages.css)}
            textareaId="marketplace-custom-css"
            textareaClassName="snippet-code-editor"
            readOnly={props.type === "VIEW_SNIPPET"}
            placeholder={t("snippets.customCSSPlaceholder")}
            style={{
              // fontFamily: "'Fira code', 'Fira Mono', monospace'",
              // fontSize: 12,
            }}
          />
        </div>
      </div>
      <div className="marketplace-customCSS-input-container">
        <label htmlFor="marketplace-customCSS-name-submit">{t("snippets.snippetName")}</label>
        <input id="marketplace-customCSS-name-submit" className="marketplace-code-editor"
          value={name} onChange={(e) => {
            if (props.type !== "VIEW_SNIPPET")
              setName(e.target.value);
          }}
          placeholder={t("snippets.snippetNamePlaceholder")}
        />
      </div>
      <div className="marketplace-customCSS-input-container">
        <label htmlFor="marketplace-customCSS-description-submit">
          {t("snippets.snippetDesc")}
        </label>
        <input id="marketplace-customCSS-description-submit" className="marketplace-code-editor"
          value={description} onChange={(e) => {
            if (props.type !== "VIEW_SNIPPET")
              setDescription(e.target.value);
          }}
          placeholder={t("snippets.snippetDescPlaceholder")}
        />
      </div>
      <div className="marketplace-customCSS-input-container">
        <label htmlFor={PREVIEW_IMAGE_ID}>
          {t("snippets.snippetPreview")} { props.type !== "VIEW_SNIPPET" && `(${t("snippets.optional")})` }
        </label>
        {imageURL &&
          <label htmlFor={PREVIEW_IMAGE_ID} style={{ textAlign: "center" }}>
            <img className="marketplace-customCSS-image-preview" src={imageURL} alt="Preview" />
          </label>
        }
      </div>
      {props.type !== "VIEW_SNIPPET"
        // Don't display buttons on "View Snippet" modal
        &&
          <>
            <Button onClick={FileInputClick}>
              {imageURL.length ? t("snippets.changeImage") : t("snippets.addImage")}
              <input
                id={PREVIEW_IMAGE_ID}
                type="file"
                style={{ display: "none" }}
                ref={(input: HTMLInputElement) => inputElement = input}
                onChange={async (event) => {
                  if (event.target.files?.[0]) {
                    try {
                      const b64 = await fileToBase64(event.target.files?.[0]);
                      if (b64) {
                        // console.debug(b64);
                        setimageURL(b64 as string);
                      }
                    } catch (err) {
                      console.error(err);
                    }
                  }
                }} />
            </Button>
            {/* Disable the save button if the name or code are empty */}
            <Button onClick={saveSnippet} disabled={!processName() || !processCode()}>
              {t("snippets.saveCSS")}
            </Button>
          </>
      }
      {
        props.type === "VIEW_SNIPPET"
          &&
          <Button onClick={() => {props.callback && props.callback(); setInstalled(!isInstalled);}}>
            {isInstalled ? t("remove") : t("install")}
          </Button>
      }
    </div>
  );
};
export default SnippetModal;
