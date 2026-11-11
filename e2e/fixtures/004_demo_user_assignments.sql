-- Role × area assignments for the demo logins (migration 016 backfills only the users
-- that existed when it ran, and fixtures load after the migrations).
-- Same rules as the backfill: state / admin over the state, a DPM over the district,
-- everyone else over their most specific area.
INSERT IGNORE INTO master_user_assignments (user_id, role, area_level, area_id, department_id)
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

-- The demo admin also holds every other role (one person, several roles), so the
-- navigation test can switch between them.
INSERT IGNORE INTO master_user_assignments (user_id, role, area_level, area_id, department_id)
SELECT u.id, x.role, x.level,
       CASE x.level WHEN 'district' THEN (SELECT id FROM master_districts WHERE code = 'BST')
                    WHEN 'block'    THEN (SELECT id FROM master_blocks    WHERE code = 'JGD') END,
       IF(x.role = 'department', (SELECT id FROM master_departments WHERE code = 'FISH'), NULL)
FROM master_users u
JOIN (SELECT 'state' role, 'state' level
      UNION ALL SELECT 'district',   'district'
      UNION ALL SELECT 'department', 'district'
      UNION ALL SELECT 'block',      'block'
      UNION ALL SELECT 'field',      'block') x
WHERE u.mobile = '9993000001';
