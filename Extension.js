// TODO: this will be the extension in which we run the init code

// @ts-check

// NAME: Spicetify Marketplace Extension
// AUTHOR: theRealPadster, CharlieS1103
// DESCRIPTION: Companion extension for Spicetify Marketplace

/// <reference path="../spicetify-cli/globals.d.ts" />

(function MarketplaceExtension() {
    // TODO: this is pulled from HidePodcasts, we'll need to adjust
    const { Player, Menu, LocalStorage, Platform } = Spicetify;
    const main = document.querySelector(".main-view-container__scroll-node-child");
    if (!(Player && Menu && LocalStorage && Platform && main)) {
        // console.log('Not ready, waiting...');
        setTimeout(MarketplaceExtension, 1000);
        return;
    }

    console.log("Loaded Marketplace extension");
})();
