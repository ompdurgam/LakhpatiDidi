-- Notifications: in-app inbox + Web Push to phones.
--
-- Four layers, each with one job:
--   master_notification_types       what a kind of notice says (bilingual templates, priority, TTL)
--   tbl_notifications               one row per event: type + parameters (rendered at read time,
--                                   so the same notice shows in Hindi or English)
--   tbl_notification_recipients     fan-out on write: one inbox row per user, holds read state
--   tbl_notification_deliveries     outbox: one row per (recipient, device) push attempt, retried
--                                   with back-off by the API's worker
--   tbl_push_subscriptions          a user's devices (browser push endpoints + keys)
--
-- Producers write the event, recipients and deliveries in the SAME transaction as the
-- business change (transactional outbox), so a notice is never lost or sent for a rollback.

-- migrate:up
CREATE TABLE master_notification_types (
  id           SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code         VARCHAR(60)  NOT NULL,
  category     ENUM('workflow','reminder','alert','system') NOT NULL,
  priority     ENUM('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
  title_hi     VARCHAR(160) NOT NULL COMMENT 'Template: {{name}} placeholders filled from the payload',
  title_en     VARCHAR(160) NOT NULL,
  body_hi      VARCHAR(400) NOT NULL,
  body_en      VARCHAR(400) NOT NULL,
  push_enabled TINYINT(1)   NOT NULL DEFAULT 1,
  ttl_hours    SMALLINT UNSIGNED NOT NULL DEFAULT 72 COMMENT 'Push service drops it after this',
  is_active    TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_notification_types_code (code)
) ENGINE=InnoDB;

CREATE TABLE tbl_notifications (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  type_id       SMALLINT UNSIGNED NOT NULL,
  payload       LONGTEXT     NOT NULL DEFAULT ('{}') CHECK (JSON_VALID(payload)),
  entity_type   VARCHAR(30)  NULL COMMENT 'e.g. application',
  entity_ref    VARCHAR(40)  NULL COMMENT 'e.g. APP-2026-0012',
  actor_user_id INT UNSIGNED NULL,
  dedupe_key    VARCHAR(120) NULL COMMENT 'Idempotency: the same key never notifies twice',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at    DATETIME     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_notifications_dedupe (dedupe_key),
  KEY ix_notifications_entity (entity_type, entity_ref),
  KEY ix_notifications_created (created_at),
  CONSTRAINT fk_notifications_type  FOREIGN KEY (type_id)       REFERENCES master_notification_types (id),
  CONSTRAINT fk_notifications_actor FOREIGN KEY (actor_user_id) REFERENCES master_users (id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE tbl_notification_recipients (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  notification_id BIGINT UNSIGNED NOT NULL,
  user_id         INT UNSIGNED NOT NULL,
  link            VARCHAR(255) NULL COMMENT 'Screen to open, resolved for this user''s role',
  read_at         DATETIME     NULL,
  archived_at     DATETIME     NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_recipient (notification_id, user_id),
  -- Inbox page: WHERE user_id = ? AND archived_at IS NULL AND id < ? ORDER BY id DESC
  KEY ix_recipient_inbox (user_id, archived_at, id),
  -- Badge: WHERE user_id = ? AND archived_at IS NULL AND read_at IS NULL
  KEY ix_recipient_unread (user_id, archived_at, read_at),
  CONSTRAINT fk_recipient_notification FOREIGN KEY (notification_id) REFERENCES tbl_notifications (id) ON DELETE CASCADE,
  CONSTRAINT fk_recipient_user         FOREIGN KEY (user_id)         REFERENCES master_users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE tbl_push_subscriptions (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id         INT UNSIGNED NOT NULL,
  endpoint        TEXT         NOT NULL,
  endpoint_hash   CHAR(64)     NOT NULL COMMENT 'SHA-256 of endpoint (TEXT cannot be a unique key)',
  p256dh          VARCHAR(255) NOT NULL,
  auth            VARCHAR(64)  NOT NULL,
  lang            ENUM('hi','en') NOT NULL DEFAULT 'hi' COMMENT 'Language the phone shows the push in',
  user_agent      VARCHAR(255) NULL,
  failure_count   TINYINT UNSIGNED NOT NULL DEFAULT 0,
  last_success_at DATETIME     NULL,
  revoked_at      DATETIME     NULL COMMENT 'Set on logout or when the push service answers 404/410',
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_push_endpoint (endpoint_hash),
  KEY ix_push_user_active (user_id, revoked_at),
  CONSTRAINT fk_push_user FOREIGN KEY (user_id) REFERENCES master_users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE tbl_notification_deliveries (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  recipient_id    BIGINT UNSIGNED NOT NULL,
  subscription_id INT UNSIGNED NOT NULL,
  status          ENUM('pending','sent','failed','gone','skipped') NOT NULL DEFAULT 'pending'
                  COMMENT 'gone = device unsubscribed (404/410); skipped = read in the app before sending',
  attempts        TINYINT UNSIGNED NOT NULL DEFAULT 0,
  next_attempt_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  claim_token     CHAR(32)     NULL COMMENT 'Worker lease (MariaDB 10.4 has no SKIP LOCKED)',
  last_error      VARCHAR(255) NULL,
  sent_at         DATETIME     NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_delivery (recipient_id, subscription_id),
  -- Worker poll: WHERE status = 'pending' AND next_attempt_at <= NOW()
  KEY ix_delivery_due (status, next_attempt_at),
  KEY ix_delivery_claim (claim_token),
  CONSTRAINT fk_delivery_recipient    FOREIGN KEY (recipient_id)    REFERENCES tbl_notification_recipients (id) ON DELETE CASCADE,
  CONSTRAINT fk_delivery_subscription FOREIGN KEY (subscription_id) REFERENCES tbl_push_subscriptions (id) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO master_notification_types (code, category, priority, title_hi, title_en, body_hi, body_en, ttl_hours) VALUES
('application.submitted', 'workflow', 'high',
 'नया आवेदन {{code}}', 'New application {{code}}',
 '{{didi}} • {{scheme}} — {{due}} तक निर्णय दें', '{{didi}} • {{scheme}} — decide by {{due}}', 72),
('application.accepted', 'workflow', 'normal',
 'आवेदन {{code}} स्वीकार हुआ', 'Application {{code}} accepted',
 '{{didi}} • {{scheme}} की जाँच शुरू हुई', 'Review of {{didi}} • {{scheme}} has started', 72),
('application.info_requested', 'workflow', 'high',
 'आवेदन {{code}} पर जानकारी चाहिए', 'Information needed on {{code}}',
 '{{didi}} • {{note}}', '{{didi}} • {{note}}', 120),
('application.sanctioned', 'workflow', 'high',
 'आवेदन {{code}} स्वीकृत', 'Application {{code}} sanctioned',
 '{{didi}} • {{scheme}} — {{amount}} स्वीकृत', '{{didi}} • {{scheme}} — {{amount}} sanctioned', 168),
('application.rejected', 'workflow', 'high',
 'आवेदन {{code}} अस्वीकृत', 'Application {{code}} rejected',
 '{{didi}} • {{scheme}} — {{note}}', '{{didi}} • {{scheme}} — {{note}}', 168),
('application.delivered', 'workflow', 'normal',
 'आवेदन {{code}} की डिलीवरी हुई', 'Application {{code}} delivered',
 '{{didi}} • {{note}}', '{{didi}} • {{note}}', 168),
('application.escalated', 'alert', 'urgent',
 'आवेदन {{code}} एस्केलेट हुआ', 'Application {{code}} escalated',
 '{{didi}} • {{scheme}} — {{note}}', '{{didi}} • {{scheme}} — {{note}}', 48),
('application.follow_up', 'reminder', 'normal',
 'आवेदन {{code}} पर फॉलो-अप', 'Follow-up on {{code}}',
 '{{didi}} • {{scheme}} — ब्लॉक ने स्थिति पूछी है', '{{didi}} • {{scheme}} — the block asked for an update', 48),
('application.overdue', 'alert', 'high',
 'आवेदन {{code}} अतिदेय', 'Application {{code}} overdue',
 '{{didi}} • {{scheme}} — SLA {{due}} को समाप्त', '{{didi}} • {{scheme}} — SLA ended on {{due}}', 24);

-- migrate:down
DROP TABLE IF EXISTS tbl_notification_deliveries;
DROP TABLE IF EXISTS tbl_push_subscriptions;
DROP TABLE IF EXISTS tbl_notification_recipients;
DROP TABLE IF EXISTS tbl_notifications;
DROP TABLE IF EXISTS master_notification_types;
