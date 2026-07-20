(function () {
    const cfg = (typeof CONFIG !== 'undefined' && CONFIG.ANNIVERSARY) || null;
    if (!cfg) return;

    const now = new Date();
    const day = now.getDate();
    const days = cfg.DAYS;
    if (!days.includes(day)) return; // só ativa nos dias configurados

    // cria o cartão de aniversário
    const card = document.createElement('div');
    card.className = 'anniv-card';

    const photo = cfg.PHOTO ? `<img class="anniv-photo" src="${cfg.PHOTO}" alt="us" onerror="this.remove()">` : '';

    let embed = '';
    if (cfg.SPOTIFY_ID) {
        const type = cfg.SPOTIFY_TYPE || 'playlist';
        embed = `<iframe class="anniv-spotify" ` +
            `src="https://open.spotify.com/embed/${type}/${cfg.SPOTIFY_ID}?utm_source=generator&theme=0" ` +
            `height="80" frameborder="0" ` +
            `allow="encrypted-media; clipboard-write"></iframe>`;
    }

    card.innerHTML =
        `<button class="anniv-close" aria-label="Close">&times;</button>` +
        photo +
        `<div class="anniv-info">` +
        `<div class="anniv-title">Feliz aniversário de namoro 💛</div>` +
        `<div class="anniv-phrase"></div>` +
        `</div>` +
        embed;

    document.body.appendChild(card);
    // mostra o cartão com leve atraso para permitir animação de entrada
    setTimeout(() => card.classList.add('show'), 1000);

    // frases que aparecem no cartão, alternando a cada 4s
    const phrases = cfg.PHRASES && cfg.PHRASES.length ? cfg.PHRASES : ['Te amo 💛'];
    const phraseEl = card.querySelector('.anniv-phrase');
    let pi = Math.floor(Math.random() * phrases.length);
    phraseEl.textContent = phrases[pi];
    const phraseTimer = setInterval(() => {
        phraseEl.style.opacity = '0';
        setTimeout(() => {
            pi = (pi + 1) % phrases.length;
            phraseEl.textContent = phrases[pi];
            phraseEl.style.opacity = '';
        }, 300);
    }, 4000);

    // fecha o cartão ao clicar no botão de fechar
    function close() {
        card.classList.remove('show');
        clearInterval(phraseTimer);
        clearInterval(heartTimer);
        setTimeout(() => card.remove(), 400);
    }
    card.querySelector('.anniv-close').addEventListener('click', close);

    // cria corações que flutuam na tela, com leve deriva horizontal
    const HEARTS = ['❤️', '💛', '💕', '💗'];
    const heartTimer = setInterval(() => {
        const h = document.createElement('span');
        h.className = 'egg-heart';
        h.textContent = HEARTS[Math.floor(Math.random() * HEARTS.length)];
        const dur = 5 + Math.random() * 3;
        h.style.left = Math.random() * 100 + 'vw';
        h.style.fontSize = 14 + Math.random() * 20 + 'px';
        h.style.opacity = '0.7';
        h.style.setProperty('--drift', (Math.random() * 2 - 1) * 80 + 'px');
        h.style.animationDuration = dur + 's';
        document.body.appendChild(h);
        setTimeout(() => h.remove(), dur * 1000 + 200);
    }, 900);
})();
