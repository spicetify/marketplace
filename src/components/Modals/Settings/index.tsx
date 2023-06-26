import React from "react";
import { t } from "i18next";
import { Config } from "../../../types/marketplace-types";

import { getLocalStorageDataFromKey, resetMarketplace, sleep } from "../../../logic/Utils";

import ConfigRow from "./ConfigRow";
import Button from "../../Button";
import TabRow from "./TabRow";

import { openModal } from "../../../logic/LaunchModals";
import { LOCALSTORAGE_KEYS, MARKETPLACE_VERSION } from "../../../constants";

interface Props {
  CONFIG: Config;
  updateAppConfig: (CONFIG: Config) => void;
}

const SettingsModal = ({ CONFIG, updateAppConfig } : Props) => {
  // Basically takes in the app's CONFIG and create the initial state,
  // and copies it into the SettingsModal state
  // then when updating anything in the main state, also updates the SettingsModal state

  const [modalConfig, setModalConfig] = React.useState({ ...CONFIG });
  const [versionButtonText, setVersionButtonText] = React.useState(t("settings.versionBtn"));
  // TODO: use React.useCallback?
  const updateConfig = (CONFIG: Config) => {
    updateAppConfig({ ...CONFIG });
    setModalConfig({ ...CONFIG });
  };

  /** Copy Marketplace version to clipboard and update button text */
  const copyVersion = () => {
    Spicetify.Platform.ClipboardAPI.copy(MARKETPLACE_VERSION);
    setVersionButtonText(t("settings.versionCopied"));
    setTimeout(() => setVersionButtonText(t("settings.versionBtn")), 3000);
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

  const AlbumArtColorDropDowns = getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.albumArtBasedColor) ? <>
    <ConfigRow name={t("settings.albumArtBasedColorsMode")} storageKey="albumArtBasedColorsMode" modalConfig={modalConfig} updateConfig={updateConfig} type="dropdown" options={["monochromeDark", "monochromeLight", "analogicComplement", "analogic", "triad", "quad"]} description={t("settings.almbumArtColorsModeToolTip")} />
    <ConfigRow name={t("settings.albumArtBasedColorsVibrancy")} storageKey="albumArtBasedColorsVibrancy" modalConfig={modalConfig} updateConfig={updateConfig} type="dropdown" options={["desaturated", "lightVibrant", "prominent", "vibrant"]} description={t("settings.albumArtBasedColorsVibrancyToolTip")} /></> : null;

  return (
    <div id="marketplace-config-container">

      <h2 className="settings-heading">{t("settings.optionsHeading")}</h2>
      <ConfigRow name={t("settings.starCountLabel")} storageKey='stars' modalConfig={modalConfig} updateConfig={updateConfig}/>
      <ConfigRow name={t("settings.tagsLabel")} storageKey='tags' modalConfig={modalConfig} updateConfig={updateConfig}/>
      <ConfigRow name={t("settings.devToolsLabel")} storageKey='themeDevTools' modalConfig={modalConfig} updateConfig={updateConfig}/>
      <ConfigRow name={t("settings.hideInstalledLabel")} storageKey='hideInstalled' modalConfig={modalConfig} updateConfig={updateConfig}/>
      <ConfigRow name={t("settings.colourShiftLabel")} storageKey='colorShift' modalConfig={modalConfig} updateConfig={updateConfig}/>
      <ConfigRow name={t("settings.albumArtBasedColors")} storageKey='albumArtBasedColors' modalConfig={modalConfig} updateConfig={updateConfig}/>
      {AlbumArtColorDropDowns}

      <h2 className="settings-heading">{t("settings.tabsHeading")}</h2>
      <div className="tabs-container">
        {modalConfig.tabs.map(({ name }, index) => {
          return <TabRow key={index} name={name} modalConfig={modalConfig} updateConfig={updateConfig} />;
        })}
      </div>

      <h2 className="settings-heading">{t("settings.resetHeading")}</h2>
      <div className="settings-row">
        <label className="col description">{t("settings.resetDescription")}</label>
        <div className="col action">
          <Button onClick={resetMarketplace}>{t("settings.resetBtn")}</Button>
        </div>
      </div>

      <h2 className="settings-heading">{t("settings.backupHeading")}</h2>
      <div className="settings-row">
        <label className="col description">{t("settings.backupLabel")}</label>
        <div className="col action">
          <Button onClick={onBackupClick}>{t("settings.backupBtn")}</Button>
        </div>
      </div>

      <h2>{t("settings.versionHeading")}</h2>
      <div className="setting-row">
        <label className="col description">
          {t("grid.spicetifyMarketplace")} {MARKETPLACE_VERSION}
        </label>
        <div className="col action">
          <Button onClick={copyVersion}>{versionButtonText}</Button>
        </div>
      </div>

    </div>
  );
};

const onBackupClick = async () => {
  // Make a new mutation observer to make sure the modal is gone
  const observer = new MutationObserver(async () => {
    const settingsModal = document.querySelector(".GenericModal[aria-label='Settings']");
    if (!settingsModal) {
      await sleep(100);
      openModal("BACKUP");
      observer.disconnect();
    }
  });

  // TODO: does it still work if I just attach to the settings modal itself?
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  Spicetify.PopupModal.hide();
};

export default SettingsModal;
