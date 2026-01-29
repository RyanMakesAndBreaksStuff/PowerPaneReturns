const build = (target, version) => {
    const manifest = {};
    // Common properties
    manifest.manifest_version = 3; // Required for MV3
    manifest.name = "Powe Pane Returns";
    manifest.short_name = "Powe Pane Returns";
    manifest.version = version;
    manifest.description = "Powe Pane Returns is a helper tool designed to integrate with Dynamics CRM/365 application and allow you to manipulate forms.";
    manifest.icons = {
        16: "img/icon-16.png",
        32: "img/icon-32.png",
        48: "img/icon-48.png",
        64: "img/icon-64.png",
        128: "img/icon-128.png"
    };

    // Content Scripts
    const matchPatterns = [
        "https://*.crm.microsoftdynamics.us/*",
        "https://*.crm.microsoftdynamics.de/*",
        "https://*.dynamics.microsoft.com/*",
        "https://*.crm.appsplatform.us/*",
        "https://*.crm2.dynamics.com/*",
        "https://*.crm3.dynamics.com/*",
        "https://*.crm4.dynamics.com/*",
        "https://*.crm5.dynamics.com/*",
        "https://*.crm6.dynamics.com/*",
        "https://*.crm7.dynamics.com/*",
        "https://*.crm8.dynamics.com/*",
        "https://*.crm9.dynamics.com/*",
        "https://*.crm10.dynamics.com/*",
        "https://*.crm11.dynamics.com/*",
        "https://*.crm12.dynamics.com/*",
        "https://*.crm13.dynamics.com/*",
        "https://*.crm14.dynamics.com/*",
        "https://*.crm15.dynamics.com/*",
        "https://*.crm16.dynamics.com/*",
        "https://*.crm17.dynamics.com/*",
        "https://*.crm18.dynamics.com/*",
        "https://*.crm19.dynamics.com/*",
        "https://*.crm20.dynamics.com/*",
        "https://*.crm21.dynamics.com/*",
        "https://*.crm.dynamics.com/*"
    ];

    // Background Service Worker
    manifest.background = {
        service_worker: "js/background.js", // Using service worker for background
        type: "module" // Recommended for modern JavaScript
    };

    // Browser Action (renamed to `action` in MV3)
    manifest.action = {
        default_title: "Powe Pane Returns",
        default_icon: {
            "16": "img/icon-16.png",
            "32": "img/icon-32.png",
            "48": "img/icon-48.png",
            "64": "img/icon-64.png",
            "128": "img/icon-128.png"
        }
    };


    manifest.content_scripts = [
        {
            run_at: "document_end",
            matches: matchPatterns,
            js: ["js/inject.js"],
            css: ["ui/css/pane.css"]
        }
    ];

    // Permissions
    manifest.permissions = [
        "activeTab",
        "storage",
        "scripting"
    ];



    // Host Permissions (required for HTTP/HTTPS URLs)
    manifest.host_permissions = [ "http://*/*", "https://*/*" ]

    // Web Accessible Resources
    manifest.web_accessible_resources = [
        {
            resources: ["ui/*", "img/*"],
            matches: matchPatterns
        }
    ];



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
        manifest.author = "Ryan Rettinger, Oguzhan Can, Onur Menal";
    }

    // Browser-specific adjustments
    if (target === "firefox") {
        // Firefox-specific adjustments for compatibility
        manifest.permissions.push("webRequest");
        manifest.browser_specific_settings = {
            gecko: {
                id: "{your-addon-id}",
                strict_min_version: "91.0"
            }
        };
    }

    return manifest;
};

module.exports = {
    build
};
