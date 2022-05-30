import React from "react";
import { Config } from "../../../types/marketplace-types";
import { resetMarketplace } from "../../../logic/Utils";
import { LOCALSTORAGE_KEYS } from "../../../constants";
import SettingsToggle from "./SettingsToggle";

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

  // TODO: add index?
  function renderTabToggle(key: string, classes?: string[]) {
    const index: number = modalConfig.tabs.reduce((accum, tab, index) => {
      return tab.name === key ? index : accum;
    }, -1); // TODO: null protect...
    const { enabled } = modalConfig.tabs[index];

    const clickToggle = (e) => {
      console.log({ e });
      // const id = el.dataset.id;
      // const slider = el.querySelector("input[type='checkbox']");

      // If we're removing the tab, it's not in the enabled tabs list
      // const toRemove = !slider.checked;
      // const tabItem = CONFIG.tabs.filter(({ name }) => name === id)[0];

      // Enable/disable tab
      // tabItem.enabled = !toRemove;

      // Always "remove" because it re-adds it with the right settings/order in stackTabElements()
      // modalCONFIG.tabsElement[id].remove();
      modalConfig.tabs[index].enabled = e.target.checked;

      // Persist the new enabled tabs
      localStorage.setItem(LOCALSTORAGE_KEYS.tabs, JSON.stringify(modalConfig.tabs));

      // Saves the config settings to app as well as SettingsModal state
      updateConfig(modalConfig);

      // Refresh
      // stackTabElements();
    };

    // convert to jsx
    return (
      <label className={`x-toggle-wrapper ${classes ? classes.join(" "): ""}`}>
        <input type="checkbox" className="x-toggle-input" title={`Toggle for ${key}`}
          checked={enabled}
          disabled={key === "Extensions"}
          onChange={clickToggle}
        />
        <span className="x-toggle-indicatorWrapper">
          <span className="x-toggle-indicator"></span>
        </span>
      </label>
    );
  }

  function posCallback(currPos, dir) {
    // const el = document.querySelector(`[data-id="${tabName}"]`);
    console.log({ currPos, dir });
    // const id = el.dataset.id;
    // const curPos = modalCONFIG.tabs.findIndex(({ name }) => name === id);
    const newPos = currPos + dir;

    const temp = modalConfig.tabs[newPos];
    modalConfig.tabs[newPos] = modalConfig.tabs[currPos];
    modalConfig.tabs[currPos] = temp;

    localStorage.setItem(
      LOCALSTORAGE_KEYS.tabs,
      JSON.stringify(modalConfig.tabs),
    );

    // TODO: does this work?
    updateAppConfig(modalConfig);

    // stackTabElements();
  }

  function createTabOption(name, index) {
    // const tabEnabled = modalCONFIG.tabs[index].enabled;

    return (
      <div className="setting-row" key={name}>
        <h3 className="col description">{name}</h3>
        <div className="col action">
          <button title="Move up" className="arrow-btn" onClick={() => posCallback(index, -1)}>
            <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor"
              dangerouslySetInnerHTML={{ __html: String(Spicetify.SVGIcons["chart-up"]) }}>
            </svg>
          </button>
          <button title="Move down" className="arrow-btn" onClick={() => posCallback(index, 1)}>
            <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor"
              dangerouslySetInnerHTML={{ __html: String(Spicetify.SVGIcons["chart-down"]) }}>
            </svg>
          </button>
          {/* TODO: is this right for the tab settings, do does it do something else? */}
          {renderTabToggle(name, name === "Extensions" ? ["disabled"] : [])}
        </div>
      </div>
    );
  }

  return (
    <div id="marketplace-config-container">
      <h2>Options</h2>
      <SettingsToggle name='Stars count' storageKey='stars' modalConfig={modalConfig} updateConfig={updateConfig} />
      <SettingsToggle name='Tags' storageKey='tags' modalConfig={modalConfig} updateConfig={updateConfig} />
      <SettingsToggle name='Hide installed when browsing' storageKey='hideInstalled' modalConfig={modalConfig} updateConfig={updateConfig} />
      <SettingsToggle name='Shift colors every minute' storageKey='colorShift' modalConfig={modalConfig} updateConfig={updateConfig} />
      <h2>Tabs</h2>
      <div className="tabs-container">
        {/* TODO: pass index? */}
        {modalConfig.tabs.map(({ name }, index) => createTabOption(name, index))}
      </div>
      <h2>Reset</h2>
      <div className="setting-row">
        <label className="col description">Uninstall all extensions and themes, and reset preferences</label>
        <div className="col action">
          <button className="main-buttons-button main-button-secondary" onClick={resetMarketplace}>Reset</button>
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
