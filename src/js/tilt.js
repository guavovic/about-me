(function () {
    const card = document.querySelector('.profile-container');
    if (!card) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    if (!window.matchMedia('(pointer: fine)').matches) return;

    const MAX_TILT = 6; // graus

    let targetRX = 0, targetRY = 0;
    let currentRX = 0, currentRY = 0;
    let running = false;

    function onMove(e) {
        const nx = (e.clientX / window.innerWidth) * 2 - 1;
        const ny = (e.clientY / window.innerHeight) * 2 - 1;
        targetRY = nx * MAX_TILT;
        targetRX = -ny * MAX_TILT;
        if (!running) { running = true; requestAnimationFrame(loop); }
    }

    function lerp(a, b, t) { return a + (b - a) * t; }

    function loop() {
        currentRX = lerp(currentRX, targetRX, 0.1);
        currentRY = lerp(currentRY, targetRY, 0.1);

        card.style.transform =
            `perspective(700px) rotateX(${currentRX.toFixed(2)}deg) rotateY(${currentRY.toFixed(2)}deg)`;

        if (Math.abs(currentRX - targetRX) > 0.01 || Math.abs(currentRY - targetRY) > 0.01) {
            requestAnimationFrame(loop);
        } else {
            running = false;
        }
    }

    document.addEventListener('mouseleave', () => {
        targetRX = 0; targetRY = 0;
        if (!running) { running = true; requestAnimationFrame(loop); }
    });

    document.addEventListener('mousemove', onMove);
})();
