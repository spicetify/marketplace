import React from "react";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs/components/prism-core";
import "prismjs/components/prism-ini";

import Button from "../../Button";
import { getInvalidCSS, getLocalStorageDataFromKey, unparseIni, parseIni } from "../../../logic/Utils";
import { LOCALSTORAGE_KEYS } from "../../../constants";

const themeKey = localStorage.getItem(LOCALSTORAGE_KEYS.themeInstalled);
const themeManifest = themeKey
  ? getLocalStorageDataFromKey(themeKey)
  : null;

const ThemeDevToolsModal = () => {
  const [code, setCode] = React.useState(themeManifest
    ? unparseIni(themeManifest.schemes)
    : "Error: No marketplace theme installed",
  );

  return (
    <div id="marketplace-theme-dev-tools-container" className="marketplace-theme-dev-tools-container">

      <div className="devtools-column">
        <label htmlFor="color-ini-editor">
          <h2 className="devtools-heading">Color.ini Editor</h2>
        </label>
        <div className="marketplace-code-editor-wrapper marketplace-code-editor">
          <Editor
            value={code}
            onValueChange={code => setCode(code)}
            highlight={code => highlight(code, languages.ini)}
            textareaId="color-ini-editor"
            textareaClassName="color-ini-editor"
            readOnly={!themeManifest}
            placeholder="[your-color-scheme-name]"
            style={{
              fontFamily: "monospace",
              resize: "none",
            }}
          />
        </div>
        <Button onClick={() => saveColorIni(code)}>
          Save
        </Button>
      </div>

      {/* Create a box containing the invalid css classnames fetched from "getInvalidCSS()"*/}
      <div className="devtools-column">
        <h2 className="devtools-heading">Invalid CSS</h2>

        <div className="marketplace-code-editor-wrapper marketplace-code-editor">
          {getInvalidCSS().map((cssClass, index) => {
            return <div key={index} className="invalid-css-text">{cssClass}</div>;
          })}
        </div>

      </div>
    </div>
  );
};

const saveColorIni = (code: string) => {
  if (themeKey) {
    const colorIniParsed = parseIni(code);
    themeManifest.schemes = colorIniParsed;
    localStorage.setItem(themeKey, JSON.stringify(themeManifest));
  } else {
    Spicetify.showNotification("Error: No theme manifest found");
  }
};

export default ThemeDevToolsModal;
