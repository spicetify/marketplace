import React from "react";

import styles from "../styles/modules/toggle.module.scss";

const Toggle = (props: {
  name: string;
  storageKey: string;
  enabled: boolean;
  clickable?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  const toggleId = `toggle:${props.storageKey}`;

  const wrapperClassList = [styles["toggle-wrapper"]];
  if (props.clickable === false) wrapperClassList.push(styles.disabled);

  return (
    <label className={wrapperClassList.join(" ")}>
      <input className={styles["toggle-input"]} type='checkbox' checked={props.enabled}
        data-storage-key={props.storageKey}
        id={toggleId}
        title={`Toggle for ${props.storageKey}`}
        onChange={props.onChange}
      />
      <span className={styles["toggle-indicator-wrapper"]}>
        <span className={styles["toggle-indicator"]}></span>
      </span>
    </label>
  );
};

export default Toggle;
