-- Demo DPRs in progress, so the DPR tab has drafts and ready-to-send DPRs to show.
-- Each is for a scheme that fits the Didi and that she has not applied for yet.
-- Loaded after 001 (households, schemes) and 002.

INSERT INTO tbl_dpr_drafts (household_id, scheme_id, status, current_step, cost_items, remarks, documents, updated_by)
SELECT h.id, s.id, d.status, d.step, d.items, d.remarks, d.docs, u.id
FROM (
  SELECT 'HH-BST-JGD-000108' hh, 'AH_GOAT' scheme, 'draft' status, 2 step, '[]' items, '' remarks, '[]' docs
  UNION ALL SELECT 'HH-BST-JGD-000076', 'AH_POULTRY', 'draft', 4, '[]', '', '[]'
  UNION ALL SELECT 'HH-BST-JGD-000064', 'LAC', 'draft', 3, '[]', '', '["आधार"]'
  UNION ALL SELECT 'HH-BST-JGD-000089', 'PMMSY_POND', 'filled', 7,
    '[{"item":"तालाब तैयारी","quantity":"1","amount":30000},{"item":"फिंगरलिंग बीज","quantity":"5,000","amount":24000},{"item":"मछली आहार","quantity":"12 माह","amount":42000},{"item":"जाल और उपकरण","quantity":"1 सेट","amount":24000}]',
    'दीदी को लागत और ऋण की जानकारी दी गई।', '["आधार","पासबुक","फोटो","तालाब पट्टा"]'
  UNION ALL SELECT 'HH-BST-JGD-000055', 'NHM_MICRO', 'filled', 7,
    '[{"item":"ड्रिप / स्प्रिंकलर सेट","quantity":"1.5 एकड़","amount":56000},{"item":"पंप सेट","quantity":"1","amount":16000},{"item":"स्थापना","quantity":"1","amount":8000}]',
    '', '["आधार","पासबुक","फोटो","B1-P2"]'
) d
JOIN tbl_households h ON h.hh_code = d.hh
JOIN master_schemes s ON s.code = d.scheme
JOIN master_users u ON u.mobile = '9752314412';
