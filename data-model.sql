-- Base & encodage
CREATE DATABASE IF NOT EXISTS education
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE education;

-- Sécurité (au cas où l'on relance le script)
SET FOREIGN_KEY_CHECKS = 0;

-- 1) Référentiels
CREATE TABLE district (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL,
  nom  VARCHAR(150) NOT NULL,
  description TEXT,
  UNIQUE KEY uq_district_code (code)
) ENGINE=InnoDB;

CREATE TABLE ecole (
  id INT AUTO_INCREMENT PRIMARY KEY,
  district_id INT NOT NULL,
  code_uai VARCHAR(20),
  nom VARCHAR(200) NOT NULL,
  adresse TEXT,
  ville VARCHAR(120),
  code_postal VARCHAR(15),
  UNIQUE KEY uq_ecole_nom_par_district (district_id, nom),
  KEY idx_ecole_district (district_id),
  CONSTRAINT fk_ecole_district
    FOREIGN KEY (district_id) REFERENCES district(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE inspecteur (
  id INT AUTO_INCREMENT PRIMARY KEY,
  district_id INT NOT NULL,
  nom VARCHAR(120) NOT NULL,
  prenom VARCHAR(120) NOT NULL,
  email VARCHAR(180),
  telephone VARCHAR(50),
  UNIQUE KEY uq_inspecteur_identite (district_id, nom, prenom),
  KEY idx_inspecteur_district (district_id),
  CONSTRAINT fk_inspecteur_district
    FOREIGN KEY (district_id) REFERENCES district(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE enseignant (
  id INT AUTO_INCREMENT PRIMARY KEY,
  matricule VARCHAR(50),
  nom VARCHAR(120) NOT NULL,
  prenom VARCHAR(120) NOT NULL,
  email VARCHAR(180),
  telephone VARCHAR(50),
  specialite VARCHAR(120),
  statut VARCHAR(50),
  UNIQUE KEY uq_enseignant_matricule (matricule)
) ENGINE=InnoDB;

-- 2) Affectations historisées (un enseignant ne peut avoir qu'une école à la fois)
CREATE TABLE affectation_enseignant (
  id INT AUTO_INCREMENT PRIMARY KEY,
  enseignant_id INT NOT NULL,
  ecole_id INT NOT NULL,
  date_debut DATE NOT NULL,
  date_fin   DATE NULL,
  CHECK (date_fin IS NULL OR date_fin >= date_debut),
  KEY idx_affectation_enseignant_courante (enseignant_id),
  KEY idx_affectation_ecole (ecole_id),
  CONSTRAINT fk_affectation_enseignant
    FOREIGN KEY (enseignant_id) REFERENCES enseignant(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_affectation_ecole
    FOREIGN KEY (ecole_id) REFERENCES ecole(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 3) Inspections
CREATE TABLE inspection (
  id INT AUTO_INCREMENT PRIMARY KEY,
  inspecteur_id INT NOT NULL,
  enseignant_id INT NOT NULL,
  ecole_id INT NOT NULL,   -- copie de l'école au jour J pour l'historique
  date_visite DATE NOT NULL,
  type_visite VARCHAR(80),
  objectif TEXT,
  conclusion TEXT,
  statut VARCHAR(40) DEFAULT 'clôturée', -- planifiée, réalisée, clôturée
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_inspection_enseignant (enseignant_id),
  KEY idx_inspection_ecole (ecole_id),
  KEY idx_inspection_date (date_visite),
  CONSTRAINT fk_inspection_inspecteur
    FOREIGN KEY (inspecteur_id) REFERENCES inspecteur(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_inspection_enseignant
    FOREIGN KEY (enseignant_id) REFERENCES enseignant(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_inspection_ecole
    FOREIGN KEY (ecole_id) REFERENCES ecole(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 4) Critères & évaluations
CREATE TABLE critere_evaluation (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(30) NOT NULL,
  intitule VARCHAR(200) NOT NULL,
  description TEXT,
  bareme_max DECIMAL(5,2) NOT NULL DEFAULT 20.00,
  UNIQUE KEY uq_critere_code (code)
) ENGINE=InnoDB;

CREATE TABLE evaluation (
  id INT AUTO_INCREMENT PRIMARY KEY,
  inspection_id INT NOT NULL,
  critere_id INT NOT NULL,
  note DECIMAL(5,2) NOT NULL,
  commentaire TEXT,
  UNIQUE KEY uq_evaluation_unique (inspection_id, critere_id),
  CHECK (note >= 0),
  KEY idx_evaluation_critere (critere_id),
  CONSTRAINT fk_evaluation_inspection
    FOREIGN KEY (inspection_id) REFERENCES inspection(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_evaluation_critere
    FOREIGN KEY (critere_id) REFERENCES critere_evaluation(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 5) Observations & pièces jointes
CREATE TABLE observation (
  id INT AUTO_INCREMENT PRIMARY KEY,
  inspection_id INT NOT NULL,
  categorie VARCHAR(80),
  confidentialite VARCHAR(30),
  contenu TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_observation_inspection
    FOREIGN KEY (inspection_id) REFERENCES inspection(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE piece_jointe (
  id INT AUTO_INCREMENT PRIMARY KEY,
  inspection_id INT NOT NULL,
  nom_fichier VARCHAR(255) NOT NULL,
  url_ou_path TEXT NOT NULL,
  type_mime VARCHAR(120),
  taille_octets BIGINT,
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_piecejointe_inspection
    FOREIGN KEY (inspection_id) REFERENCES inspection(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- Triggers d'intégrité métier
-- =====================================================================

DELIMITER $$

-- A) Empêcher les chevauchements d'affectation pour un même enseignant
CREATE TRIGGER trg_affectation_bi
BEFORE INSERT ON affectation_enseignant
FOR EACH ROW
BEGIN
  DECLARE v_cnt INT DEFAULT 0;
  DECLARE v_new_fin DATE;
  SET v_new_fin = IFNULL(NEW.date_fin, DATE('9999-12-31'));

  SELECT COUNT(*) INTO v_cnt
  FROM affectation_enseignant a
  WHERE a.enseignant_id = NEW.enseignant_id
    AND a.date_debut <= v_new_fin
    AND IFNULL(a.date_fin, DATE('9999-12-31')) >= NEW.date_debut;

  IF v_cnt > 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Chevauchement d''affectation détecté pour cet enseignant.';
  END IF;
END$$

CREATE TRIGGER trg_affectation_bu
BEFORE UPDATE ON affectation_enseignant
FOR EACH ROW
BEGIN
  DECLARE v_cnt INT DEFAULT 0;
  DECLARE v_new_fin DATE;
  SET v_new_fin = IFNULL(NEW.date_fin, DATE('9999-12-31'));

  SELECT COUNT(*) INTO v_cnt
  FROM affectation_enseignant a
  WHERE a.enseignant_id = NEW.enseignant_id
    AND a.id <> NEW.id
    AND a.date_debut <= v_new_fin
    AND IFNULL(a.date_fin, DATE('9999-12-31')) >= NEW.date_debut;

  IF v_cnt > 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Chevauchement d''affectation détecté pour cet enseignant (UPDATE).';
  END IF;
END$$

-- B) Contrôler que la note <= barème max du critère
CREATE TRIGGER trg_evaluation_bi
BEFORE INSERT ON evaluation
FOR EACH ROW
BEGIN
  DECLARE v_max DECIMAL(5,2);
  SELECT bareme_max INTO v_max FROM critere_evaluation WHERE id = NEW.critere_id;
  IF v_max IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Critère d''évaluation inconnu.';
  END IF;
  IF NEW.note < 0 OR NEW.note > v_max THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'La note doit être comprise entre 0 et le barème max du critère.';
  END IF;
END$$

CREATE TRIGGER trg_evaluation_bu
BEFORE UPDATE ON evaluation
FOR EACH ROW
BEGIN
  DECLARE v_max DECIMAL(5,2);
  SELECT bareme_max INTO v_max FROM critere_evaluation WHERE id = NEW.critere_id;
  IF v_max IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Critère d''évaluation inconnu (UPDATE).';
  END IF;
  IF NEW.note < 0 OR NEW.note > v_max THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'La note doit être comprise entre 0 et le barème max du critère (UPDATE).';
  END IF;
END$$

DELIMITER ;