import React from "react";
import { Config } from "../../../types/marketplace-types";

import styles from "../../../styles/modules/toggle.module.scss";

const SettingsToggle = (props: {
  name: string;
  storageKey: string;
  modalConfig: Config;
  updateConfig: (CONFIG: Config) => void;
}) => {
  const toggleId = `toggle:${props.storageKey}`;
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
      <label htmlFor={toggleId} className='col description'>{props.name}</label>
      <div className='col action'>
        <label className={styles["toggle-wrapper"]}>
          <input className={styles["toggle-input"]} type='checkbox' checked={enabled}
            id={toggleId}
            title={`Toggle for ${props.storageKey}`}
            onChange={clickToggle}
          />
          <span className={styles["toggle-indicator-wrapper"]}>
            <span className={styles["toggle-indicator"]}></span>
          </span>
        </label>
      </div>
    </div>
  );
};

export default SettingsToggle;
