// Rebuilds entitlement gaps from the surveys already saved, using each household's
// latest submitted survey. Run once after migration 017 (safe to re-run):
//
//   npm run survey:backfill-gaps
import { saveEntitlementGaps } from "../modules/surveys/surveys.details.ts"
import { pool, query } from "./pool.ts"

async function main() {
  const surveys = await query<{ household_id: number; responses: string }>(
    `SELECT s.household_id, s.responses
     FROM tbl_surveys s
     JOIN (SELECT household_id, MAX(id) AS id FROM tbl_surveys
           WHERE status = 'submitted' GROUP BY household_id) latest ON latest.id = s.id`,
  )
  for (const s of surveys) await saveEntitlementGaps(pool, s.household_id, JSON.parse(s.responses))
  const [{ open, closed }] = await query<{ open: number; closed: number }>(
    "SELECT SUM(status = 'open') AS open, SUM(status = 'closed') AS closed FROM tbl_entitlement_gaps",
  )
  console.log(`✓ ${surveys.length} surveys read • gaps: ${open ?? 0} open, ${closed ?? 0} closed`)
}

main()
  .catch((error) => {
    console.error("✗ backfill failed:", error.message)
    process.exitCode = 1
  })
  .finally(() => pool.end())
