// Line departments (codes match master_departments.code in MySQL).

export type Department = { code: string; name: { hi: string; en: string } }

export const departments: Department[] = [
  { code: "FISH", name: { hi: "मत्स्य विभाग", en: "Fisheries" } },
  { code: "AGRI", name: { hi: "कृषि विभाग", en: "Agriculture" } },
  { code: "HORTI", name: { hi: "उद्यानिकी विभाग", en: "Horticulture" } },
  { code: "AH", name: { hi: "पशुपालन विभाग", en: "Animal Husbandry" } },
  { code: "FOREST", name: { hi: "वन / CGMFP", en: "Forest / CGMFP" } },
  { code: "WCD", name: { hi: "महिला एवं बाल विकास", en: "Women & Child Development" } },
  { code: "LABOUR", name: { hi: "श्रम विभाग", en: "Labour" } },
  { code: "DTIC", name: { hi: "DTIC / उद्योग", en: "DTIC / Industries" } },
  { code: "SERI", name: { hi: "रेशम विभाग", en: "Sericulture" } },
  { code: "HANDLOOM", name: { hi: "हथकरघा विभाग", en: "Handloom" } },
  { code: "TOURISM", name: { hi: "पर्यटन विभाग", en: "Tourism" } },
  { code: "BANK", name: { hi: "संस्थागत वित्त/बैंक", en: "Institutional Finance / Banks" } },
  {
    code: "ANTYA",
    name: { hi: "अंत्यावसायी सहकारी विकास समिति", en: "Antyavasayi Cooperative Society" },
  },
  { code: "PRD", name: { hi: "पंचायत एवं ग्रामीण विकास", en: "Panchayat & Rural Development" } },
]

export const departmentByCode = (code: string | undefined) =>
  departments.find((d) => d.code === code?.toUpperCase())

export const departmentByHindiName = (name: string) => departments.find((d) => d.name.hi === name)
