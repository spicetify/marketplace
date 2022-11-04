import React from "react";
import { t } from "i18next";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs/components/prism-core";
import "prismjs/components/prism-json";

import {
  exportMarketplace,
  importMarketplace,
} from "../../../logic/Utils";
import Button from "../../Button";

const ImportExportModal = () => {
  const [importText, setImportText] = React.useState("");

  const exportSettings = () => {
    const settings = exportMarketplace();
    Spicetify.Platform.ClipboardAPI.copy(JSON.stringify(settings));
    Spicetify.showNotification(t("importExport.settingsCopied"));
    Spicetify.PopupModal.hide();
  };

  const importSettings = () => {
    const pastedData: string = importText;
    let settings : JSON;
    // Check if pastedData exists, if not return an error message and exit
    if (!pastedData) {
      Spicetify.showNotification(t("importExport.noDataPasted"));
      return;
    }
    // Check if pastedData is valid JSON, if not return an error message and exit
    try {
      settings = JSON.parse(pastedData);
    } catch (e) {
      Spicetify.showNotification(t("importExport.invalidJSON"));
      return;
    }
    importMarketplace(settings);
    Spicetify.PopupModal.hide();
    location.reload();
  };
  const importSettingsFromFile = async () => {
    // Prompt user to select a file to import and then run importMarketplace
    const fileHandle = await window.showOpenFilePicker();
    const file = await fileHandle[0].getFile();
    const text = await file.text();
    let settings : JSON;
    // Check if the text exists, if not return an error message and exit
    if (!text) {
      Spicetify.showNotification(t("importExport.noDataPasted"));
      return;
    }
    //Load the text into settings as a json
    try {
      settings = JSON.parse(text);
    }
    catch (e) {
      Spicetify.showNotification(t("importExport.invalidJSON"));
      return;
    }
    importMarketplace(settings);

  };

  return (
    <div id="marketplace-import-export-container">
      <div className="marketplace-import-export-input-container">
        <label htmlFor="marketplace-import-export">{t("importExport.inputLabel")}</label>
        <div className="marketplace-code-editor-wrapper marketplace-code-editor">
          <Editor
            value={importText}
            onValueChange={text => setImportText(text)}
            highlight={text => highlight(text, languages.css)}
            textareaId="marketplace-import-text"
            textareaClassName="import-textarea"
            readOnly={false}
            className="marketplace-code-editor-textarea"
            placeholder={t("importExport.inputPlaceholder")}
            style={{
              // fontFamily: "'Fira code', 'Fira Mono', monospace'",
              // fontSize: 12,
            }}
          />
        </div>
      </div>
      <>
        <Button classes={["marketplace-import-export-button"]} onClick={exportSettings} >
          {t("importExport.exportBtn")}
        </Button>
        <Button classes={["marketplace-import-export-button"]} onClick={importSettings}>
          {t("importExport.importBtn")}
        </Button>

        <Button classes={["marketplace-import-export-button"]} onClick={importSettingsFromFile}>
          {t("importExport.fileImportBtn")}
        </Button>
      </>
    </div>
  );
};
export default ImportExportModal;
