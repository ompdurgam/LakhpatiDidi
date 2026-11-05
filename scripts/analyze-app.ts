// Lists every top-level declaration in a TSX file with its size and the
// other top-level names it references. Used to plan the feature split.
//   node scripts/analyze-app.ts src/App.tsx [--json out.json]
import fs from "node:fs"
import ts from "typescript"

const file = process.argv[2] ?? "src/App.tsx"
const jsonOut = process.argv.includes("--json")
  ? process.argv[process.argv.indexOf("--json") + 1]
  : null
const text = fs.readFileSync(file, "utf8")
const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

type Decl = {
  name: string
  kind: string
  start: number
  end: number
  lines: number
  deps: string[]
}
const decls: Decl[] = []

function declName(node: ts.Statement): [string, string] | null {
  if (ts.isFunctionDeclaration(node) && node.name) return [node.name.text, "function"]
  if (ts.isTypeAliasDeclaration(node)) return [node.name.text, "type"]
  if (ts.isInterfaceDeclaration(node)) return [node.name.text, "interface"]
  if (ts.isVariableStatement(node)) {
    const d = node.declarationList.declarations[0]
    if (ts.isIdentifier(d.name)) return [d.name.text, "const"]
  }
  return null
}

for (const stmt of source.statements) {
  const info = declName(stmt)
  if (!info) continue
  const start = source.getLineAndCharacterOfPosition(stmt.getStart()).line + 1
  const end = source.getLineAndCharacterOfPosition(stmt.getEnd()).line + 1
  decls.push({ name: info[0], kind: info[1], start, end, lines: end - start + 1, deps: [] })
}

const names = new Set(decls.map((d) => d.name))
for (const stmt of source.statements) {
  const info = declName(stmt)
  if (!info) continue
  const found = new Set<string>()
  const visit = (n: ts.Node) => {
    if (ts.isIdentifier(n) && names.has(n.text) && n.text !== info[0]) found.add(n.text)
    ts.forEachChild(n, visit)
  }
  ts.forEachChild(stmt, visit)
  decls.find((d) => d.name === info[0])!.deps = [...found]
}

if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(decls, null, 2))
for (const d of decls)
  console.log(
    `${String(d.start).padStart(5)} ${String(d.lines).padStart(5)}  ${d.kind.padEnd(9)} ${d.name}  ← ${d.deps.join(",")}`,
  )
