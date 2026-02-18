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
        linkElement.addEventListener("mouseleave", function () {
          linkElement.style.backgroundColor = divBG;
        });
      }
    } else {
      powerPaneButton.style.cssText = "float:left; width:48px; height:48px;cursor:pointer!important";
      linkElement.style.cssText = "float:left; width:48px; height:48px;cursor:pointer!important;text-align:center";
      imageElement.style.marginLeft = "-15px";
    }

    linkImageContainerElement.appendChild(imageElement);
    linkElement.appendChild(linkImageContainerElement);
    powerPaneButton.appendChild(linkElement);

    function InjectPowerPaneButton() {
        const powerPaneButton = BuildPowerPaneButton();
        const applicationType = getApplicationType();

  function injectPowerPaneButton() {
    const powerPaneButton = buildPowerPaneButton();
    const applicationType = getApplicationType();

    if (applicationType === ApplicationType.DynamicsCRM) {
      const ribbon = getTopDocument().querySelector("#navBar");
      if (ribbon) {
        ribbon.prepend(powerPaneButton);
        return true;
      }
      return false;
    }

    if (applicationType === ApplicationType.Dynamics365) {
      const officeWaffle =
        getTopDocument().querySelector("button[data-id=officewaffle]") ||
        getTopDocument().querySelector("#O365_MainLink_NavMenu");
      if (officeWaffle) {
        officeWaffle.before(powerPaneButton);
        return true;
      }
      return false;
    }

    return false;
  }

  async function getStoredOptions() {
    try {
      const result = await ext.storage.local.get(STORAGE_KEY);
      const value = result && result[STORAGE_KEY];
      return (value && typeof value === "object") ? value : null;
    } catch (e) {
      console.warn("Failed to read options from storage:", e);
      return null;
    }
  }

  function applyVisibilityOptions(container, optionsObj) {
    if (!container || !optionsObj) return;

    // Hide disabled action items
    for (const [actionId, enabled] of Object.entries(optionsObj)) {
      if (enabled === false) {
        try {
          const el = container.querySelector(`#${CSS.escape(actionId)}`);
          if (el) el.style.display = "none";
        } catch (e) {
          // ignore bad selectors
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

    // If a section has no visible subgroups, hide the whole section
    const sections = container.querySelectorAll(".crm-power-pane-section");
    sections.forEach((ul) => {
      const items = Array.from(ul.querySelectorAll(".crm-power-pane-subgroup"));
      const anyVisible = items.some((li) => li.style.display !== "none");
      if (!anyVisible) ul.style.display = "none";
    });
  }

  function injectSource(sources) {
    const alreadyInjected = Array.from(getTopDocument().scripts).some((s) => (s.src || "").includes("ui/js/pane.js"));
    if (alreadyInjected) return;

    const body = getTopDocument().querySelector("body[scroll=no]") || getTopDocument().querySelector("body");
    if (!body) return;

    sources.forEach((node) => body.appendChild(node));
  }

  async function injectPane() {
    const templateUrl = ext.runtime.getURL("ui/pane.html");
    const res = await fetch(templateUrl);
    if (!res.ok) throw new Error(`Failed to fetch pane template: ${res.status}`);
    const html = await res.text();

    const content = document.createElement("div");
    content.innerHTML = html;
    content.className = "crm-power-pane-container";

    const optionsObj = await getStoredOptions();
    applyVisibilityOptions(content, optionsObj);

    const script = buildScriptTag(ext.runtime.getURL("ui/js/pane.js"));

    injectSource([content, script]);
  }

  function initialize() {
    Interval.PowerPaneControl.Pointer = window.setInterval(async function () {
      Interval.PowerPaneControl.Count++;
      if (Interval.PowerPaneControl.Count > Interval.PowerPaneControl.MaxTryCount) {
        clearInterval(Interval.PowerPaneControl.Pointer);
        return;
      }

      const powerPaneButton = getTopDocument().getElementById("crm-power-pane-button");
      const powerPaneRoot = getTopDocument().getElementById("crm-power-pane");

      if (!powerPaneButton) {
        const ok = injectPowerPaneButton();
        if (!ok) return;
      }

      if (!powerPaneRoot) {
        try {
          await injectPane();
        } catch (e) {
          console.error("Failed to inject Power Pane:", e);
        }
      }

      if (powerPaneButton && getTopDocument().getElementById("crm-power-pane")) {
        clearInterval(Interval.PowerPaneControl.Pointer);
      }
    }, 1000);
  }

  initialize();
})();
