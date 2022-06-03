import React from "react";
import Button from "../../Button";

const ReloadModal = () => {
  return (
    <div id="marketplace-reload-container">
      <p>A page reload is required to complete this operation.</p>
      <div className="marketplace-reload-modal__button-container">
        <Button onClick={() => {
          Spicetify.PopupModal.hide();
          location.reload();
        }}>
          Reload now
        </Button>
        <Button
          onClick={() => {
            Spicetify.PopupModal.hide();
          }}
        >
          Reload later
        </Button>
      </div>
    </div>
  );
};

export default ReloadModal;
