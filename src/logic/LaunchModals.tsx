/// <reference path='../../../spicetify-cli/globals.d.ts' />
/// <reference path='../../../spicetify-cli/jsHelper/spicetifyWrapper.js' />

import React from 'react';

import AddSnippetModal from '../components/Modals/AddSnippet';
import ReloadModal from '../components/Modals/Reload';
import SettingsModal from '../components/Modals/Settings';

type ModalType = 'ADD_SNIPPET' | 'RELOAD' | 'SETTINGS';

const getModalSettings = (modalType: ModalType, CONFIG?: any, triggerRefresh?: (CONFIG: any) => void) => {
  switch (modalType) {
    case 'ADD_SNIPPET':
      return {
        title: 'Add Snippet',
        content: <AddSnippetModal />,
        isLarge: false,
      };
    case 'RELOAD':
      return {
        title: 'Reload',
        content: <ReloadModal />,
        isLarge: false,
      };
    case 'SETTINGS':
      return {
        title: 'Settings',
        // TODO: If I just use {CONFIG}, it nests it inside another object...
        content: <SettingsModal CONFIG={CONFIG} triggerRefresh={triggerRefresh} />,
        isLarge: true,
      };
    default:
      return {
        title: '',
        content: null,
        isLarge: false,
      };
  }
};

export const openModal = (modal: ModalType, CONFIG?: any, triggerRefresh?: (CONFIG: any) => void) => {
  const triggerModal = () => {
    const modalSettings = getModalSettings(modal, CONFIG, triggerRefresh);
    Spicetify.PopupModal.display(modalSettings);
  };

  triggerModal();
  return;
};
