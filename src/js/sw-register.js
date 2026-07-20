// Registro do service worker.
// Extraido do <script> inline do index.html para permitir uma
// Content-Security-Policy sem 'unsafe-inline' em script-src.
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        navigator.serviceWorker.register('sw.js').catch(function () { });
    });
}
