const loadScriptAsync = (src) => new Promise((accept, reject) => {
    const scr = document.createElement("script");
    scr.src = src;
    scr.onload = () => {
        accept();
    }
    document.head.appendChild(scr);
});

window.loadScriptAsync = loadScriptAsync;
loadScriptAsync("js/vendor.js").then(loadScriptAsync("js/app.js")).catch(e => console.log("Could not load", e));
