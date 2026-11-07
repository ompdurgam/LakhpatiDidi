-- Actionable notifications, first used to ask a Didi about her best-fit scheme.
--
--   master_notification_types.actions   the answer buttons a type offers (bilingual labels)
--   tbl_notification_recipients.response  what this person answered (one answer per notice)
--   tbl_notification_deliveries.action_token_hash
--       The phone's notification buttons run in the service worker, which has no login
--       session. Each push carries a random single-use token; only its SHA-256 is stored.
--   tbl_scheme_interests   a Didi's answer per scheme: never asked twice, and the CRP
--                          sees who wants to apply.

-- migrate:up
ALTER TABLE master_notification_types
  ADD COLUMN actions LONGTEXT NULL
    COMMENT 'Answer buttons: [{"id":"yes","hi":"…","en":"…"}]'
    CHECK (actions IS NULL OR JSON_VALID(actions)) AFTER body_en;

ALTER TABLE tbl_notification_recipients
  ADD COLUMN response     VARCHAR(20) NULL AFTER link,
  ADD COLUMN responded_at DATETIME    NULL AFTER response;

ALTER TABLE tbl_notification_deliveries
  ADD COLUMN action_token_hash CHAR(64) NULL AFTER claim_token,
  ADD UNIQUE KEY uq_delivery_action_token (action_token_hash);

CREATE TABLE tbl_scheme_interests (
  id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  household_id    INT UNSIGNED  NOT NULL,
  scheme_id       INT UNSIGNED  NOT NULL,
  status          ENUM('asked','interested','not_interested') NOT NULL DEFAULT 'asked',
  match_score     TINYINT UNSIGNED NULL COMMENT 'Engine fit score (0–100) when asked',
  expected_gain   DECIMAL(12,2) NULL COMMENT 'Engine estimate of added annual income',
  notification_id BIGINT UNSIGNED NULL COMMENT 'The question that was sent',
  asked_by        INT UNSIGNED  NULL COMMENT 'NULL = asked automatically after the survey',
  responded_via   ENUM('app','push','crp') NULL,
  asked_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  responded_at    DATETIME      NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_interest_household_scheme (household_id, scheme_id),
  KEY ix_interest_notification (notification_id),
  KEY ix_interest_status (status),
  CONSTRAINT fk_interest_household    FOREIGN KEY (household_id)    REFERENCES tbl_households (id) ON DELETE CASCADE,
  CONSTRAINT fk_interest_scheme       FOREIGN KEY (scheme_id)       REFERENCES master_schemes (id),
  CONSTRAINT fk_interest_notification FOREIGN KEY (notification_id) REFERENCES tbl_notifications (id) ON DELETE SET NULL,
  CONSTRAINT fk_interest_asked_by     FOREIGN KEY (asked_by)        REFERENCES master_users (id) ON DELETE SET NULL
) ENGINE=InnoDB;

INSERT INTO master_notification_types
  (code, category, priority, title_hi, title_en, body_hi, body_en, actions, push_enabled, ttl_hours) VALUES
('scheme.suggested', 'workflow', 'high',
 'आपके लिए उपयुक्त योजना: {{scheme}}', 'A scheme that suits you: {{scheme}}',
 'इससे सालाना लगभग {{gain}} अतिरिक्त आय हो सकती है। क्या आप इस योजना में आवेदन करना चाहती हैं?',
 'It could add about {{gain}} a year to your income. Would you like to apply for this scheme?',
 '[{"id":"yes","hi":"हाँ, आवेदन करना है","en":"Yes, I want to apply"},{"id":"no","hi":"अभी नहीं","en":"Not now"}]',
 1, 168),
('scheme.interested', 'workflow', 'high',
 '{{didi}} {{scheme}} में आवेदन करना चाहती हैं', '{{didi}} wants to apply for {{scheme}}',
 'DPR तैयार करें • अनुमानित अतिरिक्त आय {{gain}}/वर्ष', 'Prepare the DPR • expected extra income {{gain}}/year',
 NULL, 1, 120),
('scheme.declined', 'workflow', 'low',
 '{{didi}} ने {{scheme}} के लिए अभी मना किया', '{{didi}} said not now to {{scheme}}',
 'अगली भेंट में दूसरी योजना पर बात करें', 'Discuss another scheme on your next visit',
 NULL, 0, 72);

-- migrate:down
DELETE FROM master_notification_types WHERE code IN ('scheme.suggested','scheme.interested','scheme.declined');
DROP TABLE IF EXISTS tbl_scheme_interests;
ALTER TABLE tbl_notification_deliveries DROP INDEX uq_delivery_action_token, DROP COLUMN action_token_hash;
ALTER TABLE tbl_notification_recipients DROP COLUMN responded_at, DROP COLUMN response;
ALTER TABLE master_notification_types DROP COLUMN actions;
