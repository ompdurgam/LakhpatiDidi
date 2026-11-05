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
    const list = await (await request.get("/api/applications", { headers })).json()
    expect(list).toHaveLength(20)
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
    expect((await post(request, "/api/users", user)).status()).toBe(201)
    expect((await post(request, "/api/users", user)).status()).toBe(409)
    expect(
      (await post(request, "/api/users", { ...user, mobile: "9876543211", role: "boss" })).status(),
    ).toBe(400)
    const self = await request.patch("/api/users/1", { headers, data: { status: "locked" } })
    expect(self.status()).toBe(400)
    const lock = await request.patch("/api/users/2", { headers, data: { status: "locked" } })
    expect((await lock.json()).message).toBe("गीता नेताम लॉक किया गया")
    await request.patch("/api/users/2", { headers, data: { status: "active" } })
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
