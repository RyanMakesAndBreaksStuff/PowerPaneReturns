/* global chrome, browser */

(() => {
  "use strict";

  const ext = (typeof browser !== "undefined") ? browser : chrome;
  const STORAGE_KEY = "powerPaneOptions"; // { [actionId: string]: boolean }

  function getTopDocument() {
    try {
      return window.top.document;
    } catch (e) {
      return window.document;
    }
  }

  const Interval = {
    PowerPaneControl: {
      Pointer: undefined,
      Count: 0,
      MaxTryCount: 15
    }
  };

  const ApplicationType = {
    DynamicsCRM: "Dynamics CRM",
    Dynamics365: "Dynamics 365"
  };

  function getApplicationType() {
    const mainBody = document.querySelectorAll("body[scroll=no]");
    const topBar = document.querySelector("div[data-id=topBar]");

    if (mainBody && mainBody.length > 0) return ApplicationType.DynamicsCRM;
    if (topBar) return ApplicationType.Dynamics365;
    return null;
  }

  function fadeColor(rgbColor, factor) {
    try {
      const rgb = rgbColor.match(/\d+/g).map(Number);
      const [r, g, b] = rgb;
      const newR = Math.round(r + (255 - r) * factor);
      const newG = Math.round(g + (255 - g) * factor);
      const newB = Math.round(b + (255 - b) * factor);
      return `rgb(${newR}, ${newG}, ${newB})`;
    } catch (e) {
      return rgbColor;
    }
  }

  function buildScriptTag(source) {
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = source;
    return script;
  }

  function buildPowerPaneButton() {
    const powerPaneButton = document.createElement("span");
    powerPaneButton.className = "navTabButton";
    powerPaneButton.id = "crm-power-pane-button";
    powerPaneButton.title = "Open Power Pane Returns";

    const linkElement = document.createElement("a");
    linkElement.className = "navTabButtonLink";
    linkElement.title = "";

    const linkImageContainerElement = document.createElement("span");
    linkImageContainerElement.className = "navTabButtonImageContainer";

    const imageElement = document.createElement("img");
    try {
      imageElement.src = ext.runtime.getURL("img/icon-48.png");
    } catch (e) {
      console.error("URL Image Error: ", e);
    }

    if (getApplicationType() === ApplicationType.Dynamics365) {
      const topBarEl = getTopDocument().querySelector("div[data-id=topBar]");
      const divBG = topBarEl ? window.getComputedStyle(topBarEl).backgroundColor : null;

      powerPaneButton.style.cssText = "float:left; width:48px; height:48px;cursor:pointer!important";
      linkElement.style.cssText = `float:left; width:48px; height:48px;cursor:pointer!important;text-align:center${divBG ? `;background-color:${divBG}` : ""}`;

      linkElement.style.transition = "background-color 0.3s";
      if (divBG) {
        linkElement.addEventListener("mouseenter", function () {
          linkElement.style.backgroundColor = fadeColor(divBG, 0.5);
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

    return powerPaneButton;
  }

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
      }
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
