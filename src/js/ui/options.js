(function () {
  "use strict";

  const STORAGE_KEY = "powerPaneOptions";
  const ext = typeof browser !== "undefined" ? browser : chrome;

  function optionsForm() {
    return document.getElementById("options");
  }

  function getAllCheckboxes() {
    return Array.from(optionsForm()?.querySelectorAll("input[type='checkbox']") || []);
  }

  function showStatus(message, isError) {
    const status = document.getElementById("status");
    if (!status) return;

    status.textContent = message;
    status.style.color = isError ? "#c62828" : "";
    window.setTimeout(() => {
      status.textContent = "";
      status.style.color = "";
    }, 1200);
  }

  async function getStoredOptions() {
    try {
      const result = await ext.storage.local.get(STORAGE_KEY);
      const value = result && result[STORAGE_KEY];
      return value && typeof value === "object" ? value : {};
    } catch (e) {
      console.error("Failed to load options:", e);
      return {};
    }
  }

  async function setStoredOptions(optionsObj) {
    try {
      await ext.storage.local.set({ [STORAGE_KEY]: optionsObj });
      return true;
    } catch (e) {
      console.error("Failed to save options:", e);
      return false;
    }
  }

  function setAllCheckboxes(checked) {
    getAllCheckboxes().forEach((cb) => {
      cb.checked = !!checked;
    });
  }

  async function saveOptions() {
    const optionsObj = {};
    for (const cb of getAllCheckboxes()) {
      if (!cb.id) continue;
      optionsObj[cb.id] = !!cb.checked;
    }

    const ok = await setStoredOptions(optionsObj);
    showStatus(ok ? "Options saved." : "Failed to save options.", !ok);
  }

  async function restoreOptions() {
    const stored = await getStoredOptions();
    for (const cb of getAllCheckboxes()) {
      cb.checked = stored[cb.id] !== false;
    }
  }

  function buildOptionCheckbox(actionId, actionLabel, checkedByDefault) {
    const wrapper = document.createElement("div");
    wrapper.className = "crm-power-pane-option";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = actionId;
    checkbox.checked = checkedByDefault;

    const label = document.createElement("label");
    label.htmlFor = actionId;
    label.textContent = actionLabel;

    wrapper.appendChild(checkbox);
    wrapper.appendChild(label);
    return wrapper;
  }

  async function generateOptionsPage() {
    const container = optionsForm();
    if (!container) return;

    container.innerHTML = "";

    const paneUrl = ext.runtime.getURL("ui/pane.html");
    const response = await fetch(paneUrl);
    if (!response.ok) throw new Error(`Failed to fetch pane.html: ${response.status}`);

    const htmlText = await response.text();
    const parser = new DOMParser();
    const paneDocument = parser.parseFromString(htmlText, "text/html");
    const paneSections = paneDocument.querySelectorAll(".crm-power-pane-section");

    for (const section of paneSections) {
      const paneItems = section.querySelectorAll(".crm-power-pane-subgroup");
      if (!paneItems.length) continue;

      const optionsGroup = document.createElement("div");
      optionsGroup.className = "options-group";

      const header = section.querySelector(".crm-power-pane-header");
      const groupHeader = document.createElement("h3");
      groupHeader.textContent = (header?.textContent || "Other").trim() || "Other";
      optionsGroup.appendChild(groupHeader);

      for (const item of paneItems) {
        const actionId = item.getAttribute("id");
        if (!actionId) continue;

        const actionLabel = (item.textContent || actionId).trim();
        optionsGroup.appendChild(buildOptionCheckbox(actionId, actionLabel, true));
      }

      container.appendChild(optionsGroup);
    }

    await restoreOptions();
  }

  document.addEventListener("DOMContentLoaded", async function () {
    try {
      await generateOptionsPage();
    } catch (e) {
      console.error("Options generation error:", e);
      showStatus("Failed to render options page. See console.", true);
    }

    document.getElementById("save")?.addEventListener("click", saveOptions);
    document.getElementById("select-all")?.addEventListener("click", () => setAllCheckboxes(true));
    document.getElementById("deselect-all")?.addEventListener("click", () => setAllCheckboxes(false));
  });
})();
