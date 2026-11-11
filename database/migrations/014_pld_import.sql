-- Prepares the schema for the state's Potential Lakhpati Didi (PLD) list
-- (npm run pld:import). That list names each Didi's SHG but not its VO / CLF,
-- and identifies her by her LokOS member code.
--   * SHGs may exist before their VO is known (every view already LEFT JOINs it).
--   * Households carry the LokOS member code, so re-imports update in place.
--   * The list uses a fifth social category, OTHER.

-- migrate:up
ALTER TABLE master_shgs MODIFY vo_id INT UNSIGNED NULL;

ALTER TABLE tbl_households
  ADD COLUMN lokos_member_code VARCHAR(20) NULL AFTER hh_code,
  ADD UNIQUE KEY uq_households_lokos (lokos_member_code),
  MODIFY social_category ENUM('ST','SC','OBC','GEN','OTHER') NOT NULL DEFAULT 'GEN';

-- migrate:down
UPDATE tbl_households SET social_category = 'GEN' WHERE social_category = 'OTHER';
ALTER TABLE tbl_households
  DROP INDEX uq_households_lokos,
  DROP COLUMN lokos_member_code,
  MODIFY social_category ENUM('ST','SC','OBC','GEN') NOT NULL DEFAULT 'GEN';

-- SHGs without a VO cannot survive the NOT NULL; detach their households first.
UPDATE tbl_households h JOIN master_shgs s ON s.id = h.shg_id SET h.shg_id = NULL WHERE s.vo_id IS NULL;
DELETE FROM master_shgs WHERE vo_id IS NULL;
ALTER TABLE master_shgs MODIFY vo_id INT UNSIGNED NOT NULL;
