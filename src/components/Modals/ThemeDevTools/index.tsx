import { t } from "i18next";
import { highlight, languages } from "prismjs/components/prism-core";
import React from "react";
import Editor from "react-simple-code-editor";
import "prismjs/components/prism-ini";

import { LOCALSTORAGE_KEYS } from "../../../constants";
import { getInvalidCSS, getLocalStorageDataFromKey, parseIni, unparseIni } from "../../../logic/Utils";
import Button from "../../Button";

const themeKey = localStorage.getItem(LOCALSTORAGE_KEYS.themeInstalled);
const themeManifest = themeKey ? getLocalStorageDataFromKey(themeKey) : null;

const ThemeDevToolsModal = () => {
  const [code, setCode] = React.useState(themeManifest ? unparseIni(themeManifest.schemes) : t("devTools.noThemeInstalled"));

  return (
    <div id="marketplace-theme-dev-tools-container" className="marketplace-theme-dev-tools-container">
      <div className="devtools-column">
        <label htmlFor="color-ini-editor">
          <h2 className="devtools-heading">{t("devTools.colorIniEditor")}</h2>
        </label>
        <div className="marketplace-code-editor-wrapper marketplace-code-editor">
          <Editor
            value={code}
            onValueChange={(code) => setCode(code)}
            highlight={(code) => highlight(code, languages.ini)}
            textareaId="color-ini-editor"
            textareaClassName="color-ini-editor"
            readOnly={!themeManifest}
            placeholder={t("devTools.colorIniEditorPlaceholder")}
            style={{
              fontFamily: "monospace",
              resize: "none"
            }}
          />
        </div>
        <Button onClick={() => saveColorIni(code)}>{t("save")}</Button>
      </div>

      {/* Create a box containing the invalid css classnames fetched from "getInvalidCSS()"*/}
      <div className="devtools-column">
        <h2 className="devtools-heading">{t("devTools.invalidCSS")}</h2>

        <div className="marketplace-code-editor-wrapper marketplace-code-editor">
          {getInvalidCSS().map((cssClass, index) => {
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: CSS classname is not unique
              <div key={index} className="invalid-css-text">
                {cssClass}
              </div>
            );
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
    Spicetify.showNotification(t("devTools.noThemeManifest"), true);
  }
};

export default ThemeDevToolsModal;
