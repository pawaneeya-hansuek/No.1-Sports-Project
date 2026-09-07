-- Run once on an existing No.1 Sports database.
ALTER TABLE settings
  ADD COLUMN promotion_code VARCHAR(40) NOT NULL DEFAULT '' AFTER promotion,
  ADD COLUMN promotion_percent DECIMAL(5,2) NOT NULL DEFAULT 0 AFTER promotion_code;

UPDATE settings
SET promotion_code = 'No.1Sports', promotion_percent = 20
WHERE id = 1 AND promotion_code = '';