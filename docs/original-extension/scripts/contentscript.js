var pushstatetimerid = null;
var addflag = false;
var linktype = null;
var mode = null;
var exlist = []
var host = location.protocol+"//"+location.hostname;host = host.toLowerCase();
var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
var config = { attributes: true,attributeFilter: ["target"] };
var observer = new MutationObserver(function(mutations) {
    var that = this;
    mutations.forEach(function(mutation) {
        if(linktype == "remove"){
            mutation.target.removeAttribute("target");
            that.disconnect();
        }else if(linktype == "add"){
            mutation.target.setAttribute("target","_blank");
            that.disconnect();
        }
    });
});
document.addEventListener("DOMContentLoaded",function(e){
    connectPort();
},false);
window.addEventListener("load",function(e){
    connectPort();
    setTimeout(function(){
        connectPort();
    },400)
    setTimeout(function(){
        connectPort();
    },800)
    setTimeout(function(){
        connectPort();
    },1200)
},false);

function connectPort(){
    if(!addflag){
        addflag = true;
        chrome.runtime.sendMessage({stat: "init",url:host+location.pathname},function(msg){
            if(msg.msg === "except"){
            }else{
                mode = msg.msg;
                if(mode == "forcecrnt"){
                    linktype = "remove";
                }else{
                    linktype = "add";
                }
                if(msg.list){
                    var list = msg.list,nlist = [];
                    for (var i = 0; i < list.length; i++) {
                        if((list[i].sel === "forcenewa")||(list[i].sel === "forcecrnta")||(list[i].sel === "forcebga")){
                            nlist.push(list[i]);
                        }
                    };
                    exlist = nlist;
                }
                var aary = document.getElementsByTagName("a");
                addBlank(mode,aary,exlist);
                setTimeout(function(){
                    var obsrvr = new MutationObserver(function(mutations){
                        mutations.forEach(function(mutation) {
                            var elem = mutation.target;
                            var naary = elem.querySelectorAll("a");
                            var aary = Array.prototype.slice.call(naary,0);
                            if(elem.tagName === "A"){
                                if(aary.length > 0){
                                    aary.push(elem)
                                }else{
                                    aary[0] = elem;
                                }
                            }
                            addBlank(mode,aary,exlist);
                        });
                    });
                    obsrvr.observe(document.body, { childList: true , subtree: true});
                },10);
            }
        });
    }
}
function addBlank(mode,aary,exlist){
    for (var i = 0; i < aary.length; i++) {
        var elem = aary[i];
        if(!elem.href)continue;
        var href = elem.href.toLowerCase();
        if(0 != href.indexOf("javascript:")){
            var atgobj;
            if(atgobj = exceptList(href,exlist)){
                var selval = atgobj.sel;
                if(selval == "forcenewa"){
                    elem.setAttribute("data-blink_extension___url_",href);
                    elem.removeEventListener("click",clickForceNewTabAtag,true);
                    elem.addEventListener("click",clickForceNewTabAtag,true);
                }else if(selval == "forcecrnta"){
                    elem.setAttribute("data-blink_extension___url_",href);
                    elem.removeEventListener("click",clickForceCurrentTabAtag,true);
                    elem.addEventListener("click",clickForceCurrentTabAtag,true);
                }else if(selval == "forcebga"){
                    elem.setAttribute("data-blink_extension___url_",href);
                    elem.removeEventListener("click",clickForceBGTabAtag,true);
                    elem.addEventListener("click",clickForceBGTabAtag,true);
                }
            }else{
                if(mode == "forcenew"){
                    elem.target = "_blank";
                    observer.observe(elem, config);
                }else if(mode == "forcecrnt"){
                    elem.removeAttribute("target");
                    observer.observe(elem, config);
                }else if(mode == "forcebg"){
                    elem.setAttribute("data-blink_extension___url_",href);
                    elem.removeEventListener("click",clickForceBGTabAtag,true);
                    elem.addEventListener("click",clickForceBGTabAtag,true);
                }else{
                    if(0 != href.indexOf(host)){
                        if(elem.target != "_blank"){
                            elem.target = "_blank";
                            observer.observe(elem, config);
                        }
                    }
                }
            }
        }
    }
}
function clickForceNewTabAtag(e){
    e.preventDefault();
    e.stopPropagation();
    var url = getOpenURL(this)
    chrome.runtime.sendMessage({msg: "opentab",url:url,mode:"new"});
}
function clickForceBGTabAtag(e){
    e.preventDefault();
    e.stopPropagation();
    var url = getOpenURL(this)
    chrome.runtime.sendMessage({msg: "opentab",url:url,mode:"bg"});
}
function clickForceCurrentTabAtag(e){
    e.preventDefault();
    e.stopPropagation();
    var url = getOpenURL(this)
    chrome.runtime.sendMessage({msg: "opentab",url:url,mode:"crnt"});
}
function getOpenURL(elem){
    var url = elem.href;
    if(!url)url = elem.getAttribute("data-blink_extension___url_");
    return url;
}
function exceptList(url,list){
    if(list){
        var len = list.length;
        for(var i = 0; i < len; i++){
            var lurl = list[i].url;

            var regex = new RegExp(lurl);
            if (url.search(regex) != -1) {
                return list[i];
            }
            if(lurl.match(/^(http|https):\/\/.+$/)){
                var idx = url.indexOf(lurl);
                if(idx == 0){
                    return list[i];
                }
            }else{
                var urlary = url.split("/");
                if(urlary[2]){
                    var domain = urlary[2];
                    var idx = domain.indexOf(lurl);
                    if(idx == 0){
                        return list[i];
                    }
                    var regex = new RegExp(lurl);
                    if (domain.search(regex) != -1) {
                        return list[i];
                    }
                }
            }
        }
    }
    return null;
}
