function parseTorrent(b, c) {
    var a = new FileReader();
    a.onload = function (d) {
        var f = new Worker("js/bencode.js");
        f.onmessage = function (e) {
            if (e.data.split) {
                var g = e.data.split(":");
                switch (true) {
                    case g[0] === "debug":
                        console.debug(g[1]);
                        break
                }
            } else {
                c(e.data)
            }
        };
        f.onerror = function (e) {
            throw new Error(e.message + " (" + e.filename + ":" + e.lineno + ")")
        };
        f.postMessage(a.result)
    };
    a.readAsBinaryString(b)
}
function encodeFile(b, c) {
    var a = new FileReader();
    a.onload = function (d) {
        c(a.result.replace("data:application/x-bittorrent;base64,", "").replace("data:base64,", "").replace("data:;base64,", ""))
    };
    a.readAsDataURL(b)
}
function getFile(a, b) {
    $.get(a,function (c) {
    }, "dataview").complete(function (d, e) {
        var Blob = new window.Blob([d.responseText]);
        //var c = new window.BlobBuilder();
        //c.append(d.responseText);
        b(Blob);
    })
};