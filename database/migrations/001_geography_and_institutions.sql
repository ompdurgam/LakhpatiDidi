-- Geography master (State → District → Block → Gram Panchayat → Village)
-- and SHG federation hierarchy (CLF → VO → SHG), as imported from LokOS.

-- migrate:up
CREATE TABLE master_states (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code        VARCHAR(10)  NOT NULL,
  name_hi     VARCHAR(100) NOT NULL,
  name_en     VARCHAR(100) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_states_code (code)
) ENGINE=InnoDB;

CREATE TABLE master_districts (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  state_id    INT UNSIGNED NOT NULL,
  code        VARCHAR(10)  NOT NULL,
  name_hi     VARCHAR(100) NOT NULL,
  name_en     VARCHAR(100) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_districts_code (code),
  CONSTRAINT fk_districts_state FOREIGN KEY (state_id) REFERENCES master_states (id)
) ENGINE=InnoDB;

CREATE TABLE master_blocks (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  district_id INT UNSIGNED NOT NULL,
  code        VARCHAR(10)  NOT NULL,
  name_hi     VARCHAR(100) NOT NULL,
  name_en     VARCHAR(100) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_blocks_code (code),
  CONSTRAINT fk_blocks_district FOREIGN KEY (district_id) REFERENCES master_districts (id)
) ENGINE=InnoDB;

CREATE TABLE master_gram_panchayats (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  block_id    INT UNSIGNED NOT NULL,
  code        VARCHAR(20)  NOT NULL,
  name_hi     VARCHAR(100) NOT NULL,
  name_en     VARCHAR(100) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_gp_code (code),
  CONSTRAINT fk_gp_block FOREIGN KEY (block_id) REFERENCES master_blocks (id)
) ENGINE=InnoDB;

CREATE TABLE master_villages (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  gram_panchayat_id INT UNSIGNED NOT NULL,
  code              VARCHAR(20)  NOT NULL,
  lgd_code          VARCHAR(20)  NULL,
  name_hi           VARCHAR(100) NOT NULL,
  name_en           VARCHAR(100) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_villages_code (code),
  CONSTRAINT fk_villages_gp FOREIGN KEY (gram_panchayat_id) REFERENCES master_gram_panchayats (id)
) ENGINE=InnoDB;

CREATE TABLE master_clfs (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  block_id    INT UNSIGNED NOT NULL,
  lokos_code  VARCHAR(30)  NULL,
  name        VARCHAR(150) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_clfs_lokos (lokos_code),
  CONSTRAINT fk_clfs_block FOREIGN KEY (block_id) REFERENCES master_blocks (id)
) ENGINE=InnoDB;

CREATE TABLE master_village_organisations (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  clf_id      INT UNSIGNED NOT NULL,
  lokos_code  VARCHAR(30)  NULL,
  name        VARCHAR(150) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vos_lokos (lokos_code),
  CONSTRAINT fk_vos_clf FOREIGN KEY (clf_id) REFERENCES master_clfs (id)
) ENGINE=InnoDB;

CREATE TABLE master_shgs (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  vo_id       INT UNSIGNED NOT NULL,
  village_id  INT UNSIGNED NOT NULL,
  lokos_code  VARCHAR(30)  NULL,
  name        VARCHAR(150) NOT NULL,
  formed_on   DATE         NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_shgs_lokos (lokos_code),
  CONSTRAINT fk_shgs_vo      FOREIGN KEY (vo_id)      REFERENCES master_village_organisations (id),
  CONSTRAINT fk_shgs_village FOREIGN KEY (village_id) REFERENCES master_villages (id)
) ENGINE=InnoDB;

-- migrate:down
DROP TABLE IF EXISTS master_shgs;
DROP TABLE IF EXISTS master_village_organisations;
DROP TABLE IF EXISTS master_clfs;
DROP TABLE IF EXISTS master_villages;
DROP TABLE IF EXISTS master_gram_panchayats;
DROP TABLE IF EXISTS master_blocks;
DROP TABLE IF EXISTS master_districts;
DROP TABLE IF EXISTS master_states;
