(function () {
    const el = document.getElementById('currently');
    if (!el) return;

    function greeting() {
        const h = new Date().getHours();
        if (h >= 5 && h < 12) return 'Good morning ☀️';
        if (h >= 12 && h < 18) return 'Good afternoon 🌤️';
        if (h >= 18 && h < 22) return 'Good evening 🌙';
        return 'Working late 🌌';
    }

    const phrases = (typeof CONFIG !== 'undefined' && CONFIG.STATUS_PHRASES) || ['building something'];

    // escolhe uma frase aleatória da lista e mostra junto com a saudação
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    el.textContent = `${greeting()} · ${phrase}`;
})();
