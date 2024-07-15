document.addEventListener('DOMContentLoaded', function() {
    const animateOnClickElements = document.querySelectorAll('.profile-img, h1, p');

    animateOnClickElements.forEach(element => {
        let animationTimeout = null;
        let isAnimating = false;

        element.addEventListener('click', function () {
            if (!isAnimating) {
                isAnimating = true;
        
                clearTimeout(animationTimeout);
                element.classList.remove('gelatine-animation');

                void element.offsetWidth;

                element.classList.add('gelatine-animation');

                animationTimeout = setTimeout(function() {
                    element.classList.remove('gelatine-animation');
                    isAnimating = false;
                }, 500); // Duração da animação em ms
            }
        });
    });
});

// document.addEventListener('mousemove', function(e) {
//     const bg = document.querySelector('.background-gif');
//     const mouseX = e.clientX / window.innerWidth - 0.5;
//     const mouseY = e.clientY / window.innerHeight - 0.5;
//     const translateX = mouseX * 100; 
//     const translateY = mouseY * 100;

//     bg.style.transform = `translate(-50%, -50%) translate(${translateX}px, ${translateY}px)`;
// });