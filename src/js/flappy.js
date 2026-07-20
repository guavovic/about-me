(function () {
    // ---- Easter egg: digite "flappy" para jogar ----
    const SECRET = 'flappy';
    let buffer = '';

    document.addEventListener('keydown', (e) => {
        if (e.key.length !== 1) return;
        buffer = (buffer + e.key.toLowerCase()).slice(-SECRET.length);
        // trava global: só um jogo aberto por vez
        if (buffer === SECRET) { buffer = ''; if (!window.__gameActive) openGame(); }
    });

    function loadFace() {
        const sources = [
            (typeof CONFIG !== 'undefined' && CONFIG.FLAPPY_FACE) || 'images/bianca.jpg',
            'images/us.jpg',
            'images/profile.jpg'
        ];
        const img = new Image();
        let i = 0;
        img.onerror = () => { i++; if (i < sources.length) img.src = sources[i]; };
        img.src = sources[0];
        return img;
    }

    function openGame() {
        window.__gameActive = true;

        const overlay = document.createElement('div');
        overlay.className = 'game-overlay';
        overlay.innerHTML =
            '<canvas class="game-canvas"></canvas>' +
            '<button class="game-close" aria-label="Close">&times;</button>' +
            '<div class="game-hint">Click or space to fly · Esc to exit</div>';
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('show'));

        const canvas = overlay.querySelector('.game-canvas');
        const ctx = canvas.getContext('2d');

        const W = window.innerWidth;
        const H = window.innerHeight;
        canvas.width = W;
        canvas.height = H;

        const face = loadFace();

        // ---- física (leve/fácil, escalada pela tela) ----
        const R = Math.round(Math.min(W, H) * 0.035);
        const GRAV = H * 0.00040;
        const FLAP = -H * 0.0100;
        const GAP = Math.round(H * 0.38);
        const PIPE_W = Math.round(W * 0.05);
        const SPEED = W * 0.0026;
        const SPACING = W * 0.62; // distância horizontal entre canos
        let bird, pipes, score, best, state;

        try { best = parseInt(localStorage.getItem('flappy-best') || '0', 10); } catch (e) { best = 0; }

        function reset() {
            bird = { x: W * 0.26, y: H / 2, vy: 0 };
            pipes = [];
            score = 0;
            state = 'ready';
        }
        reset();

        function flap() {
            if (state === 'ready') state = 'playing';
            if (state === 'playing') bird.vy = FLAP;
            if (state === 'dead') reset();
        }

        function spawnPipe() {
            const margin = H * 0.10;
            const gapY = margin + Math.random() * (H - GAP - margin * 2);
            pipes.push({ x: W, gapY: gapY, passed: false });
        }

        function update() {
            if (state !== 'playing') return;
            bird.vy += GRAV;
            bird.y += bird.vy;

            if (!pipes.length || pipes[pipes.length - 1].x < W - SPACING) spawnPipe();

            pipes.forEach(p => { p.x -= SPEED; });
            pipes = pipes.filter(p => p.x + PIPE_W > 0);

            if (bird.y + R > H || bird.y - R < 0) die();
            pipes.forEach(p => {
                if (bird.x + R > p.x && bird.x - R < p.x + PIPE_W) {
                    if (bird.y - R < p.gapY || bird.y + R > p.gapY + GAP) die();
                }
                if (!p.passed && p.x + PIPE_W < bird.x) { p.passed = true; score++; }
            });
        }

        function die() {
            if (state !== 'playing') return;
            state = 'dead';
            if (score > best) { best = score; try { localStorage.setItem('flappy-best', String(best)); } catch (e) {} }
        }

        function roundRect(x, y, w, h, r) {
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.arcTo(x + w, y, x + w, y + h, r);
            ctx.arcTo(x + w, y + h, x, y + h, r);
            ctx.arcTo(x, y + h, x, y, r);
            ctx.arcTo(x, y, x + w, y, r);
            ctx.closePath();
        }

        function draw() {
            ctx.clearRect(0, 0, W, H); // transparente: mostra o site borrado atrás

            ctx.fillStyle = '#1db954';
            pipes.forEach(p => {
                roundRect(p.x, 0, PIPE_W, p.gapY, 10); ctx.fill();
                roundRect(p.x, p.gapY + GAP, PIPE_W, H - p.gapY - GAP, 10); ctx.fill();
            });

            // pássaro (foto)
            ctx.save();
            ctx.translate(bird.x, bird.y);
            ctx.rotate(Math.max(-0.5, Math.min(0.9, bird.vy / 12)));
            ctx.beginPath();
            ctx.arc(0, 0, R, 0, Math.PI * 2);
            ctx.closePath();
            ctx.strokeStyle = '#ff9db3';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.clip();
            if (face.complete && face.naturalWidth) ctx.drawImage(face, -R, -R, R * 2, R * 2);
            else { ctx.fillStyle = '#ff9db3'; ctx.fillRect(-R, -R, R * 2, R * 2); }
            ctx.restore();

            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.font = `bold ${Math.round(H * 0.06)}px Arial`;
            ctx.fillText(score, W / 2, H * 0.12);

            if (state === 'ready') banner('Flappy Bianca 💛', 'Click to start');
            else if (state === 'dead') banner('Game Over', `Score ${score} · Best ${best}`, 'Click to play again');
        }

        function banner(title, sub, sub2) {
            ctx.textAlign = 'center';
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 34px Arial';
            ctx.fillText(title, W / 2, H / 2 - 16);
            ctx.font = '17px Arial';
            ctx.fillStyle = '#ddd';
            ctx.fillText(sub, W / 2, H / 2 + 16);
            if (sub2) ctx.fillText(sub2, W / 2, H / 2 + 42);
        }

        let raf;
        function loop() { update(); draw(); raf = requestAnimationFrame(loop); }
        loop();

        function onKey(e) {
            if (e.key === 'Escape') { close(); return; }
            if (e.code === 'Space' || e.key === ' ') { e.preventDefault(); flap(); }
        }
        canvas.addEventListener('click', flap);
        canvas.addEventListener('touchstart', (e) => { e.preventDefault(); flap(); }, { passive: false });
        document.addEventListener('keydown', onKey);
        overlay.querySelector('.game-close').addEventListener('click', close);

        // fecha o jogo se a aba perder o foco (não fica rodando escondido)
        function onHide() { if (document.hidden) close(); }
        document.addEventListener('visibilitychange', onHide);

        function close() {
            cancelAnimationFrame(raf);
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('visibilitychange', onHide);
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 350);
            window.__gameActive = false;
        }
    }
})();
