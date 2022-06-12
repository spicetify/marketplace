import React from "react";
import Button from "../../Button";
import {getInvalidCSS} from "../../../logic/Utils";
const ThemeDevToolsModal = () => {
  return (
    <div id="marketplace-theme-dev-tools-container">
        <p>
            Theme Dev Tools
        </p>
        <div className="marketplace-theme-dev-tools-modal__button-container">
            <Button onClick={() => {
                console.log(getInvalidCSS())
            }}>
                Invalid CSS Detector
            </Button>
        </div>
    </div>
  );
};

export default ThemeDevToolsModal;
