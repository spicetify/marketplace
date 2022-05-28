import React from 'react';

const SettingsToggle = (props: {
  name: string;
  storageKey: string;
  classes?: string[];
  CONFIG: any;
  triggerRefresh: Function;
}) => {
  const enabled = !!props.CONFIG.visual[props.storageKey];
  console.log(`toggling ${props.storageKey} to ${enabled}`);

  const clickToggle = (e) => {
    const state = e.target.checked;
    props.CONFIG.visual[props.storageKey] = state;
    localStorage.setItem(`marketplace:${props.storageKey}`, String(state));

    // TODO: does this work?
    props.triggerRefresh(props.CONFIG);
    // gridUpdatePostsVisual && gridUpdatePostsVisual();
  };

  return (
    <div className='setting-row'>
      <label className='col description'>{props.name}</label>
      <div className='col action'>
        <label className={`x-toggle-wrapper ${props.classes ? props.classes.join(' '): ''}`}>
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
