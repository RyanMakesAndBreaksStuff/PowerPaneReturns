const browserApi = (typeof browser !== "undefined") ? browser : chrome;

console.log(browserApi);


browserApi.action.onClicked.addListener(async function () {

    debugger;


    var togglePowerPaneCode = ''
        + 'var pane = document.querySelector(".crm-power-pane-sections");'
        + 'var nextValue = (pane.style.display !== "" && pane.style.display !== "none") ? "none" : "block";'
        + 'pane.style.display = nextValue;'

    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

    // Execute script in the current tab
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
            var pane = document.querySelector(".crm-power-pane-sections");
            var nextValue = (pane.style.display !== "" && pane.style.display !== "none") ? "none" : "block";
            pane.style.display = nextValue;
        },
    })

    // browser.tabs.executeScript({
    //     code: togglePowerPaneCode
    // });
});
