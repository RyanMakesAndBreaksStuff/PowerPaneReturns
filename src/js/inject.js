(function () {
    const browserAPI = typeof browser !== "undefined" ? browser : chrome;

    const Interval = {
        PowerPaneControl: {
            Pointer: undefined,
            Count: 0,
            MaxTryCount: 10
        }
    };

    const ApplicationType = {
        DynamicsCRM: "Dynamics CRM",
        Dynamics365: "Dynamics 365"
    };

    function getApplicationType() {
        const mainBody = document.querySelectorAll("body[scroll=no]");
        const topBar = document.querySelector("div[data-id=topBar]");
        if (mainBody && mainBody.length > 0) {
            return ApplicationType.DynamicsCRM;
        } else if (topBar) {
            return ApplicationType.Dynamics365;
        } else {
            return null;
        }
    }

    function buildScriptTag(source) {
        const script = document.createElement("script");
        script.type = "text/javascript";
        script.src = source;
        return script;
    }

    function buildStyleTag(source) {
        const style = document.createElement("link");
        style.rel = "stylesheet";
        style.type = "text/css";
        style.href = source;
        return style;
    }

    function buildPowerPaneButton() {
        const powerPaneButton = document.createElement("span");
        powerPaneButton.className = "navTabButton";
        powerPaneButton.id = "crm-power-pane-button";
        powerPaneButton.title = "Show Dynamics CRM Power Pane";

        const linkElement = document.createElement("a");
        linkElement.className = "navTabButtonLink";

        const linkImageContainerElement = document.createElement("span");
        linkImageContainerElement.className = "navTabButtonImageContainer";

        const imageElement = document.createElement("img");
        imageElement.src = browserAPI.runtime.getURL("img/icon-24.png");

        if (getApplicationType() === ApplicationType.Dynamics365) {
            powerPaneButton.style = "float:left; width:50px; height:48px;cursor:pointer!important";
            linkElement.style = "float:left; width:50px; height:48px;cursor:pointer!important;text-align:center";
            imageElement.style = "padding-top:10px";
        }

        linkImageContainerElement.appendChild(imageElement);
        linkElement.appendChild(linkImageContainerElement);
        powerPaneButton.appendChild(linkElement);

        return powerPaneButton;
    }

    function injectSource(sources) {
        const isPowerPaneInjected = Array.from(window.top.document.scripts).some(
            (elem) => elem.src.includes("ui/js/pane.js")
        );

        if (isPowerPaneInjected) {
            return; // Power Pane already injected
        }

        const body = window.top.document.querySelector("body[scroll=no]") || window.top.document.querySelector("body");

        sources.forEach((source) => {
            body.appendChild(source);
        });
    }

    function injectPowerPaneButton() {
        const powerPaneButton = buildPowerPaneButton();
        const applicationType = getApplicationType();

        if (applicationType === ApplicationType.DynamicsCRM) {
            const ribbon = window.top.document.querySelector("#navBar");
            if (ribbon) {
                ribbon.prepend(powerPaneButton);
                return true;
            }
        } else if (applicationType === ApplicationType.Dynamics365) {
            const officeWaffle = window.top.document.querySelector("button[data-id=officewaffle]");
            if (officeWaffle) {
                officeWaffle.before(powerPaneButton);
                return true;
            }
        }

        return false;
    }

    async function initialize() {
        Interval.PowerPaneControl.Pointer = setInterval(async () => {
            Interval.PowerPaneControl.Count++;
            if (Interval.PowerPaneControl.Count > Interval.PowerPaneControl.MaxTryCount) {
                clearInterval(Interval.PowerPaneControl.Pointer);
            }

            const powerPaneButton = document.getElementById("crm-power-pane-button");

            if (!powerPaneButton) {
                const injectButtonResult = injectPowerPaneButton();
                if (!injectButtonResult) {
                    return;
                }

                const powerPaneTemplate = browserAPI.runtime.getURL("ui/pane.html");

                try {
                    const response = await fetch(powerPaneTemplate);
                    if (response.ok) {
                        const content = document.createElement("div");
                        content.innerHTML = await response.text();
                        content.className = "crm-power-pane-container";

                        const style = buildStyleTag(browserAPI.runtime.getURL("ui/css/pane.css"));
                        const script = buildScriptTag(browserAPI.runtime.getURL("ui/js/pane.js"));

                        injectSource([style, script, content]);
                    } else {
                        console.error(`Failed to load pane.html: ${response.status}`);
                    }
                } catch (error) {
                    console.error("Error fetching Power Pane template:", error);
                }
            } else {
                clearInterval(Interval.PowerPaneControl.Pointer);
            }
        }, 1000);
    }

    // Listen for the message from the background script
    browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === "togglePowerPane") {
            const pane = document.querySelector(".crm-power-pane-sections");
            if (pane) {
                const nextValue = (pane.style.display !== "" && pane.style.display !== "none") ? "none" : "block";
                pane.style.display = nextValue;
            } else {
                console.error("CRM Power Pane element not found.");
            }
        }
    });
    initialize();
})();
