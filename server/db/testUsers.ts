// Test logins: one per role (and one per department), placed in a real district,
// block and village so every screen has live data to show.
//
//   npm run db:test-users                      create / refresh (district with most Didis)
//   npm run db:test-users -- --district 380    …in the district with this LGD code
//   npm run db:test-users -- --remove          delete every test login
//
// Every test login uses a 900000XXXX mobile and a "(टेस्ट)" name, so they are easy to
// spot and remove. With OTP_DEV_MODE on, the login screen shows the OTP.
// The Didi login is linked to one PLD household in the CRP's village that has no
// mobile yet; --remove clears that mobile again.
import { saveAssignments } from "../modules/users/users.assignments.ts"
import type { Role, Row } from "../shared/types.ts"
import { type Db, exec, one, pool, query, transaction } from "./pool.ts"

type Level = "state" | "district" | "block" | "gram_panchayat" | "village"
type Login = {
  mobile: string
  name: string
  designation: string
  /** First assignment is the primary role. */
  roles: { role: Role; level: Level; areaId: number | null; departmentId: number | null }[]
}

const PREFIX = "900000"
const TAG = "(टेस्ट)"
const DIDI_MOBILE = "9000000006"

/** The district (given, else the one with most Didis), its busiest block and village. */
async function pickPlaces(districtCode?: string) {
  const district = await one<Row>(
    districtCode
      ? "SELECT id, name_en FROM master_districts WHERE lgd_code = ? OR code = ?"
      : `SELECT d.id, d.name_en FROM master_districts d
         JOIN master_blocks b ON b.district_id = d.id
         JOIN master_gram_panchayats gp ON gp.block_id = b.id
         JOIN master_villages v ON v.gram_panchayat_id = gp.id
         JOIN tbl_households h ON h.village_id = v.id
         GROUP BY d.id ORDER BY COUNT(*) DESC LIMIT 1`,
    districtCode ? [districtCode, districtCode] : [],
  )
  if (!district)
    throw new Error(districtCode ? `district ${districtCode} not found` : "no Didis loaded yet")
  const village = await one<Row>(
    `SELECT v.id, v.name_en, b.id AS block_id, b.name_en AS block_en
     FROM tbl_households h
     JOIN master_villages v ON v.id = h.village_id
     JOIN master_gram_panchayats gp ON gp.id = v.gram_panchayat_id
     JOIN master_blocks b ON b.id = gp.block_id
     WHERE b.district_id = ?
     GROUP BY v.id ORDER BY COUNT(*) DESC LIMIT 1`,
    [district.id],
  )
  if (!village) throw new Error(`district ${district.name_en} has no Didis`)
  return {
    district: { id: district.id as number, name: district.name_en as string },
    block: { id: village.block_id as number, name: village.block_en as string },
    village: { id: village.id as number, name: village.name_en as string },
  }
}

async function logins(places: Awaited<ReturnType<typeof pickPlaces>>): Promise<Login[]> {
  const { district, block, village } = places
  const at = (
    role: Role,
    level: Level,
    areaId: number | null,
    departmentId: number | null = null,
  ) => ({ role, level, areaId, departmentId })
  const departments = await query<Row>(
    "SELECT id, code, name_en FROM master_departments WHERE is_active = 1 ORDER BY id",
  )
  const fixed: Login[] = [
    {
      mobile: "9000000001",
      name: `राज्य अधिकारी ${TAG}`,
      designation: "SMMU",
      roles: [at("state", "state", null)],
    },
    {
      mobile: "9000000002",
      name: `प्रशासक ${TAG}`,
      designation: "Administrator",
      roles: [at("admin", "state", null)],
    },
    {
      mobile: "9000000003",
      name: `जिला प्रबंधक ${TAG}`,
      designation: "DPM (DMMU)",
      roles: [at("district", "district", district.id)],
    },
    {
      mobile: "9000000004",
      name: `ब्लॉक प्रबंधक ${TAG}`,
      designation: "Block Manager (BMMU)",
      roles: [at("block", "block", block.id)],
    },
    {
      mobile: "9000000005",
      name: `CRP सर्वेयर ${TAG}`,
      designation: "CRP / Surveyor",
      roles: [at("field", "village", village.id)],
    },
    {
      mobile: DIDI_MOBILE,
      name: `दीदी ${TAG}`,
      designation: "Didi (PLD)",
      roles: [at("didi", "village", village.id)],
    },
    {
      // One person holding every role, to switch between them after login.
      mobile: "9000000009",
      name: `सभी भूमिकाएँ ${TAG}`,
      designation: "All roles",
      roles: [
        at("admin", "state", null),
        at("state", "state", null),
        at("district", "district", district.id),
        ...(departments[0] ? [at("department", "district", district.id, departments[0].id)] : []),
        at("block", "block", block.id),
        at("field", "village", village.id),
      ],
    },
  ]
  // One department officer per department, over the district (90000001NN).
  const officers: Login[] = departments.map((d, i) => ({
    mobile: `${PREFIX}${String(100 + i + 1).padStart(4, "0")}`,
    name: `${d.code} अधिकारी ${TAG}`,
    designation: `Department officer – ${d.name_en}`,
    roles: [at("department", "district", district.id, d.id)],
  }))
  return [...fixed, ...officers]
}

async function upsert(db: Db, login: Login) {
  await exec(
    `INSERT INTO master_users (name, mobile, role, designation, status)
     VALUES (?, ?, ?, ?, 'active')
     ON DUPLICATE KEY UPDATE name = VALUES(name), designation = VALUES(designation), status = 'active'`,
    [login.name, login.mobile, login.roles[0].role, login.designation],
    db,
  )
  const user = await one<Row>("SELECT id FROM master_users WHERE mobile = ?", [login.mobile], db)
  await saveAssignments(db, user!.id, login.roles)
}

/** Gives the Didi test login a household: one in the village already on its mobile, else a PLD one without a mobile. */
async function linkDidi(db: Db, mobile: string, villageId: number) {
  const linked = await one<Row>("SELECT hh_code FROM tbl_households WHERE mobile = ?", [mobile], db)
  if (linked) return linked.hh_code as string
  const household = await one<Row>(
    `SELECT id, hh_code FROM tbl_households
     WHERE village_id = ? AND mobile IS NULL ORDER BY is_pld DESC, id LIMIT 1`,
    [villageId],
    db,
  )
  if (!household) return null
  await exec("UPDATE tbl_households SET mobile = ? WHERE id = ?", [mobile, household.id], db)
  return household.hh_code as string
}

async function create(districtCode?: string) {
  const places = await pickPlaces(districtCode)
  const all = await logins(places)
  const didiHousehold = await transaction(async (db) => {
    for (const login of all) await upsert(db, login)
    return linkDidi(db, DIDI_MOBILE, places.village.id)
  })
  console.log(
    `Test logins in ${places.district.name} › ${places.block.name} › ${places.village.name}:`,
  )
  console.table(
    all.map((l) => ({
      mobile: l.mobile,
      name: l.name,
      roles: l.roles.map((r) => r.role).join(", "),
    })),
  )
  console.log(
    didiHousehold
      ? `Didi login ${DIDI_MOBILE} opens household ${didiHousehold}.`
      : "No household without a mobile in that village: the Didi login has no profile.",
  )
}

async function remove() {
  const users = await query<Row>(
    `SELECT id, mobile FROM master_users WHERE mobile LIKE '${PREFIX}%' AND name LIKE ?`,
    [`%${TAG}`],
  )
  let removed = 0
  const locked: string[] = []
  await exec("UPDATE tbl_households SET mobile = NULL WHERE mobile = ?", [DIDI_MOBILE])
  for (const u of users) {
    try {
      await transaction(async (db) => {
        await exec("DELETE FROM tbl_user_sessions WHERE user_id = ?", [u.id], db)
        await exec("DELETE FROM tbl_otp_requests WHERE mobile = ?", [u.mobile], db)
        await exec("DELETE FROM master_users WHERE id = ?", [u.id], db)
      })
      removed++
    } catch {
      // Surveys, applications or audit rows point at this login: keep it, locked.
      await exec("UPDATE master_users SET status = 'locked' WHERE id = ?", [u.id])
      locked.push(u.mobile)
    }
  }
  console.log(`✗ removed ${removed} test logins`)
  if (locked.length) console.log(`  locked instead (they have recorded work): ${locked.join(", ")}`)
}

const args = process.argv.slice(2)
const districtAt = args.indexOf("--district")
const run = args.includes("--remove")
  ? remove()
  : create(districtAt >= 0 ? args[districtAt + 1] : undefined)
run
  .then(() => pool.end())
  .catch(async (error) => {
    console.error("✗ test users failed:", error.sqlMessage ?? error.message)
    await pool.end()
    process.exit(1)
  })
