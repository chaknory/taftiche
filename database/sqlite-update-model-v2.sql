-- SQLITE
-- Active la vérification des clés étrangères
PRAGMA foreign_keys = ON;

-- =========================
-- Tables de référence (facultatif mais recommandé)
-- =========================
-- Si vous préférez des CHECK à la place, vous pouvez ignorer ces tables
CREATE TABLE IF NOT EXISTS ref_inspection_type (
    code TEXT PRIMARY KEY  -- ex: 'annuelle', 'thématique', 'suivi', 'autre'
);
CREATE TABLE IF NOT EXISTS ref_inspection_statut (
    code TEXT PRIMARY KEY  -- ex: 'planifiée', 'réalisée', 'reportée', 'annulée'
);

INSERT OR IGNORE INTO ref_inspection_type(code) VALUES
 ('annuelle'), ('thématique'), ('suivi'), ('autre');

INSERT OR IGNORE INTO ref_inspection_statut(code) VALUES
 ('planifiée'), ('réalisée'), ('reportée'), ('annulée');

-- =========================
-- Table INSPECTEUR
-- =========================
CREATE TABLE IF NOT EXISTS inspecteur (
    id_inspecteur   INTEGER PRIMARY KEY,   -- rowid alias ; auto-incr implicite
	id_user		    INTEGER NOT NULL,
    nom             TEXT NOT NULL,
    prenom          TEXT NOT NULL,
    email           TEXT UNIQUE,
    actif           INTEGER NOT NULL DEFAULT 1, -- 1=true, 0=false
    created_at      TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    updated_at      TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

-- =========================
-- Table DISTRICT
-- =========================
CREATE TABLE IF NOT EXISTS district (
    id_district                 INTEGER PRIMARY KEY,
    numero                      TEXT NOT NULL UNIQUE,
    ville                       TEXT NOT NULL,
    responsable_inspecteur_id   INTEGER NOT NULL,
    created_at                  TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    updated_at                  TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    FOREIGN KEY (responsable_inspecteur_id)
        REFERENCES inspecteur(id_inspecteur)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =========================
-- Table COLLEGE
-- =========================
CREATE TABLE IF NOT EXISTS college (
    id_college      INTEGER PRIMARY KEY,
    numero          TEXT NOT NULL UNIQUE,
    nom             TEXT NOT NULL,
    id_district     INTEGER NOT NULL,
    created_at      TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    updated_at      TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    FOREIGN KEY (id_district)
        REFERENCES district(id_district)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =========================
-- Table ECOLE
-- =========================
CREATE TABLE IF NOT EXISTS ecole (
    id_ecole        INTEGER PRIMARY KEY,
    nom             TEXT NOT NULL,
    code        	INTEGER,
    adresse         TEXT,
    ville           TEXT,
	nb_directeur	INTEGER,
	nb_sub_dir		INTEGER,
	nb_orf_arb		INTEGER,
	nb_prf_frc		INTEGER,
	nb_prf_ang		INTEGER,
	nb_prf_sprt		INTEGER,
    id_college      INTEGER NOT NULL,
    created_at      TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    updated_at      TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    FOREIGN KEY (id_college)
        REFERENCES college(id_college)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =========================
-- Table INSPECTION
-- =========================
-- Variante A : via tables de référence (FK)
CREATE TABLE IF NOT EXISTS inspection (
    id_inspection       INTEGER PRIMARY KEY,
    id_ecole            INTEGER NOT NULL,
    id_inspecteur       INTEGER NOT NULL,
    date_visite         TEXT NOT NULL,       -- ISO 8601: 'YYYY-MM-DD' (ou datetime)
    type                TEXT NOT NULL DEFAULT 'annuelle',
    statut              TEXT NOT NULL DEFAULT 'planifiée',
    rapport             TEXT,
    note_globale        REAL,                -- ex: 4.5
    pieces_jointes_url  TEXT,
    created_at          TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    updated_at          TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    CONSTRAINT fk_inspection_ecole
        FOREIGN KEY (id_ecole) REFERENCES ecole(id_ecole)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_inspection_inspecteur
        FOREIGN KEY (id_inspecteur) REFERENCES inspecteur(id_inspecteur)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_inspection_type
        FOREIGN KEY (type) REFERENCES ref_inspection_type(code)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_inspection_statut
        FOREIGN KEY (statut) REFERENCES ref_inspection_statut(code)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT uq_inspection_unique_ecole_date UNIQUE (id_ecole, date_visite)
);

-- Variante B : si vous ne voulez pas de tables de référence, commentez les FK ci-dessus
-- et remplacez par :
--    type   TEXT NOT NULL CHECK (type IN ('annuelle','thématique','suivi','autre')) DEFAULT 'annuelle',
--    statut TEXT NOT NULL CHECK (statut IN ('planifiée','réalisée','reportée','annulée')) DEFAULT 'planifiée';

-- =========================
-- Index utiles
-- =========================
CREATE INDEX IF NOT EXISTS idx_inspection_ecole_date
    ON inspection (id_ecole, date_visite);
CREATE INDEX IF NOT EXISTS idx_inspection_inspecteur_date
    ON inspection (id_inspecteur, date_visite);
CREATE INDEX IF NOT EXISTS idx_ecole_college
    ON ecole (id_college);
CREATE INDEX IF NOT EXISTS idx_college_district
    ON college (id_district);
CREATE INDEX IF NOT EXISTS idx_district_responsable
    ON district (responsable_inspecteur_id);

-- =========================
-- Triggers de mise à jour automatique du updated_at
-- =========================
CREATE TRIGGER IF NOT EXISTS trg_upd_inspecteur
AFTER UPDATE ON inspecteur
FOR EACH ROW
BEGIN
    UPDATE inspecteur SET updated_at = CURRENT_TIMESTAMP WHERE id_inspecteur = OLD.id_inspecteur;
END;

CREATE TRIGGER IF NOT EXISTS trg_upd_district
AFTER UPDATE ON district
FOR EACH ROW
BEGIN
    UPDATE district SET updated_at = CURRENT_TIMESTAMP WHERE id_district = OLD.id_district;
END;

CREATE TRIGGER IF NOT EXISTS trg_upd_college
AFTER UPDATE ON college
FOR EACH ROW
BEGIN
    UPDATE college SET updated_at = CURRENT_TIMESTAMP WHERE id_college = OLD.id_college;
END;

CREATE TRIGGER IF NOT EXISTS trg_upd_ecole
AFTER UPDATE ON ecole
FOR EACH ROW
BEGIN
    UPDATE ecole SET updated_at = CURRENT_TIMESTAMP WHERE id_ecole = OLD.id_ecole;
END;

CREATE TRIGGER IF NOT EXISTS trg_upd_inspection
AFTER UPDATE ON inspection
FOR EACH ROW
BEGIN
    UPDATE inspection SET updated_at = CURRENT_TIMESTAMP WHERE id_inspection = OLD.id_inspection;
END;




INSERT INTO district (
    numero,
    ville,
    responsable_inspecteur_id,
    created_at,
    updated_at
) VALUES (
    '6',
    'بسكرة',
    1,                  -- id_inspecteur existant
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);