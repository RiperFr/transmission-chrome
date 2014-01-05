function Torrent() {
    const f = -1, h = 1, l = 2, m = 4, c = 8, b = 16;
    var d, i, k, q, a, e, o, g = $("<li></li>");
    this.id = 0;
    this.name = "";
    this.status = 0;
    this.sendRPC = function (t, s) {
        clearTimeout(refresh);
        var r = (t === "torrent-remove" && s) ? ', "delete-local-data": true' : ', "delete-local-data": true';
        port.postMessage({args: '"ids": [ ' + this.id + " ]" + r, method: t});
        refresh = setTimeout(refreshPopup, t === "torrent-stop" ? 500 : 0)
    };
    this.filter = function () {
        var s = !localStorage.torrentFilter ? "" : new RegExp(localStorage.torrentFilter.replace(/ /g, "[^A-z0-9]*"), "i"), r = localStorage.torrentType || 0;
        if ((r == 0 || this.status == r) && this.name.search(s) > -1) {
            $("#list").append(g)
        } else {
            $("#list_hidden").append(g)
        }
    };
    function p(r) {
        console.debug(r);
        d.toggle(r === m || r === c || r === 6);
        i.toggle(r === b ||r === 0)
    }

    function n(t, s) {
        switch (t.status) {
            case h:
                e.text(formatBytes(t.sizeWhenDone - t.leftUntilDone) + " of " + formatBytes(t.sizeWhenDone) + " (" + s.toFixed(2) + "%) - waiting to verify local data");
                o.text("");
                break;
            case l:
                e.text(formatBytes(t.sizeWhenDone - t.leftUntilDone) + " of " + formatBytes(t.sizeWhenDone) + " (" + s.toFixed(2) + "%) - verifying local data (" + (t.recheckProgress * 100).toFixed() + "%)");
                o.text("");
                break;
            case m:
                if (t.metadataPercentComplete < 1) {
                    e.text("Magnetized transfer - retrieving metadata (" + (t.metadataPercentComplete * 100).toFixed() + "%)");
                    o.text("");
                    q.attr("class", "torrent_progress magnetizing")
                } else {
                    e.text(formatBytes(t.sizeWhenDone - t.leftUntilDone) + " of " + formatBytes(t.sizeWhenDone) + " (" + s.toFixed(2) + "%) - " + formatSeconds(t.eta) + " remaining");
                    o.text("DL: " + formatBytes(t.rateDownload) + "/s UL: " + formatBytes(t.rateUpload) + "/s")
                }
                break;

            case 6 :
            case c:
                e.text(formatBytes(t.sizeWhenDone) + " - Seeding, uploaded " + formatBytes(t.uploadedEver) + " (Ratio " + (t.uploadedEver / t.sizeWhenDone).toFixed(2) + ")");
                o.text("UL: " + formatBytes(t.rateUpload) + "/s");
                a.attr("class", "seeding");
                break;
            case b:
                if (t.leftUntilDone) {
                    e.text(formatBytes(t.sizeWhenDone - t.leftUntilDone) + " of " + formatBytes(t.sizeWhenDone) + " (" + s.toFixed(2) + "%) - Paused")
                } else {
                    var r = (t.doneDate > 0) ? t.doneDate : t.addedDate;
                    e.text(formatBytes(t.sizeWhenDone) + " - Completed on " + new Date(r * 1000).toLocaleDateString())
                }
                o.text("");
                a.attr("class", "paused");
                break

        }
    }

    function j(r) {
        if (r === 100) {
            a.attr("class", "complete").css("width", r + "%")
        } else {
            if (r > 0) {
                a.attr("class", "downloading").css("width", r + "%")
            } else {
                a.hide()
            }
        }
    }

    this.createElem = function (t) {
        this.id = t.id || f;
        this.name = t.name || f;
        this.status = t.status || f;
        var r = this, s = 100 - (t.leftUntilDone / t.sizeWhenDone * 100);
        oName = $("<div>" + t.name + "</div>").attr({"class": "torrent_name", title: t.name}).appendTo(g);
        e = $("<div></div>").attr({"class": "torrent_stats"}).appendTo(g);
        o = $("<div></div>").attr({"class": "torrent_speeds"}).appendTo(g);
        q = $("<div></div>").attr({"class": "torrent_progress"}).appendTo(g);
        a = $("<div></div>").appendTo(q);
        d = $("<div></div>").attr({"class": "torrent_button pause", title: "Pause"}).click(function (u) {
            r.sendRPC("torrent-stop")
        }).appendTo(g);
        i = $("<div></div>").attr({"class": "torrent_button resume", title: "Resume"}).click(function () {
            r.sendRPC("torrent-start")
        }).appendTo(g);
        k = $("<div></div>").attr({name: "torrent_remove", "class": "torrent_button remove", title: "Double-click to remove torrent and also delete data"}).dblclick(function (u) {
            r.sendRPC("torrent-remove", u.ctrlKey)
        }).appendTo(g);
        j(s);
        p(t.status);
        n(t, s)
    };
    this.updateElem = function (s) {
        var r = 100 - (s.leftUntilDone / s.sizeWhenDone * 100);
        this.status = s.status || f;
        oName.attr("title", s.name + "\n\nDownloaded to: " + s.downloadDir);
        q.attr("class", "torrent_progress");
        j(r);
        p(s.status);
        n(s, r)
    };
    this.removeElem = function () {
        g.remove()
    }
};