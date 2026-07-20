(function () {
    const original = document.title;
    const away = [
        '404: user not found 🔍',
        "console.log('come back') 🖥️",
        'You closed me? Rude 😤',
        'Bug found: you left 🐛',
        'git commit -m "come back"',
        'Are you ghosting me? 👻'
    ];

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            document.title = away[Math.floor(Math.random() * away.length)];
        } else {
            document.title = original;
        }
    });
})();
