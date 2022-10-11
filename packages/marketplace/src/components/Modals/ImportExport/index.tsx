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
  const [href, setHref] = React.useState("");

  // const processCode = () => code.replace(/\n/g, "\\n");

  const exportSettings = () => {
    // const processedCode = processCode();

    const settings = exportMarketplace();
    setCode("Settings copied to clipboard.");
    // TODO: This freezes Spotify if you have a lot of data (e.g. 3.9MB snippet images)
    // setCode(JSON.stringify(settings, null, 2));

    // Spicetify.PopupModal.hide();
    // if (props.type === "EDIT_SNIPPET") location.reload();

    // https://code.tutsplus.com/tutorials/how-to-save-a-file-with-javascript--cms-41105
    const text = "My name in Bob. and I love writing tutorials.";
    const textBlob = new Blob([text], { type: "text/plain" });
    setHref(URL.createObjectURL(textBlob));
  };

  const importSettings = () => {
    // get pastedData from marketplace-code-editor-textarea
    console.log("Importing settings");
    const pastedData = code;
    // Check if pastedData exists, if not return an error message and exit
    if (!pastedData) {
      Spicetify.showNotification("No data pasted");
      console.log("No data pasted");
      return;
    }

    const settings: string = JSON.parse(pastedData);
    console.log(settings);
    importMarketplace(settings);
    Spicetify.PopupModal.hide();
    location.reload();
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
      </>
    </div>
  );
};
export default ImportExportModal;
