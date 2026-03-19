<?php
$db  = __DIR__ . '/personal_info.sqlite';
$pdo = new PDO('sqlite:' . $db);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->exec('PRAGMA foreign_keys = ON;');

$migrations = [
    'requests.sql',
];

foreach ($migrations as $file) {
    $raw = file_get_contents(__DIR__ . '/' . $file);
    // Strip single-line SQL comments (-- …) before splitting
    $noComments = preg_replace('/--[^\n]*/', '', $raw);
    $statements = array_filter(array_map('trim', explode(';', $noComments)));

    foreach ($statements as $st) {
        if ($st === '') continue;
        try {
            // Read queries (SELECT/PRAGMA/CTE) must use query() to fetch rows.
            if (preg_match('/^\s*(SELECT|WITH|PRAGMA|EXPLAIN)\b/i', $st)) {
                $stmt = $pdo->query($st);
                $rows = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];
                $out = [
                    'file' => $file,
                    'type' => 'select',
                    'query' => $st,
                    'rowCount' => count($rows),
                    'rows' => $rows,
                ];
                echo json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . "\n";
            } else {
                $affected = $pdo->exec($st);
                $out = [
                    'file' => $file,
                    'type' => 'execute',
                    'query' => $st,
                    'affectedRows' => (int)$affected,
                ];
                echo json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . "\n";
            }
        } catch (PDOException $e) {
            $out = [
                'file' => $file,
                'type' => 'error',
                'query' => $st,
                'message' => $e->getMessage(),
            ];
            echo json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . "\n";
        }
    }
}
