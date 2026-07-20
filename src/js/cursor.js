(function () {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia('(pointer: fine)').matches;
    if (prefersReducedMotion || !fine) return; // só com mouse

    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    document.body.appendChild(glow);

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let x = mouseX, y = mouseY;
    let visible = false;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        if (!visible) { visible = true; glow.style.opacity = ''; }
    });

    document.addEventListener('mouseleave', () => {
        visible = false;
        glow.style.opacity = '0';
    });

    function loop() {
        // rastro suave: o brilho persegue o cursor com atraso
        x += (mouseX - x) * 0.15;
        y += (mouseY - y) * 0.15;
        glow.style.transform = `translate(${x}px, ${y}px)`;
        requestAnimationFrame(loop);
    }
    loop();
})();
