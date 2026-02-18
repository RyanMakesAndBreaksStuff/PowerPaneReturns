const STORAGE_KEY = 'powerPaneOptions';
const ext = typeof browser !== "undefined" ? browser : chrome;

function getOptionsMap() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? new Map(JSON.parse(raw)) : new Map();
    } catch {
        return new Map();
    }
}

function saveOptionsMap(map) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...map]));
}

function saveOptions() {
    const map = new Map();
    const elements = document.forms[0].elements;
    for (let i = 0; i < elements.length; i++) {
        map.set(elements[i].id, elements[i].checked);
    }
    saveOptionsMap(map);
    const status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(() => { status.textContent = ''; }, 750);
}

function loadOptions() {
    const map = getOptionsMap();
    map.forEach((value, key) => {
        const checkbox = document.getElementById(key);
        if (checkbox) checkbox.checked = value;
    });
}

function generateOptionsPage() {
    const paneUrl = ext.runtime.getURL("ui/pane.html");
    fetch(paneUrl)
        .then(response => {
            if (!response.ok) throw new Error("Failed to load pane.html");
            return response.text();
        })
        .then(html => {
            const parser = new DOMParser();
            const paneDocument = parser.parseFromString(html, "text/html");
            const paneSections = paneDocument.getElementsByClassName("crm-power-pane-section");
            const options = document.getElementById("options");
            for (let i = 0; i < paneSections.length; i++) {
                const optionsGroup = document.createElement('div');
                const groupHeader = document.createElement("h3");
                groupHeader.innerHTML = paneSections[i].getElementsByClassName("crm-power-pane-header")[0].innerHTML;
                optionsGroup.appendChild(groupHeader);
                const paneItems = paneSections[i].getElementsByClassName("crm-power-pane-subgroup");
                for (let j = 0; j < paneItems.length; j++) {
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.checked = true;
                    checkbox.id = paneItems[j].id;
                    const optionsItem = document.createElement("label");
                    optionsItem.htmlFor = paneItems[j].id;
                    optionsItem.appendChild(checkbox);
                    optionsItem.appendChild(document.createTextNode(paneItems[j].children[0].innerText));
                    optionsGroup.appendChild(optionsItem);
                }
                options.appendChild(optionsGroup);
            }
            // Load saved state after generating checkboxes
            loadOptions();
        })
        .catch(err => console.error("Options generation error:", err));
}

document.addEventListener('DOMContentLoaded', function () {
    generateOptionsPage();
});
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('select-all').addEventListener('click', function () {
    const checkboxes = document.forms[0].elements;
    for (let i = 0; i < checkboxes.length; i++) {
        checkboxes[i].checked = true;
    }
});
document.getElementById('deselect-all').addEventListener('click', function () {
    const checkboxes = document.forms[0].elements;
    for (let i = 0; i < checkboxes.length; i++) {
        checkboxes[i].checked = false;
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
