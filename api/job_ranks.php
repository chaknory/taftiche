<?php
/**
 * API – Liste des valeurs autorisées pour job_rank
 * =================================================
 * GET  /api/job_ranks.php  → { "success": true, "ranks": ["...", ...] }
 *
 * Ce fichier est la source unique de vérité pour les options
 * du champ job_rank (utilisé par index.html et admin.html).
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../utils/job_rank.php';

$ranks = array_map(fn(JobRank $r) => $r->value, JobRank::all());

echo json_encode(['success' => true, 'ranks' => $ranks], JSON_UNESCAPED_UNICODE);
