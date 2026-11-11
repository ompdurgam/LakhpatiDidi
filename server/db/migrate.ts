// Minimal SQL migration runner.
//   node server/db/migrate.ts migrate    apply pending migrations
//   node server/db/migrate.ts rollback   undo the most recent migration
//   node server/db/migrate.ts reset      drop the database and migrate (empty, no demo data)
//   node server/db/migrate.ts status     list applied / pending migrations
//   node server/db/migrate.ts admin <mobile> [name]   add an admin login to an empty install
//   node server/db/migrate.ts fixtures   load e2e/fixtures/*.sql (test databases only)
import mysql from "mysql2/promise"
import fs from "node:fs"
import path from "node:path"

import { config } from "../config.ts"
import { mobile } from "../shared/validation.ts"
import { STRICT_SQL_MODE } from "./pool.ts"

const projectRoot = path.resolve(import.meta.dirname, "..", "..")
const migrationsDir = path.join(projectRoot, "database", "migrations")
const fixturesDir = path.join(projectRoot, "e2e", "fixtures")
const { database, ...server } = config.db

function sqlFiles(dir: string) {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
}

function splitMigration(file: string) {
  const text = fs.readFileSync(path.join(migrationsDir, file), "utf8")
  const [, afterUp = ""] = text.split(/^--\s*migrate:up\s*$/m)
  const [up, down = ""] = afterUp.split(/^--\s*migrate:down\s*$/m)
  if (!up.trim()) throw new Error(`${file}: missing "-- migrate:up" section`)
  return { up, down }
}

async function connect(withDatabase = true) {
  const conn = await mysql.createConnection({
    ...server,
    ...(withDatabase ? { database } : {}),
    charset: "utf8mb4_unicode_ci",
    multipleStatements: true,
  })
  await conn.query(`SET SESSION sql_mode = '${STRICT_SQL_MODE}'`)
  return conn
}

async function ensureDatabase() {
  const conn = await connect(false)
  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  )
  await conn.end()
  const db = await connect()
  await db.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version    VARCHAR(255) NOT NULL PRIMARY KEY,
    applied_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB`)
  return db
}

async function applied(db: mysql.Connection) {
  const [rows] = await db.query<mysql.RowDataPacket[]>(
    "SELECT version FROM schema_migrations ORDER BY version",
  )
  return rows.map((r) => r.version as string)
}

async function migrate() {
  const db = await ensureDatabase()
  const done = new Set(await applied(db))
  const pending = sqlFiles(migrationsDir).filter((f) => !done.has(f))
  if (!pending.length) console.log("✓ Database is up to date")
  for (const file of pending) {
    const { up } = splitMigration(file)
    // DDL auto-commits in MySQL, so a failure midway leaves earlier
    // statements applied; the file is only recorded once it fully succeeds.
    await db.query(up)
    await db.query("INSERT INTO schema_migrations (version) VALUES (?)", [file])
    console.log(`↑ ${file}`)
  }
  await db.end()
}

async function rollback() {
  const db = await ensureDatabase()
  const last = (await applied(db)).pop()
  if (!last) {
    console.log("Nothing to roll back")
  } else {
    const { down } = splitMigration(last)
    if (down.trim()) {
      await db.query("SET FOREIGN_KEY_CHECKS = 0")
      await db.query(down)
      await db.query("SET FOREIGN_KEY_CHECKS = 1")
    }
    await db.query("DELETE FROM schema_migrations WHERE version = ?", [last])
    console.log(`↓ ${last}`)
  }
  await db.end()
}

// Demo records (Bastar households, applications, logins) exist only for the
// e2e suite, so they can never be loaded into a dev or production database.
async function fixtures() {
  if (!database.endsWith("_test")) {
    throw new Error(`refusing to load e2e fixtures into "${database}" (name must end in _test)`)
  }
  const db = await connect()
  for (const file of sqlFiles(fixturesDir)) {
    await db.query("START TRANSACTION")
    await db.query(fs.readFileSync(path.join(fixturesDir, file), "utf8"))
    await db.query("COMMIT")
    console.log(`● loaded ${file}`)
  }
  await db.end()
}

async function admin() {
  const parsed = mobile.safeParse(process.argv[3])
  if (!parsed.success) throw new Error("usage: admin <10-digit mobile> [name]")
  const name = process.argv[4] ?? "State Admin"
  const db = await connect()
  await db.query(
    "INSERT INTO master_users (name, mobile, role, designation) VALUES (?, ?, 'admin', 'Administrator')",
    [name, parsed.data],
  )
  await db.end()
  console.log(`✓ admin ${name} can now log in with ${parsed.data}`)
}

async function reset() {
  const conn = await connect(false)
  await conn.query(`DROP DATABASE IF EXISTS \`${database}\``)
  await conn.end()
  console.log(`✗ dropped ${database}`)
  await migrate()
}

async function status() {
  const db = await ensureDatabase()
  const done = new Set(await applied(db))
  for (const file of sqlFiles(migrationsDir)) console.log(`${done.has(file) ? "✓" : "·"} ${file}`)
  await db.end()
}

const commands: Record<string, () => Promise<void>> = {
  migrate,
  rollback,
  reset,
  status,
  admin,
  fixtures,
}
const command = process.argv[2] ?? "migrate"
if (!commands[command]) {
  console.error(`Unknown command "${command}". Use: ${Object.keys(commands).join(", ")}`)
  process.exit(1)
}
commands[command]()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`✗ ${command} failed:`, error.sqlMessage ?? error.message)
    process.exit(1)
  })
