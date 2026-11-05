// Moves the JSX from `fromLine` to the end of a page component's root element
// into a new component file, and renders it in its place.
//   node scripts/extract-section.mjs <file> <fromLine> <NewComponent> [prop1,prop2]
import fs from "node:fs"
import path from "node:path"

const [file, fromArg, name, propsArg = ""] = process.argv.slice(2)
const props = propsArg ? propsArg.split(",") : []
const lines = fs.readFileSync(file, "utf8").split("\n")
const from = Number(fromArg) - 1

// The page's root element closes at 4-space indent just before "  )".
let end = lines.length - 1
while (end > from && !(lines[end] === "  )" && /^ {4}<\//.test(lines[end - 1]))) end--
const rootClose = end - 1
const moved = lines.slice(from, rootClose).map((l) => l.replace(/^ {2}/, ""))

const usage = `      <${name}${props.map((p) => ` ${p}={${p}}`).join("")} />`
const parent = [...lines.slice(0, from), usage, ...lines.slice(rootClose)]
const importLine = `import { ${name} } from "./${name}"`
fs.writeFileSync(file, `${importLine}\n${parent.join("\n")}`)

const out = path.join(path.dirname(file), `${name}.tsx`)
fs.writeFileSync(
  out,
  `export function ${name}(${props.length ? `{ ${props.join(", ")} }: Props` : ""}) {
  return (
    <>
${moved.join("\n")}
    </>
  )
}
`,
)
console.log(`moved ${moved.length} lines → ${out}`)
