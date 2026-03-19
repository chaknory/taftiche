<?php
/**
 * ================================================================
 * Configuration de la base de données — Taftiche
 * ================================================================
 *
 * Modifiez DB_DRIVER pour basculer entre les deux modes :
 *
 *   'sqlite' → développement local (aucun serveur MySQL requis)
 *   'mysql'  → hébergement de production
 *
 * ================================================================
 */

define('DB_DRIVER', 'sqlite');   // ← changer ici : 'sqlite' ou 'mysql'
//define('DB_DRIVER', 'mysql'); 
// ── SQLite ────────────────────────────────────────────────────────────────────
// Chemin vers le fichier de base de données SQLite
define('DB_SQLITE_PATH',   __DIR__ . '/../database/personal_info.sqlite');

// Chemin vers le schéma SQL SQLite (utilisé pour initialiser une nouvelle DB)
define('DB_SCHEMA_SQLITE', __DIR__ . '/../database/schema.sql');

// ── MySQL ─────────────────────────────────────────────────────────────────────
// À renseigner avec les informations fournies par votre hébergeur
define('DB_MYSQL_HOST',     'localhost');
define('DB_MYSQL_PORT',     '3306');
define('DB_MYSQL_DBNAME',   'taftiche');       // nom de la base de données
define('DB_MYSQL_USER',     'taftiche_user');  // nom d'utilisateur MySQL
define('DB_MYSQL_PASSWORD', 'change_me');      // mot de passe MySQL

// ── Helpers communs ───────────────────────────────────────────────────────────

/**
 * Retourne l'expression SQL pour l'heure courante selon le pilote actif.
 *  - SQLite : datetime('now')
 *  - MySQL  : NOW()
 */
function db_now(): string
{
    return DB_DRIVER === 'mysql' ? 'NOW()' : "datetime('now')";
}

/**
 * Crée et retourne une connexion PDO selon le pilote configuré.
 * La connexion est mise en cache (singleton) pour la durée du script.
 */
function db_connect(): PDO
{
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    if (DB_DRIVER === 'mysql') {
        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
            DB_MYSQL_HOST,
            DB_MYSQL_PORT,
            DB_MYSQL_DBNAME
        );
        $pdo = new PDO($dsn, DB_MYSQL_USER, DB_MYSQL_PASSWORD, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
        ]);
        return $pdo;
    }

    // SQLite
    $isNew = !file_exists(DB_SQLITE_PATH);
    $pdo   = new PDO('sqlite:' . DB_SQLITE_PATH, null, null, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $pdo->exec('PRAGMA journal_mode = WAL;');
    $pdo->exec('PRAGMA foreign_keys = ON;');
    $pdo->exec('PRAGMA synchronous   = NORMAL;');

    if ($isNew) {
        $pdo->exec(file_get_contents(DB_SCHEMA_SQLITE));
    }

    return $pdo;
}
