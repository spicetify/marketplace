import React from "react";
import { t } from "i18next";
import { Config } from "../../../types/marketplace-types";

import { resetMarketplace } from "../../../logic/Utils";

import ConfigRow from "./ConfigRow";
import Button from "../../Button";
import TabRow from "./TabRow";

interface Props {
  CONFIG: Config;
  updateAppConfig: (CONFIG: Config) => void;
}

const SettingsModal = ({ CONFIG, updateAppConfig } : Props) => {
  // Basically takes in the app's CONFIG and create the initial state,
  // and copies it into the SettingsModal state
  // then when updating anything in the main state, also updates the SettingsModal state

  const [modalConfig, setModalConfig] = React.useState({ ...CONFIG });
  // TODO: use React.useCallback?
  const updateConfig = (CONFIG: Config) => {
    updateAppConfig({ ...CONFIG });
    setModalConfig({ ...CONFIG });
  };

  // Can't use proper event listener here because it's just the DOM outside the component
  const closeButton = document.querySelector("body > generic-modal button.main-trackCreditsModal-closeBtn") as HTMLElement;
  const modalOverlay = document.querySelector("body > generic-modal > div") as HTMLElement;
  if (closeButton && modalOverlay) {
    closeButton.onclick = () => location.reload();
    closeButton.setAttribute("style", "cursor: pointer;");
    modalOverlay.onclick = (e) => {
      // If clicked on overlay, also reload
      if (e.target === modalOverlay) {
        location.reload();
      }
    };
  }

  return (
    <div id="marketplace-config-container">
      <h2>{t("settings.optionsHeading")}</h2>
      <ConfigRow name={t("settings.starCountLabel")} storageKey='stars' modalConfig={modalConfig} updateConfig={updateConfig} />
      <ConfigRow name={t("settings.tagsLabel")} storageKey='tags' modalConfig={modalConfig} updateConfig={updateConfig} />
      <ConfigRow name={t("settings.devToolsLabel")} storageKey='themeDevTools' modalConfig={modalConfig} updateConfig={updateConfig} />
      <ConfigRow name={t("settings.hideInstalledLabel")} storageKey='hideInstalled' modalConfig={modalConfig} updateConfig={updateConfig} />
      <ConfigRow name={t("settings.colourShiftLabel")} storageKey='colorShift' modalConfig={modalConfig} updateConfig={updateConfig} />
      <h2>{t("settings.tabsHeading")}</h2>
      <div className="tabs-container">
        {modalConfig.tabs.map(({ name }, index) => {
          return <TabRow key={index} name={name} modalConfig={modalConfig} updateConfig={updateConfig} />;
        })}
      </div>
      <h2>{t("settings.resetHeading")}</h2>
      <div className="setting-row">
        <label className="col description">{t("settings.resetDescription")}</label>
        <div className="col action">
          <Button onClick={resetMarketplace}>{t("settings.resetBtn")}</Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
