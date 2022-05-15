/// <reference path='../../../../../spicetify-cli/globals.d.ts' />
/// <reference path='../../../../../spicetify-cli/jsHelper/spicetifyWrapper.js' />

import React from 'react';
import {
  getLocalStorageDataFromKey,
  initializeSnippets,
} from '../../../../logic/Utils';
import { LOCALSTORAGE_KEYS } from '../../../constants';

const AddSnippetModal = () => {
  function saveSnippet() {
    const textArea = document.querySelector(
      '#marketplace-custom-css'
    ) as HTMLTextAreaElement;
    const nameInput = document.querySelector(
      '#marketplace-customCSS-name-submit'
    ) as HTMLInputElement;
    const descriptionInput = document.querySelector(
      '#marketplace-customCSS-description-submit'
    ) as HTMLInputElement;

    const code = textArea.value.replace(/\n/g, '');
    const name = nameInput.value.replace(/\n/g, '');
    const description = descriptionInput.value.trim();
    const localStorageKey = `marketplace:installed:snippet:${name}`;
    if (getLocalStorageDataFromKey(localStorageKey)) {
      alert('That name is already taken!');
      return;
    }

    console.log(`Installing snippet: ${name}`);
    localStorage.setItem(
      localStorageKey,
      JSON.stringify({
        code,
        description,
        title: name,
      })
    );

    // Add to installed list if not there already
    const installedSnippetKeys = getLocalStorageDataFromKey(
      LOCALSTORAGE_KEYS.installedSnippets,
      []
    );
    if (installedSnippetKeys.indexOf(localStorageKey) === -1) {
      installedSnippetKeys.push(localStorageKey);
      localStorage.setItem(
        LOCALSTORAGE_KEYS.installedSnippets,
        JSON.stringify(installedSnippetKeys)
      );
    }
    const installedSnippets = installedSnippetKeys.map((key) =>
      getLocalStorageDataFromKey(key)
    );
    initializeSnippets(installedSnippets);

    Spicetify.PopupModal.hide();
  }

  return (
    <div id="marketplace-add-snippet-container">
      <div className="marketplace-customCSS-input-container">
        <label htmlFor="marketplace-custom-css">Custom CSS</label>
        <textarea
          id="marketplace-custom-css"
          name="marketplace-custom-css"
          rows={4}
          cols={50}
          placeholder="Input your own custom CSS here! You can find them in the installed tab for management."
        />
      </div>
      <div className="marketplace-customCSS-input-container">
        <label htmlFor="marketplace-customCSS-name-submit">Snippet Name</label>
        <input
          id="marketplace-customCSS-name-submit"
          name="marketplace-customCSS-name-submit"
          placeholder="Enter a name for your custom snippet."
        />
      </div>
      <div className="marketplace-customCSS-input-container">
        <label htmlFor="marketplace-customCSS-description-submit">
          Snippet Description
        </label>
        <input
          id="marketplace-customCSS-description-submit"
          name="marketplace-customCSS-description-submit"
          placeholder="Enter a description for your custom snippet."
        />
      </div>
      <button
        className="main-buttons-button main-button-secondary"
        id="marketplace-customCSS-submit"
        onClick={saveSnippet}
      >
        Save CSS
      </button>
    </div>
  );
};

export default AddSnippetModal;
