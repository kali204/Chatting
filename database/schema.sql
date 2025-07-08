CREATE  DATABASE IF NOT EXISTS chatapp;
USE chatapp;

CREATE TABLE IF NOT EXISTS user (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(80) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
);

CREATE TABLE IF NOT EXISTS message (
    id INT PRIMARY KEY AUTO_INCREMENT,
    text TEXT NOT NULL,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES user(id) ON DELETE CASCADE,
    INDEX idx_sender_receiver (sender_id, receiver_id),
    INDEX idx_timestamp (timestamp)
);

INSERT INTO user (username, email, password_hash) VALUES 
('alice', 'alice@example.com', 'scrypt:32768:8:1$XYZ...'),
('bob', 'bob@example.com', 'scrypt:32768:8:1$ABC...'),
('charlie', 'charlie@example.com', 'scrypt:32768:8:1$DEF...');

INSERT INTO message (text, sender_id, receiver_id) VALUES 
('Hello Bob! How are you?', 1, 2),
('Hi Alice! I am doing great, thanks!', 2, 1),
('Would you like to grab coffee later?', 1, 2),
('Sure! What time works for you?', 2, 1);
 