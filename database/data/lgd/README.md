# Chhattisgarh geography (LGD)

`chhattisgarh-villages.csv` — every village in Chhattisgarh with its gram
panchayat / local body, block and district, all with **LGD codes**
(Local Government Directory, Ministry of Panchayati Raj).

| | Count |
|---|---|
| Districts | 33 |
| Blocks | 146 |
| Local bodies (GPs, towns, municipalities) | 11,752 |
| Villages | 20,587 |

- **Source:** LGD "Villages LGD Codes" via the India Data Portal (ISB) CKAN API,
  state code `22`, downloaded 6 November 2026.
  https://ckandev.indiadataportal.com/dataset/lgd-codes
- **Licence:** Government of India open data (NDSAP).
- **Names are English only.** District names get Hindi from
  `server/db/geo/lgd.ts`; block, GP and village Hindi names can be filled in
  later (LGD publishes local-language names on lgdirectory.gov.in).
- A village listed under several local bodies is attached to its Village
  Panchayat.

## Import

```bash
npm run db:migrate     # adds LGD codes + master_boundaries (migration 007)
npm run geo:lgd        # loads this file; safe to re-run
```

Existing rows without an LGD code (the Hindi demo data) are linked by name,
so Bastar / Jagdalpur keep their Hindi names.

## Map boundaries

All boundaries are LGD (Local Government Directory) polygons, republished as
open data (CC0-1.0) by [ramSeraph/indian_admin_boundaries](https://github.com/ramSeraph/indian_admin_boundaries/releases)
(release tags `blocks`, `panchayats`, `villages`, data of December 2023).
They are keyed by the same LGD codes as the hierarchy above.

| File (in `database/data/boundaries/`) | In git | How it's made |
|---|---|---|
| `chhattisgarh-blocks.geojson` — 146 blocks | yes | extracted from `LGD_Blocks.parquet` |
| `chhattisgarh-districts.geojson` — 33 districts | yes | union of each district's LGD blocks (current block → district mapping from the CSV above) |
| `chhattisgarh-panchayats.geojson` — 11,232 gram panchayats, `chhattisgarh-villages.geojson` — 17,981 villages | no (≈17–19 MB each) | extracted from `LGD_panchayats.parquet` / `LGD_Villages.parquet`; pieces sharing a code are collected into one multi-part shape |

Not every area has an outline: towns and municipalities have no gram panchayat shape, and about 2,800 villages have no shape in the source file (the reason isn't recorded there). Those still appear in the list.

Re-create the GP and village files (or any state's) with:

```bash
pip install duckdb==1.1.3
# download LGD_Blocks / LGD_panchayats / LGD_Villages .parquet from the releases above into ./parquet
python scripts/boundaries/extract_state.py --parquet-dir ./parquet --state 22 --out database/data/boundaries
```

Import (each is safe to re-run):

```bash
npm run geo:boundaries -- --level district       --file database/data/boundaries/chhattisgarh-districts.geojson  --code-field DIST_LGD    --source "LGD via indian_admin_boundaries (CC0)"
npm run geo:boundaries -- --level block          --file database/data/boundaries/chhattisgarh-blocks.geojson     --code-field BLOCK_LGD   --source "LGD via indian_admin_boundaries (CC0)"
npm run geo:boundaries -- --level gram_panchayat --file database/data/boundaries/chhattisgarh-panchayats.geojson --code-field GP_LGD      --source "LGD via indian_admin_boundaries (CC0)"
npm run geo:boundaries -- --level village        --file database/data/boundaries/chhattisgarh-villages.geojson   --code-field VILLAGE_LGD --source "LGD via indian_admin_boundaries (CC0)"
```

Newer or official boundaries (e.g. from CGSRLM, NIC Bharat Maps or Bhuvan) can
replace these with the same command: convert Shapefile/KML to GeoJSON first
(`npx mapshaper in.shp -o format=geojson out.json`) and point `--code-field` at
the LGD code property.

`--code-field` is the property holding the LGD code (case-insensitive).
Coordinates are rounded to 5 decimals (~1 m). Re-running replaces the
boundaries for the codes in the file; codes not in the LGD hierarchy and
features without a polygon are reported, not imported.

Optional basemap: set `VITE_MAP_TILE_URL` (and `VITE_MAP_ATTRIBUTION`) to an
approved tile server, e.g. Bhuvan. Without it the map shows boundaries only.
