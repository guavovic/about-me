const background = document.querySelector('.background-video');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// respeita quem prefere menos movimento: congela o vídeo de fundo
if (background && prefersReducedMotion && typeof background.pause === 'function') {
    background.removeAttribute('autoplay');
    background.pause();
}

// deslocamento máximo em cada eixo (px)
const MAX_OFFSET_X = 120;
const MAX_OFFSET_Y = 80;

// distância segura do centro da tela (0..1). Evita que o fundo se mova demais em telas pequenas
const SAFE_RATIO = 0.08;

let targetX = 0;
let targetY = 0;
let currentX = 0;
let currentY = 0;

function updateTarget(clientX, clientY) {
    const { innerWidth, innerHeight } = window;

    const normalizedX = (clientX / innerWidth) * 2 - 1;
    const normalizedY = (clientY / innerHeight) * 2 - 1;

    const limitX = Math.min(MAX_OFFSET_X, innerWidth * SAFE_RATIO);
    const limitY = Math.min(MAX_OFFSET_Y, innerHeight * SAFE_RATIO);

    targetX = normalizedX * limitX;
    targetY = normalizedY * limitY;
}

document.addEventListener('mousemove', (event) => {
    updateTarget(event.clientX, event.clientY);
});

// suporte a toque em dispositivos móveis. O evento touchmove é usado para atualizar a posição do fundo com base no toque
document.addEventListener('touchmove', (event) => {
    const touch = event.touches[0];
    if (touch) updateTarget(touch.clientX, touch.clientY);
}, { passive: true });

function lerp(start, end, t) {
    return start + (end - start) * t;
}

function animate() {
    currentX = lerp(currentX, targetX, 0.08);
    currentY = lerp(currentY, targetY, 0.08);

    // aplica a transformação ao fundo. O toFixed(2) é usado para reduzir o número de casas decimais e melhorar a performance
    background.style.transform =
        `translate(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px)`;

    requestAnimationFrame(animate);
}

if (background && !prefersReducedMotion) {
    animate();
}
