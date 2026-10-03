// Writes `created` and `lastUpdated` into resources/snippets.json from git history, so the
// Newest / Oldest / Last Updated sorts work on the Snippets tab. Contributors never add dates
// by hand: a snippet without one sorts as newest until this runs again.
//
//   created     = when the snippet first landed (carried across renames)
//   lastUpdated = when its CSS last changed (reformatting whitespace doesn't count)
//
// It replays every first-parent commit that touched the snippets file, including the eras when
// it lived elsewhere as a TypeScript `export default [...]` module, so the result is the same
// every time it runs. Those snapshots are parsed as data, never executed.
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

// Reads a JavaScript literal (arrays, objects, strings, numbers, true/false/null) as data, never
// executing it. Covers what the TypeScript-era snapshots use: `//` and `/* */` comments, '…', "…"
// and `…` strings (no ${} substitution), unquoted keys and trailing commas. Anything else throws.
const parseLiteral = (source) => {
  let i = 0;

  const fail = (what) => {
    throw new SyntaxError(`${what} at offset ${i}`);
  };

  const skip = () => {
    for (;;) {
      if (/\s/.test(source[i] ?? "")) i++;
      else if (source.startsWith("//", i)) i = source.includes("\n", i) ? source.indexOf("\n", i) + 1 : source.length;
      else if (source.startsWith("/*", i)) i = source.indexOf("*/", i) === -1 ? fail("unclosed comment") : source.indexOf("*/", i) + 2;
      else return;
    }
  };

  const string = () => {
    const quote = source[i++];
    let out = "";
    for (;;) {
      const char = source[i++];
      if (char === undefined) fail("unclosed string");
      if (char === quote) return out;
      if (quote === "`" && char === "$" && source[i] === "{") fail("template substitution");
      if (char === "\r" && quote === "`") {
        // Template literals normalise CRLF and CR to LF.
        if (source[i] === "\n") i++;
        out += "\n";
      } else if ((char === "\n" || char === "\r") && quote !== "`") {
        fail("line break in string");
      } else if (char !== "\\") {
        out += char;
      } else {
        const next = source[i++];
        const simple = { n: "\n", r: "\r", t: "\t", b: "\b", f: "\f", v: "\v" }[next];
        if (simple !== undefined) out += simple;
        else if (next === "0" && !/[0-9]/.test(source[i] ?? "")) out += "\0";
        else if (next === "x" || (next === "u" && source[i] !== "{")) {
          const digits = next === "x" ? 2 : 4;
          out += String.fromCharCode(Number.parseInt(source.slice(i, i + digits), 16));
          i += digits;
        } else if (next === "u" && source[i] === "{") {
          const end = source.indexOf("}", i);
          out += String.fromCodePoint(Number.parseInt(source.slice(i + 1, end), 16));
          i = end + 1;
        } else if (next === "\r")
          i += source[i] === "\n" ? 1 : 0; // line continuation
        else if (next !== "\n" && next !== "\u2028" && next !== "\u2029") out += next; // else: line continuation
      }
    }
  };

  const value = () => {
    skip();
    const char = source[i];
    if (char === "[") {
      i++;
      const list = [];
      for (;;) {
        skip();
        if (source[i] === "]") {
          i++;
          return list;
        }
        list.push(value());
        skip();
        if (source[i] === ",") i++;
        else if (source[i] !== "]") fail("expected , or ]");
      }
    }
    if (char === "{") {
      i++;
      const object = {};
      for (;;) {
        skip();
        if (source[i] === "}") {
          i++;
          return object;
        }
        let key;
        if (source[i] === '"' || source[i] === "'" || source[i] === "`") key = string();
        else {
          const match = /^[A-Za-z_$][\w$]*/.exec(source.slice(i, i + 256));
          if (!match) fail("expected key");
          key = match[0];
          i += key.length;
        }
        skip();
        if (source[i++] !== ":") fail("expected :");
        object[key] = value();
        skip();
        if (source[i] === ",") i++;
        else if (source[i] !== "}") fail("expected , or }");
      }
    }
    if (char === '"' || char === "'" || char === "`") return string();
    const word = /^(?:true|false|null|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(source.slice(i, i + 64));
    if (!word) fail("unexpected token");
    i += word[0].length;
    return JSON.parse(word[0]);
  };

  const result = value();
  skip();
  if (source[i] === ";") i++;
  skip();
  if (i !== source.length) fail("trailing content");
  return result;
};

// The TypeScript era was an `export default [ ... ];` module. It's read as data, not executed, so
// a crafted snapshot in history can't run code on whoever runs this script.
const parse = (file, text) => (file.endsWith(".json") ? JSON.parse(text) : parseLiteral(text.replace(/^\s*export default/, "")));

// Ignore whitespace wherever CSS does: around braces, semicolons, commas and combinators, and after
// colons. Spaces between selectors are kept, since `.a .b` and `.a.b` mean different things.
const squash = (css) =>
  String(css ?? "")
    .replace(/\s+/g, " ")
    .replace(/ ?([{};,>~]) ?/g, "$1")
    .replace(/: /g, ":")
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
