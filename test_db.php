<?php
/**
 * test_db.php — Diagnostic de connexion à la base de données
 *
 * UTILISATION :
 *   1. Vérifiez que DB_DRIVER = 'mysql' dans api/config.php
 *   2. Uploadez ce fichier sur l'hébergeur
 *   3. Ouvrez-le dans le navigateur : https://votre-site.com/test_db.php
 *   4. SUPPRIMEZ ce fichier après le test (infos sensibles)
 */

// Bloquer l'accès si ce n'est pas localhost (sécurité minimale en production)
$allowedIPs = ['127.0.0.1', '::1'];
if (!in_array($_SERVER['REMOTE_ADDR'] ?? '', $allowedIPs, true)) {
    // Autoriser quand même si un token secret est passé en GET
    $secretToken = 'CHANGE_ME_BEFORE_UPLOAD'; // ← modifiez cette valeur
    if (($_GET['token'] ?? '') !== $secretToken) {
        http_response_code(403);
        die('Accès refusé. Passez ?token=VOTRE_TOKEN dans l\'URL.');
    }
}

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Test connexion DB</title>
    <style>
        body { font-family: monospace; padding: 2rem; background: #1e1e1e; color: #d4d4d4; }
        .ok  { color: #4ec94e; }
        .err { color: #f44747; }
        .warn{ color: #dcdcaa; }
        pre  { background: #252526; padding: 1rem; border-radius: 6px; }
        h2   { border-bottom: 1px solid #444; padding-bottom: .4rem; }
    </style>
</head>
<body>
<h1>Diagnostic connexion base de données</h1>

<?php

require_once __DIR__ . '/api/config.php';

echo '<h2>1. Configuration lue</h2><pre>';
echo 'DB_DRIVER   : <span class="warn">' . DB_DRIVER . "</span>\n";

if (DB_DRIVER === 'mysql') {
    echo 'DB_HOST     : ' . DB_MYSQL_HOST . "\n";
    echo 'DB_PORT     : ' . DB_MYSQL_PORT . "\n";
    echo 'DB_NAME     : ' . DB_MYSQL_DBNAME . "\n";
    echo 'DB_USER     : ' . DB_MYSQL_USER . "\n";
    echo 'DB_PASSWORD : ' . str_repeat('*', strlen(DB_MYSQL_PASSWORD)) . "\n";
} else {
    echo 'DB_SQLITE   : ' . DB_SQLITE_PATH . "\n";
}
echo '</pre>';

// ── Test 1 : extension PDO disponible ─────────────────────────────────────────
echo '<h2>2. Extensions PHP</h2><pre>';
$pdoOk = extension_loaded('pdo');
$driverOk = (DB_DRIVER === 'mysql')
    ? extension_loaded('pdo_mysql')
    : extension_loaded('pdo_sqlite');

echo 'PDO           : ' . ($pdoOk    ? '<span class="ok">OK</span>' : '<span class="err">MANQUANT</span>') . "\n";
echo 'PDO_' . strtoupper(DB_DRIVER) . '     : ' . ($driverOk ? '<span class="ok">OK</span>' : '<span class="err">MANQUANT</span>') . "\n";
echo 'Drivers dispo : ' . implode(', ', PDO::getAvailableDrivers()) . "\n";
echo '</pre>';

if (!$pdoOk || !$driverOk) {
    echo '<p class="err">Impossible de continuer : extension manquante.</p>';
    exit;
}

// ── Test 2 : connexion PDO ────────────────────────────────────────────────────
echo '<h2>3. Connexion PDO</h2><pre>';
try {
    $pdo = db_connect();
    echo '<span class="ok">Connexion réussie !</span>' . "\n";

    // Version du serveur
    $version = $pdo->query('SELECT VERSION()')->fetchColumn();
    echo 'Version MySQL : ' . $version . "\n";

} catch (PDOException $e) {
    echo '<span class="err">ÉCHEC : ' . htmlspecialchars($e->getMessage(), ENT_QUOTES, 'UTF-8') . '</span>' . "\n";
    echo '</pre>';
    exit;
}
echo '</pre>';

// ── Test 3 : tables existantes ────────────────────────────────────────────────
echo '<h2>4. Tables dans la base de données</h2><pre>';
try {
    if (DB_DRIVER === 'mysql') {
        $tables = $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
    } else {
        $tables = $pdo->query("SELECT name FROM sqlite_master WHERE type='table'")->fetchAll(PDO::FETCH_COLUMN);
    }

    if (empty($tables)) {
        echo '<span class="warn">Aucune table trouvée — la base est vide (migration non exécutée ?).</span>' . "\n";
    } else {
        echo count($tables) . " table(s) trouvée(s) :\n";
        foreach ($tables as $t) {
            echo '  • ' . $t . "\n";
        }
    }
} catch (PDOException $e) {
    echo '<span class="err">Erreur : ' . htmlspecialchars($e->getMessage(), ENT_QUOTES, 'UTF-8') . '</span>' . "\n";
}
echo '</pre>';

// ── Test 4 : lecture d'une ligne dans personal_info ───────────────────────────
if (in_array('personal_info', $tables ?? [])) {
    echo '<h2>5. Lecture dans personal_info</h2><pre>';
    try {
        $count  = $pdo->query('SELECT COUNT(*) FROM personal_info')->fetchColumn();
        $sample = $pdo->query('SELECT id, first_name, family_name FROM personal_info LIMIT 1')->fetch(PDO::FETCH_ASSOC);
        echo "Nombre de lignes : $count\n";
        if ($sample) {
            echo 'Exemple         : ' . json_encode($sample, JSON_UNESCAPED_UNICODE) . "\n";
        }
        echo '<span class="ok">Lecture OK</span>' . "\n";
    } catch (PDOException $e) {
        echo '<span class="err">Erreur : ' . htmlspecialchars($e->getMessage(), ENT_QUOTES, 'UTF-8') . '</span>' . "\n";
    }
    echo '</pre>';
}

?>

<p class="warn">⚠ Pensez à <strong>supprimer ce fichier</strong> après le diagnostic.</p>
</body>
</html>
