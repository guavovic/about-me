(function () {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const month = new Date().getMonth(); // 0 = janeiro ... 11 = dezembro
    if (month !== 11) return;            // só em dezembro

    const FLAKES = ['❄', '❅', '❆', '•'];
    const layer = document.createElement('div');
    layer.className = 'snow-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);

    function makeFlake() {
        const f = document.createElement('span');
        f.className = 'snowflake';
        f.textContent = FLAKES[Math.floor(Math.random() * FLAKES.length)];
        const size = 8 + Math.random() * 16;
        const dur = 6 + Math.random() * 6;
        f.style.left = Math.random() * 100 + 'vw';
        f.style.fontSize = size + 'px';
        f.style.opacity = 0.4 + Math.random() * 0.5;
        f.style.setProperty('--drift', (Math.random() * 2 - 1) * 60 + 'px');
        f.style.animationDuration = dur + 's';
        layer.appendChild(f);
        setTimeout(() => f.remove(), dur * 1000 + 200);
    }

    setInterval(makeFlake, 350);

    const currently = document.getElementById('currently');
    if (currently) currently.insertAdjacentText('afterbegin', '🎄 ');
})();
