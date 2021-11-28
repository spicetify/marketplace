let configContainer;

// eslint-disable-next-line no-unused-vars, no-redeclare
function openConfig() {
    const triggerModal = () => {
        Spicetify.PopupModal.display({
            title: "Spicetify Marketplace",
            content: configContainer,
            isLarge: true,
        });
    };

    if (configContainer) {
        triggerModal();
        return;
    }

    CONFIG.tabsElement = {};

    configContainer = document.createElement("div");
    configContainer.id = "marketplace-config-container";

    const optionHeader = document.createElement("h2");
    optionHeader.innerText = "Options";

    const tabsHeader = document.createElement("h2");
    tabsHeader.innerText = "Tabs";

    const tabsContainer = document.createElement("div");

    function stackTabElements() {

        CONFIG.tabs.forEach(({ name, enabled }, index) => {
            const el = CONFIG.tabsElement[name];

            const [ up, down, remove ] = el.querySelectorAll("button");
            if (index === 0) {
                up.disabled = true;
                down.disabled = false;
            } else if (index === (CONFIG.tabs.length - 1)) {
                up.disabled = false;
                down.disabled = true;
            } else {
                up.disabled = false;
                down.disabled = false;
            }

            // Set the icon (can't use innerHTML because of SVG)
            remove.querySelector("svg path").setAttribute("d", enabled ?
                SpicetifySVGIconPaths["x"]
                : SpicetifySVGIconPaths["check"]);

            // TODO: do something with the icon here
            // remove.innerHTML = `
            //     <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor">
            //         ${enabled ? Spicetify.SVGIcons["check"] : Spicetify.SVGIcons["x"]}
            //     </svg>`;

            tabsContainer.append(el);
        });

        gridUpdateTabs && gridUpdateTabs();
    }

    function posCallback(el, dir) {
        const id = el.dataset.id;
        const curPos = CONFIG.tabs.findIndex(({ name }) => name === id);
        const newPos = curPos + dir;

        const temp = CONFIG.tabs[newPos];
        CONFIG.tabs[newPos] = CONFIG.tabs[curPos];
        CONFIG.tabs[curPos] = temp;

        localStorage.setItem(
            LOCALSTORAGE_KEYS.tabs,
            JSON.stringify(CONFIG.tabs),
        );

        stackTabElements();
    }

    function toggleCallback(el) {

        const id = el.dataset.id;
        const slider = el.querySelector(".switch--tab-toggle");

        // If we're removing the tab, it's not in the enabled tabs list
        const toRemove = slider.classList.toggle("disabled");
        const tabItem = CONFIG.tabs.filter(({ name }) => name === id)[0];

        // Enable/disable tab
        tabItem.enabled = !toRemove;

        // Always "remove" because it re-adds it with the right settings/order in stackTabElements()
        CONFIG.tabsElement[id].remove();

        // Persist the new enabled tabs
        localStorage.setItem(LOCALSTORAGE_KEYS.tabs, JSON.stringify(CONFIG.tabs));

        // Refresh
        stackTabElements();
    }

    // Create the tabs settings DOM elements
    CONFIG.tabs.forEach(({ name }) => {
        CONFIG.tabsElement[name] = createTabOption(
            name,
            posCallback,
            toggleCallback,
        );
    });
    stackTabElements();

    // Reset Marketplace section
    const resetHeader = document.createElement("h2");
    resetHeader.innerText = "Reset Marketplace";
    const resetContainer = document.createElement("div");
    resetContainer.innerHTML = `
    <div class="setting-row">
        <label class="col description">Uninstall all extensions and themes, and reset preferences</label>
        <div class="col action">
            <button class="main-buttons-button main-button-secondary">Reset</button>
        </div>
    </div>`;
    const resetBtn = resetContainer.querySelector("button");
    resetBtn.onclick = () => {
        console.log("Resetting Marketplace");

        // Loop through and reset marketplace keys
        Object.keys(localStorage).forEach((key) => {
            if (key.startsWith("marketplace:")) {
                localStorage.removeItem(key);
                console.log(`Removed ${key}`);
            }
        });

        console.log("Marketplace has been reset");
        location.reload();
    };

    configContainer.append(
        optionHeader,
        createSlider("Stars count", "stars"),
        createSlider("Hide installed in Marketplace", "hideInstalled"),
        // TODO: add these features maybe?
        // createSlider("Followers count", "followers"),
        // createSlider("Post type", "type"),
        tabsHeader,
        tabsContainer,
        resetHeader,
        resetContainer,
    );

    triggerModal();

    const closeButton = document.querySelector("body > generic-modal button.main-trackCreditsModal-closeBtn");
    const modalOverlay = document.querySelector("body > generic-modal > div");
    if (closeButton instanceof HTMLElement
    && modalOverlay instanceof HTMLElement) {
        closeButton.onclick = () => location.reload();
        modalOverlay.onclick = (e) => {
            // If clicked on overlay, also reload
            if (e.target === modalOverlay) {
                location.reload();
            }
        };
    }
}

function createSlider(name, key) {
    const container = document.createElement("div");
    container.innerHTML = `
    <div class="setting-row">
        <label class="col description">${name}</label>
        <div class="col action"><button class="switch">
            <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor">
                ${Spicetify.SVGIcons.check}
            </svg>
        </button></div>
    </div>`;

    const slider = container.querySelector("button");
    slider.classList.toggle("disabled", !CONFIG.visual[key]);
    slider.onclick = () => {
        const state = !slider.classList.toggle("disabled");
        CONFIG.visual[key] = state;
        localStorage.setItem(`marketplace:${key}`, String(state));
        gridUpdatePostsVisual && gridUpdatePostsVisual();
    };

    return container;
}

function createTabOption(id, posCallback, toggleCallback) {
    const tabItem = CONFIG.tabs.filter(({ name }) => name === id)[0];
    const tabEnabled = tabItem.enabled;

    const container = document.createElement("div");
    container.dataset.id = id;
    container.innerHTML = `
    <div class="setting-row">
        <h3 class="col description">${id}</h3>
        <div class="col action">
            <button class="switch small">
                <svg height="10" width="10" viewBox="0 0 16 16" fill="currentColor">
                    ${Spicetify.SVGIcons["chart-up"]}
                </svg>
            </button>
            <button class="switch small">
                <svg height="10" width="10" viewBox="0 0 16 16" fill="currentColor">
                    ${Spicetify.SVGIcons["chart-down"]}
                </svg>
            </button>
            <button class="switch switch--tab-toggle ${!tabEnabled ? "disabled" : ""}"
                ${id === "Extensions" ? "disabled" : ""}>
                <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor">
                    ${tabEnabled ? Spicetify.SVGIcons["check"] : Spicetify.SVGIcons["x"]}
                </svg>
            </button>
        </div>
    </div>`;

    const [ up, down, remove ] = container.querySelectorAll("button");

    up.onclick = () => posCallback(container, -1);
    down.onclick = () => posCallback(container, 1);
    remove.onclick = () => toggleCallback(container);

    return container;
}
