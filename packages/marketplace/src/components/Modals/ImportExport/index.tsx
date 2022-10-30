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
  const [code, setCode] = React.useState("");

  // const processCode = () => code.replace(/\n/g, "\\n");

  const exportSettings = () => {
    // const processedCode = processCode();

    const settings = exportMarketplace();
    Spicetify.Platform.ClipboardAPI.copy(JSON.stringify(settings));
    Spicetify.showNotification("Settings copied to clipboard.");
    Spicetify.PopupModal.hide();
  };

  const importSettings = () => {
    const pastedData : string = code;
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
    // TODO: remove "add-snippet" and "customCSS" references
    <div id="marketplace-add-snippet-container">
      <div className="marketplace-customCSS-input-container">
        <label htmlFor="marketplace-custom-css">Marketplace Settings</label>
        <div className="marketplace-code-editor-wrapper marketplace-code-editor">
          <Editor
            value={code}
            onValueChange={code => setCode(code)}
            highlight={code => highlight(code, languages.css)}
            textareaId="marketplace-custom-css"
            textareaClassName="snippet-code-editor"
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
        {/* <a href={href} className="download" download="marketplace-export.json">
          Download
        </a> */}
        <Button onClick={exportSettings}>
          Export
        </Button>
        <Button onClick={importSettings}>
          Import
        </Button>

        <Button onClick={importSettingsFromFile}>
          Import from file
        </Button>
      </>
    </div>
  );
};
export default ImportExportModal;
