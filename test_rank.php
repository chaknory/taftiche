<?php
$pdo = new PDO('sqlite:database/personal_info.sqlite', null, null, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
]);
$existing = $pdo->prepare('SELECT job_rank, status, first_name FROM personal_info WHERE id = :id');
$existing->execute([':id' => 4]);
$rec = $existing->fetch();
echo "Before update: job_rank=" . var_export($rec['job_rank'], true) . "\n";

$body = ['id' => 4, 'job_rank' => 'NEW_RANK_TEST'];
$s = fn($k) => isset($body[$k]) ? htmlspecialchars(trim($body[$k]), ENT_QUOTES, 'UTF-8') : $rec[$k];
$rank = $s('job_rank');
echo "rank value to save: " . var_export($rank, true) . "\n";
echo "rank ?: null: " . var_export($rank ?: null, true) . "\n";

// Now test actual UPDATE
$pdo->prepare(
    "UPDATE personal_info SET job_rank=:rnk WHERE id=:id"
)->execute([':rnk' => $rank ?: null, ':id' => 4]);

$existing2 = $pdo->prepare('SELECT job_rank FROM personal_info WHERE id = :id');
$existing2->execute([':id' => 4]);
$rec2 = $existing2->fetch();
echo "After update: job_rank=" . var_export($rec2['job_rank'], true) . "\n";

// Restore original
$pdo->prepare("UPDATE personal_info SET job_rank=:rnk WHERE id=:id")
    ->execute([':rnk' => $rec['job_rank'], ':id' => 4]);
echo "Restored: job_rank=" . var_export($rec['job_rank'], true) . "\n";
