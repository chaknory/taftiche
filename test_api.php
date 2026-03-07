<?php
// Test GET response for personal_info
require_once 'api/auth/db.php';

$pdo = getAuthConnection();

$stmt = $pdo->query(
    "SELECT id, first_name, family_name, job_rank, status FROM personal_info LIMIT 3"
);
$records = $stmt->fetchAll();
echo json_encode(['success' => true, 'records' => $records], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
echo "\n\n";
echo "job_rank values: \n";
foreach ($records as $r) {
    echo "  id={$r['id']}: job_rank=" . var_export($r['job_rank'], true) . "\n";
}

// Test PUT simulation
echo "\n\nSimulate PUT for id=" . $records[0]['id'] . " with job_rank='أستاذ تعليم إبتدائي قسم ثاني'\n";
$body = [
    'id' => $records[0]['id'],
    'job_rank' => 'أستاذ تعليم إبتدائي قسم ثاني',
];
$rec = $records[0];
$s = fn($k) => isset($body[$k]) ? htmlspecialchars(trim($body[$k]), ENT_QUOTES, 'UTF-8') : $rec[$k];
$rank = $s('job_rank');
echo "Rank to save: " . var_export($rank, true) . " (null if empty: " . var_export($rank ?: null, true) . ")\n";
