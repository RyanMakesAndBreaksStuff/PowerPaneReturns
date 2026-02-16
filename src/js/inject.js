(function () {
    "use strict";

    const ext = typeof browser === "undefined" ? chrome : browser;

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

        var mainBody = document.querySelectorAll('body[scroll=no]');
        var topBar = document.querySelector("div[data-id=topBar]")

        if (mainBody && mainBody.length > 0) {
            return ApplicationType.DynamicsCRM
        } else if (topBar) {
            return ApplicationType.Dynamics365
        } else {
            return null;
        }
    }

    function BuildScriptTag(source) {
        var script = document.createElement("script");
        script.setAttribute('type', 'text/javascript');
        script.setAttribute('src', source);

        return script;
    }

    function BuildSytleTag(source) {
        var style = document.createElement('link');
        style.setAttribute('rel', 'stylesheet');
        style.setAttribute('type', 'text/css');
        style.setAttribute('href', source);
        return style;
    }

    function fadeColor(rgb, factor) {
        const m = rgb.match(/\d+/g);
        if (!m || m.length < 3) return rgb;
        const [r, g, b] = m.map(Number);
        const f = Math.max(0, Math.min(1, factor));
        return `rgb(${Math.round(r + (255 - r) * f)}, ${Math.round(g + (255 - g) * f)}, ${Math.round(b + (255 - b) * f)})`;
    }

    function BuildPowerPaneButton() {
        var powerPaneButton = document.createElement("span");
        powerPaneButton.setAttribute('class', 'navTabButton');
        powerPaneButton.setAttribute('id', 'crm-power-pane-button');
        powerPaneButton.setAttribute('title', 'Open Power Pane Returns');


        var linkElement = document.createElement("a");
        linkElement.setAttribute("class", "navTabButtonLink");
        linkElement.setAttribute("title", "");

        var linkImageContainerElement = document.createElement("span");
        linkImageContainerElement.setAttribute("class", "navTabButtonImageContainer");

        var imageElement = document.createElement("img");
        try {
            imageElement.setAttribute("src", ext.runtime.getURL("img/icon-48.png"));
        } catch (e) {
            console.error("URL Image Error: ", e);
        }

        if (getApplicationType() === ApplicationType.Dynamics365) {
            const topBarEl = window.top.document.getElementById('topBar');
            const divBG = topBarEl ? window.getComputedStyle(topBarEl).backgroundColor : null;

            // Apply custom styles
            powerPaneButton.style.cssText = 'float:left; width:48px; height:48px;cursor:pointer!important';
            linkElement.style.cssText = `float:left; width:48px; height:48px;cursor:pointer!important;text-align:center;background-color:${divBG}`;

            // Add hover effects to the button.
            linkElement.style.transition = 'background-color 0.3s';
            if (divBG) {
                linkElement.addEventListener('mouseenter', function () {
                    linkElement.style.backgroundColor = fadeColor(divBG, 0.5); // Fade on hover
                });
                linkElement.addEventListener('mouseleave', function () {
                    linkElement.style.backgroundColor = divBG; // Revert on leave
                });
            }
        } else {
            // Default styling for DynamicsCRM.
            powerPaneButton.setAttribute('style', 'float:left; width:48px; height:48px;cursor:pointer!important');
            linkElement.setAttribute("style", "float:left; width:48px; height:48px;cursor:pointer!important;text-align:center");
            imageElement.style.marginLeft = '-15px';
        }


        linkImageContainerElement.appendChild(imageElement);
        linkElement.appendChild(linkImageContainerElement);
        powerPaneButton.appendChild(linkElement);

        return powerPaneButton;
    }

    function InjectSource(sources) {

        var isPowerPaneInjected = Array.from(window.top.document.scripts).find(function (elem) { return elem.src.indexOf("ui/js/pane.js") > -1 });

        if (isPowerPaneInjected != undefined) { //power pane already injected
            return;
        }

        const body = window.top.document.querySelector('body[scroll=no]') || window.top.document.querySelector('body');

        sources.forEach(function (s) {
            body.appendChild(s);
        });
    }


    function InjectPowerPaneButton() {
        const powerPaneButton = BuildPowerPaneButton();
        const applicationType = getApplicationType();

        if (applicationType == ApplicationType.DynamicsCRM) {
            var ribbon = window.top.document.querySelector('#navBar');

            if (ribbon) {
                ribbon.prepend(powerPaneButton);
            }

            return true;

        } else if (applicationType == ApplicationType.Dynamics365) {
            var officeWaffle = window.top.document.querySelector("button[data-id=officewaffle]");

            if (officeWaffle) {
                officeWaffle.before(powerPaneButton);
            }

            return true;
        }

        return false;
    };

    function Initialize() {
        Interval.PowerPaneControl.Pointer = setInterval(function () {

            Interval.PowerPaneControl.Count++;
            if (Interval.PowerPaneControl.Count > Interval.PowerPaneControl.MaxTryCount) {
                clearInterval(Interval.PowerPaneControl.Pointer);
            }

            var powerPaneButton = document.getElementById("crm-power-pane-button");

            if (!powerPaneButton) {
                var injectButtonResult = InjectPowerPaneButton();
                if (injectButtonResult == false) {
                    return;
                }

                const powerPaneTemplate = ext.runtime.getURL("ui/pane.html");

                fetch(powerPaneTemplate)
                    .then(function (response) {
                        if (!response.ok) {
                            throw new Error("Power Pane load failed: " + response.status);
                        }
                        return response.text();
                    })
                    .then(function (html) {
                        var content = document.createElement("div");
                        content.innerHTML = html;
                        content.className = "crm-power-pane-container";

                        var style = BuildSytleTag(ext.runtime.getURL("ui/css/pane.css"));
                        var script = BuildScriptTag(ext.runtime.getURL("ui/js/pane.js"));

                        InjectSource([style, script, content]);
                    })
                    .catch(function (err) {
                        console.error(err);
                    });
            } else {
                clearInterval(Interval.PowerPaneControl.Pointer);
            }
        }, 1000);
    }

    Initialize();

})();
