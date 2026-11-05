import type { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise"
import mysql from "mysql2/promise"

import { config } from "../config.ts"

export const STRICT_SQL_MODE =
  "STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION"

export const pool: Pool = mysql.createPool({
  ...config.db,
  charset: "utf8mb4_unicode_ci",
  connectionLimit: 10,
  dateStrings: true,
  decimalNumbers: true,
  timezone: "+05:30",
})

// Enforce strict SQL on every pooled connection (XAMPP defaults to non-strict).
pool.on("connection", (conn) => {
  conn.query(`SET SESSION sql_mode = '${STRICT_SQL_MODE}'`)
  conn.query("SET time_zone = '+05:30'")
})

/** Either the pool or a transaction connection. */
export type Db = Pool | PoolConnection

export async function query<T = RowDataPacket>(
  sql: string,
  params: unknown[] = [],
  db: Db = pool,
): Promise<T[]> {
  const [rows] = await db.query<RowDataPacket[]>(sql, params)
  return rows as T[]
}

export async function one<T = RowDataPacket>(
  sql: string,
  params: unknown[] = [],
  db: Db = pool,
): Promise<T | undefined> {
  return (await query<T>(sql, params, db))[0]
}

export async function exec(
  sql: string,
  params: unknown[] = [],
  db: Db = pool,
): Promise<ResultSetHeader> {
  const [result] = await db.query<ResultSetHeader>(sql, params)
  return result
}

export async function transaction<T>(work: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const result = await work(conn)
    await conn.commit()
    return result
  } catch (error) {
    await conn.rollback()
    throw error
  } finally {
    conn.release()
  }
}
