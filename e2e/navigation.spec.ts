import { expect, type Page, test } from "@playwright/test"

// Logs in through the real OTP flow (OTP_DEV_MODE shows the code on screen).
// Each test uses its own demo user: the API allows 5 OTPs per number per 15 min.
async function login(page: Page, roleLabel: string, mobile: string) {
  await page.goto("/login")
  // A fresh browser is asked for its language first.
  await page.locator(".language-chooser button[lang=hi]").click()
  // Role → mobile → OTP.
  await page.locator(".role-card-grid button", { hasText: roleLabel }).click()
  await page.locator(".login-field input").fill(mobile)
  await page.getByRole("button", { name: /OTP भेजें/ }).click()
  const otp = (await page.locator(".dev-otp-hint b").textContent())!.trim()
  const boxes = page.locator(".otp-boxes input")
  for (let i = 0; i < 6; i++) await boxes.nth(i).fill(otp[i])
  // Wait for the sign-in to finish (session saved) before the test navigates away.
  await page.waitForURL((url) => url.pathname !== "/login")
}

async function switchRole(page: Page, role: string) {
  await page.locator(".role-switcher select").selectOption(role)
}

test("login lands on the block overview", async ({ page }) => {
  await login(page, "ब्लॉक", "9752314412")
  await expect(page).toHaveURL(/\/block$/)
  await expect(page.locator(".kpi-grid")).toBeVisible()
  await expect(page.locator("header h1")).toHaveText("ब्लॉक अवलोकन")
})

test("every role's screens are reachable by URL", async ({ page }) => {
  await login(page, "ब्लॉक", "9425118881")
  const visits: [string, string, string][] = [
    ["block", "/block/households", ".household-register-table"],
    ["block", "/block/applications", ".applications-card"],
    ["field", "/field/survey", ".survey-form"],
    ["field", "/field/recommendations", ".field-list-page"],
    ["department", "/dept/AH", ".department-inbox"],
    ["district", "/district", ".page"],
    ["state", "/state/certification", ".page"],
    ["admin", "/admin/audit", ".audit-log"],
  ]
  for (const [role, path, selector] of visits) {
    await switchRole(page, role)
    await page.goto(path)
    await expect(page).toHaveURL(new RegExp(`${path}$`))
    await expect(page.locator(selector).first()).toBeVisible()
  }
})

test("department inbox opens an application by URL and closes back", async ({ page }) => {
  await login(page, "विभाग", "9301245176")
  await page.goto("/dept/FISH/applications/APP-260142")
  await expect(page.locator(".drawer h2")).toHaveText("APP-260142")
  await page.locator(".drawer-head .icon-button").click()
  await expect(page).toHaveURL(/\/dept\/FISH$/)
})

test("language toggle switches the shell to English", async ({ page }) => {
  await login(page, "ब्लॉक", "9993000001")
  await page.locator("header .lang-menu-button").click()
  await page.getByRole("menuitemradio", { name: "English" }).click()
  await expect(page.locator("header h1")).toHaveText("Block Overview")
  await expect(page).toHaveTitle(/Lakhpati Convergence Portal/)
  await expect(page.locator("nav a", { hasText: "Households" })).toBeVisible()
  await page.locator("header .lang-menu-button").click()
  await page.getByRole("menuitemradio", { name: "हिन्दी" }).click()
  await expect(page.locator("html")).toHaveAttribute("lang", "hi")
})
