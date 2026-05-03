const test = require("node:test");
const assert = require("node:assert/strict");

const { build } = require("../src/js/util/manifest-builder");

test("chrome manifest mv3 baseline", () => {
  const manifest = build("chrome", "1.3.0");

  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.options_page, "ui/options.html");
  assert.equal(manifest.options_ui, undefined);
  assert.ok(Array.isArray(manifest.permissions));
  assert.ok(!manifest.permissions.includes("webRequest"));
});

test("firefox defaults exclude webRequest and placeholder gecko id, with strict_min_version 109.0", () => {
  const previousId = process.env.FIREFOX_EXTENSION_ID;
  delete process.env.FIREFOX_EXTENSION_ID;

  try {
    const manifest = build("firefox", "1.3.0");

    assert.equal(manifest.manifest_version, 3);
    assert.equal(manifest.options_page, undefined);
    assert.deepEqual(manifest.options_ui, {
      page: "ui/options.html",
      browser_style: true
    });
    assert.ok(!manifest.permissions.includes("webRequest"));
    assert.equal(manifest.browser_specific_settings.gecko.strict_min_version, "109.0");
    assert.ok(!("id" in manifest.browser_specific_settings.gecko));
  } finally {
    if (previousId === undefined) {
      delete process.env.FIREFOX_EXTENSION_ID;
    } else {
      process.env.FIREFOX_EXTENSION_ID = previousId;
    }
  }
});

test("firefox uses FIREFOX_EXTENSION_ID when provided", () => {
  const previousId = process.env.FIREFOX_EXTENSION_ID;
  process.env.FIREFOX_EXTENSION_ID = "powerpane@example.com";

  try {
    const manifest = build("firefox", "1.3.0");
    assert.equal(manifest.browser_specific_settings.gecko.id, "powerpane@example.com");
    assert.equal(manifest.browser_specific_settings.gecko.strict_min_version, "109.0");
  } finally {
    if (previousId === undefined) {
      delete process.env.FIREFOX_EXTENSION_ID;
    } else {
      process.env.FIREFOX_EXTENSION_ID = previousId;
    }
  }
});
