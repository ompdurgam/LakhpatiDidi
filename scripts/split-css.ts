// One-off codemod: splits src/index.css into src/styles/*, keeping rule order
// identical (files are imported in sequence), and swaps the most-used
// colours for --ld-* tokens with the same values.
//   node scripts/split-css.ts
import fs from "node:fs"
import path from "node:path"

const lines = fs.readFileSync("src/index.css", "utf8").split("\n")
const out = "src/styles"

// [first line (1-based, inclusive), file]. Each boundary is a top-level rule.
const chunks: [number, string][] = [
  [7, "shell.css"],
  [38, "workspaces.css"],
  [72, "civic-theme.css"],
  [134, "survey/form.css"],
  [1267, "survey/review.css"],
  [2006, "survey/village.css"],
  [2310, "recommendations.css"],
  [2526, "dpr.css"],
  [3266, "households.css"],
  [3800, "auth.css"],
  [4045, "monitoring.css"],
  [4670, "admin.css"],
  [5006, "responsive.css"],
  [5228, "block-operations.css"],
  [5784, "applications.css"],
  [6338, "app-states.css"],
]

const tokens: [string, string, string][] = [
  ["--ld-green-900", "#174e31", "brand / sidebar"],
  ["--ld-green-700", "#34704d", "primary text & accents"],
  ["--ld-green-650", "#2d714a", ""],
  ["--ld-green-600", "#286c46", ""],
  ["--ld-green-500", "#4b875f", ""],
  ["--ld-green-50", "#edf5ef", "green tint surface"],
  ["--ld-gold-500", "#f4bd42", "brand mark"],
  ["--ld-gold-50", "#fff0d2", "gold tint surface"],
  ["--ld-orange-500", "#e48534", "brand accent"],
  ["--ld-red-600", "#b44d3f", "danger"],
  ["--ld-text", "#20251f", "body text"],
  ["--ld-heading", "#294435", ""],
  ["--ld-text-strong", "#35473b", ""],
  ["--ld-text-muted", "#849087", ""],
  ["--ld-border", "#dfe5df", ""],
  ["--ld-border-soft", "#dce3dd", ""],
  ["--ld-surface", "#fafbf9", ""],
  ["--ld-surface-alt", "#ebeeeb", ""],
  ["--ld-page", "#f6f7f3", "app background"],
]

function tokenize(css: string) {
  let result = css
  for (const [name, hex] of tokens) {
    // Exact 6-digit match only (not part of an 8-digit #rrggbbaa).
    result = result.replace(new RegExp(`${hex}(?![0-9a-fA-F])`, "gi"), `var(${name})`)
  }
  return result
}

// A boundary must not split a comma-separated selector list across files:
// move it back to the first line of the list (each file is parsed alone).
for (const chunk of chunks) {
  let start = chunk[0]
  while (start > 1) {
    let prev = start - 2 // index of the line above, skipping blank lines
    while (prev >= 0 && lines[prev].trim() === "") prev--
    if (prev < 0 || !lines[prev].trimEnd().endsWith(",")) break
    start = prev + 1
  }
  if (start !== chunk[0]) console.log(`moved ${chunk[1]} boundary ${chunk[0]} → ${start}`)
  chunk[0] = start
}

fs.mkdirSync(path.join(out, "survey"), { recursive: true })

const tokensCss = `/* Design tokens. Values are identical to the original Figma export. */
${lines[3]}

:root {
${tokens.map(([name, hex, note]) => `  ${name}: ${hex};${note ? ` /* ${note} */` : ""}`).join("\n")}

  /* Radius & spacing scale for new components */
  --ld-radius-sm: 6px;
  --ld-radius-md: 8px;
  --ld-radius-lg: 10px;
  --ld-radius-xl: 12px;
  --ld-radius-2xl: 24px;
  --ld-space-1: 4px;
  --ld-space-2: 8px;
  --ld-space-3: 12px;
  --ld-space-4: 16px;
  --ld-space-5: 24px;
  --ld-space-6: 32px;
  --ld-touch-target: 48px;
}
`
fs.writeFileSync(path.join(out, "tokens.css"), tokensCss)
fs.writeFileSync(
  path.join(out, "base.css"),
  `/* Base element styles. */\n${tokenize(lines.slice(4, 6).join("\n"))}\n`,
)

for (let i = 0; i < chunks.length; i++) {
  const [start, file] = chunks[i]
  const end = i + 1 < chunks.length ? chunks[i + 1][0] - 1 : lines.length
  const body = lines
    .slice(start - 1, end)
    .join("\n")
    .replace(/\n+$/, "")
  fs.writeFileSync(path.join(out, file), `${tokenize(body)}\n`)
}

const index = `${lines[0]}
@import 'tailwindcss';
@import './tokens.css';
@import './base.css';
${chunks.map(([, file]) => `@import './${file}';`).join("\n")}
`
fs.writeFileSync(path.join(out, "index.css"), index)
console.log(index)
