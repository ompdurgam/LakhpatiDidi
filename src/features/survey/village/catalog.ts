// The village profile's items (survey sections D3–D5 and resources).

export const COMMUNITY_FACILITIES = [
  "आंगनवाड़ी भवन",
  "स्वास्थ्य केंद्र 3 किमी में",
  "पशु चिकित्सा केंद्र",
  "राशन दुकान",
  "प्राथमिक विद्यालय",
  "खेल मैदान",
  "बारहमासी सड़क",
  "पुलिया",
  "ग्रिड बिजली",
  "इंटरनेट/नेटवर्क",
  "डाकघर 3 किमी",
  "बैंक शाखा 3 किमी",
  "पंचायत भवन",
  "CSC",
  "सामुदायिक भवन",
]

export const LIVELIHOOD_INFRA = [
  "प्रशिक्षण केंद्र",
  "SHG कार्यशेड",
  "CLF भवन",
  "शी मार्ट",
  "मशरूम शेड",
  "कारीगर शेड",
  "रेशम शेड",
  "ग्रामीण हाट",
  "खाद्यान्न भंडारण",
  "कोल्ड स्टोरेज",
  "धान सुखाने का प्लेटफॉर्म",
  "वर्मी/NADEP",
  "दुग्ध संकलन केंद्र",
]

export const INSTITUTIONS = [
  "SHG",
  "VO",
  "CLF",
  "उत्पादक समूह",
  "FPO",
  "वन धन केंद्र (VDVK)",
  "PACS/LAMPS",
  "दुग्ध समिति",
  "मत्स्य समिति",
  "JFMC/FRC",
  "तेंदूपत्ता समिति",
  "कस्टम हायरिंग सेंटर",
  "बैंक सखी",
  "कृषि/पशु/मत्स्य सखी",
  "VLE",
]

export const RESOURCES = ["वन क्षेत्र", "CFR पट्टा", "नदी/नहर", "पर्यटन स्थल"]

export type Answer = Record<string, string | number>

export type VillageResponses = {
  facilities: Record<string, Answer>
  institutions: Record<string, Answer>
  needs: string[]
  resources: Answer
}

export const emptyResponses = (): VillageResponses => ({
  facilities: {},
  institutions: {},
  needs: [],
  resources: {},
})

/** Answered / total items, per section and overall. */
export function completion(r: VillageResponses) {
  const facilities = [...COMMUNITY_FACILITIES, ...LIVELIHOOD_INFRA]
  const d3 = COMMUNITY_FACILITIES.filter((f) => r.facilities[f]?.available).length
  const d4 = LIVELIHOOD_INFRA.filter((f) => r.facilities[f]?.available).length
  const d5 = INSTITUTIONS.filter((i) => r.institutions[i]?.exists).length
  const res = RESOURCES.filter((x) => r.resources[x]).length
  const total = facilities.length + INSTITUTIONS.length + RESOURCES.length
  const done = d3 + d4 + d5 + res
  return {
    d3,
    d4,
    d5,
    done,
    total,
    pct: Math.round((done / total) * 100),
  }
}
