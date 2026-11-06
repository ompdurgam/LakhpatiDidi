// Creates one dummy district-officer (DPM) login per district and writes them to a CSV.
// A district that already has a district-role user keeps that user. Safe to re-run.
//
//   npm run seed:district-logins
//
// Mobile numbers are generated from the district's LGD code ("9100" + 6-digit LGD code,
// e.g. Raipur 387 → 9100000387), so they never clash with real staff numbers. There is
// no password: in development the OTP is shown on the login screen (OTP_DEV_MODE=true).
import fs from "node:fs"
import path from "node:path"

import { exec, one, pool, query } from "../pool.ts"
import { csvLine } from "./csv.ts"

const OUT = path.resolve(
  import.meta.dirname,
  "../../../database/data/dummy-logins/district-logins.csv",
)

// Lets Excel read the Hindi names as UTF-8.
const BOM = String.fromCharCode(0xfeff)

type District = { id: number; lgd_code: string; name_hi: string; name_en: string }

export const districtMobile = (lgd: string) => `9100${lgd.padStart(6, "0")}`

async function main() {
  const districts = await query<District & { [key: string]: unknown }>(
    "SELECT id, lgd_code, name_hi, name_en FROM master_districts WHERE lgd_code IS NOT NULL ORDER BY name_en",
  )
  if (!districts.length)
    throw new Error("No districts with LGD codes — run `npm run geo:lgd` first")

  const rows: string[][] = []
  let created = 0
  for (const d of districts) {
    let officer = await one<{ name: string; mobile: string; designation: string }>(
      "SELECT name, mobile, designation FROM master_users WHERE role = 'district' AND district_id = ? ORDER BY id LIMIT 1",
      [d.id],
    )
    if (!officer) {
      officer = { name: `DPM ${d.name_en}`, mobile: districtMobile(d.lgd_code), designation: "DPM" }
      const result = await exec(
        `INSERT IGNORE INTO master_users (name, mobile, role, designation, district_id)
         VALUES (?, ?, 'district', ?, ?)`,
        [officer.name, officer.mobile, officer.designation, d.id],
      )
      created += result.affectedRows
    }
    rows.push([
      d.lgd_code,
      d.name_en,
      d.name_hi,
      "district",
      officer.name,
      officer.mobile,
      officer.designation,
    ])
  }

  const header = [
    "district_lgd",
    "district",
    "district_hindi",
    "role",
    "login_name",
    "mobile",
    "designation",
  ]
  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  // The BOM lets Excel open the Hindi names correctly.
  fs.writeFileSync(OUT, BOM + [header, ...rows].map(csvLine).join("\r\n") + "\r\n", "utf8")
  console.log(
    `✓ ${rows.length} district logins (${created} new) → ${path.relative(process.cwd(), OUT)}`,
  )
  await pool.end()
}

main().catch(async (error) => {
  console.error("✗ District logins failed:", error.sqlMessage ?? error.message)
  await pool.end()
  process.exit(1)
})
