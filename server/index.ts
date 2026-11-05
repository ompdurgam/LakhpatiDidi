// API entry point: builds the app, listens, shuts down cleanly.
import { createApp } from "./app.ts"
import { config } from "./config.ts"
import { pool } from "./db/pool.ts"

const server = createApp().listen(config.port, () => {
  console.log(`API ready on http://localhost:${config.port}`)
})

const shutdown = () => server.close(() => pool.end().then(() => process.exit(0)))
process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)
