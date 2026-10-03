// Writes `created` and `lastUpdated` into resources/snippets.json from git history, so the
// Newest / Oldest / Last Updated sorts work on the Snippets tab. Contributors never add dates
// by hand: a snippet without one sorts as newest until this runs again.
//
//   created     = when the snippet first landed (carried across renames)
//   lastUpdated = when its CSS last changed (whitespace-only edits ignored)
//
// It replays every first-parent commit that touched the snippets file, including the eras when
// it lived elsewhere as a TypeScript `export default [...]` module, so the result is the same
// every time it runs.
//
//   node scripts/snippet-dates.mjs          update resources/snippets.json
//   node scripts/snippet-dates.mjs --check  exit 1 if it's out of date

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const TARGET = "resources/snippets.json";
// Every place the file has lived, newest first.
const PATHS = [TARGET, "resources/snippets.ts", "src/resources/snippets.ts", "packages/marketplace/src/resources/snippets.ts", "snippets.json"];

const git = (...args) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 << 20, stdio: ["ignore", "pipe", "ignore"] });

const exists = (sha, file) => {
  try {
    git("cat-file", "-e", `${sha}:${file}`);
    return true;
  } catch {
    return false;
  }
};

const parse = (file, text) => {
  if (file.endsWith(".json")) return JSON.parse(text);
  // The TypeScript era was always a bare `export default [ ... ];` array literal.
  return new Function(`return ${text.replace(/^\s*export default/, "").replace(/;\s*$/, "")}`)();
};

const squash = (css) =>
  String(css ?? "")
    .replace(/\s+/g, " ")
    .trim();
const key = (title) => String(title).trim().toLowerCase();
const iso = (date) => new Date(date).toISOString().replace(/\.\d{3}Z$/, "Z");

const commits = git("log", "--first-parent", "--reverse", "--format=%H %cI", "HEAD", "--", ...PATHS)
  .trim()
  .split("\n")
  .map((line) => line.split(" "));

const history = new Map(); // key(title) -> { created, lastUpdated, code }
let previous = new Map(); // key(title) -> code in the previous snapshot
// A commit that broke the file's syntax gets credit for what the next commit's repair reveals.
let brokenSince = null;

for (const [sha, commitDate] of commits) {
  const file = PATHS.find((path) => exists(sha, path));
  if (!file) continue;

  let snippets;
  try {
    snippets = parse(file, git("show", `${sha}:${file}`));
  } catch {
    brokenSince ??= commitDate;
    continue;
  }
  const date = brokenSince ?? commitDate;
  brokenSince = null;

  const current = new Map(snippets.map((snippet) => [key(snippet.title), squash(snippet.code)]));
  const removed = [...previous.keys()].filter((title) => !current.has(title));

  for (const [title, code] of current) {
    const known = history.get(title);
    if (known) {
      if (known.code !== code) Object.assign(known, { code, lastUpdated: date });
      continue;
    }
    // A new title whose CSS matches one removed in the same commit is a rename.
    const renamedFrom = removed.find((old) => previous.get(old) === code && history.has(old));
    history.set(title, renamedFrom ? { ...history.get(renamedFrom), code } : { created: date, lastUpdated: date, code });
  }
  previous = current;
}

const original = readFileSync(TARGET, "utf8");
const dated = JSON.parse(original).map((snippet) => {
  const entry = history.get(key(snippet.title));
  // Not committed yet, so there's no history to date it from.
  if (!entry) return snippet;
  return { ...snippet, created: iso(entry.created), lastUpdated: iso(entry.lastUpdated) };
});
const output = `${JSON.stringify(dated, null, 2)}\n`;

if (process.argv.includes("--check")) {
  if (output !== original) {
    console.error(`${TARGET} has out-of-date snippet dates. Run: node scripts/snippet-dates.mjs`);
    process.exit(1);
  }
  console.log(`${TARGET} snippet dates are up to date.`);
} else {
  writeFileSync(TARGET, output);
  console.log(`Dated ${dated.filter((snippet) => snippet.created).length}/${dated.length} snippets in ${TARGET}.`);
}
