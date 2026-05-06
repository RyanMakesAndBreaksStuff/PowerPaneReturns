const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const paneSource = fs.readFileSync(path.join(__dirname, "..", "src/js/ui/pane.js"), "utf8");
const paneHtml = fs.readFileSync(path.join(__dirname, "..", "src/html/ui/pane.html"), "utf8");
const paneScss = fs.readFileSync(path.join(__dirname, "..", "src/sass/ui/pane.scss"), "utf8");

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
