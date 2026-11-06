-- "Didi (PLD)" login role: a Didi signs in with her own mobile and sees only
-- her own household (matched by tbl_households.mobile), never other people's data.

-- migrate:up
ALTER TABLE master_users
  MODIFY role ENUM('field','block','department','district','state','admin','didi') NOT NULL;

-- Every surveyed Didi with a valid mobile can log in. Staff numbers win on conflict.
INSERT IGNORE INTO master_users (name, mobile, role, designation, village_id)
SELECT h.didi_name, h.mobile, 'didi', 'Didi (PLD)', h.village_id
FROM tbl_households h
WHERE h.mobile REGEXP '^[6-9][0-9]{9}$';

-- migrate:down
DELETE FROM master_users WHERE role = 'didi';
ALTER TABLE master_users
  MODIFY role ENUM('field','block','department','district','state','admin') NOT NULL;
