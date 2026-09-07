-- MySQL 8.0+ / MariaDB 10.6+. Import into an empty database with phpMyAdmin.
SET NAMES utf8mb4;
CREATE TABLE users (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(120) NOT NULL,
 email VARCHAR(190) NULL UNIQUE,
 phone VARCHAR(20) NULL UNIQUE,
 password_hash VARCHAR(255) NOT NULL,
 role ENUM('customer','admin') NOT NULL DEFAULT 'customer',
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE fields (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(100) NOT NULL,
 description TEXT NOT NULL,
 price DECIMAL(10,2) NOT NULL,
 image_url VARCHAR(500) NOT NULL DEFAULT '',
 active TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE bookings (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 code VARCHAR(32) NOT NULL UNIQUE,
 user_id BIGINT UNSIGNED NOT NULL,
 field_id BIGINT UNSIGNED NOT NULL,
 field_name VARCHAR(100) NOT NULL,
 booking_date DATE NOT NULL,
 start_hour TINYINT UNSIGNED NOT NULL,
 end_hour TINYINT UNSIGNED NOT NULL,
 amount DECIMAL(10,2) NOT NULL,
 status ENUM('pending_payment','review','confirmed','checked_in','completed','cancelled','expired','rejected') NOT NULL DEFAULT 'pending_payment',
 expires_at DATETIME NOT NULL,
 ticket_token VARCHAR(64) NULL UNIQUE,
 slip_file VARCHAR(80) NULL,
 slip_mime VARCHAR(30) NULL,
 slip_hash CHAR(64) NULL UNIQUE,
 review_note VARCHAR(500) NOT NULL DEFAULT '',
 checked_in_at DATETIME NULL,
 completed_at DATETIME NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (user_id) REFERENCES users(id),
 FOREIGN KEY (field_id) REFERENCES fields(id),
 INDEX booking_lookup(field_id,booking_date,status),
 INDEX user_bookings(user_id,created_at),
 INDEX expire_bookings(status,expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE settings (
 id TINYINT PRIMARY KEY,
 bank_name VARCHAR(100) NOT NULL DEFAULT 'กสิกรไทย',
 bank_account VARCHAR(30) NOT NULL DEFAULT '164-8-13740-7',
 bank_holder VARCHAR(120) NOT NULL DEFAULT 'ภาวนียา หาญศึก',
 payment_qr VARCHAR(80) NULL,
 address TEXT NOT NULL,
 contact VARCHAR(120) NOT NULL DEFAULT '',
 facilities TEXT NOT NULL,
 promotion TEXT NOT NULL,
 rules TEXT NOT NULL,
 booking_enabled TINYINT(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO settings (id,address,facilities,promotion,rules) VALUES (1,'','','','กรุณามาถึงก่อนเวลา 15 นาที และแสดงตั๋วให้ผู้ดูแลสนาม');
CREATE TABLE audit_logs (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 actor_id BIGINT UNSIGNED NOT NULL,
 booking_id BIGINT UNSIGNED NULL,
 action VARCHAR(50) NOT NULL,
 details TEXT NOT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (actor_id) REFERENCES users(id),
 FOREIGN KEY (booking_id) REFERENCES bookings(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE rate_limits (
 key_hash CHAR(64) PRIMARY KEY,
 attempts INT UNSIGNED NOT NULL DEFAULT 0,
 reset_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
