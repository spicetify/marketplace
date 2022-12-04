import React from "react";
import { Config } from "../../../types/marketplace-types";

import Toggle from "../../Toggle";
import SortBox from "../../Sortbox";
const ConfigRow = (props: {
  name: string;
  storageKey: string;
  modalConfig: Config;
  clickable?: boolean;
  updateConfig: (CONFIG: Config) => void;
  type?: string;
  options?: string[];
}) => {
  const type = props.type;
  const componentId = (type === "dropdown")
    ? "dropdown:" + props.storageKey
    : "toggle:" + props.storageKey;
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
  const settingsDropdownChange = (value) => {
    const state = value;
    const storageKey = props.storageKey;
    props.modalConfig.visual[storageKey] = state;
    localStorage.setItem(`marketplace:${storageKey}`, String(state));
    props.updateConfig(props.modalConfig);
  };

  if (type === "dropdown" && props.options) {
    return (
      <SortBox
        sortBoxOptions={props.options.map((option) => {
          return {
            key: option,
            value: option,
          };
        })}
        onChange={(value) => settingsDropdownChange(value)}
        sortBySelectedFn={(item) => {
          return item.key == props.modalConfig.visual[props.storageKey];
        }}
      />

    );
  }
  return (
    <div className='setting-row'>
      <label htmlFor={componentId} className='col description'>{props.name}</label>
      <div className='col action'>
        <Toggle name={props.name} storageKey={props.storageKey} enabled={enabled} onChange={settingsToggleChange} />
      </div>
    </div>
  );
};

export default ConfigRow;
