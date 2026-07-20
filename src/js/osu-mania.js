(function () {
    // ============================================================
    //  osu!mania 4K — type "osu"
    //  Loads .osz beatmaps from the user's PC (JSZip), runs locally
    //  and stores them in the browser (IndexedDB). Nothing is uploaded.
    // ============================================================

    const SECRET = 'osu';
    const KEYS = ['d', 'f', 'j', 'k'];
    const COLS = 4;
    // cores dos "star rating" por dificuldade (fácil -> difícil), estilo osu!
    const DIFF_COLORS = ['#7bed7b', '#5ec8ff', '#ffd54a', '#ff8f5e', '#ff5a5a', '#c77dff'];

    let buffer = '';
    document.addEventListener('keydown', (e) => {
        if (e.key.length !== 1) return;
        buffer = (buffer + e.key.toLowerCase()).slice(-SECRET.length);
        if (buffer === SECRET) { buffer = ''; if (!window.__gameActive) openGallery(); }
    });

    // ---------- JSZip on demand ----------
    function loadJSZip() {
        return new Promise((resolve, reject) => {
            if (window.JSZip) return resolve(window.JSZip);
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            s.onload = () => resolve(window.JSZip);
            s.onerror = () => reject(new Error('Failed to load JSZip'));
            document.head.appendChild(s);
        });
    }

    // ---------- IndexedDB ----------
    function idb() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open('osu-maps', 1);
            req.onupgradeneeded = () => req.result.createObjectStore('maps', { keyPath: 'id' });
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }
    async function dbAll() {
        const db = await idb();
        return new Promise((resolve) => {
            const r = db.transaction('maps').objectStore('maps').getAll();
            r.onsuccess = () => resolve(r.result || []);
            r.onerror = () => resolve([]);
        });
    }
    async function dbPut(rec) {
        const db = await idb();
        return new Promise((resolve) => {
            const tx = db.transaction('maps', 'readwrite');
            tx.objectStore('maps').put(rec);
            tx.oncomplete = resolve;
        });
    }
    async function dbDel(id) {
        const db = await idb();
        return new Promise((resolve) => {
            const tx = db.transaction('maps', 'readwrite');
            tx.objectStore('maps').delete(id);
            tx.oncomplete = resolve;
        });
    }

    // ---------- .osu parser ----------
    function parseOsu(text) {
        const meta = { keys: 4, notes: [] };
        let sec = '';
        text.split(/\r?\n/).forEach((raw) => {
            const l = raw.trim();
            if (!l || l.startsWith('//')) return;
            if (l[0] === '[' && l[l.length - 1] === ']') { sec = l.slice(1, -1); return; }
            if (sec === 'General') {
                if (l.startsWith('AudioFilename:')) meta.audio = l.slice(14).trim();
                if (l.startsWith('Mode:')) meta.mode = parseInt(l.slice(5));
            } else if (sec === 'Metadata') {
                if (l.startsWith('Title:')) meta.title = l.slice(6).trim();
                if (l.startsWith('Artist:')) meta.artist = l.slice(7).trim();
                if (l.startsWith('Creator:')) meta.creator = l.slice(8).trim();
                if (l.startsWith('Version:')) meta.version = l.slice(8).trim();
            } else if (sec === 'Difficulty') {
                if (l.startsWith('CircleSize:')) meta.keys = Math.round(parseFloat(l.slice(11)));
            } else if (sec === 'Events') {
                const m = l.match(/^0,0,"([^"]+)"/);
                if (m) meta.bg = m[1];
            } else if (sec === 'HitObjects') {
                const p = l.split(',');
                const x = parseInt(p[0]), time = parseInt(p[2]), type = parseInt(p[3]);
                const col = Math.min(meta.keys - 1, Math.max(0, Math.floor(x * meta.keys / 512)));
                const isHold = (type & 128) !== 0;
                const end = (isHold && p[5]) ? parseInt(p[5].split(':')[0]) : null;
                meta.notes.push({ col, time, end, isHold });
            }
        });
        meta.notes.sort((a, b) => a.time - b.time);
        return meta;
    }

    // ---------- read .osz -> all 4K difficulties + assets ----------
    async function readOsz(blob) {
        const JSZip = await loadJSZip();
        const zip = await JSZip.loadAsync(blob);
        const diffs = [];
        let audioName = null, bgName = null, title, artist, creator;

        for (const name of Object.keys(zip.files)) {
            if (!name.toLowerCase().endsWith('.osu')) continue;
            const meta = parseOsu(await zip.files[name].async('string'));
            if (meta.mode !== 3 || meta.keys !== 4) continue; // só osu!mania 4K
            diffs.push({ version: meta.version || '(unnamed)', notes: meta.notes });
            title = title || meta.title; artist = artist || meta.artist; creator = creator || meta.creator;
            audioName = audioName || meta.audio;
            bgName = bgName || meta.bg;
        }
        if (!diffs.length) throw new Error('No osu!mania 4K difficulty found in this .osz');

        // ordena por quantidade de notas (proxy de dificuldade)
        diffs.sort((a, b) => a.notes.length - b.notes.length);

        const audioFile = (audioName && zip.file(audioName)) ||
            zip.file(Object.keys(zip.files).find(n => /\.(mp3|ogg|wav)$/i.test(n)));
        if (!audioFile) throw new Error('Audio file not found in beatmap');
        const audioBlob = await audioFile.async('blob');
        let bgBlob = null;
        if (bgName && zip.file(bgName)) bgBlob = await zip.file(bgName).async('blob');

        return { title, artist, creator, diffs, audioBlob, bgBlob };
    }

    // miniatura do background (pra deixar os cards com cara de osu)
    async function makeThumb(blob) {
        if (!blob) return null;
        try {
            const url = URL.createObjectURL(blob);
            const img = await new Promise((res, rej) => {
                const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url;
            });
            const cw = 420, ch = 96;
            const c = document.createElement('canvas'); c.width = cw; c.height = ch;
            const cx = c.getContext('2d');
            const s = Math.max(cw / img.width, ch / img.height);
            const dw = img.width * s, dh = img.height * s;
            cx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
            URL.revokeObjectURL(url);
            return c.toDataURL('image/jpeg', 0.7);
        } catch (e) { return null; }
    }

    // ---------- Gallery ----------
    async function openGallery() {
        window.__gameActive = true;

        const overlay = document.createElement('div');
        overlay.className = 'game-overlay osu-gallery';
        overlay.innerHTML =
            '<button class="game-close" aria-label="Close">&times;</button>' +
            '<div class="osu-panel">' +
            '<div class="osu-head"><span class="osu-logo">osu!</span><span class="osu-mode">mania 4K</span></div>' +
            '<label class="osu-load">Load beatmap (.osz)<input type="file" accept=".osz,.zip" hidden></label>' +
            '<div class="osu-list"></div>' +
            '<div class="osu-foot">Maps stay in your browser · respect music copyright</div>' +
            '</div>';
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('show'));

        const listEl = overlay.querySelector('.osu-list');
        const input = overlay.querySelector('input[type=file]');
        const loadLabel = overlay.querySelector('.osu-load');
        const loadText = loadLabel.childNodes[0];

        async function refresh() {
            const maps = await dbAll();
            listEl.textContent = '';
            if (!maps.length) {
                const empty = document.createElement('div');
                empty.className = 'osu-empty';
                empty.textContent = 'No beatmaps yet — load an .osz to start playing.';
                listEl.appendChild(empty);
                return;
            }
            maps.sort((a, b) => b.id - a.id).forEach((m) => listEl.appendChild(mapCard(m, refresh)));
        }
        refresh();

        input.addEventListener('change', async () => {
            const file = input.files && input.files[0];
            if (!file) return;
            loadText.nodeValue = 'Reading…';
            try {
                const info = await readOsz(file);
                const thumb = await makeThumb(info.bgBlob);
                await dbPut({
                    id: Date.now(),
                    title: info.title, artist: info.artist, creator: info.creator,
                    versions: info.diffs.map(d => d.version),
                    thumb: thumb,
                    blob: file
                });
                await refresh();
            } catch (err) {
                console.error('[osu] load .osz failed', err);
                alert(err.message || 'Could not read this .osz');
            }
            loadText.nodeValue = 'Load beatmap (.osz)';
            input.value = '';
        });

        function closeGallery() {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 300);
            document.removeEventListener('keydown', onKey);
            window.__gameActive = false;
        }
        overlay.querySelector('.game-close').addEventListener('click', closeGallery);
        function onKey(e) { if (e.key === 'Escape') closeGallery(); }
        document.addEventListener('keydown', onKey);

        // clica numa dificuldade -> abre o jogo
        overlay._play = async (rec, version) => {
            overlay.classList.remove('show');
            document.removeEventListener('keydown', onKey);
            setTimeout(() => overlay.remove(), 200);
            try {
                const info = await readOsz(rec.blob);
                const diff = info.diffs.find(d => d.version === version) || info.diffs[0];
                startGame(info, diff);
            } catch (err) {
                console.error('[osu] start beatmap failed', err);
                alert(err.message || 'Error loading beatmap');
                window.__gameActive = false;
            }
        };
        window.__osuOverlay = overlay;
    }

    function mapCard(rec, refresh) {
        const card = document.createElement('div');
        card.className = 'osu-card';
        if (rec.thumb) card.style.setProperty('--thumb', `url(${rec.thumb})`);
        else card.classList.add('no-thumb');

        const top = document.createElement('div');
        top.className = 'osu-card-top';

        const info = document.createElement('div');
        info.className = 'osu-card-info';
        const t = document.createElement('div'); t.className = 'osu-card-title'; t.textContent = rec.title || 'Untitled';
        const s = document.createElement('div'); s.className = 'osu-card-sub';
        s.textContent = `${rec.artist || '—'} · by ${rec.creator || '—'}`;
        info.appendChild(t); info.appendChild(s);

        const del = document.createElement('button'); del.className = 'osu-del'; del.textContent = '×';
        del.title = 'Remove';
        del.addEventListener('click', async (e) => { e.stopPropagation(); await dbDel(rec.id); refresh(); });

        top.appendChild(info); top.appendChild(del);

        const diffs = document.createElement('div');
        diffs.className = 'osu-diffs';
        (rec.versions || []).forEach((v, i) => {
            const pill = document.createElement('button');
            pill.className = 'osu-diff';
            pill.style.setProperty('--dot', DIFF_COLORS[Math.min(i, DIFF_COLORS.length - 1)]);
            pill.textContent = v;
            pill.addEventListener('click', (e) => {
                e.stopPropagation();
                if (window.__osuOverlay && window.__osuOverlay._play) window.__osuOverlay._play(rec, v);
            });
            diffs.appendChild(pill);
        });

        card.appendChild(top);
        card.appendChild(diffs);
        return card;
    }

    // ---------- Game ----------
    async function startGame(info, diff) {
        window.__gameActive = true;

        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const actx = new AudioCtx();
        // navegadores iniciam o contexto suspenso; retomar dentro do gesto do clique
        try { await actx.resume(); } catch (e) { }
        let audioBuffer;
        try {
            audioBuffer = await actx.decodeAudioData(await info.audioBlob.arrayBuffer());
        } catch (e) {
            console.error('[osu] audio decode failed', e);
            alert('Could not decode the beatmap audio.');
            window.__gameActive = false;
            return;
        }

        const overlay = document.createElement('div');
        overlay.className = 'game-overlay';
        overlay.innerHTML =
            (info.bgBlob ? '<div class="osu-bg"></div>' : '') +
            '<canvas class="game-canvas"></canvas>' +
            '<button class="game-close" aria-label="Close">&times;</button>' +
            '<div class="game-hint">D F J K · Esc to exit</div>';
        document.body.appendChild(overlay);
        if (info.bgBlob) overlay.querySelector('.osu-bg').style.backgroundImage = `url(${URL.createObjectURL(info.bgBlob)})`;
        requestAnimationFrame(() => overlay.classList.add('show'));

        const canvas = overlay.querySelector('.game-canvas');
        const ctx = canvas.getContext('2d');
        const W = window.innerWidth, H = window.innerHeight;
        canvas.width = W; canvas.height = H;

        const FW = Math.min(360, W - 40);
        const COLW = Math.floor(FW / COLS);
        const FIELD = COLW * COLS;
        const X0 = Math.round((W - FIELD) / 2);
        const HITY = Math.round(H * 0.84);
        const SCROLL = 600;                 // tempo (ms) que a nota leva do topo à linha
        const PXMS = HITY / SCROLL;
        const NOTE_H = 24;
        const REC_H = 46;
        const COL_COLORS = ['#ff77aa', '#5ec8ff', '#5ec8ff', '#ff77aa'];
        const WPERFECT = 42, WGREAT = 90, WGOOD = 140;
        const HUD = '"Space Grotesk", system-ui, Arial, sans-serif';
        const flash = [-9999, -9999, -9999, -9999];   // hit-lighting por coluna
        const songLen = (audioBuffer.duration || 0) * 1000;

        const notes = diff.notes.map(n => ({ ...n, judged: false, holding: false, tailDone: false }));
        let score = 0, combo = 0, maxCombo = 0;
        const counts = { perfect: 0, great: 0, good: 0, miss: 0 };
        let accSum = 0, accTotal = 0;
        const pressed = [false, false, false, false];
        let lastJudge = { text: '', t: -9999 };
        let finished = false, ended = false;

        const LEAD = 2.2;
        const startAt = actx.currentTime + LEAD;
        const src = actx.createBufferSource();
        src.buffer = audioBuffer;
        src.connect(actx.destination);
        src.start(startAt);
        function songTime() { return (actx.currentTime - startAt) * 1000; }

        function judge(delta) {
            const a = Math.abs(delta);
            if (a <= WPERFECT) { counts.perfect++; score += 300; accSum += 1; combo++; return 'PERFECT'; }
            if (a <= WGREAT) { counts.great++; score += 200; accSum += 0.66; combo++; return 'GREAT'; }
            counts.good++; score += 100; accSum += 0.33; combo++; return 'GOOD';
        }
        function registerJudge(text) { accTotal++; if (combo > maxCombo) maxCombo = combo; lastJudge = { text, t: songTime() }; }
        function miss() { counts.miss++; accTotal++; combo = 0; lastJudge = { text: 'MISS', t: songTime() }; }

        function hitColumn(col) {
            const now = songTime();
            let best = null, bestD = Infinity;
            for (const n of notes) {
                if (n.col !== col || n.judged) continue;
                const d = n.time - now;
                if (Math.abs(d) < Math.abs(bestD)) { bestD = d; best = n; }
                if (n.time - now > WGOOD) break;
            }
            if (best && Math.abs(bestD) <= WGOOD) {
                const text = judge(bestD);
                best.judged = true;
                if (best.isHold) best.holding = true;
                registerJudge(text);
                flash[col] = now;
            }
        }
        function releaseColumn(col) {
            const now = songTime();
            for (const n of notes) {
                if (n.col === col && n.holding && !n.tailDone) {
                    const d = n.end - now;
                    if (Math.abs(d) <= WGOOD) registerJudge(judge(d)); else miss();
                    n.holding = false; n.tailDone = true;
                }
            }
        }
        function update() {
            const now = songTime();
            for (const n of notes) {
                if (!n.judged && now - n.time > WGOOD) { n.judged = true; miss(); }
                if (n.holding && !n.tailDone && now >= n.end) { registerJudge(judge(n.end - now)); n.tailDone = true; n.holding = false; }
            }
            if (!finished && now > (notes.length ? notes[notes.length - 1].time + 1500 : 0)) finished = true;
        }

        function drawNote(x, y, w, col) {
            const h = NOTE_H;
            const g = ctx.createLinearGradient(0, y - h / 2, 0, y + h / 2);
            g.addColorStop(0, '#ffffff');
            g.addColorStop(0.45, col);
            g.addColorStop(1, col);
            ctx.fillStyle = g;
            roundRect(ctx, x, y - h / 2, w, h, 6); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            roundRect(ctx, x + 2, y - h / 2 + 2, w - 4, 4, 2); ctx.fill();
        }

        function draw() {
            const now = songTime();
            ctx.clearRect(0, 0, W, H);

            // ----- palco (stage) -----
            const sx = X0 - 8, sw = FIELD + 16;
            ctx.fillStyle = 'rgba(6,6,10,0.72)';
            ctx.fillRect(sx, 0, sw, H);
            ctx.fillStyle = 'rgba(255,255,255,0.13)';
            ctx.fillRect(sx, 0, 2, H);
            ctx.fillRect(sx + sw - 2, 0, 2, H);

            // ----- hit lighting (brilho na coluna ao acertar) -----
            for (let c = 0; c < COLS; c++) {
                const dt = now - flash[c];
                if (dt >= 0 && dt < 160) {
                    const a = (1 - dt / 160) * 0.5;
                    const g = ctx.createLinearGradient(0, HITY - 220, 0, HITY);
                    g.addColorStop(0, 'rgba(0,0,0,0)');
                    g.addColorStop(1, hexA(COL_COLORS[c], a));
                    ctx.fillStyle = g;
                    ctx.fillRect(X0 + c * COLW, HITY - 220, COLW, 220);
                }
            }

            // ----- separadores das colunas -----
            ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
            for (let c = 1; c < COLS; c++) {
                ctx.beginPath(); ctx.moveTo(X0 + c * COLW, 0); ctx.lineTo(X0 + c * COLW, H); ctx.stroke();
            }

            // ----- notas -----
            for (const n of notes) {
                if (n.judged && !n.isHold) continue;
                if (n.isHold && n.tailDone) continue;
                const y = HITY - (n.time - now) * PXMS;
                const x = X0 + n.col * COLW + 5, w = COLW - 10;
                const col = COL_COLORS[n.col];
                if (n.isHold) {
                    const yEnd = HITY - (n.end - now) * PXMS;
                    const top = Math.min(y, yEnd), bot = Math.max(y, yEnd);
                    if (bot < -30 || top > H + 30) continue;
                    ctx.fillStyle = hexA(col, 0.26);
                    roundRect(ctx, x, top, w, bot - top, 6); ctx.fill();
                    if (!n.judged) drawNote(x, y, w, col);
                } else {
                    if (y < -30 || y > H + 30) continue;
                    drawNote(x, y, w, col);
                }
            }

            // ----- receptores -----
            for (let c = 0; c < COLS; c++) {
                const x = X0 + c * COLW + 5, w = COLW - 10;
                const on = pressed[c];
                ctx.fillStyle = on ? hexA(COL_COLORS[c], 0.85) : 'rgba(255,255,255,0.09)';
                roundRect(ctx, x, HITY - REC_H / 2, w, REC_H, 8); ctx.fill();
                ctx.strokeStyle = on ? '#ffffff' : hexA(COL_COLORS[c], 0.5);
                ctx.lineWidth = 2;
                roundRect(ctx, x, HITY - REC_H / 2, w, REC_H, 8); ctx.stroke();
            }

            // ----- barra de progresso (topo) -----
            const prog = songLen ? Math.min(1, Math.max(0, now / songLen)) : 0;
            ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(0, 0, W, 4);
            ctx.fillStyle = '#ff77aa'; ctx.fillRect(0, 0, W * prog, 4);

            // ----- HUD: música -----
            ctx.textAlign = 'left';
            ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.font = '700 16px ' + HUD;
            ctx.fillText(info.title || 'Untitled', 22, 34);
            ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '400 12px ' + HUD;
            ctx.fillText((info.artist || '') + '  ·  ' + (diff.version || ''), 22, 52);

            // ----- HUD: accuracy + score -----
            const acc = accTotal ? (accSum / accTotal * 100) : 100;
            ctx.textAlign = 'right';
            ctx.fillStyle = '#fff'; ctx.font = '700 22px ' + HUD;
            ctx.fillText(acc.toFixed(2) + '%', W - 22, 34);
            ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '500 13px ' + HUD;
            ctx.fillText(String(score).padStart(7, '0'), W - 22, 54);

            // ----- combo -----
            if (combo > 1) {
                ctx.textAlign = 'center';
                ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.font = '700 46px ' + HUD;
                ctx.fillText(combo + 'x', X0 + FIELD / 2, H * 0.42);
            }

            // ----- julgamento -----
            const jd = now - lastJudge.t;
            if (jd < 420 && lastJudge.text) {
                const colors = { PERFECT: '#ffd54a', GREAT: '#5ec8ff', GOOD: '#7bed7b', MISS: '#ff5a5a' };
                const pop = jd < 90 ? 1 + (90 - jd) / 90 * 0.25 : 1;
                ctx.save();
                ctx.translate(X0 + FIELD / 2, H * 0.50);
                ctx.scale(pop, pop);
                ctx.textAlign = 'center';
                ctx.globalAlpha = Math.max(0, 1 - jd / 420);
                ctx.fillStyle = colors[lastJudge.text] || '#fff'; ctx.font = '700 24px ' + HUD;
                ctx.fillText(lastJudge.text, 0, 0);
                ctx.restore();
            }

            // ----- contagem regressiva -----
            if (now < 0) {
                ctx.textAlign = 'center';
                ctx.fillStyle = '#fff'; ctx.font = '700 64px ' + HUD;
                ctx.fillText(Math.ceil(-now / 1000), X0 + FIELD / 2, H * 0.46);
            }

            if (finished) results();
        }

        function results() {
            if (ended) return; ended = true;
            try { src.stop(); } catch (e) {}
            ctx.fillStyle = 'rgba(0,0,0,0.72)'; ctx.fillRect(0, 0, W, H);
            const cx = W / 2, y0 = H * 0.32;
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ff77aa'; ctx.font = '700 40px ' + HUD;
            ctx.fillText('Cleared', cx, y0);
            const acc = accTotal ? (accSum / accTotal * 100) : 100;
            ctx.fillStyle = '#fff'; ctx.font = '700 30px ' + HUD;
            ctx.fillText(acc.toFixed(2) + '%', cx, y0 + 46);
            ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = '400 15px ' + HUD;
            ctx.fillText('Score ' + String(score).padStart(7, '0') + '  ·  Max combo ' + maxCombo + 'x', cx, y0 + 82);
            ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '400 14px ' + HUD;
            ctx.fillText('Perfect ' + counts.perfect + '   Great ' + counts.great + '   Good ' + counts.good + '   Miss ' + counts.miss, cx, y0 + 110);
            ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '400 13px ' + HUD;
            ctx.fillText('Esc to exit', cx, y0 + 146);
        }

        let raf;
        function loop() { update(); draw(); if (!ended) raf = requestAnimationFrame(loop); }
        loop();

        function onDown(e) {
            if (e.key === 'Escape') { close(); return; }
            const c = KEYS.indexOf(e.key.toLowerCase());
            if (c >= 0 && !e.repeat) { e.preventDefault(); pressed[c] = true; hitColumn(c); }
        }
        function onUp(e) {
            const c = KEYS.indexOf(e.key.toLowerCase());
            if (c >= 0) { pressed[c] = false; releaseColumn(c); }
        }
        document.addEventListener('keydown', onDown);
        document.addEventListener('keyup', onUp);
        overlay.querySelector('.game-close').addEventListener('click', close);
        function onHide() { if (document.hidden) close(); }
        document.addEventListener('visibilitychange', onHide);

        function close() {
            ended = true;
            cancelAnimationFrame(raf);
            try { src.stop(); } catch (e) {}
            try { actx.close(); } catch (e) {}
            document.removeEventListener('keydown', onDown);
            document.removeEventListener('keyup', onUp);
            document.removeEventListener('visibilitychange', onHide);
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 300);
            window.__gameActive = false;
        }
    }

    function hexA(hex, a) {
        const n = parseInt(hex.slice(1), 16);
        return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
    }

    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }
})();
