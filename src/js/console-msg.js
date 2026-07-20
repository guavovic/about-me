(function () {
    const art = [
        ' ######   ##     ##    ###    ##     ##  #######  ##     ## ####  ######  ',
        '##    ##  ##     ##   ## ##   ##     ## ##     ## ##     ##  ##  ##    ## ',
        '##        ##     ##  ##   ##  ##     ## ##     ## ##     ##  ##  ##       ',
        '##   #### ##     ## ##     ## ##     ## ##     ## ##     ##  ##  ##       ',
        '##    ##  ##     ## #########  ##   ##  ##     ##  ##   ##   ##  ##       ',
        '##    ##  ##     ## ##     ##   ## ##   ##     ##   ## ##    ##  ##    ## ',
        ' ######    #######  ##     ##    ###     #######     ###    ####  ######  '
    ].join('\n');

    const hi = 'font-size:13px; color:#b3b3b3;';
    const txt = 'font-size:13px; color:#b3b3b3;';
    const link = 'font-size:13px; color:#0a66c2; font-weight:bold;';
    const dim = 'font-size:11px; color:#666; font-style:italic;';

    console.log(art);
    console.log('%cHey, you opened the console! 👀', hi);   
    console.log('%cLet\'s connect: %chttps://www.linkedin.com/in/gustavo-victor-pinheiro/', txt, link);
    console.log('%c(psst… try typing "flappy" or "dino" on the page 😏)', dim);
})();
