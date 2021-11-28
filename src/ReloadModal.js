let reloadContainer;

// const MODAL_SUBTITLE = "Reload needed to complete uninstall";
const MODAL_TITLE = "Reload required";

// eslint-disable-next-line no-unused-vars, no-redeclare
function openReloadModal() {
    const triggerModal = () => {
        Spicetify.PopupModal.display({
            title: MODAL_TITLE,
            content: reloadContainer,
        });
    };

    if (reloadContainer) {
        triggerModal();
        return;
    }

    reloadContainer = document.createElement("div");
    reloadContainer.id = "marketplace-reload-container";

    // const optionHeader = document.createElement("h2");
    // optionHeader.innerText = MODAL_SUBTITLE;

    const paragraph = document.createElement("p");
    paragraph.innerText = "A page reload is required to complete this operation.";

    const buttonContainer = document.createElement("div");
    buttonContainer.classList.add("marketplace-reload-modal__button-container");

    const okayBtn = document.createElement("button");
    okayBtn.id = "marketplace-reload-okay";
    // TODO: add our own classes for styling?
    okayBtn.innerText = "Reload now";
    okayBtn.classList.add("main-buttons-button", "main-button-secondary", "main-playlistEditDetailsModal-save");
    okayBtn.onclick = () => {
        Spicetify.PopupModal.hide();
        location.reload();
    };

    const cancelBtn = document.createElement("button");
    cancelBtn.id = "marketplace-reload-cancel";
    cancelBtn.innerText = "Reload later";
    cancelBtn.classList.add("main-buttons-button", "main-button-secondary", "main-playlistEditDetailsModal-save");
    cancelBtn.onclick = () => {
        Spicetify.PopupModal.hide();
    };

    buttonContainer.append(okayBtn, cancelBtn);

    reloadContainer.append(
        paragraph,
        buttonContainer,
    );

    triggerModal();
}
