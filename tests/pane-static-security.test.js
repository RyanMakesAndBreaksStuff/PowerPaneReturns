const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const paneSource = fs.readFileSync(path.join(__dirname, "..", "src/js/ui/pane.js"), "utf8");

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
