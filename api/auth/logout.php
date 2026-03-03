<?php
/**
 * POST /api/auth/logout.php
 * Détruit la session et supprime le cookie "تذكرني".
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once __DIR__ . '/db.php';

session_name('TAFTICHE_SESSION');
session_start();

// Effacer le remember_token en base si présent
if (!empty($_SESSION['user']['id'])) {
    try {
        $pdo = getAuthConnection();
        $pdo->prepare("UPDATE users SET remember_token = NULL WHERE id = :id")
            ->execute([':id' => $_SESSION['user']['id']]);
    } catch (Exception $e) {
        // Non bloquant
    }
}

// Vider la session
$_SESSION = [];

// Supprimer le cookie de session
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(), '', time() - 42000,
        $params['path'], $params['domain'],
        $params['secure'], $params['httponly']
    );
}

// Supprimer le cookie remember_token
if (isset($_COOKIE['remember_token'])) {
    setcookie('remember_token', '', [
        'expires'  => time() - 3600,
        'path'     => '/',
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
}

session_destroy();

authJsonResponse(true, 'تم تسجيل الخروج بنجاح');
