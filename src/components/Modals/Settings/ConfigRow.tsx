import React from "react";
import { Config } from "../../../types/marketplace-types";

import styles from "../../../styles/modules/toggle.module.scss";
import Toggle from "../../Toggle";

const ConfigRow = (props: {
  name: string;
  storageKey: string;
  modalConfig: Config;
  clickable?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  const toggleId = `toggle:${props.storageKey}`;
  const enabled = !!props.modalConfig.visual[props.storageKey];

  const wrapperClassList = [styles["toggle-wrapper"]];
  if (!props.clickable === false) wrapperClassList.push(styles.disabled);

  return (
    <div className='setting-row'>
      <label htmlFor={toggleId} className='col description'>{props.name}</label>
      <div className='col action'>
        <Toggle name='Stars count' storageKey='stars' enabled={enabled} onChange={props.onChange} />
      </div>
    </div>
  );
};

export default ConfigRow;
