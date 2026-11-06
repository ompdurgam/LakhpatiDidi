import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { z } from "zod"

import { statusHi } from "../modules/applications/applications.labels.ts"
import { lifecycleHi } from "../modules/households/households.labels.ts"
import { formatDate } from "./format.ts"
import { localized, msg, withLang } from "./i18n.ts"
import english from "./messages.en.json" with { type: "json" }
import { parse, text } from "./validation.ts"

const SERVER = path.resolve(import.meta.dirname, "..")
const dictionary: Record<string, string> = english

function serverFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return serverFiles(full)
    return entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts") ? [full] : []
  })
}

describe("server i18n", () => {
  it("has English for every msg() literal and every label constant", () => {
    const call = /msg\(\s*(["'])((?:\\.|(?!\1).)*)\1/gs
    const literals = serverFiles(SERVER).flatMap((file) =>
      [...fs.readFileSync(file, "utf8").matchAll(call)].map((m) => m[2].replace(/\\"/g, '"')),
    )
    const labels = [...Object.values(statusHi), ...Object.values(lifecycleHi), "अतिदेय", "कलेक्टर"]
    const missing = [...literals, ...labels].filter((text) => !(text in dictionary))
    expect(missing).toEqual([])
  })

  it("answers in Hindi by default and English on request", () => {
    expect(msg("{{n}} परिवार: {{action}}", { n: 2, action: "x" })).toBe("2 परिवार: x")
    withLang("en", () => {
      expect(msg("{{n}} परिवार: {{action}}", { n: 2, action: "x" })).toBe("2 households: x")
      expect(msg("not in the dictionary")).toBe("not in the dictionary")
    })
  })

  it("formats dates in the request language", () => {
    expect(formatDate("2026-11-05")).toBe("05 नव. 2026")
    withLang("en", () => expect(formatDate("2026-11-05 14:32:00", true)).toBe("05 Nov 2026 14:32"))
  })

  it("picks *_en columns in English, falling back to Hindi", () => {
    const row = { village_name: "बड़ांजी", village_name_en: "Badanji", block_name: "जगदलपुर" }
    expect(localized(row, "village_name")).toBe("बड़ांजी")
    withLang("en", () => {
      expect(localized(row, "village_name")).toBe("Badanji")
      expect(localized(row, "block_name")).toBe("जगदलपुर")
    })
  })

  it("builds validation messages per request", () => {
    const schema = z.object({ name: text("नाम") })
    expect(() => parse(schema, {})).toThrow("नाम आवश्यक है")
    withLang("en", () => expect(() => parse(schema, {})).toThrow("Name is required"))
  })
})
