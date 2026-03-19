
-- =====================================================================
-- Schéma MySQL : Gestion des inspections (IEN -> écoles primaires)
-- Généré le 2026-03-11
-- Cible : MySQL 8.0+
-- =====================================================================

-- (Optionnel) Crée la base et la sélectionne
CREATE DATABASE IF NOT EXISTS ien_inspection
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;
USE ien_inspection;

-- Bonnes pratiques de session
SET NAMES utf8mb4;
SET sql_mode = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';
SET time_zone = '+00:00';

-- Pour rejouer proprement (optionnel)
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS inspection;
DROP TABLE IF EXISTS ecole;
DROP TABLE IF EXISTS college;
DROP TABLE IF EXISTS district;
DROP TABLE IF EXISTS inspecteur;

SET FOREIGN_KEY_CHECKS = 1;

-- =========================
-- Table INSPECTEUR
-- =========================
CREATE TABLE inspecteur (
  id_inspecteur      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  matricule          VARCHAR(50) UNIQUE,
  nom                VARCHAR(120) NOT NULL,
  prenom             VARCHAR(120) NOT NULL,
  email              VARCHAR(180) UNIQUE,
  telephone          VARCHAR(30),
  grade              VARCHAR(80),
  actif              TINYINT(1) NOT NULL DEFAULT 1,
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_inspecteur)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =========================
-- Table DISTRICT
-- =========================
CREATE TABLE district (
  id_district                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  numero                     VARCHAR(30) NOT NULL,
  ville                      VARCHAR(120) NOT NULL,
  responsable_inspecteur_id  BIGINT UNSIGNED NOT NULL,
  created_at                 TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                 TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_district),
  UNIQUE KEY uq_district_numero (numero),
  CONSTRAINT fk_district_responsable
    FOREIGN KEY (responsable_inspecteur_id)
    REFERENCES inspecteur (id_inspecteur)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =========================
-- Table COLLEGE
-- =========================
CREATE TABLE college (
  id_college     BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  numero         VARCHAR(30) NOT NULL,
  nom            VARCHAR(200) NOT NULL,
  id_district    BIGINT UNSIGNED NOT NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_college),
  UNIQUE KEY uq_college_numero (numero),
  KEY idx_college_district (id_district),
  CONSTRAINT fk_college_district
    FOREIGN KEY (id_district)
    REFERENCES district (id_district)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =========================
-- Table ECOLE
-- =========================
CREATE TABLE ecole (
  id_ecole       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nom            VARCHAR(250) NOT NULL,
  code_uai       VARCHAR(20),
  adresse        VARCHAR(250),
  code_postal    VARCHAR(12),
  ville          VARCHAR(120),
  id_college     BIGINT UNSIGNED NOT NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_ecole),
  UNIQUE KEY uq_ecole_code_uai (code_uai),
  KEY idx_ecole_college (id_college),
  CONSTRAINT fk_ecole_college
    FOREIGN KEY (id_college)
    REFERENCES college (id_college)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =========================
-- Table INSPECTION
-- =========================
CREATE TABLE inspection (
  id_inspection      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_ecole           BIGINT UNSIGNED NOT NULL,
  id_inspecteur      BIGINT UNSIGNED NOT NULL,
  date_visite        DATE NOT NULL,
  type               ENUM('annuelle','thématique','suivi','autre') NOT NULL DEFAULT 'annuelle',
  statut             ENUM('planifiée','réalisée','reportée','annulée') NOT NULL DEFAULT 'planifiée',
  rapport            TEXT,
  note_globale       DECIMAL(3,1),
  pieces_jointes_url TEXT,
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_inspection),
  UNIQUE KEY uq_inspection_ecole_date (id_ecole, date_visite),
  KEY idx_inspection_ecole_date (id_ecole, date_visite),
  KEY idx_inspection_inspecteur_date (id_inspecteur, date_visite),
  CONSTRAINT fk_inspection_ecole
    FOREIGN KEY (id_ecole)
    REFERENCES ecole (id_ecole)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_inspection_inspecteur
    FOREIGN KEY (id_inspecteur)
    REFERENCES inspecteur (id_inspecteur)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =========================
-- Données de démonstration
-- =========================
INSERT INTO inspecteur (matricule, nom, prenom, email)
VALUES 
  ('I001', 'Dupont', 'Alice', 'alice.dupont@ac-exemple.fr'),
  ('I002', 'Martin', 'Karim', 'karim.martin@ac-exemple.fr');

INSERT INTO district (numero, ville, responsable_inspecteur_id)
SELECT 'D-93-01', 'Saint-Denis', i.id_inspecteur
FROM inspecteur i WHERE i.matricule = 'I001'
LIMIT 1;

INSERT INTO college (numero, nom, id_district)
SELECT 'C-9301-01', 'Collège Jean Jaurès', d.id_district
FROM district d WHERE d.numero = 'D-93-01'
LIMIT 1;

INSERT INTO ecole (nom, code_uai, ville, id_college)
SELECT 'École Élémentaire Victor Hugo', '0931234A', 'Saint-Denis', c.id_college
FROM college c WHERE c.numero = 'C-9301-01'
LIMIT 1;

INSERT INTO inspection (id_ecole, id_inspecteur, date_visite, type, statut, rapport, note_globale)
SELECT e.id_ecole, i.id_inspecteur, DATE '2026-04-10', 'annuelle', 'planifiée',
       'Préparation des documents OK.', 4.5
FROM ecole e
CROSS JOIN inspecteur i
WHERE e.code_uai = '0931234A' AND i.matricule = 'I002'
LIMIT 1;
