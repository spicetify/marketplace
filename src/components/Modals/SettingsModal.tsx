/// <reference path='../../../../spicetify-cli/globals.d.ts' />
/// <reference path='../../../../spicetify-cli/jsHelper/spicetifyWrapper.js' />

import React from 'react';
import { resetMarketplace } from '../../../logic/Utils';
import { LOCALSTORAGE_KEYS } from '../../constants';

const SettingsModal = ({ CONFIG, triggerRefresh }) => {
  console.log(CONFIG);

  // Generate the DOM markup for a toggle switch
  function renderToggle(key: string, classes?: string[]) {
    const enabled = !!CONFIG.visual[key];
    console.log(`toggling ${key} to ${enabled}`);

    const clickToggle = (e) => {
      const state = e.target.checked;
      CONFIG.visual[key] = state;
      localStorage.setItem(`marketplace:${key}`, String(state));

      // TODO: does this work?
      triggerRefresh(CONFIG);
      // gridUpdatePostsVisual && gridUpdatePostsVisual();
    };

    // convert to jsx
    return (
      <label className={`x-toggle-wrapper ${classes ? classes.join(" "): ""}`}>
        <input title={`Toggle for ${key}`} className="x-toggle-input" type="checkbox" checked={enabled} onChange={clickToggle} />
        <span className="x-toggle-indicatorWrapper">
          <span className="x-toggle-indicator"></span>
        </span>
      </label>
    );
  }

  // TODO: add index?
  function renderTabToggle(key: string, classes?: string[]) {
    const index:number = CONFIG.tabs.reduce((accum, tab, index) => {
      return tab.name === key ? index : accum;
    }, -1); // TODO: null protect...
    const { enabled } = CONFIG.tabs[index];

    const clickToggle = (e) => {
      console.log({e});
      // const id = el.dataset.id;
      // const slider = el.querySelector("input[type='checkbox']");

      // If we're removing the tab, it's not in the enabled tabs list
      // const toRemove = !slider.checked;
      // const tabItem = CONFIG.tabs.filter(({ name }) => name === id)[0];

      // Enable/disable tab
      // tabItem.enabled = !toRemove;

      // Always "remove" because it re-adds it with the right settings/order in stackTabElements()
      // CONFIG.tabsElement[id].remove();
      CONFIG.tabs[index].enabled = e.target.checked;

      // Persist the new enabled tabs
      localStorage.setItem(LOCALSTORAGE_KEYS.tabs, JSON.stringify(CONFIG.tabs));

      // TODO: does this work?
      triggerRefresh(CONFIG);

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

  function createToggle(name, key) {
    return (
      <div className="setting-row">
        <label className="col description">{name}</label>
        <div className="col action">
          {renderToggle(key)}
        </div>
      </div>
    );
  }

  function posCallback(currPos, dir) {
    // const el = document.querySelector(`[data-id="${tabName}"]`);
    console.log({currPos, dir});
    // const id = el.dataset.id;
    // const curPos = CONFIG.tabs.findIndex(({ name }) => name === id);
    const newPos = currPos + dir;

    const temp = CONFIG.tabs[newPos];
    CONFIG.tabs[newPos] = CONFIG.tabs[currPos];
    CONFIG.tabs[currPos] = temp;

    localStorage.setItem(
        LOCALSTORAGE_KEYS.tabs,
        JSON.stringify(CONFIG.tabs),
    );

    // TODO: does this work?
    triggerRefresh(CONFIG);

    // stackTabElements();
  }

  function createTabOption(name, index) {
    // const tabEnabled = CONFIG.tabs[index].enabled;

    return (
      <div className="setting-row" key={name}>
        <h3 className="col description">{name}</h3>
        <div className="col action">
          <button title="Move up" className="arrow-btn" onClick={() => posCallback(index, -1)}>
            <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor">
              ${Spicetify.SVGIcons["chart-up"]}
            </svg>
          </button>
          <button title="Move down" className="arrow-btn" onClick={() => posCallback(index, 1)}>
            <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor">
              ${Spicetify.SVGIcons["chart-down"]}
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
      {createToggle("Stars count", "stars")}
      {createToggle("Tags", "tags")}
      {createToggle("Hide installed in Marketplace", "hideInstalled")}
      {createToggle("Shift Colors Every Minute", "colorShift")}
      <h2>Tabs</h2>
      <div className="tabs-container">
        {/* TODO: pass index? */}
        {CONFIG.tabs.map(({ name }, index) => createTabOption(name, index))}
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
    && modalOverlay instanceof HTMLElement) {
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
