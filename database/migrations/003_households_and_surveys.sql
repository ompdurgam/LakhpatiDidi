-- Households (one per SHG Didi), surveys, income, loans and entitlement gaps.

-- migrate:up
CREATE TABLE tbl_households (
  id                    INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  hh_code               VARCHAR(30)   NOT NULL,
  didi_name             VARCHAR(120)  NOT NULL,
  didi_name_en          VARCHAR(120)  NULL COMMENT 'Latin transliteration, used for initials',
  guardian_name         VARCHAR(120)  NULL,
  age                   TINYINT UNSIGNED NULL,
  mobile                CHAR(10)      NULL,
  village_id            INT UNSIGNED  NOT NULL,
  shg_id                INT UNSIGNED  NULL,
  social_category       ENUM('ST','SC','OBC','GEN') NOT NULL DEFAULT 'GEN',
  special_status        ENUM('NONE','FRA','PVTG')   NOT NULL DEFAULT 'NONE',
  is_pld                TINYINT(1)    NOT NULL DEFAULT 1 COMMENT 'Potential Lakhpati Didi',
  -- Cached from the latest submitted survey / monthly income entries.
  current_annual_income DECIMAL(12,2) NOT NULL DEFAULT 0,
  active_income_sources TINYINT UNSIGNED NOT NULL DEFAULT 0,
  lifecycle_status      ENUM('in_progress','threshold','lakhpati','single_source','gap') NOT NULL DEFAULT 'in_progress',
  surveyed_by           INT UNSIGNED  NULL,
  surveyed_at           DATETIME      NULL,
  created_at            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_households_code (hh_code),
  KEY ix_households_village (village_id),
  KEY ix_households_status (lifecycle_status),
  CONSTRAINT fk_households_village  FOREIGN KEY (village_id)  REFERENCES master_villages (id),
  CONSTRAINT fk_households_shg      FOREIGN KEY (shg_id)      REFERENCES master_shgs (id),
  CONSTRAINT fk_households_surveyor FOREIGN KEY (surveyed_by) REFERENCES master_users (id)
) ENGINE=InnoDB;

CREATE TABLE tbl_surveys (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  household_id     INT UNSIGNED NOT NULL,
  surveyor_id      INT UNSIGNED NOT NULL,
  status           ENUM('draft','submitted') NOT NULL DEFAULT 'draft',
  enabled_sections VARCHAR(30)  NOT NULL DEFAULT 'ABCDEFGHIJK',
  responses        LONGTEXT     NOT NULL DEFAULT ('{}') CHECK (JSON_VALID(responses)),
  consent_method   ENUM('OTP','thumb','sign') NULL,
  submitted_at     DATETIME     NULL,
  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_surveys_household (household_id),
  CONSTRAINT fk_surveys_household FOREIGN KEY (household_id) REFERENCES tbl_households (id) ON DELETE CASCADE,
  CONSTRAINT fk_surveys_surveyor  FOREIGN KEY (surveyor_id)  REFERENCES master_users (id)
) ENGINE=InnoDB;

-- Section B: annual income baseline per source.
CREATE TABLE tbl_household_income_sources (
  id             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  household_id   INT UNSIGNED  NOT NULL,
  survey_id      INT UNSIGNED  NULL,
  source_name    VARCHAR(80)   NOT NULL,
  months_active  VARCHAR(60)   NOT NULL DEFAULT '' COMMENT 'Comma-separated Jan..Dec',
  gross_income   DECIMAL(12,2) NOT NULL DEFAULT 0,
  cost           DECIMAL(12,2) NOT NULL DEFAULT 0,
  net_income     DECIMAL(12,2) AS (gross_income - cost) STORED,
  financial_year CHAR(7)       NOT NULL COMMENT 'e.g. 2026-27',
  PRIMARY KEY (id),
  UNIQUE KEY uq_income_source (household_id, source_name, financial_year),
  CONSTRAINT fk_income_household FOREIGN KEY (household_id) REFERENCES tbl_households (id) ON DELETE CASCADE,
  CONSTRAINT fk_income_survey    FOREIGN KEY (survey_id)    REFERENCES tbl_surveys (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Monthly income tracking after interventions.
CREATE TABLE tbl_monthly_income_entries (
  id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  household_id INT UNSIGNED  NOT NULL,
  month        DATE          NOT NULL COMMENT 'First day of month',
  source_name  VARCHAR(80)   NOT NULL,
  amount       DECIMAL(12,2) NOT NULL,
  recorded_by  INT UNSIGNED  NULL,
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_monthly_income (household_id, month, source_name),
  CONSTRAINT fk_monthly_household FOREIGN KEY (household_id) REFERENCES tbl_households (id) ON DELETE CASCADE,
  CONSTRAINT fk_monthly_user      FOREIGN KEY (recorded_by)  REFERENCES master_users (id)
) ENGINE=InnoDB;

-- Section C: loans.
CREATE TABLE tbl_household_loans (
  id               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  household_id     INT UNSIGNED  NOT NULL,
  lender_type      ENUM('shg','bank','mfi','moneylender','relative','other') NOT NULL,
  principal        DECIMAL(12,2) NOT NULL,
  interest_rate_pa DECIMAL(5,2)  NOT NULL DEFAULT 0,
  outstanding      DECIMAL(12,2) NOT NULL DEFAULT 0,
  purpose          VARCHAR(150)  NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_loans_household FOREIGN KEY (household_id) REFERENCES tbl_households (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Section D: entitlement saturation gaps (eligible but not yet receiving).
CREATE TABLE tbl_entitlement_gaps (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  household_id  INT UNSIGNED NOT NULL,
  scheme_id     INT UNSIGNED NOT NULL,
  status        ENUM('open','closed') NOT NULL DEFAULT 'open',
  identified_on DATE         NOT NULL,
  closed_on     DATE         NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_gap (household_id, scheme_id),
  CONSTRAINT fk_gaps_household FOREIGN KEY (household_id) REFERENCES tbl_households (id) ON DELETE CASCADE,
  CONSTRAINT fk_gaps_scheme    FOREIGN KEY (scheme_id)    REFERENCES master_schemes (id)
) ENGINE=InnoDB;

-- migrate:down
DROP TABLE IF EXISTS tbl_entitlement_gaps;
DROP TABLE IF EXISTS tbl_household_loans;
DROP TABLE IF EXISTS tbl_monthly_income_entries;
DROP TABLE IF EXISTS tbl_household_income_sources;
DROP TABLE IF EXISTS tbl_surveys;
DROP TABLE IF EXISTS tbl_households;
