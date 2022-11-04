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

const BackupModal = () => {
  const [importText, setImportText] = React.useState("");

  const exportSettings = () => {
    const settings = exportMarketplace();
    Spicetify.Platform.ClipboardAPI.copy(JSON.stringify(settings));
    Spicetify.showNotification(t("backupModal.settingsCopied"));
    Spicetify.PopupModal.hide();
  };

  const importSettings = () => {
    const pastedData: string = importText;
    let settings : JSON;
    // Check if pastedData exists, if not return an error message and exit
    if (!pastedData) {
      Spicetify.showNotification(t("backupModal.noDataPasted"));
      return;
    }
    // Check if pastedData is valid JSON, if not return an error message and exit
    try {
      settings = JSON.parse(pastedData);
    } catch (e) {
      Spicetify.showNotification(t("backupModal.invalidJSON"));
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
      Spicetify.showNotification(t("backupModal.noDataPasted"));
      return;
    }
    //Load the text into settings as a json
    try {
      settings = JSON.parse(text);
    }
    catch (e) {
      Spicetify.showNotification(t("backupModal.invalidJSON"));
      return;
    }
    importMarketplace(settings);

  };

  return (
    <div id="marketplace-backup-container">
      <div className="marketplace-backup-input-container">
        <label htmlFor="marketplace-backup">{t("backupModal.inputLabel")}</label>
        <div className="marketplace-code-editor-wrapper marketplace-code-editor">
          <Editor
            value={importText}
            onValueChange={text => setImportText(text)}
            highlight={text => highlight(text, languages.css)}
            textareaId="marketplace-import-text"
            textareaClassName="import-textarea"
            readOnly={false}
            className="marketplace-code-editor-textarea"
            placeholder={t("backupModal.inputPlaceholder")}
            style={{
              // fontFamily: "'Fira code', 'Fira Mono', monospace'",
              // fontSize: 12,
            }}
          />
        </div>
      </div>
      <>
        <Button classes={["marketplace-backup-button"]} onClick={exportSettings} >
          {t("backupModal.exportBtn")}
        </Button>
        <Button classes={["marketplace-backup-button"]} onClick={importSettings}>
          {t("backupModal.importBtn")}
        </Button>

        <Button classes={["marketplace-backup-button"]} onClick={importSettingsFromFile}>
          {t("backupModal.fileImportBtn")}
        </Button>
      </>
    </div>
  );
};
export default BackupModal;
