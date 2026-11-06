// A Didi's to-do list, worked out from her own data (nothing is stored): each task
// is "done" when the data says so, so the list updates as her profile does.

export type TaskKind = "second_source" | "scheme_gap" | "info_requested" | "delivery" | "lakhpati"

export type DidiTask = {
  /** Stable key for React lists. */
  id: string
  kind: TaskKind
  done: boolean
  /** Application ID the task is about, when it has one. */
  application?: string
  /** Scheme name (already in the request language). */
  scheme?: string
}

type Inputs = {
  income: number
  target: number
  activeSources: number
  gaps: { code: string; name: string; open: boolean }[]
  applications: { id: string; scheme: string; statusCode: string }[]
}

/** How many scheme gaps to show (open ones first); more would bury the other tasks. */
const MAX_GAPS = 3

export function buildTasks({
  income,
  target,
  activeSources,
  gaps,
  applications,
}: Inputs): DidiTask[] {
  const tasks: DidiTask[] = []

  tasks.push({ id: "second_source", kind: "second_source", done: activeSources >= 2 })

  const ordered = [...gaps].sort((a, b) => Number(b.open) - Number(a.open))
  for (const gap of ordered.slice(0, MAX_GAPS)) {
    tasks.push({ id: `gap-${gap.code}`, kind: "scheme_gap", done: !gap.open, scheme: gap.name })
  }

  for (const app of applications) {
    if (app.statusCode === "info_requested")
      tasks.push({
        id: `info-${app.id}`,
        kind: "info_requested",
        done: false,
        application: app.id,
        scheme: app.scheme,
      })
    if (app.statusCode === "sanctioned" || app.statusCode === "delivered")
      tasks.push({
        id: `delivery-${app.id}`,
        kind: "delivery",
        done: app.statusCode === "delivered",
        application: app.id,
        scheme: app.scheme,
      })
  }

  tasks.push({ id: "lakhpati", kind: "lakhpati", done: income >= target })
  return tasks
}

export const progress = (tasks: DidiTask[]) => {
  const done = tasks.filter((t) => t.done).length
  return {
    done,
    total: tasks.length,
    percent: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
  }
}
