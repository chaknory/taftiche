-- =============================================
-- Migration : ajout de la table inspections
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
