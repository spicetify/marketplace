(function () {
    "use strict";

    const EXT_NAME   = "QueueRepeat";
    const INIT_DELAY = 3500;

    let isActive             = false;
    let repeatList           = [];
    let previousTrackUri     = null;
    let queueWatcherInterval = null;
    let buttonElement        = null;
    let isPolling            = false;

    function log(msg, level = "log") {
        console[level](`[${EXT_NAME}] ${msg}`);
    }

    function waitForSpicetify() {
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                if (
                    Spicetify?.Platform?.PlayerAPI?.getQueue &&
                    Spicetify?.Platform?.PlayerAPI?.addToQueue &&
                    Spicetify?.Player?.addEventListener &&
                    Spicetify?.Player?.data !== undefined
                ) {
                    clearInterval(interval);
                    resolve();
                }
            }, 300);
        });
    }

    function getCurrentTrackUri() {
        const d = Spicetify.Player.data;
        return d?.item?.uri ?? d?.track?.uri ?? null;
    }

    async function getAllQueueTracks() {
        try {
            const q = await Spicetify.Platform.PlayerAPI.getQueue();
            log("Queue raw: " + JSON.stringify(q).slice(0, 200));

            const queued     = q?.queued     ?? [];
            const nextTracks = q?.nextTracks ?? [];

            const extractUri = (item) =>
                item?.contextTrack?.uri ??
                item?.track?.uri        ??
                item?.uri               ??
                null;

            const queuedUris    = queued.map(extractUri).filter(Boolean);
            const nextTrackUris = nextTracks.map(extractUri).filter(Boolean);

            const seen   = new Set();
            const result = [];
            for (const uri of [...queuedUris, ...nextTrackUris]) {
                if (!seen.has(uri)) {
                    seen.add(uri);
                    result.push(uri);
                }
            }

            return result;
        } catch (err) {
            log(`Failed to get queue: ${err}`, "warn");
            return [];
        }
    }

    async function enableQueueRepeat() {
        const currentUri  = getCurrentTrackUri();
        const queueTracks = await getAllQueueTracks();

        const seen = new Set();
        repeatList = [];

        if (currentUri) {
            seen.add(currentUri);
            repeatList.push(currentUri);
        }
        for (const uri of queueTracks) {
            if (!seen.has(uri)) {
                seen.add(uri);
                repeatList.push(uri);
            }
        }

        previousTrackUri = currentUri;
        isActive         = true;

        updateButtonVisual(true);

        log(`Queue Repeat on. ${repeatList.length} track(s) in repeat list.`);
        for (const [i, uri] of repeatList.entries()) {
            log(`  [${i + 1}] ${uri}`);
        }

        startQueueWatcher();

        Spicetify.showNotification(
            `Queue Repeat on (${repeatList.length} tracks)`,
            false,
            2200
        );
    }

    function disableQueueRepeat() {
        isActive         = false;
        repeatList       = [];
        previousTrackUri = null;

        stopQueueWatcher();
        updateButtonVisual(false);

        log("Queue Repeat off.");
        Spicetify.showNotification("Queue Repeat off", false, 1800);
    }

    async function pollForNewQueueTracks() {
        if (!isActive || isPolling) return;

        isPolling = true;
        try {
            const currentQueueUris = await getAllQueueTracks();
            const repeatSet        = new Set(repeatList);
            const newUris          = currentQueueUris.filter(uri => !repeatSet.has(uri));

            if (newUris.length > 0) {
                repeatList.push(...newUris);
                log(`${newUris.length} new track(s) added to repeat list.`);
                for (const uri of newUris) {
                    log(`  + ${uri}`);
                }
                Spicetify.showNotification(
                    `Queue Repeat: ${newUris.length} new track(s) added`,
                    false,
                    1800
                );
            }
        } catch (err) {
            log(`Queue watcher error: ${err}`, "warn");
        } finally {
            isPolling = false;
        }
    }
    function startQueueWatcher() {
        stopQueueWatcher();
        queueWatcherInterval = setInterval(pollForNewQueueTracks, 2000);
        log("Queue watcher started (2s interval).");
    }

    function stopQueueWatcher() {
        if (queueWatcherInterval !== null) {
            clearInterval(queueWatcherInterval);
            queueWatcherInterval = null;
            log("Queue watcher stopped.");
        }
    }

    async function toggleQueueRepeat() {
        if (isActive) {
            disableQueueRepeat();
        } else {
            await enableQueueRepeat();
        }
    }

    async function onSongChange() {
        if (!isActive) return;

        const newUri = getCurrentTrackUri();
        log(`Song change: [${previousTrackUri}] -> [${newUri}]`);

        if (previousTrackUri && repeatList.includes(previousTrackUri)) {
            log(`Re-queuing: ${previousTrackUri}`);
            try {
                await Spicetify.addToQueue([{ uri: previousTrackUri }]);
                log("Re-queued.");
            } catch (err) {
                log(`Failed to re-queue: ${err}`, "error");
            }
        } else if (previousTrackUri) {
            log(`Not in repeat list, skipped: ${previousTrackUri}`);
        }

        previousTrackUri = newUri;
    }

    function injectStyles() {
        if (document.getElementById("qr-styles")) return;

        const s = document.createElement("style");
        s.id = "qr-styles";
        s.textContent = `
            .qr-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 32px;
                height: 32px;
                padding: 0;
                margin: 0 4px;
                border: none;
                border-radius: 50%;
                background: transparent;
                cursor: pointer;
                color: var(--spice-subtext, #b3b3b3);
                opacity: 0.7;
                transition: color 0.2s, opacity 0.2s, transform 0.15s;
                position: relative;
                vertical-align: middle;
                flex-shrink: 0;
            }
            .qr-btn:hover {
                color: var(--spice-text, #fff);
                opacity: 1;
                transform: scale(1.12);
            }
            .qr-btn:active {
                transform: scale(0.93);
            }
            .qr-btn.qr-active {
                color: var(--spice-button-active, #1db954) !important;
                opacity: 1 !important;
            }
            .qr-btn.qr-active::after {
                content: '';
                position: absolute;
                bottom: 2px;
                left: 50%;
                transform: translateX(-50%);
                width: 4px;
                height: 4px;
                border-radius: 50%;
                background: var(--spice-button-active, #1db954);
            }
            .qr-btn svg {
                pointer-events: none;
            }
        `;
        document.head.appendChild(s);
    }

    const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M0 4.75A3.75 3.75 0 0 1 3.75 1h.75v1.5h-.75A2.25 2.25 0 0 0 1.5 4.75v5A2.25 2.25 0 0 0 3.75 12H5v1.5H3.75A3.75 3.75 0 0 1 0 9.75v-5Z"/>
        <path d="M12.25 2.5h-.75V1h.75A3.75 3.75 0 0 1 16 4.75v5A3.75 3.75 0 0 1 12.25 13.5H11V12h1.25A2.25 2.25 0 0 0 14.5 9.75v-5A2.25 2.25 0 0 0 12.25 2.5Z"/>
        <path d="M8 3.5a.75.75 0 0 1 .75.75v3.19l1.72-1.72a.75.75 0 1 1 1.06 1.06L8.53 9.78a.75.75 0 0 1-1.06 0L4.47 6.78a.75.75 0 0 1 1.06-1.06L7.25 7.44V4.25A.75.75 0 0 1 8 3.5Z"/>
    </svg>`;

    function updateButtonVisual(active) {
        if (!buttonElement) return;
        if (active) {
            buttonElement.classList.add("qr-active");
            buttonElement.title = "Queue Repeat: on (click to disable)";
        } else {
            buttonElement.classList.remove("qr-active");
            buttonElement.title = "Queue Repeat: off (click to enable)";
        }
    }

    function makeButton() {
        const btn = document.createElement("button");
        btn.className = "qr-btn";
        btn.innerHTML = ICON_SVG;
        btn.title     = "Queue Repeat: off (click to enable)";
        btn.setAttribute("aria-label", "Queue Repeat");
        btn.addEventListener("click", async () => {
            await toggleQueueRepeat();
        });
        return btn;
    }

    function findLyricsButton() {
        const QUICK = [
            "[data-testid='lyrics-button']",
            "[aria-label='Lyrics']",
            "[aria-label='lyrics']",
            ".main-lyricsButton-button",
            "[class*='lyricsButton']",
            "[class*='LyricsButton']",
        ];
        for (const sel of QUICK) {
            const el = document.querySelector(sel);
            if (el) {
                log(`Lyrics button found via selector: "${sel}"`);
                return el;
            }
        }

        const allButtons = document.querySelectorAll("button");
        for (const btn of allButtons) {
            const label  = (btn.getAttribute("aria-label") || "").toLowerCase();
            const title  = (btn.getAttribute("title")      || "").toLowerCase();
            const cls    = (btn.className?.toString()       || "").toLowerCase();
            const testid = (btn.getAttribute("data-testid") || "").toLowerCase();

            if (label.includes("lyric") || title.includes("lyric") ||
                cls.includes("lyric")   || testid.includes("lyric")) {
                log(`Lyrics button found via scan: aria-label="${btn.getAttribute("aria-label")}" class="${btn.className?.toString().slice(0, 40)}"`);
                return btn;
            }
        }

        return null;
    }

    function injectButton() {
        if (document.body.contains(buttonElement) && buttonElement) return true;
        if (document.querySelector(".qr-btn")) {
            buttonElement = document.querySelector(".qr-btn");
            return true;
        }

        const btn       = makeButton();
        const lyricsBtn = findLyricsButton();

        if (lyricsBtn) {
            lyricsBtn.parentNode.insertBefore(btn, lyricsBtn);
            buttonElement = btn;
            log("Button injected: left of Lyrics button.");
            return true;
        }

        log("Lyrics button not found, trying right-side container.", "warn");

        const CONTAINER_SELECTORS = [
            "[data-testid='right-side']",
            "[data-testid='right-panel']",
            ".main-nowPlayingBar-right",
            ".player-controls__right",
            ".ExtraControls",
            "[class*='extraControls']",
            "[class*='TrailingControls']",
            "[class*='trailingControls']",
            "[class*='nowPlayingBar'] [class*='right']",
        ];

        let container = null;
        for (const sel of CONTAINER_SELECTORS) {
            const el = document.querySelector(sel);
            if (el) {
                container = el;
                log(`Container found: "${sel}"`);
                break;
            }
        }

        if (!container) {
            const footer = document.querySelector("footer");
            if (footer) {
                const kids = [...footer.children];
                container  = kids[kids.length - 1] || footer;
                log(`Footer fallback: ${container.className?.toString().slice(0, 50) || container.tagName}`);
            }
        }

        if (!container) {
            log("No container found. Button not injected.", "warn");
            return false;
        }

        container.append(btn);
        buttonElement = btn;
        log(`Button injected into: ${container.className?.toString().slice(0, 60) || container.tagName}`);
        return true;
    }

    function setupButton() {
        if (injectButton()) {
            watchButtonRemoval();
            return;
        }

        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            if (injectButton()) {
                clearInterval(interval);
                watchButtonRemoval();
            } else if (attempts >= 20) {
                clearInterval(interval);
                log("Button container not found after 20 attempts.", "warn");
            }
        }, 1000);
    }

    function watchButtonRemoval() {
        const observer = new MutationObserver(() => {
            if (buttonElement && !document.contains(buttonElement)) {
                log("Button removed from DOM, re-injecting...");
                buttonElement = null;
                setTimeout(() => {
                    if (!buttonElement) injectButton();
                }, 500);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    async function init() {
        log("Waiting for Spicetify API...");
        await waitForSpicetify();
        log("API ready.");

        injectStyles();
        setupButton();

        Spicetify.Player.addEventListener("songchange", onSongChange);
        log("Ready. Add tracks to queue, then press the Queue Repeat button.");
    }

    setTimeout(init, INIT_DELAY);

})();
