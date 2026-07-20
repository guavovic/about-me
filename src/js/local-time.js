(function () {
    const el = document.getElementById('local-time');
    if (!el) return;

    const TIMEZONE = 'America/Sao_Paulo'; // horário de Santa Catarina
    const LABEL = 'Santa Catarina';

    const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    // exposto para o weather.js atualizar assim que o clima chegar
    window.renderLocalTime = function () {
        const time = formatter.format(new Date());
        const weather = window.__weather ? ` · ${window.__weather}` : '';
        el.textContent = `${time}${weather} in ${LABEL}`;
    };

    window.renderLocalTime();
    setInterval(window.renderLocalTime, 15000);
})();
