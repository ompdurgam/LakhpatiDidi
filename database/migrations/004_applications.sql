-- Scheme applications (DPRs) routed to line departments, with their
-- event timeline, documents and comment thread.

-- migrate:up
CREATE TABLE tbl_applications (
  id                  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  app_code            VARCHAR(20)   NOT NULL,
  household_id        INT UNSIGNED  NOT NULL,
  scheme_id           INT UNSIGNED  NOT NULL,
  department_id       INT UNSIGNED  NOT NULL COMMENT 'Copied from scheme for fast inbox filtering',
  block_id            INT UNSIGNED  NOT NULL COMMENT 'Routing block',
  project_cost        DECIMAL(12,2) NOT NULL,
  subsidy_amount      DECIMAL(12,2) NOT NULL DEFAULT 0,
  expected_income_gain DECIMAL(12,2) NOT NULL DEFAULT 0 COMMENT 'DPR estimate of added annual income',
  status             ENUM('submitted','under_review','info_requested','sanctioned','rejected','delivered') NOT NULL DEFAULT 'submitted',
  received_on         DATE          NOT NULL,
  sla_due_on          DATE          NOT NULL,
  assigned_officer_id INT UNSIGNED  NULL,
  escalation_level    ENUM('none','bdo','dpm','collector') NOT NULL DEFAULT 'none',
  gpdp_ref            VARCHAR(40)   NULL,
  vprp_ref            VARCHAR(40)   NULL,
  sanction_order_no   VARCHAR(60)   NULL,
  sanction_date       DATE          NULL,
  sanctioned_amount   DECIMAL(12,2) NULL,
  rejection_reason    VARCHAR(120)  NULL,
  delivered_on        DATE          NULL,
  asset_description   VARCHAR(255)  NULL,
  geo_lat             DECIMAL(9,6)  NULL,
  geo_lng             DECIMAL(9,6)  NULL,
  created_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_applications_code (app_code),
  KEY ix_app_department_status (department_id, status),
  KEY ix_app_block_status (block_id, status),
  KEY ix_app_household (household_id),
  CONSTRAINT fk_app_household FOREIGN KEY (household_id)        REFERENCES tbl_households (id),
  CONSTRAINT fk_app_scheme    FOREIGN KEY (scheme_id)           REFERENCES master_schemes (id),
  CONSTRAINT fk_app_dept      FOREIGN KEY (department_id)       REFERENCES master_departments (id),
  CONSTRAINT fk_app_block     FOREIGN KEY (block_id)            REFERENCES master_blocks (id),
  CONSTRAINT fk_app_officer   FOREIGN KEY (assigned_officer_id) REFERENCES master_users (id),
  CONSTRAINT ck_app_amounts CHECK (project_cost >= 0 AND subsidy_amount >= 0 AND subsidy_amount <= project_cost)
) ENGINE=InnoDB;

CREATE TABLE tbl_application_events (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  application_id INT UNSIGNED NOT NULL,
  event_type     ENUM('dpr_submitted','blcc_action','review','accepted','info_requested','sanctioned','rejected','delivered','income_active','follow_up','escalated') NOT NULL,
  from_status    VARCHAR(20)  NULL,
  to_status      VARCHAR(20)  NULL,
  note           TEXT         NULL,
  actor_user_id  INT UNSIGNED NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_events_application (application_id, created_at),
  CONSTRAINT fk_events_application FOREIGN KEY (application_id) REFERENCES tbl_applications (id) ON DELETE CASCADE,
  CONSTRAINT fk_events_actor       FOREIGN KEY (actor_user_id)  REFERENCES master_users (id)
) ENGINE=InnoDB;

CREATE TABLE tbl_application_documents (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  application_id INT UNSIGNED NOT NULL,
  doc_type       VARCHAR(60)  NOT NULL,
  is_verified    TINYINT(1)   NOT NULL DEFAULT 0,
  file_path      VARCHAR(255) NULL,
  uploaded_at    DATETIME     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_app_doc (application_id, doc_type),
  CONSTRAINT fk_docs_application FOREIGN KEY (application_id) REFERENCES tbl_applications (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE tbl_application_comments (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  application_id INT UNSIGNED NOT NULL,
  user_id        INT UNSIGNED NOT NULL,
  body           TEXT         NOT NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_comments_application (application_id, created_at),
  CONSTRAINT fk_comments_application FOREIGN KEY (application_id) REFERENCES tbl_applications (id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_user        FOREIGN KEY (user_id)        REFERENCES master_users (id)
) ENGINE=InnoDB;

-- migrate:down
DROP TABLE IF EXISTS tbl_application_comments;
DROP TABLE IF EXISTS tbl_application_documents;
DROP TABLE IF EXISTS tbl_application_events;
DROP TABLE IF EXISTS tbl_applications;
