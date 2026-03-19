-- =============================================
-- Migration : tables التقييمات
-- Schéma réel (adapté à l'existant)
-- evaluations        : id, inspection_id, note_finale, titre, created_at, updated_at
-- evaluation_sections: id, evaluation_id, ordre, titre, type, contenu
-- evaluation_items   : id, section_id, ordre, item
-- Compatible SQLite 3
-- =============================================

-- Table principale : تقييمات
CREATE TABLE IF NOT EXISTS evaluations (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    inspection_id   INTEGER DEFAULT NULL,              -- زيارة التفتيش المرتبطة (اختياري)
    note_finale     TEXT    DEFAULT NULL,              -- العلامة النهائية (0–20)
    titre           TEXT    DEFAULT '',               -- عنوان التقييم
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT,
    FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE SET NULL
);

-- Ajoute titre si la table existait déjà sans elle
-- ALTER TABLE evaluations ADD COLUMN titre TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_evaluations_inspection ON evaluations(inspection_id);

CREATE TRIGGER IF NOT EXISTS trg_evaluations_updated_at
AFTER UPDATE ON evaluations
FOR EACH ROW
BEGIN
    UPDATE evaluations SET updated_at = datetime('now') WHERE id = OLD.id;
END;

-- Sections d'une évaluation : أقسام التقييم
CREATE TABLE IF NOT EXISTS evaluation_sections (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    evaluation_id   INTEGER NOT NULL,
    ordre           INTEGER NOT NULL DEFAULT 0,
    titre           TEXT    NOT NULL,
    type            TEXT    NOT NULL DEFAULT 'texte' CHECK(type IN ('texte','liste')),
    contenu         TEXT    DEFAULT NULL,
    FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_eval_sections_evaluation ON evaluation_sections(evaluation_id);

-- Items d'une section : بنود القسم
CREATE TABLE IF NOT EXISTS evaluation_items (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    section_id      INTEGER NOT NULL,
    ordre           INTEGER NOT NULL DEFAULT 0,
    item            TEXT    NOT NULL,
    FOREIGN KEY (section_id) REFERENCES evaluation_sections(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_eval_items_section ON evaluation_items(section_id);
