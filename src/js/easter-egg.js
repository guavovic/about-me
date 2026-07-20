(function () {
    // easter egg: digite "bianca" no teclado para ativar
    const SECRET = 'bianca';
    const NAME = 'Bianca';
    const HEARTS = ['❤️', '💖', '💕', '💗', '💓', '💞'];

    let buffer = '';
    let running = false;

    document.addEventListener('keydown', (e) => {
        // ignora teclas especiais
        if (e.key.length !== 1) return;

        buffer = (buffer + e.key.toLowerCase()).slice(-SECRET.length);
        if (buffer === SECRET) {
            buffer = '';
            trigger();
        }
    });

    function trigger() {
        if (running) return;
        if (window.__gameActive) return; // não dispara por cima de um jogo aberto
        running = true;

        spawnHearts(36);
        showName();

        setTimeout(() => { running = false; }, 3800);
    }

    function spawnHearts(count) {
        for (let i = 0; i < count; i++) {
            const h = document.createElement('span');
            h.className = 'egg-heart';
            h.textContent = HEARTS[Math.floor(Math.random() * HEARTS.length)];

            const left = Math.random() * 100; // posição horizontal em vw
            const size = 18 + Math.random() * 30; // tamanho da fonte
            const duration = 3 + Math.random() * 2.5; // duração da animação em segundos
            const delay = Math.random() * 1.2; // atraso antes de iniciar a animação em segundos
            const drift = (Math.random() * 2 - 1) * 120; // deriva horizontal em px

            h.style.left = left + 'vw';
            h.style.fontSize = size + 'px';
            h.style.setProperty('--drift', drift + 'px');
            h.style.animationDuration = duration + 's';
            h.style.animationDelay = delay + 's';

            document.body.appendChild(h);
            setTimeout(() => h.remove(), (duration + delay) * 1000 + 200);
        }
    }

    function showName() {
        const wrap = document.createElement('div');
        wrap.className = 'egg-name';
        wrap.innerHTML = `<span>${NAME} <em>💛</em></span>`;
        document.body.appendChild(wrap);

        requestAnimationFrame(() => wrap.classList.add('show'));

        setTimeout(() => wrap.classList.remove('show'), 3000);
        setTimeout(() => wrap.remove(), 3600);
    }
})();
