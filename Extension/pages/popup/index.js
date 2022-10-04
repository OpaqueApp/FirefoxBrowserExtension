var enable = document.getElementById("enable")
var actions = document.getElementById("actions")
const getQuickLinkBtn = document.getElementById("quickLinkBtn")

enable.addEventListener("change", (e)=>{
    changeDivs(e.target.checked);
    setData();
})

function changeDivs(status){
    if(status){
        removeWelcomeScreen()
    }
}

var actionDataObj = {
    plainText:{
        explainer:"Explicitly defined words, numbers, and values to blur.",
        placeholder:"Plain Text"
    },
    regExp:{
        explainer:"Use Regular expressions to blur text matching a pattern.",
        placeholder:"Reg Ex"
    },
    wlidcards:{
        explainer:`Use the wildcard "*" to blur text.`,
        placeholder:"Wlidcards"
    },
    cssSelectors:{
        explainer:"Use CSS element types to select the CSS elements to blur targeted or widespread components of a website.",
        placeholder:"CSS Selectors"
    }
}

var actionBtn = document.querySelectorAll('button.actionBtn')
actionBtn.forEach((ele)=>{
    ele.addEventListener("click", ()=>{
        actionBtn.forEach(element => {
            element.classList.remove("actionBtnSelected")
            document.getElementById(element.value).style.display = "none";
        });

        setTextArea(ele.value)
        ele.classList.add("actionBtnSelected")
    })
})

function setTextArea(value){
    var explainer = document.getElementById("explainer")
    explainer.innerText = actionDataObj[value].explainer;

    document.getElementById(value).style.display = "block";
}

var textareaList = document.querySelectorAll('textarea.actionText')
textareaList.forEach(element => {
    element.addEventListener("input", (e)=>{
        setData()
    })
});

function setData(){
    var data = {
        storage:{
            plain_text: document.getElementById("plainText").value,
            css_selectors: document.getElementById("cssSelectors").value,
            regexp: document.getElementById("regExp").value,
            wildcards: document.getElementById("wlidcards").value,
            enabled_flag: document.getElementById("enable").checked,
            domain_name_flag: document.getElementById("domainName").checked,
            email_flag:  document.getElementById("email").checked,
            guid_flag: document.getElementById("guid").checked,
            is_add_open: true,
            is_plain_text_active: true,
            is_regexp_active: true,
            is_selectors_active: true,
            is_wildcards_active: true
        },
        name:"handle_change"
    }

    saveData(data)
}

function saveData(data){
    try {
        let name = data.name;
        if (name === "handle_change") {
            chrome.storage.local.set(data.storage);
        }
    } catch (e) {
      throw e;
    }
}

loadData();
function loadData(){
    chrome.storage.local.get(null, function(res){
        document.getElementById("plainText").value = (res.plain_text ? res.plain_text : "");
        document.getElementById("cssSelectors").value = (res.css_selectors ? res.css_selectors : "");
        document.getElementById("regExp").value = (res.regexp ? res.regexp : "");
        document.getElementById("wlidcards").value = (res.wildcards ? res.wildcards : "");

        document.getElementById("enable").checked = (res.enabled_flag ? res.enabled_flag : "");

        document.getElementById("guid").checked = res.guid_flag;
        document.getElementById("domainName").checked = res.domain_name_flag;
        document.getElementById("email").checked = res.email_flag;
        
        if(!res.welcomeScreen){
            document.getElementById("home").style.display = "block";
        }
    })
}

const backToMain = document.getElementById("backToMain")
backToMain.addEventListener("click", ()=>{
    const home = document.getElementById("home");
    const actions = document.getElementById("actions");
    const quickLinks = document.getElementById("quickLinks");
    
    quickLinks.style.display = "none";
    actions.style.display = "block";
    home.style.display = "none";
})

const quickLinkBtn = document.getElementById("quickLinkBtn");
quickLinkBtn.addEventListener("click", ()=>{
    const home = document.getElementById("home");
    const actions = document.getElementById("actions");
    const quickLinks = document.getElementById("quickLinks");
    
    quickLinks.style.display = "block";
    actions.style.display = "none";
    home.style.display = "none";
})


var quickLinksToggle = document.querySelectorAll('input.quickLinksToggle')
quickLinksToggle.forEach(element => {
    element.addEventListener("change", (e)=>{
        setData()
    })
});

document.getElementById("visitWebsite").addEventListener("click", ()=>{
    chrome.tabs.create({
        active: true,
        url: "https://opaque.app/",
    });
})

document.getElementById("contactUs").addEventListener("click", ()=>{
    chrome.tabs.create({
        active: true,
        url: "mailto:info@opaque.app",
    });
})

document.getElementById("closeBtn").addEventListener("click", removeWelcomeScreen);
function removeWelcomeScreen(){
    document.getElementById("home").style.display = "none";
    chrome.storage.local.set({welcomeScreen:true})
}