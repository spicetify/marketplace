(function CaWiLyrics() {
    if (!Spicetify.Player || !Spicetify.Platform || !Spicetify.Playbar || !Spicetify.CosmosAsync) {
        setTimeout(CaWiLyrics, 200);
        return;
    }

    const gsapScript = document.createElement('script');
    gsapScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js';
    document.head.appendChild(gsapScript);

    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;500;700&display=swap';
    document.head.appendChild(fontLink);

    let lyricsVisible = false;
    let starsEnabled = true;
    let currentLines = [];
    let activeIndex = -1;
    let updateInterval = null;
    let waveTime = 0;
    let waveAmp = 15;
    let targetAmp = 15;
    let beatPulse = 0;
    let stars = [];

    const style = document.createElement('style');
    style.innerHTML = `
        .cawi-mic-btn { background: transparent; border: none; color: var(--spice-subtext, #a7a7a7); cursor: pointer; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; margin: 0 8px; transition: transform 0.2s, color 0.2s; }
        .cawi-mic-btn:hover { color: var(--spice-text, #fff); transform: scale(1.1); }
        .cawi-mic-btn.active { color: #6c5ce7 !important; }
        
        #cawi-lyrics-overlay { position: fixed; inset: 0; background: rgba(10, 10, 12, 0.85); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); z-index: 99999; font-family: 'Space Grotesk', sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity 0.4s ease; overflow: hidden; transform: translateZ(0); }
        #cawi-lyrics-overlay.visible { opacity: 1; pointer-events: auto; }
        
        #cawi-bg-canvas { position: absolute; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 0; pointer-events: none; }
        
        .cawi-close-overlay { position: absolute; top: 40px; right: 40px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 50%; width: 44px; height: 44px; color: #fff; font-size: 1.2rem; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; z-index: 10; }
        .cawi-close-overlay:hover { background: rgba(255, 255, 255, 0.15); transform: scale(1.1); box-shadow: 0 0 15px rgba(108, 92, 231, 0.4); }
        
        .cawi-lyrics-box { width: 95%; max-width: 1300px; height: 65vh; margin-top: -8vh; overflow-y: scroll; scrollbar-width: none; display: flex; flex-direction: column; align-items: center; padding: 35vh 50px; mask-image: linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%); z-index: 2; position: relative; }
        .cawi-lyrics-box::-webkit-scrollbar { display: none; }
        
        .cawi-lyric-line { font-size: 2.8rem; font-weight: 700; color: #fff; text-align: center; padding: 18px 30px; width: 100%; max-width: 1200px; opacity: 0.25; transform: scale(0.92) translateZ(0); filter: blur(4px); transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.6s cubic-bezier(0.25, 1, 0.5, 1), filter 0.6s cubic-bezier(0.25, 1, 0.5, 1); transform-origin: center center; will-change: transform, opacity, filter; word-wrap: break-word; line-height: 1.35; }
        .cawi-lyric-line.active { opacity: 1; transform: scale(1.08) translateZ(0); filter: blur(0px); color: #fff; text-shadow: 0 0 30px rgba(253, 121, 168, 0.4); }
        .cawi-no-lyrics { font-size: 1.5rem; opacity: 0.5; color: #fff; text-align: center; }
        
        .cawi-bottom-player { position: absolute; bottom: 35px; width: 65%; min-width: 650px; max-width: 900px; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 20px; padding: 20px 30px; display: flex; flex-direction: column; gap: 15px; box-shadow: 0 15px 40px rgba(0,0,0,0.3); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); z-index: 10; }
        .cawi-player-top { display: flex; align-items: center; justify-content: space-between; width: 100%; }
        
        .cawi-player-info { display: flex; align-items: center; gap: 15px; width: 33%; }
        .cawi-player-cover { width: 55px; height: 55px; border-radius: 12px; object-fit: cover; background: #222; box-shadow: 0 5px 15px rgba(0,0,0,0.4); }
        .cawi-player-text { display: flex; flex-direction: column; justify-content: center; white-space: nowrap; overflow: hidden; }
        .cawi-track-title { color: #fff; font-size: 1.1rem; font-weight: 700; text-overflow: ellipsis; overflow: hidden; }
        .cawi-track-artist { color: rgba(255,255,255,0.6); font-size: 0.9rem; font-weight: 500; text-overflow: ellipsis; overflow: hidden; margin-top: 4px; }
        
        .cawi-player-controls { display: flex; align-items: center; justify-content: center; gap: 20px; width: 34%; }
        .cawi-ctrl-btn { background: none; border: none; color: #fff; opacity: 0.6; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; width: 38px; height: 38px; }
        .cawi-ctrl-btn:hover { opacity: 1; transform: scale(1.1); }
        .cawi-play-btn { background: #fff; color: #000; border-radius: 50%; opacity: 1; width: 48px; height: 48px; }
        .cawi-play-btn:hover { transform: scale(1.05); box-shadow: 0 0 20px rgba(255,255,255,0.3); }
        
        .cawi-player-extra { display: flex; align-items: center; justify-content: flex-end; width: 33%; gap: 12px; }
        .cawi-action-btn { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 50%; width: 36px; height: 36px; color: #fff; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; }
        .cawi-action-btn:hover { background: rgba(255,255,255,0.15); transform: scale(1.1); color: #fd79a8; border-color: #fd79a8; }
        .cawi-action-btn.active-star { color: #f1c40f; border-color: #f1c40f; }
        
        .cawi-progress-wrapper { display: flex; align-items: center; gap: 15px; width: 100%; font-size: 0.8rem; color: rgba(255,255,255,0.5); font-weight: 500; }
        .cawi-progress-bar { flex: 1; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; cursor: pointer; position: relative; display: flex; align-items: center; transition: 0.2s; }
        .cawi-progress-bar:hover { height: 8px; }
        .cawi-progress-fill { height: 100%; width: 0%; background: linear-gradient(90deg, #6c5ce7, #fd79a8); border-radius: 3px; position: relative; pointer-events: none; }
        .cawi-progress-fill::after { content: ''; position: absolute; right: -6px; top: -3px; width: 14px; height: 14px; background: #fff; border-radius: 50%; opacity: 0; transition: 0.2s; box-shadow: 0 0 10px rgba(0,0,0,0.5); }
        .cawi-progress-bar:hover .cawi-progress-fill::after { opacity: 1; top: -3px; }
        
        #cawi-playlist-modal { position: fixed; background: rgba(20, 20, 25, 0.95); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; width: 320px; max-height: 400px; padding: 20px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); backdrop-filter: blur(25px); z-index: 100000; display: none; flex-direction: column; opacity: 0; transform: translateY(10px) scale(0.95); transition: 0.3s cubic-bezier(0.25, 1, 0.5, 1); }
        #cawi-playlist-modal.active { display: flex; opacity: 1; transform: translateY(0) scale(1); }
        .cawi-pl-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .cawi-pl-header h2 { font-size: 1.1rem; color: #fff; margin: 0; }
        .cawi-pl-close { background: none; border: none; color: #fff; font-size: 1.2rem; cursor: pointer; opacity: 0.6; transition: 0.2s; padding: 0; }
        .cawi-pl-close:hover { opacity: 1; transform: scale(1.1); }
        .cawi-pl-list { display: flex; flex-direction: column; gap: 6px; overflow-y: auto; scrollbar-width: none; flex: 1; }
        .cawi-pl-list::-webkit-scrollbar { display: none; }
        .cawi-pl-item { padding: 10px 12px; background: rgba(255,255,255,0.03); border-radius: 10px; color: #fff; font-size: 0.95rem; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 10px; border: 1px solid transparent; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .cawi-pl-item:hover { background: rgba(255,255,255,0.1); border-color: rgba(108, 92, 231, 0.4); transform: translateX(4px); }
        
        .cawi-toast { position: absolute; top: 30px; left: 50%; transform: translateX(-50%) translateY(-20px); background: #6c5ce7; color: #fff; padding: 10px 25px; border-radius: 20px; font-weight: 500; opacity: 0; transition: 0.4s; z-index: 100001; pointer-events: none; }
        .cawi-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
    `;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.id = 'cawi-lyrics-overlay';
    overlay.innerHTML = `
        <canvas id="cawi-bg-canvas"></canvas>
        <button class="cawi-close-overlay">✕</button>
        <div class="cawi-toast" id="cawi-toast">Added to playlist!</div>
        
        <div class="cawi-lyrics-box" id="cawi-box">
            <div class="cawi-no-lyrics">Loading...</div>
        </div>
        
        <div class="cawi-bottom-player">
            <div class="cawi-player-top">
                <div class="cawi-player-info">
                    <img class="cawi-player-cover" src="" alt="">
                    <div class="cawi-player-text">
                        <div class="cawi-track-title">Title</div>
                        <div class="cawi-track-artist">Artist</div>
                    </div>
                </div>
                <div class="cawi-player-controls">
                    <button class="cawi-ctrl-btn" id="cawi-prev">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"></path></svg>
                    </button>
                    <button class="cawi-ctrl-btn cawi-play-btn" id="cawi-play">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" id="cawi-play-icon"><path d="M8 5v14l11-7z"></path></svg>
                    </button>
                    <button class="cawi-ctrl-btn" id="cawi-next">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"></path></svg>
                    </button>
                </div>
                <div class="cawi-player-extra">
                    <button class="cawi-action-btn active-star" id="cawi-toggle-stars" title="Toggle Effects">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    </button>
                    <button class="cawi-action-btn" id="cawi-open-pl" title="Add to Playlist">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </button>
                </div>
            </div>
            <div class="cawi-progress-wrapper">
                <span id="cawi-time-current">0:00</span>
                <div class="cawi-progress-bar" id="cawi-progress-bg">
                    <div class="cawi-progress-fill" id="cawi-progress-fill"></div>
                </div>
                <span id="cawi-time-total">0:00</span>
            </div>
        </div>
        
        <div id="cawi-playlist-modal">
            <div class="cawi-pl-header">
                <h2>Add to Playlist</h2>
                <button class="cawi-pl-close" id="cawi-pl-close">✕</button>
            </div>
            <div class="cawi-pl-list" id="cawi-pl-list"></div>
        </div>
    `;
    document.body.appendChild(overlay);

    const cawiBox = overlay.querySelector('#cawi-box');
    const closeBtn = overlay.querySelector('.cawi-close-overlay');
    const playBtn = overlay.querySelector('#cawi-play');
    const playIcon = overlay.querySelector('#cawi-play-icon');
    const prevBtn = overlay.querySelector('#cawi-prev');
    const nextBtn = overlay.querySelector('#cawi-next');
    const coverImg = overlay.querySelector('.cawi-player-cover');
    const titleEl = overlay.querySelector('.cawi-track-title');
    const artistEl = overlay.querySelector('.cawi-track-artist');
    const fillEl = overlay.querySelector('#cawi-progress-fill');
    const currTimeEl = overlay.querySelector('#cawi-time-current');
    const totTimeEl = overlay.querySelector('#cawi-time-total');
    const progBg = overlay.querySelector('#cawi-progress-bg');
    
    const plModal = overlay.querySelector('#cawi-playlist-modal');
    const openPlBtn = overlay.querySelector('#cawi-open-pl');
    const closePlBtn = overlay.querySelector('#cawi-pl-close');
    const plList = overlay.querySelector('#cawi-pl-list');
    const toast = overlay.querySelector('#cawi-toast');
    const starsBtn = overlay.querySelector('#cawi-toggle-stars');
    
    const canvas = overlay.querySelector('#cawi-bg-canvas');
    const ctx = canvas.getContext('2d', { alpha: false });

    function initStars() {
        stars = Array.from({length: 120}, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            s: Math.random() * 1.5 + 0.5,
            v: Math.random() * 0.5 + 0.1,
            a: Math.random() * 0.8 + 0.2
        }));
    }

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initStars();
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    function drawVolumetricWave(ctx, isLeft, w, h, t, amp) {
        const colors = isLeft 
            ? ['rgba(108, 92, 231, 0.1)', 'rgba(108, 92, 231, 0.25)', 'rgba(108, 92, 231, 0.5)'] 
            : ['rgba(253, 121, 168, 0.1)', 'rgba(253, 121, 168, 0.25)', 'rgba(253, 121, 168, 0.5)'];
            
        for (let j = 0; j < 3; j++) {
            ctx.beginPath();
            const baseX = isLeft ? 0 : w;
            ctx.moveTo(baseX, 0);
            for (let i = 0; i <= h; i += 30) {
                let offset = Math.sin(i * 0.003 + t + j * 0.5) * amp * ((j + 1) * 0.6) + Math.cos(i * 0.005 - t) * 30;
                let x = isLeft ? Math.max(0, offset + 40) : Math.min(w, w - offset - 40);
                ctx.lineTo(x, i);
            }
            ctx.lineTo(baseX, h);
            ctx.fillStyle = colors[j];
            ctx.fill();
        }
    }

    function renderCanvas() {
        if (!lyricsVisible) return requestAnimationFrame(renderCanvas);
        
        ctx.fillStyle = '#0a0a0c';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        if (Spicetify.Player.isPlaying()) {
            beatPulse -= 0.05;
            if (beatPulse <= 0) beatPulse = Math.random() * 1.2;
            targetAmp = 30 + beatPulse * 45;
            waveTime += 0.03 + (beatPulse * 0.015);
        } else {
            targetAmp = 10;
            waveTime += 0.005;
        }
        
        waveAmp += (targetAmp - waveAmp) * 0.1;
        
        if (starsEnabled) {
            ctx.fillStyle = '#ffffff';
            for (let i = 0; i < stars.length; i++) {
                let s = stars[i];
                s.y -= s.v * (Spicetify.Player.isPlaying() ? 1 + beatPulse : 0.5);
                if (s.y < 0) {
                    s.y = canvas.height;
                    s.x = Math.random() * canvas.width;
                }
                ctx.globalAlpha = s.a;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.s, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        drawVolumetricWave(ctx, true, canvas.width, canvas.height, waveTime, waveAmp);
        drawVolumetricWave(ctx, false, canvas.width, canvas.height, waveTime + 2, waveAmp);
        
        requestAnimationFrame(renderCanvas);
    }
    requestAnimationFrame(renderCanvas);

    closeBtn.addEventListener('click', toggleLyricsView);
    playBtn.addEventListener('click', () => Spicetify.Player.togglePlay());
    prevBtn.addEventListener('click', () => Spicetify.Player.back());
    nextBtn.addEventListener('click', () => Spicetify.Player.next());
    closePlBtn.addEventListener('click', () => plModal.classList.remove('active'));

    starsBtn.addEventListener('click', () => {
        starsEnabled = !starsEnabled;
        if(starsEnabled) starsBtn.classList.add('active-star');
        else starsBtn.classList.remove('active-star');
    });

    openPlBtn.addEventListener('click', async (e) => {
        if (plModal.classList.contains('active')) {
            plModal.classList.remove('active');
            return;
        }
        
        const rect = openPlBtn.getBoundingClientRect();
        plModal.style.bottom = (window.innerHeight - rect.top + 15) + 'px';
        plModal.style.right = (window.innerWidth - rect.right - 20) + 'px';
        
        plModal.classList.add('active');
        plList.innerHTML = '<div style="text-align:center; color:#fff; padding:20px;">Loading...</div>';
        
        const playlists = await getPlaylists();
        plList.innerHTML = '';
        if (playlists.length === 0) {
            plList.innerHTML = '<div style="text-align:center; color:#fff; padding:20px;">No playlists found</div>';
            return;
        }
        
        playlists.forEach(pl => {
            const item = document.createElement('div');
            item.className = 'cawi-pl-item';
            item.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg> <span>${pl.name || 'Unknown'}</span>`;
            item.onclick = async () => {
                try {
                    const trackUri = Spicetify.Player.data.item ? Spicetify.Player.data.item.uri : Spicetify.Player.data.track.uri;
                    if (Spicetify.Platform.PlaylistAPI) {
                        await Spicetify.Platform.PlaylistAPI.add(pl.uri, [trackUri]);
                    } else {
                        await Spicetify.CosmosAsync.post(`sp://core-playlist/v1/playlist/${pl.uri}/add`, { uris: [trackUri] });
                    }
                    showToast();
                } catch (e) {}
                plModal.classList.remove('active');
            };
            plList.appendChild(item);
        });
    });

    progBg.addEventListener('click', (e) => {
        const rect = progBg.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        Spicetify.Player.seek(percent * Spicetify.Player.getDuration());
    });

    async function getPlaylists() {
        try {
            const rootlist = await Spicetify.Platform.RootlistAPI.getContents();
            let list = [];
            const parse = (items) => {
                for (const i of items) {
                    if (i.type === 'playlist') list.push(i);
                    if (i.type === 'folder' && i.items) parse(i.items);
                }
            };
            parse(rootlist.items || rootlist);
            return list;
        } catch (e) {}
        try {
            const res = await Spicetify.CosmosAsync.get('sp://core-playlist/v1/rootlist');
            return res.rows ? res.rows.filter(r => r.type === 'playlist') : [];
        } catch(e) {}
        return [];
    }

    function showToast() {
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
    }

    function toggleLyricsView() {
        lyricsVisible = !lyricsVisible;
        const micBtn = document.querySelector('.cawi-mic-btn');
        if (lyricsVisible) {
            overlay.classList.add('visible');
            if (micBtn) micBtn.classList.add('active');
            updatePlayerUI();
            updateLyrics();
            startSyncLoop();
        } else {
            overlay.classList.remove('visible');
            if (micBtn) micBtn.classList.remove('active');
            plModal.classList.remove('active');
            stopSyncLoop();
        }
    }

    function formatTime(ms) {
        if (!ms || ms < 0) return "0:00";
        const s = Math.floor(ms / 1000);
        const m = Math.floor(s / 60);
        const rs = s % 60;
        return `${m}:${rs < 10 ? '0' : ''}${rs}`;
    }

    function updatePlayerUI() {
        const data = Spicetify.Player.data;
        const track = data?.item || data?.track;
        if (!track) return;

        const meta = track.metadata || {};
        titleEl.innerText = track.name || meta.title || "Unknown Title";
        artistEl.innerText = (track.artists && track.artists[0]?.name) || meta.artist_name || "Unknown Artist";
        
        let img = meta.image_url || meta.image_xlarge_url || meta.image_large_url;
        if (img && img.startsWith('spotify:image:')) img = 'https://i.scdn.co/image/' + img.substring(14);
        coverImg.src = img || '';

        if (Spicetify.Player.isPlaying()) playIcon.innerHTML = `<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path>`;
        else playIcon.innerHTML = `<path d="M8 5v14l11-7z"></path>`;

        totTimeEl.innerText = formatTime(Spicetify.Player.getDuration());
    }

    async function fetchLyricsData(track) {
        if (!track || !track.uri) return null;
        const trackId = track.uri.split(':')[2];
        try {
            const res = await Spicetify.CosmosAsync.get(`https://spclient.wg.spotify.com/color-lyrics/v2/track/${trackId}?format=json&vocalRemoval=false`);
            if (res && res.lyrics && res.lyrics.lines) return res.lyrics.lines;
        } catch (e) {}
        try {
            const res2 = await Spicetify.Platform.LyricsAPI.getLyrics(track.uri);
            if (res2 && res2.lyrics && res2.lyrics.lines) return res2.lyrics.lines;
        } catch (e) {}
        return null;
    }

    async function updateLyrics() {
        if (!lyricsVisible) return;
        
        cawiBox.innerHTML = '<div class="cawi-no-lyrics">Loading...</div>';
        currentLines = [];
        activeIndex = -1;
        cawiBox.scrollTop = 0;

        const data = Spicetify.Player.data;
        const currentTrack = data?.item || data?.track;
        if (!currentTrack) {
            cawiBox.innerHTML = '<div class="cawi-no-lyrics">No track playing</div>';
            return;
        }

        const lines = await fetchLyricsData(currentTrack);
        
        if (lines && lines.length > 0) {
            cawiBox.innerHTML = '';
            currentLines = lines.map((line) => {
                const lineEl = document.createElement('div');
                lineEl.classList.add('cawi-lyric-line');
                lineEl.innerText = line.words || '•••';
                cawiBox.appendChild(lineEl);
                return { time: parseInt(line.startTimeMs), element: lineEl };
            });
            syncLyrics();
        } else {
            cawiBox.innerHTML = '<div class="cawi-no-lyrics">Lyrics not available for this song</div>';
        }
    }

    function syncLyrics() {
        if (!lyricsVisible) return;

        const progress = Spicetify.Player.getProgress();
        const duration = Spicetify.Player.getDuration();
        
        if (duration > 0) {
            fillEl.style.width = (progress / duration * 100) + '%';
            currTimeEl.innerText = formatTime(progress);
        }

        if (Spicetify.Player.isPlaying()) playIcon.innerHTML = `<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path>`;
        else playIcon.innerHTML = `<path d="M8 5v14l11-7z"></path>`;

        if (!currentLines.length) return;

        let targetIndex = -1;
        for (let i = 0; i < currentLines.length; i++) {
            if (progress >= currentLines[i].time) targetIndex = i;
            else break;
        }

        if (targetIndex !== activeIndex && targetIndex !== -1) {
            if (activeIndex !== -1 && currentLines[activeIndex]) {
                currentLines[activeIndex].element.classList.remove('active');
            }
            activeIndex = targetIndex;
            const activeLineEl = currentLines[activeIndex].element;
            activeLineEl.classList.add('active');

            const scrollTarget = activeLineEl.offsetTop - (cawiBox.offsetHeight / 2) + (activeLineEl.offsetHeight / 2);
            if (window.gsap) {
                window.gsap.to(cawiBox, { scrollTop: scrollTarget, duration: 0.8, ease: "power3.out", overwrite: "auto" });
            } else {
                cawiBox.scrollTop = scrollTarget;
            }
        }
    }

    function startSyncLoop() {
        stopSyncLoop();
        updateInterval = setInterval(syncLyrics, 100);
    }

    function stopSyncLoop() {
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }
    }

    Spicetify.Player.addEventListener("songchange", () => {
        if (lyricsVisible) {
            updatePlayerUI();
            updateLyrics();
        }
    });

    Spicetify.Player.addEventListener("onplaypause", () => {
        if (lyricsVisible) updatePlayerUI();
    });

    function injectButton() {
        if (document.querySelector('.cawi-mic-btn')) return;
        const repeatBtn = document.querySelector('[data-testid="control-button-repeat"]') || document.querySelector('.main-repeat-button');
        if (!repeatBtn || !repeatBtn.parentNode) return setTimeout(injectButton, 500);

        const micBtn = document.createElement('button');
        micBtn.classList.add('cawi-mic-btn');
        micBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v1a7 7 0 0 1-14 0v-1"></path><line x1="12" x2="12" y1="19" y2="22"></line></svg>`;
        micBtn.addEventListener('click', toggleLyricsView);
        repeatBtn.parentNode.insertBefore(micBtn, repeatBtn);
    }
    injectButton();
})();