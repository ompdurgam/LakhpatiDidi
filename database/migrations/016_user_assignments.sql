-- A user can hold several roles, each over one or more areas:
--   master_user_assignments  (user, role, area) rows. area_level 'state' has no area_id;
--                            otherwise area_id points into master_districts / master_blocks /
--                            master_gram_panchayats / master_villages by level. A department
--                            role names its department.
--   tbl_user_sessions.role   the role this session works as (chosen at login, switchable
--                            among the user's own roles).
-- master_users.role / district_id / block_id / village_id / department_id stay as the
-- user's primary (first) assignment for code that needs a single value.

-- migrate:up
CREATE TABLE master_user_assignments (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED NOT NULL,
  role          ENUM('field','block','department','district','state','admin','didi') NOT NULL,
  area_level    ENUM('state','district','block','gram_panchayat','village') NOT NULL,
  area_id       INT UNSIGNED NULL COMMENT 'NULL for the whole state',
  department_id INT UNSIGNED NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_assignment (user_id, role, area_level, area_id, department_id),
  KEY ix_assignment_area (area_level, area_id),
  CONSTRAINT fk_assignment_user FOREIGN KEY (user_id) REFERENCES master_users (id) ON DELETE CASCADE,
  CONSTRAINT fk_assignment_dept FOREIGN KEY (department_id) REFERENCES master_departments (id)
) ENGINE=InnoDB;

-- Every existing account keeps its role: state / admin over the state, a DPM over the
-- district, everyone else over their most specific area.
INSERT INTO master_user_assignments (user_id, role, area_level, area_id, department_id)
SELECT u.id, u.role,
       CASE WHEN u.role IN ('state','admin') THEN 'state'
            WHEN u.role = 'district' AND COALESCE(u.district_id, b.district_id) IS NOT NULL THEN 'district'
            WHEN u.village_id  IS NOT NULL THEN 'village'
            WHEN u.block_id    IS NOT NULL THEN 'block'
            WHEN u.district_id IS NOT NULL THEN 'district'
            ELSE 'state' END,
       CASE WHEN u.role IN ('state','admin') THEN NULL
            WHEN u.role = 'district' THEN COALESCE(u.district_id, b.district_id)
            ELSE COALESCE(u.village_id, u.block_id, u.district_id) END,
       u.department_id
FROM master_users u LEFT JOIN master_blocks b ON b.id = u.block_id;

ALTER TABLE tbl_user_sessions
  ADD COLUMN role ENUM('field','block','department','district','state','admin','didi') NULL AFTER user_id;

-- migrate:down
ALTER TABLE tbl_user_sessions DROP COLUMN role;
DROP TABLE IF EXISTS master_user_assignments;
