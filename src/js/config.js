const CONFIG = {
    // Last.fm ("ouvindo agora")
    LASTFM_API_KEY: "d2f738437070ebb3fade0e4a6a4344aa",
    LASTFM_USER: "guavovic",
    NOW_PLAYING_POLL_MS: 30000,

    // Frases de status
    STATUS_PHRASES: [
        "probably shipping code",
        "chasing a sneaky bug",
        "building something new",
        "automating boring stuff",
        "thinking in C#",
        "lost in a playlist 🎧",
        "sipping tea 🍵",
        "leveling up 🎮",
        "missing Bianca 💛"
    ],

    // Mini-jogos: fotos dos personagens (rosto da Bianca)
    // Coloque as fotos em images/ e aponte aqui. Se faltar, cai pro fallback.
    FLAPPY_FACE: "images/bianca.jpg",
    DINO_FACE: "images/dino.jpg",

    // Easter egg de aniversário
    ANNIVERSARY: {
        // Dispara nesses dias de qualquer mês
        DAYS: [17, 18],
        PHOTO: "images/us.jpg",
        SPOTIFY_TYPE: "playlist",
        SPOTIFY_ID: "5CEa71hjkOuyQfwwOfdeu8",

        // Frases que vão alternando
        PHRASES: [
            "Foi dia 17… ou 18? 😄",
            "Te amo, meu chamego!",
            "Te amo, Bianca 💛",
            "Você deixa tudo mais leve",
            "Meu lugar favorito é do seu lado",
            "Obrigado por cada dia com você",
            "Você é minha música preferida 🎶"
        ]
    }
};