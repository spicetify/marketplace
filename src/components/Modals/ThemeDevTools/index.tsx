import React from "react";
import Button from "../../Button";

const ThemeDevToolsModal = () => {
  return (
    <div id="marketplace-theme-dev-tools-container">
        <p>
            Theme Dev Tools
        </p>
        <div className="marketplace-theme-dev-tools-modal__button-container">
            <Button onClick={() => {
                Spicetify.PopupModal.hide();
            }}>
                Close
            </Button>
        </div>
    </div>
  );
};

export default ThemeDevToolsModal;
