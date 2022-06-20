import React from "react";
import { getInvalidCSS, getLocalStorageDataFromKey, unparseIni, parseIni } from "../../../logic/Utils";
import { LOCALSTORAGE_KEYS } from "../../../constants";

const themeKey  = localStorage.getItem(LOCALSTORAGE_KEYS.themeInstalled);
let themeManifest;
themeKey ? themeManifest = getLocalStorageDataFromKey(themeKey) : null;

const ThemeDevToolsModal = () => {

  return (
    <div id="marketplace-theme-dev-tools-container" className="marketplace-theme-dev-tools-container">
      <div className="color-picker-container">
        <h2 className="devtools-heading">Color.ini Editor</h2>
        <textarea className="color-ini-editor" id="color-ini-editor">{themeManifest ? unparseIni(themeManifest.schemes) : "Error, no marketplace theme installed."}</textarea>

        <button className="color-ini-editor-save-button" id="color-ini-editor-save-button" onClick={saveColorIni}>Save</button>
      </div>
      {/* Create a box containing the invalid css classnames fetched from "getInvalidCSS()"*/}
      <div className="invalid-css-container">
        <h2 className="devtools-heading">Invalid CSS</h2>

        {getInvalidCSS().map((cssClass, index) => {
          {/* TODO: Should probably not use <br>*/}
          return <div key={index} className="invalid-css-text">{cssClass}</div>;
        },
        )}

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
