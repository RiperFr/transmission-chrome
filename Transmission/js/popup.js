var torrents = [], refresh, port = chrome.extension.connect({name: "popup"});
const TAG_BASELINE = 1, TAG_UPDATE = 2, TAG_TURTLE_MODE = 3;
Array.prototype.getTorrentById = function (b) {
    for (var a = this.length - 1; a >= 0; a--) {
        if (this[a].id === b) {
            return a
        }
    }
    return -1
};
function formatBytes(a) {
    if (a < 1) {
        return"0 bytes"
    }
    var b = ["bytes", "KB", "MB", "GB", "TB", "PB"], c = Math.floor(Math.log(a) / Math.log(1024));
    if (c > 2) {
        return(a / Math.pow(1024, c)).toFixed(2) + " " + b[c]
    }
    return(a / Math.pow(1024, c)).toFixed(1) + " " + b[c]
}
function formatSeconds(f) {
    if (f < 1) {
        return"unknown time"
    }
    var a = [
        {seconds: 86400, label: "days"},
        {seconds: 3600, label: "hr"},
        {seconds: 60, label: "min"},
        {seconds: 1, label: "seconds"}
    ], c, e;
    for (var b = 0, d; d = a[b]; ++b) {
        if (f > d.seconds) {
            c = Math.floor(f / d.seconds);
            e = c + " " + d.label;
            f -= d.seconds * c;
            if (b < (a.length - 1)) {
                c = Math.floor(f / a[b + 1].seconds);
                if (c > 0) {
                    e += " " + c + " " + a[b + 1].label
                }
            }
            return e
        }
    }
}
function updateStats(a) {
    var d = [0, 0, 0], f = 0, h = 0, e = $("#list")[0], b = $("#status")[0];
    for (var c = 0, j; j = torrents[c]; ++c) {
        switch (j.status) {
            case 1:
            case 2:
            case 4:
                d[0]++;
                break;
            case 8:
                d[1]++;
                break;
            case 16:
                d[2]++;
                break
        }
    }
    for (var c = 0, g; g = a[c]; ++c) {
        f += g.rateDownload;
        h += g.rateUpload
    }
    $("#global_torrents").html(torrents.length);
    $("#global_downloading").html(d[0]);
    $("#global_seeding").html(d[1]);
    $("#global_pausedcompleted").html(d[2]);
    $("#global_downloadrate").html(formatBytes(f));
    $("#global_uploadrate").html(formatBytes(h))
}
function setStatusVisibility() {
    if (list.hasChildNodes()) {
        $(status).hide();
        $(list).show()
    } else {
        $(status).show();
        $(list).hide()
    }
}
port.onMessage.addListener(function (g) {
    switch (g.tag) {
        case TAG_BASELINE:
            var d = g.args.torrents.sort(function (i, h) {
                return h.addedDate - i.addedDate
            });
            for (var a = 0, c; c = d[a]; ++a) {
                torrents[torrents.push(new Torrent()) - 1].createElem(c);
                torrents[a].filter()
            }
            setStatusVisibility();
            updateStats(d);
            break;
        case TAG_UPDATE:
            var e = g.args.removed, d = g.args.torrents, f;
            for (var a = 0, b; b = e[a]; ++a) {
                var f = torrents.getTorrentById(b);
                if (f > -1) {
                    torrents.splice(f, 1)[0].removeElem()
                }
            }
            for (var a = 0, c; c = d[a]; ++a) {
                var f = torrents.getTorrentById(c.id);
                if (f < 0) {
                    torrents.unshift(new Torrent());
                    torrents[0].createElem(c);
                    torrents[0].filter(0)
                } else {
                    torrents[f].updateElem(c)
                }
            }
            setStatusVisibility();
            updateStats(d);
            break;
    }
});
function refreshPopup() {
    port.postMessage({args: '"fields": [ "id", "status", "name", "downloadDir", "metadataPercentComplete", "sizeWhenDone", "leftUntilDone", "eta", "rateDownload", "rateUpload", "uploadedEver", "addedDate", "doneDate", "recheckProgress" ], "ids": "recently-active"', method: "torrent-get", tag: TAG_UPDATE});
    port.postMessage({args: "", method: "session-get", tag: TAG_TURTLE_MODE});
    refresh = setTimeout(refreshPopup, 3000)
}
(function () {
    $("#filter_type").val(localStorage.torrentType || 0);
    var a = localStorage.torrentFilter || "";
    $("#filter_input").val(a);
    $("#filter_clear").toggle(!!a);
    port.postMessage({args: '"fields": [ "id", "status", "name", "downloadDir", "metadataPercentComplete", "sizeWhenDone", "leftUntilDone", "eta", "rateDownload", "rateUpload", "uploadedEver", "addedDate", "doneDate", "recheckProgress" ]', method: "torrent-get", tag: TAG_BASELINE});
    port.postMessage({args: "", method: "session-get", tag: TAG_TURTLE_MODE});
    refresh = setTimeout(refreshPopup, 3000)
})();


$('#filter_input').focus();
$('#header').on('click',function(){
    chrome.tabs.create({ url: localStorage.server + localStorage.webPath }) ;
});
