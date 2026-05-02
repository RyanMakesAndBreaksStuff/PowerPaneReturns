const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const repoRoot = path.resolve(__dirname, "..");

test("build targets and publish artifacts stay aligned", () => {
  const targets = require("../build/targets");
  const buildYaml = fs.readFileSync(
    path.join(repoRoot, "pipelines/templates/stages/build.yml"),
    "utf8"
  );

  assert.deepEqual(targets, ["chrome", "firefox", "edge-chromium"]);
  assert.doesNotMatch(buildYaml, /dist\/edge['"]/);
  assert.match(buildYaml, /dist\/edge-chromium['"]/);
});

test("pipeline uses reproducible installs on supported Node", () => {
  const buildYaml = fs.readFileSync(
    path.join(repoRoot, "pipelines/templates/stages/build.yml"),
    "utf8"
  );

  assert.match(buildYaml, /versionSpec:\s*'22\.x'/);
  assert.match(buildYaml, /\bnpm ci\b/);
  assert.doesNotMatch(buildYaml, /\bnpm install\b/);
});

test("gulpfile has no unused webpack or legacy Edge branch", () => {
  const gulpfile = fs.readFileSync(path.join(repoRoot, "gulpfile.js"), "utf8");

  assert.doesNotMatch(gulpfile, /webpack-stream/);
  assert.doesNotMatch(gulpfile, /argv\.target\s*==\s*['"]edge['"]/);
});
