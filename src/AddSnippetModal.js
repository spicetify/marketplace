let addSnippetContainer;

// eslint-disable-next-line no-unused-vars, no-redeclare
function openAddSnippetModal() {
    const MODAL_TITLE = "Add Snippet";

    const triggerModal = () => {
        Spicetify.PopupModal.display({
            title: MODAL_TITLE,
            content: addSnippetContainer,
            isLarge: true,
        });
    };

    if (addSnippetContainer) {
        triggerModal();
        return;
    }

    addSnippetContainer = document.createElement("div");
    addSnippetContainer.id = "marketplace-add-snippet-container";

    // Code section =====
    const codeContainer = document.createElement("div");
    codeContainer.className = "marketplace-customCSS-input-container";

    const codeLabel = document.createElement("label");
    codeLabel.setAttribute("for", "marketplace-custom-css");
    codeLabel.innerText = "Custom CSS";
    codeContainer.appendChild(codeLabel);

    const textArea = document.createElement("textarea");
    textArea.id = "marketplace-custom-css";
    textArea.name = "marketplace-custom-css";
    textArea.rows = "4";
    textArea.cols = "50";
    textArea.placeholder = "Input your own custom CSS here! You can find them in the installed tab for management.";
    codeContainer.appendChild(textArea);

    // Name section =====
    const nameContainer = document.createElement("div");
    nameContainer.className = "marketplace-customCSS-input-container";

    const nameLabel = document.createElement("label");
    nameLabel.setAttribute("for", "marketplace-customCSS-name-submit");
    nameLabel.innerText = "Snippet Name";
    nameContainer.appendChild(nameLabel);

    const nameInput = document.createElement("input");
    nameInput.id = "marketplace-customCSS-name-submit";
    nameInput.name = "marketplace-customCSS-name-submit";
    nameInput.placeholder = "Enter a name for your custom snippet.";
    nameContainer.appendChild(nameInput);

    // Description section =====
    const descriptionContainer = document.createElement("div");
    descriptionContainer.className = "marketplace-customCSS-input-container";

    const descriptionLabel = document.createElement("label");
    descriptionLabel.setAttribute("for", "marketplace-customCSS-description-submit");
    descriptionLabel.innerText = "Snippet Description";
    descriptionContainer.appendChild(descriptionLabel);

    const descriptionInput = document.createElement("input");
    descriptionInput.id = "marketplace-customCSS-description-submit";
    descriptionInput.name = "marketplace-customCSS-description-submit";
    descriptionInput.placeholder = "Enter a description for your custom snippet.";
    descriptionContainer.appendChild(descriptionInput);

    // Submit button =====
    const submitBtn = document.createElement("button");
    submitBtn.className = "main-buttons-button main-button-secondary";
    submitBtn.id = "marketplace-customCSS-submit";
    submitBtn.innerText = "Save CSS";
    submitBtn.addEventListener("click", function(event) {
        event.preventDefault();

        // @ts-ignore
        const code = textArea.value.replace(/\n/g, "");
        // @ts-ignore
        const name = nameInput.value.replace(/\n/g, "");
        const description = descriptionInput.value.trim();
        const localStorageKey = `marketplace:installed:snippet:${name}`;
        if (getLocalStorageDataFromKey(localStorageKey)) {
            alert("That name is already taken!");
            return;
        }

        console.log(`Installing snippet: ${name}`);
        localStorage.setItem(localStorageKey, JSON.stringify({
            code,
            description,
            title: name,
        }));

        // Add to installed list if not there already
        const installedSnippetKeys = getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.installedSnippets, []);
        if (installedSnippetKeys.indexOf(localStorageKey) === -1) {
            installedSnippetKeys.push(localStorageKey);
            localStorage.setItem(LOCALSTORAGE_KEYS.installedSnippets, JSON.stringify(installedSnippetKeys));
        }
        const installedSnippets = installedSnippetKeys.map((key) => getLocalStorageDataFromKey(key));
        initializeSnippets(installedSnippets);

        Spicetify.PopupModal.hide();
    }, false);

    addSnippetContainer.append(
        codeContainer,
        nameContainer,
        descriptionContainer,
        submitBtn,
    );

    triggerModal();
}
