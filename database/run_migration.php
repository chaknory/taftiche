<?php
$db  = __DIR__ . '/personal_info.sqlite';
$pdo = new PDO('sqlite:' . $db);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$raw = file_get_contents(__DIR__ . '/migrate_add_missing_fields.sql');

// Strip single-line SQL comments (-- …) before splitting
$noComments = preg_replace('/--[^\n]*/', '', $raw);
$statements = array_filter(array_map('trim', explode(';', $noComments)));

foreach ($statements as $st) {
    if ($st === '') continue;
    try {
        $pdo->exec($st);
        echo "OK  : " . substr($st, 0, 80) . "\n";
    } catch (PDOException $e) {
        echo "SKIP: " . $e->getMessage() . "\n";
    }
}
echo "\nMigration terminée.\n";
