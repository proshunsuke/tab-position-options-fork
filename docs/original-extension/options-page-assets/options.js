document.addEventListener("DOMContentLoaded", function(e) {
    document.getElementById("addbutton").addEventListener("click",clickAddButton,false);
    document.getElementById("addbutton2").addEventListener("click",clickAddButton2,false);
    document.getElementById("addbutton3").addEventListener("click",clickAddButton3,false);
    document.getElementById("addbutton4").addEventListener("click",clickAddButton4,false);
    document.getElementById("openbutton1").addEventListener("change",changeOpenPosSelect,false);
    document.getElementById("openbutton2").addEventListener("change",changeOpenPosSelect,false);
    document.getElementById("openbutton3").addEventListener("change",changeOpenPosSelect,false);
    document.getElementById("openbutton4").addEventListener("change",changeOpenPosSelect,false);
    document.getElementById("openbutton5").addEventListener("change",changeOpenPosSelect,false);
    document.getElementById("activebutton1").addEventListener("change",changeActiveTabSelect,false);
    document.getElementById("activebutton2").addEventListener("change",changeActiveTabSelect,false);
    document.getElementById("activebutton3").addEventListener("change",changeActiveTabSelect,false);
    document.getElementById("activebutton4").addEventListener("change",changeActiveTabSelect,false);
    document.getElementById("activebutton5").addEventListener("change",changeActiveTabSelect,false);
    document.getElementById("activebutton6").addEventListener("change",changeActiveTabSelect,false);
    document.getElementById("activebutton7").addEventListener("change",changeActiveTabSelect,false);
    document.getElementById("activebutton8").addEventListener("change",changeActiveTabSelect,false);
    document.getElementById("newtabgcheckbox").addEventListener("change",changeNewTabActiveCheckbox,false);
    document.getElementById("popupntbcheckbox").addEventListener("change",changePopupAsNewTab,false);
    document.getElementById("exlinknewtabcheckbox").addEventListener("change",changeExLinkSelect,false);
    document.getElementById("onactbutton1").addEventListener("change",changeOnActiveTabSelect,false);
    document.getElementById("onactbutton2").addEventListener("change",changeOnActiveTabSelect,false);
    document.getElementById("onactbutton3").addEventListener("change",changeOnActiveTabSelect,false);
    document.getElementById("exportbutton").addEventListener("click",saveSettingText,false);
    document.getElementById("importbutton").addEventListener("click",importSettingText,false);
    createHiddenButton();
    setDefaultValue();
    getSync();
},false);

var bgpage = chrome.extension.getBackgroundPage();
var excptidex = -1;
var excptexlnkidex = -1;
var optidex = -1;
var loadingurlidex = -1;
var optionobject = {};
var openoptionarray = [];
var excpetoptionarray = [];
var excpetexlinkarray = [];
var loadingurlarray = [];

function setDefaultValue(){
    optionobject.openurl = [];
    optionobject.osel = "openbutton5";
    optionobject.actb = "activebutton6";
    optionobject.newt = "false";
    optionobject.popt = "false";
    optionobject.expurl = [];
    optionobject.loadingurl = [];
}
function createHiddenButton(){
    var btn = document.createElement("input");
    document.body.appendChild(btn);
    btn.style.visibility = "hidden";
    btn.setAttribute("type","file");
    btn.setAttribute("id","hiddenfilebutton");
    btn.setAttribute("accept","text/plain");
    btn.addEventListener("change",fileHandler,false);
}
function saveSettingText() {
    var optobj = JSON.stringify(optionobject);
    var a = document.createElement('a');
    a.href = 'data:text/plain,' + encodeURIComponent(optobj);
    a.download = "tabposition.txt";
    var types = ['mousedown','mouseup', 'click'];
    for ( var i = 0, l = types.length; i < l; i++){
        var clicker = new MouseEvent(types[i], {
            'bubbles': true,
            'cancelable': true,
            'view': window,
            'detail': 0,
            'screenX': 0,
            'screenY': 0,
            'clientX': 0,
            'clientY': 0,
            'ctrlKey': false,
            'altKey': false,
            'shiftKey': false,
            'metaKey': false,
            'button': 0,
            'relatedTarget': null
        });
        a.dispatchEvent(clicker);
    }
}
function importSettingText(){
    document.getElementById("hiddenfilebutton").click();
}
function fileHandler(e){
    var file = this.files[0];
    if(file.type == "text/plain"){
        var fr = new FileReader();
        fr.onload = function () {
            var txtobj = fr.result;
            var jsonobj = JSON.parse(txtobj);
            if(jsonobj.osel&&jsonobj.actb){
                setSettings(jsonobj);
                createOpenURLItem("","default","fore");
                setSync();
            }
        };
        fr.readAsText(file);
    }
}
function changeExLinkSelect(e){
    var row = e.currentTarget;
    if(row.checked){
        optionobject.exlnk = true;
        document.getElementById("exceptextlinklistcontainer").style.visibility = "visible";
    }else{
        optionobject.exlnk = null;
        document.getElementById("exceptextlinklistcontainer").style.visibility = "hidden";
    }
    setSync();
}
function changeOnActiveTabSelect(e){
    var row = e.currentTarget;
    optionobject.onactvtb = row.id;
    setSync();
}
function changeActiveTabSelect(e){
    var row = e.currentTarget;
    optionobject.actb = row.id;
    setSync();
}
function changeOpenPosSelect(e){
    var row = e.currentTarget;
    optionobject.osel = row.id;
    setSync();
}
function changeNewTabActiveCheckbox(e){
    var row = e.currentTarget;
    if(row.checked){
        optionobject.newt = "true";
    }else{
        optionobject.newt = "false";
    }
    setSync();
}
function changePopupAsNewTab(e){
    var row = e.currentTarget;
    if(row.checked){
        optionobject.popt = "true";
        document.getElementById("exceptlistcontainer").style.visibility = "visible";
    }else{
        optionobject.popt = "false";
        document.getElementById("exceptlistcontainer").style.visibility = "hidden";
    }
    setSync();
}
function clickAddButton(){
    createOpenURLItem("","default","fore");
}
function clickAddButton2(){
    createExceptItem("");
}
function clickAddButton3(){
    createExceptExLinkItem("");
}
function clickAddButton4(){
    createLoadingURLItem("");
}
function clickCloseImg(e){
    var eindx = e.currentTarget.index;
    var row = document.getElementById("ourlinput"+eindx);
    row.focus();
    row.value = "";
    row.blur();
}
function createOpenURLItem(inpuval,selval,selval2){
    optidex++;
    var maincont = document.getElementById("openurllist");

    var cont = document.createElement("div");
    maincont.appendChild(cont);
    cont.setAttribute("class","oinputcontclass");

    var cimg = document.createElement("img");
    cont.appendChild(cimg);
    cimg.setAttribute("src","close.png");
    cimg.setAttribute("class","closeimgclass");
    cimg.index = optidex;
    cimg.addEventListener("click",clickCloseImg,false);

    var inpt = document.createElement("input");
    cont.appendChild(inpt);
    inpt.setAttribute("type","text");
    inpt.setAttribute("class","openurlitemclass");
    inpt.setAttribute("id","ourlinput"+optidex);
    inpt.setAttribute("placeholder","URL");
    inpt.addEventListener("blur",blurOpenURLInput,false);
    inpt.index = optidex;
    inpt.value = inpuval;

    var slct = document.createElement("select");
    cont.appendChild(slct);
    slct.setAttribute("class","oselectclass");
    slct.setAttribute("id","ourlselect"+optidex);
    slct.index = optidex;
    slct.addEventListener("change",blurOpenURLInput,false);

    createSelectOption("Always first","first",slct);
    createSelectOption("Always last","last",slct);
    createSelectOption("Right of current tab","right",slct);
    createSelectOption("Left of current tab","left",slct);
    createSelectOption("Default","default",slct);
    slct.value = selval;

    var actslct = document.createElement("select");
    cont.appendChild(actslct);
    actslct.setAttribute("class","actselclass");
    actslct.setAttribute("id","actselect"+optidex);
    actslct.index = optidex;
    actslct.addEventListener("change",blurOpenURLInput,false);

    createSelectOption("Foreground","fore",actslct);
    createSelectOption("Background","back",actslct);
    actslct.value = selval2;
}
function createSelectOption(optt,optv,prntnd){
    var optelem = document.createElement("option");
    optelem.text = optt;
    optelem.value = optv;
    prntnd.add(optelem);
}
function blurOpenURLInput(e){
    var eindx = e.currentTarget.index;
    var row = document.getElementById("ourlinput"+eindx);
    var val = row.value;
    val = val.replace(/^\s+|\s+$/g, "");
    if(val){
        setOpenURLOption(val,row.index);
    }else{
        if(e.srcElement.tagName.toUpperCase() != "SELECT"){
            setOpenURLOption(null,row.index)
            var prntnd = row.parentNode;
            prntnd.parentNode.removeChild(prntnd);
        }
    }
}
function setOpenURLOption(val,index){
    if(val){
        var selelem = document.getElementById("ourlselect"+index);
        var actelem = document.getElementById("actselect"+index);

        var optionobj = {};
        optionobj.url = val;
        optionobj.sel = selelem.value;
        optionobj.act = actelem.value;
        openoptionarray[index] = optionobj;
    }else{
        openoptionarray[index] = null;
    }

    var opt =[];
    for(var i = 0; i < openoptionarray.length; i++){
        if(openoptionarray[i]){
            opt.push(openoptionarray[i]);
        }
    }
    optionobject.openurl = opt;
    setSync();
}
function createExceptItem(inpuval){
    excptidex++;
    var maincont = document.getElementById("exceptpopupllist");

    var cont = document.createElement("div");
    maincont.appendChild(cont);
    cont.setAttribute("class","oinputcontclass");

    var cimg = document.createElement("img");
    cont.appendChild(cimg);
    cimg.setAttribute("src","close.png");
    cimg.setAttribute("class","closeimgclass");
    cimg.index = excptidex;
    cimg.addEventListener("click",clickCloseImg2,false);

    var inpt = document.createElement("input");
    cont.appendChild(inpt);
    inpt.setAttribute("type","text");
    inpt.setAttribute("class","openurlitemclass");
    inpt.setAttribute("placeholder","URL");
    inpt.index = excptidex;
    inpt.value = inpuval;
    inpt.addEventListener("blur",blurExceptInput,false);
    inpt.setAttribute("id","exceptinput"+excptidex);
}
function clickCloseImg2(e){
    var eindx = e.currentTarget.index;
    var row = document.getElementById("exceptinput"+eindx);
    row.focus();
    row.value = "";
    row.blur();
}
function blurExceptInput(e){
    var row = e.currentTarget;
    var val = row.value;
    val = val.replace(/^\s+|\s+$/g, "");
    if(val){
        setExceptOption(val,row.index);
    }else{
        setExceptOption(null,row.index);
        var prntnd = row.parentNode;
        prntnd.parentNode.removeChild(prntnd);
    }
}
function setExceptOption(val,index){
    if(val){
        var optionobj = {};
        optionobj.url = val;
        optionobj.sel = "1"	;
        excpetoptionarray[index] = optionobj;
    }else{
        excpetoptionarray[index] = null;
    }

    var opt =[];
    for(var i = 0; i < excpetoptionarray.length; i++){
        if(excpetoptionarray[i]){
            opt.push(excpetoptionarray[i]);
        }
    }
    optionobject.expurl = opt;
    setSync();
}
function createExceptExLinkItem(inpuval,selno){
    excptexlnkidex++;
    var maincont = document.getElementById("exceptextlinkllist");

    var cont = document.createElement("div");
    maincont.appendChild(cont);
    cont.setAttribute("class","oinputcontclass");

    var cimg = document.createElement("img");
    cont.appendChild(cimg);
    cimg.setAttribute("src","close.png");
    cimg.setAttribute("class","closeimgclass");
    cimg.index = excptexlnkidex;
    cimg.addEventListener("click",clickCloseImg3,false);

    var inpt = document.createElement("input");
    cont.appendChild(inpt);
    inpt.setAttribute("type","text");
    inpt.setAttribute("class","openurlitemclass");
    inpt.setAttribute("placeholder","URL");
    inpt.index = excptexlnkidex;
    inpt.value = inpuval;
    inpt.addEventListener("blur",blurExceptExLinkInput,false);
    inpt.setAttribute("id","exceptexlinkinput"+excptexlnkidex);

    var actslct = document.createElement("select");
    cont.appendChild(actslct);
    actslct.setAttribute("class","exlinkselclass");
    actslct.setAttribute("id","exmatchlinkselect"+excptexlnkidex);
    actslct.index = excptexlnkidex;
    actslct.addEventListener("change",blurExceptExLinkInput,false);

    createSelectOption("Except (Page URL)","except",actslct);
    createSelectOption("Force New Tab (Page URL)","forcenew",actslct);
    createSelectOption("Force Background Tab (Page URL)","forcebg",actslct);
    createSelectOption("Force Current Tab (Page URL)","forcecrnt",actslct);
    createSelectOption("Force New Tab (A tag href)","forcenewa",actslct);
    createSelectOption("Force Background Tab (A tag href)","forcebga",actslct);
    createSelectOption("Force Current Tab (A tag href)","forcecrnta",actslct);
    if(selno){
        actslct.value = selno;
    }
}
function clickCloseImg3(e){
    var eindx = e.currentTarget.index;
    var row = document.getElementById("exceptexlinkinput"+eindx);
    row.focus();
    row.value = "";
    row.blur();
}
function blurExceptExLinkInput(e){
    var eindx = e.currentTarget.index;
    var row = document.getElementById("exceptexlinkinput"+eindx);
    var val = row.value;
    val = val.replace(/^\s+|\s+$/g, "");
    if(val){
        setExceptExLinkOption(val,row.index);
    }else{
        if(e.srcElement.tagName.toUpperCase() != "SELECT"){
            setExceptExLinkOption(null,row.index)
            var prntnd = row.parentNode;
            prntnd.parentNode.removeChild(prntnd);
        }
    }
}
function setExceptExLinkOption(val,index){
    if(val){
        var actelem = document.getElementById("exmatchlinkselect"+index);
        var optionobj = {};
        optionobj.url = val;
        optionobj.sel = actelem.value;
        excpetexlinkarray[index] = optionobj;
    }else{
        excpetexlinkarray[index] = null;
    }

    var opt =[];
    for(var i = 0; i < excpetexlinkarray.length; i++){
        if(excpetexlinkarray[i]){
            opt.push(excpetexlinkarray[i]);
        }
    }
    optionobject.expexlnkurl = opt;
    setSync();
}
function createLoadingURLItem(inpuval,selno){
    loadingurlidex++;
    var maincont = document.getElementById("loadingurllist");

    var cont = document.createElement("div");
    maincont.appendChild(cont);
    cont.setAttribute("class","oinputcontclass");

    var cimg = document.createElement("img");
    cont.appendChild(cimg);
    cimg.setAttribute("src","close.png");
    cimg.setAttribute("class","closeimgclass");
    cimg.index = loadingurlidex;
    cimg.addEventListener("click",clickCloseImg4,false);

    var inpt = document.createElement("input");
    cont.appendChild(inpt);
    inpt.setAttribute("type","text");
    inpt.setAttribute("class","openurlitemclass");
    inpt.setAttribute("placeholder","URL");
    inpt.index = loadingurlidex;
    inpt.value = inpuval;
    inpt.addEventListener("blur",blurLoadingURLInput,false);
    inpt.setAttribute("id","loadingurlinput"+loadingurlidex);

    var actslct = document.createElement("select");
    cont.appendChild(actslct);
    actslct.setAttribute("class","exlinkselclass");
    actslct.setAttribute("id","loadingurlselect"+loadingurlidex);
    actslct.index = loadingurlidex;
    actslct.addEventListener("change",blurLoadingURLInput,false);

    createSelectOption("Always last","last",actslct);
    createSelectOption("Always middle","middle",actslct);
    createSelectOption("Always first","first",actslct);

    if(selno){
        actslct.value = selno;
    }
}
function clickCloseImg4(e){
    var eindx = e.currentTarget.index;
    var row = document.getElementById("loadingurlinput"+eindx);
    row.focus();
    row.value = "";
    row.blur();
}
function blurLoadingURLInput(e){
    var eindx = e.currentTarget.index;
    var row = document.getElementById("loadingurlinput"+eindx);
    var val = row.value;
    val = val.replace(/^\s+|\s+$/g, "");
    if(val){
        setLoadingURLOption(val,row.index);
    }else{
        if(e.srcElement.tagName.toUpperCase() != "SELECT"){
            setLoadingURLOption(null,row.index)
            var prntnd = row.parentNode;
            prntnd.parentNode.removeChild(prntnd);
        }
    }
}
function setLoadingURLOption(val,index){
    if(val){
        var actelem = document.getElementById("loadingurlselect"+index);
        var optionobj = {};
        optionobj.url = val;
        optionobj.sel = actelem.value;
        loadingurlarray[index] = optionobj;
    }else{
        loadingurlarray[index] = null;
    }
    var opt =[];
    for(var i = 0; i < loadingurlarray.length; i++){
        if(loadingurlarray[i]){
            opt.push(loadingurlarray[i]);
        }
    }
    optionobject.loadingurl = opt;
    setSync();
}
function setSync() {
    bgpage.setOption(optionobject);
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
                            setSettings(optobj);
                            createOpenURLItem("","default","fore");
                            bgpage.setOption(optobj);
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
                setSettings(jsonoptobj);
                createOpenURLItem("","default","fore");
                bgpage.setOption(jsonoptobj);
            }
        }
    }
}
function getSync(){
    chrome.storage.sync.get("opt",function(items) {
        if(items&&items.opt){
            var optobj = items.opt;
            var tmpopt =  JSON.stringify(optobj);
            localStorage.setItem("_temp_optobj",tmpopt);
            setSettings(optobj);
            createOpenURLItem("","default","fore");
            bgpage.setOption(optobj);
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
                    setSettings(jsonopt);
                    createOpenURLItem("","default","fore");
                    bgpage.setOption(jsonopt);
                    syncOptStore.set(jsonopt);
                }
                localStorage.removeItem("_temp_optobj");
            }else{
                getOptSync();
            }
        }
    });
}
function setSettings(optobj){
    if(optobj){
        var urlary = optobj.openurl;
        if(urlary&&urlary.length > 0){
            for(var i = 0; i < urlary.length; i++){
                openoptionarray.push(urlary[i]);
                createOpenURLItem(urlary[i].url,urlary[i].sel,urlary[i].act);
            }
        }else{
            optobj.openurl = [];
        }
        var osel = optobj.osel;
        if(osel){
            document.getElementById(osel).checked = true;
        }else{
            optobj.osel = "openbutton5";
        }

        var asel = optobj.actb;
        if(asel){
            document.getElementById(asel).checked = true;
        }else{
            optobj.actb = "activebutton6";
        }

        var onasel = optobj.onactvtb;
        if(onasel){
            document.getElementById(onasel).checked = true;
        }else{
            optobj.onactvtb = "onactbutton1";
        }

        var ntba = optobj.newt;
        if(ntba == "true"){
            document.getElementById("newtabgcheckbox").checked = true;
        }else{
            optobj.newt = "false";
        }

        var ppt = optobj.popt;
        if(ppt == "true"){
            document.getElementById("popupntbcheckbox").checked = true;
            document.getElementById("exceptlistcontainer").style.visibility = "visible";
        }else{
            optobj.popt = "false";
        }

        var eurlary = optobj.expurl;
        if(eurlary&&eurlary.length > 0){
            for(var i = 0; i < eurlary.length; i++){
                excpetoptionarray.push(eurlary[i]);
                createExceptItem(eurlary[i].url);
            }
        }else{
            optobj.expurl = [];
        }
        if(optobj.exlnk){
            document.getElementById("exlinknewtabcheckbox").checked = true;
            document.getElementById("exceptextlinklistcontainer").style.visibility = "visible";
        }
        var elnkurlary = optobj.expexlnkurl;
        if(elnkurlary&&(elnkurlary.length > 0)){
            for(var i = 0; i < elnkurlary.length; i++){
                excpetexlinkarray.push(elnkurlary[i]);
                createExceptExLinkItem(elnkurlary[i].url,elnkurlary[i].sel);
            }
        }else{
            optobj.expexlnkurl = [];
        }
        var ldingurlary = optobj.loadingurl;
        if(ldingurlary&&(ldingurlary.length > 0)){
            for(var i = 0; i < ldingurlary.length; i++){
                loadingurlarray.push(ldingurlary[i]);
                createLoadingURLItem(ldingurlary[i].url,ldingurlary[i].sel);
            }
        }else{
            optobj.loadingurl = [];
        }
        optionobject = optobj;
    }
}
