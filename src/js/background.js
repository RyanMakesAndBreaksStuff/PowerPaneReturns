/* global chrome, browser */

(() => {
  "use strict";

  const ext = (typeof browser !== "undefined") ? browser : chrome;

  ext.action.onClicked.addListener(async (tab) => {
    try {
      if (!tab || !tab.id) return;
      if (!tab.url || /^(chrome|edge|about|data):/.test(tab.url)) return;

      await ext.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const pane = document.querySelector(".crm-power-pane-sections");
          if (!pane) return;

          const computed = window.getComputedStyle(pane);
          const isVisible = computed && computed.display !== "none" && pane.style.display !== "none";
          pane.style.display = isVisible ? "none" : "block";
        }
      });
    } catch (e) {
      console.error("Failed to toggle Power Pane:", e);
    }
  });
})();
