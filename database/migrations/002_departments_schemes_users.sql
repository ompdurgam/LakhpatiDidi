-- Line departments, scheme master, portal users, OTP auth and officer routing.

-- migrate:up
CREATE TABLE master_departments (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code        VARCHAR(20)  NOT NULL,
  name_hi     VARCHAR(150) NOT NULL,
  name_en     VARCHAR(150) NOT NULL,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_departments_code (code)
) ENGINE=InnoDB;

CREATE TABLE master_schemes (
  id               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  code             VARCHAR(30)   NOT NULL,
  department_id    INT UNSIGNED  NOT NULL,
  name_hi          VARCHAR(150)  NOT NULL,
  name_en          VARCHAR(150)  NOT NULL,
  category         ENUM('livelihood','entitlement','credit','skill') NOT NULL DEFAULT 'livelihood',
  max_project_cost DECIMAL(12,2) NULL,
  subsidy_percent  DECIMAL(5,2)  NOT NULL DEFAULT 0,
  sla_days         SMALLINT UNSIGNED NOT NULL DEFAULT 15,
  is_active        TINYINT(1)    NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_schemes_code (code),
  KEY ix_schemes_department (department_id),
  CONSTRAINT fk_schemes_department FOREIGN KEY (department_id) REFERENCES master_departments (id),
  CONSTRAINT ck_schemes_subsidy CHECK (subsidy_percent BETWEEN 0 AND 100)
) ENGINE=InnoDB;

CREATE TABLE master_users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(120) NOT NULL,
  mobile        CHAR(10)     NOT NULL,
  role          ENUM('field','block','department','district','state','admin') NOT NULL,
  designation   VARCHAR(120) NOT NULL,
  department_id INT UNSIGNED NULL,
  district_id   INT UNSIGNED NULL,
  block_id      INT UNSIGNED NULL,
  village_id    INT UNSIGNED NULL,
  status        ENUM('active','locked') NOT NULL DEFAULT 'active',
  last_login_at DATETIME     NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_mobile (mobile),
  KEY ix_users_role (role),
  CONSTRAINT fk_users_department FOREIGN KEY (department_id) REFERENCES master_departments (id),
  CONSTRAINT fk_users_district   FOREIGN KEY (district_id)   REFERENCES master_districts (id),
  CONSTRAINT fk_users_block      FOREIGN KEY (block_id)      REFERENCES master_blocks (id),
  CONSTRAINT fk_users_village    FOREIGN KEY (village_id)    REFERENCES master_villages (id),
  CONSTRAINT ck_users_mobile CHECK (mobile REGEXP '^[6-9][0-9]{9}$')
) ENGINE=InnoDB;

-- OTPs are stored only as SHA-256 hashes.
CREATE TABLE tbl_otp_requests (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  mobile      CHAR(10)  NOT NULL,
  otp_hash    CHAR(64)  NOT NULL,
  attempts    TINYINT UNSIGNED NOT NULL DEFAULT 0,
  expires_at  DATETIME  NOT NULL,
  consumed_at DATETIME  NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_otp_mobile_created (mobile, created_at)
) ENGINE=InnoDB;

-- Session tokens are stored only as SHA-256 hashes.
CREATE TABLE tbl_user_sessions (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED NOT NULL,
  token_hash  CHAR(64)  NOT NULL,
  expires_at  DATETIME  NOT NULL,
  revoked_at  DATETIME  NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sessions_token (token_hash),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES master_users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Routing: which officer receives applications for a block × department × scheme.
CREATE TABLE master_officer_mappings (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  block_id        INT UNSIGNED NOT NULL,
  department_id   INT UNSIGNED NOT NULL,
  scheme_id       INT UNSIGNED NULL,
  officer_user_id INT UNSIGNED NOT NULL,
  backup_user_id  INT UNSIGNED NULL,
  is_active       TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_mapping (block_id, department_id, scheme_id),
  CONSTRAINT fk_map_block   FOREIGN KEY (block_id)        REFERENCES master_blocks (id),
  CONSTRAINT fk_map_dept    FOREIGN KEY (department_id)   REFERENCES master_departments (id),
  CONSTRAINT fk_map_scheme  FOREIGN KEY (scheme_id)       REFERENCES master_schemes (id),
  CONSTRAINT fk_map_officer FOREIGN KEY (officer_user_id) REFERENCES master_users (id),
  CONSTRAINT fk_map_backup  FOREIGN KEY (backup_user_id)  REFERENCES master_users (id)
) ENGINE=InnoDB;

-- migrate:down
DROP TABLE IF EXISTS master_officer_mappings;
DROP TABLE IF EXISTS tbl_user_sessions;
DROP TABLE IF EXISTS tbl_otp_requests;
DROP TABLE IF EXISTS master_users;
DROP TABLE IF EXISTS master_schemes;
DROP TABLE IF EXISTS master_departments;
