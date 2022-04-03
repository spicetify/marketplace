let configContainer;

// eslint-disable-next-line no-unused-vars, no-redeclare
function openConfig() {
    const triggerModal = () => {
        Spicetify.PopupModal.display({
            title: "Marketplace",
            content: configContainer,
            isLarge: true,
        });
    };

    if (configContainer) {
        triggerModal();
        return;
    }

    CONFIG.tabsElement = {};

    const optionHeader = document.createElement("h2");
    optionHeader.innerText = "Options";

    const tabsHeader = document.createElement("h2");
    tabsHeader.innerText = "Tabs";

    const tabsContainer = document.createElement("div");

    function stackTabElements() {
        CONFIG.tabs.forEach(({ name }, index) => {
            const el = CONFIG.tabsElement[name];

            const [ up, down ] = el.querySelectorAll("button");
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
        const slider = el.querySelector("input[type='checkbox']");

        // If we're removing the tab, it's not in the enabled tabs list
        const toRemove = !slider.checked;
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
    configContainer = document.createElement("div");
    configContainer.id = "marketplace-config-container";

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
    resetBtn.onclick = resetMarketplace; // in Utils.js

    configContainer.append(
        optionHeader,
        createToggle("Stars count", "stars"),
        createToggle("Tags", "tags"),
        createToggle("Hide installed in Marketplace", "hideInstalled"),
        createToggle("Shift Colors Every Minute", "colorShift"),
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
        closeButton.setAttribute("style", "cursor: pointer;");
        modalOverlay.onclick = (e) => {
            // If clicked on overlay, also reload
            if (e.target === modalOverlay) {
                location.reload();
            }
        };
    }
}

// Generate the DOM markup for a toggle switch
function renderToggle(enabled, classes) {
    return `
    <label class="x-toggle-wrapper ${classes ? classes.join(" "): ""}">
        <input class="x-toggle-input" type="checkbox" ${enabled ? "checked" : ""}>
        <span class="x-toggle-indicatorWrapper">
            <span class="x-toggle-indicator"></span>
        </span>
    </label>
    `;
}

function createToggle(name, key) {
    const container = document.createElement("div");
    container.innerHTML = `
    <div class="setting-row">
        <label class="col description">${name}</label>
        <div class="col action">
            ${renderToggle(!!CONFIG.visual[key])}
        </div>
    </div>`;

    const slider = container.querySelector("input");

    slider.onchange = () => {
        const state = slider.checked;
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
            <button class="arrow-btn">
                <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor">
                    ${Spicetify.SVGIcons["chart-up"]}
                </svg>
            </button>
            <button class="arrow-btn">
                <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor">
                    ${Spicetify.SVGIcons["chart-down"]}
                </svg>
            </button>
            ${renderToggle(tabEnabled, id === "Extensions" ? ["disabled"] : [])}
        </div>
    </div>`;

    const [ up, down ] = container.querySelectorAll("button");
    const toggle = container.querySelector("input");

    up.onclick = () => posCallback(container, -1);
    down.onclick = () => posCallback(container, 1);
    toggle.onchange = () => toggleCallback(container);

    return container;
}
