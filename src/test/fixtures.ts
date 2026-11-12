import type { ApplicationRow, HouseholdRow, Meta } from "@/api/types"

import {
  dprBoardFixture,
  dprFixture,
  recommendationsFixture,
  surveyedFixture,
} from "./fieldFixtures"
import { overviewFixture } from "./monitoringFixtures"

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
  deptCode: "FISH",
  daysOverdue: 3,
  subsidyAmount: 72000,
  sanctionedAmount: null,
  incomeActive: false,
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
  blocks: [{ code: "JGD", name: "जगदलपुर", active: true }],
  villages: [{ code: "V-BADANJI", name: "बड़ांजी" }],
  clfs: ["माँ दंतेश्वरी CLF"],
  vos: ["शक्ति VO"],
  schemes: [{ code: "PMMSY_POND", name: "PMMSY – तालाब", department: "मत्स्य विभाग" }],
}

export const geoAreaFixture = {
  path: [
    { level: "state", code: "CG", name: "छत्तीसगढ़" },
    { level: "district", code: "374", name: "बस्तर" },
  ],
  childLevel: "block",
  children: [
    {
      code: "3595",
      name: "जगदलपुर",
      bodyType: null,
      childCount: 73,
      households: 17,
      lakhpati: 2,
      hasBoundary: false,
    },
    {
      code: "3591",
      name: "बकावंड",
      bodyType: null,
      childCount: 93,
      households: 0,
      lakhpati: 0,
      hasBoundary: false,
    },
  ],
  boundaries: { type: "FeatureCollection", features: [] },
  outline: null,
  sources: [],
}

export const geoVillageFixture = {
  path: [...geoAreaFixture.path, { level: "village", code: "449068", name: "धुरगुड़ा" }],
  households: 3,
  lakhpati: 0,
  pld: 3,
  avgIncome: 70667,
  shgs: 2,
  boundary: null,
}

export const didiFixture = {
  profile: {
    code: "HH-BST-JGD-000123",
    name: "सुनीता कश्यप",
    initials: "SK",
    guardian: "राम कश्यप",
    age: 34,
    mobile: "9826100123",
    category: "ST",
    special: "FRA",
    pld: true,
    village: "बड़ांजी",
    panchayat: "बड़ांजी GP",
    block: "जगदलपुर",
    district: "बस्तर",
    shg: "स्वावलंबी SHG",
    vo: "शक्ति VO",
    clf: "माँ दंतेश्वरी CLF",
  },
  meter: {
    income: 78500,
    target: 100000,
    threshold: 80000,
    remaining: 21500,
    percent: 79,
    status: "in_progress",
    statusLabel: "प्रगति पर",
    activeSources: 3,
  },
  incomeSources: [
    { name: "फसल/खेती", months: ["Jun", "Jul", "Aug"], gross: 42000, cost: 10000, net: 32000 },
    { name: "वन उपज", months: ["Mar", "Apr"], gross: 24000, cost: 5500, net: 18500 },
  ],
  gaps: [
    {
      code: "PMJJBY",
      name: "PMMSY – तालाब",
      department: "मत्स्य विभाग",
      open: true,
      identifiedOn: "2026-10-18",
    },
  ],
  applications: [applicationFixture],
  tasks: {
    items: [
      { id: "second_source", kind: "second_source", done: true },
      { id: "gap-PMMSY", kind: "scheme_gap", done: false, scheme: "PMMSY – तालाब" },
      { id: "lakhpati", kind: "lakhpati", done: false },
    ],
    done: 1,
    total: 3,
    percent: 33,
  },
  monthlyIncome: [{ month: "2026-10", amount: 6500 }],
  entitlements: [
    { name: "PM आवास", department: "ग्रामीण विकास", status: "missing" },
    { name: "PM आवास", department: "ग्रामीण विकास", status: "received" },
  ],
}

/** Minimal fake of the REST API for component and route tests. */
export function fakeApi(url: string): unknown {
  const path = url.replace(/^.*\/api/, "").split("?")[0]
  if (path === "/applications") return [applicationFixture]
  if (path === "/households") return [householdFixture]
  if (path === "/meta") return metaFixture
  if (path === "/survey-sections") return [{ code: "A", name: "पहचान", enabled: true }]
  if (path.startsWith("/applications/")) return null
  if (path === "/didi/me") return didiFixture
  if (path === "/didi/me/schemes")
    return {
      income: recommendationsFixture.household.income,
      leverage: recommendationsFixture.leverage,
      recommendations: recommendationsFixture.recommendations.map((fit) => ({
        ...fit,
        interest: null,
      })),
      entitlements: [
        { code: "PMAY", name: "PM आवास", department: "ग्रामीण विकास", since: "2026-10-01" },
      ],
    }
  if (path === "/recommendations") return surveyedFixture
  if (path.startsWith("/recommendations/")) return recommendationsFixture
  if (path === "/dpr") return dprBoardFixture
  if (path.startsWith("/dpr/")) return dprFixture
  if (path.startsWith("/geo/areas/")) return geoAreaFixture
  if (path.startsWith("/geo/villages/")) return geoVillageFixture
  if (path === "/monitoring/overview") return overviewFixture
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
  "राम कश्यप": "Ram Kashyap",
  "बड़ांजी GP": "Badanji GP",
  "स्वावलंबी SHG": "Swavalambi SHG",
  "शक्ति VO": "Shakti VO",
  "माँ दंतेश्वरी CLF": "Maa Danteshwari CLF",
  "फसल/खेती": "Crops/Farming",
  "वन उपज": "Forest produce",
  छत्तीसगढ़: "Chhattisgarh",
  बस्तर: "Bastar",
  बकावंड: "Bakawand",
  धुरगुड़ा: "Dhurguda",
  नानगुर: "Nangur",
  "ग्रामीण विकास": "Rural Development",
  "गीता नेताम": "Geeta Netam",
  "PM आवास": "PM Awas",
  कृषि: "Agriculture",
  "सहायक संचालक मत्स्य, जगदलपुर": "Assistant Director Fisheries, Jagdalpur",
  "PMMSY से तालाब बनाकर मत्स्य पालन शुरू कर सकती हैं":
    "Can start fish farming by building a pond under PMMSY",
  "SHG सदस्य": "SHG member",
  "स्थल सत्यापन बाकी": "Site verification pending",
  आधार: "Aadhaar",
  पासबुक: "Passbook",
  सक: "SK",
  "तालाब तैयारी": "Pond preparation",
  "फिंगरलिंग बीज": "Fingerling seed",
  "मछली आहार": "Fish feed",
  "12 माह": "12 months",
  "जाल और उपकरण": "Nets and equipment",
  "1 सेट": "1 set",
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
