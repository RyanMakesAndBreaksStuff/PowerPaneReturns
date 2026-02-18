(function () {
  "use strict";

  const ext = typeof browser === "undefined" ? chrome : browser;
  const STORAGE_KEY = "powerPaneOptions";
  const PANE_ROOT_ID = "crm-power-pane";
  const PANE_SCRIPT_PATH = "ui/js/pane.js";
  const PANE_TEMPLATE_PATH = "ui/pane.html";
  const INITIALIZE_TIMEOUT_MS = 30000;
  const OBSERVER_FALLBACK_INTERVAL_MS = 1500;

  const Interval = {
    PowerPaneControl: {
      Pointer: undefined,
    },
  };

  const ApplicationType = {
    DynamicsCRM: "Dynamics CRM",
    Dynamics365: "Dynamics 365",
  };

  function getTopDocument() {
    return window.top && window.top.document ? window.top.document : document;
  }

  function getApplicationType() {
    const topDoc = getTopDocument();
    const mainBody = topDoc.querySelector("body[scroll=no]");
    const topBar = topDoc.querySelector("div[data-id=topBar]");

    if (mainBody) return ApplicationType.DynamicsCRM;
    if (topBar) return ApplicationType.Dynamics365;
    return null;
  }

  function isTrustedExtensionUrl(url) {
    return typeof url === "string" && url.startsWith(ext.runtime.getURL(""));
  }

  function buildScriptTag(source) {
    if (!isTrustedExtensionUrl(source) || !source.endsWith(`/${PANE_SCRIPT_PATH}`)) {
      throw new Error("Refusing to inject unexpected script source.");
    }

    const script = document.createElement("script");
    script.setAttribute("type", "text/javascript");
    script.setAttribute("src", source);
    return script;
  }

  function fadeColor(rgb, factor) {
    const m = rgb.match(/\d+/g);
    if (!m || m.length < 3) return rgb;
    const [r, g, b] = m.map(Number);
    const f = Math.max(0, Math.min(1, factor));
    return `rgb(${Math.round(r + (255 - r) * f)}, ${Math.round(g + (255 - g) * f)}, ${Math.round(b + (255 - b) * f)})`;
  }

  function buildPowerPaneButton() {
    const powerPaneButton = document.createElement("span");
    powerPaneButton.setAttribute("class", "navTabButton");
    powerPaneButton.setAttribute("id", "crm-power-pane-button");
    powerPaneButton.setAttribute("title", "Open Power Pane Returns");

    const linkElement = document.createElement("a");
    linkElement.setAttribute("class", "navTabButtonLink");
    linkElement.setAttribute("title", "");

    const linkImageContainerElement = document.createElement("span");
    linkImageContainerElement.setAttribute("class", "navTabButtonImageContainer");

    const imageElement = document.createElement("img");
    imageElement.setAttribute("src", ext.runtime.getURL("img/icon-48.png"));

    if (getApplicationType() === ApplicationType.Dynamics365) {
      const topBarEl = getTopDocument().getElementById("topBar");
      const divBG = topBarEl ? window.getComputedStyle(topBarEl).backgroundColor : null;

      powerPaneButton.style.cssText = "float:left; width:48px; height:48px;cursor:pointer!important";
      linkElement.style.cssText = `float:left; width:48px; height:48px;cursor:pointer!important;text-align:center;background-color:${divBG || "transparent"}`;
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
    const topDoc = getTopDocument();
    const applicationType = getApplicationType();

    if (applicationType === ApplicationType.DynamicsCRM) {
      const ribbon = topDoc.querySelector("#navBar");
      if (!ribbon) return false;
      ribbon.prepend(powerPaneButton);
      return true;
    }

    if (applicationType === ApplicationType.Dynamics365) {
      const officeWaffle = topDoc.querySelector("button[data-id=officewaffle]") || topDoc.querySelector("#O365_MainLink_NavMenu");
      if (!officeWaffle) return false;
      officeWaffle.before(powerPaneButton);
      return true;
    }

    return false;
  }

  async function getStoredOptions() {
    try {
      const result = await ext.storage.local.get(STORAGE_KEY);
      const value = result && result[STORAGE_KEY];
      return value && typeof value === "object" ? value : null;
    } catch (e) {
      console.warn("Failed to read options from storage:", e);
      return null;
    }
  }

  function applyVisibilityOptions(container, optionsObj) {
    if (!container || !optionsObj) return;

    for (const [actionId, enabled] of Object.entries(optionsObj)) {
      if (enabled !== false) continue;
      try {
        const escapedId = typeof CSS !== "undefined" && CSS.escape ? CSS.escape(actionId) : actionId;
        const el = container.querySelector(`#${escapedId}`);
        if (el) el.style.display = "none";
      } catch (_e) {
        // Ignore malformed IDs.
      }
    }

    const sections = container.querySelectorAll(".crm-power-pane-section");
    sections.forEach((ul) => {
      const items = Array.from(ul.querySelectorAll(".crm-power-pane-subgroup"));
      const anyVisible = items.some((li) => li.style.display !== "none");
      if (!anyVisible) ul.style.display = "none";
    });
  }

  function injectSource(paneContainer, paneScript) {
    const topDoc = getTopDocument();
    const alreadyInjected = Array.from(topDoc.scripts).some((s) => (s.src || "").endsWith(`/${PANE_SCRIPT_PATH}`));
    if (alreadyInjected || topDoc.getElementById(PANE_ROOT_ID)) return;

    const body = topDoc.querySelector("body[scroll=no]") || topDoc.querySelector("body");
    if (!body) return;

    if (!paneContainer || !paneContainer.querySelector || !paneContainer.querySelector(`#${PANE_ROOT_ID}`)) {
      throw new Error("Pane template is missing expected root element.");
    }

    if (!paneScript || paneScript.tagName !== "SCRIPT" || !isTrustedExtensionUrl(paneScript.src)) {
      throw new Error("Unexpected pane script element.");
    }

    body.appendChild(paneContainer);
    body.appendChild(paneScript);
  }

  async function injectPane() {
    const templateUrl = ext.runtime.getURL(PANE_TEMPLATE_PATH);
    if (!isTrustedExtensionUrl(templateUrl)) {
      throw new Error("Unexpected pane template URL.");
    }

    const res = await fetch(templateUrl);
    if (!res.ok) throw new Error(`Failed to fetch pane template: ${res.status}`);

    const html = await res.text();
    const parsed = new DOMParser().parseFromString(html, "text/html");
    const paneRoot = parsed.getElementById(PANE_ROOT_ID);
    if (!paneRoot) {
      throw new Error("Pane template validation failed.");
    }

    const content = document.createElement("div");
    content.className = "crm-power-pane-container";
    content.appendChild(paneRoot.cloneNode(true));

    const optionsObj = await getStoredOptions();
    applyVisibilityOptions(content, optionsObj);

    const script = buildScriptTag(ext.runtime.getURL(PANE_SCRIPT_PATH));
    injectSource(content, script);
  }

  async function ensurePaneInjected() {
    const topDoc = getTopDocument();
    const hasButton = !!topDoc.getElementById("crm-power-pane-button");
    const hasPane = !!topDoc.getElementById(PANE_ROOT_ID);

    if (!hasButton) {
      const buttonInjected = injectPowerPaneButton();
      if (!buttonInjected) return false;
    }

    if (!hasPane) {
      await injectPane();
    }

    return !!topDoc.getElementById("crm-power-pane-button") && !!topDoc.getElementById(PANE_ROOT_ID);
  }

  function initialize() {
    const startTime = Date.now();
    let settled = false;
    let observer = null;

    const stop = () => {
      settled = true;
      if (observer) observer.disconnect();
      if (Interval.PowerPaneControl.Pointer) {
        clearInterval(Interval.PowerPaneControl.Pointer);
      }
    };

    const tryInject = async () => {
      if (settled) return;
      if (Date.now() - startTime > INITIALIZE_TIMEOUT_MS) {
        stop();
        return;
      }

      try {
        const done = await ensurePaneInjected();
        if (done) stop();
      } catch (e) {
        console.error("Failed to inject Power Pane:", e);
      }
    };

    observer = new MutationObserver(() => {
      void tryInject();
    });

    observer.observe(getTopDocument(), { childList: true, subtree: true });
    Interval.PowerPaneControl.Pointer = window.setInterval(() => void tryInject(), OBSERVER_FALLBACK_INTERVAL_MS);
    void tryInject();
  }

  initialize();
})();
