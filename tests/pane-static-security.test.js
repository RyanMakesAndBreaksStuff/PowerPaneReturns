const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const paneSource = fs.readFileSync(path.join(__dirname, "..", "src/js/ui/pane.js"), "utf8");
const paneHtml = fs.readFileSync(path.join(__dirname, "..", "src/html/ui/pane.html"), "utf8");
const paneNoBarHtml = fs.readFileSync(path.join(__dirname, "..", "src/html/ui/pane_nobar.html"), "utf8");
const paneScss = fs.readFileSync(path.join(__dirname, "..", "src/sass/ui/pane.scss"), "utf8");
const activePaneHtml = paneHtml.replace(/<!--[\s\S]*?-->/g, "");
const activePaneNoBarHtml = paneNoBarHtml.replace(/<!--[\s\S]*?-->/g, "");

const currentCommandIds = [
  "user-info",
  "fetch-xml",
  "advanced_find",
  "entity-name",
  "record-id",
  "record-url",
  "clone-record",
  "record-properties",
  "enable-all-fields",
  "show-all-fields",
  "disable-field-requirement",
  "schema-names",
  "schema-names-as-desc",
  "schema-names-in-brackets",
  "show-optionset-values",
  "clear-all-fields",
  "fill-all-fields",
  "required-fields",
  "show-field-value",
  "find-field-in-form",
  "show-dirty-fields",
  "clear-all-notifications",
  "refresh-ribbon",
  "refresh-form",
  "toggle-lookup-links",
  "go-to-record",
  "go-to-create-form",
  "open-legacy-editor",
  "open-new-editor",
  "open-entity-editor",
  "solutions",
  "crm-diagnostics",
  "performance-center",
  "open-webapi",
];

function countAttributeValue(source, attributeName, value) {
  var escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  var pattern = new RegExp(attributeName + '="' + escapedValue + '"', "g");
  return (source.match(pattern) || []).length;
}

function extractOpenTagById(source, id) {
  var pattern = new RegExp("<[^>]+\\bid=\"" + id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\"[^>]*>");
  var match = source.match(pattern);
  return match ? match[0] : "";
}

test("pane notifications avoid html message writes", () => {
  assert.doesNotMatch(paneSource, /\$notification\.find\("span"\)\.html\(\s*message\s*\)/);
});

test("popup rows avoid html header writes and string concat markup", () => {
  assert.doesNotMatch(paneSource, /\$popup\.find\("h1"\)\.html\(\s*this\.Header\s*\)/);
  assert.doesNotMatch(paneSource, /\$popup\.find\("p"\)\.html\(\s*this\.Description\s*\)/);
  assert.doesNotMatch(
    paneSource,
    /\$popupParameters\.append\(\s*["'][\s\S]*crm-power-pane-popup-input-text[\s\S]*\+/
  );
  assert.doesNotMatch(paneSource, /li \+= ["'][\s\S]*crm-power-pane-lookup-url[\s\S]*\+/);
});

test("synchronous XMLHttpRequest user-info flow is removed", () => {
  assert.doesNotMatch(paneSource, /open\("GET",\s*query,\s*false\)/);
  assert.doesNotMatch(paneSource, /X-Requested-Width/);
  assert.match(paneSource, /fetchLegacyJson:\s*function\s*\(/);
  assert.match(paneSource, /\$\("#user-info"\)\.on\("click",\s*async function\s*\(/);
});

test("FetchXML SOAP request uses extracted helpers", () => {
  assert.match(paneSource, /EncodeXmlText:\s*function\s*\(\s*text\s*\)/);
  assert.match(paneSource, /BuildRetrieveMultipleSoapRequest:\s*function\s*\(\s*fetchXml\s*\)/);
  assert.match(paneSource, /request\s*=\s*CrmPowerPane\.Utils\.BuildRetrieveMultipleSoapRequest\(\s*xml\s*\)/);
  assert.doesNotMatch(paneSource, /request\s*\+=\s*CrmEncodeDecode\.CrmXmlEncode\(\s*xml\s*\)/);
});

test("theme selector markup exists once with an autosized modal shell", () => {
  assert.match(paneHtml, /id="crm-power-pane-theme-trigger"/);
  assert.match(paneHtml, /id="crm-power-pane-theme-modal"/);
  assert.match(paneHtml, /id="crm-power-pane-theme-list"/);
  assert.match(paneScss, /#crm-power-pane-theme-modal[\s\S]*width:\s*max-content/);
});

test("theme trigger uses the dock component while preserving dialog accessibility", () => {
  var triggerTag = extractOpenTagById(activePaneHtml, "crm-power-pane-theme-trigger");

  assert.ok(triggerTag, "Missing crm-power-pane-theme-trigger element");
  assert.match(triggerTag, /\bclass="[^"]*\btheme-dock\b[^"]*"/);
  assert.match(triggerTag, /\brole="button"/);
  assert.match(triggerTag, /\baria-haspopup="dialog"/);
  assert.match(triggerTag, /\baria-controls="crm-power-pane-theme-modal"/);
  assert.match(triggerTag, /\baria-expanded="false"/);
  assert.doesNotMatch(activePaneHtml, /<a[^>]+id="crm-power-pane-theme-trigger"[\s\S]{0,300}<strong>\s*Theme\s*<\/strong>/);
  assert.match(activePaneHtml, /crm-power-pane-theme-dock-chips/);
  assert.match(activePaneHtml, /\bclass="[^"]*\bcrm-power-pane-pane-controls\b[^"]*"[\s\S]*id="crm-power-pane-theme-trigger"/);
});

test("pane defaults to the no-rail command layout instead of the full matrix", () => {
  assert.match(activePaneHtml, /\bclass="[^"]*\bcommand-bar-pane\b[^"]*"/);
  assert.match(activePaneHtml, /\bclass="[^"]*\bcrm-power-pane-layout-nobar\b[^"]*"/);
  assert.doesNotMatch(activePaneHtml, /\bclass="[^"]*\brail-command-pane\b[^"]*"/);
  assert.match(activePaneHtml, /\bclass="[^"]*\bcommand-bar-layout\b[^"]*"/);
  assert.match(activePaneHtml, /\bclass="[^"]*\bcommand-bar-groups\b[^"]*"/);
  assert.match(activePaneHtml, /\bclass="[^"]*\bcommand-bar-group\b[^"]*"/);
  assert.match(activePaneHtml, /\bclass="[^"]*\bcommand-bar-rail\b[^"]*"/);
  assert.match(activePaneHtml, /command-bar-rail-button/);
  assert.match(activePaneHtml, /type="radio" name="crm-power-pane-command-view"/);
  assert.doesNotMatch(activePaneHtml, /\bclass="[^"]*\bmatrix-grid\b[^"]*"/);

  [
    ".command-bar-pane",
    ".command-bar-layout",
    ".command-bar-groups",
    ".command-bar-group",
  ].forEach(function (selector) {
    assert.match(paneScss, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b"));
  });

  assert.match(paneScss, /\.command-bar-groups\s*\{[\s\S]*?overflow-x:\s*hidden/);
  assert.doesNotMatch(paneScss, /\.command-bar-groups\s*\{[\s\S]*?overflow-x:\s*auto[\s\S]*?\n\}/);
  assert.match(paneScss, /\.command-bar-groups\s*\{[\s\S]*?max-height:\s*none/);
  assert.doesNotMatch(paneScss, /\.command-bar-groups\s*\{[\s\S]*?max-height:\s*\d+px[\s\S]*?\n\}/);
  assert.match(paneScss, /\.crm-power-pane-layout-nobar \.command-bar-rail\s*\{[\s\S]*?display:\s*none/);
});

test("pane display selector can enable the rail command layout without clipping groups", () => {
  assert.match(activePaneHtml, /type="radio" name="crm-power-pane-command-view"/);
  assert.match(activePaneHtml, /\bclass="[^"]*\bcommand-bar-rail\b[^"]*"/);
  assert.match(activePaneHtml, /for="crm-power-pane-view-general"/);
  assert.match(activePaneHtml, /\bclass="[^"]*\brail-command-form\b[^"]*"/);
  assert.match(activePaneHtml, /\bclass="[^"]*\blayout-dock\b[^"]*"/);
  assert.match(activePaneHtml, /data-layout-mode="nobar"[^>]*aria-pressed="true"/);
  assert.match(activePaneHtml, /data-layout-mode="rail"[^>]*aria-pressed="false"/);

  assert.match(paneScss, /\.rail-command-pane \.rail-command-group\s*\{[\s\S]*?display:\s*none/);
  assert.match(
    paneScss,
    /#crm-power-pane-view-form:checked\s*~\s*\.command-bar-groups\s*\.rail-command-form,[\s\S]*?\{\s*display:\s*grid/
  );
  assert.match(paneScss, /\.rail-command-pane \.command-bar-groups\s*\{[\s\S]*?min-height:\s*178px/);
  assert.match(paneSource, /LayoutSelector:\s*\{/);
  assert.match(paneSource, /StorageKey:\s*"crm-power-pane-layout"/);
  assert.match(paneSource, /DefaultMode:\s*"nobar"/);
  assert.match(paneSource, /\.addClass\("rail-command-pane"\)/);
});

test("pane_nobar preserves the no-rail command bar alternative", () => {
  assert.match(activePaneNoBarHtml, /\bclass="[^"]*\bcommand-bar-pane\b[^"]*"/);
  assert.match(activePaneNoBarHtml, /\bclass="[^"]*\bcommand-bar-groups\b[^"]*"/);
  assert.doesNotMatch(activePaneNoBarHtml, /\bclass="[^"]*\bcommand-bar-rail\b[^"]*"/);
  assert.doesNotMatch(activePaneNoBarHtml, /command-bar-rail-button/);
});

test("live pane command items include concise descriptions", () => {
  var descriptionCount = (activePaneHtml.match(/\bclass="crm-power-pane-command-description"/g) || []).length;

  assert.equal(descriptionCount, currentCommandIds.length);
  assert.match(paneScss, /\.crm-power-pane-command-copy\s*\{[\s\S]*?display:\s*grid/);
  assert.match(paneScss, /\.crm-power-pane-command-copy\s*\{[\s\S]*?gap:\s*1px/);
  assert.match(
    paneScss,
    /\.crm-power-pane-command-copy,[\s\S]*?\.crm-power-pane-command-label,[\s\S]*?\.crm-power-pane-command-description\s*\{[\s\S]*?height:\s*auto;[\s\S]*?padding:\s*0;/
  );
  assert.match(paneScss, /\.crm-power-pane-command-description\s*\{[\s\S]*?font-size:\s*10px/);
  assert.match(paneScss, /\.crm-power-pane-command-description\s*\{[\s\S]*?color:\s*var\(--crm-power-pane-text-primary/);
});

test("current command ids are present exactly once in pane markup", () => {
  var commandIdPattern = /<li\b[^>]*\bclass="[^"]*\bcrm-power-pane-subgroup\b[^"]*"[^>]*\bid="([^"]+)"/g;
  var actualCommandIds = Array.from(activePaneHtml.matchAll(commandIdPattern), function (match) {
    return match[1];
  });

  assert.deepEqual(new Set(actualCommandIds), new Set(currentCommandIds));

  currentCommandIds.forEach(function (commandId) {
    assert.equal(countAttributeValue(activePaneHtml, "id", commandId), 1, commandId + " should be unique");
  });
});

test("theme selector config lists unique display names and safe DOM rendering", () => {
  assert.match(paneSource, /ThemeSelector:\s*\{/);
  assert.match(paneSource, /name:\s*"Default"/);
  assert.match(paneSource, /name:\s*"Dark Matter"/);
  assert.match(paneSource, /name:\s*"Velvet Void"/);
  assert.match(paneSource, /name:\s*"Plasma Ice"/);
  assert.match(paneSource, /name:\s*"Aurora Rift"/);
  assert.match(paneSource, /localStorage\.setItem\("crm-power-pane-theme"/);
  assert.match(paneSource, /\.text\(theme\.name\)/);
  assert.doesNotMatch(paneSource, /crm-power-pane-theme-list[\s\S]{0,300}\.html\(/);
});

test("theme rendering never writes html into or near the theme list", () => {
  var renderListBody = paneSource.slice(
    paneSource.indexOf("RenderList: function"),
    paneSource.indexOf("Open: function")
  );
  var themeListReferences = Array.from(paneSource.matchAll(/crm-power-pane-theme-list/g), function (match) {
    var start = Math.max(0, match.index - 350);
    var end = Math.min(paneSource.length, match.index + 350);
    return paneSource.slice(start, end);
  });

  assert.ok(themeListReferences.length > 0, "Expected theme list rendering references");
  assert.ok(renderListBody.length > 0, "Expected RenderList source body");
  assert.doesNotMatch(renderListBody, /\.html\s*\(/);
  themeListReferences.forEach(function (reference) {
    assert.doesNotMatch(reference, /\.html\s*\(/);
  });
});

test("theme config exposes palette metadata for dock chips and preview swatches", () => {
  var themeObjectPattern = /\{\s*id:\s*"[^"]+",\s*name:\s*"[^"]+",\s*modes:\s*\[[^\]]+\][\s\S]*?\}/g;
  var themeObjects = paneSource.match(themeObjectPattern) || [];

  assert.ok(themeObjects.length >= 5, "Expected the current theme config objects");
  themeObjects.forEach(function (themeConfig) {
    assert.match(themeConfig, /\bpalette:\s*\{/);
    assert.match(themeConfig, /\bdockChips:\s*\[/);
    ["background", "label", "border", "status"].forEach(function (tokenName) {
      assert.match(themeConfig, new RegExp("\\b" + tokenName + ":\\s*\"#[0-9A-Fa-f]{6}\""));
    });
  });
});

test("pane scss defines matrix, dock, preview card, responsive, and focus selectors", () => {
  [
    ".matrix-pane",
    ".matrix-toolbar",
    ".matrix-grid",
    ".matrix-card",
    ".theme-dock",
    ".theme-chip",
    ".theme-preview-panel",
    ".compact-picker",
    ".theme-card",
    ".crm-power-pane-theme-card-title",
    ".swatches",
  ].forEach(function (selector) {
    assert.match(paneScss, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b"));
  });

  assert.match(paneScss, /@media\s*\([^)]*max-width[^)]*\)[\s\S]*\.matrix-grid/);
  assert.match(paneScss, /\.theme-dock[\s\S]{0,500}&:focus/);
  assert.match(paneScss, /\.theme-card[\s\S]{0,500}&:focus/);
});

test("pane command list omits redundant title chrome", () => {
  assert.doesNotMatch(paneHtml, /crm-power-pane-title/);
  assert.doesNotMatch(paneHtml, />\s*Power Pane Commands\s*</);
});

test("form-visible mockup gallery includes additional layout directions", () => {
  var mockupHtml = fs.readFileSync(path.join(__dirname, "..", "docs/mocks/theme-ui-alternatives.html"), "utf8");

  assert.match(mockupHtml, /Selected design:\s*option 4 command bar hybrid/);
  assert.match(mockupHtml, /4\.\s*Selected:\s*Command Bar Hybrid/);

  [
    "Command Bar Hybrid",
    "Right Inspector Dock",
    "Bottom Utility Shelf",
  ].forEach(function (layoutName) {
    assert.match(mockupHtml, new RegExp(layoutName));
  });
});

test("theme action labels use dedicated per-theme colors instead of status success", () => {
  assert.match(paneScss, /\.crm-power-pane-subgroup[\s\S]*color:\s*var\(--crm-power-pane-label/);
  assert.doesNotMatch(paneScss, /\.crm-power-pane-subgroup[\s\S]{0,120}color:\s*var\(--crm-power-pane-success/);

  [
    "velvet-void.crm-power-pane-mode-light",
    "velvet-void.crm-power-pane-mode-dark",
    "dark-matter.crm-power-pane-mode-light",
    "dark-matter.crm-power-pane-mode-dark",
    "plasma-ice.crm-power-pane-mode-light",
    "plasma-ice.crm-power-pane-mode-dark",
    "aurora-rift.crm-power-pane-mode-light",
    "aurora-rift.crm-power-pane-mode-dark",
  ].forEach((themeClass) => {
    var blockPattern = new RegExp(
      "#crm-power-pane\\.crm-power-pane-theme-" +
        themeClass.replace(/\./g, "\\.") +
        "\\s*\\{([\\s\\S]*?)\\n\\}"
    );
    var block = paneScss.match(blockPattern);
    assert.ok(block, "Missing theme block for " + themeClass);
    var label = block[1].match(/--crm-power-pane-label:\s*(#[0-9A-Fa-f]{6});/);
    var success = block[1].match(/--crm-power-pane-success:\s*(#[0-9A-Fa-f]{6});/);
    assert.ok(label, "Missing label token for " + themeClass);
    assert.ok(success, "Missing success token for " + themeClass);
    assert.notEqual(label[1].toLowerCase(), success[1].toLowerCase(), themeClass);
  });
});

test("light theme headers and icon tiles use contrast-safe tokens", () => {
  assert.match(
    paneScss,
    /\.crm-power-pane-subgroup[\s\S]*span\.icon[\s\S]*background-color:\s*var\(--crm-power-pane-icon-bg/
  );

  [
    "velvet-void",
    "dark-matter",
    "plasma-ice",
    "aurora-rift",
  ].forEach((themeId) => {
    var blockPattern = new RegExp(
      "#crm-power-pane\\.crm-power-pane-theme-" +
        themeId +
        "\\.crm-power-pane-mode-light\\s*\\{([\\s\\S]*?)\\n\\}"
    );
    var block = paneScss.match(blockPattern);
    assert.ok(block, "Missing light theme block for " + themeId);
    var background = block[1].match(/--crm-power-pane-bg:\s*(#[0-9A-Fa-f]{6});/);
    var highlight = block[1].match(/--crm-power-pane-accent-highlight:\s*(#[0-9A-Fa-f]{6});/);
    var iconBg = block[1].match(/--crm-power-pane-icon-bg:\s*(#[0-9A-Fa-f]{6});/);
    assert.ok(background, "Missing background token for " + themeId);
    assert.ok(highlight, "Missing accent highlight token for " + themeId);
    assert.ok(iconBg, "Missing icon background token for " + themeId);
    assert.notEqual(highlight[1].toLowerCase(), background[1].toLowerCase(), themeId + " header");
    assert.notEqual(iconBg[1].toLowerCase(), background[1].toLowerCase(), themeId + " icon");
  });
});
