import React from "react";
import { Config } from "../../../types/marketplace-types";

import styles from "../../../styles/modules/toggle.module.scss";
// import Toggle from "../../Toggle";

const SettingsToggle = (props: {
  name: string;
  storageKey: string;
  modalConfig: Config;
  clickable?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  // updateConfig: (CONFIG: Config) => void;
}) => {
  const toggleId = `toggle:${props.storageKey}`;
  const enabled = !!props.modalConfig.visual[props.storageKey];

  const wrapperClassList = [styles["toggle-wrapper"]];
  if (!props.clickable === false) wrapperClassList.push(styles.disabled);

  // <Toggle name={props.name} storageKey={props.storageKey} modalConfig={} />
  return (
    <div className='setting-row'>
      <label htmlFor={toggleId} className='col description'>{props.name}</label>
      <div className='col action'>
        <label className={wrapperClassList.join(" ")}>
          <input className={styles["toggle-input"]} type='checkbox' checked={enabled}
            data-storage-key={props.storageKey}
            id={toggleId}
            title={`Toggle for ${props.storageKey}`}
            onChange={props.onChange}
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
