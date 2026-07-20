(function () {
    // Brusque / Santa Catarina
    const LAT = -27.098;
    const LON = -48.917;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weather_code`;

    // código WMO -> emoji
    function emoji(code) {
        if (code === 0) return '☀️';
        if (code === 1 || code === 2) return '🌤️';
        if (code === 3) return '☁️';
        if (code === 45 || code === 48) return '🌫️';
        if (code >= 51 && code <= 57) return '🌦️';
        if (code >= 61 && code <= 67) return '🌧️';
        if (code >= 71 && code <= 77) return '❄️';
        if (code >= 80 && code <= 82) return '🌦️';
        if (code === 85 || code === 86) return '🌨️';
        if (code >= 95) return '⛈️';
        return '🌡️';
    }

    async function load() {
        try {
            const res = await fetch(url);
            if (!res.ok) return;
            const data = await res.json();
            const cur = data.current;
            if (!cur || typeof cur.temperature_2m !== 'number') return;

            const temp = Math.round(cur.temperature_2m);
            window.__weather = `${temp}°C ${emoji(cur.weather_code)}`;

            if (typeof window.renderLocalTime === 'function') window.renderLocalTime();
        } catch (e) {}
    }

    load();
    setInterval(load, 15 * 60 * 1000); // atualiza a cada 15 min
})();
