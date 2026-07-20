(function () {
    const link = document.getElementById('favicon');
    const card = document.getElementById('now-playing');
    if (!link || !card) return;

    const ORIGINAL = link.href;

    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    // 3 barras estilo equalizer; cada uma oscila em fase diferente
    const bars = [
        { x: 5, phase: 0.0 },
        { x: 13, phase: 0.66 },
        { x: 21, phase: 1.33 }
    ];
    const BAR_W = 6;

    let animating = false;
    let start = 0;

    function draw(t) {
        ctx.clearRect(0, 0, 32, 32);
        ctx.fillStyle = '#1db954';
        bars.forEach(b => {
            const level = 0.5 + 0.5 * Math.sin(t / 180 + b.phase * Math.PI);
            const h = 6 + level * 22; // 6..28 px
            ctx.fillRect(b.x, 32 - h, BAR_W, h);
        });
        link.href = canvas.toDataURL('image/png');
    }

    function frame(now) {
        if (!animating) return;
        draw(now);
        setTimeout(() => requestAnimationFrame(frame), 120); // ~8fps
    }

    function startAnim() {
        if (animating) return;
        animating = true;
        requestAnimationFrame(frame);
    }

    function stopAnim() {
        if (!animating) return;
        animating = false;
        link.href = ORIGINAL; 
    }

    const observer = new MutationObserver(() => {
        if (card.classList.contains('is-live')) startAnim();
        else stopAnim();
    });
    observer.observe(card, { attributes: true, attributeFilter: ['class'] });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stopAnim();
        else if (card.classList.contains('is-live')) startAnim();
    });
})();
