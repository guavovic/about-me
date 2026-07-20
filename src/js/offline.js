(function () {
    const badge = document.getElementById('offline-badge');
    if (!badge) return;

    function update() {
        badge.classList.toggle('show', !navigator.onLine);
    }

    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    update();
})();
