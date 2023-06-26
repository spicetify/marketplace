import React from "react";
import { t } from "i18next";
import { Config } from "../../../types/marketplace-types";
import { LOCALSTORAGE_KEYS } from "../../../constants";

import Toggle from "../../Toggle";

const TabRow = (props: {
  name: string;
  key?: number; // The React prop
  modalConfig: Config;
  updateConfig: (CONFIG: Config) => void;
}) => {
  const toggleId = `toggle:${props.name}`;

  // Tab index?
  const index: number = props.modalConfig.tabs.reduce((accum, tab, index) => {
    return tab.name === props.name ? index : accum;
  }, -1); // TODO: null protect...
  const { enabled } = props.modalConfig.tabs[index];

  const clickToggle = (e) => {
    props.modalConfig.tabs[index].enabled = e.target.checked;

    // Persist the new enabled tabs
    localStorage.setItem(LOCALSTORAGE_KEYS.tabs, JSON.stringify(props.modalConfig.tabs));
    // Saves the config settings to app as well as SettingsModal state
    props.updateConfig(props.modalConfig);
  };

  function moveTab(currPos, dir) {
    const newPos = currPos + dir;

    const temp = props.modalConfig.tabs[newPos];
    props.modalConfig.tabs[newPos] = props.modalConfig.tabs[currPos];
    props.modalConfig.tabs[currPos] = temp;

    localStorage.setItem(
      LOCALSTORAGE_KEYS.tabs,
      JSON.stringify(props.modalConfig.tabs),
    );

    // Saves the config settings to app as well as SettingsModal state
    props.updateConfig(props.modalConfig);
  }

  return (
    <div className="settings-row">
      <label htmlFor={toggleId} className="col description">{t(`tabs.${props.name}`)}</label>
      <div className="col action">
        <button title="Move up" className="arrow-btn" disabled={index === 0} onClick={() => moveTab(index, -1)}>
          <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor"
            dangerouslySetInnerHTML={{ __html: String(Spicetify.SVGIcons["chart-up"]) }}>
          </svg>
        </button>
        <button title="Move down" className="arrow-btn" disabled={index === props.modalConfig.tabs.length - 1} onClick={() => moveTab(index, 1)}>
          <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor"
            dangerouslySetInnerHTML={{ __html: String(Spicetify.SVGIcons["chart-down"]) }}>
          </svg>
        </button>
        <Toggle name={props.name} storageKey={`tab:${props.name}`}
          clickable={props.name !== "Extensions"}
          enabled={enabled}
          onChange={clickToggle}
        />
      </div>
    </div>
  );
};

export default TabRow;
