import { t } from "i18next";
import { highlight, languages } from "prismjs/components/prism-core";
import React from "react";
import Editor from "react-simple-code-editor";
import "prismjs/components/prism-ini";

import { LOCALSTORAGE_KEYS } from "../../../constants";
import { hydrateMarketplaceStorage, marketplaceStorage } from "../../../logic/Storage";
import { getInvalidCSS, getLocalStorageDataFromKey, parseIni, unparseIni } from "../../../logic/Utils";
import type { SchemeIni } from "../../../types/marketplace-types";
import Button from "../../Button";

type ThemeManifest = {
  schemes: SchemeIni;
} & Record<string, unknown>;

function isThemeManifest(data: unknown): data is ThemeManifest {
  return typeof data === "object" && data !== null && "schemes" in data && typeof data.schemes === "object" && data.schemes !== null;
}

function getThemeDevToolsState() {
  const themeKey = marketplaceStorage.getItem(LOCALSTORAGE_KEYS.themeInstalled);
  const themeManifest = themeKey ? getLocalStorageDataFromKey(themeKey) : null;

  return {
    themeKey: isThemeManifest(themeManifest) ? themeKey : null,
    themeManifest: isThemeManifest(themeManifest) ? themeManifest : null
  };
}

const ThemeDevToolsModal = () => {
  const [themeManifest, setThemeManifest] = React.useState<ThemeManifest | null>(null);
  const [code, setCode] = React.useState(t("devTools.noThemeInstalled"));

  React.useEffect(() => {
    let mounted = true;

    hydrateMarketplaceStorage().then(() => {
      if (!mounted) return;

      const state = getThemeDevToolsState();
      setThemeManifest(state.themeManifest);
      setCode(state.themeManifest ? unparseIni(state.themeManifest.schemes) : t("devTools.noThemeInstalled"));
    });

    return () => {
      mounted = false;
    };
  }, []);

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
        <Button onClick={() => void saveColorIni(code)}>{t("save")}</Button>
      </div>

      {/* Create a box containing the invalid css classnames fetched from "getInvalidCSS()"*/}
      <div className="devtools-column">
        <h2 className="devtools-heading">{t("devTools.invalidCSS")}</h2>

        <div className="marketplace-code-editor-wrapper marketplace-code-editor">
          {getInvalidCSS().map((cssClass, index) => {
            return (
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

const saveColorIni = async (code: string) => {
  await hydrateMarketplaceStorage();
  const { themeKey, themeManifest } = getThemeDevToolsState();

  if (themeKey && themeManifest) {
    themeManifest.schemes = parseIni(code);
    marketplaceStorage.setItem(themeKey, JSON.stringify(themeManifest));
  } else {
    Spicetify.showNotification(t("devTools.noThemeManifest"), true);
  }
};

export default ThemeDevToolsModal;
