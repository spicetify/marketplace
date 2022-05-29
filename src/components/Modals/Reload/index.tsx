import React from "react";

const ReloadModal = () => {
  return (
    <div id="marketplace-reload-container">
      <p>A page reload is required to complete this operation.</p>
      <div className="marketplace-reload-modal__button-container">
        <button
          id="marketplace-reload-okay"
          className="main-buttons-button main-button-secondary main-playlistEditDetailsModal-save"
          onClick={() => {
            Spicetify.PopupModal.hide();
            location.reload();
          }}
        >
          Reload now
        </button>
        <button
          id="marketplace-reload-cancel"
          className="main-buttons-button main-button-secondary main-playlistEditDetailsModal-save"
          onClick={() => {
            Spicetify.PopupModal.hide();
          }}
        >
          Reload later
        </button>
      </div>
    </div>
  );
};

export default ReloadModal;
