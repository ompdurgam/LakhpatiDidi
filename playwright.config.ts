import { defineConfig, devices } from "@playwright/test"

// e2e runs against the real stack (Vite + API + MySQL) using a separate,
// freshly seeded database `lakhpati_didi_test`; your dev data is untouched.
// Prerequisite: MySQL running.
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:5273",
    trace: "retain-on-failure",
    // Uses the installed Chrome; run `npx playwright install chromium` to use the bundled one instead.
    channel: process.env.PW_CHANNEL ?? "chrome",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } },
    },
  ],
  webServer: {
    command: "node scripts/e2e-server.mjs",
    url: "http://localhost:5273/api/health",
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
