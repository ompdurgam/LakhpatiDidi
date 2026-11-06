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

// What the real API sends instead in English (name_en columns, English labels and dates).
const englishData: Record<string, string> = {
  "PMMSY – तालाब": "PMMSY – Pond",
  "मत्स्य विभाग": "Fisheries Department",
  जगदलपुर: "Jagdalpur",
  बड़ांजी: "Badanji",
  "सुनीता कश्यप": "Sunita Kashyap",
  अतिदेय: "Overdue",
  "प्रगति पर": "In progress",
  "18 अक्टू. 2026": "18 Oct 2026",
  "05 नव. 2026": "05 Nov 2026",
  पहचान: "Identity",
}

const inEnglish = (value: unknown): unknown =>
  typeof value === "string"
    ? (englishData[value] ?? value)
    : Array.isArray(value)
      ? value.map(inEnglish)
      : value && typeof value === "object"
        ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, inEnglish(v)]))
        : value

/** Stubs fetch with fakeApi; honours Accept-Language like the real API. */
export function stubFetch() {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const english = new Headers(init?.headers).get("accept-language") === "en"
    const body = fakeApi(String(input))
    return new Response(JSON.stringify(english ? inEnglish(body) : body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  }) as typeof fetch
}
