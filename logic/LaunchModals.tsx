/// <reference path='../../spicetify-cli/globals.d.ts' />
/// <reference path='../../spicetify-cli/jsHelper/spicetifyWrapper.js' />

import React from'react';

import AddSnippetModal from '../src/components/Modals/AddSnippetModal';
import ReloadModal from '../src/components/Modals/ReloadModal';
// import SettingsModal from '../src/components/Modals/SettingsModal';

type ModalType = 'ADD_SNIPPET' | 'RELOAD'; // | 'SETTINGS';

const MODAL_SETTING_MAP: { [key in ModalType]: { title: string; content: any; isLarge: boolean} } = {
    ADD_SNIPPET: {
        title: 'Add Snippet',
        content: <AddSnippetModal />,
        isLarge: true,
    },
    RELOAD: {
        title: 'Reload required',
        content: <ReloadModal />,
        isLarge: false,
    },
    // SETTINGS: {
    //     title: 'Marketplace Settings',
    //     content: <SettingsModal />,
    //     isLarge: true,
    // },
}

export const openModal = (modal: ModalType) => {
    const triggerModal = () => {
        Spicetify.PopupModal.display(MODAL_SETTING_MAP[modal]);
    };

    triggerModal();
    return;
}
