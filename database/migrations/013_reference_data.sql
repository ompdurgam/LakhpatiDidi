-- Reference data every installation needs, demo or production: the state, the
-- line departments, their schemes, the survey sections and the shared option lists.
-- Until now it was only in database/seeds/001_demo_data.sql, so a database without
-- the demo data had no departments or schemes, and `npm run geo:lgd` refused to run.
--
-- INSERT IGNORE skips rows that already exist (matched on code / name), so databases
-- that were seeded earlier keep their rows, including any edits made by admins.

-- migrate:up
INSERT IGNORE INTO master_states (code, name_hi, name_en) VALUES ('CG', 'छत्तीसगढ़', 'Chhattisgarh');

INSERT IGNORE INTO master_departments (code, name_hi, name_en) VALUES
  ('FISH',     'मत्स्य विभाग',                    'Fisheries'),
  ('AGRI',     'कृषि विभाग',                       'Agriculture'),
  ('HORTI',    'उद्यानिकी विभाग',                  'Horticulture'),
  ('AH',       'पशुपालन विभाग',                    'Animal Husbandry'),
  ('FOREST',   'वन / CGMFP',                       'Forest / CGMFP'),
  ('WCD',      'महिला एवं बाल विकास',              'Women & Child Development'),
  ('LABOUR',   'श्रम विभाग',                        'Labour'),
  ('DTIC',     'DTIC / उद्योग',                    'DTIC / Industries'),
  ('SERI',     'रेशम विभाग',                        'Sericulture'),
  ('HANDLOOM', 'हथकरघा विभाग',                     'Handloom'),
  ('TOURISM',  'पर्यटन विभाग',                      'Tourism'),
  ('BANK',     'संस्थागत वित्त/बैंक',               'Institutional Finance / Banks'),
  ('ANTYA',    'अंत्यावसायी सहकारी विकास समिति',     'Antyavasayi Cooperative Society'),
  ('PRD',      'पंचायत एवं ग्रामीण विकास',          'Panchayat & Rural Development');

INSERT IGNORE INTO master_schemes (code, department_id, name_hi, name_en, category, max_project_cost, subsidy_percent, sla_days)
SELECT s.code, d.id, s.name_hi, s.name_en, s.category, s.max_cost, s.subsidy, 15
FROM (SELECT 'PMMSY_POND' code, 'FISH' dept, 'PMMSY – तालाब' name_hi, 'PMMSY – Pond' name_en, 'livelihood' category, 150000 max_cost, 60 subsidy
      UNION ALL SELECT 'FISH_BOATNET',  'FISH',     'नाव / जाल अनुदान',     'Boat / Net subsidy',      'livelihood', 80000,  60
      UNION ALL SELECT 'FISH_OWNPOND',  'FISH',     'निजी भूमि तालाब',       'Own-land pond',           'livelihood', 200000, 60
      UNION ALL SELECT 'PMFBY',         'AGRI',     'PM फसल बीमा',          'PM Fasal Bima',           'entitlement', NULL,  66.67
      UNION ALL SELECT 'PM_KISAN',      'AGRI',     'PM किसान',             'PM Kisan',                'entitlement', NULL,  100
      UNION ALL SELECT 'NHM_MICRO',     'HORTI',    'NHM सूक्ष्म सिंचाई',    'NHM Micro Irrigation',    'livelihood', 100000, 55
      UNION ALL SELECT 'AH_POULTRY',    'AH',       'बैकयार्ड पोल्ट्री',     'Backyard Poultry',        'livelihood', 60000,  60
      UNION ALL SELECT 'AH_GOAT',       'AH',       'बकरी पालन',            'Goat Rearing',            'livelihood', 100000, 60
      UNION ALL SELECT 'VANDHAN',       'FOREST',   'वन धन विकास',          'Van Dhan Vikas',          'livelihood', 50000,  100
      UNION ALL SELECT 'LAC',           'FOREST',   'लाख विकास',            'Lac Development',         'livelihood', 50000,  100
      UNION ALL SELECT 'MAHTARI',       'WCD',      'महतारी वंदन',          'Mahtari Vandan',          'entitlement', NULL,  100
      UNION ALL SELECT 'LABOUR_AID',    'LABOUR',   'श्रमिक सहायता',        'Worker Assistance',       'entitlement', NULL,  100
      UNION ALL SELECT 'PMEGP',         'DTIC',     'PMEGP',                'PMEGP',                   'credit',     500000, 35
      UNION ALL SELECT 'SERI_TRAIN',    'SERI',     'रेशम प्रशिक्षण',        'Sericulture Training',    'skill',      30000,  100
      UNION ALL SELECT 'HANDLOOM_SHED', 'HANDLOOM', 'बुनकर कार्यशेड',       'Weaver Workshed',         'livelihood', 100000, 60
      UNION ALL SELECT 'CG_HOMESTAY',   'TOURISM',  'CG होमस्टे',           'CG Homestay',             'livelihood', 150000, 50
      UNION ALL SELECT 'MUDRA',         'BANK',     'मुद्रा ऋण',             'Mudra Loan',              'credit',     1000000, 0
      UNION ALL SELECT 'PMJJBY',        'BANK',     'PMJJBY बीमा',          'PMJJBY Insurance',        'entitlement', NULL,  100
      UNION ALL SELECT 'PMSBY',         'BANK',     'PMSBY बीमा',           'PMSBY Insurance',         'entitlement', NULL,  100
      UNION ALL SELECT 'TRIBAL_SELF',   'ANTYA',    'आदिवासी स्वरोजगार',     'Tribal Self-employment',  'credit',     150000, 50
      UNION ALL SELECT 'PMAYG',         'PRD',      'PMAY-G',               'PMAY-G',                  'entitlement', NULL,  100
      UNION ALL SELECT 'MGNREGA_JC',    'PRD',      'मनरेगा जॉब कार्ड',      'MGNREGA Job Card',        'entitlement', NULL,  100) s
JOIN master_departments d ON d.code = s.dept;

INSERT IGNORE INTO master_survey_sections (code, name_hi, sort_order) VALUES
  ('A','पहचान',1), ('B','आय',2), ('C','ऋण',3), ('D','योजनाएँ',4), ('E','कृषि',5), ('F','पशुधन',6),
  ('G','मत्स्य',7), ('H','वन उपज',8), ('I','गैर-कृषि',9), ('J','पर्यटन',10), ('K','मजदूरी',11);

INSERT IGNORE INTO master_option_lists (name, options) VALUES
  ('सामाजिक वर्ग', '["सामान्य","ST","SC","OBC"]'),
  ('भूमि स्थिति',  '["भूमिहीन","स्वामित्व","पट्टा","बटाई","FRA"]'),
  ('जलवायु जोखिम', '["सूखा","बाढ़","गर्मी","कीट","असमय वर्षा"]');

-- migrate:down
-- Intentionally empty. Households, applications, users and officer mappings point at
-- these rows, and the runner turns foreign-key checks off during rollback, so deleting
-- them here would silently orphan that data. Rolling back only unmarks the migration;
-- re-applying it is a no-op thanks to INSERT IGNORE.
