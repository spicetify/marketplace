import React from "react";
import { Config } from "../../../types/marketplace-types";

import Toggle from "../../Toggle";

const ConfigRow = (props: {
  name: string;
  storageKey: string;
  modalConfig: Config;
  clickable?: boolean;
  updateConfig: (CONFIG: Config) => void;
}) => {
  const toggleId = `toggle:${props.storageKey}`;
  const enabled = !!props.modalConfig.visual[props.storageKey];

  const settingsToggleChange = (e) => {
    const state = e.target.checked;
    const storageKey = e.target.dataset.storageKey;
    props.modalConfig.visual[storageKey] = state;
    console.log(`toggling ${storageKey} to ${state}`);
    localStorage.setItem(`marketplace:${storageKey}`, String(state));

    // Saves the config settings to app as well as SettingsModal state
    props.updateConfig(props.modalConfig);
    // gridUpdatePostsVisual && gridUpdatePostsVisual();
  };

  return (
    <div className='setting-row'>
      <label htmlFor={toggleId} className='col description'>{props.name}</label>
      <div className='col action'>
        <Toggle name={props.name} storageKey={props.storageKey} enabled={enabled} onChange={settingsToggleChange} />
      </div>
    </div>
  );
};

export default ConfigRow;
