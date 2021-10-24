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
        CONFIG.tabs.forEach((name, index) => {
            const el = CONFIG.tabsElement[name];

            const [ up, down ] = el.querySelectorAll("button");
            if (CONFIG.tabs.length === 1) {
                up.disabled = true;
                down.disabled = true;
            } else if (index === 0) {
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
        const curPos = CONFIG.tabs.findIndex((val) => val === id);
        const newPos = curPos + dir;

        if (CONFIG.tabs.length > 1) {
            const temp = CONFIG.tabs[newPos];
            CONFIG.tabs[newPos] = CONFIG.tabs[curPos];
            CONFIG.tabs[curPos] = temp;
        }

        localStorage.setItem(
            LOCALSTORAGE_KEYS.tabs,
            JSON.stringify(CONFIG.tabs),
        );

        stackTabElements();
    }

    // TODO: change this to just be a toggle switch for showing the tab or not
    function removeCallback(removeBtn) {

        // This is from before:

        // const id = el.dataset.id;
        // CONFIG.tabs = CONFIG.tabs.filter(s => s != id);
        // CONFIG.tabsElement[id].remove();

        // localStorage.setItem(LOCALSTORAGE_KEYS.tabs, JSON.stringify(CONFIG.tabs));

        // stackTabElements();

        // --------------------------------------------------

        // This is from `createSlider`:

        // const state = !slider.classList.toggle("disabled");
        // CONFIG.visual[key] = state;
        // localStorage.setItem(`marketplace:${key}`, String(state));
        // gridUpdatePostsVisual && gridUpdatePostsVisual();
    }

    CONFIG.tabs.forEach(name => {
        CONFIG.tabsElement[name] = createTabOption(
            name,
            posCallback,
            removeCallback,
        );
    });
    stackTabElements();

    configContainer.append(
        optionHeader,
        createSlider("Stars count", "stars"),
        createSlider("Hide installed in Marketplace", "hideInstalled"),
        createSlider("Followers count", "followers"),
        createSlider("Post type", "type"),
        createSlider("Long description", "longDescription"),
        tabsHeader,
        tabsContainer,
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

function createTabOption(id, posCallback, removeCallback) {
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
            <button class="switch small">
                <svg height="10" width="10" viewBox="0 0 16 16" fill="currentColor">
                    ${Spicetify.SVGIcons["x"]}
                </svg>
            </button>
        </div>
    </div>`;

    const [ up, down, remove ] = container.querySelectorAll("button");

    up.onclick = () => posCallback(container, -1);
    down.onclick = () => posCallback(container, 1);
    remove.onclick = () => removeCallback(remove);

    return container;
}
