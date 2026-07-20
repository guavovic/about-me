// confete leve, sem dependências. window.confettiBurst(x, y) dispara do ponto.
(function () {
    const COLORS = ['#1db954', '#ff5a82', '#ffd93d', '#4dabf7', '#ffffff', '#c77dff'];

    window.confettiBurst = function (x, y) {
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduced) return;

        const count = 26;
        const particles = [];

        for (let i = 0; i < count; i++) {
            const el = document.createElement('span');
            el.className = 'confetti-piece';
            el.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
            document.body.appendChild(el);

            const angle = Math.random() * Math.PI * 2;
            const speed = 4 + Math.random() * 6;
            particles.push({
                el,
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 6, // impulso inicial para cima
                rot: Math.random() * 360,
                vr: (Math.random() * 2 - 1) * 18,
                life: 0,
                ttl: 60 + Math.random() * 30
            });
        }

        function tick() {
            let alive = false;
            particles.forEach(p => {
                if (p.life > p.ttl) { if (p.el.parentNode) p.el.remove(); return; }
                alive = true;
                p.life++;
                p.vy += 0.3; // gravidade
                p.vx *= 0.98; // atrito
                p.x += p.vx;
                p.y += p.vy;
                p.rot += p.vr;
                const opacity = Math.max(0, 1 - p.life / p.ttl);
                p.el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rot}deg)`;
                p.el.style.opacity = opacity;
            });
            if (alive) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    };
})();
