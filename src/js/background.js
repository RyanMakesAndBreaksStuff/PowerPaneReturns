/* global chrome, browser */

(() => {
  "use strict";

  const ext = typeof browser !== "undefined" ? browser : chrome;

  function togglePaneVisibilityInTab(tabId) {
    return ext.scripting.executeScript({
      target: { tabId },
      func: () => {
        const pane = document.querySelector(".crm-power-pane-sections");
        if (!pane) {
          return { found: false };
        }

        const computed = window.getComputedStyle(pane);
        const isVisible = computed && computed.display !== "none" && pane.style.display !== "none";
        pane.style.display = isVisible ? "none" : "block";

        return { found: true, visible: !isVisible };
      },
    });
  }

  ext.action.onClicked.addListener(async (tab) => {
    try {
      if (!tab?.id) return;
      if (!tab.url || /^(chrome|edge|about|data):/.test(tab.url)) return;

      const [{ result }] = await togglePaneVisibilityInTab(tab.id);
      if (result?.found) return;

      await ext.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["js/inject.js"],
      });

      // Give the content script time to create the pane, then toggle.
      await new Promise((resolve) => setTimeout(resolve, 300));
      await togglePaneVisibilityInTab(tab.id);
    } catch (e) {
      console.error("Failed to toggle Power Pane:", e);
    }
  });
})();
