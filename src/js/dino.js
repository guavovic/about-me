(function () {
    // ---- Easter egg: digite "dino" para jogar ----
    const SECRET = 'dino';
    let buffer = '';

    document.addEventListener('keydown', (e) => {
        if (e.key.length !== 1) return;
        buffer = (buffer + e.key.toLowerCase()).slice(-SECRET.length);
        // trava global: só um jogo aberto por vez
        if (buffer === SECRET) { buffer = ''; if (!window.__gameActive) openGame(); }
    });

    function loadFace() {
        const sources = [
            (typeof CONFIG !== 'undefined' && CONFIG.DINO_FACE) || 'images/dino.jpg',
            'images/bianca.jpg', 'images/us.jpg', 'images/profile.jpg'
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
            '<div class="game-hint">Space/↑ jump · ↓ duck · Esc to exit</div>';
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('show'));

        const canvas = overlay.querySelector('.game-canvas');
        const ctx = canvas.getContext('2d');
        const W = window.innerWidth, H = window.innerHeight;
        canvas.width = W; canvas.height = H;

        const face = loadFace();

        const GROUND = Math.round(H * 0.72);
        const S = Math.max(48, Math.min(110, Math.round(H * 0.11))); // tamanho do personagem
        const GRAV = H * 0.0013;
        const JUMP = -H * 0.029;

        let dino, obs, score, best, state, speed, distNext, ducking, tick;

        try { best = parseInt(localStorage.getItem('dino-best') || '0', 10); } catch (e) { best = 0; }

        function reset() {
            dino = { x: W * 0.14, y: GROUND - S, vy: 0, onGround: true };
            obs = [];
            score = 0;
            speed = W * 0.0045;
            distNext = W * 0.6;
            ducking = false;
            tick = 0;
            state = 'ready';
        }
        reset();

        function jump() {
            if (state === 'ready') { state = 'playing'; return; }
            if (state === 'dead') { reset(); return; }
            if (dino.onGround) { dino.vy = JUMP; dino.onGround = false; }
        }

        function dinoBox() {
            if (ducking && dino.onGround) {
                const h = S * 0.55, w = S * 1.15;
                return { x: dino.x, y: GROUND - h, w: w, h: h };
            }
            return { x: dino.x + S * 0.15, y: dino.y, w: S * 0.7, h: S };
        }

        function spawn() {
            // pássaros só depois de aquecer; senão, cactos
            const canBird = score > 45 && Math.random() < 0.4;
            if (canBird) {
                // dois níveis: baixo (pular) ou alto (abaixar)
                const high = Math.random() < 0.55;
                const bh = S * 0.5;
                const y = high ? (GROUND - S * 1.35) : (GROUND - S * 0.55);
                obs.push({ type: 'bird', x: W, w: S * 0.9, h: bh, y: y, bob: Math.random() * 6 });
            } else {
                const h = S * (0.6 + Math.random() * 0.7);
                const w = S * (0.28 + Math.random() * 0.28);
                obs.push({ type: 'cactus', x: W, w: w, h: h, y: GROUND - h });
            }
        }

        function update() {
            if (state !== 'playing') return;
            tick++;

            // gravidade (mais forte se abaixando no ar = queda rápida)
            dino.vy += GRAV * (ducking && !dino.onGround ? 2.4 : 1);
            dino.y += dino.vy;
            if (dino.y >= GROUND - S) { dino.y = GROUND - S; dino.vy = 0; dino.onGround = true; }

            speed += H * 0.0000003 * 16; // ramp-up mais suave
            distNext -= speed;
            if (distNext <= 0) {
                spawn();
                const gap = W * (0.52 + Math.random() * 0.30);
                distNext = Math.max(W * 0.42, gap - score * 0.2);
            }

            obs.forEach(o => { o.x -= speed; });
            obs = obs.filter(o => o.x + o.w > 0);

            const d = dinoBox();
            obs.forEach(o => {
                const oy = o.type === 'bird' ? o.y : o.y;
                if (d.x < o.x + o.w && d.x + d.w > o.x && d.y < oy + o.h && d.y + d.h > oy) die();
            });

            score += 0.15;
        }

        function die() {
            if (state !== 'playing') return;
            state = 'dead';
            const s = Math.floor(score);
            if (s > best) { best = s; try { localStorage.setItem('dino-best', String(best)); } catch (e) {} }
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

        function faceCircle(cx, cy, r) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.closePath();
            ctx.strokeStyle = '#ff9db3';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.clip();
            if (face.complete && face.naturalWidth) ctx.drawImage(face, cx - r, cy - r, r * 2, r * 2);
            else { ctx.fillStyle = '#ff9db3'; ctx.fillRect(cx - r, cy - r, r * 2, r * 2); }
            ctx.restore();
        }

        function draw() {
            ctx.clearRect(0, 0, W, H); // transparente

            // chão
            ctx.strokeStyle = 'rgba(255,255,255,0.35)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, GROUND);
            ctx.lineTo(W, GROUND);
            ctx.stroke();

            // obstáculos
            obs.forEach(o => {
                if (o.type === 'cactus') {
                    ctx.fillStyle = '#1db954';
                    roundRect(o.x, o.y, o.w, o.h, 6); ctx.fill();
                } else {
                    // pássaro: foto + asas batendo + leve balanço
                    const flap = Math.sin(tick / 6) * 8;
                    const bx = o.x + o.w / 2, by = o.y + o.h / 2 + Math.sin(tick / 20) * 4;
                    const r = o.h / 2 + 6;
                    ctx.fillStyle = '#ff5a82';
                    ctx.beginPath();
                    ctx.moveTo(bx - r, by);
                    ctx.lineTo(bx - r - 20, by - flap);
                    ctx.lineTo(bx - r - 20, by + 10);
                    ctx.closePath(); ctx.fill();
                    ctx.beginPath();
                    ctx.moveTo(bx + r, by);
                    ctx.lineTo(bx + r + 20, by - flap);
                    ctx.lineTo(bx + r + 20, by + 10);
                    ctx.closePath(); ctx.fill();
                    faceCircle(bx, by, r);
                }
            });

            // personagem (Bianca)
            const d = dinoBox();
            ctx.save();
            roundRect(d.x, d.y, d.w, d.h, 8);
            ctx.strokeStyle = '#ff9db3'; ctx.lineWidth = 3; ctx.stroke();
            ctx.clip();
            if (face.complete && face.naturalWidth) ctx.drawImage(face, d.x, d.y, d.w, d.h);
            else { ctx.fillStyle = '#ff9db3'; ctx.fillRect(d.x, d.y, d.w, d.h); }
            ctx.restore();

            // placar
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'right';
            ctx.font = `bold ${Math.round(H * 0.03)}px Arial`;
            ctx.fillText(String(Math.floor(score)).padStart(5, '0'), W - 24, H * 0.08);

            if (state === 'ready') banner('Dino Bianca 🦖💛', 'Click or space to start');
            else if (state === 'dead') banner('Game Over', `Score ${Math.floor(score)} · Best ${best}`, 'Click to play again');
        }

        function banner(title, sub, sub2) {
            ctx.textAlign = 'center';
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 32px Arial';
            ctx.fillText(title, W / 2, H * 0.34);
            ctx.font = '16px Arial';
            ctx.fillStyle = '#ddd';
            ctx.fillText(sub, W / 2, H * 0.34 + 30);
            if (sub2) ctx.fillText(sub2, W / 2, H * 0.34 + 54);
        }

        let raf;
        function loop() { update(); draw(); raf = requestAnimationFrame(loop); }
        loop();

        function onKeyDown(e) {
            if (e.key === 'Escape') { close(); return; }
            if (e.code === 'Space' || e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); jump(); }
            if (e.key === 'ArrowDown') { e.preventDefault(); ducking = true; }
        }
        function onKeyUp(e) {
            if (e.key === 'ArrowDown') ducking = false;
        }
        canvas.addEventListener('click', jump);
        canvas.addEventListener('touchstart', (e) => { e.preventDefault(); jump(); }, { passive: false });
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
        overlay.querySelector('.game-close').addEventListener('click', close);

        // fecha o jogo se a aba perder o foco (não fica rodando escondido)
        function onHide() { if (document.hidden) close(); }
        document.addEventListener('visibilitychange', onHide);

        function close() {
            cancelAnimationFrame(raf);
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('keyup', onKeyUp);
            document.removeEventListener('visibilitychange', onHide);
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 350);
            window.__gameActive = false;
        }
    }
})();
