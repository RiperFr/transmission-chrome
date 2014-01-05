var port = chrome.extension.connect({name: "options"});
function addDir(k, d) {
    if (k === "" || d === "") {
        return
    }
    var n = document.getElementById("customdirs");
    for (var f = 2, o; o = n.rows[f]; ++f) {
        if (o.childNodes[0].childNodes[0].value === k) {
            return
        }
    }
    var c = n.insertRow(-1), m = c.insertCell(-1), l = c.insertCell(-1), j = c.insertCell(-1), h = document.createElement("input"), b = document.createElement("input"), e = document.createElement("div"), a = document.createElement("div"), g = document.createElement("div");
    m.appendChild(h);
    l.appendChild(b);
    j.appendChild(e);
    j.appendChild(a);
    j.appendChild(g);
    h.setAttribute("type", "text");
    h.setAttribute("class", "label");
    h.setAttribute("value", k);
    b.setAttribute("type", "text");
    b.setAttribute("class", "dir");
    b.setAttribute("value", d);
    e.setAttribute("class", "button up");
    e.addEventListener("click", function () {
        if (c.rowIndex > 2) {
            n.tBodies[0].insertBefore(c, c.previousSibling)
        }
    }, false);
    a.setAttribute("class", "button down");
    a.addEventListener("click", function () {
        if (c.rowIndex < (n.rows.length - 1)) {
            n.tBodies[0].insertBefore(c, c.nextSibling.nextSibling)
        }
    }, false);
    g.setAttribute("class", "button remove");
    g.addEventListener("click", function () {
        n.tBodies[0].removeChild(c)
    }, false);
    document.getElementById("customlabel").value = "";
    document.getElementById("customdir").value = ""
}
function save() {
    localStorage.server = document.getElementById("protocol").value + "://" + document.getElementById("ip").value + ":" + document.getElementById("port").value;
    if (document.getElementById("path").value !== "") {
        localStorage.server += "/" + document.getElementById("path").value
    }
    localStorage.rpcPath = (document.getElementById("rpcPath").value !== "") ? "/" + document.getElementById("rpcPath").value : "";
    localStorage.webPath = (document.getElementById("webPath").value !== "") ? "/" + document.getElementById("webPath").value + "/" : "";
    localStorage.user = document.getElementById("user").value;
    localStorage.pass = document.getElementById("pass").value;
    localStorage.notifications = document.getElementById("notifications").checked;
    port.postMessage({notifications: document.getElementById("notifications").checked});
    localStorage.clickAction = (document.getElementById("dlremote").checked) ? "dlremote" : "dllocal";
    localStorage.dlPopup = document.getElementById("dlpopup").checked;
    localStorage.dLocation = (document.getElementById("dldefault").checked) ? "dldefault" : "dlcustom";
    var b = document.getElementById("customdirs"), c = [];
    for (var a = 2, d; d = b.rows[a]; ++a) {
        c.push({label: d.childNodes[0].childNodes[0].value, dir: d.childNodes[1].childNodes[0].value})
    }
    localStorage.dirs = JSON.stringify(c);
    document.getElementById("saved").style.opacity = 1;
    setTimeout(function () {
        document.getElementById("saved").style.opacity = 0
    }, 2000)
}
(function () {
    if (typeof localStorage.verConfig === "undefined" || localStorage.verConfig < 5) {
        if (typeof localStorage.server === "undefined") {
            localStorage.server = "http://localhost:9091/transmission"
        }
        if (typeof localStorage.rpcPath === "undefined") {
            localStorage.rpcPath = "/rpc"
        }
        if (typeof localStorage.webPath === "undefined") {
            localStorage.webPath = "/web/"
        }
        if (typeof localStorage.user === "undefined") {
            localStorage.user = ""
        }
        if (typeof localStorage.pass === "undefined") {
            localStorage.pass = ""
        }
        if (typeof localStorage.notifications === "undefined") {
            localStorage.notifications = true
        }
        if (typeof localStorage.clickAction === "undefined") {
            localStorage.clickAction = "dlremote"
        }
        if (typeof localStorage.dlPopup === "undefined") {
            localStorage.dlPopup = false
        }
        if (typeof localStorage.dLocation === "undefined") {
            if (typeof localStorage.dlocation !== "undefined") {
                localStorage.dLocation = localStorage.dlocation
            } else {
                localStorage.dLocation = "dldefault";
                localStorage.dirs = "[]"
            }
        }
        if (typeof localStorage.sessionId === "undefined") {
            localStorage.sessionId = ""
        }
        if (typeof localStorage.torrentType === "undefined") {
            localStorage.torrentType = 0
        }
        if (typeof localStorage.torrentFilter === "undefined") {
            localStorage.torrentFilter = ""
        }
        localStorage.verConfig = 5
    }
    var d = JSON.parse(localStorage.dirs), c = localStorage.server.match(/(https?):\/\/(.+):(\d+)\/?(.*)/);
    document.getElementById("protocol").value = c[1];
    document.getElementById("ip").value = c[2];
    document.getElementById("port").value = c[3];
    document.getElementById("path").value = c[4];
    document.getElementById("rpcPath").value = localStorage.rpcPath.replace(/\//g, "");
    document.getElementById("webPath").value = localStorage.webPath.replace(/\//g, "");
    document.getElementById("user").value = localStorage.user;
    document.getElementById("pass").value = localStorage.pass;
    document.getElementById("notifications").checked = (localStorage.notifications === "true") ? true : false;
    document.getElementById(localStorage.clickAction).checked = true;
    document.getElementById("dlpopup").checked = (localStorage.dlPopup === "true") ? false : false;
    document.getElementById(localStorage.dLocation).checked = true;
    if (localStorage.dLocation === "dlcustom") {
        document.getElementById("dlpopup").disabled = true
    }
    for (var b = 0, a; a = d[b]; ++b) {
        addDir(d[b].label, d[b].dir)
    }
})();


$('#save').on('click', save);
$('#user').on('focus', function () {
    this.type = 'text';
})
$('#user').on('blur', function () {
    this.type = 'password';
})
$('#pass').on('focus', function () {
    this.type = 'text';
})
$('#pass').on('blur', function () {
    this.type = 'password';
})