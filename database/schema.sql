-- ============================================================
-- Clinica Veterinaria de Figura
-- Appointment & Scheduling System — Database Schema
-- Based on SRS Requirements
-- ============================================================

CREATE DATABASE IF NOT EXISTS clinica_veterinaria;
USE clinica_veterinaria;

-- ADMIN (R1, R2, R3, R4)
CREATE TABLE admin (
  admin_id      INT AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(150) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  role          VARCHAR(50)  NOT NULL DEFAULT 'admin',
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CLIENT (R6, R8, R14, R27)
CREATE TABLE client (
  client_id     INT AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(150) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  phone_number  VARCHAR(20)  NOT NULL,
  address       VARCHAR(255),
  date_of_birth VARCHAR(20),
  username      VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  is_verified   TINYINT(1)   DEFAULT 0,
  verify_token  VARCHAR(10),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PET (R7, R27)
CREATE TABLE pet (
  pet_id               INT AUTO_INCREMENT PRIMARY KEY,
  client_id            INT NOT NULL,
  pet_name             VARCHAR(100) NOT NULL,
  type                 VARCHAR(50),
  breed                VARCHAR(100),
  registered_in_clinic TINYINT(1) DEFAULT 0,
  FOREIGN KEY (client_id) REFERENCES client(client_id) ON DELETE CASCADE
);

-- SERVICE (R20)
CREATE TABLE service (
  service_id   INT AUTO_INCREMENT PRIMARY KEY,
  service_name VARCHAR(100) NOT NULL,
  price        FLOAT        NOT NULL,
  description  VARCHAR(255)
);

-- APPOINTMENT (R3, R19, R21, R25, R27)
CREATE TABLE appointment (
  appointment_id  INT AUTO_INCREMENT PRIMARY KEY,
  client_id       INT NOT NULL,
  pet_id          INT NOT NULL,
  appt_date       VARCHAR(20)  NOT NULL,
  appt_time       VARCHAR(20)  NOT NULL,
  reason_for_visit VARCHAR(255),
  status          ENUM('pending','confirmed','cancelled','completed') DEFAULT 'pending',
  notif_preference ENUM('email','sms','both') DEFAULT 'both',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES client(client_id) ON DELETE CASCADE,
  FOREIGN KEY (pet_id)    REFERENCES pet(pet_id)       ON DELETE CASCADE
);

-- APPOINTMENT_SERVICE junction (R20)
CREATE TABLE appointment_service (
  appt_service_id INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id  INT NOT NULL,
  service_id      INT NOT NULL,
  FOREIGN KEY (appointment_id) REFERENCES appointment(appointment_id) ON DELETE CASCADE,
  FOREIGN KEY (service_id)     REFERENCES service(service_id)         ON DELETE CASCADE
);

-- NOTIFICATION (R15, R16, R17, R18)
CREATE TABLE notification (
  notif_id       INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id INT,
  client_id      INT,
  type           VARCHAR(50),
  channel        ENUM('email','sms','both') DEFAULT 'both',
  message        TEXT,
  sent_at        VARCHAR(30),
  status         ENUM('sent','failed','pending') DEFAULT 'pending',
  FOREIGN KEY (appointment_id) REFERENCES appointment(appointment_id) ON DELETE SET NULL,
  FOREIGN KEY (client_id)      REFERENCES client(client_id)           ON DELETE SET NULL
);

-- BLACKOUT_DATE (R2)
CREATE TABLE blackout_date (
  blackout_id   INT AUTO_INCREMENT PRIMARY KEY,
  admin_id      INT NOT NULL,
  blackout_date VARCHAR(20) NOT NULL,
  reason        VARCHAR(255),
  FOREIGN KEY (admin_id) REFERENCES admin(admin_id) ON DELETE CASCADE
);

-- ── Seed data ──────────────────────────────────────────────
INSERT INTO admin (full_name, email, role, password_hash) VALUES
('Dr. Santos', 'admin@clinica.com', 'admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');
-- default password: password

INSERT INTO service (service_name, price, description) VALUES
('Vaccination',  350, 'Annual vaccines and boosters'),
('Grooming',     450, 'Full grooming service'),
('Check-up',     250, 'General physical examination'),
('Deworming',    200, 'Anti-parasite treatment'),
('Dental',       500, 'Dental cleaning and checkup'),
('X-Ray',        800, 'Radiographic imaging');

INSERT INTO blackout_date (admin_id, blackout_date, reason) VALUES
(1, '2025-04-09', 'Holy Wednesday'),
(1, '2025-04-10', 'Maundy Thursday'),
(1, '2025-04-11', 'Good Friday');
