// Parsing helpers for the LGD (Local Government Directory) village file.
// Pure functions — the database import lives in importLgd.ts.

export type LgdRow = {
  district_code: string
  district_name: string
  block_code: string
  block_name: string
  local_body_code: string
  local_body_name: string
  local_body_type: string
  village_code: string
  village_name: string
}

export type LgdArea = { code: string; name: string; parent: string }
export type LgdHierarchy = {
  districts: LgdArea[]
  blocks: LgdArea[]
  panchayats: (LgdArea & { type: string })[]
  villages: LgdArea[]
}

/** Minimal CSV parser (quoted fields, commas, CRLF). */
export function parseCsv(text: string): Record<string, string>[] {
  const records: string[][] = []
  let field = ""
  let row: string[] = []
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (ch === '"') quoted = false
      else field += ch
    } else if (ch === '"') quoted = true
    else if (ch === ",") {
      row.push(field)
      field = ""
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++
      row.push(field)
      if (row.some((cell) => cell !== "")) records.push(row)
      row = []
      field = ""
    } else field += ch
  }
  if (field || row.length) {
    row.push(field)
    records.push(row)
  }
  const [header = [], ...body] = records
  return body.map((cells) => Object.fromEntries(header.map((h, i) => [h, (cells[i] ?? "").trim()])))
}

/** "BADE DEVDA" → "Bade Devda"; mixed-case names are kept as LGD wrote them. */
export function displayName(name: string) {
  const clean = name.replace(/\s+/g, " ").trim()
  if (clean !== clean.toUpperCase()) return clean
  return clean.toLowerCase().replace(/(^|[\s\-(/])([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase())
}

/**
 * Unique districts → blocks → local bodies → villages. A village listed
 * under more than one local body keeps the first (Village Panchayat first).
 */
export function buildHierarchy(rows: LgdRow[]): LgdHierarchy {
  const districts = new Map<string, LgdArea>()
  const blocks = new Map<string, LgdArea>()
  const panchayats = new Map<string, LgdArea & { type: string }>()
  const villages = new Map<string, LgdArea>()
  const ordered = [...rows].sort(
    (a, b) =>
      Number(b.local_body_type === "Village Panchayat") -
      Number(a.local_body_type === "Village Panchayat"),
  )
  for (const r of ordered) {
    if (!r.village_code || !r.local_body_code) continue
    if (!districts.has(r.district_code))
      districts.set(r.district_code, {
        code: r.district_code,
        name: displayName(r.district_name),
        parent: "CG",
      })
    if (!blocks.has(r.block_code))
      blocks.set(r.block_code, {
        code: r.block_code,
        name: displayName(r.block_name),
        parent: r.district_code,
      })
    if (!panchayats.has(r.local_body_code))
      panchayats.set(r.local_body_code, {
        code: r.local_body_code,
        name: displayName(r.local_body_name),
        parent: r.block_code,
        type: r.local_body_type || "None",
      })
    if (!villages.has(r.village_code))
      villages.set(r.village_code, {
        code: r.village_code,
        name: displayName(r.village_name),
        parent: r.local_body_code,
      })
  }
  return {
    districts: [...districts.values()],
    blocks: [...blocks.values()],
    panchayats: [...panchayats.values()],
    villages: [...villages.values()],
  }
}

/** Hindi district names (LGD lists English only). */
export const districtHindi: Record<string, string> = {
  Balod: "बालोद",
  "Baloda Bazar": "बलौदाबाजार",
  Balrampur: "बलरामपुर",
  Bastar: "बस्तर",
  Bemetara: "बेमेतरा",
  Bijapur: "बीजापुर",
  Bilaspur: "बिलासपुर",
  Dantewada: "दंतेवाड़ा",
  Dhamtari: "धमतरी",
  Durg: "दुर्ग",
  Gariyaband: "गरियाबंद",
  "Gaurella Pendra Marwahi": "गौरेला-पेंड्रा-मरवाही",
  "Janjgir-Champa": "जांजगीर-चांपा",
  Jashpur: "जशपुर",
  Kabirdham: "कबीरधाम",
  Kanker: "कांकेर",
  "Khairgarh Chhuikhadan Gandai": "खैरागढ़-छुईखदान-गंडई",
  Kondagaon: "कोंडागांव",
  Korba: "कोरबा",
  Korea: "कोरिया",
  Mahasamund: "महासमुंद",
  "Manendragarh Chirimiri Bharatpur": "मनेंद्रगढ़-चिरमिरी-भरतपुर",
  "Mohla Manpur Ambagarh Chouki": "मोहला-मानपुर-अंबागढ़ चौकी",
  Mungeli: "मुंगेली",
  Narayanpur: "नारायणपुर",
  Raigarh: "रायगढ़",
  Raipur: "रायपुर",
  Rajnandgaon: "राजनांदगांव",
  Sakti: "सक्ती",
  "Sarangarh Bilaigarh": "सारंगढ़-बिलाईगढ़",
  Sukma: "सुकमा",
  Surajpur: "सूरजपुर",
  Surguja: "सरगुजा",
}
