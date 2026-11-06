import { describe, expect, it } from "vitest"

import { buildTasks, progress } from "./didi.tasks.ts"

const base = { income: 78_500, target: 100_000, activeSources: 3, gaps: [], applications: [] }

describe("didi tasks", () => {
  it("always has the income-source and Lakhpati goals", () => {
    const tasks = buildTasks(base)
    expect(tasks.map((t) => [t.kind, t.done])).toEqual([
      ["second_source", true],
      ["lakhpati", false],
    ])
  })

  it("asks for a second income source until she has two", () => {
    expect(buildTasks({ ...base, activeSources: 1 })[0]).toMatchObject({
      kind: "second_source",
      done: false,
    })
  })

  it("lists open scheme gaps first and caps them at three", () => {
    const gaps = [
      { code: "A", name: "A", open: false },
      { code: "B", name: "B", open: true },
      { code: "C", name: "C", open: true },
      { code: "D", name: "D", open: true },
      { code: "E", name: "E", open: true },
    ]
    const shown = buildTasks({ ...base, gaps }).filter((t) => t.kind === "scheme_gap")
    expect(shown.map((t) => t.scheme)).toEqual(["B", "C", "D"])
    expect(shown.every((t) => !t.done)).toBe(true)
  })

  it("turns application status into tasks", () => {
    const tasks = buildTasks({
      ...base,
      applications: [
        { id: "APP-1", scheme: "X", statusCode: "info_requested" },
        { id: "APP-2", scheme: "Y", statusCode: "sanctioned" },
        { id: "APP-3", scheme: "Z", statusCode: "delivered" },
        { id: "APP-4", scheme: "W", statusCode: "under_review" },
      ],
    })
    const byApp = Object.fromEntries(
      tasks.filter((t) => t.application).map((t) => [t.application, t]),
    )
    expect(byApp["APP-1"]).toMatchObject({ kind: "info_requested", done: false })
    expect(byApp["APP-2"]).toMatchObject({ kind: "delivery", done: false })
    expect(byApp["APP-3"]).toMatchObject({ kind: "delivery", done: true })
    expect(byApp["APP-4"]).toBeUndefined()
  })

  it("marks the Lakhpati goal done at the target and reports progress", () => {
    const tasks = buildTasks({ ...base, income: 104_000 })
    expect(tasks.find((t) => t.kind === "lakhpati")?.done).toBe(true)
    expect(progress(tasks)).toEqual({ done: 2, total: 2, percent: 100 })
    expect(progress([])).toEqual({ done: 0, total: 0, percent: 0 })
  })
})
