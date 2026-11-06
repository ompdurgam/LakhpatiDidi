import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

import i18n from "./index"
import { hasEnglish, translate } from "./tr"

const SRC = path.resolve(__dirname, "..")
const DEVANAGARI = /[ऀ-ॿ]/
const OBJECT_KEY = /(^|[,{]\s*)[ऀ-ॿ\w]+\s*:/gm

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory())
      return entry.name === "i18n" || entry.name === "test" ? [] : sourceFiles(full)
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [full] : []
  })
}

type Token = { kind: "string" | "template" | "code"; text: string; line: number }

/** Splits source into string literals, template literals and other code (comments dropped). */
function tokenize(code: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  let line = 1
  let buffer = ""
  let bufferLine = 1
  const flush = () => {
    if (buffer) tokens.push({ kind: "code", text: buffer, line: bufferLine })
    buffer = ""
  }
  while (i < code.length) {
    const ch = code[i]
    if (ch === "/" && code[i + 1] === "/") {
      while (i < code.length && code[i] !== "\n") i++
      continue
    }
    if (ch === "/" && code[i + 1] === "*") {
      const end = code.indexOf("*/", i + 2)
      const stop = end === -1 ? code.length : end + 2
      line += (code.slice(i, stop).match(/\n/g) ?? []).length
      i = stop
      continue
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      flush()
      const start = line
      let j = i + 1
      let text = ""
      while (j < code.length && code[j] !== ch) {
        if (code[j] === "\\") {
          text += code[j + 1]
          j += 2
          continue
        }
        if (code[j] === "\n") line++
        text += code[j]
        j++
      }
      tokens.push({ kind: ch === "`" ? "template" : "string", text, line: start })
      i = j + 1
      bufferLine = line
      continue
    }
    if (!buffer) bufferLine = line
    if (ch === "\n") line++
    buffer += ch
    i++
  }
  flush()
  return tokens
}

/** Template text with every `${…}` expression removed. */
function staticText(template: string) {
  let out = ""
  let depth = 0
  for (let i = 0; i < template.length; i++) {
    if (depth === 0 && template[i] === "$" && template[i + 1] === "{") {
      depth = 1
      i++
    } else if (depth > 0) {
      if (template[i] === "{") depth++
      else if (template[i] === "}") depth--
    } else out += template[i]
  }
  return out
}

function scan() {
  const missing: string[] = []
  const untranslatable: string[] = []
  for (const file of sourceFiles(SRC)) {
    const rel = path.relative(SRC, file)
    // A line marked `i18n-exempt` and the line after it are not checked (the "स्व" logo glyph).
    const code = fs
      .readFileSync(file, "utf8")
      .split(/\r?\n/)
      .map((text, index, lines) =>
        text.includes("i18n-exempt") || lines[index - 1]?.includes("i18n-exempt")
          ? text.replace(/[ऀ-ॿ]/g, "x")
          : text,
      )
      .join("\n")
    for (const token of tokenize(code)) {
      // Hindi inside a template's ${…} is code (comparisons, nested tr()), not display text.
      const text = token.kind === "template" ? staticText(token.text) : token.text
      if (!DEVANAGARI.test(text)) continue
      // Unquoted Hindi object keys (`{ अतिदेय: "red" }`) are lookup keys, not display text.
      if (token.kind === "code" && !DEVANAGARI.test(text.replace(OBJECT_KEY, "$1"))) continue
      const where = `${rel}:${token.line}`
      if (token.kind === "code") {
        untranslatable.push(
          `${where} JSX text — wrap in {tr("…")}: ${token.text.trim().slice(0, 60)}`,
        )
      } else if (token.kind === "template" && token.text.includes("${")) {
        untranslatable.push(
          `${where} template — use tr("…{{x}}…", { x }): ${token.text.slice(0, 60)}`,
        )
      } else if (!hasEnglish(token.text)) {
        missing.push(`${where} ${JSON.stringify(token.text)}`)
      }
    }
  }
  return { missing, untranslatable }
}

describe("tr", () => {
  const { missing, untranslatable } = scan()

  it("has an English entry for every Hindi string in the screens", () => {
    expect(missing).toEqual([])
  })

  it("has no Hindi outside translatable string literals", () => {
    expect(untranslatable).toEqual([])
  })

  it("translates and fills placeholders in both languages", async () => {
    await i18n.changeLanguage("en")
    expect(translate("सभी")).toBe("All")
    expect(translate("{{n}} दिन", { n: 3 })).toBe("3 days")
    expect(translate("05 नव. 2026 14:32")).toBe("05 Nov 2026 14:32")
    expect(translate("unknown text")).toBe("unknown text")
    await i18n.changeLanguage("hi")
    expect(translate("सभी")).toBe("सभी")
    expect(translate("{{n}} दिन", { n: 3 })).toBe("3 दिन")
  })
})
