var orderobjarray = [];
var windowobjarray = [];
var prefocuswindowid = null;
var optionobject = {};
var removetabflag = false;
var tabopenpos = "0";
var tabfocus = "0";
var newtabfocusflag = true;
var popuptotabflag = false;
var resetflagtimerid = null;
var recentactivetabid = [];
var childtabidarray = {};
var redirectobj = {};

window.addEventListener("load", function(event) {
    setTimeout(function(){
        getAllWindowObject();
    },600);
    setDefaultValue();
    getSyncData();
});
function getSyncData(){
    chrome.storage.sync.get("opt",function(items) {
        if(items&&items.opt){
            var optobj = items.opt;
            var tmpopt =  JSON.stringify(optobj);
            localStorage.setItem("_temp_optobj",tmpopt);
            setOption(optobj);
            chrome.storage.sync.clear(function(){
                var tmpoptobj = localStorage.getItem("_temp_optobj");
                if(tmpoptobj){
                    localStorage.setItem("_local_options",tmpopt);
                    var tmpoptjson = JSON.parse(tmpoptobj);
                    syncOptStore.set(tmpoptjson);
                    localStorage.removeItem("_temp_optobj");
                }
            });
        }else{
            var opt = localStorage.getItem("_temp_optobj");
            if(opt){
                var jsonopt = JSON.parse(opt);
                if(jsonopt&&jsonopt.osel&&jsonopt.actb){
                    setOption(jsonopt);
                    syncOptStore.set(jsonopt);
                }
                localStorage.removeItem("_temp_optobj");
            }else{
                getOptSync();
            }
        }
    });
}
function getOptSync(){
    getopt("actb",0,{});
    function getopt(str,idx,optobj){
        chrome.storage.sync.get(str,function(items) {
            if(items[str]){
                var item = items[str];
                optobj[str] = item;
            }
            idx++
            if(idx === 1){
                getopt("exlnk",idx,optobj);
            }else if(idx === 2){
                getopt("newt",idx,optobj);
            }else if(idx === 3){
                getopt("onactvtb",idx,optobj);
            }else if(idx === 4){
                getopt("osel",idx,optobj);
            }else if(idx === 5){
                getopt("popt",idx,optobj);
            }else{
                getoptary("expexlnkurl",0,[],0,optobj);
            }
        });
    }
    function getoptary(str,no,nary,idx,optobj){
        chrome.storage.sync.get(str+no,function(items) {
            if(items[str+no]){
                var ary = items[str+no];
                nary = ary.concat(nary);
                no++;
                getoptary(str,no,nary,idx,optobj);
            }else{
                if(nary&&nary.length > 0){
                    optobj[str] = nary;
                }
                idx++
                if(idx === 1){
                    getoptary("expurl",0,[],idx,optobj);
                }else if(idx === 2){
                    getoptary("loadingurl",0,[],idx,optobj);
                }else if(idx === 3){
                    getoptary("openurl",0,[],idx,optobj);
                }else{
                    if(optobj){
                        if(!optobj.openurl){
                            optobj.openurl = [];
                        }
                        if(!optobj.expurl){
                            optobj.expurl = [];
                        }
                        if(!optobj.loadingurl){
                            optobj.loadingurl = [];
                        }
                        if(!optobj.expexlnkurl){
                            optobj.expexlnkurl = [];
                        }
                        if(optobj&&optobj.osel&&optobj.actb){
                            if(!optobj.osel){
                                optobj.osel = "openbutton5";
                            }
                            if(!optobj.actb){
                                optobj.actb = "activebutton6";
                            }
                            if(!optobj.newt){
                                optobj.newt = "false";
                            }
                            if(!optobj.popt){
                                optobj.popt = "false";
                            }
                            if(!optobj.onactvtb){
                                optobj.onactvtb = "onactbutton1";
                            }
                            setOption(optobj);
                        }else{
                            syncError();
                        }
                    }else{
                        syncError();
                    }
                }
            }
        });
    }
    function syncError(){
        var lcobj = localStorage.getItem("_local_options");
        if(lcobj){
            var jsonoptobj = JSON.parse(lcobj);
            if(jsonoptobj&&jsonoptobj.osel&&jsonoptobj.actb){
                setOption(jsonoptobj);
            }
        }
    }
}
function setSync() {
    localStorage.setItem("_local_options",JSON.stringify(optionobject));
    syncOptStore.set(optionobject);
}
var syncOptStore = {
    set:function(optobj){
        var idx = 0;
        var that = this;
        var objkeys = Object.keys(optobj);
        var optary = {};
        for (var i = 0, len = objkeys.length; i < len; i++) {
            var key = objkeys[i];
            var value = optobj[key];
            if(key === "expexlnkurl"){
                setary(optary,key,value)
            }else if(key === "expurl"){
                setary(optary,key,value)
            }else if(key === "loadingurl"){
                setary(optary,key,value)
            }else if(key === "openurl"){
                setary(optary,key,value)
            }else{
                optary[key] = value;
                idx++;
            }
        }
        if(chrome.storage.sync.QUOTA_BYTES > this.sizeof(optary)){
            chrome.storage.sync.set(optary,function(){
            });
        }else{
            chrome.storage.sync.clear();
            localStorage.setItem("_local_options",JSON.stringify(optobj));
        }
        function setary(optary,key,ary){
            var alary = [],oaray = [];
            for(var i = 0; i < ary.length; i++){
                if(that.sizeof(alary) < chrome.storage.sync.QUOTA_BYTES_PER_ITEM-300){
                    var sdat = ary[i];
                    alary.push(sdat);
                }else{
                    if(oaray.length < 511){
                        oaray.push(alary.concat());
                        alary.length = 0;
                        var sdat = ary[i];
                        alary.push(sdat);
                    }
                }
            }
            var idx = 0;
            if(alary.length > 0){
                idx++;
                var index = key + 0;
                optary[index] = alary;
            }else{
                idx++;
                var index = key + 0;
                optary[index] = [];
            }
            for(var i = 0; i < oaray.length; i++){
                var index = key + (i+idx);
                optary[index] = oaray[i];
            }
        }
    },
    sizeof:function(object) {
        var objectList = [];
        var recurse = function(value){
            var bytes = 0;
            if ( typeof value === 'boolean' ) {
                bytes = 4;
            }else if ( typeof value === 'string' ) {
                bytes = value.length * 2;
            }else if ( typeof value === 'number' ) {
                bytes = 8;
            }else if(typeof value === 'object' && objectList.indexOf( value ) === -1){
                objectList[ objectList.length ] = value;
                for( i in value ) {
                    bytes+= 8; // an assumed existence overhead
                    bytes+= recurse( value[i] )
                }
            }
            return bytes;
        };
        return recurse( object );
    }
};
function setDefaultValue(){
    optionobject.openurl = [];
    optionobject.osel = "openbutton5";
    optionobject.actb = "activebutton6";
    optionobject.newt = "false";
    optionobject.popt = "false";
    optionobject.onactvtb = "onactbutton1";
    optionobject.expurl = [];
    optionobject.expexlnkurl = [];
    optionobject.loadingurl = [];
}
function setOption(optobj){
    optionobject = optobj;
    var openpos = optobj.osel;
    if(openpos){
        if(openpos == "openbutton1"){
            tabopenpos = "1"
        }else if(openpos == "openbutton2"){
            tabopenpos = "2"
        }else if(openpos == "openbutton3"){
            tabopenpos = "4"
        }else if(openpos == "openbutton4"){
            tabopenpos = "3"
        }else if(openpos == "openbutton5"){
            tabopenpos = "0"
        }
    }
    var acttab = optobj.actb;
    if(acttab){
        if(acttab == "activebutton1"){
            tabfocus = "1";
        }else if(acttab == "activebutton2"){
            tabfocus = "2";
        }else if(acttab == "activebutton3"){
            tabfocus = "4";
        }else if(acttab == "activebutton4"){
            tabfocus = "3";
        }else if(acttab == "activebutton5"){
            tabfocus = "5";
        }else if(acttab == "activebutton6"){
            tabfocus = "0";
        }else if(acttab == "activebutton7"){
            tabfocus = "7";
        }else if(acttab == "activebutton8"){
            tabfocus = "8";
        }
    }
    var ntab = optobj.newt;
    if(ntab == "true"){
        newtabfocusflag = false;
    }else{
        newtabfocusflag = true;
    }
    var pop = optobj.popt;
    if(pop == "true"){
        popuptotabflag = true;
    }else{
        popuptotabflag = false;
    }
}
function openTab(tab,wnds,resp){
    var tabp = tabopenpos;
    var index = -11;

    if(resp){
        if(resp == "first"){
            index = 0;
        }else if(resp == "last"){
            index = -1;
        }else if(resp == "left"){
            index = checkCurrentTabIndex(tab,wnds);
        }else if(resp == "right"){
            index++;
        }else{
            index = -11;
        }
    }else{
        if(tabp == "1"){
            index = 0;
        }else if(tabp == "2"){
            index = -1;
        }else if((tabp == "3")||(tabp == "4")){
            index = checkCurrentTabIndex(tab,wnds);
            if(tabp == "4"){
                index++;
            }
        }
    }
    if(index != -11){
        if(index === 0){
            moveFirst(tab.id,tab.windowId);
        }else{
            chrome.tabs.move(tab.id, {index: index});
        }
    }
    chrome.windows.getAll({populate:true}, function (wnds){
        windowobjarray = wnds;
    });
}
function exceptList(url,list){
    if(list){
        var len = list.length;
        for(var i = 0; i < len; i++){
            var litem = list[i];
            if((litem.sel !== "forcenewa")&&(litem.sel !== "forcecrnta")&&(litem.sel !== "forcebga")){
                var lurl = litem.url;
                var regex = new RegExp(lurl);
                if (url.search(regex) != -1) {
                    return litem;
                }
                if(lurl.match(/^(http|https):\/\/.+$/)){
                    var idx = url.indexOf(lurl);
                    if(idx == 0){
                        return litem;
                    }
                }else{
                    var urlary = url.split("/");
                    if(urlary[2]){
                        var domain = urlary[2];
                        var idx = domain.indexOf(lurl);
                        if(idx == 0){
                            return litem;
                        }
                        var regex = new RegExp(lurl);
                        if (domain.search(regex) != -1) {
                            return litem;
                        }
                    }
                }
            }
        }
    }
    return null;
}
function checkCurrentTabIndex(tab,wnds){
    var cwid = tab.windowId;
    var seltabid = checkselid(cwid);
    var len = wnds.length;
    for(var i = 0; i < len; i++){
        if(cwid == wnds[i].id){
            var tabs = wnds[i].tabs;
            var len2 = tabs.length;
            for(var ii = 0; ii < len2; ii++){
                if(seltabid == tabs[ii].id){
                    return tabs[ii].index;
                }
            }
        }
    }
    return null;
    function checkselid(wid){
        var len = windowobjarray.length;
        for(var i = 0; i < len; i++){
            if(windowobjarray[i].id == wid){
                var tabs = windowobjarray[i].tabs;
                var le2 = tabs.length;
                for(var ii = 0; ii < le2; ii++){
                    if(tabs[ii].active){
                        return tabs[ii].id;
                    }
                }
            }
        }
        return null;
    }
}
function getAllWindowObject(){
    chrome.windows.getAll({populate:true}, function (wnds){
        windowobjarray = wnds;
        var len = wnds.length;
        for(var i = 0; i < len; i++){
            soartTabObj(wnds[i]);
        }
    });
}
function soartTabObj(wnd){
    var tabs = wnd.tabs;
    var actary = [];
    var lstactive = null;
    var len = tabs.length;
    for(var ii = 0; ii < len; ii++){
        if(tabs[ii].active){
            lstactive = tabs[ii].id;
        }else{
            if(actary.indexOf(tabs[ii].id) == -1){
                actary.push(tabs[ii].id);
            }
        }
    }
    if(lstactive){
        if(actary.indexOf(lstactive) == -1){
            actary.push(lstactive);
        }
    }
    var tabobj = {
        id: wnd.id,
        ordr: actary
    };
    orderobjarray.push(tabobj);
}
function removeOrderTabID(tabId, windowId){
    var len = orderobjarray.length;
    for(var i = 0; i < len; i++){
        if(windowId == orderobjarray[i].id){
            var idx = orderobjarray[i].ordr.indexOf(tabId);
            if(idx > -1){
                orderobjarray[i].ordr.splice(idx,1);
                break;
            }
        }
    }
}
function setFocusTab(wid,tabid,widx){
    var prnttabid = childtabidarray[tabid];
    delete childtabidarray[tabid];
    if(tabfocus == "5"){
        if(orderobjarray[widx]){
            var len = orderobjarray[widx].ordr.length;
            if(len > 0){
                var selid = orderobjarray[widx].ordr[len-1];
                if(selid > -1){
                    chrome.tabs.update(selid,{active:true});
                }
            }
        }
    }else if((tabfocus == "7")||(tabfocus == "8")){
        var oacttabid = null;
        if(tabfocus == "8"){
            if(orderobjarray[widx]){
                var len = orderobjarray[widx].ordr.length;
                if(len > 0){
                    var stabid = orderobjarray[widx].ordr[len-1];
                    if(stabid > -1){
                        oacttabid = stabid;
                    }
                }
            }
        }
        if(prnttabid){
            chrome.tabs.get(prnttabid,function(tab){
                if(chrome.runtime.lastError){
                    if(oacttabid){
                        chrome.tabs.update(oacttabid,{active:true});
                    }
                }else if(tab&&tab.id){
                    chrome.tabs.update(tab.id,{active:true});
                }
            });
        }else{
            if(oacttabid){
                chrome.tabs.update(oacttabid,{active:true});
            }
        }
    }else if((tabfocus == "1")||(tabfocus == "2")){
        chrome.windows.get(wid,{populate:true}, function (windw){
            if(windw&&windw.tabs){
                var tabs = windw.tabs;
                var index = null;
                if(tabfocus == "1"){
                    index = tabs[0].id;
                }else if(tabfocus == "2"){
                    index = tabs[tabs.length-1].id;
                }
                chrome.tabs.update(index,{active:true});
            }
        });
    }else if((tabfocus == "3")||(tabfocus == "4")){
        var index = null;
        var len = windowobjarray.length;
        for(var i = 0; i < len; i++){
            if(windowobjarray[i].id == wid){
                var oldtabs = windowobjarray[i].tabs;
                var idx = oldtabs.indexOf(tabid);
                var len2 = oldtabs.length;
                for(var ii = 0; ii < len2; ii++){
                    if(oldtabs[ii].id == tabid){
                        if(tabfocus == "3"){
                            if(ii == 0){
                                index = oldtabs[0].id;
                            }else{
                                index = oldtabs[ii-1].id;
                            }
                        }else if(tabfocus == "4"){
                            if(ii == oldtabs.length-1){
                                index = oldtabs[oldtabs.length-1].id;
                            }else{
                                index = oldtabs[ii+1].id;
                            }
                        }
                    }
                }
                if(0 == index || index)chrome.tabs.update(index,{active:true});
                break
            }
        }
    }
}
function resetCloseTabFlag(){
    clearTimeout(resetflagtimerid);
    resetflagtimerid = setTimeout(function(){
        removetabflag = false;
    },180);
}
chrome.tabs.onCreated.addListener(function (tab) {
    var len = orderobjarray.length;
    for(var i = 0; i < len; i++){
        if(tab.windowId == orderobjarray[i].id){
            if(tab.active){
                orderobjarray[i].ordr.push(tab.id);
            }else{
                orderobjarray[i].ordr.unshift(tab.id);
            }
            break;
        }
    }
    var resp = exceptList(tab.url,optionobject.openurl);
    var respact = "";
    var respsel = "";
    if(resp&&(resp.act)){
        respact = resp.act;
        respsel = resp.sel;
    }
    if(((respact != "fore")&&(!newtabfocusflag))||(respact == "back")){
        var len = windowobjarray.length;
        for(var i = 0; i < len; i++){
            if(tab.windowId == windowobjarray[i].id){
                var tabs = windowobjarray[i].tabs;
                var len2 = tabs.length;
                for(var ii = 0; ii < len2; ii++){
                    if(tabs[ii].active){
                        chrome.tabs.update(tabs[ii].id,{active:true});
                    }
                }
            }
        }
    }else if(respact == "fore"){
        chrome.tabs.update(tab.id,{active:true});
    }
    chrome.windows.getAll({populate:true}, function (wnds){
        openTab(tab,wnds,respsel);
    });
});
chrome.tabs.onActivated.addListener(function (activeInfo) {
    setTimeout(function(){
        var tabId = activeInfo.tabId;
        var windowId = activeInfo.windowId;

        if(!removetabflag){
            var len = orderobjarray.length;
            for(var i = 0; i < len; i++){
                if(windowId == orderobjarray[i].id){
                    var idx = orderobjarray[i].ordr.indexOf(tabId);
                    if(idx > -1){
                        orderobjarray[i].ordr.splice(idx,1);
                    }
                    orderobjarray[i].ordr.push(tabId);
                    break;
                }
            }
        }else{
            removetabflag = false;
            var len = orderobjarray.length;
            for(var i = 0; i < len; i++){
                if(windowId == orderobjarray[i].id){
                    var idx = orderobjarray[i].ordr.indexOf(tabId);
                    if(idx > -1){
                        setFocusTab(windowId,recentactivetabid[windowId],i);
                        break;
                    }
                }
            }
        }
        recentactivetabid[windowId] = tabId;
        chrome.windows.getAll({populate:true}, function (wnds){
            windowobjarray = wnds;
        });
        setTimeout(moveTab,260,tabId,windowId);
    },1);
});
function moveTab(tabId,windowId){
    if(optionobject){
        if(optionobject.onactvtb == "onactbutton3"){
            moveFirst(tabId,windowId)
        }else if(optionobject.onactvtb == "onactbutton2"){
            chrome.tabs.move(tabId,{index:-1});
        }
        chrome.windows.getAll({populate:true}, function (wnds){
            windowobjarray = wnds;
        });
    }
}
chrome.tabs.onMoved.addListener(function (tabid,moveInfo ){
    chrome.windows.getAll({populate:true}, function (wnds){
        windowobjarray = wnds;
    });
});
chrome.tabs.onRemoved.addListener(function (tabId ,removeInfo) {
    if(redirectobj[tabId])delete redirectobj[tabId];
    var windid = removeInfo.windowId;
    if(recentactivetabid[windid] == tabId){
        removetabflag = true;
        resetCloseTabFlag();
    }
    removeOrderTabID(tabId,windid);
    chrome.windows.getAll({populate:true}, function (wnds){
        setTimeout(function(){
            windowobjarray = wnds;
        },20)
    });
});
chrome.tabs.onDetached.addListener(function (tabId, detachInfo) {
    removeOrderTabID(tabId, detachInfo.oldWindowId);
    chrome.windows.getAll({populate:true}, function (wnds){
        windowobjarray = wnds;
    });
});
chrome.tabs.onAttached.addListener(function (tabId, attachInfo) {
    var len = orderobjarray.length;
    var windowId = attachInfo.newWindowId;

    for(var i = 0; i < len; i++){
        if(windowId == orderobjarray[i].id){
            var idx = orderobjarray[i].ordr.indexOf(tabId);
            if(idx == -1){
                orderobjarray[i].ordr.push(tabId);
                break;
            }
        }
    }
    chrome.windows.getAll({populate:true}, function (wnds){
        windowobjarray = wnds;
    });
});
chrome.windows.onCreated.addListener(function (window) {
    chrome.windows.get(window.id, {populate: true}, function (wnd){
        soartTabObj(wnd);
    });
    if(window.type == "popup"){
        if(popuptotabflag){
            chrome.windows.get(window.id, {populate: true}, function (window){
                if(window){
                    var wurl = window.tabs[0].url;
                    if((wurl.indexOf("chrome-") != 0)&&(wurl.indexOf("opera-") != 0)){
                        var tabid = window.tabs[0].id;
                        var url = window.tabs[0].url;
                        if(!exceptList(url,optionobject.expurl)){
                            chrome.tabs.move(tabid, {windowId: prefocuswindowid,index: -1},function(){
                                chrome.windows.remove(window.id);
                            });
                        }
                    }
                }
            });
        }
    }
    chrome.windows.getAll({populate:true}, function (wnds){
        windowobjarray = wnds;
    });
});
chrome.windows.onFocusChanged.addListener(function (windowId){
    if(windowId > -1){
        chrome.windows.get(windowId, {populate: false}, function (window){
            if(window&&(window.type == "normal")){
                prefocuswindowid = window.id;
            }
        });
    }
});
chrome.windows.onRemoved.addListener(function (windowId) {
    var len = orderobjarray.length;
    for(var i = 0; i < len; i++){
        if(windowId == orderobjarray[i].id){
            orderobjarray.splice(i,1);
            break;
        }
    }
    chrome.windows.getAll({populate:true}, function (wnds){
        windowobjarray = wnds;
    });
});
function openOptionsPage(){
    var extviews = chrome.extension.getViews({"type": "tab"});
    for (var i=0; i <= extviews.length; i++) {
        if (i == extviews.length) {
            chrome.tabs.create({
                url: "options.html"
            });
        }else if (extviews[i].location.href == chrome.extension.getURL("options.html")) {
            extviews[i].chrome.tabs.getCurrent(function (focusTab){
                chrome.tabs.update(focusTab.id, {"active": true});
            });
            break;
        }
    }
}
function toggleCurrent2LastActive(){
    chrome.windows.getCurrent({populate:false},function(wn){
        var windowId = wn.id;
        for(var i = 0, l = orderobjarray.length; i < l; i++){
            if(windowId == orderobjarray[i].id){
                var tlen = orderobjarray[i].ordr.length;
                if(tlen > 1){
                    var selid = orderobjarray[i].ordr[tlen-2];
                    if(selid > -1){
                        chrome.tabs.update(selid,{active:true});
                    }
                }
            }
        }
    });
}
chrome.runtime.onInstalled.addListener(function(details) {
    if(details.reason == "install"){
        openOptionsPage();
    }
});
chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    if(msg.stat == "init"){
        if(optionobject.exlnk){
            var url = msg.url;
            var exlist = optionobject.expexlnkurl;
            var obj = exceptList(url,exlist);
            if(!obj){
                sendResponse({msg: "stat",list:exlist});
            }else{
                var selval = obj.sel;
                if(obj&&selval){
                    sendResponse({msg: selval,list:exlist});
                }
            }
        }
    }else if(msg.msg === "opentab"){
        var url = msg.url;
        if(msg.mode === "new"){
            chrome.tabs.create({url:url});
        }else if(msg.mode === "bg"){
            chrome.tabs.create({url:url,active:false});
        }else{
            chrome.tabs.update({url:url});
        }
        sendResponse({});
    }
});
chrome.commands.onCommand.addListener(function(command) {
    if(command == "myCommandSORTTABTITLE"){
        sortCurrentWindow("title");
    }else if(command == "myCommandSORTTABURL"){
        sortCurrentWindow("url");
    }else if(command == "myCommandCRNT2ACT"){
        toggleCurrent2LastActive();
    }
});
function sortCurrentWindow(opt){
    chrome.tabs.query({currentWindow:true},function(tabs){
        function cmp(a, b) {
            if(opt == "title"){
                if(!a.title){
                    a.title = "zz";
                }
                if(!b.title){
                    b.title = "zzx";
                }
                return a.title.localeCompare(b.title);
            }else if(opt == "url"){
                return a.url.localeCompare(b.url);
            }
        }
        tabs.sort(cmp);
        for(var i = 0, l = tabs.length; i < l; i++){
            var tab = tabs[i];
            (function(tab,i){
                chrome.tabs.update(tab.id,{pinned:false},function(){
                    chrome.tabs.move(tab.id,{index: i});
                });
            })(tab,i);
        }
    });
}
function moveFirst(tabId,windowId){
    chrome.windows.get(windowId,{populate:true},function(wnd){
        var tabs = wnd.tabs;
        for (var i = 0; i < tabs.length; i++) {
            if(!tabs[i].pinned){
                chrome.tabs.move(tabId, {index: i});
                return;
            }
        };
    })
}
chrome.webNavigation.onBeforeNavigate.addListener(function(details){
    if(details.frameId == 0){
        redirectobj[details.tabId] = details
    }
});
chrome.webNavigation.onCommitted.addListener(function(details){
    if(details.frameId == 0){
        var callback = function(obj){
            if(obj.sel == "first"){
                chrome.tabs.query({currentWindow:true},function(tabs){
                    moveFirst(details.tabId,tabs[0].windowId)
                })
            }else if(obj.sel == "middle"){
                chrome.tabs.query({currentWindow:true},function(tabs){
                    var idx = Math.floor(tabs.length/2);
                    chrome.tabs.move(details.tabId,{index:idx});
                })
            }else if(obj.sel == "last"){
                chrome.tabs.move(details.tabId,{index:-1});
            }
        };
        var obj = exceptList(details.url,optionobject.loadingurl);
        if(obj&&obj.sel){
            callback(obj);
        }else{
            if(details.transitionQualifiers&&details.transitionQualifiers.length > 0){
                for (var i = 0; i < details.transitionQualifiers.length; i++) {
                    if(details.transitionQualifiers[i] === "server_redirect"){
                        var obj = exceptList(redirectobj[details.tabId].url,optionobject.loadingurl);
                        if(obj&&obj.sel){
                            callback(obj);
                        }
                        break;
                    }
                };
            }
        }
    }
});
chrome.webNavigation.onCreatedNavigationTarget.addListener(function(details){
    if(details.tabId&&details.sourceTabId){
        childtabidarray[details.tabId] = details.sourceTabId;
    }
});
