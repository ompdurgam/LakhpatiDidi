// API entry point: builds the app, listens, shuts down cleanly.
import { createApp } from "./app.ts"
import { config } from "./config.ts"
import { pool } from "./db/pool.ts"
import { villageStats } from "./modules/monitoring/monitoring.area.ts"
import { startNotificationWorker } from "./modules/notifications/notifications.worker.ts"

const server = createApp().listen(config.port, () => {
  console.log(`API ready on http://localhost:${config.port}`)
  // Load the dashboard figures now, so the first person to open a dashboard does not wait.
  villageStats().catch(() => undefined)
})
const stopWorker = startNotificationWorker()

const shutdown = () => {
  stopWorker()
  server.close(() => pool.end().then(() => process.exit(0)))
}
process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)
