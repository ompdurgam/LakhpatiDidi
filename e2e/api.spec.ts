import { type APIRequestContext, expect, test } from "@playwright/test"

// Contract tests for the REST API against the seeded test database.
// They run in order because later checks depend on earlier writes.
test.describe.configure({ mode: "serial" })

const BLOCK_MANAGER = "9826143412"

async function signIn(request: APIRequestContext, mobile = BLOCK_MANAGER) {
  const otp = await (await request.post("/api/auth/otp", { data: { mobile } })).json()
  const verified = await request.post("/api/auth/verify", { data: { mobile, otp: otp.devOtp } })
  expect(verified.ok()).toBe(true)
  return { Authorization: `Bearer ${(await verified.json()).token}` }
}

let headers: Record<string, string>
const post = (request: APIRequestContext, url: string, data: unknown) =>
  request.post(url, { headers, data })

test.describe("auth", () => {
  test("rejects unknown and locked numbers", async ({ request }) => {
    const unknown = await request.post("/api/auth/otp", { data: { mobile: "9111111111" } })
    expect(unknown.status()).toBe(404)
    const locked = await request.post("/api/auth/otp", { data: { mobile: "9752300099" } })
    expect(locked.status()).toBe(403)
    const invalid = await request.post("/api/auth/otp", { data: { mobile: "12345" } })
    expect(invalid.status()).toBe(400)
  })

  test("counts wrong OTP attempts", async ({ request }) => {
    await request.post("/api/auth/otp", { data: { mobile: BLOCK_MANAGER } })
    const wrong = await request.post("/api/auth/verify", {
      data: { mobile: BLOCK_MANAGER, otp: "000000" },
    })
    expect(wrong.status()).toBe(401)
    expect((await wrong.json()).error).toContain("4 प्रयास शेष")
  })

  test("requires a session for data", async ({ request }) => {
    expect((await request.get("/api/applications")).status()).toBe(401)
    headers = await signIn(request)
    const me = await (await request.get("/api/auth/me", { headers })).json()
    expect(me.user.name).toBe("अनिल कश्यप")
  })
})

test.describe("applications", () => {
  test("lists and details", async ({ request }) => {
    // A block manager sees only her own block's applications (15 of the 20 in the fixtures).
    const list = await (await request.get("/api/applications", { headers })).json()
    expect(list).toHaveLength(15)
    for (const app of list) expect(app.block).toBe("जगदलपुर")
    const detail = await (await request.get("/api/applications/APP-260142", { headers })).json()
    expect(detail).toMatchObject({
      status: "अतिदेय",
      escalation: "कलेक्टर",
      projectedIncome: 116000,
    })
    expect(detail.timeline).toHaveLength(6)
    expect((await request.get("/api/applications/APP-0", { headers })).status()).toBe(404)
  })

  test("sanction → deliver with validation", async ({ request }) => {
    const url = "/api/applications/APP-260174/actions"
    const tooHigh = await post(request, url, {
      action: "sanction",
      orderNo: "F/1",
      date: "2026-11-05",
      amount: 999999,
    })
    expect(tooHigh.status()).toBe(400)
    const ok = await post(request, url, {
      action: "sanction",
      orderNo: "FISH/JGD/2026/284",
      date: "2026-11-05",
      amount: "40,800",
    })
    expect((await ok.json()).message).toBe("स्वीकृति आदेश दर्ज हुआ")
    const again = await post(request, url, {
      action: "sanction",
      orderNo: "x",
      date: "2026-11-05",
      amount: 1,
    })
    expect(again.status()).toBe(409)
    const delivered = await post(request, url, {
      action: "deliver",
      date: "2026-11-05",
      asset: "नाव + जाल",
      lat: 19.07,
      lng: 82.0,
    })
    expect(delivered.ok()).toBe(true)
    const detail = await (await request.get("/api/applications/APP-260174", { headers })).json()
    expect(detail.statusCode).toBe("delivered")
    expect(detail.delivery.asset).toBe("नाव + जाल")
  })

  test("enforces the workflow", async ({ request }) => {
    const deliver = await post(request, "/api/applications/APP-260119/actions", {
      action: "deliver",
      date: "2026-11-05",
      asset: "x",
    })
    expect(deliver.status()).toBe(409)
    const reject = await post(request, "/api/applications/APP-260119/actions", {
      action: "reject",
      reason: "दस्तावेज़ अपूर्ण",
    })
    expect(reject.ok()).toBe(true)
    const unknown = await post(request, "/api/applications/APP-260119/actions", {
      action: "approve",
    })
    expect(unknown.status()).toBe(400)
  })

  test("escalates step by step", async ({ request }) => {
    const url = "/api/applications/APP-260138/actions"
    expect((await (await post(request, url, { action: "escalate" })).json()).message).toContain(
      "BDO",
    )
    expect((await (await post(request, url, { action: "escalate" })).json()).message).toContain(
      "DPM",
    )
  })

  test("bulk sanction skips closed applications", async ({ request }) => {
    const res = await post(request, "/api/applications/bulk-sanction", {
      codes: ["APP-260181", "APP-260119", "APP-260190"],
    })
    expect(await res.json()).toEqual({
      sanctioned: ["APP-260181", "APP-260190"],
      skipped: ["APP-260119"],
    })
  })

  test("comments", async ({ request }) => {
    expect(
      (await post(request, "/api/applications/APP-260142/comments", { body: "  " })).status(),
    ).toBe(400)
    expect(
      (
        await post(request, "/api/applications/APP-260142/comments", { body: "पट्टा अपलोड" })
      ).status(),
    ).toBe(201)
    const detail = await (await request.get("/api/applications/APP-260142", { headers })).json()
    expect(detail.comments.at(-1).body).toBe("पट्टा अपलोड")
  })
})

test.describe("households & surveys", () => {
  const survey = (overrides: Record<string, string> = {}, gross = 50000) => ({
    responses: {
      "SHG सदस्य का नाम": "रीना मंडावी",
      "मोबाइल (10 अंक)": "9876500011",
      गाँव: "नानगुर",
      ...overrides,
    },
    incomeEntries: [
      { name: "फसल/खेती", months: ["Jun"], gross, cost: 8000 },
      { name: "पशुपालन", months: [], gross: 20000, cost: 3000 },
    ],
  })

  test("creates then updates a household by mobile", async ({ request }) => {
    const created = await (await post(request, "/api/surveys", survey())).json()
    expect(created).toMatchObject({ hhCode: "HH-BST-JGD-000124", created: true })
    const updated = await (await post(request, "/api/surveys", survey({}, 90000))).json()
    expect(updated).toMatchObject({ hhCode: "HH-BST-JGD-000124", created: false })
    const households = await (await request.get("/api/households", { headers })).json()
    expect(households.find((h: { id: string }) => h.id === "HH-BST-JGD-000124")).toMatchObject({
      income: 99000,
      sources: 2,
      status: "थ्रेशोल्ड",
    })
  })

  test("validates survey fields", async ({ request }) => {
    expect((await post(request, "/api/surveys", survey({ गाँव: "दिल्ली" }))).status()).toBe(400)
    expect(
      (await post(request, "/api/surveys", survey({ "मोबाइल (10 अंक)": "123" }))).status(),
    ).toBe(400)
    expect((await post(request, "/api/surveys", { responses: {} })).status()).toBe(400)
  })

  test("logs bulk household actions", async ({ request }) => {
    const res = await post(request, "/api/households/bulk", {
      codes: ["HH-BST-JGD-000123"],
      action: "reminder",
    })
    expect((await res.json()).message).toBe("1 परिवार: रिमाइंडर भेजा गया")
    expect(
      (await post(request, "/api/households/bulk", { codes: [], action: "reminder" })).status(),
    ).toBe(400)
  })
})

test.describe("admin", () => {
  test("users", async ({ request }) => {
    const user = { name: "नई CRP", mobile: "9876543210", role: "field", block: "JGD" }
    // Full contact details are for admins only.
    expect((await request.get("/api/users", { headers })).status()).toBe(403)
    expect((await post(request, "/api/users", user)).status()).toBe(403)

    const admin = await signIn(request, "9993000001")
    const asAdmin = (data: unknown) => request.post("/api/users", { headers: admin, data })
    const list = await (await request.get("/api/users", { headers: admin })).json()
    expect(list.find((u: { name: string }) => u.name === "गीता नेताम")).toMatchObject({
      mobile: "9752314412",
      role: "field",
      block: "जगदलपुर",
    })
    expect((await asAdmin(user)).status()).toBe(201)
    expect((await asAdmin(user)).status()).toBe(409)
    expect((await asAdmin({ ...user, mobile: "9876543211", role: "boss" })).status()).toBe(400)
    const self = list.find((u: { mobile: string }) => u.mobile === "9993000001")
    const lockSelf = await request.patch(`/api/users/${self.id}`, {
      headers: admin,
      data: { status: "locked" },
    })
    expect(lockSelf.status()).toBe(400)
    const lock = await request.patch("/api/users/2", { headers: admin, data: { status: "locked" } })
    expect((await lock.json()).message).toBe("गीता नेताम लॉक किया गया")
    await request.patch("/api/users/2", { headers: admin, data: { status: "active" } })
  })

  test("survey sections keep A on", async ({ request }) => {
    expect(
      (
        await request.patch("/api/survey-sections/A", { headers, data: { enabled: false } })
      ).status(),
    ).toBe(400)
    const off = await request.patch("/api/survey-sections/J", { headers, data: { enabled: false } })
    expect((await off.json()).message).toBe("J पर्यटन सेक्शन बंद किया")
  })

  test("audit log records the changes", async ({ request }) => {
    const log = await (await request.get("/api/audit-logs", { headers })).json()
    const actions = log.map((entry: { action: string }) => entry.action)
    for (const action of [
      "लॉगिन",
      "आवेदन कार्यवाही",
      "सामूहिक स्वीकृति",
      "सर्वे जमा",
      "यूज़र स्थिति",
      "फॉर्म सेटिंग",
    ]) {
      expect(actions).toContain(action)
    }
  })

  test("unknown endpoints return 404 JSON", async ({ request }) => {
    const res = await request.get("/api/nope", { headers })
    expect(res.status()).toBe(404)
    expect((await res.json()).error).toBeTruthy()
  })
})

test.describe("language", () => {
  test("answers in English when asked", async ({ request }) => {
    const english = { ...headers, "Accept-Language": "en" }
    const res = await request.get("/api/applications/APP-NOPE", { headers: english })
    expect(res.status()).toBe(404)
    expect((await res.json()).error).toBe("Application not found")
    const hindi = await request.get("/api/applications/APP-NOPE", { headers })
    expect((await hindi.json()).error).toBe("आवेदन नहीं मिला")
  })
})

test.describe("meta", () => {
  test("lists only places with data (not the whole LGD directory)", async ({ request }) => {
    const meta = await (await request.get("/api/meta", { headers })).json()
    expect(meta.villages.length).toBeLessThan(100)
    const households = await (await request.get("/api/households", { headers })).json()
    const surveyed = new Set(households.map((h: { village: string }) => h.village))
    for (const village of meta.villages) expect(surveyed).toContain(village.name)
    // Admins can still assign users to any block; filters use the active ones.
    expect(meta.blocks.some((b: { active: boolean }) => b.active)).toBe(true)
    expect(meta.blocks.every((b: { active: unknown }) => typeof b.active === "boolean")).toBe(true)
  })
})

test.describe("geography", () => {
  test("walks state → district with a breadcrumb and rolled-up counts", async ({ request }) => {
    const state = await (await request.get("/api/geo/areas/state/CG", { headers })).json()
    expect(state.path).toHaveLength(1)
    expect(state.childLevel).toBe("district")
    expect(state.children.length).toBeGreaterThan(0)
    const total = state.children.reduce(
      (n: number, c: { households: number }) => n + c.households,
      0,
    )
    expect(total).toBeGreaterThan(0)
    expect(state.boundaries.type).toBe("FeatureCollection")
  })

  test("rejects bad levels and unknown codes", async ({ request }) => {
    expect((await request.get("/api/geo/areas/planet/1", { headers })).status()).toBe(400)
    expect((await request.get("/api/geo/areas/district/000000", { headers })).status()).toBe(404)
    expect((await request.get("/api/geo/areas/state/CG", {})).status()).toBe(401)
  })
})

test.describe("didi (PLD) profile", () => {
  const SUNITA = "9826100123" // HH-BST-JGD-000123, seeded household

  test("a Didi sees only her own household", async ({ request }) => {
    const didi = await signIn(request, SUNITA)
    const me = await request.get("/api/didi/me", { headers: didi })
    expect(me.status()).toBe(200)
    const data = await me.json()
    expect(data.profile.code).toBe("HH-BST-JGD-000123")
    expect(data.profile.mobile).toBe(SUNITA)
    expect(data.meter.target).toBe(100000)
    expect(data.meter.income).toBeGreaterThan(0)
    // Her to-do list is worked out from her data, with a consistent progress count.
    expect(data.tasks.total).toBe(data.tasks.items.length)
    expect(data.tasks.done).toBe(data.tasks.items.filter((t: { done: boolean }) => t.done).length)
    expect(data.tasks.items.map((t: { kind: string }) => t.kind)).toContain("lakhpati")
    // Every application listed belongs to her household.
    for (const app of data.applications) expect(app.hhCode).toBe("HH-BST-JGD-000123")
  })

  test("a Didi cannot read staff data", async ({ request }) => {
    const didi = await signIn(request, SUNITA)
    for (const url of [
      "/api/applications",
      "/api/households",
      "/api/meta",
      "/api/users",
      "/api/geo/areas/state/CG",
    ]) {
      expect((await request.get(url, { headers: didi })).status(), url).toBe(403)
    }
    // …but can still check her session.
    expect((await request.get("/api/auth/me", { headers: didi })).status()).toBe(200)
  })

  test("staff numbers have no Didi profile", async ({ request }) => {
    const res = await request.get("/api/didi/me", { headers })
    expect(res.status()).toBe(404)
  })

  test("surveying a new Didi gives her a login", async ({ request }) => {
    const mobile = "9988776655"
    const survey = await request.post("/api/surveys", {
      headers,
      data: {
        responses: {
          "SHG सदस्य का नाम": "नयी दीदी",
          "मोबाइल (10 अंक)": mobile,
          गाँव: "बड़ांजी",
        },
        incomeEntries: [{ name: "फसल/खेती", months: ["Jun"], gross: 90000, cost: 10000 }],
        sections: ["A"],
      },
    })
    expect(survey.status()).toBe(201)
    const didi = await signIn(request, mobile)
    const me = await (await request.get("/api/didi/me", { headers: didi })).json()
    expect(me.profile.mobile).toBe(mobile)
    expect(me.meter.income).toBe(80000)
  })
})

test.describe("user scope", () => {
  test("login returns the user's own district and block", async ({ request }) => {
    const mobile = BLOCK_MANAGER
    const otp = await (await request.post("/api/auth/otp", { data: { mobile } })).json()
    const verified = await (
      await request.post("/api/auth/verify", { data: { mobile, otp: otp.devOtp } })
    ).json()
    expect(verified.user.scope.blockEn).toBe("Jagdalpur")
    expect(verified.user.scope.districtEn).toBe("Bastar")
    // State-level accounts are not bound to a district.
    const state = "9993000101"
    const stateOtp = await (await request.post("/api/auth/otp", { data: { mobile: state } })).json()
    const stateUser = await (
      await request.post("/api/auth/verify", { data: { mobile: state, otp: stateOtp.devOtp } })
    ).json()
    expect(stateUser.user.scope.districtEn).toBeNull()
  })
})

test.describe("recommendations and DPR", () => {
  const FILLED = "HH-BST-JGD-000089" // demo DPR already filled (PMMSY_POND)

  test("lists surveyed Didis and gives each personalised schemes", async ({ request }) => {
    const list = await (await request.get("/api/recommendations", { headers })).json()
    expect(list.total).toBeGreaterThan(5)
    const first = await (
      await request.get(`/api/recommendations/${list.items[0].code}`, { headers })
    ).json()
    expect(first.recommendations.length).toBeGreaterThan(0)
    expect(first.leverage.projected).toBeGreaterThanOrEqual(first.leverage.current)
    // Different Didis get different lists.
    const other = list.items.find(
      (i: { topScheme: string }) => i.topScheme !== list.items[0].topScheme,
    )
    expect(other).toBeTruthy()
    expect((await request.get("/api/recommendations/HH-NOPE", { headers })).status()).toBe(404)
  })

  test("English mode returns English scheme text", async ({ request }) => {
    const res = await request.get(`/api/recommendations/${FILLED}`, {
      headers: { ...headers, "Accept-Language": "en" },
    })
    const body = await res.json()
    expect(JSON.stringify(body.recommendations)).not.toMatch(/[ऀ-ॿ]/)
  })

  test("DPR board shows KPIs; save → send creates one application", async ({ request }) => {
    const before = (await (await request.get("/api/dpr", { headers })).json()).kpis
    expect(before.filled).toBeGreaterThan(0)

    const dpr = await (await request.get(`/api/dpr/${FILLED}/PMMSY_POND`, { headers })).json()
    expect(dpr.draft.status).toBe("filled")
    expect(dpr.money.total).toBe(
      dpr.draft.items.reduce((s: number, i: { amount: number }) => s + i.amount, 0),
    )

    const bad = await request.put(`/api/dpr/${FILLED}/PMMSY_POND`, {
      headers,
      data: { step: 7, items: [], remarks: "", documents: [] },
    })
    expect(bad.status()).toBe(400)

    const saved = await request.put(`/api/dpr/${FILLED}/PMMSY_POND`, {
      headers,
      data: { step: 7, items: dpr.draft.items, remarks: "ok", documents: dpr.draft.documents },
    })
    expect(saved.ok()).toBe(true)

    const sent = await post(request, `/api/dpr/${FILLED}/PMMSY_POND/send`, {})
    expect(sent.status()).toBe(201)
    expect((await sent.json()).applicationCode).toMatch(/^APP-\d+$/)

    // Sending twice, or editing after sending, is refused.
    expect((await post(request, `/api/dpr/${FILLED}/PMMSY_POND/send`, {})).status()).toBe(409)
    const edit = await request.put(`/api/dpr/${FILLED}/PMMSY_POND`, {
      headers,
      data: { step: 7, items: dpr.draft.items, remarks: "", documents: [] },
    })
    expect(edit.status()).toBe(409)

    const after = (await (await request.get("/api/dpr", { headers })).json()).kpis
    expect(after.filled).toBe(before.filled - 1)
    expect(after.sent).toBe(before.sent + 1)
  })

  test("a draft that is not finished cannot be sent", async ({ request }) => {
    const res = await post(request, "/api/dpr/HH-BST-JGD-000108/AH_GOAT/send", {})
    expect(res.status()).toBe(400)
  })
})
