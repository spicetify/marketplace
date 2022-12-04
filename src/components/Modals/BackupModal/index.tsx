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

  /**
   * Load in settings from a JSON string, then reload the page.
   * If the string is empty or the JSON is invalid, show an error.
   * @param settingsString JSON string of settings to import
   */
  const importSettings = (settingsString: string) => {
    // Check if the settings data exists, if not return an error message and exit
    if (!settingsString) {
      Spicetify.showNotification(t("backupModal.noDataPasted"));
      return;
    }

    // Check if settings string is valid JSON, if not return an error message and exit
    let settings: JSON;
    try {
      settings = JSON.parse(settingsString);
    } catch (e) {
      Spicetify.showNotification(t("backupModal.invalidJSON"));
      return;
    }

    importMarketplace(settings);
    location.reload();
  };

  /**
   * Import settings from the text input
   */
  const importSettingsFromInput = () => {
    importSettings(importText);
  };

  /**
   * Prompt user to select a file to import and then run importMarketplace
   */
  const importSettingsFromFile = async () => {
    const fileHandle = await window.showOpenFilePicker();
    const file = await fileHandle[0].getFile();
    const text = await file.text();

    importSettings(text);
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
        <Button classes={["marketplace-backup-button"]} onClick={importSettingsFromInput}>
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
