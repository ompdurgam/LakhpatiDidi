-- Admin configuration (survey sections, option lists), audit log,
-- and reporting views used by the API.

-- migrate:up
CREATE TABLE master_survey_sections (
  code       CHAR(1)      NOT NULL,
  name_hi    VARCHAR(60)  NOT NULL,
  is_enabled TINYINT(1)   NOT NULL DEFAULT 1,
  sort_order TINYINT UNSIGNED NOT NULL,
  PRIMARY KEY (code)
) ENGINE=InnoDB;

CREATE TABLE master_option_lists (
  id      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name    VARCHAR(80)  NOT NULL,
  options LONGTEXT     NOT NULL CHECK (JSON_VALID(options)),
  PRIMARY KEY (id),
  UNIQUE KEY uq_option_lists_name (name)
) ENGINE=InnoDB;

CREATE TABLE tbl_audit_logs (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED NULL,
  action      VARCHAR(60)  NOT NULL,
  entity_type VARCHAR(40)  NULL,
  entity_id   VARCHAR(40)  NULL,
  details     VARCHAR(500) NOT NULL,
  ip_address  VARCHAR(45)  NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_audit_created (created_at),
  KEY ix_audit_entity (entity_type, entity_id),
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES master_users (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- One row per application with everything list screens need.
-- is_overdue: still open and past its SLA due date.
CREATE VIEW v_application_list AS
SELECT
  a.id,
  a.app_code,
  a.status,
  (a.status IN ('submitted','under_review','info_requested') AND CURDATE() > a.sla_due_on) AS is_overdue,
  DATEDIFF(CURDATE(), a.received_on) AS days_pending,
  a.project_cost,
  a.subsidy_amount,
  a.received_on,
  a.sla_due_on,
  a.escalation_level,
  a.expected_income_gain,
  a.assigned_officer_id,
  h.hh_code,
  h.didi_name,
  h.didi_name_en,
  h.current_annual_income,
  v.name_hi  AS village_name,
  s.code     AS scheme_code,
  s.name_hi  AS scheme_name,
  d.code     AS department_code,
  d.name_hi  AS department_name,
  b.code     AS block_code,
  b.name_hi  AS block_name
FROM tbl_applications a
JOIN tbl_households  h ON h.id = a.household_id
JOIN master_villages    v ON v.id = h.village_id
JOIN master_schemes     s ON s.id = a.scheme_id
JOIN master_departments d ON d.id = a.department_id
JOIN master_blocks      b ON b.id = a.block_id;

-- One row per household with SHG federation and live counts.
CREATE VIEW v_household_register AS
SELECT
  h.id,
  h.hh_code,
  h.didi_name,
  h.didi_name_en,
  h.social_category,
  h.special_status,
  h.is_pld,
  h.current_annual_income,
  h.active_income_sources,
  h.lifecycle_status,
  h.updated_at,
  v.name_hi AS village_name,
  shg.name  AS shg_name,
  vo.name   AS vo_name,
  c.name    AS clf_name,
  (SELECT COUNT(*) FROM tbl_applications a
     WHERE a.household_id = h.id AND a.status NOT IN ('rejected','delivered')) AS open_applications,
  (SELECT COUNT(*) FROM tbl_entitlement_gaps g
     WHERE g.household_id = h.id AND g.status = 'open') AS open_gaps
FROM tbl_households h
JOIN master_villages v                     ON v.id   = h.village_id
LEFT JOIN master_shgs shg                  ON shg.id = h.shg_id
LEFT JOIN master_village_organisations vo  ON vo.id  = shg.vo_id
LEFT JOIN master_clfs c                    ON c.id   = vo.clf_id;

-- migrate:down
DROP VIEW IF EXISTS v_household_register;
DROP VIEW IF EXISTS v_application_list;
DROP TABLE IF EXISTS tbl_audit_logs;
DROP TABLE IF EXISTS master_option_lists;
DROP TABLE IF EXISTS master_survey_sections;
