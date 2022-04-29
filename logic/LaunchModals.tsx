/// <reference path='../../spicetify-cli/globals.d.ts' />
/// <reference path='../../spicetify-cli/jsHelper/spicetifyWrapper.js' />

import React from'react';

import AddSnippetModal from '../src/components/Modals/AddSnippetModal';
import ReloadModal from '../src/components/Modals/ReloadModal';

export const openAddSnippetModal = () => {
    const triggerModal = () => {
        Spicetify.PopupModal.display({
            title: "Add Snippet",
            content: <AddSnippetModal />,
            isLarge: true,
        });
    };

    triggerModal();
    return;

    // if (addSnippetContainer) {
    //     triggerModal();
    //     return;
    // }
}

// TODO: maybe just make a single openModal function?
export const openReloadModal = () => {
    const triggerModal = () => {
        Spicetify.PopupModal.display({
            title: "Reload required",
            content: <ReloadModal />,
            isLarge: false,
        });
    };

    triggerModal();
    return;

    // if (addSnippetContainer) {
    //     triggerModal();
    //     return;
    // }
}
