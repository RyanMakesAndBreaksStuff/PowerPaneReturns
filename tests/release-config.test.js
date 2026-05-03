const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const repoRoot = path.resolve(__dirname, "..");

function normalize(content) {
  return content
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, "  ")
    .replace(/[']/g, "")
    .replace(/[ ]+$/gm, "");
}

function extractBuildScriptLines(buildYaml) {
  const normalized = normalize(buildYaml);
  const lines = normalized.split("\n");
  const start = lines.findIndex((line) => /^\s*-\s*script:\s*\|/.test(line));
  if (start < 0) {
    return [];
  }

  const scriptLines = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^\s*-\s*(script:|task:|checkout:|publish:)/.test(line)) {
      break;
    }
    if (/^\s*displayName:/.test(line)) {
      break;
    }
    const match = line.match(/^\s+(.*)$/);
    if (match && match[1].trim()) {
      scriptLines.push(match[1].trim());
    }
  }

  return scriptLines;
}

test("build targets and publish artifacts stay aligned", () => {
  const targets = require("../build/targets");
  const buildYaml = normalize(
    fs.readFileSync(
    path.join(repoRoot, "pipelines/templates/stages/build.yml"),
    "utf8"
    )
  );

  assert.deepEqual(targets, ["chrome", "firefox", "edge-chromium"]);
  assert.doesNotMatch(buildYaml, /dist\/edge(\/|$)/);
  assert.match(buildYaml, /dist\/edge-chromium\b/);
});

test("pipeline uses reproducible installs on supported Node", () => {
  const buildYaml = fs.readFileSync(
    path.join(repoRoot, "pipelines/templates/stages/build.yml"),
    "utf8"
  );
  const normalizedYaml = normalize(buildYaml);
  const scriptLines = extractBuildScriptLines(buildYaml);

  assert.match(normalizedYaml, /versionSpec:\s*22\.x/);
  assert.ok(scriptLines.includes("npm ci"));
  assert.ok(
    scriptLines.includes(
      'npm test -- --test-name-pattern "build targets|pipeline|gulpfile"'
    )
  );
  assert.ok(
    scriptLines.includes(
      "npm run build-all -- --build-version=$(build.buildNumber)"
    )
  );
  assert.doesNotMatch(normalizedYaml, /\bnpm install\b/);
});

test("gulpfile has no unused webpack or legacy Edge branch", () => {
  const gulpfile = fs.readFileSync(path.join(repoRoot, "gulpfile.js"), "utf8");

  assert.doesNotMatch(gulpfile, /webpack-stream/);
  assert.doesNotMatch(gulpfile, /argv\.target\s*==\s*['"]edge['"]/);
});
