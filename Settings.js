let configContainer;

// eslint-disable-next-line no-unused-vars, no-redeclare
function openConfig() {
    if (configContainer) {
        Spicetify.PopupModal.display({
            title: "Spicetify Marketplace",
            content: configContainer,
        });
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
        ALL_TABS.forEach((name, index) => {
        // CONFIG.enabledTabs.forEach((name, index) => {
            const el = CONFIG.tabsElement[name];

            const [ up, down ] = el.querySelectorAll("button");
            if (CONFIG.enabledTabs.length === 1) {
                up.disabled = true;
                down.disabled = true;
            } else if (index === 0) {
                up.disabled = true;
                down.disabled = false;
            } else if (index === (CONFIG.enabledTabs.length - 1)) {
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
        const curPos = CONFIG.enabledTabs.findIndex((val) => val === id);
        const newPos = curPos + dir;

        if (CONFIG.enabledTabs.length > 1) {
            const temp = CONFIG.enabledTabs[newPos];
            CONFIG.enabledTabs[newPos] = CONFIG.enabledTabs[curPos];
            CONFIG.enabledTabs[curPos] = temp;
        }

        localStorage.setItem(
            LOCALSTORAGE_KEYS.tabs,
            JSON.stringify(CONFIG.enabledTabs),
        );

        stackTabElements();
    }

    function toggleCallback(el) {

        const id = el.dataset.id;
        const slider = el.querySelector("button:last-child");

        // If we're removing the tab, it's not in the enabled tabs list
        const toRemove = slider.classList.toggle("disabled");

        if (toRemove) {
            // Remove tab
            CONFIG.enabledTabs = CONFIG.enabledTabs.filter(s => s != id);
            CONFIG.tabsElement[id].remove();
        } else {
            // Add tab
            CONFIG.enabledTabs.push(id);
        }

        // Persist the new enabled tabs
        localStorage.setItem(LOCALSTORAGE_KEYS.tabs, JSON.stringify(CONFIG.enabledTabs));

        // Refresh
        stackTabElements();
    }

    ALL_TABS.forEach(name => {
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
        <label class="col description">Uninstall all extensions and reset preferences</label>
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

    Spicetify.PopupModal.display({
        title: "Marketplace",
        content: configContainer,
    });
    const closeButton = document.querySelector("body > generic-modal > div > div > div > div.main-trackCreditsModal-header > button");
    closeButton.setAttribute("onclick", "location.reload()");
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
            <button class="switch">
                <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor">
                    ${Spicetify.SVGIcons["x"]}
                </svg>
            </button>
        </div>
    </div>`;

    const [ up, down, remove ] = container.querySelectorAll("button");

    remove.classList.toggle("disabled", !CONFIG.enabledTabs.includes(id));

    up.onclick = () => posCallback(container, -1);
    down.onclick = () => posCallback(container, 1);
    remove.onclick = () => toggleCallback(container);

    return container;
}
