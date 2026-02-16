const build = (target, version) => {
    const manifest = {};
    // Common properties
    manifest.manifest_version = 3;
    manifest.name = "Power Pane Returns";
    manifest.short_name = "Power Pane Returns";
    manifest.version = version;
    manifest.description = "Power Pane Returns is a helper tool designed to integrate with Dynamics CRM/365 application and allow you to manipulate forms.";
    manifest.content_security_policy = {
        extension_pages: "script-src 'self'; object-src 'self'"
    };
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
        service_worker: "js/background.js",
        type: "module"
    };

    // Browser Action (renamed to `action` in MV3)
    manifest.action = {
        default_title: "Power Pane Returns",
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

    // Permissions — storage removed to simplify Chrome Web Store approval
    manifest.permissions = [
        "activeTab",
        "scripting"
    ];

    // Host Permissions (required for HTTP/HTTPS URLs)
    manifest.host_permissions = matchPatterns;

    // Web Accessible Resources
    manifest.web_accessible_resources = [
        {
            resources: ["ui/*", "img/*"],
            matches: matchPatterns
        }
    ];

    // Edge-chromium-specific properties
    if (target === "edge-chromium") {
        manifest.author = "Ryan Rettinger, Oguzhan Can, Onur Menal";
    }

    // Browser-specific adjustments
    if (target === "firefox") {
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
