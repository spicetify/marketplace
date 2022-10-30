import React from "react";
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

  // const processCode = () => code.replace(/\n/g, "\\n");

  const exportSettings = () => {
    // const processedCode = processCode();

    const settings = exportMarketplace();
    Spicetify.Platform.ClipboardAPI.copy(JSON.stringify(settings));
    Spicetify.showNotification("Settings copied to clipboard.");
    Spicetify.PopupModal.hide();
  };

  const importSettings = () => {
    const pastedData: string = importText;
    let settings : JSON;
    // Check if pastedData exists, if not return an error message and exit
    if (!pastedData) {
      Spicetify.showNotification("No data pasted");
      return;
    }
    // Check if pastedData is valid JSON, if not return an error message and exit
    try {
      settings = JSON.parse(pastedData);
    } catch (e) {
      Spicetify.showNotification("Invalid JSON");
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
      Spicetify.showNotification("No data pasted");
      return;
    }
    //Load the text into settings as a json
    try {
      settings = JSON.parse(text);
    }
    catch (e) {
      Spicetify.showNotification("Invalid JSON");
      return;
    }
    importMarketplace(settings);

  };

  return (
    <div id="marketplace-import-export-container">
      <div className="marketplace-import-export-input-container">
        <label htmlFor="marketplace-import-export">Marketplace Settings</label>
        <div className="marketplace-code-editor-wrapper marketplace-code-editor">
          <Editor
            value={importText}
            onValueChange={text => setImportText(text)}
            highlight={text => highlight(text, languages.css)}
            textareaId="marketplace-import-text"
            textareaClassName="import-textarea"
            readOnly={false}
            className="marketplace-code-editor-textarea"
            placeholder="Copy/paste your settings here"
            style={{
              // fontFamily: "'Fira code', 'Fira Mono', monospace'",
              // fontSize: 12,
            }}
          />
        </div>
      </div>
      <>
        <Button classes={["marketplace-import-export-button"]} onClick={exportSettings} >
          Export
        </Button>
        <Button classes={["marketplace-import-export-button"]} onClick={importSettings}>
          Import
        </Button>

        <Button classes={["marketplace-import-export-button"]} onClick={importSettingsFromFile}>
          Import from file
        </Button>
      </>
    </div>
  );
};
export default ImportExportModal;
