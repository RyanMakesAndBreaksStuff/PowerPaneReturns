/* global chrome, browser */

(() => {
  "use strict";

  const ext = (typeof browser !== "undefined") ? browser : chrome;
  const STORAGE_KEY = "powerPaneOptions"; // { [actionId: string]: boolean }

  const statusEl = () => document.getElementById("status");
  const optionsForm = () => document.getElementById("options");

  async function getStoredOptions() {
    try {
      const result = await ext.storage.local.get(STORAGE_KEY);
      const value = result && result[STORAGE_KEY];
      return (value && typeof value === "object") ? value : {};
    } catch (e) {
      console.warn("Failed to read options from storage:", e);
      return {};
    }
  }

  async function setStoredOptions(optionsObj) {
    try {
      await ext.storage.local.set({ [STORAGE_KEY]: optionsObj });
      return true;
    } catch (e) {
      console.warn("Failed to save options to storage:", e);
      return false;
    }
  }

  function showStatus(message, isError = false) {
    const el = statusEl();
    if (!el) return;
    el.textContent = message;
    el.style.color = isError ? "red" : "";
    if (!isError) {
      setTimeout(() => {
        if (statusEl()) statusEl().textContent = "";
      }, 2500);
    }
  }

  function getAllCheckboxes() {
    const form = optionsForm();
    if (!form) return [];
    return Array.from(form.querySelectorAll("input[type='checkbox']"));
  }

  function setAllCheckboxes(checked) {
    for (const cb of getAllCheckboxes()) {
      cb.checked = checked;
    }
  }

  async function saveOptions() {
    const checkboxes = getAllCheckboxes();
    const optionsObj = {};
    for (const cb of checkboxes) {
      if (!cb.id) continue;
      optionsObj[cb.id] = !!cb.checked;
    }

    const ok = await setStoredOptions(optionsObj);
    showStatus(ok ? "Options saved." : "Failed to save options.", !ok);
  }

  async function restoreOptions() {
    const stored = await getStoredOptions();
    for (const cb of getAllCheckboxes()) {
      // Default: enabled
      cb.checked = (stored[cb.id] !== false);
    }
  }

  function buildOptionCheckbox(actionId, actionLabel, checkedByDefault = true) {
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

    // Build a nice list from pane.html so you only maintain IDs/labels in one place
    const url = ext.runtime.getURL("ui/pane.html");
    const response = await fetch(url);
    const htmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, "text/html");

    const paneSections = doc.querySelectorAll(".crm-power-pane-section");

    for (const section of paneSections) {
      const header = section.querySelector(".crm-power-pane-header");
      const title = header ? header.textContent.trim() : "";

      const paneItems = section.querySelectorAll(".crm-power-pane-subgroup");
      if (!paneItems.length) continue;

      const optionsGroup = document.createElement("div");
      optionsGroup.className = "options-group";

      const groupHeader = document.createElement("h3");
      groupHeader.textContent = title || "Other";
      optionsGroup.appendChild(groupHeader);

      for (const item of paneItems) {
        const actionId = item.getAttribute("id");
        if (!actionId) continue;
        const actionLabel = (item.textContent || actionId).trim();
        optionsGroup.appendChild(buildOptionCheckbox(actionId, actionLabel, true));
      }

      container.appendChild(optionsGroup);
    }

    // Apply saved values after building
    await restoreOptions();
  }

  document.addEventListener("DOMContentLoaded", async () => {
    try {
      await generateOptionsPage();
    } catch (e) {
      console.error("Failed to render options:", e);
      showStatus("Failed to render options page. See console.", true);
    }

    document.getElementById("save")?.addEventListener("click", saveOptions);
    document.getElementById("select-all")?.addEventListener("click", () => setAllCheckboxes(true));
    document.getElementById("deselect-all")?.addEventListener("click", () => setAllCheckboxes(false));
  });
})();
