-- Run once on an existing No.1 Sports database.
ALTER TABLE settings
  ADD COLUMN loyalty_unit_amount DECIMAL(10,2) NOT NULL DEFAULT 100 AFTER promotion_percent,
  ADD COLUMN loyalty_points_per_unit INT UNSIGNED NOT NULL DEFAULT 5 AFTER loyalty_unit_amount,
  ADD COLUMN loyalty_discount_cap_percent DECIMAL(5,2) NOT NULL DEFAULT 10 AFTER loyalty_points_per_unit;

ALTER TABLE bookings
  ADD COLUMN loyalty_points_used INT UNSIGNED NOT NULL DEFAULT 0 AFTER amount,
  ADD COLUMN loyalty_discount DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER loyalty_points_used,
  ADD COLUMN loyalty_points_earned INT UNSIGNED NOT NULL DEFAULT 0 AFTER loyalty_discount;
ALTER TABLE bookings
  ADD COLUMN loyalty_awarded_at DATETIME NULL AFTER loyalty_points_earned;

CREATE TABLE loyalty_transactions (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 user_id BIGINT UNSIGNED NOT NULL,
 booking_id BIGINT UNSIGNED NULL,
 points INT NOT NULL,
 type ENUM('earned','redeemed','restored','adjusted') NOT NULL,
 reason VARCHAR(255) NOT NULL DEFAULT '',
 balance_after INT UNSIGNED NOT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (user_id) REFERENCES users(id),
 FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
 UNIQUE KEY loyalty_booking_type (booking_id,type),
 INDEX loyalty_user_history (user_id,created_at),
 INDEX loyalty_booking (booking_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;