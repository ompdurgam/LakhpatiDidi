// The geography hierarchy as data: each level's table, its parent link, and
// which household-join column rolls households up to that level.

export const GEO_LEVELS = ["state", "district", "block", "gram_panchayat", "village"] as const
export type GeoLevel = (typeof GEO_LEVELS)[number]

type LevelDef = {
  table: string
  /** Column holding the area's public code (LGD code; the state uses `code`). */
  codeColumn: string
  /** Foreign key to the parent level (undefined for the state). */
  parentFk?: string
  /** Column in the household → village → GP → block join that equals this level's id. */
  rollup: string
}

export const levels: Record<GeoLevel, LevelDef> = {
  state: { table: "master_states", codeColumn: "code", rollup: "d.state_id" },
  district: {
    table: "master_districts",
    codeColumn: "lgd_code",
    parentFk: "state_id",
    rollup: "b.district_id",
  },
  block: {
    table: "master_blocks",
    codeColumn: "lgd_code",
    parentFk: "district_id",
    rollup: "gp.block_id",
  },
  gram_panchayat: {
    table: "master_gram_panchayats",
    codeColumn: "lgd_code",
    parentFk: "block_id",
    rollup: "v.gram_panchayat_id",
  },
  village: {
    table: "master_villages",
    codeColumn: "lgd_code",
    parentFk: "gram_panchayat_id",
    rollup: "v.id",
  },
}

export const childOf = (level: GeoLevel): GeoLevel | undefined =>
  GEO_LEVELS[GEO_LEVELS.indexOf(level) + 1]

export const parentOf = (level: GeoLevel): GeoLevel | undefined =>
  GEO_LEVELS[GEO_LEVELS.indexOf(level) - 1]
