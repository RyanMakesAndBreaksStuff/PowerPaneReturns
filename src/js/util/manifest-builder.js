const build = (target, version) => {
    const manifest = {};

    // Common properties
    manifest.manifest_version = 3; // Updated to V3
    manifest.name = "Better Crm Power Pane";
    manifest.short_name = "Better Crm Power Pane";
    manifest.version = version;
    manifest.description = "Better Crm Power Pane is a helper tool designed to integrate with Dynamics CRM/365 application and allow you to manipulate forms.";
    manifest.icons = {
        32: "img/icon-32.png",
        48: "img/icon-48.png",
        64: "img/icon-64.png",
        128: "img/icon-128.png"
    };

    // Content Scripts
    manifest.content_scripts = [
        {
            run_at: "document_end",
            matches: ["<all_urls>"],
            js: ["js/inject.js"],
            css: ["ui/css/pane.css"]
        }
    ];

    // Permissions
    manifest.permissions = [
        "identity",
        "tabs",
        "activeTab",
        "storage"
    ];

    // Host Permissions (required in MV3 for HTTP/HTTPS URLs)
    manifest.host_permissions = ["http://*/*", "https://*/*"];

    // Web Accessible Resources
    manifest.web_accessible_resources = [
        {
            resources: ["ui/*", "img/*"],
            matches: ["<all_urls>"]
        }
    ];

    // Background Service Worker
    manifest.background = {
        service_worker: "js/background.js", // Updated to use service worker
        type: "module" // Optional but recommended for modern JavaScript
    };

    // Browser Action (renamed to `action` in MV3)
    manifest.action = {
        default_title: "Better Crm Power Pane",
        default_icon: "img/icon-48.png"
    };

    // Options Page
    if (target === "chrome" || target === "edge-chromium" || target === "edge") {
        manifest.options_page = "ui/options.html";
    } else if (target === "firefox") {
        manifest.options_ui = {
            page: "ui/options.html",
            browser_style: true
        };
    }

    // Edge-specific properties
    if (target === "edge") {
        manifest.author = "Oguzhan Can and Onur Menal";
    }

    return manifest;
};

module.exports = {
    build: build
};
