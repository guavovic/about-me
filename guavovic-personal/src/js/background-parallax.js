let targetX = 0;
let targetY = 0;
let currentX = 0;
let currentY = 0;

document.addEventListener('mousemove', (event) => {
    const { clientX, clientY } = event;
    const { innerWidth, innerHeight } = window;

    // Calcula a posição com uma faixa maior (-50% a 150%)
    targetX = ((clientX / innerWidth) * 200) - 50;
    targetY = ((clientY / innerHeight) * 200) - 50;
});

function lerp(start, end, t) {
    return start + (end - start) * t;
}

function animate() {
    currentX = lerp(currentX, targetX, 0.1);
    currentY = lerp(currentY, targetY, 0.1);

    document.querySelector('.background-gif').style.backgroundPosition = `${currentX}% ${currentY}%`;

    requestAnimationFrame(animate);
}

animate();