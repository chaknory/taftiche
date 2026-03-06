-- =============================================
-- Migration : ajout des tables inspections, evaluations, observations
-- à exécuter UNE SEULE FOIS sur une base existante
-- SQLite 3
-- =============================================

-- Activer les clés étrangères (à faire dans chaque connexion SQLite)
PRAGMA foreign_keys = ON;

-- -----------------------------------------------
-- Table des inspections
-- جدول التفتيشات
-- -----------------------------------------------

CREATE TABLE IF NOT EXISTS inspections (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    personal_info_id    INTEGER NOT NULL,
    inspector_name      TEXT    NOT NULL,
    inspection_date     TEXT    NOT NULL,
    school_name         TEXT,
    subject             TEXT,
    created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at          TEXT,
    FOREIGN KEY (personal_info_id) REFERENCES personal_info(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_inspections_personal ON inspections(personal_info_id);
CREATE INDEX IF NOT EXISTS idx_inspections_date     ON inspections(inspection_date);

CREATE TRIGGER IF NOT EXISTS trg_inspections_updated_at
AFTER UPDATE ON inspections
FOR EACH ROW
BEGIN
    UPDATE inspections SET updated_at = datetime('now') WHERE id = OLD.id;
END;

-- -----------------------------------------------
-- Table des évaluations
-- جدول التقييمات
-- -----------------------------------------------

CREATE TABLE IF NOT EXISTS evaluations (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    inspection_id       INTEGER NOT NULL,
    points_forts        TEXT,
    points_faibles      TEXT,
    recommandations     TEXT,
    note_finale         TEXT,
    created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at          TEXT,
    FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_evaluations_inspection ON evaluations(inspection_id);

CREATE TRIGGER IF NOT EXISTS trg_evaluations_updated_at
AFTER UPDATE ON evaluations
FOR EACH ROW
BEGIN
    UPDATE evaluations SET updated_at = datetime('now') WHERE id = OLD.id;
END;

-- -----------------------------------------------
-- Table des observations en classe
-- جدول الملاحظات الصفية
-- -----------------------------------------------

CREATE TABLE IF NOT EXISTS observations (
    id                          INTEGER PRIMARY KEY AUTOINCREMENT,
    inspection_id               INTEGER NOT NULL,
    comportement_professionnel  TEXT,
    respect_instructions        TEXT,
    preparation_pedagogique     TEXT,
    strategie_enseignement      TEXT,
    participation_eleves        TEXT,
    gestion_classe              TEXT,
    maitrise_contenu            TEXT,
    moyens_didactiques          TEXT,
    remarques_supplementaires   TEXT,
    created_at                  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at                  TEXT,
    FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_observations_inspection ON observations(inspection_id);

CREATE TRIGGER IF NOT EXISTS trg_observations_updated_at
AFTER UPDATE ON observations
FOR EACH ROW
BEGIN
    UPDATE observations SET updated_at = datetime('now') WHERE id = OLD.id;
END;
