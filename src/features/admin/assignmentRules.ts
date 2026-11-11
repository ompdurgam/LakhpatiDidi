// Role × area assignment rules and helpers for the admin user editor.

export type AssignmentDraft = {
  role: string
  level: string
  /** Codes chosen at each level, down to the assignment's own level. */
  district?: string
  block?: string
  gram_panchayat?: string
  village?: string
  department?: string
}

export const ROLE_OPTIONS: [string, string][] = [
  ["field", "CRP / सर्वेयर"],
  ["block", "ब्लॉक प्रबंधक (BMMU)"],
  ["department", "विभाग अधिकारी"],
  ["district", "जिला (DPM)"],
  ["state", "राज्य (SMMU)"],
  ["admin", "एडमिन"],
  ["didi", "दीदी"],
]

export const LEVEL_LABEL: Record<string, string> = {
  state: "पूरा राज्य",
  district: "जिला",
  block: "ब्लॉक",
  gram_panchayat: "ग्राम पंचायत",
  village: "गाँव",
}

/** Area levels each role may be given (mirrors the server's rules). */
export const ROLE_LEVELS: Record<string, string[]> = {
  admin: ["state"],
  state: ["state"],
  district: ["district"],
  department: ["state", "district", "block"],
  block: ["block"],
  field: ["block", "gram_panchayat", "village"],
  didi: ["village"],
}

export const CHAIN = ["district", "block", "gram_panchayat", "village"] as const

/** The API body for a draft: its role, level and the code at its own level. */
export const toAssignment = (d: AssignmentDraft) => ({
  role: d.role,
  level: d.level,
  area: d.level === "state" ? undefined : d[d.level as (typeof CHAIN)[number]],
  department: d.role === "department" ? d.department : undefined,
})

export const isComplete = (d: AssignmentDraft) =>
  (d.level === "state" || Boolean(d[d.level as (typeof CHAIN)[number]])) &&
  (d.role !== "department" || Boolean(d.department))
