// Starts an isolated stack for Playwright: a fresh `lakhpati_didi_test`
// database, the API on :4100 and Vite on :5273 (dev data is never touched).
import { spawn, spawnSync } from "node:child_process"

const env = {
  ...process.env,
  DB_NAME: process.env.E2E_DB_NAME ?? "lakhpati_didi_test",
  API_PORT: "4100",
  VITE_PORT: "5273",
  OTP_DEV_MODE: "true",
}
const node = process.execPath
const run = (args) => spawn(node, args, { env, stdio: "inherit" })

const reset = spawnSync(node, ["--env-file-if-exists=.env", "server/db/migrate.ts", "reset"], {
  env,
  stdio: "inherit",
})
if (reset.status !== 0) process.exit(reset.status ?? 1)

// --env-file values never override variables that are already set, so the test overrides win.
const children = [
  run(["--env-file-if-exists=.env", "server/index.ts"]),
  run(["node_modules/vite/bin/vite.js", "--port", "5273", "--strictPort"]),
]
const stop = () => {
  for (const child of children) child.kill()
  process.exit(0)
}
process.on("SIGINT", stop)
process.on("SIGTERM", stop)
for (const child of children) child.on("exit", (code) => code && stop())
