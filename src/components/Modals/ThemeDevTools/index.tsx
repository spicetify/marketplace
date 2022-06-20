import React from "react";
import Button from "../../Button";
import { getInvalidCSS, getLocalStorageDataFromKey, unparseIni, parseIni } from "../../../logic/Utils";
import { LOCALSTORAGE_KEYS } from "../../../constants";

const themeKey = localStorage.getItem(LOCALSTORAGE_KEYS.themeInstalled);
const themeManifest = themeKey
  ? getLocalStorageDataFromKey(themeKey)
  : null;

const ThemeDevToolsModal = () => {

  return (
    <div id="marketplace-theme-dev-tools-container" className="marketplace-theme-dev-tools-container">
      <div className="devtools-column">
        <label htmlFor="color-ini-editor">
          <h2 className="devtools-heading">Color.ini Editor</h2>
        </label>
        <textarea className="color-ini-editor" id="color-ini-editor">
          {themeManifest ? unparseIni(themeManifest.schemes) : "Error, no marketplace theme installed."}
        </textarea>

        <Button onClick={saveColorIni}>
          Save
        </Button>
      </div>
      {/* Create a box containing the invalid css classnames fetched from "getInvalidCSS()"*/}
      <div className="devtools-column">
        <h2 className="devtools-heading">Invalid CSS</h2>

        {getInvalidCSS().map((cssClass, index) => {
          return <div key={index} className="invalid-css-text">{cssClass}</div>;
        })}

      </div>
    </div>
  );
};

const saveColorIni = () => {
  if (themeKey) {
    const colorIni = document.getElementById("color-ini-editor") as HTMLTextAreaElement;
    const colorIniParsed = parseIni(colorIni.value);
    themeManifest.schemes = colorIniParsed;
    localStorage.setItem(themeKey, JSON.stringify(themeManifest));
  } else {
    Spicetify.showNotification("Error: No theme manifest found");
  }
};

export default ThemeDevToolsModal;
