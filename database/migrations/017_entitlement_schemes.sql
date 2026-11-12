-- Survey section D asks about 50 government entitlements (pensions, ration card,
-- Ayushman, Jan Dhan, certificates…). An answer of "not applied" / "pending" is an
-- entitlement gap, tracked in tbl_entitlement_gaps against master_schemes. Until now
-- only 5 of them were in the scheme master, so the rest could not be tracked.
--
-- These are added as category 'entitlement' with the survey's exact Hindi names. They
-- have no recommendation rule, so they are never suggested for a DPR / application.

-- migrate:up
INSERT IGNORE INTO master_departments (code, name_hi, name_en) VALUES
  ('SOCIAL',  'समाज कल्याण विभाग',           'Social Welfare'),
  ('FOOD',    'खाद्य एवं PHE विभाग',          'Food & PHE'),
  ('HEALTH',  'स्वास्थ्य विभाग',              'Health'),
  ('EDU',     'शिक्षा एवं कौशल विभाग',        'Education & Skills'),
  ('REVENUE', 'राजस्व एवं नागरिक सेवाएँ',      'Revenue & Civic Services');

INSERT IGNORE INTO master_schemes (code, department_id, name_hi, name_en, category, max_project_cost, subsidy_percent, sla_days)
SELECT s.code, d.id, s.name_hi, s.name_en, 'entitlement', NULL, 100, 30
FROM (SELECT 'ENT_NRLM_SHG' code, 'PRD' dept, 'NRLM SHG सदस्यता' name_hi, 'NRLM SHG membership' name_en
      UNION ALL SELECT 'ENT_IHHL',        'PRD',     'IHHL शौचालय',               'IHHL toilet'
      UNION ALL SELECT 'ENT_DDUGKY',      'PRD',     'DDU-GKY',                   'DDU-GKY'
      UNION ALL SELECT 'ENT_OLD_PENSION', 'SOCIAL',  'वृद्धावस्था पेंशन',          'Old-age pension'
      UNION ALL SELECT 'ENT_WIDOW_PENSION','SOCIAL', 'विधवा पेंशन',                'Widow pension'
      UNION ALL SELECT 'ENT_DIVYANG_PENSION','SOCIAL','दिव्यांग पेंशन',            'Disability pension'
      UNION ALL SELECT 'ENT_JJM_TAP',     'FOOD',    'जल जीवन मिशन नल',           'Jal Jeevan Mission tap'
      UNION ALL SELECT 'ENT_RATION',      'FOOD',    'राशन कार्ड/PMGKAY',         'Ration card / PMGKAY'
      UNION ALL SELECT 'ENT_UJJWALA',     'FOOD',    'उज्ज्वला',                  'Ujjwala'
      UNION ALL SELECT 'ENT_SAUBHAGYA',   'FOOD',    'सौभाग्य',                   'Saubhagya'
      UNION ALL SELECT 'ENT_SURYA_GHAR',  'FOOD',    'PM सूर्य घर',               'PM Surya Ghar'
      UNION ALL SELECT 'ENT_AYUSHMAN',    'HEALTH',  'आयुष्मान कार्ड',            'Ayushman card'
      UNION ALL SELECT 'ENT_ANGANWADI',   'WCD',     'आंगनवाड़ी/पोषण 2.0',        'Anganwadi / Poshan 2.0'
      UNION ALL SELECT 'ENT_JSY',         'HEALTH',  'JSY',                       'Janani Suraksha Yojana'
      UNION ALL SELECT 'ENT_INDRADHANUSH','HEALTH',  'मिशन इंद्रधनुष टीकाकरण',     'Mission Indradhanush immunisation'
      UNION ALL SELECT 'ENT_PMMVY',       'WCD',     'PMMVY',                     'PMMVY'
      UNION ALL SELECT 'ENT_PMSMA',       'HEALTH',  'PMSMA',                     'PMSMA'
      UNION ALL SELECT 'ENT_KCC',         'AGRI',    'KCC',                       'Kisan Credit Card'
      UNION ALL SELECT 'ENT_SOIL_CARD',   'AGRI',    'मृदा स्वास्थ्य कार्ड',       'Soil Health Card'
      UNION ALL SELECT 'ENT_SAMAGRA',     'EDU',     'समग्र शिक्षा',              'Samagra Shiksha'
      UNION ALL SELECT 'ENT_PMKVY',       'EDU',     'PMKVY/कौशल',                'PMKVY / skilling'
      UNION ALL SELECT 'ENT_ST_SCHOLAR',  'EDU',     'ST छात्रवृत्ति',             'ST scholarship'
      UNION ALL SELECT 'ENT_JANDHAN',     'BANK',    'जन धन खाता',                'Jan Dhan account'
      UNION ALL SELECT 'ENT_VISHWAKARMA', 'DTIC',    'PM विश्वकर्मा',              'PM Vishwakarma'
      UNION ALL SELECT 'ENT_SVANIDHI',    'BANK',    'PM स्वनिधि',                'PM SVANidhi'
      UNION ALL SELECT 'ENT_AADHAAR',     'REVENUE', 'आधार',                      'Aadhaar'
      UNION ALL SELECT 'ENT_FRA',         'REVENUE', 'FRA वन अधिकार पट्टा',        'FRA forest rights title'
      UNION ALL SELECT 'ENT_CASTE_CERT',  'REVENUE', 'जाति प्रमाण पत्र',          'Caste certificate'
      UNION ALL SELECT 'ENT_BIRTH_CERT',  'REVENUE', 'जन्म प्रमाण पत्र',          'Birth certificate'
      UNION ALL SELECT 'ENT_DOMICILE',    'REVENUE', 'निवास प्रमाण पत्र',         'Domicile certificate'
      UNION ALL SELECT 'ENT_MARRIAGE',    'REVENUE', 'विवाह प्रमाण पत्र',         'Marriage certificate'
      UNION ALL SELECT 'ENT_DEATH_CERT',  'REVENUE', 'मृत्यु प्रमाण पत्र',        'Death certificate'
      UNION ALL SELECT 'ENT_EWS',         'REVENUE', 'EWS प्रमाण पत्र',            'EWS certificate'
      UNION ALL SELECT 'ENT_VOTER',       'REVENUE', 'मतदाता कार्ड',               'Voter ID'
      UNION ALL SELECT 'ENT_LABOUR_CARD', 'LABOUR',  'श्रम कार्ड',                 'Labour card') s
JOIN master_departments d ON d.code = s.dept;

-- migrate:down
DELETE g FROM tbl_entitlement_gaps g JOIN master_schemes s ON s.id = g.scheme_id WHERE s.code LIKE 'ENT\_%';
DELETE FROM master_schemes WHERE code LIKE 'ENT\_%';
DELETE FROM master_departments WHERE code IN ('SOCIAL', 'FOOD', 'HEALTH', 'EDU', 'REVENUE');
