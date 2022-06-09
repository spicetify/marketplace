import React from "react";
import {
  getLocalStorageDataFromKey,
  initializeSnippets,
} from "../../../logic/Utils";
import { LOCALSTORAGE_KEYS } from "../../../constants";
import Button from "../../Button";
import { CardProps } from "../../Card/Card";
import { ModalType } from "../../../logic/LaunchModals";

const SnippetModal = (props: { content?: CardProps, type: ModalType }) => {
  const [code, setCode] = React.useState(props.type === "ADD_SNIPPET" ? "" : props.content?.item.code || "");
  const [name, setName] = React.useState(props.type === "ADD_SNIPPET" ? "" : props.content?.item.title || "");
  const [description, setDescription] = React.useState(props.type === "ADD_SNIPPET" ? "" : props.content?.item.description || "");

  const saveSnippet = () => {
    const processedCode = code.replace(/\n/g, "");
    const processedName = name.replace(/\n/g, "");
    const processedDescription = description.trim();

    const localStorageKey = `marketplace:installed:snippet:${processedName}`;
    if (getLocalStorageDataFromKey(localStorageKey) && props.type !== "EDIT_SNIPPET") {
      Spicetify.showNotification("That name is already taken!");
      return;
    }

    console.log(`Installing snippet: ${processedName}`);
    if (props.content && props.content.item.title !== processedName) {
      // Remove from installed list
      console.log(`Deleting outdated snippet: ${props.content.item.title}`);

      localStorage.removeItem(`marketplace:installed:snippet:${props.content.item.title}`);
      const installedSnippetKeys = getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.installedSnippets, []);
      const remainingInstalledSnippetKeys = installedSnippetKeys.filter((key: string) => key !== `marketplace:installed:snippet:${props.content?.item.title}`);
      localStorage.setItem(LOCALSTORAGE_KEYS.installedSnippets, JSON.stringify(remainingInstalledSnippetKeys));
    }

    localStorage.setItem(
      localStorageKey,
      JSON.stringify({
        code: processedCode,
        description: processedDescription,
        title: processedName,
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
      console.log(installedSnippetKeys);
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

  return (
    <div id="marketplace-add-snippet-container">
      <div className="marketplace-customCSS-input-container">
        <label htmlFor="marketplace-custom-css">Custom CSS</label>
        <textarea id="marketplace-custom-css"
          rows={4} cols={50}
          value={code} onChange={(e) => {
            if (props.type !== "VIEW_SNIPPET")
              setCode(e.target.value);
          }}
          placeholder="Input your own custom CSS here! You can find them in the installed tab for management."
        />
      </div>
      <div className="marketplace-customCSS-input-container">
        <label htmlFor="marketplace-customCSS-name-submit">Snippet Name</label>
        <input id="marketplace-customCSS-name-submit"
          value={name} onChange={(e) => {
            if (props.type !== "VIEW_SNIPPET")
              setName(e.target.value);
          }}
          placeholder="Enter a name for your custom snippet."
        />
      </div>
      <div className="marketplace-customCSS-input-container">
        <label htmlFor="marketplace-customCSS-description-submit">
          Snippet Description
        </label>
        <input id="marketplace-customCSS-description-submit"
          value={description} onChange={(e) => {
            if (props.type !== "VIEW_SNIPPET")
              setDescription(e.target.value);
          }}
          placeholder="Enter a description for your custom snippet."
        />
      </div>
      {props.type !== "VIEW_SNIPPET"
        ? <Button onClick={saveSnippet}>
          Save CSS
        </Button>
        : <></>}
    </div>
  );
};
export default SnippetModal;