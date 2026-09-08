import fs from "node:fs";
import { execFileSync } from "node:child_process";

const repoRoot = process.env.GITHUB_WORKSPACE || process.cwd();
const specPath = process.env.ADB_TASK_SPEC_PATH;
const outputPath = process.env.GITHUB_OUTPUT;

function setOutput(name, value) {
  if (!outputPath) return;
  fs.appendFileSync(outputPath, `${name}=${String(value)}\n`);
}

function fail(message) {
  throw new Error(message);
}

function git(args, options = {}) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: options.encoding ?? "utf8",
    stdio: options.stdio ?? ["ignore", "pipe", "pipe"],
    maxBuffer: 32 * 1024 * 1024,
  });
}

function globToRegExp(glob) {
  let expression = "^";
  for (let index = 0; index < glob.length; index += 1) {
    const char = glob[index];
    const next = glob[index + 1];

    if (char === "*" && next === "*") {
      const after = glob[index + 2];
      if (after === "/") {
        expression += "(?:.*/)?";
        index += 2;
      } else {
        expression += ".*";
        index += 1;
      }
      continue;
    }

    if (char === "*") {
      expression += "[^/]*";
      continue;
    }

    if (char === "?") {
      expression += "[^/]";
      continue;
    }

    expression += char.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
  }
  expression += "$";
  return new RegExp(expression);
}

function matchesAny(path, patterns) {
  return patterns.some((pattern) => globToRegExp(pattern).test(path));
}

function assertSafeChangedPath(path) {
  if (
    !path ||
    path.startsWith("/") ||
    path.includes("\\") ||
    path.split("/").includes("..") ||
    /[\u0000-\u001f\u007f]/.test(path)
  ) {
    fail(`unsafe_changed_path:${JSON.stringify(path)}`);
  }
}

function parseChangedPaths() {
  git(["add", "-N", "--", "."]);
  const output = git(["diff", "--name-only", "-z", "--diff-filter=ACMRD", "HEAD"], {
    encoding: "buffer",
  });
  return output
    .toString("utf8")
    .split("\0")
    .filter(Boolean);
}

function countChangedLines() {
  const output = git(["diff", "--numstat", "HEAD"]);
  let total = 0;

  for (const line of output.split("\n").filter(Boolean)) {
    const [added, deleted] = line.split("\t", 3);
    if (added === "-" || deleted === "-") {
      fail("binary_change_not_supported");
    }
    const additions = Number(added);
    const deletions = Number(deleted);
    if (!Number.isInteger(additions) || !Number.isInteger(deletions)) {
      fail("invalid_diff_numstat");
    }
    total += additions + deletions;
  }

  return total;
}

try {
  if (!specPath) fail("task_spec_path_missing");
  const raw = fs.readFileSync(specPath, "utf8");
  const spec = JSON.parse(raw);
  const scope = spec?.task?.scope_config;

  if (!scope || typeof scope !== "object" || Array.isArray(scope)) {
    fail("invalid_scope_config");
  }

  const allowed = scope.allowed_paths;
  const denied = scope.denied_paths;
  const forbidden = scope.forbidden_patterns;
  const maxFiles = scope.max_files_changed;
  const maxLines = scope.max_changed_lines;

  if (!Array.isArray(allowed) || allowed.length === 0) fail("allowed_paths_empty");
  if (!Array.isArray(denied)) fail("denied_paths_invalid");
  if (!Array.isArray(forbidden)) fail("forbidden_patterns_invalid");
  if (!Number.isInteger(maxFiles) || maxFiles <= 0) fail("max_files_changed_invalid");
  if (!Number.isInteger(maxLines) || maxLines <= 0) fail("max_changed_lines_invalid");

  const hardDenied = [
    ".github/**",
    ".env",
    ".env.*",
    "**/*.pem",
    "**/*.key",
    "node_modules/**",
    "dist/**",
  ];

  const changedPaths = parseChangedPaths();
  if (changedPaths.length === 0) fail("no_changes_produced");
  if (changedPaths.length > maxFiles) {
    fail(`max_files_changed_exceeded:${changedPaths.length}:${maxFiles}`);
  }

  for (const path of changedPaths) {
    assertSafeChangedPath(path);
    if (matchesAny(path, hardDenied)) fail(`hard_denied_path:${path}`);
    if (!matchesAny(path, allowed)) fail(`path_outside_allowed_scope:${path}`);
    if (matchesAny(path, denied)) fail(`denied_path:${path}`);
  }

  const changedLines = countChangedLines();
  if (changedLines > maxLines) {
    fail(`max_changed_lines_exceeded:${changedLines}:${maxLines}`);
  }

  const patch = git(["diff", "--binary", "--no-ext-diff", "HEAD"]);
  for (const pattern of forbidden) {
    if (typeof pattern !== "string" || !pattern) fail("invalid_forbidden_pattern");
    if (patch.includes(pattern)) fail("forbidden_pattern_detected");
  }

  setOutput("blocked", "false");
  setOutput("changed_files", changedPaths.length);
  setOutput("changed_lines", changedLines);
  console.log(`Scope guard passed: ${changedPaths.length} files, ${changedLines} changed lines.`);
} catch (error) {
  setOutput("blocked", "true");
  const message = error instanceof Error ? error.message : String(error);
  console.error(`ADB_SCOPE_BLOCKED: ${message}`);
  process.exit(2);
}
