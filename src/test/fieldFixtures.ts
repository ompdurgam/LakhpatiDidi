// Fake API payloads for the field app's Recommendations and DPR tabs.
export const surveyedFixture = {
  total: 1,
  items: [
    {
      code: "HH-BST-JGD-000123",
      name: "सुनीता कश्यप",
      initials: "सक",
      village: "बड़ांजी",
      income: 78500,
      status: "in_progress",
      statusLabel: "प्रगति पर",
      recommended: 2,
      topScheme: "PMMSY – तालाब",
      extraIncome: 37500,
      reachesTarget: true,
      applied: 0,
    },
  ],
}

const fit = {
  code: "PMMSY_POND",
  name: "PMMSY – तालाब",
  department: "मत्स्य विभाग",
  gain: 37500,
  score: 82,
  why: "PMMSY से तालाब बनाकर मत्स्य पालन शुरू कर सकती हैं",
  checks: [
    [true, "SHG सदस्य"],
    [false, "स्थल सत्यापन बाकी"],
  ],
  docs: ["आधार", "पासबुक"],
  office: "सहायक संचालक मत्स्य, जगदलपुर",
  subsidyPercent: 60,
  maxCost: 150000,
  maxSubsidy: 90000,
  dpr: null,
}

export const recommendationsFixture = {
  household: {
    code: "HH-BST-JGD-000123",
    name: "सुनीता कश्यप",
    initials: "सक",
    village: "बड़ांजी",
    income: 78500,
    status: "in_progress",
    statusLabel: "प्रगति पर",
    category: "ST",
    special: null,
    sources: [{ name: "फसल/खेती", net: 32000 }],
  },
  leverage: {
    current: 78500,
    target: 100000,
    extra: 37500,
    projected: 116000,
    reachesTarget: true,
    steps: [{ code: "PMMSY_POND", gain: 37500, name: "PMMSY – तालाब" }],
  },
  recommendations: [fit],
  entitlements: [],
  applied: [],
}

export const dprBoardFixture = {
  kpis: { didis: 1, todo: 1, draft: 0, filled: 0, sent: 0 },
  items: [
    {
      code: "HH-BST-JGD-000123",
      name: "सुनीता कश्यप",
      initials: "सक",
      village: "बड़ांजी",
      income: 78500,
      state: "todo",
      scheme: { code: "PMMSY_POND", name: "PMMSY – तालाब", department: "मत्स्य विभाग" },
      step: null,
      expectedGain: 37500,
      drafts: 0,
      filled: 0,
      sent: 0,
    },
  ],
}

export const dprFixture = {
  household: {
    code: "HH-BST-JGD-000123",
    name: "सुनीता कश्यप",
    initials: "सक",
    guardian: "राम कश्यप",
    mobile: "9800000412",
    category: "ST",
    special: null,
    village: "बड़ांजी",
    panchayat: "बड़ांजी GP",
    block: "जगदलपुर",
    district: "बस्तर",
    shg: "स्वावलंबी SHG",
    vo: "शक्ति VO",
    income: 78500,
  },
  scheme: {
    code: "PMMSY_POND",
    name: "PMMSY – तालाब",
    department: "मत्स्य विभाग",
    subsidyPercent: 60,
    maxCost: 150000,
    slaDays: 15,
    office: "सहायक संचालक मत्स्य, जगदलपुर",
  },
  fit: { score: 82, why: fit.why, checks: fit.checks, docs: fit.docs, gain: 37500 },
  economics: {
    income: 78500,
    gain: 37500,
    projected: 116000,
    reachesTarget: true,
    paybackMonths: 16,
    monthlyLoan: 1000,
  },
  money: { total: 120000, subsidy: 72000, bank: 36000, own: 12000 },
  draft: {
    status: "new",
    step: 1,
    items: [
      { item: "तालाब तैयारी", quantity: "1", amount: 30000 },
      { item: "फिंगरलिंग बीज", quantity: "5,000", amount: 25000 },
      { item: "मछली आहार", quantity: "12 माह", amount: 40000 },
      { item: "जाल और उपकरण", quantity: "1 सेट", amount: 25000 },
    ],
    remarks: "",
    documents: [],
  },
  application: null,
}
