const { execFileSync } = require("node:child_process");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const repoRoot = path.resolve(__dirname, "..");
const files = [
  "build/all.js",
  "build/targets.js",
  "convert-icons.js",
  "gulpfile.js",
  "src/js/background.js",
  "src/js/inject.js",
  "src/js/ui/options.js",
  "src/js/ui/pane.js",
  "src/js/util/manifest-builder.js",
];

test("JavaScript files parse under Node", () => {
  for (const file of files) {
    assert.doesNotThrow(() => {
      execFileSync(process.execPath, ["--check", path.join(repoRoot, file)], {
        stdio: "pipe",
      });
    }, `${file} should parse`);
  }
});
