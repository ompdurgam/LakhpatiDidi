"""Extract one state's LGD boundaries (blocks, gram panchayats, villages) as GeoJSON.

Source: ramSeraph/indian_admin_boundaries GitHub releases (CC0-1.0), which
republish the Local Government Directory (LGD) boundary layers:
  https://github.com/ramSeraph/indian_admin_boundaries/releases  (tags: blocks, panchayats, villages)

Download the national Parquet files first (≈100 MB / 435 MB / 545 MB):
  LGD_Blocks.parquet, LGD_panchayats.parquet, LGD_Villages.parquet

Then (needs `pip install duckdb==1.1.3`):
  python scripts/boundaries/extract_state.py --parquet-dir <dir> --state 22 --out database/data/boundaries

Writes chhattisgarh-{blocks,panchayats,villages}.geojson with BLOCK_LGD / GP_LGD /
VILLAGE_LGD properties, simplified (~20 m) and rounded to 5 decimals, ready for
`npm run geo:boundaries`.
"""
import argparse
import json
import os

import duckdb

# layer → (parquet file, state column, code column, output code field, file stem)
LAYERS = {
    "blocks": ("LGD_Blocks.parquet", "state_lgd", "block_lgd", "BLOCK_LGD"),
    "panchayats": ("LGD_panchayats.parquet", "st_lgd", "gpcode", "GP_LGD"),
    "villages": ("LGD_Villages.parquet", "state_lgd", "vil_lgd", "VILLAGE_LGD"),
}
TOLERANCE = 0.0002  # degrees ≈ 20 m


def find_column(con, path, wanted):
    """Actual column name (case-insensitive) in the parquet file."""
    cols = [row[0] for row in con.execute(f"DESCRIBE SELECT * FROM read_parquet('{path}')").fetchall()]
    for col in cols:
        if col.lower() == wanted.lower():
            return col
    raise SystemExit(f"{os.path.basename(path)}: no column {wanted!r} (has {cols})")


def geometry_expr(con, path):
    cols = {row[0].lower(): row for row in con.execute(f"DESCRIBE SELECT * FROM read_parquet('{path}')").fetchall()}
    name = next(c for c in ("geometry", "geom", "wkb_geometry") if c in cols)
    real = cols[name][0]
    kind = cols[name][1].upper()
    return real if "GEOMETRY" in kind else f"ST_GeomFromWKB({real})"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--parquet-dir", required=True)
    ap.add_argument("--state", required=True, help="state LGD code, e.g. 22 for Chhattisgarh")
    ap.add_argument("--out", required=True)
    ap.add_argument("--prefix", default="chhattisgarh")
    ap.add_argument("--layers", default="blocks,panchayats,villages")
    args = ap.parse_args()

    con = duckdb.connect()
    con.execute("INSTALL spatial; LOAD spatial;")
    os.makedirs(args.out, exist_ok=True)
    for layer in args.layers.split(","):
        file, state_col, code_col, out_field = LAYERS[layer]
        path = os.path.join(args.parquet_dir, file).replace("\\", "/")
        if not os.path.exists(path):
            print(f"skip {layer}: {path} not found")
            continue
        state = find_column(con, path, state_col)
        code = find_column(con, path, code_col)
        geom = geometry_expr(con, path)
        # Some areas are stored as several pieces with the same code: collect them
        # into one multi-part polygon so each code has exactly one boundary. (A true
        # dissolve — ST_Union_Agg — is correct but takes hours on the village layer.)
        rows = con.execute(
            f"""SELECT CAST({code} AS VARCHAR) AS code,
                       ST_AsGeoJSON(ST_CollectionExtract(
                         ST_SimplifyPreserveTopology(ST_Collect(list(ST_MakeValid({geom}))), {TOLERANCE}), 3)) AS g
                FROM read_parquet('{path}')
                WHERE CAST({state} AS VARCHAR) = ? AND {code} IS NOT NULL
                GROUP BY 1""",
            [args.state],
        ).fetchall()

        def rounded(coords):
            if isinstance(coords[0], (int, float)):
                return [round(coords[0], 5), round(coords[1], 5)]
            return [rounded(c) for c in coords]

        features = []
        for code_value, g in rows:
            if not g:
                continue
            geometry = json.loads(g)
            if geometry["type"] not in ("Polygon", "MultiPolygon"):
                continue
            geometry["coordinates"] = rounded(geometry["coordinates"])
            features.append({"type": "Feature", "properties": {out_field: code_value}, "geometry": geometry})
        out = os.path.join(args.out, f"{args.prefix}-{layer}.geojson")
        with open(out, "w", encoding="utf-8") as fh:
            json.dump(
                {
                    "type": "FeatureCollection",
                    "attribution": "LGD boundaries via ramSeraph/indian_admin_boundaries (CC0-1.0)",
                    "features": features,
                },
                fh,
                separators=(",", ":"),
            )
        print(f"{layer}: {len(features)} features → {out} ({os.path.getsize(out) / 1e6:.1f} MB)")


if __name__ == "__main__":
    main()
