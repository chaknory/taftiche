<?php
// Full integration test for job_rank update
require_once 'api/config.php';
require_once 'api/auth/db.php';

$pdo = getAuthConnection();

// Get first record
$stmt = $pdo->query("SELECT id, job_rank, first_name, family_name, email FROM personal_info LIMIT 1");
$rec = $stmt->fetch();
echo "Record found: id=" . $rec['id'] . " name=" . $rec['first_name'] . " " . $rec['family_name'] . "\n";
echo "Current job_rank: " . var_export($rec['job_rank'], true) . "\n";

// Simulate PUT body
$body = [
    'id'         => $rec['id'],
    'job_rank'   => 'أستاذ تعليم إبتدائي قسم ثاني',
    'first_name' => $rec['first_name'],
    'family_name'=> $rec['family_name'],
    'email'      => $rec['email'],
];

// Simulate PHP PUT handler's $s function
$s = fn($k) => isset($body[$k]) ? htmlspecialchars(trim($body[$k]), ENT_QUOTES, 'UTF-8') : $rec[$k];
$rank = $s('job_rank');
echo "Rank to save: " . var_export($rank, true) . "\n";
echo "Rank ?: null: " . var_export($rank ?: null, true) . "\n";

// Execute UPDATE
try {
    $pdo->prepare("UPDATE personal_info SET job_rank=:rnk WHERE id=:id")
        ->execute([':rnk' => $rank ?: null, ':id' => $rec['id']]);
    echo "UPDATE executed OK\n";
} catch (Exception $e) {
    echo "UPDATE FAILED: " . $e->getMessage() . "\n";
}

// Verify
$stmt2 = $pdo->prepare("SELECT job_rank FROM personal_info WHERE id=:id");
$stmt2->execute([':id' => $rec['id']]);
$rec2 = $stmt2->fetch();
echo "After UPDATE: job_rank=" . var_export($rec2['job_rank'], true) . "\n";

// Restore
$pdo->prepare("UPDATE personal_info SET job_rank=:rnk WHERE id=:id")
    ->execute([':rnk' => $rec['job_rank'], ':id' => $rec['id']]);
echo "Restored to: " . var_export($rec['job_rank'], true) . "\n";
