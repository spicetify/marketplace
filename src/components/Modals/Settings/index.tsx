import React from "react";
import { Config } from "../../../types/marketplace-types";

import { resetMarketplace } from "../../../logic/Utils";
import { LOCALSTORAGE_KEYS } from "../../../constants";

import ConfigRow from "./ConfigRow";
import Button from "../../Button";
import TabRow from "./TabRow";

interface Props {
  CONFIG: Config;
  updateAppConfig: (CONFIG: Config) => void;
}

const SettingsModal = ({ CONFIG, updateAppConfig } : Props) => {
  // TODO: basically take in the app's CONFIG and create the initial state,
  // but also copy it into the SettingsModal state
  // and when updating anything in the main state, also update the SettingsModal state

  const [modalConfig, setModalConfig] = React.useState({ ...CONFIG });
  // TODO: use React.useCallback?
  const updateConfig = (CONFIG: Config) => {
    updateAppConfig({ ...CONFIG });
    setModalConfig({ ...CONFIG });
  };

  console.log("Rendering SettingsModal...");
  console.log({ CONFIG, modalCONFIG: modalConfig });

  return (
    <div id="marketplace-config-container">
      <h2>Options</h2>
      <ConfigRow name='Stars count' storageKey='stars' modalConfig={modalConfig} updateConfig={updateConfig} />
      <ConfigRow name='Tags' storageKey='tags' modalConfig={modalConfig} updateConfig={updateConfig} />
      <ConfigRow name='Hide installed when browsing' storageKey='hideInstalled' modalConfig={modalConfig} updateConfig={updateConfig} />
      <ConfigRow name='Shift colors every minute' storageKey='colorShift' modalConfig={modalConfig} updateConfig={updateConfig} />
      <h2>Tabs</h2>
      <div className="tabs-container">
        {modalConfig.tabs.map(({ name }, index) => {
          return <TabRow key={index} name={name} modalConfig={modalConfig} updateConfig={updateConfig}  />;
        })}
      </div>
      <h2>Reset</h2>
      <div className="setting-row">
        <label className="col description">Uninstall all extensions and themes, and reset preferences</label>
        <div className="col action">
          <Button onClick={resetMarketplace}>Reset</Button>
        </div>
      </div>
    </div>
  );

  const closeButton = document.querySelector("body > generic-modal button.main-trackCreditsModal-closeBtn");
  const modalOverlay = document.querySelector("body > generic-modal > div");
  if (closeButton instanceof HTMLElement
    && modalOverlay instanceof HTMLElement
  ) {
    closeButton.onclick = () => location.reload();
    closeButton.setAttribute("style", "cursor: pointer;");
    modalOverlay.onclick = (e) => {
      // If clicked on overlay, also reload
      if (e.target === modalOverlay) {
        location.reload();
      }
    };
  }
};

export default SettingsModal;
