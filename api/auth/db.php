<?php
/**
 * Connexion partagée à la base de données SQLite
 * Utilisée par tous les endpoints d'authentification.
 *
 * - Crée le fichier DB s'il n'existe pas
 * - Applique le schéma complet (personal_info + users)
 * - Crée la table `users` séparément si la DB existait déjà
 */

define('AUTH_DB_PATH',    __DIR__ . '/../../database/personal_info.sqlite');
define('AUTH_DB_SCHEMA',  __DIR__ . '/../../database/schema.sql');

// Durée max de verrouillage après trop d'échecs (minutes)
define('LOCK_DURATION_MINUTES', 15);
// Nombre d'échecs avant verrouillage
define('MAX_FAILED_ATTEMPTS', 5);
// Durée du cookie "tذكرني" (jours)
define('REMEMBER_COOKIE_DAYS', 30);

function getAuthConnection(): PDO
{
    $isNew = !file_exists(AUTH_DB_PATH);

    $pdo = new PDO('sqlite:' . AUTH_DB_PATH, null, null, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    $pdo->exec('PRAGMA journal_mode = WAL;');
    $pdo->exec('PRAGMA foreign_keys = ON;');
    $pdo->exec('PRAGMA synchronous   = NORMAL;');

    // Si la base est toute nouvelle, applique le schéma complet
    if ($isNew) {
        $schema = file_get_contents(AUTH_DB_SCHEMA);
        $pdo->exec($schema);
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

    // Tables inspections / evaluations / observations
    $migration = file_get_contents(__DIR__ . '/../../database/migrate_add_inspections.sql');
    $noComments = preg_replace('/--[^\n]*/', '', $migration);
    foreach (array_filter(array_map('trim', explode(';', $noComments))) as $st) {
        try { $pdo->exec($st); } catch (PDOException $e) { /* déjà existant */ }
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
