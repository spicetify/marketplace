import Button from "@components/Button";
import { t } from "i18next";
import React from "react";

const ReloadModal = () => {
  return (
    <div id="marketplace-reload-container">
      <p>{t("reloadModal.description")}</p>
      <div className="marketplace-reload-modal__button-container">
        <Button
          onClick={() => {
            Spicetify.PopupModal.hide();
            location.reload();
          }}
        >
          {t("reloadModal.reloadNow")}
        </Button>
        <Button
          onClick={() => {
            Spicetify.PopupModal.hide();
          }}
        >
          {t("reloadModal.reloadLater")}
        </Button>
      </div>
    </div>
  );
};

export default ReloadModal;
