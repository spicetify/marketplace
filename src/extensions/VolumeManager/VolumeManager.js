(async function VolumeManager() {
    if (!Spicetify.Player || !Spicetify.PopupModal || !Spicetify.showNotification) {
        setTimeout(VolumeManager, 500);
        return;
    }

    const CONFIG_KEY = "spicetify_volume_manager";
    let config = JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}');

    if (!config.presets) config.presets = [];
    if (!config.songVolumes) config.songVolumes = {};
    if (typeof config.showNotifications === 'undefined') config.showNotifications = true;
    if (typeof config.iconSize === 'undefined') config.iconSize = 16;
    if (typeof config.guiOpacity === 'undefined') config.guiOpacity = 0.85;
    if (typeof config.guiBlur === 'undefined') config.guiBlur = 15;
    if (typeof config.lastGenericVolume === 'undefined') config.lastGenericVolume = Spicetify.Player.getVolume();
    
    if (typeof config.buttonPosition !== 'undefined') delete config.buttonPosition;
    if (typeof config.guiTheme !== 'undefined') delete config.guiTheme;

    if (config.presets && !Array.isArray(config.presets)) {
        const migratedPresets = [];
        for (const [name, vol] of Object.entries(config.presets)) {
            migratedPresets.push({ name, vol });
        }
        config.presets = migratedPresets;
    }
    
    saveConfig();

    function saveConfig() {
        localStorage.setItem(CONFIG_KEY, JSON.stringify(config, null, 2));
    }

    function notify(msg) {
        if (config.showNotifications) {
            Spicetify.showNotification(msg);
        }
    }

    function getCurrentTrack() {
        return Spicetify.Player.data?.item || Spicetify.Player.data?.track || null;
    }

    function normalizeUri(uri) {
        if (!uri) return "";
        if (uri.startsWith("spotify:local:")) {
            const parts = uri.split(":");
            if (parts.length >= 6) {
                return parts.slice(0, 5).join(":"); 
            }
        }
        return uri;
    }

    function isLocalUri(uri) {
        return typeof uri === 'string' && uri.startsWith("spotify:local:");
    }

    function getSavedVolume(uri) {
        if (!uri) return -1;
        const norm = normalizeUri(uri);
        if (config.songVolumes[norm] !== undefined) return config.songVolumes[norm];
        if (config.songVolumes[uri] !== undefined) return config.songVolumes[uri];
        return -1;
    }

    function setSavedVolume(uri, vol) {
        if (!uri) return;
        const norm = normalizeUri(uri);
        config.songVolumes[norm] = vol;
        saveConfig();
    }

    function deleteSavedVolume(uri) {
        if (!uri) return;
        const norm = normalizeUri(uri);
        delete config.songVolumes[norm];
        delete config.songVolumes[uri]; 
        saveConfig();
    }

    function getCurrentUri() {
        const track = getCurrentTrack();
        return track ? track.uri : "";
    }

    const style = document.createElement("style");
    style.innerHTML = `
        body.volume-manager-locked [data-testid="volume-bar"] > div:not(button):not(#vol-mgr-locked-overlay),
        body.volume-manager-locked .volume-bar > div:not(button):not(#vol-mgr-locked-overlay),
        body.volume-manager-locked .x-progressBar-progressBar {
            pointer-events: none !important;
            opacity: 0.3 !important;
            filter: grayscale(100%) !important;
        }
    `;
    document.head.appendChild(style);

    let lastGenericVolume = config.lastGenericVolume;
    let expectedVolume = -1; 
    let enforceNotifyThrottle = false;
    let isCurrentlyCustom = false; 
    
    let fadeInterval = null;
    let isFadingUnlock = false;

    let isAutomatedVolumeChangeActive = false;
    let automatedVolumeChangeCooldownTimeout = null;

    function startAutomatedVolumeChange() {
        isAutomatedVolumeChangeActive = true;
        clearTimeout(automatedVolumeChangeCooldownTimeout);
    }

    function endAutomatedVolumeChange() {
        clearTimeout(automatedVolumeChangeCooldownTimeout);
        automatedVolumeChangeCooldownTimeout = setTimeout(() => {
            isAutomatedVolumeChangeActive = false;
            isFadingUnlock = false;
        }, 350);
    }

    function applyTargetVolume(targetVol, isUnlock = false, instant = false) {
        clearInterval(fadeInterval);
        startAutomatedVolumeChange();
        
        isFadingUnlock = isUnlock;
        targetVol = Math.max(0, Math.min(1, targetVol));
        let currentVol = Spicetify.Player.getVolume();

        if (currentVol === 0) {
            expectedVolume = isUnlock ? -1 : targetVol;
            isCurrentlyCustom = !isUnlock;
            endAutomatedVolumeChange();
            return; 
        }

        const isBackground = document.hidden || !document.hasFocus();
        if (isBackground || instant || Math.abs(currentVol - targetVol) < 0.01) {
            expectedVolume = isUnlock ? -1 : targetVol;
            isCurrentlyCustom = !isUnlock;
            Spicetify.Player.setVolume(targetVol); 
            endAutomatedVolumeChange();
            return;
        }

        const steps = 12;
        const stepTime = 12; 
        const diff = targetVol - currentVol;
        const stepVol = diff / steps;
        let step = 0;
        
        if (isUnlock) {
            expectedVolume = -1; 
            isCurrentlyCustom = false;
        } else {
            isCurrentlyCustom = true;
        }

        fadeInterval = setInterval(() => {
            step++;
            let v = currentVol + (stepVol * step);
            
            if (step >= steps) {
                v = targetVol;
                clearInterval(fadeInterval);
                
                if (!isUnlock) expectedVolume = targetVol;
                
                Spicetify.Player.setVolume(v);
                endAutomatedVolumeChange();
            } else {
                if (!isUnlock) expectedVolume = v; 
                
                if (origPlaybackSetVolume && Spicetify.Platform?.PlaybackAPI) {
                    origPlaybackSetVolume.call(Spicetify.Platform.PlaybackAPI, v);
                } else if (origSpicetifySetVolume) {
                    origSpicetifySetVolume.call(Spicetify.Player, v);
                }
            }
        }, stepTime);
    }

    function throttleNotify() {
        if (!enforceNotifyThrottle) {
            enforceNotifyThrottle = true;
            notify("Custom volume locked! Delete to change volume.");
            setTimeout(() => { enforceNotifyThrottle = false; }, 2500);
        }
    }

    const origSpicetifySetVolume = Spicetify.Player.setVolume;
    Spicetify.Player.setVolume = function(vol) {
        if (expectedVolume !== -1) {
            if (vol === 0) return origSpicetifySetVolume.call(this, 0); 
            
            if (Math.abs(vol - expectedVolume) <= 0.001) {
                return origSpicetifySetVolume.call(this, expectedVolume);
            }

            throttleNotify(); 
            return origSpicetifySetVolume.call(this, expectedVolume);
        } else {
            if (!isAutomatedVolumeChangeActive && !isFadingUnlock) {
                lastGenericVolume = vol;
                config.lastGenericVolume = vol;
                saveConfig();
            }
            return origSpicetifySetVolume.call(this, vol);
        }
    };

    let origPlaybackSetVolume = null;
    if (Spicetify.Platform && Spicetify.Platform.PlaybackAPI && Spicetify.Platform.PlaybackAPI.setVolume) {
        origPlaybackSetVolume = Spicetify.Platform.PlaybackAPI.setVolume;
        Spicetify.Platform.PlaybackAPI.setVolume = function(vol) {
            if (expectedVolume !== -1) {
                if (vol === 0) return origPlaybackSetVolume.call(this, 0); 
                if (Math.abs(vol - expectedVolume) > 0.001) {
                    throttleNotify();
                    return origPlaybackSetVolume.call(this, expectedVolume);
                }
            }
            return origPlaybackSetVolume.call(this, vol);
        };
    }

    const initTrack = getCurrentTrack();
    if (initTrack && initTrack.uri) {
        const bootVol = getSavedVolume(initTrack.uri);
        if (bootVol !== -1) {
            applyTargetVolume(bootVol, false, isLocalUri(initTrack.uri));
        }
    }

    function preloadNextTrackVolume(isAuto = false) {
        if (!Spicetify.Queue || !Spicetify.Queue.nextTracks || Spicetify.Queue.nextTracks.length === 0) return;
        
        const nextTrack = Spicetify.Queue.nextTracks[0];
        const nextUri = nextTrack.uri || nextTrack.contextTrack?.uri;
        
        if (nextUri) {
            const isLocal = !isAuto && isLocalUri(nextUri); 
            const upcomingVol = getSavedVolume(nextUri);
            if (upcomingVol !== -1) {
                applyTargetVolume(upcomingVol, false, isLocal);
            } else if (expectedVolume !== -1 || isCurrentlyCustom) {
                applyTargetVolume(lastGenericVolume, true, isLocal);
            }
        }
    }

    if (Spicetify.Player && Spicetify.Player.next) {
        const origNext = Spicetify.Player.next;
        Spicetify.Player.next = function() {
            preloadNextTrackVolume(false); 
            if (origNext) return origNext.apply(this, arguments);
        };
    }
    
    if (Spicetify.Player && Spicetify.Player.back) {
        const origBack = Spicetify.Player.back;
        Spicetify.Player.back = function() {
            const progress = Spicetify.Player.getProgress();
            if (progress <= 3000 && Spicetify.Queue?.prevTracks?.length > 0) {
                const prevTrack = Spicetify.Queue.prevTracks[Spicetify.Queue.prevTracks.length - 1];
                const prevUri = prevTrack.uri || prevTrack.contextTrack?.uri;
                if (prevUri) {
                    const isLocal = isLocalUri(prevUri);
                    const prevVol = getSavedVolume(prevUri);
                    if (prevVol !== -1) {
                        applyTargetVolume(prevVol, false, isLocal);
                    } else if (expectedVolume !== -1 || isCurrentlyCustom) {
                        applyTargetVolume(lastGenericVolume, true, isLocal);
                    }
                }
            }
            if (origBack) return origBack.apply(this, arguments);
        };
    }

    Spicetify.Player.addEventListener("onplay", () => {
        const trackUri = getCurrentUri();
        if (trackUri) {
            const startVol = getSavedVolume(trackUri);
            if (startVol !== -1 && expectedVolume !== startVol) {
                applyTargetVolume(startVol, false, isLocalUri(trackUri));
            }
        }
    });

    let currentUri = getCurrentUri();

    function handleTrackChange(newUri) {
        if (!newUri) return;
        currentUri = newUri; 
        
        const savedVol = getSavedVolume(newUri);
        const isLocal = isLocalUri(newUri);

        if (savedVol !== -1) {
            applyTargetVolume(savedVol, false, isLocal);
            notify(`Custom Volume: ${Math.round(savedVol * 100)}% for this track.`);
        } else {
            if (expectedVolume !== -1 || isCurrentlyCustom) {
                applyTargetVolume(lastGenericVolume, true, isLocal);
                notify(`Restored base volume to ${Math.round(lastGenericVolume * 100)}%`);
            }
        }
        
        const hoverMenu = document.getElementById('volume-manager-hover-menu');
        if (hoverMenu && hoverMenu.style.display === "flex") {
            renderHoverMenu();
        }

        if (window.volMgrUpdateTrackUI) {
            window.volMgrUpdateTrackUI();
        }
    }

    Spicetify.Player.addEventListener("songchange", () => {
        const newUri = getCurrentUri();
        handleTrackChange(newUri);
    });

    Spicetify.Player.addEventListener("onprogress", () => {
        const duration = Spicetify.Player.getDuration();
        const progress = Spicetify.Player.getProgress();
        if (duration && progress && !isTransitioning) {
            const timeRemaining = duration - progress;
            if (timeRemaining > 0 && timeRemaining <= 1200) {
                isTransitioning = true;
                preloadNextTrackVolume(true);
                setTimeout(() => { isTransitioning = false; }, 2000);
            }
        }
    });

    let isTransitioning = false;
    setInterval(() => {
        if (expectedVolume !== -1) {
            if (!document.body.classList.contains("volume-manager-locked")) {
                document.body.classList.add("volume-manager-locked");
            }
            let volContainer = document.querySelector('[data-testid="volume-bar"]') || document.querySelector('.volume-bar');
            if (volContainer) {
                let overlay = document.getElementById("vol-mgr-locked-overlay");
                if (!overlay) {
                    overlay = document.createElement("div");
                    overlay.id = "vol-mgr-locked-overlay";
                    overlay.title = "Volume slider disabled: Custom track volume is active.\nDelete the custom volume from the menu to unlock.";
                    overlay.style.cssText = "position: absolute; top: 0; right: 0; bottom: 0; left: 35px; z-index: 999; cursor: not-allowed;";
                    volContainer.style.position = "relative";
                    volContainer.appendChild(overlay);
                }
            }
        } else {
            if (document.body.classList.contains("volume-manager-locked")) {
                document.body.classList.remove("volume-manager-locked");
            }
            let overlay = document.getElementById("vol-mgr-locked-overlay");
            if (overlay) overlay.remove();
        }

        const newUri = getCurrentUri();
        if (newUri && newUri !== currentUri) {
            handleTrackChange(newUri);
        } else if (Spicetify.Player.isPlaying()) {
            const duration = Spicetify.Player.getDuration();
            const progress = Spicetify.Player.getProgress();
            
            if (duration && progress) {
                const timeRemaining = duration - progress;
                if (timeRemaining > 0 && timeRemaining <= 1200 && !isTransitioning) {
                    isTransitioning = true; 
                    preloadNextTrackVolume(true); 
                    setTimeout(() => { isTransitioning = false; }, 2000); 
                }
            }
        }
    }, 250); 

    function attemptApplyPreset(preset) {
        const trackUri = getCurrentUri();
        if (trackUri && getSavedVolume(trackUri) !== -1) {
            notify("Cannot apply preset: This song has a custom volume! Delete it first.");
            return;
        }

        lastGenericVolume = preset.vol;
        config.lastGenericVolume = preset.vol;
        saveConfig();

        applyTargetVolume(preset.vol, true); 
        notify(`Preset applied: ${preset.name}`);
    }

    function openGUI() {
        const container = document.createElement("div");
        container.style.display = "flex";
        container.style.flexDirection = "column";
        container.style.gap = "20px";
        container.style.padding = "5px"; 

        let editingPresetIndex = -1;
        let deletingPresetIndex = -1;
        let clearAllConfirming = false;
        let resetAllConfirming = false;

        const btnStyle = "background: var(--spice-button, #1db954); color: var(--spice-text, #ffffff); border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-weight: bold; transition: all 0.2s;";
        const btnGroupStyle = "background: var(--spice-button, #1db954); color: var(--spice-text, #ffffff); border: none; border-left: 1px solid rgba(0,0,0,0.2); padding: 8px 10px; cursor: pointer; font-weight: bold; transition: all 0.2s;";
        const inputStyle = "background: rgba(var(--spice-rgb-selected-row), 0.1); color: var(--spice-text, #ffffff); border: 1px solid var(--spice-button, #1db954); padding: 8px; border-radius: 4px;";
        const hrStyle = "border: none; border-top: 1px solid rgba(255,255,255,0.15); margin: 0;";

        const jsonArea = document.createElement("textarea");
        jsonArea.title = "Raw JSON data of your settings. You can copy this for backup.";
        jsonArea.style.cssText = inputStyle + " width: 100%; height: 120px; font-family: monospace; resize: vertical; box-sizing: border-box;";
        jsonArea.readOnly = true; 
        
        const presetSection = document.createElement("div");
        const trackSection = document.createElement("div");
        
        function updateAllUI() {
            renderPresets();
            renderTrackSection();
            renderJsonControls();
            jsonArea.value = JSON.stringify(config, null, 2);
        }

        window.volMgrUpdateTrackUI = () => { renderTrackSection(); };

        const settingsSection = document.createElement("div");
        settingsSection.innerHTML = `
            <h3 style="margin-bottom: 12px; margin-top: 0; color: var(--spice-text);" title="General extension settings">General Settings</h3>
            <div style="display: flex; flex-direction: column; gap: 12px; background: rgba(255, 255, 255, 0.03); padding: 15px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.08);">
                
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 10px;" 
                     title="Enable Notifications">
                    <div>
                        <label style="color: var(--spice-text); font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" id="vol-notify-toggle" ${config.showNotifications ? "checked" : ""}>
                            Enable Notifications
                        </label>
                        <div style="color: var(--spice-subtext); font-size: 0.85em; margin-top: 3px;">Displays desktop reminders on volume actions.</div>
                    </div>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 10px;"
                     title="Playback Bar Icon Size">
                    <div>
                        <label style="color: var(--spice-text); font-weight: bold;">Playback Bar Icon Size (px)</label>
                        <div style="color: var(--spice-subtext); font-size: 0.85em; margin-top: 3px;">Adjusts the button width/height in the playbar.</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <input type="range" id="vol-btn-size-slider" min="12" max="32" value="${config.iconSize}" style="cursor: pointer;">
                        <input type="number" id="vol-btn-size" min="12" max="32" value="${config.iconSize}" style="${inputStyle} width: 60px; padding: 4px; text-align: center;">
                        <span style="color: var(--spice-text);">px</span>
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 10px;"
                     title="Hover Menu Opacity">
                    <div>
                        <label style="color: var(--spice-text); font-weight: bold;">Hover Menu Opacity (%)</label>
                        <div style="color: var(--spice-subtext); font-size: 0.85em; margin-top: 3px;">Set higher (e.g. 85-100%) to solve text readability on transparent themes.</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <input type="range" id="vol-gui-opacity-slider" min="0" max="100" value="${Math.round(config.guiOpacity * 100)}" style="cursor: pointer;">
                        <input type="number" id="vol-gui-opacity" min="0" max="100" value="${Math.round(config.guiOpacity * 100)}" style="${inputStyle} width: 60px; padding: 4px; text-align: center;">
                        <span style="color: var(--spice-text);">%</span>
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center;"
                     title="Hover Menu Frosted Blur">
                    <div>
                        <label style="color: var(--spice-text); font-weight: bold;">Hover Menu Frosted Blur (px)</label>
                        <div style="color: var(--spice-subtext); font-size: 0.85em; margin-top: 3px;">Adds an isolated background blur effect (frosted glass appearance) behind the hover menu.</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <input type="range" id="vol-gui-blur-slider" min="0" max="40" value="${config.guiBlur || 0}" style="cursor: pointer;">
                        <input type="number" id="vol-gui-blur" min="0" max="40" value="${config.guiBlur || 0}" style="${inputStyle} width: 60px; padding: 4px; text-align: center;">
                        <span style="color: var(--spice-text);">px</span>
                    </div>
                </div>

            </div>
        `;

        const notifyToggle = settingsSection.querySelector('#vol-notify-toggle');
        const btnSizeSlider = settingsSection.querySelector('#vol-btn-size-slider');
        const btnSizeNum = settingsSection.querySelector('#vol-btn-size');
        const opacitySlider = settingsSection.querySelector('#vol-gui-opacity-slider');
        const opacityNum = settingsSection.querySelector('#vol-gui-opacity');
        const blurSlider = settingsSection.querySelector('#vol-gui-blur-slider');
        const blurNum = settingsSection.querySelector('#vol-gui-blur');

        notifyToggle.onchange = (e) => {
            config.showNotifications = e.target.checked;
            saveConfig();
        };

        const syncSize = (val) => {
            config.iconSize = parseInt(val) || 16;
            btnSizeSlider.value = config.iconSize;
            btnSizeNum.value = config.iconSize;
            saveConfig();
            injectButton();
        };
        btnSizeSlider.oninput = (e) => syncSize(e.target.value);
        btnSizeNum.oninput = (e) => syncSize(e.target.value);

        const syncOpacity = (val) => {
            const parsed = parseInt(val);
            config.guiOpacity = isNaN(parsed) ? 0.85 : Math.max(0, Math.min(100, parsed)) / 100;
            opacitySlider.value = Math.round(config.guiOpacity * 100);
            opacityNum.value = Math.round(config.guiOpacity * 100);
            saveConfig();
        };
        opacitySlider.oninput = (e) => syncOpacity(e.target.value);
        opacityNum.oninput = (e) => syncOpacity(e.target.value);

        const syncBlur = (val) => {
            const parsed = parseInt(val);
            config.guiBlur = isNaN(parsed) ? 15 : Math.max(0, Math.min(40, parsed));
            blurSlider.value = config.guiBlur;
            blurNum.value = config.guiBlur;
            saveConfig();
        };
        blurSlider.oninput = (e) => syncBlur(e.target.value);
        blurNum.oninput = (e) => syncBlur(e.target.value);

        function renderPresets() {
            presetSection.innerHTML = "";

            const titleRow = document.createElement("div");
            titleRow.style.cssText = "display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;";
            
            const titleH3 = document.createElement("h3");
            titleH3.innerText = "Quick Presets";
            titleH3.style.margin = "0";
            titleH3.style.color = "var(--spice-text)";
            titleH3.title = "Save volume levels to quickly apply them later. Click on a preset to apply it.";
            titleRow.appendChild(titleH3);

            const clearBtn = document.createElement("button");
            clearBtn.title = "Delete all of your saved presets from local storage.";
            if (clearAllConfirming) {
                clearBtn.innerText = "⚠️ Confirm Clear All?";
                clearBtn.style.cssText = "background: #d32f2f; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.85em; font-weight: bold; animation: pulse 1s infinite;";
                clearBtn.onclick = (e) => {
                    e.stopPropagation();
                    config.presets = [];
                    saveConfig();
                    clearAllConfirming = false;
                    updateAllUI();
                    notify("All presets deleted.");
                };
                setTimeout(() => {
                    if (clearAllConfirming) {
                        clearAllConfirming = false;
                        updateAllUI();
                    }
                }, 4000);
            } else {
                clearBtn.innerText = "🗑️ Clear All";
                clearBtn.style.cssText = "background: rgba(226, 33, 52, 0.1); color: #e22134; border: 1px solid #e22134; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.85em; font-weight: bold;";
                clearBtn.onclick = (e) => {
                    e.stopPropagation();
                    clearAllConfirming = true;
                    updateAllUI();
                };
            }
            titleRow.appendChild(clearBtn);
            presetSection.appendChild(titleRow);

            const presetList = document.createElement("div");
            presetList.style.display = "flex";
            presetList.style.flexDirection = "column";
            presetList.style.gap = "8px";
            
            if (!config.presets || config.presets.length === 0) {
                presetList.innerHTML = `<span style="color: var(--spice-subtext);">No presets created yet. Use the fields below to add one!</span>`;
            }
            
            config.presets.forEach((preset, index) => {
                const wrapper = document.createElement("div");
                wrapper.style.display = "flex";
                wrapper.style.alignItems = "stretch";
                wrapper.style.gap = "4px";

                if (editingPresetIndex === index) {
                    const renameInput = document.createElement("input");
                    renameInput.type = "text";
                    renameInput.value = preset.name;
                    renameInput.style.cssText = inputStyle + " flex-grow: 1; padding: 4px 8px;";
                    renameInput.title = "Type a new name for this preset.";
                    
                    const saveBtn = document.createElement("button");
                    saveBtn.innerText = "✓ Save";
                    saveBtn.title = "Save the new preset name.";
                    saveBtn.style.cssText = btnStyle + " padding: 4px 12px; background: #2e7d32; color: white;";
                    saveBtn.onclick = (e) => {
                        e.stopPropagation();
                        const val = renameInput.value.trim();
                        if (val) {
                            preset.name = val;
                            saveConfig();
                        }
                        editingPresetIndex = -1;
                        updateAllUI();
                    };

                    const cancelBtn = document.createElement("button");
                    cancelBtn.innerText = "✗ Cancel";
                    cancelBtn.title = "Discard name change.";
                    cancelBtn.style.cssText = btnStyle + " padding: 4px 12px; background: #c62828; color: white;";
                    cancelBtn.onclick = (e) => {
                        e.stopPropagation();
                        editingPresetIndex = -1;
                        updateAllUI();
                    };

                    wrapper.appendChild(renameInput);
                    wrapper.appendChild(saveBtn);
                    wrapper.appendChild(cancelBtn);
                } else {
                    const btn = document.createElement("button");
                    btn.title = `Apply preset: ${preset.name} (${Math.round(preset.vol * 100)}%)`;
                    btn.style.cssText = btnStyle + " background: var(--spice-button-active); flex-grow: 1; text-align: left; border-top-right-radius: 0; border-bottom-right-radius: 0; display: flex; justify-content: space-between; align-items: center;";
                    btn.innerHTML = `<span>${preset.name}</span> <strong style="opacity: 0.85;">${Math.round(preset.vol * 100)}%</strong>`;
                    btn.onclick = () => attemptApplyPreset(preset);
                    
                    const upBtn = document.createElement("button");
                    upBtn.title = "Move preset up";
                    upBtn.style.cssText = btnGroupStyle + " border-radius: 0;";
                    upBtn.innerText = "↑";
                    upBtn.disabled = index === 0;
                    if (index === 0) upBtn.style.opacity = "0.3";
                    upBtn.onclick = (e) => {
                        e.stopPropagation();
                        if (index > 0) {
                            [config.presets[index - 1], config.presets[index]] = [config.presets[index], config.presets[index - 1]];
                            saveConfig();
                            updateAllUI();
                        }
                    };

                    const downBtn = document.createElement("button");
                    downBtn.title = "Move preset down";
                    downBtn.style.cssText = btnGroupStyle + " border-radius: 0;";
                    downBtn.innerText = "↓";
                    downBtn.disabled = index === config.presets.length - 1;
                    if (index === config.presets.length - 1) downBtn.style.opacity = "0.3";
                    downBtn.onclick = (e) => {
                        e.stopPropagation();
                        if (index < config.presets.length - 1) {
                            [config.presets[index + 1], config.presets[index]] = [config.presets[index], config.presets[index + 1]];
                            saveConfig();
                            updateAllUI();
                        }
                    };

                    const renBtn = document.createElement("button");
                    renBtn.title = "Rename preset";
                    renBtn.style.cssText = btnGroupStyle + " border-radius: 0;";
                    renBtn.innerText = "✎";
                    renBtn.onclick = (e) => {
                        e.stopPropagation();
                        editingPresetIndex = index;
                        updateAllUI();
                    };

                    const delBtn = document.createElement("button");
                    if (deletingPresetIndex === index) {
                        delBtn.innerText = "Confirm?";
                        delBtn.title = "Confirm deletion of this quick preset.";
                        delBtn.style.cssText = btnGroupStyle + " background: #d32f2f; color: white; border-top-right-radius: 4px; border-bottom-right-radius: 4px; font-weight: bold;";
                        delBtn.onclick = (e) => {
                            e.stopPropagation();
                            config.presets.splice(index, 1);
                            saveConfig();
                            deletingPresetIndex = -1;
                            updateAllUI();
                            notify("Preset deleted.");
                        };
                        setTimeout(() => {
                            if (deletingPresetIndex === index) {
                                deletingPresetIndex = -1;
                                updateAllUI();
                            }
                        }, 3000);
                    } else {
                        delBtn.innerText = "X";
                        delBtn.title = "Delete preset";
                        delBtn.style.cssText = btnGroupStyle + " background: rgba(226, 33, 52, 0.15); color: #e22134; border-top-right-radius: 4px; border-bottom-right-radius: 4px;";
                        delBtn.onclick = (e) => {
                            e.stopPropagation();
                            deletingPresetIndex = index;
                            updateAllUI();
                        };
                    }

                    wrapper.appendChild(btn);
                    wrapper.appendChild(upBtn);
                    wrapper.appendChild(downBtn);
                    wrapper.appendChild(renBtn);
                    wrapper.appendChild(delBtn);
                }
                presetList.appendChild(wrapper);
            });
            
            presetSection.appendChild(presetList);

            const addPresetDiv = document.createElement("div");
            addPresetDiv.style.marginTop = "15px";
            addPresetDiv.style.display = "flex";
            addPresetDiv.style.gap = "10px";
            addPresetDiv.style.alignItems = "center";
            addPresetDiv.style.flexWrap = "wrap";
            
            const presetNameInput = document.createElement("input");
            presetNameInput.type = "text";
            presetNameInput.placeholder = "Preset Name (e.g. Chill, Rock)";
            presetNameInput.title = "Enter a name for the new preset";
            presetNameInput.style.cssText = inputStyle + " flex-grow: 1;";
            
            const currentVol100 = Math.round(Spicetify.Player.getVolume() * 100);
            
            const presetVolSlider = document.createElement("input");
            presetVolSlider.type = "range";
            presetVolSlider.min = "0"; presetVolSlider.max = "100"; presetVolSlider.step = "1";
            presetVolSlider.value = currentVol100;
            presetVolSlider.title = "Drag to choose the preset volume";
            
            const presetVolNum = document.createElement("input");
            presetVolNum.type = "number";
            presetVolNum.min = "0"; presetVolNum.max = "100";
            presetVolNum.style.cssText = inputStyle + " width: 60px;";
            presetVolNum.value = currentVol100;
            presetVolNum.title = "Type a specific volume percentage";

            presetVolSlider.oninput = () => presetVolNum.value = presetVolSlider.value;
            presetVolNum.oninput = () => presetVolSlider.value = presetVolNum.value;
            
            const addPresetBtn = document.createElement("button");
            addPresetBtn.innerText = "+ Add Preset";
            addPresetBtn.title = "Save the chosen volume as a new preset";
            addPresetBtn.style.cssText = btnStyle;
            addPresetBtn.onclick = (e) => {
                e.stopPropagation();
                const name = presetNameInput.value.trim();
                if (name !== "") {
                    config.presets.push({ name: name, vol: parseFloat(presetVolNum.value) / 100 });
                    saveConfig();
                    presetNameInput.value = "";
                    updateAllUI();
                    notify(`Created preset: ${name}`);
                }
            };
            
            addPresetDiv.appendChild(presetNameInput);
            addPresetDiv.appendChild(presetVolSlider);
            addPresetDiv.appendChild(presetVolNum);
            addPresetDiv.appendChild(document.createTextNode("%"));
            addPresetDiv.appendChild(addPresetBtn);
            presetSection.appendChild(addPresetDiv);
        }

        function renderTrackSection() {
            trackSection.innerHTML = `<h3 style="margin-bottom: 10px; color: var(--spice-text);" title="Lock a specific volume for the currently playing song.">Custom Volume for Current Song</h3>`;
            
            const track = getCurrentTrack();
            const trackUri = getCurrentUri();
            
            if (track && trackUri) {
                const title = track.metadata?.title || track.name || "Unknown Title";
                const artist = track.metadata?.artist_name || (track.artists && track.artists[0]?.name) || "Unknown Artist";

                const trackInfo = document.createElement("p");
                trackInfo.innerHTML = `Currently Playing:<br><strong style="color: var(--spice-text); font-size: 1.1em;">${title}</strong> by ${artist}`;
                trackInfo.style.color = "var(--spice-subtext)";
                trackInfo.style.marginBottom = "15px";
                trackSection.appendChild(trackInfo);

                const trackControls = document.createElement("div");
                trackControls.style.display = "flex";
                trackControls.style.gap = "10px";
                trackControls.style.alignItems = "center";

                const currentVol100 = Math.round(Spicetify.Player.getVolume() * 100);
                const activeVol = getSavedVolume(trackUri);
                const hasCustomVol = activeVol !== -1; 
                let savedTrackVol = hasCustomVol ? Math.round(activeVol * 100) : currentVol100;

                const trackVolSlider = document.createElement("input");
                trackVolSlider.type = "range";
                trackVolSlider.min = "0"; trackVolSlider.max = "100"; trackVolSlider.step = "1";
                trackVolSlider.value = savedTrackVol;
                trackVolSlider.title = "Drag to choose a custom volume for this track";

                const trackVolNum = document.createElement("input");
                trackVolNum.type = "number";
                trackVolNum.min = "0"; trackVolNum.max = "100";
                trackVolNum.style.cssText = inputStyle + " width: 60px;";
                trackVolNum.value = savedTrackVol;
                trackVolNum.title = "Type a custom volume percentage for this track";

                trackVolSlider.oninput = () => trackVolNum.value = trackVolSlider.value;
                trackVolNum.oninput = () => trackVolSlider.value = trackVolNum.value;

                const saveTrackBtn = document.createElement("button");
                saveTrackBtn.innerText = hasCustomVol ? "Update Custom Vol" : "Save Custom Vol";
                saveTrackBtn.title = hasCustomVol ? "Update the locked volume for this song" : "Lock the current volume for this song";
                saveTrackBtn.style.cssText = btnStyle;
                saveTrackBtn.onclick = (e) => {
                    e.stopPropagation();
                    const newVol = parseFloat(trackVolNum.value) / 100;
                    setSavedVolume(trackUri, newVol);
                    applyTargetVolume(newVol, false, isLocalUri(trackUri));
                    setTimeout(updateAllUI, 10);
                    notify("Saved and locked custom volume for this track!");
                };

                trackControls.appendChild(trackVolSlider);
                trackControls.appendChild(trackVolNum);
                trackControls.appendChild(document.createTextNode("%"));
                trackControls.appendChild(saveTrackBtn);

                if (hasCustomVol) {
                    const clearTrackBtn = document.createElement("button");
                    clearTrackBtn.innerText = "Delete Custom Vol";
                    clearTrackBtn.title = "Remove the locked volume for this song";
                    clearTrackBtn.style.cssText = btnStyle + " background: #e22134;";
                    clearTrackBtn.onclick = (e) => {
                        e.stopPropagation();
                        deleteSavedVolume(trackUri);
                        applyTargetVolume(lastGenericVolume, true, isLocalUri(trackUri)); 
                        setTimeout(updateAllUI, 10); 
                        notify("Removed custom volume! Restored normal volume.");
                    };
                    trackControls.appendChild(clearTrackBtn);
                }

                trackSection.appendChild(trackControls);
            } else {
                trackSection.innerHTML += `<p style="color: var(--spice-subtext);">Play a song first to set a custom volume for it.</p>`;
            }
        }

        const jsonSection = document.createElement("div");
        jsonSection.innerHTML = `<h3 style="margin-bottom: 10px; color: var(--spice-text);" title="Export or import your saved presets and custom song volumes.">Data Manager</h3>`;
        
        const jsonControls = document.createElement("div");
        jsonControls.style.display = "flex";
        jsonControls.style.flexWrap = "wrap";
        jsonControls.style.gap = "10px";
        jsonControls.style.marginTop = "10px";

        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".json";
        fileInput.style.display = "none";
        
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const parsed = JSON.parse(event.target.result);
                    if (parsed.presets && parsed.songVolumes) {
                        config = parsed;
                        saveConfig();
                        setTimeout(updateAllUI, 10);
                        notify("Backup imported successfully!");
                    } else { throw new Error("Invalid format"); }
                } catch(err) { notify("Error: The file is not a valid Volume Manager backup!"); }
            };
            reader.readAsText(file);
            fileInput.value = "";
        };

        function renderJsonControls() {
            jsonControls.innerHTML = "";

            const exportBtn = document.createElement("button");
            exportBtn.innerText = "📥 Download .json Backup";
            exportBtn.title = "Download your custom volumes and presets to a file as a backup.";
            exportBtn.style.cssText = btnStyle;
            exportBtn.onclick = () => {
                const dataStr = JSON.stringify(config, null, 2);
                const blob = new Blob([dataStr], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "spicetify_volume_manager.json";
                a.click();
                URL.revokeObjectURL(url);
                notify("Backup file downloaded!");
            };

            const importBtn = document.createElement("button");
            importBtn.innerText = "📂 Import .json Backup";
            importBtn.title = "Load and restore your custom volumes and presets from a backup file.";
            importBtn.style.cssText = btnStyle;
            importBtn.onclick = () => fileInput.click();

            const resetBtn = document.createElement("button");
            resetBtn.title = "Permanently clear and reset all of your presets and custom song volumes.";
            if (resetAllConfirming) {
                resetBtn.innerText = "⚠️ CONFIRM FULL RESET (CANNOT BE UNDONE)";
                resetBtn.style.cssText = btnStyle + " background: #d32f2f; color: white; margin-left: auto;";
                resetBtn.onclick = (e) => {
                    e.stopPropagation();
                    config = { 
                        presets: [], 
                        songVolumes: {}, 
                        showNotifications: config.showNotifications, 
                        lastGenericVolume: lastGenericVolume, 
                        iconSize: config.iconSize, 
                        guiOpacity: config.guiOpacity,
                        guiBlur: config.guiBlur
                    };
                    saveConfig();
                    resetAllConfirming = false;
                    const isLocal = isLocalUri(getCurrentUri());
                    applyTargetVolume(lastGenericVolume, true, isLocal);
                    updateAllUI();
                    notify("All data has been reset.");
                };

                setTimeout(() => {
                    if (resetAllConfirming) {
                        resetAllConfirming = false;
                        updateAllUI();
                    }
                }, 4500);
            } else {
                resetBtn.innerText = "⚠️ Reset All Data";
                resetBtn.style.cssText = btnStyle + " background: rgba(226, 33, 52, 0.15); color: #e22134; border: 1px solid #e22134; margin-left: auto;";
                resetBtn.onclick = (e) => {
                    e.stopPropagation();
                    resetAllConfirming = true;
                    updateAllUI();
                };
            }

            jsonControls.appendChild(exportBtn);
            jsonControls.appendChild(importBtn);
            jsonControls.appendChild(resetBtn);
        }

        jsonSection.appendChild(jsonArea);
        jsonSection.appendChild(jsonControls);

        updateAllUI();

        container.appendChild(settingsSection);
        const hr0 = document.createElement("hr"); hr0.style.cssText = hrStyle; container.appendChild(hr0);
        container.appendChild(presetSection);
        const hr1 = document.createElement("hr"); hr1.style.cssText = hrStyle; container.appendChild(hr1);
        container.appendChild(trackSection);
        const hr2 = document.createElement("hr"); hr2.style.cssText = hrStyle; container.appendChild(hr2);
        container.appendChild(jsonSection);

        Spicetify.PopupModal.display({ title: "Volume Manager", content: container, isLarge: true });
    }

    const hoverMenu = document.createElement('div');
    hoverMenu.id = 'volume-manager-hover-menu';
    hoverMenu.style.cssText = `
        position: fixed;
        background: var(--spice-elevated-base);
        border: 1px solid var(--spice-button-disabled);
        border-radius: 8px;
        padding: 12px;
        z-index: 10000;
        display: none;
        flex-direction: column;
        gap: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        min-width: 200px;
    `;
    document.body.appendChild(hoverMenu);

    function renderHoverMenu() {
        hoverMenu.innerHTML = "";
        
        const trackUri = getCurrentUri();
        if (trackUri && getSavedVolume(trackUri) !== -1) {
            const activeVol = getSavedVolume(trackUri);
            const warningDiv = document.createElement('div');
            warningDiv.style.cssText = "background: rgba(226, 33, 52, 0.1); border: 1px solid #e22134; padding: 10px 12px; border-radius: 6px; text-align: center; margin-bottom: 5px;";
            
            warningDiv.innerHTML = `<div style="color: #e22134; font-weight: bold; font-size: 0.9em; margin-bottom: 5px;">Custom Volume Active (${Math.round(activeVol * 100)}%)</div>
                                    <div style="color: var(--spice-subtext); font-size: 0.8em;">Delete to change volume</div>`;
            
            hoverMenu.appendChild(warningDiv);
        }

        const presetTitle = document.createElement('div');
        presetTitle.innerText = "Presets";
        presetTitle.style.cssText = "color: var(--spice-text); font-weight: bold; font-size: 0.9em; border-bottom: 1px solid var(--spice-button-disabled); padding-bottom: 4px;";
        hoverMenu.appendChild(presetTitle);

        if (!config.presets || config.presets.length === 0) {
            hoverMenu.innerHTML += `<div style="color: var(--spice-subtext); font-size: 0.85em;">No presets found.</div>`;
        } else {
            for (const preset of config.presets) {
                const pBtn = document.createElement('button');
                pBtn.innerText = `${preset.name} (${Math.round(preset.vol * 100)}%)`;
                pBtn.title = `Apply preset: ${preset.name}`;
                pBtn.style.cssText = "background: transparent; color: var(--spice-text); border: 1px solid var(--spice-button); padding: 6px; border-radius: 4px; cursor: pointer; text-align: left;";
                pBtn.onmouseover = () => pBtn.style.background = "var(--spice-button-disabled)";
                pBtn.onmouseout = () => pBtn.style.background = "transparent";
                
                pBtn.onclick = () => attemptApplyPreset(preset);
                
                hoverMenu.appendChild(pBtn);
            }
        }

        const openGuiBtn = document.createElement('button');
        openGuiBtn.innerText = "⚙️ Open Full Menu";
        openGuiBtn.style.cssText = "background: var(--spice-button); color: var(--spice-text); border: none; padding: 6px; border-radius: 4px; cursor: pointer; margin-top: 5px; font-weight: bold;";
        openGuiBtn.onclick = () => {
            hoverMenu.style.display = "none";
            openGUI();
        };
        hoverMenu.appendChild(openGuiBtn);
    }

    let hideTimeout;
    function showMenu(btnElement) {
        clearTimeout(hideTimeout);
        renderHoverMenu();
        
        const opacity = typeof config.guiOpacity !== 'undefined' ? config.guiOpacity : 0.85;
        const blurAmount = typeof config.guiBlur !== 'undefined' ? config.guiBlur : 15;
        
        const baseColorHex = getComputedStyle(document.documentElement).getPropertyValue('--spice-elevated-base').trim() || "#121212";
        let r = 18, g = 18, b = 18;
        const match = baseColorHex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
        if (match) {
            r = parseInt(match[1], 16);
            g = parseInt(match[2], 16);
            b = parseInt(match[3], 16);
        }
        
        hoverMenu.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        hoverMenu.style.backdropFilter = `blur(${blurAmount}px)`;
        hoverMenu.style.webkitBackdropFilter = `blur(${blurAmount}px)`;
        hoverMenu.style.border = "1px solid rgba(255, 255, 255, 0.1)";
        
        hoverMenu.style.display = "flex";
        
        const rect = btnElement.getBoundingClientRect();
        hoverMenu.style.bottom = (window.innerHeight - rect.top + 10) + 'px'; 
        hoverMenu.style.left = (rect.left - (hoverMenu.offsetWidth / 2) + (rect.width / 2)) + 'px';
    }

    function hideMenu() {
        hoverMenu.style.display = "none";
    }

    hoverMenu.addEventListener('mouseenter', () => clearTimeout(hideTimeout));
    hoverMenu.addEventListener('mouseleave', () => hideTimeout = setTimeout(hideMenu, 250));

    function injectButton() {
        const extraControls = document.querySelector('.main-nowPlayingBar-extraControls');
        if (!extraControls) return;

        let volBtn = document.getElementById('my-custom-vol-btn');
        if (!volBtn) {
            volBtn = document.createElement('button');
            volBtn.id = 'my-custom-vol-btn';
            
            volBtn.className = "main-genericButton-button e-10451-legacy-button e-10451-legacy-button-tertiary e-10451-overflow-wrap-anywhere e-10451-button-tertiary--icon-only-small e-10451-button-tertiary--icon-only e-10451-button-tertiary--text-subdued encore-internal-color-text-subdued";
            volBtn.setAttribute("aria-label", "Volume Manager");
            volBtn.title = "Volume Manager";
            
            volBtn.innerHTML = `
            <span aria-hidden="true" class="e-10451-button__icon-wrapper">
                <svg data-encore-id="icon" role="img" aria-hidden="true" class="e-10451-icon" viewBox="0 0 16 16" style="fill: currentColor;">
                    <path d="M3 2v4.5a1.5 1.5 0 0 0 0 3V14h2V9.5a1.5 1.5 0 0 0 0-3V2H3zm0 6a.5.5 0 1 1 2 0 .5.5 0 0 1-2 0zM11 2v1.5a1.5 1.5 0 0 0 0 3V14h2V6.5a1.5 1.5 0 0 0 0-3V2h-2zm0 3a.5.5 0 1 1 2 0 .5.5 0 0 1-2 0zM7 2v8.5a1.5 1.5 0 0 0 0 3V14h2v-.5a1.5 1.5 0 0 0 0-3V2H7zm0 10a.5.5 0 1 1 2 0 .5.5 0 0 1-2 0z"/>
                </svg>
            </span>`;

            volBtn.onclick = openGUI;
            volBtn.addEventListener('mouseenter', () => showMenu(volBtn));
            volBtn.addEventListener('mouseleave', () => hideTimeout = setTimeout(hideMenu, 250));
        }

        const svg = volBtn.querySelector('svg');
        if (svg) {
            svg.style.width = config.iconSize + "px";
            svg.style.height = config.iconSize + "px";
        }

        if (extraControls.firstChild !== volBtn) {
            extraControls.prepend(volBtn);
        }
    }

    setInterval(injectButton, 1000);

})();
