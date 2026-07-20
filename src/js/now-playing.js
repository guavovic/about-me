(function () {
    const card = document.getElementById('now-playing');
    const art = document.getElementById('np-art');
    const titleEl = document.getElementById('np-title');
    const artistEl = document.getElementById('np-artist');
    const panel = document.getElementById('np-panel');
    const topList = document.getElementById('np-toplist');
    const closeBtn = document.getElementById('np-close');

    if (!card || typeof CONFIG === 'undefined' || !CONFIG.LASTFM_API_KEY) {
        return;
    }

    const API = 'https://ws.audioscrobbler.com/2.0/';
    const KEY = encodeURIComponent(CONFIG.LASTFM_API_KEY);
    const USER = encodeURIComponent(CONFIG.LASTFM_USER);

    const PLACEHOLDER = 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png';

    function pickImage(images) {
        if (!Array.isArray(images)) return PLACEHOLDER;
        const bySize = {};
        images.forEach(i => { bySize[i.size] = i['#text']; });
        const url = bySize.extralarge || bySize.large || bySize.medium || bySize.small;
        return url && url.trim() ? url : PLACEHOLDER;
    }

    // URL para pegar a música mais recente (ou a que está tocando agora)
    const recentUrl = `${API}?method=user.getrecenttracks&user=${USER}&api_key=${KEY}&format=json&limit=1`;

    async function updateNowPlaying() {
        try {
            const res = await fetch(recentUrl);
            if (!res.ok) return;

            const data = await res.json();
            const track = data.recenttracks && data.recenttracks.track && data.recenttracks.track[0];
            if (!track) return;

            const isNowPlaying = track['@attr'] && track['@attr'].nowplaying === 'true';
            const name = track.name;
            const artist = track.artist && (track.artist['#text'] || track.artist.name);

            if (isNowPlaying && name && artist) {
                // Está tocando algo: mostra o card com a música
                card.classList.add('is-live');
                card.classList.remove('not-live');

                titleEl.textContent = name;
                artistEl.textContent = artist;

                const imgUrl = pickImage(track.image);
                if (art.getAttribute('src') !== imgUrl) art.src = imgUrl;
                art.alt = `${artist} — ${name}`;
            } else {
                // Não está tocando nada: mostra mensagem e link para o histórico
                card.classList.remove('is-live');
                card.classList.add('not-live');

                titleEl.textContent = 'Not listening right now';
                artistEl.textContent = 'See what I’ve been playing →';
            }

            if (card.hidden) {
                card.hidden = false;
                requestAnimationFrame(() => card.classList.add('show'));
            }
        } catch (e) { }
    }

    // Top 5 da semana
    const topUrl = `${API}?method=user.gettoptracks&user=${USER}&api_key=${KEY}&period=7day&format=json&limit=5`;
    let topLoaded = false;

    async function loadTopTracks() {
        if (topLoaded) return;
        try {
            const res = await fetch(topUrl);
            if (!res.ok) return;

            const data = await res.json();
            const tracks = data.toptracks && data.toptracks.track;
            if (!Array.isArray(tracks) || !tracks.length) return;

            // constrói tudo com createElement + textContent (sem innerHTML):
            // nada vindo da API do Last.fm é interpretado como HTML.
            topList.textContent = '';
            tracks.forEach((t, i) => {
                const li = document.createElement('li');

                const rank = document.createElement('span');
                rank.className = 'np-rank';
                rank.textContent = String(i + 1);

                const text = document.createElement('span');
                text.className = 'np-toptext';

                const title = document.createElement('span');
                title.className = 'np-toptitle';
                title.textContent = t.name || '';

                const artist = document.createElement('span');
                artist.className = 'np-topartist';
                artist.textContent = (t.artist && (t.artist.name || t.artist['#text'])) || '';

                text.appendChild(title);
                text.appendChild(artist);

                const plays = document.createElement('span');
                plays.className = 'np-plays';
                plays.textContent = t.playcount ? `${t.playcount} plays` : '';

                li.appendChild(rank);
                li.appendChild(text);
                li.appendChild(plays);

                if (t.url) {
                    li.classList.add('clickable');
                    li.addEventListener('click', () => window.open(t.url, '_blank', 'noopener'));
                }
                topList.appendChild(li);
            });
            topLoaded = true;
        } catch (e) { }
    }

    function openPanel() {
        loadTopTracks();
        panel.hidden = false;
        requestAnimationFrame(() => panel.classList.add('show'));
        card.setAttribute('aria-expanded', 'true');
    }

    function closePanel() {
        panel.classList.remove('show');
        card.setAttribute('aria-expanded', 'false');
        setTimeout(() => { panel.hidden = true; }, 250);
    }

    card.addEventListener('click', () => {
        if (panel.hidden) openPanel(); else closePanel();
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => { e.stopPropagation(); closePanel(); });
    }

    // Fechar o painel se clicar fora dele ou apertar ESC 
    document.addEventListener('click', (e) => {
        if (!panel.hidden && !panel.contains(e.target) && !card.contains(e.target)) {
            closePanel();
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !panel.hidden) closePanel();
    });

    updateNowPlaying();
    setInterval(updateNowPlaying, CONFIG.NOW_PLAYING_POLL_MS || 30000);
})();
