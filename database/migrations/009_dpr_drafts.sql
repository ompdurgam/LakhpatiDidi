-- DPR work in progress. A DPR is one scheme for one household; it is a draft while
-- the surveyor is filling it, "filled" once every step is done, and "sent" once it
-- became an application (tbl_applications), which then follows the normal workflow.

-- `documents` is the JSON list of document names the surveyor has collected.

-- migrate:up
CREATE TABLE tbl_dpr_drafts (
  id             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  household_id   INT UNSIGNED  NOT NULL,
  scheme_id      INT UNSIGNED  NOT NULL,
  status         ENUM('draft','filled','sent') NOT NULL DEFAULT 'draft',
  current_step   TINYINT UNSIGNED NOT NULL DEFAULT 1,
  cost_items     LONGTEXT      NOT NULL DEFAULT ('[]') CHECK (JSON_VALID(cost_items)),
  remarks        VARCHAR(500)  NULL,
  documents      LONGTEXT      NOT NULL DEFAULT ('[]') CHECK (JSON_VALID(documents)),
  application_id INT UNSIGNED  NULL,
  updated_by     INT UNSIGNED  NULL,
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_dpr_household_scheme (household_id, scheme_id),
  KEY ix_dpr_status (status),
  CONSTRAINT fk_dpr_household    FOREIGN KEY (household_id)   REFERENCES tbl_households (id) ON DELETE CASCADE,
  CONSTRAINT fk_dpr_scheme       FOREIGN KEY (scheme_id)      REFERENCES master_schemes (id),
  CONSTRAINT fk_dpr_application  FOREIGN KEY (application_id) REFERENCES tbl_applications (id) ON DELETE SET NULL,
  CONSTRAINT fk_dpr_user         FOREIGN KEY (updated_by)     REFERENCES master_users (id) ON DELETE SET NULL,
  CONSTRAINT ck_dpr_step CHECK (current_step BETWEEN 1 AND 7)
) ENGINE=InnoDB;

-- migrate:down
DROP TABLE IF EXISTS tbl_dpr_drafts;
