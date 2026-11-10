-- Demo data for Bastar district / Jagdalpur block, taken from the Figma design.
-- Dates are relative to CURDATE() so "days pending" stays realistic.
-- Reference data (state, departments, schemes, survey sections, option lists)
-- comes from migration 013_reference_data.sql, not from here.

-- ── Geography ────────────────────────────────────────────────────────────
INSERT INTO master_districts (state_id, code, name_hi, name_en)
SELECT id, 'BST', 'बस्तर', 'Bastar' FROM master_states WHERE code = 'CG';

INSERT INTO master_blocks (district_id, code, name_hi, name_en)
SELECT d.id, b.code, b.name_hi, b.name_en
FROM master_districts d
JOIN (SELECT 'JGD' code, 'जगदलपुर' name_hi, 'Jagdalpur' name_en
      UNION ALL SELECT 'BKD', 'बकावंड', 'Bakawand'
      UNION ALL SELECT 'TKP', 'तोकापाल', 'Tokapal'
      UNION ALL SELECT 'DRB', 'दरभा', 'Darbha') b
WHERE d.code = 'BST';

INSERT INTO master_gram_panchayats (block_id, code, name_hi, name_en)
SELECT id, 'JGD-BADANJI', 'बड़ांजी GP', 'Badanji GP' FROM master_blocks WHERE code = 'JGD';

INSERT INTO master_villages (gram_panchayat_id, code, name_hi, name_en)
SELECT gp.id, v.code, v.name_hi, v.name_en
FROM master_gram_panchayats gp
JOIN (SELECT 'V-BADANJI' code, 'बड़ांजी' name_hi, 'Badanji' name_en
      UNION ALL SELECT 'V-NANGUR',    'नानगुर',     'Nangur'
      UNION ALL SELECT 'V-DHURGUDA',  'धुरगुड़ा',    'Dhurguda'
      UNION ALL SELECT 'V-ADAWAL',    'आड़ावाल',     'Adawal'
      UNION ALL SELECT 'V-KUMHARAWAND','कुम्हरावंड', 'Kumharawand') v
WHERE gp.code = 'JGD-BADANJI';

-- ── SHG federations ──────────────────────────────────────────────────────
INSERT INTO master_clfs (block_id, lokos_code, name)
SELECT b.id, c.code, c.name FROM master_blocks b
JOIN (SELECT 'CLF-DANT' code, 'माँ दंतेश्वरी CLF' name
      UNION ALL SELECT 'CLF-INDR', 'इंद्रावती CLF'
      UNION ALL SELECT 'CLF-SHAK', 'शक्ति महिला CLF'
      UNION ALL SELECT 'CLF-BAML', 'माँ बमलेश्वरी CLF') c
WHERE b.code = 'JGD';

INSERT INTO master_village_organisations (clf_id, lokos_code, name)
SELECT c.id, v.code, v.name FROM master_clfs c
JOIN (SELECT 'CLF-DANT' clf, 'VO-SHAKTI' code, 'शक्ति VO' name
      UNION ALL SELECT 'CLF-INDR', 'VO-UNNATI',  'उन्नति VO'
      UNION ALL SELECT 'CLF-SHAK', 'VO-ASHA',    'आशा VO'
      UNION ALL SELECT 'CLF-BAML', 'VO-SANGWARI','संगवारी VO'
      UNION ALL SELECT 'CLF-INDR', 'VO-UDAAN',   'उड़ान VO') v ON v.clf = c.lokos_code;

INSERT INTO master_shgs (vo_id, village_id, lokos_code, name, formed_on)
SELECT vo.id, vil.id, s.code, s.name, s.formed
FROM (SELECT 'VO-SHAKTI' vo, 'V-BADANJI' village, 'SHG-001' code, 'स्वावलंबी SHG' name, DATE '2019-04-12' formed
      UNION ALL SELECT 'VO-UNNATI',  'V-KUMHARAWAND', 'SHG-002', 'जय माँ दंतेश्वरी SHG', DATE '2018-08-02'
      UNION ALL SELECT 'VO-ASHA',    'V-DHURGUDA',    'SHG-003', 'नई किरण SHG',          DATE '2020-01-20'
      UNION ALL SELECT 'VO-SANGWARI','V-ADAWAL',      'SHG-004', 'प्रगति SHG',            DATE '2017-11-05'
      UNION ALL SELECT 'VO-UDAAN',   'V-NANGUR',      'SHG-005', 'मितानिन SHG',           DATE '2019-06-30'
      UNION ALL SELECT 'VO-SHAKTI',  'V-BADANJI',     'SHG-006', 'माँ शारदा SHG',          DATE '2016-03-14'
      UNION ALL SELECT 'VO-UNNATI',  'V-KUMHARAWAND', 'SHG-007', 'सहेली SHG',             DATE '2021-02-08'
      UNION ALL SELECT 'VO-ASHA',    'V-DHURGUDA',    'SHG-008', 'भूमिका SHG',             DATE '2020-09-17') s
JOIN master_village_organisations vo ON vo.lokos_code = s.vo
JOIN master_villages vil             ON vil.code      = s.village;

-- ── Users ────────────────────────────────────────────────────────────────
INSERT INTO master_users (name, mobile, role, designation, department_id, district_id, block_id, village_id, status, last_login_at)
SELECT u.name, u.mobile, u.role, u.designation,
       (SELECT id FROM master_departments WHERE code = u.dept),
       (SELECT id FROM master_districts   WHERE code = u.district),
       (SELECT id FROM master_blocks      WHERE code = u.block),
       (SELECT id FROM master_villages    WHERE code = u.village),
       u.status, NOW() - INTERVAL u.login_hours HOUR
FROM (SELECT 'अनिल कश्यप' name, '9826143412' mobile, 'block' role, 'Block Manager (BMMU)' designation, NULL dept, 'BST' district, 'JGD' block, NULL village, 'active' status, 2 login_hours
      UNION ALL SELECT 'गीता नेताम',     '9752314412', 'field',      'CRP / Surveyor',              NULL,       'BST', 'JGD', 'V-BADANJI', 'active', 4
      UNION ALL SELECT 'आर. सिन्हा',     '9425118881', 'department', 'सहायक संचालक मत्स्य',          'FISH',     'BST', NULL,  NULL, 'active', 20
      UNION ALL SELECT 'सीमा बघेल',      '9301245176', 'district',   'DPM',                         NULL,       'BST', NULL,  NULL, 'active', 1
      UNION ALL SELECT 'SMMU अधिकारी',   '9993000101', 'state',      'SMMU अधिकारी',                NULL,       NULL,  NULL,  NULL, 'active', 30
      UNION ALL SELECT 'पोर्टल प्रशासक',  '9993000001', 'admin',      'Admin',                       NULL,       NULL,  NULL,  NULL, 'active', 50
      UNION ALL SELECT 'डॉ. सीमा नेताम', '9425200011', 'department', 'पशु चिकित्सा अधिकारी',         'AH',       'BST', NULL,  NULL, 'active', 26
      UNION ALL SELECT 'अनिता वर्मा',     '9425200022', 'department', 'नोडल अधिकारी उद्यानिकी',       'HORTI',    'BST', NULL,  NULL, 'active', 28
      UNION ALL SELECT 'के. नाग',         '9425200033', 'department', 'वन परिक्षेत्र अधिकारी',        'FOREST',   'BST', NULL,  NULL, 'active', 72
      UNION ALL SELECT 'पी. बघेल',        '9425200044', 'department', 'पशु चिकित्सा सहायक',           'AH',       'BST', NULL,  NULL, 'active', 96
      UNION ALL SELECT 'आर. साहू',        '9425200055', 'department', 'ग्रामीण उद्यान विस्तार अधिकारी','HORTI',    'BST', NULL,  NULL, 'active', 120
      UNION ALL SELECT 'एस. कश्यप',       '9425200066', 'department', 'वनपाल',                        'FOREST',   'BST', NULL,  NULL, 'active', 144
      UNION ALL SELECT 'वी. सिन्हा',      '9425200077', 'department', 'महाप्रबंधक DTIC',              'DTIC',     'BST', NULL,  NULL, 'active', 48
      UNION ALL SELECT 'एम. ठाकुर',       '9425200088', 'department', 'सहायक प्रबंधक DTIC',           'DTIC',     'BST', NULL,  NULL, 'active', 168
      UNION ALL SELECT 'रमेश ठाकुर',      '9752300099', 'field',      'CRP',                         NULL,       'BST', 'JGD', 'V-NANGUR', 'locked', 400) u;

INSERT INTO master_officer_mappings (block_id, department_id, scheme_id, officer_user_id, backup_user_id)
SELECT b.id, d.id, s.id, o.id, bk.id
FROM (SELECT 'JGD' block, 'FISH' dept, 'PMMSY_POND' scheme, '9425118881' officer, '9425200033' backup
      UNION ALL SELECT 'JGD', 'AH',     'AH_POULTRY', '9425200011', '9425200044'
      UNION ALL SELECT 'BKD', 'HORTI',  'NHM_MICRO',  '9425200022', '9425200055'
      UNION ALL SELECT 'TKP', 'FOREST', 'LAC',        '9425200033', '9425200066'
      UNION ALL SELECT 'DRB', 'DTIC',   'PMEGP',      '9425200077', '9425200088') m
JOIN master_blocks b      ON b.code   = m.block
JOIN master_departments d ON d.code   = m.dept
JOIN master_schemes s     ON s.code   = m.scheme
JOIN master_users o       ON o.mobile = m.officer
JOIN master_users bk      ON bk.mobile = m.backup;

-- ── Households ───────────────────────────────────────────────────────────
INSERT INTO tbl_households (hh_code, didi_name, guardian_name, age, mobile, village_id, shg_id, social_category, special_status,
                        is_pld, current_annual_income, active_income_sources, lifecycle_status, surveyed_by, surveyed_at, updated_at)
SELECT CONCAT('HH-BST-JGD-', h.num), h.name, h.guardian, h.age, h.mobile,
       (SELECT id FROM master_villages WHERE code = h.village),
       (SELECT id FROM master_shgs     WHERE lokos_code = h.shg),
       h.cat, h.special, h.pld, h.income, h.sources, h.status,
       (SELECT id FROM master_users WHERE mobile = '9752314412'),
       NOW() - INTERVAL (h.updated + 14) DAY,
       NOW() - INTERVAL h.updated DAY
FROM (SELECT '000123' num, 'सुनीता कश्यप' name, 'राम कश्यप' guardian, 34 age, '9826100123' mobile, 'V-BADANJI' village, 'SHG-001' shg, 'ST' cat, 'FRA' special, 1 pld, 78500 income, 3 sources, 'in_progress' status, 0 updated
      UNION ALL SELECT '000119', 'मंगली बघेल',      'सोनू बघेल',     41, '9826100119', 'V-KUMHARAWAND', 'SHG-002', 'ST',  'PVTG', 1, 104000, 3, 'lakhpati',      1
      UNION ALL SELECT '000116', 'सीता नाग',        'मंगल नाग',      29, '9826100116', 'V-DHURGUDA',    'SHG-003', 'ST',  'FRA',  1, 62000,  1, 'single_source', 2
      UNION ALL SELECT '000108', 'कमला कश्यप',      'भीमा कश्यप',    38, '9826100108', 'V-ADAWAL',      'SHG-004', 'OBC', 'NONE', 1, 88000,  2, 'threshold',     3
      UNION ALL SELECT '000102', 'लखमी मौर्य',      'सुखराम मौर्य',  45, '9826100102', 'V-NANGUR',      'SHG-005', 'ST',  'PVTG', 0, 45500,  2, 'gap',           4
      UNION ALL SELECT '000097', 'बुधरी नेताम',     'लखन नेताम',     50, '9826100097', 'V-BADANJI',     'SHG-006', 'ST',  'FRA',  1, 112500, 4, 'lakhpati',      5
      UNION ALL SELECT '000089', 'रुक्मणी सेठिया',  'दिनेश सेठिया',  36, '9826100089', 'V-KUMHARAWAND', 'SHG-007', 'OBC', 'NONE', 1, 72000,  2, 'in_progress',   6
      UNION ALL SELECT '000081', 'फूलमती कश्यप',    'रामलाल कश्यप',  42, '9826100081', 'V-DHURGUDA',    'SHG-008', 'SC',  'NONE', 1, 96000,  1, 'single_source', 7
      UNION ALL SELECT '000076', 'दशरी बघेल',       'सोमारू बघेल',   31, '9826100076', 'V-BADANJI',     'SHG-001', 'ST',  'NONE', 1, 58000,  2, 'in_progress',   8
      UNION ALL SELECT '000071', 'सुकमती नाग',      'हिड़मा नाग',     47, '9826100071', 'V-NANGUR',      'SHG-005', 'ST',  'PVTG', 0, 41000,  1, 'gap',           8
      UNION ALL SELECT '000068', 'जमुना मौर्य',      'गोपाल मौर्य',   35, '9826100068', 'V-ADAWAL',      'SHG-004', 'OBC', 'NONE', 1, 84000,  2, 'threshold',     9
      UNION ALL SELECT '000064', 'गंगोत्री नेताम',   'बुधराम नेताम',  28, '9826100064', 'V-BADANJI',     'SHG-006', 'ST',  'FRA',  1, 66000,  2, 'in_progress',   9
      UNION ALL SELECT '000059', 'बिमला कश्यप',     'जगत कश्यप',     39, '9826100059', 'V-KUMHARAWAND', 'SHG-007', 'SC',  'NONE', 1, 70500,  2, 'in_progress',   10
      UNION ALL SELECT '000055', 'पार्वती नाग',      'चैतू नाग',       44, '9826100055', 'V-NANGUR',      'SHG-005', 'ST',  'NONE', 1, 92000,  3, 'threshold',     10
      UNION ALL SELECT '000052', 'सोनमती बघेल',     'पांडू बघेल',     33, '9826100052', 'V-DHURGUDA',    'SHG-003', 'ST',  'FRA',  1, 54000,  1, 'single_source', 11
      UNION ALL SELECT '000047', 'कौशल्या नाग',      'मासा नाग',       40, '9826100047', 'V-ADAWAL',      'SHG-004', 'ST',  'PVTG', 0, 49500,  2, 'gap',           12
      UNION ALL SELECT '000043', 'मानकुंवर कश्यप',  'बलराम कश्यप',   37, '9826100043', 'V-BADANJI',     'SHG-001', 'ST',  'FRA',  1, 61000,  2, 'in_progress',   12) h;

UPDATE tbl_households h
JOIN (SELECT '000123' num, 'Sunita Kashyap' en UNION ALL SELECT '000119', 'Mangli Baghel'
      UNION ALL SELECT '000116', 'Sita Nag'        UNION ALL SELECT '000108', 'Kamla Kashyap'
      UNION ALL SELECT '000102', 'Lakhmi Maurya'   UNION ALL SELECT '000097', 'Budhri Netam'
      UNION ALL SELECT '000089', 'Rukmani Sethiya' UNION ALL SELECT '000081', 'Phoolmati Kashyap'
      UNION ALL SELECT '000076', 'Dashri Baghel'   UNION ALL SELECT '000071', 'Sukmati Nag'
      UNION ALL SELECT '000068', 'Jamuna Maurya'   UNION ALL SELECT '000064', 'Gangotri Netam'
      UNION ALL SELECT '000059', 'Bimla Kashyap'   UNION ALL SELECT '000055', 'Parvati Nag'
      UNION ALL SELECT '000052', 'Sonmati Baghel'  UNION ALL SELECT '000047', 'Kaushalya Nag'
      UNION ALL SELECT '000043', 'Mankunwar Kashyap') n ON h.hh_code = CONCAT('HH-BST-JGD-', n.num)
SET h.didi_name_en = n.en;

-- Income baseline for the showcase household (matches the survey defaults: ₹78,500 net).
INSERT INTO tbl_household_income_sources (household_id, source_name, months_active, gross_income, cost, financial_year)
SELECT h.id, s.name, s.months, s.gross, s.cost, '2026-27'
FROM tbl_households h
JOIN (SELECT 'फसल/खेती' name, 'Jun,Jul,Aug,Sep,Oct,Nov' months, 42000 gross, 10000 cost
      UNION ALL SELECT 'वन उपज',        'Mar,Apr,May',                          24000, 5500
      UNION ALL SELECT 'स्थानीय मजदूरी', 'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct', 30000, 2000) s
WHERE h.hh_code = 'HH-BST-JGD-000123';

INSERT INTO tbl_household_loans (household_id, lender_type, principal, interest_rate_pa, outstanding, purpose)
SELECT id, 'shg', 25000, 12, 14000, 'बीज एवं खाद' FROM tbl_households WHERE hh_code = 'HH-BST-JGD-000123';

-- Entitlement gaps: number of open gaps per household as shown in the register.
INSERT INTO tbl_entitlement_gaps (household_id, scheme_id, status, identified_on)
SELECT h.id, s.id, 'open', CURDATE() - INTERVAL 14 DAY
FROM tbl_households h
JOIN (SELECT '000123' num, 'PMJJBY' scheme
      UNION ALL SELECT '000116', 'PM_KISAN'   UNION ALL SELECT '000116', 'PMSBY'  UNION ALL SELECT '000116', 'MGNREGA_JC'
      UNION ALL SELECT '000108', 'PMSBY'
      UNION ALL SELECT '000102', 'PM_KISAN'   UNION ALL SELECT '000102', 'PMJJBY' UNION ALL SELECT '000102', 'MAHTARI' UNION ALL SELECT '000102', 'PMAYG'
      UNION ALL SELECT '000089', 'PMJJBY'     UNION ALL SELECT '000089', 'MGNREGA_JC'
      UNION ALL SELECT '000081', 'PMSBY'
      UNION ALL SELECT '000076', 'PM_KISAN'
      UNION ALL SELECT '000071', 'PMJJBY'     UNION ALL SELECT '000071', 'PMSBY'  UNION ALL SELECT '000071', 'MGNREGA_JC'
      UNION ALL SELECT '000064', 'PMSBY'
      UNION ALL SELECT '000059', 'PMJJBY'
      UNION ALL SELECT '000052', 'PM_KISAN'   UNION ALL SELECT '000052', 'PMAYG'
      UNION ALL SELECT '000047', 'MAHTARI'    UNION ALL SELECT '000047', 'PMJJBY'
      UNION ALL SELECT '000043', 'PMSBY') g ON h.hh_code = CONCAT('HH-BST-JGD-', g.num)
JOIN master_schemes s ON s.code = g.scheme;

-- A submitted survey for the showcase household.
INSERT INTO tbl_surveys (household_id, surveyor_id, status, responses, consent_method, submitted_at)
SELECT h.id, u.id, 'submitted',
       '{"SHG सदस्य का नाम":"सुनीता कश्यप","माता-पिता/पति का नाम":"राम कश्यप","आयु":"34"}',
       'OTP', NOW() - INTERVAL 14 DAY
FROM tbl_households h, master_users u
WHERE h.hh_code = 'HH-BST-JGD-000123' AND u.mobile = '9752314412';

-- ── Applications ─────────────────────────────────────────────────────────
INSERT INTO tbl_applications (app_code, household_id, scheme_id, department_id, block_id, project_cost, subsidy_amount,
                          status, received_on, sla_due_on, escalation_level, gpdp_ref, vprp_ref,
                          sanction_order_no, sanction_date, sanctioned_amount)
SELECT a.code, h.id, s.id, s.department_id, b.id, a.cost, a.subsidy, a.status,
       CURDATE() - INTERVAL a.days DAY,
       CURDATE() - INTERVAL a.days DAY + INTERVAL s.sla_days DAY,
       a.esc,
       CONCAT('GPDP/', a.block, '/2026/', 100 + a.days),
       CONCAT('VPRP/2026/', 170 + a.days),
       IF(a.status = 'sanctioned', 'FOR/JGD/2026/112', NULL),
       IF(a.status = 'sanctioned', CURDATE() - INTERVAL 1 DAY, NULL),
       IF(a.status = 'sanctioned', a.subsidy, NULL)
FROM (SELECT 'APP-260142' code, '000123' hh, 'PMMSY_POND' scheme, 'JGD' block, 120000 cost, 72000 subsidy, 'under_review' status, 18 days, 'collector' esc
      UNION ALL SELECT 'APP-260138', '000119', 'AH_POULTRY',    'JGD', 48000,  28800,  'under_review',   12, 'none'
      UNION ALL SELECT 'APP-260131', '000116', 'NHM_MICRO',     'JGD', 72500,  39875,  'info_requested', 8,  'none'
      UNION ALL SELECT 'APP-260125', '000108', 'VANDHAN',       'JGD', 35000,  35000,  'sanctioned',     5,  'none'
      UNION ALL SELECT 'APP-260119', '000102', 'AH_GOAT',       'JGD', 90000,  54000,  'submitted',      3,  'none'
      UNION ALL SELECT 'APP-260174', '000089', 'FISH_BOATNET',  'JGD', 68000,  40800,  'under_review',   9,  'none'
      UNION ALL SELECT 'APP-260181', '000097', 'FISH_OWNPOND',  'BKD', 150000, 90000,  'submitted',      3,  'none'
      UNION ALL SELECT 'APP-260190', '000116', 'PMFBY',         'JGD', 18000,  12000,  'under_review',   4,  'none'
      UNION ALL SELECT 'APP-260191', '000108', 'NHM_MICRO',     'TKP', 72500,  39875,  'submitted',      6,  'none'
      UNION ALL SELECT 'APP-260150', '000119', 'AH_POULTRY',    'JGD', 48000,  28800,  'submitted',      2,  'none'
      UNION ALL SELECT 'APP-260198', '000081', 'LAC',           'JGD', 35000,  35000,  'under_review',   7,  'none'
      UNION ALL SELECT 'APP-260201', '000076', 'MAHTARI',       'JGD', 12000,  12000,  'submitted',      5,  'none'
      UNION ALL SELECT 'APP-260204', '000071', 'LABOUR_AID',    'BKD', 20000,  20000,  'under_review',   17, 'dpm'
      UNION ALL SELECT 'APP-260208', '000068', 'PMEGP',         'JGD', 200000, 70000,  'under_review',   8,  'none'
      UNION ALL SELECT 'APP-260211', '000064', 'SERI_TRAIN',    'JGD', 30000,  30000,  'submitted',      3,  'none'
      UNION ALL SELECT 'APP-260214', '000059', 'HANDLOOM_SHED', 'TKP', 80000,  48000,  'under_review',   6,  'none'
      UNION ALL SELECT 'APP-260217', '000055', 'CG_HOMESTAY',   'JGD', 100000, 50000,  'submitted',      4,  'none'
      UNION ALL SELECT 'APP-260220', '000052', 'MUDRA',         'JGD', 150000, 0,      'under_review',   9,  'none'
      UNION ALL SELECT 'APP-260224', '000047', 'TRIBAL_SELF',   'BKD', 90000,  45000,  'under_review',   11, 'none'
      UNION ALL SELECT 'APP-260229', '000043', 'PMAYG',         'JGD', 120000, 120000, 'under_review',   16, 'bdo') a
JOIN tbl_households h ON h.hh_code = CONCAT('HH-BST-JGD-', a.hh)
JOIN master_schemes s    ON s.code = a.scheme
JOIN master_blocks b     ON b.code = a.block;

-- DPR income estimate: ~30% of project cost (₹37,500 for the showcase pond, as in the design).
UPDATE tbl_applications SET expected_income_gain = IF(app_code = 'APP-260142', 37500, ROUND(project_cost * 0.3, -2));

-- Assign officers from the department's officer pool.
UPDATE tbl_applications a
JOIN master_departments d ON d.id = a.department_id
JOIN master_users u ON u.mobile = CASE d.code
  WHEN 'FISH'   THEN '9425118881'
  WHEN 'AH'     THEN '9425200011'
  WHEN 'HORTI'  THEN '9425200022'
  WHEN 'FOREST' THEN '9425200033'
  WHEN 'DTIC'   THEN '9425200077'
END
SET a.assigned_officer_id = u.id;

-- Timeline events derived from status.
INSERT INTO tbl_application_events (application_id, event_type, to_status, note, actor_user_id, created_at)
SELECT a.id, 'dpr_submitted', 'submitted', 'CRP द्वारा DPR जमा', (SELECT id FROM master_users WHERE mobile = '9752314412'),
       TIMESTAMP(a.received_on, '10:15:00')
FROM tbl_applications a;

INSERT INTO tbl_application_events (application_id, event_type, note, actor_user_id, created_at)
SELECT a.id, 'blcc_action', 'BLCC बैठक में अनुशंसित', (SELECT id FROM master_users WHERE mobile = '9826143412'),
       TIMESTAMP(a.received_on + INTERVAL 1 DAY, '16:00:00')
FROM tbl_applications a WHERE a.status <> 'submitted';

INSERT INTO tbl_application_events (application_id, event_type, from_status, to_status, note, actor_user_id, created_at)
SELECT a.id, 'review', 'submitted', 'under_review', 'विभागीय समीक्षा प्रारंभ', a.assigned_officer_id,
       TIMESTAMP(a.received_on + INTERVAL 2 DAY, '11:30:00')
FROM tbl_applications a WHERE a.status IN ('under_review','info_requested','sanctioned');

INSERT INTO tbl_application_events (application_id, event_type, from_status, to_status, note, actor_user_id, created_at)
SELECT a.id, 'info_requested', 'under_review', 'info_requested', 'भूमि स्वामित्व प्रमाण की स्पष्ट प्रति अपलोड करें।',
       a.assigned_officer_id, TIMESTAMP(a.received_on + INTERVAL 3 DAY, '12:00:00')
FROM tbl_applications a WHERE a.status = 'info_requested';

INSERT INTO tbl_application_events (application_id, event_type, from_status, to_status, note, actor_user_id, created_at)
SELECT a.id, 'sanctioned', 'under_review', 'sanctioned', CONCAT('आदेश सं. ', a.sanction_order_no),
       a.assigned_officer_id, TIMESTAMP(a.sanction_date, '15:20:00')
FROM tbl_applications a WHERE a.status = 'sanctioned';

INSERT INTO tbl_application_events (application_id, event_type, note, actor_user_id, created_at)
SELECT a.id, 'escalated', CONCAT(UPPER(a.escalation_level), ' स्तर पर एस्केलेट'),
       (SELECT id FROM master_users WHERE mobile = '9826143412'), NOW() - INTERVAL 1 DAY
FROM tbl_applications a WHERE a.escalation_level <> 'none';

-- Standard documents for every application; land/pond proof for fisheries.
INSERT INTO tbl_application_documents (application_id, doc_type, is_verified, uploaded_at)
SELECT a.id, d.doc, 1, TIMESTAMP(a.received_on, '10:00:00')
FROM tbl_applications a
CROSS JOIN (SELECT 'आधार कार्ड' doc UNION ALL SELECT 'बैंक पासबुक' UNION ALL SELECT 'लाभार्थी फोटो'
            UNION ALL SELECT 'जाति प्रमाण पत्र' UNION ALL SELECT 'SHG प्रस्ताव') d;

INSERT INTO tbl_application_documents (application_id, doc_type, is_verified, uploaded_at)
SELECT a.id, 'तालाब पट्टा/स्वामित्व', a.app_code <> 'APP-260142', IF(a.app_code = 'APP-260142', NULL, TIMESTAMP(a.received_on, '10:00:00'))
FROM tbl_applications a JOIN master_departments d ON d.id = a.department_id WHERE d.code = 'FISH';

INSERT INTO tbl_application_documents (application_id, doc_type, is_verified)
SELECT a.id, 'भूमि दस्तावेज़', 0 FROM tbl_applications a WHERE a.app_code = 'APP-260131';

INSERT INTO tbl_application_comments (application_id, user_id, body, created_at)
SELECT a.id, u.id, c.body, NOW() - INTERVAL c.hours HOUR
FROM (SELECT 'APP-260142' app, '9425118881' mobile, 'तालाब पट्टा की स्पष्ट प्रति अपलोड करें।' body, 30 hours
      UNION ALL SELECT 'APP-260142', '9752314412', 'पट्टा पंचायत से प्राप्त हो गया है, आज अपलोड करूँगी।', 27
      UNION ALL SELECT 'APP-260131', '9425200022', 'भूमि दस्तावेज़ की स्पष्ट प्रति आवश्यक है।', 50) c
JOIN tbl_applications a ON a.app_code = c.app
JOIN master_users u        ON u.mobile   = c.mobile;

-- ── Audit log ────────────────────────────────────────────────────────────
INSERT INTO tbl_audit_logs (user_id, action, entity_type, entity_id, details, ip_address, created_at)
SELECT u.id, l.action, l.etype, l.eid, l.details, l.ip, NOW() - INTERVAL l.hours HOUR
FROM (SELECT '9993000001' mobile, 'योजना अपडेट' action, 'scheme' etype, 'PMMSY_POND' eid, 'PMMSY अनुदान नियम 60% किया' details, '10.24.18.6' ip, 5 hours
      UNION ALL SELECT '9826143412', 'यूज़र मैपिंग',    'user',     '9752314412', 'CRP गीता नेताम को बड़ांजी सौंपा', '10.24.22.9', 8
      UNION ALL SELECT '9301245176', 'भूगोल आयात',     'geography', 'BST',       'LokOS से 142 SHG आयात',         '10.24.31.4', 27
      UNION ALL SELECT '9993000001', 'फॉर्म सेटिंग',    'survey',    'J',         'पर्यटन सेक्शन विकल्प बदले',       '10.24.18.6', 33
      UNION ALL SELECT '9425118881', 'अधिकारी मैपिंग', 'mapping',   'JGD-FISH',  'मत्स्य बैकअप अधिकारी बदला',       '10.24.42.8', 52) l
JOIN master_users u ON u.mobile = l.mobile;

-- ── Didi (PLD) logins ────────────────────────────────────────────────────
-- Each surveyed Didi can sign in with her own mobile (staff numbers win on conflict).
INSERT IGNORE INTO master_users (name, mobile, role, designation, village_id)
SELECT h.didi_name, h.mobile, 'didi', 'Didi (PLD)', h.village_id
FROM tbl_households h
WHERE h.mobile REGEXP '^[6-9][0-9]{9}$';
