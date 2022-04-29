/// <reference path='../../spicetify-cli/globals.d.ts' />
/// <reference path='../../spicetify-cli/jsHelper/spicetifyWrapper.js' />

import React from'react';

// let addSnippetContainer;
import AddSnippetModal from '../src/components/AddSnippetModal';

export function openAddSnippetModal() {
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
