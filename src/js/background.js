/* global chrome, browser */

(() => {
  "use strict";

  const ext = typeof browser !== "undefined" ? browser : chrome;
  const PANE_SELECTOR = ".crm-power-pane-sections";
  const MAX_PANE_READY_ATTEMPTS = 10;
  const PANE_READY_RETRY_MS = 200;

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

  async function isPanePresentInTab(tabId) {
    const [{ result }] = await ext.scripting.executeScript({
      target: { tabId },
      func: (selector) => !!document.querySelector(selector),
      args: [PANE_SELECTOR],
    });

    return !!result;
  }

  async function waitForPaneInTab(tabId) {
    for (let attempt = 0; attempt < MAX_PANE_READY_ATTEMPTS; attempt++) {
      if (await isPanePresentInTab(tabId)) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, PANE_READY_RETRY_MS));
    }

    return false;
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

      const paneReady = await waitForPaneInTab(tab.id);
      if (!paneReady) {
        console.warn("Power Pane was not ready after retries.");
        return;
      }

      await togglePaneVisibilityInTab(tab.id);
    } catch (e) {
      console.error("Failed to toggle Power Pane:", e);
    }
  });
})();
