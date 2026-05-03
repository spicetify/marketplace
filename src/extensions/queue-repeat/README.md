![](Foto.png)

# Queue Repeat — Spicetify Extension

A lightweight Spicetify extension that adds a **Queue Repeat** toggle button to Spotify's player bar. When enabled, every track that finishes playing from your queue is automatically re-added to the end of the queue — creating a seamless, infinite loop of your manually queued tracks.

## Features

- **Toggle button** placed directly to the left of the Lyrics button in the bottom player bar
- **Active / Inactive state** — green highlight with an indicator dot when on, dimmed when off
- **Snapshot on activation** — when you press the button, the extension reads the current track and all queued tracks and registers them as the repeat list
- **Dynamic queue detection** — tracks added to the queue *after* enabling Queue Repeat are automatically picked up and included in the repeat loop (checked every 2 seconds)
- **Smart injection** — survives Spotify DOM re-renders via MutationObserver
- **No comments, no bloat** — clean production-ready code

## How It Works
1. Add tracks to "Next Up" (queue) as usual
2. Press the Queue Repeat button in the player bar
3. The extension captures: current track + all queued tracks → repeat list
4. Each time a track from the repeat list finishes → it is re-added to the end of the queue
5. Result: your queued tracks loop indefinitely
6. Press the button again to turn it off (queue is left unchanged)

While active:
  → Every 2 seconds, the extension checks for newly added tracks
  → If a new track appears in the queue, it is added to the repeat list automatically

## Preview

| State | Appearance |
|---|---|
| **Off** | Icon is dimmed (grey, 60% opacity) |
| **On** | Icon turns **green** + small green dot indicator beneath it |

Notifications:
- `Queue Repeat on (N tracks)` — shown when enabled
- `Queue Repeat: N new track(s) added` — shown when a new track is detected while active
- `Queue Repeat off` — shown when disabled

## Installation
### Steps

**1. Copy the extension file**

Place `queue-repeat.js` into your Spicetify extensions folder:

```
%APPDATA%\spicetify\Extensions\queue-repeat.js
```

**2. Register the extension**

```powershell
spicetify config extensions queue-repeat.js
```

**3. Apply**

```powershell
spicetify apply
```

Spotify will restart automatically with the extension active.

---

## Uninstall

```powershell
spicetify config extensions queue-repeat.js
spicetify apply
```

Then delete the file from the Extensions folder.


## File Structure

```
Extensions/
└── queue-repeat.js     ← the extension (single file, no dependencies)
```

---
