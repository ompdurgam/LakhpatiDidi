-- English names in the list views, so the API can answer in the user's
-- language (Accept-Language: en → *_name_en columns; see server/shared/i18n.ts).

-- migrate:up
-- One row per application with everything list screens need.
-- is_overdue: still open and past its SLA due date.
CREATE OR REPLACE VIEW v_application_list AS
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
  v.name_en  AS village_name_en,
  s.code     AS scheme_code,
  s.name_hi  AS scheme_name,
  s.name_en  AS scheme_name_en,
  d.code     AS department_code,
  d.name_hi  AS department_name,
  d.name_en  AS department_name_en,
  b.code     AS block_code,
  b.name_hi  AS block_name,
  b.name_en  AS block_name_en
FROM tbl_applications a
JOIN tbl_households  h ON h.id = a.household_id
JOIN master_villages    v ON v.id = h.village_id
JOIN master_schemes     s ON s.id = a.scheme_id
JOIN master_departments d ON d.id = a.department_id
JOIN master_blocks      b ON b.id = a.block_id;

-- One row per household with SHG federation and live counts.
CREATE OR REPLACE VIEW v_household_register AS
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
  v.name_en AS village_name_en,
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
-- One row per application with everything list screens need.
-- is_overdue: still open and past its SLA due date.
CREATE OR REPLACE VIEW v_application_list AS
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
CREATE OR REPLACE VIEW v_household_register AS
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
