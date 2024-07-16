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