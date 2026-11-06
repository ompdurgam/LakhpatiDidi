-- LGD (Local Government Directory) codes on every geography level, and map
-- boundaries keyed by those codes. Filled by `npm run geo:lgd` (hierarchy)
-- and `npm run geo:boundaries` (polygons) — see database/data/lgd/README.md.

-- migrate:up
ALTER TABLE master_districts
  ADD COLUMN lgd_code VARCHAR(20) NULL AFTER code,
  ADD UNIQUE KEY uq_districts_lgd (lgd_code);

ALTER TABLE master_blocks
  ADD COLUMN lgd_code VARCHAR(20) NULL AFTER code,
  ADD UNIQUE KEY uq_blocks_lgd (lgd_code);

ALTER TABLE master_gram_panchayats
  ADD COLUMN lgd_code VARCHAR(20) NULL AFTER code,
  ADD COLUMN local_body_type VARCHAR(40) NULL AFTER name_en,
  ADD UNIQUE KEY uq_gp_lgd (lgd_code);

ALTER TABLE master_villages
  ADD UNIQUE KEY uq_villages_lgd (lgd_code);

-- One polygon (GeoJSON geometry) per area. `level` + `lgd_code` match the
-- master tables; the state uses its own code ('CG').
CREATE TABLE master_boundaries (
  level       ENUM('state','district','block','gram_panchayat','village') NOT NULL,
  lgd_code    VARCHAR(20)  NOT NULL,
  geometry    LONGTEXT     NOT NULL CHECK (JSON_VALID(geometry)),
  source      VARCHAR(150) NOT NULL,
  imported_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (level, lgd_code)
) ENGINE=InnoDB;

-- migrate:down
DROP TABLE IF EXISTS master_boundaries;
ALTER TABLE master_villages DROP INDEX uq_villages_lgd;
ALTER TABLE master_gram_panchayats DROP INDEX uq_gp_lgd, DROP COLUMN local_body_type, DROP COLUMN lgd_code;
ALTER TABLE master_blocks DROP INDEX uq_blocks_lgd, DROP COLUMN lgd_code;
ALTER TABLE master_districts DROP INDEX uq_districts_lgd, DROP COLUMN lgd_code;
