import React from "react";
import {
  getLocalStorageDataFromKey,
  initializeSnippets,
} from "../../../logic/Utils";
import { LOCALSTORAGE_KEYS } from "../../../constants";
import Button from "../../Button";

const AddSnippetModal = () => {
  const [code, setCode] = React.useState("");
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");

  const saveSnippet = () => {
    const processedCode = code.replace(/\n/g, "");
    const processedName = name.replace(/\n/g, "");
    const processedDescription = description.trim();

    const localStorageKey = `marketplace:installed:snippet:${processedName}`;
    if (getLocalStorageDataFromKey(localStorageKey)) {
      alert("That name is already taken!");
      return;
    }

    console.log(`Installing snippet: ${processedName}`);
    localStorage.setItem(
      localStorageKey,
      JSON.stringify({
        code: processedCode,
        description: processedDescription,
        title: processedName,
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
  };

  return (
    <div id="marketplace-add-snippet-container">
      <div className="marketplace-customCSS-input-container">
        <label htmlFor="marketplace-custom-css">Custom CSS</label>
        <textarea id="marketplace-custom-css"
          rows={4} cols={50}
          value={code} onChange={(e) => setCode(e.target.value)}
          placeholder="Input your own custom CSS here! You can find them in the installed tab for management."
        />
      </div>
      <div className="marketplace-customCSS-input-container">
        <label htmlFor="marketplace-customCSS-name-submit">Snippet Name</label>
        <input id="marketplace-customCSS-name-submit"
          value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Enter a name for your custom snippet."
        />
      </div>
      <div className="marketplace-customCSS-input-container">
        <label htmlFor="marketplace-customCSS-description-submit">
          Snippet Description
        </label>
        <input id="marketplace-customCSS-description-submit"
          value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter a description for your custom snippet."
        />
      </div>
      <Button onClick={saveSnippet}>
        Save CSS
      </Button>
    </div>
  );
};

export default AddSnippetModal;
