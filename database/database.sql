CREATE DATABASE IF NOT EXISTS chatapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE chatapp;

CREATE TABLE `user` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(80) NOT NULL UNIQUE,
  `email` VARCHAR(120) NOT NULL UNIQUE,
  `password_hash` VARCHAR(200) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `avatar_url` TEXT NULL,
  `about` TEXT NULL,
  `last_lat` DOUBLE NULL,
  `last_lon` DOUBLE NULL,
  `last_location_ts` DATETIME NULL,
  `is_visible_nearby` BOOLEAN DEFAULT FALSE,
  `last_seen_visible` BOOLEAN DEFAULT TRUE,
  `notifications` BOOLEAN DEFAULT TRUE,
  `dark_mode` BOOLEAN DEFAULT FALSE
);

CREATE TABLE `contact` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `contact_id` INT NOT NULL,
  `status` VARCHAR(16) DEFAULT 'pending',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `user`(`id`),
  FOREIGN KEY (`contact_id`) REFERENCES `user`(`id`)
);

CREATE TABLE `message` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `text` TEXT NULL,
  `sender_id` INT NOT NULL,
  `receiver_id` INT NOT NULL,
  `timestamp` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `type` VARCHAR(16) DEFAULT 'text',
  `url` TEXT NULL,
  `filename` TEXT NULL,
  FOREIGN KEY (`sender_id`) REFERENCES `user`(`id`),
  FOREIGN KEY (`receiver_id`) REFERENCES `user`(`id`)
);
