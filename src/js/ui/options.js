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
});