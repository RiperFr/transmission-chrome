
// global variables
var completedTorrents = '',		// string of completed torrents to prevent duplicate notifications
    notificationTimer;			// timer for displaying notifications

/*=================================================================================
 showBadge(string text, RGBA color, milliseconds duration)

 displays a text badge on the browser icon

 parameters
 text: (required) text to display
 color: (required) color of badge
 duration: (required) how long to show badge for

 returns
 nothing
 =================================================================================*/
function showBadge(text, color, duration) {
    chrome.browserAction.setBadgeBackgroundColor({ color: color });
    chrome.browserAction.setBadgeText({ text: text });

    setTimeout(function () { chrome.browserAction.setBadgeText({ 'text': '' }); }, duration);
}

/*=================================================================================
 rpcTransmission(object args, string method, int tag, function callback)

 send a request to a remote Transmission client

 parameters
 args: (required) data to pass to the Transmission client
 method: (required) tells the Transmission client how to handle the data
 tag: makes it easy to know what to do with the response
 callback: function to reference with the response

 returns
 nothing
 =================================================================================*/
function rpcTransmission(args, method, tag, callback) {
    $.ajax({
        url: localStorage.server + localStorage.rpcPath
        ,	type: 'POST'
        ,	username: localStorage.user || ''
        ,	password: localStorage.pass || ''
        ,	headers: {'X-Transmission-Session-Id': localStorage.sessionId}
        ,	data: '{ "arguments": {' + args + '}, "method": "' + method + '"' + (tag ? ', "tag": ' + tag : '') + '}'
    }).complete(function(jqXHR, textStatus) {
            var xSid = jqXHR.getResponseHeader('X-Transmission-Session-Id');

            if(xSid) {
                localStorage.sessionId = xSid;
                return rpcTransmission(args, method, tag, callback);
            }

            if(callback) {
                callback(JSON.parse(jqXHR.responseText));
            }
        });
}

/*=================================================================================
 getTorrent(URL url)

 attempt to download url as a torrent file

 parameters
 url: (required) url to download

 returns
 nothing
 =================================================================================*/
function getTorrent(url) {
    var dirs = (localStorage.dLocation === 'dlcustom') ? JSON.parse(localStorage.dirs) : [];

    // don't use base64 on magnet links
    if (url.toLowerCase().indexOf('magnet:') > -1) {
        // show download popup?
        if (localStorage.dLocation === 'dldefault' && localStorage.dlPopup === 'false') {
            dlTorrent({ 'url': url });
        } else {
            chrome.windows.create({
                'url': 'downloadMagnet.html'
                ,	'type': 'popup'
                ,	'width': 850
                ,	'height': 140
                ,	'left': (screen.width/2) - 425
                ,	'top': (screen.height/2) - 70
            }, function(window) {
                chrome.tabs.sendRequest(window.tabs[0].id, { 'url': url, 'dirs': dirs });
            });
        }
    } else {
        getFile(url, function(file) {
            // show download popup?
            if (localStorage.dLocation === 'dldefault' && localStorage.dlPopup === 'false') {
                encodeFile(file, function(data) {
                    dlTorrent({ 'data': data });
                });
            } else {
                parseTorrent(file, function(torrent) {
                    if (torrent !== null) {
                        chrome.windows.create({
                                'url': 'downloadTorrent.html'
                                ,	'type': 'popup'
                                ,	'width': 850
                                ,	'height': 580
                                ,	'left': (screen.width/2) - 425
                                ,	'top': (screen.height/2) - 265
                            },
                            function(window) {
                                encodeFile(file, function(data) {
                                    chrome.tabs.sendRequest(window.tabs[0].id, { 'torrent': torrent, 'data': data, 'dirs': dirs });
                                });
                            });
                    } else {
                        alert('This isn\'t a torrent file.')
                    }
                });
            }
        });
    }
}

/*=================================================================================
 dlTorrent(Object request)

 download the torrent

 parameters
 request: (required) object containg data needed to download torrent

 returns
 nothing
 =================================================================================*/
function dlTorrent(request) {
    // how are we going to send this torrent to transmission?
    var args = (typeof request.data !== 'undefined') ? '"metainfo": "' + request.data + '"' : '"filename": "' + request.url + '"';

    // where are we going to download it to?
    if (typeof request.dir !== 'undefined') {
        args += ', "download-dir": "' + request.dir + '"';
    }

    if(request.blacklist && request.blacklist.length) {
        args += ', "files-unwanted": [' + request.blacklist.join(',') + ']';
    }

    // send the torrent to transmission
    rpcTransmission(args, 'torrent-add', '', function (response) {
        // show a badge on the browser icon depending on the response from Transmission
        switch(response.result) {
            case 'success':
                showBadge('add', [0, 255, 0, 255], 5000);
                break;
            case 'duplicate torrent':
                showBadge('dup', [0, 0, 255, 255], 5000);
                break;
            default:
                showBadge('fail', [255, 0, 0, 255], 5000);
                alert('Torrent download failed!\n\n' + response.result);
        }
    });
}

/*=================================================================================
 notificationRefresh()

 request a minimal list of torrents with recent activity (30s timer)

 parameters
 none

 returns
 nothing
 =================================================================================*/
function notificationRefresh() {
    rpcTransmission('"fields": [ "id", "name", "status", "leftUntilDone" ], "ids": "recently-active"', 'torrent-get', 10, function (response) {
        var notification;

        for (var i = 0, torrent; torrent = response.arguments.torrents[i]; ++i) {
            if (torrent.status === 16 && torrent.leftUntilDone === 0 && completedTorrents.indexOf(torrent.id) < 0) {
                notification = webkitNotifications.createNotification(
                    'images/icon48.png',
                    'Torrent Download Complete',
                    torrent.name + ' has finished downloading.'
                );
                notification.show();

                // hide the notification after 30 seconds
                setTimeout(function() { notification.cancel(); }, '30000');

                // mark the completed torrent so another notification isn't displayed for it
                completedTorrents += torrent.id + ',';
            }
        }
    });

    notificationTimer = setTimeout(notificationRefresh, 15000);
}

var cnt = 0;
// receive messages from other parts of the script
chrome.extension.onConnect.addListener(function(port) {
    switch(port.name) {
        case 'popup':
            port.onMessage.addListener(function(msg) {
                switch(msg.method) {
                    case 'torrent-get':
                    case 'session-get':
                        rpcTransmission(msg.args, msg.method, msg.tag, function (response) {
                            port.postMessage({ 'args': response.arguments, 'tag': response.tag });
                        });
                        break;
                    default:
                        rpcTransmission(msg.args, msg.method);
                }
            });
            break;
        case 'inject':
            port.onMessage.addListener(function(msg) {
                switch(msg.method) {
                    case 'checkLink':
                        for (var i = 0, torrentLink; torrentLink = TORRENT_LINKS[i]; ++i) {
                            if (torrentLink.test(msg.url)) {
                                port.postMessage({ 'url': msg.url, 'num': msg.num, 'method': 'checkLink' });
                                break;
                            }
                        }
                        break;
                    case 'torrent-add':
                        getTorrent(msg.url);
                        break;
                    case 'checkClick':
                        if (localStorage.clickAction === 'dlremote') {
                            port.postMessage({ 'method': 'checkClick' });
                        }
                        break;
                }
            });
            break;
        case 'options':
            port.onMessage.addListener(function(msg) {
                // stop the notification timer
                clearTimeout(notificationTimer);

                // start it up again if it's enabled
                if (msg.notifications) notificationRefresh();
            });
            break;
    }
});

// recieve message to send torrent to transmission
chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    if(request.debug) {
        console.log(request.sender + ':');
        console.debug(request.msg);
        console.log('-----');
    } else {
        dlTorrent(request);
        sendResponse({});	// close connection cleanly
    }
});

/*=================================================================================
 start context menu
 =================================================================================*/
// attempt to download the url from a context menu as a torrent
function contextMenuClick(info, tab) {
    getTorrent(info.linkUrl);
}

// only add to context menu for links
chrome.contextMenus.create({
    'title': 'Download with Riper Drive'
    ,	'contexts': [ 'link' ]
    ,	'onclick': contextMenuClick
    //TODO: watch this http://code.google.com/p/chromium/issues/detail?id=84024
    //,	'targetUrlPatterns': TORRENT_LINKS
});
/*=================================================================================
 end context menu
 =================================================================================*/

(function() {
    // show notifications if they're enabled
    if (localStorage.notifications === 'true') {
        notificationRefresh();
    }

    // make sure users are up-to-date with their config
    if (typeof localStorage.verConfig === 'undefined' || localStorage.verConfig < 5) chrome.tabs.create({ url: 'options.html' });
})();
/*
 tree.reset();
 tree.insertLeaf(1, 'root', 'a1_1');
 tree.insertLeaf(1, 'root', 'a1_2');
 tree.insertLeaf(2, 'a1_1', 'a2_1');
 tree.insertLeaf(2, 'a1_1', 'a2_11');
 tree.insertLeaf(2, 'a1_2', 'a2_2');
 tree.insertLeaf(3, 'a2_1', 'a3_1');
 tree.insertLeaf(3, 'a2_1', 'a3_11');
 tree.insertLeaf(3, 'a2_2', 'a3_2');
 console.debug(tree.data);
 console.debug(tree.toList());
 */