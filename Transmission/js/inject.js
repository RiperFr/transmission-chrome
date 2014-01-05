var port = chrome.extension.connect({name: "inject"});
function clickTorrent(a) {
    console.debug('Torrent click ');
    console.dir(a);
    port.postMessage({url: a.currentTarget.href, method: "torrent-add"});
    a.preventDefault();
    a.stopPropagation()
}
port.onMessage.addListener(function (d) {
    switch (d.method) {
        case"checkLink":
            document.links[d.num].addEventListener("click", clickTorrent, true);
            break;
        case"checkClick":
            var a = document.links;
            for (var b = 0, c; c = a[b]; ++b) {
                port.postMessage({url: c.href, num: b, method: "checkLink"})
            }
            break
    }
});
(function () {
    port.postMessage({method: "checkClick"})
})();