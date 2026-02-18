const build = (target, version) => {
  const manifest = {};

  manifest.manifest_version = 3;
  manifest.name = "Power Pane Returns";
  manifest.short_name = "Power Pane Returns";
  manifest.version = version;
  manifest.description =
    "Power Pane Returns is a helper tool designed to integrate with Dynamics CRM/365 model-driven apps and allow you to inspect and manipulate forms.";

  manifest.icons = {
    16: "img/icon-16.png",
    32: "img/icon-32.png",
    48: "img/icon-48.png",
    64: "img/icon-64.png",
    128: "img/icon-128.png",
  };

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
    "https://*.crm.dynamics.com/*",
  ];

  manifest.background = {
    service_worker: "js/background.js",
    type: "module",
  };

  manifest.action = {
    default_title: "Power Pane Returns",
    default_icon: manifest.icons,
  };

  manifest.content_scripts = [
    {
      run_at: "document_end",
      matches: matchPatterns,
      js: ["js/inject.js"],
      css: ["ui/css/pane.css"],
    },
  ];

  // Minimal permissions:
  // - scripting: used in the service worker to toggle the pane visibility
  // - storage: used by the options page to persist visibility settings
  manifest.permissions = ["scripting", "storage"];

  // Keep host permissions tight to supported Dynamics URLs.
  manifest.host_permissions = matchPatterns;

  manifest.web_accessible_resources = [
    {
      resources: ["ui/pane.html", "ui/js/*", "ui/css/*", "img/*"],
      matches: matchPatterns,
    },
  ];

  if (target === "chrome" || target === "edge-chromium" || target === "edge") {
    manifest.options_page = "ui/options.html";
  } else if (target === "firefox") {
    manifest.options_ui = {
      page: "ui/options.html",
      browser_style: true,
    };
  }

  if (target === "edge") {
    manifest.author = "Ryan Rettinger, Oguzhan Can, Onur Menal";
  }

  if (target === "firefox") {
    manifest.permissions.push("webRequest");
    manifest.browser_specific_settings = {
      gecko: {
        id: "{your-addon-id}",
        strict_min_version: "91.0",
      },
    };
  }

  // MV3 CSP (extension pages only)
  manifest.content_security_policy = {
    extension_pages: "script-src 'self'; object-src 'self'",
  };

  return manifest;
};

module.exports = { build };
