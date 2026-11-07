-- Custom notices written by a person and sent down the hierarchy
-- (admin → everyone, district → its blocks, block → its CRPs and Didis, CRP → her village's Didis).
--
-- They reuse the notification pipeline: one tbl_notifications row (entity_type = 'broadcast',
-- the text in its payload), one inbox row per recipient and the usual push outbox.
-- The text is the author's own, so the Hindi and English templates are the same.

-- migrate:up
INSERT INTO master_notification_types
  (code, category, priority, title_hi, title_en, body_hi, body_en, push_enabled, ttl_hours) VALUES
('broadcast.message', 'system', 'high',
 '{{title}}', '{{title}}',
 '{{body}} • {{sender}}', '{{body}} • {{sender}}',
 1, 168);

-- "Sent by me" history: WHERE actor_user_id = ? AND entity_type = 'broadcast' ORDER BY id DESC
ALTER TABLE tbl_notifications ADD KEY ix_notifications_actor_entity (actor_user_id, entity_type, id);

-- migrate:down
ALTER TABLE tbl_notifications DROP KEY ix_notifications_actor_entity;
DELETE FROM master_notification_types WHERE code = 'broadcast.message';
