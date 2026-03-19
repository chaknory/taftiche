<?php
/**
 * Connexion partagée à la base de données.
 * Supporte SQLite (local) et MySQL (production).
 * Le pilote actif est défini dans api/config.php (constante DB_DRIVER).
 */

require_once __DIR__ . '/../config.php';

// Durée max de verrouillage après trop d'échecs (minutes)
define('LOCK_DURATION_MINUTES', 15);
// Nombre d'échecs avant verrouillage
define('MAX_FAILED_ATTEMPTS', 5);
// Durée du cookie "تذكرني" (jours)
define('REMEMBER_COOKIE_DAYS', 30);

/**
 * Retourne la connexion PDO partagée.
 * Pour SQLite : crée et initialise la base si elle n'existe pas encore.
 * Pour MySQL  : se connecte au serveur configuré dans config.php.
 */
function getAuthConnection(): PDO
{
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    if (DB_DRIVER === 'mysql') {
        $pdo = db_connect();
        return $pdo;
    }

    // ── SQLite ────────────────────────────────────────────────────────────────
    $isNew = !file_exists(DB_SQLITE_PATH);
    $pdo   = new PDO('sqlite:' . DB_SQLITE_PATH, null, null, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $pdo->exec('PRAGMA journal_mode = WAL;');
    $pdo->exec('PRAGMA foreign_keys = ON;');
    $pdo->exec('PRAGMA synchronous   = NORMAL;');

    // Si la base est toute nouvelle, applique le schéma complet
    if ($isNew) {
        $pdo->exec(file_get_contents(DB_SCHEMA_SQLITE));
        return $pdo;
    }

    // Si la base existait déjà, s'assure que toutes les tables existent
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name          TEXT    NOT NULL,
            last_name           TEXT    NOT NULL,
            email               TEXT    NOT NULL UNIQUE,
            username            TEXT    NOT NULL UNIQUE,
            password_hash       TEXT    NOT NULL,
            role                TEXT    NOT NULL DEFAULT 'user'
                                        CHECK(role IN ('admin','user')),
            is_active           INTEGER NOT NULL DEFAULT 1
                                        CHECK(is_active IN (0,1)),
            failed_attempts     INTEGER NOT NULL DEFAULT 0,
            locked_until        TEXT,
            remember_token      TEXT,
            reset_token         TEXT,
            reset_token_expires TEXT,
            last_login          TEXT,
            created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
            updated_at          TEXT
        );
    ");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_users_email    ON users(email);");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_users_remember ON users(remember_token);");

    // Table personal_info
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS personal_info (
            id                       INTEGER PRIMARY KEY AUTOINCREMENT,
            district                 TEXT    NOT NULL DEFAULT '11',
            school_year              TEXT    NOT NULL DEFAULT '2025 / 2026',
            school_name              TEXT    NOT NULL DEFAULT '',
            years_worked             INTEGER NOT NULL DEFAULT 0,
            first_name               TEXT    NOT NULL,
            family_name              TEXT    NOT NULL,
            maiden_name              TEXT,
            birth_place              TEXT    NOT NULL DEFAULT '',
            residence                TEXT    NOT NULL DEFAULT '',
            marital_status           TEXT    NOT NULL DEFAULT 'أعزب',
            spouse_name              TEXT,
            birth_date               TEXT    NOT NULL DEFAULT '',
            gender                   TEXT    NOT NULL DEFAULT 'ذكر',
            phone                    TEXT    NOT NULL DEFAULT '',
            email                    TEXT    NOT NULL UNIQUE,
            school_entry_date        TEXT    NOT NULL DEFAULT (date('now')),
            diploma                  TEXT    NOT NULL DEFAULT '',
            first_appointment_date   TEXT,
            job_rank                 TEXT,
            status                   TEXT,
            echelon                  TEXT,
            grade                    TEXT,
            execution_date           TEXT,
            latest_inspection_date   TEXT,
            latest_inspection_score  INTEGER,
            last_inspection_date     TEXT,
            last_inspection_score    INTEGER,
            previous_year_class      TEXT,
            current_year_class       TEXT,
            student_count            INTEGER,
            haraka                   TEXT,
            class_note               TEXT,
            children_count           INTEGER,
            tech_institute_grad_year TEXT,
            university_grad_year     TEXT,
            created_at               TEXT    NOT NULL DEFAULT (datetime('now')),
            updated_at               TEXT
        );
    ");
    $pdo->exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_personal_info_email   ON personal_info(email);");
    $pdo->exec("CREATE INDEX        IF NOT EXISTS idx_personal_info_phone   ON personal_info(phone);");
    $pdo->exec("CREATE INDEX        IF NOT EXISTS idx_personal_info_created ON personal_info(created_at);");
    $pdo->exec("
        CREATE TRIGGER IF NOT EXISTS trg_personal_info_updated_at
        AFTER UPDATE ON personal_info
        FOR EACH ROW
        BEGIN
            UPDATE personal_info SET updated_at = datetime('now') WHERE id = OLD.id;
        END;
    ");

    // Table inspections
    $migration  = file_get_contents(__DIR__ . '/../../database/migrate_add_inspections.sql');
    $noComments = preg_replace('/--[^\n]*/', '', $migration);
    foreach (array_filter(array_map('trim', explode(';', $noComments))) as $st) {
        try { $pdo->exec($st); } catch (PDOException $e) { /* déjà existant */ }
    }

    // Table ecole (ajoutée après le schéma initial)
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS ecole (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            nom        TEXT    NOT NULL UNIQUE,
            district   TEXT    DEFAULT NULL,
            created_at TEXT    NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT
        );
    ");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_ecole_nom ON ecole(nom);");
    // Migrations : ajout des colonnes manquantes si elles n'existent pas
    $ecole_cols = ['district TEXT DEFAULT NULL', 'code TEXT DEFAULT NULL', 'adresse TEXT DEFAULT NULL',
                   'ville TEXT DEFAULT NULL', 'nb_directeur INTEGER DEFAULT 0', 'nb_sub_dir INTEGER DEFAULT 0',
                   'nb_Prf_arb INTEGER DEFAULT 0', 'nb_prf_frc INTEGER DEFAULT 0',
                   'nb_prf_ang INTEGER DEFAULT 0', 'nb_prf_sprt INTEGER DEFAULT 0'];
    foreach ($ecole_cols as $col) {
        $name = explode(' ', $col)[0];
        try { $pdo->exec("ALTER TABLE ecole ADD COLUMN $col"); } catch (PDOException $e) { /* déjà existant */ }
    }
    // Données initiales si la table est vide
    $count = $pdo->query("SELECT COUNT(*) FROM ecole")->fetchColumn();
    if ($count == 0) {
        $pdo->exec("INSERT OR IGNORE INTO ecole (nom) VALUES
            ('مدرسة نورالدين زنكي'),
            ('مدرسة أبوبكر الصديق'),
            ('مدرسة عمرالفاروق');");
    }

    // ── Tables التقييمات (évaluations) ──────────────────────────────────────
    // evaluations           : id, inspection_id, note_finale (TEXT), titre (TEXT), created_at, updated_at
    // evaluation_sections   : id, evaluation_id, ordre, titre, contenu
    // evaluation_subsections: id, section_id, ordre, type ('texte'|'liste'), contenu
    // evaluation_items      : id, subsection_id, ordre, item
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS evaluations (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            inspection_id   INTEGER DEFAULT NULL,
            note_finale     TEXT    DEFAULT NULL,
            created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
            updated_at      TEXT,
            FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE SET NULL
        );
    ");
    // Ajoute la colonne titre si elle n'existe pas encore (migration)
    try { $pdo->exec("ALTER TABLE evaluations ADD COLUMN titre TEXT DEFAULT ''"); } catch (PDOException $e) { /* déjà existante */ }
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_evaluations_inspection ON evaluations(inspection_id);");
    $pdo->exec("
        CREATE TRIGGER IF NOT EXISTS trg_evaluations_updated_at
        AFTER UPDATE ON evaluations
        FOR EACH ROW
        BEGIN
            UPDATE evaluations SET updated_at = datetime('now') WHERE id = OLD.id;
        END;
    ");

    // evaluation_sections : sans colonne type (déplacée vers evaluation_subsections)
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS evaluation_sections (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            evaluation_id   INTEGER NOT NULL,
            ordre           INTEGER NOT NULL DEFAULT 0,
            titre           TEXT    NOT NULL,
            contenu         TEXT    DEFAULT NULL,
            FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE
        );
    ");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_eval_sections_evaluation ON evaluation_sections(evaluation_id);");

    // Migration : supprimer la colonne type si elle existe encore (SQLite >= 3.35)
    try { $pdo->exec("ALTER TABLE evaluation_sections DROP COLUMN type"); } catch (PDOException $e) { /* déjà supprimée ou non supporté */ }

    // evaluation_subsections (nouvelle table)
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS evaluation_subsections (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            section_id INTEGER NOT NULL,
            ordre      INTEGER NOT NULL DEFAULT 0,
            type       TEXT    NOT NULL DEFAULT 'texte' CHECK(type IN ('texte','liste')),
            contenu    TEXT    DEFAULT NULL,
            FOREIGN KEY (section_id) REFERENCES evaluation_sections(id) ON DELETE CASCADE
        );
    ");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_eval_subsections_section ON evaluation_subsections(section_id);");

    // evaluation_items : Foreign key vers evaluation_subsections (subsection_id)
    // Migration : si la table existe encore avec section_id, la recréer proprement
    $evalItemsCols = $pdo->query("PRAGMA table_info(evaluation_items)")->fetchAll(PDO::FETCH_COLUMN, 1);
    if (empty($evalItemsCols) || !in_array('subsection_id', $evalItemsCols, true)) {
        // Table absente ou ancienne structure — recréer
        $pdo->exec("DROP TABLE IF EXISTS evaluation_items");
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS evaluation_items (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                subsection_id INTEGER NOT NULL,
                ordre         INTEGER NOT NULL DEFAULT 0,
                item          TEXT    NOT NULL,
                FOREIGN KEY (subsection_id) REFERENCES evaluation_subsections(id) ON DELETE CASCADE
            );
        ");
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_eval_items_subsection ON evaluation_items(subsection_id);");
    }

    return $pdo;
}

/**
 * Renvoie l'utilisateur à partir de son username OU email.
 */
function findUserByIdentifier(PDO $pdo, string $identifier): array|false
{
    $stmt = $pdo->prepare(
        "SELECT * FROM users WHERE (username = :id OR email = :id) LIMIT 1"
    );
    $stmt->execute([':id' => $identifier]);
    return $stmt->fetch();
}

/**
 * Renvoie une réponse JSON et termine l'exécution.
 */
function authJsonResponse(bool $success, string $message, int $status = 200, array $extra = []): void
{
    http_response_code($status);
    echo json_encode(
        array_merge(['success' => $success, 'message' => $message], $extra),
        JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT
    );
    exit;
}
