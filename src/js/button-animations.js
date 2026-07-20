document.addEventListener('DOMContentLoaded', function () {
    // animação de introdução (fade-in). A animação é removida após 1.6s
    const INTRO_DURATION = 1600;
    setTimeout(function () {
        document.body.classList.remove('intro');
    }, INTRO_DURATION);

    // animação de clique (gelatina). A animação é reiniciada se o usuário clicar novamente antes de terminar
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

                animationTimeout = setTimeout(function () {
                    element.classList.remove('gelatine-animation');
                    isAnimating = false;
                }, 500);
            }
        });
    });

    // toast de notificação
    const toast = document.getElementById('toast');
    let toastTimeout = null;

    function showToast(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => toast.classList.remove('show'), 2000);
    }

    // copiar handle para clipboard ao clicar no título
    const title = document.getElementById('profile-title');
    if (title) {
        title.style.cursor = 'pointer';
        title.addEventListener('click', async function () {
            const handle = title.textContent.trim();
            try {
                await navigator.clipboard.writeText(handle);
            } catch (e) {
                // fallback para navegadores sem clipboard API
                const tmp = document.createElement('textarea');
                tmp.value = handle;
                document.body.appendChild(tmp);
                tmp.select();
                document.execCommand('copy');
                document.body.removeChild(tmp);
            }
            showToast('Copied ' + handle + ' to clipboard');

            // dispara a animação de confete
            if (typeof window.confettiBurst === 'function') {
                const r = title.getBoundingClientRect();
                window.confettiBurst(r.left + r.width / 2, r.top + r.height / 2);
            }
        });
    }
});
