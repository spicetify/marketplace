import React from "react";
import { Config } from "../../../types/marketplace-types";

const SettingsToggle = (props: {
  name: string;
  storageKey: string;
  classes?: string[];
  modalConfig: Config;
  updateConfig: (CONFIG: Config) => void;
}) => {
  const enabled = !!props.modalConfig.visual[props.storageKey];

  const clickToggle = (e) => {
    const state = e.target.checked;
    props.modalConfig.visual[props.storageKey] = state;
    console.log(`toggling ${props.storageKey} to ${state}`);
    localStorage.setItem(`marketplace:${props.storageKey}`, String(state));

    // Saves the config settings to app as well as SettingsModal state
    props.updateConfig(props.modalConfig);
    // gridUpdatePostsVisual && gridUpdatePostsVisual();
  };

  return (
    <div className='setting-row'>
      <label className='col description'>{props.name}</label>
      <div className='col action'>
        <label className={`x-toggle-wrapper ${props.classes ? props.classes.join(" "): ""}`}>
          <input title={`Toggle for ${props.storageKey}`} className='x-toggle-input' type='checkbox' checked={enabled} onChange={clickToggle} />
          <span className='x-toggle-indicatorWrapper'>
            <span className='x-toggle-indicator'></span>
          </span>
        </label>
      </div>
    </div>
  );
};

export default SettingsToggle;
