// Excel download of every Didi on record (the PLD list plus survey results) in
// the session's areas. Streamed row by row: the state has 6 lakh+ Didis.
import ExcelJS from "exceljs"
import type { Response } from "express"
import type { Connection as CallbackConnection } from "mysql2"

import { pool } from "../../db/pool.ts"
import type { Row, SessionUser } from "../../shared/types.ts"
import { sessionCondition } from "../auth/assignments.ts"
import { categoryHi, lifecycleHi, type LifecycleStatus } from "./households.labels.ts"

const COLUMNS: { header: string; key: string; width: number }[] = [
  { header: "District / जिला", key: "district", width: 16 },
  { header: "District LGD", key: "district_lgd", width: 10 },
  { header: "Block / ब्लॉक", key: "block", width: 16 },
  { header: "Block LGD", key: "block_lgd", width: 10 },
  { header: "Gram Panchayat / ग्राम पंचायत", key: "gp", width: 20 },
  { header: "GP LGD", key: "gp_lgd", width: 10 },
  { header: "Village / गाँव", key: "village", width: 20 },
  { header: "Village LGD", key: "village_lgd", width: 10 },
  { header: "HH Code", key: "hh_code", width: 22 },
  { header: "LokOS Member Code", key: "lokos_member_code", width: 18 },
  { header: "Didi Name / दीदी", key: "didi_name", width: 22 },
  { header: "Father / Spouse", key: "guardian_name", width: 22 },
  { header: "Age", key: "age", width: 6 },
  { header: "Mobile", key: "mobile", width: 12 },
  { header: "Social Category", key: "category", width: 12 },
  { header: "Special Status", key: "special_status", width: 10 },
  { header: "PLD", key: "pld", width: 6 },
  { header: "SHG Name", key: "shg_name", width: 22 },
  { header: "SHG LokOS Code", key: "shg_code", width: 16 },
  { header: "VO", key: "vo_name", width: 18 },
  { header: "CLF", key: "clf_name", width: 18 },
  { header: "Surveyed", key: "surveyed", width: 9 },
  { header: "Surveyed On", key: "surveyed_at", width: 17 },
  { header: "Surveyed By", key: "surveyed_by", width: 18 },
  { header: "Annual Income ₹", key: "income", width: 14 },
  { header: "Active Income Sources", key: "active_income_sources", width: 10 },
  { header: "Status", key: "status", width: 14 },
]

/** Streams the workbook to the response; returns once it is fully written. */
export async function exportHouseholds(user: SessionUser, res: Response) {
  const area = await sessionCondition(user)
  const date = new Date().toISOString().slice(0, 10)
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
  res.setHeader("Content-Disposition", `attachment; filename="PLD-Didis-${date}.xlsx"`)

  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: res, useSharedStrings: false })
  const sheet = workbook.addWorksheet("PLD Didis", { views: [{ state: "frozen", ySplit: 1 }] })
  sheet.columns = COLUMNS
  sheet.getRow(1).font = { bold: true }
  sheet.getRow(1).commit()

  const sql = `
    SELECT d.name_en AS district, d.lgd_code AS district_lgd, b.name_en AS block, b.lgd_code AS block_lgd,
           gp.name_en AS gp, gp.lgd_code AS gp_lgd, v.name_en AS village, v.lgd_code AS village_lgd,
           h.hh_code, h.lokos_member_code, h.didi_name, h.guardian_name, h.age, h.mobile,
           h.social_category, h.special_status, h.is_pld, s.name AS shg_name, s.lokos_code AS shg_code,
           vo.name AS vo_name, c.name AS clf_name, h.surveyed_at, u.name AS surveyed_by,
           h.current_annual_income, h.active_income_sources, h.lifecycle_status
    FROM tbl_households h
    JOIN master_villages v              ON v.id  = h.village_id
    JOIN master_gram_panchayats gp      ON gp.id = v.gram_panchayat_id
    JOIN master_blocks b                ON b.id  = gp.block_id
    JOIN master_districts d             ON d.id  = b.district_id
    LEFT JOIN master_shgs s             ON s.id  = h.shg_id
    LEFT JOIN master_village_organisations vo ON vo.id = s.vo_id
    LEFT JOIN master_clfs c             ON c.id  = vo.clf_id
    LEFT JOIN master_users u            ON u.id  = h.surveyed_by
    WHERE ${area?.sql ?? "TRUE"}
    ORDER BY d.name_en, b.name_en, gp.name_en, v.name_en, h.hh_code`

  // A raw (non-promise) connection lets the rows stream instead of loading all at once.
  const conn = await pool.getConnection()
  try {
    await new Promise<void>((resolve, reject) => {
      const raw = conn.connection as unknown as CallbackConnection
      const stream = raw.query(sql, area?.params ?? []).stream()
      stream.on("data", (r: Row) => {
        const surveyed = r.surveyed_at !== null
        sheet
          .addRow({
            ...r,
            category: categoryHi[r.social_category as keyof typeof categoryHi] ?? r.social_category,
            pld: r.is_pld ? "Yes" : "No",
            surveyed: surveyed ? "Yes" : "No",
            surveyed_at: r.surveyed_at ?? "",
            income: surveyed ? Number(r.current_annual_income) : "",
            active_income_sources: surveyed ? r.active_income_sources : "",
            status: surveyed
              ? (lifecycleHi[r.lifecycle_status as LifecycleStatus] ?? r.lifecycle_status)
              : "सर्वे बाकी",
          })
          .commit()
      })
      stream.on("end", resolve)
      stream.on("error", reject)
    })
  } finally {
    conn.release()
  }
  sheet.commit()
  await workbook.commit()
}
