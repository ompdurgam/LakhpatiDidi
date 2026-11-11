-- Village profile (survey sections D3–D5 and natural resources), filled once per
-- village by a CRP: facilities, livelihood infrastructure, institutions, resources.
--   responses  {"facilities": {"<item>": {"available": "हाँ", "condition": "…", "distanceKm": 4}},
--               "institutions": {"<item>": {"exists": "हाँ", "status": "…", "member": "नहीं"}},
--               "needs": ["…", "…", "…"], "resources": {"ponds": 4, "pondAcres": 7.5, …}}

-- migrate:up
CREATE TABLE tbl_village_profiles (
  village_id  INT UNSIGNED NOT NULL,
  responses   LONGTEXT     NOT NULL DEFAULT ('{}') CHECK (JSON_VALID(responses)),
  updated_by  INT UNSIGNED NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (village_id),
  CONSTRAINT fk_village_profile_village FOREIGN KEY (village_id) REFERENCES master_villages (id),
  CONSTRAINT fk_village_profile_user    FOREIGN KEY (updated_by) REFERENCES master_users (id)
) ENGINE=InnoDB;

-- migrate:down
DROP TABLE IF EXISTS tbl_village_profiles;
