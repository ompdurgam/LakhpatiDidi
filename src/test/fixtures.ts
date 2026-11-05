import type { ApplicationRow, HouseholdRow, Meta } from "@/api/types"

export const applicationFixture: ApplicationRow = {
  id: "APP-260142",
  name: "सुनीता कश्यप",
  initials: "SK",
  village: "बड़ांजी",
  scheme: "PMMSY – तालाब",
  dept: "मत्स्य विभाग",
  block: "जगदलपुर",
  days: 18,
  status: "अतिदेय",
  statusCode: "under_review",
  overdue: true,
  amount: "₹1,20,000",
  subsidy: "₹72,000",
  received: "18 अक्टू. 2026",
  hhCode: "HH-BST-JGD-000123",
}

export const householdFixture: HouseholdRow = {
  id: "HH-BST-JGD-000123",
  name: "सुनीता कश्यप",
  initials: "SK",
  village: "बड़ांजी",
  shg: "स्वावलंबी SHG",
  vo: "शक्ति VO",
  clf: "माँ दंतेश्वरी CLF",
  income: 78500,
  sources: 3,
  applications: 1,
  gaps: 1,
  updated: "05 नव. 2026",
  status: "प्रगति पर",
  category: "ST",
  special: "FRA",
  pld: true,
}

export const metaFixture: Meta = {
  departments: [{ code: "FISH", name: "मत्स्य विभाग" }],
  blocks: [{ code: "JGD", name: "जगदलपुर" }],
  villages: [{ code: "V-BADANJI", name: "बड़ांजी" }],
  clfs: ["माँ दंतेश्वरी CLF"],
  vos: ["शक्ति VO"],
  schemes: [{ code: "PMMSY_POND", name: "PMMSY – तालाब", department: "मत्स्य विभाग" }],
}

/** Minimal fake of the REST API for component and route tests. */
export function fakeApi(url: string): unknown {
  const path = url.replace(/^.*\/api/, "").split("?")[0]
  if (path === "/applications") return [applicationFixture]
  if (path === "/households") return [householdFixture]
  if (path === "/meta") return metaFixture
  if (path === "/survey-sections") return [{ code: "A", name: "पहचान", enabled: true }]
  if (path.startsWith("/applications/")) return null
  return []
}

export function stubFetch() {
  globalThis.fetch = (async (input: RequestInfo | URL) =>
    new Response(JSON.stringify(fakeApi(String(input))), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })) as typeof fetch
}
