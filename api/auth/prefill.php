<?php
/**
 * GET /api/auth/prefill.php
 * Retourne les données de la table personal_info pour l'utilisateur connecté.
 * La correspondance est faite sur l'email (unique dans les deux tables).
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once __DIR__ . '/db.php';

session_name('TAFTICHE_SESSION');
session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'secure'   => false,
    'httponly' => true,
    'samesite' => 'Strict',
]);
session_start();

// Vérifie que l'utilisateur est authentifié
if (empty($_SESSION['user'])) {
    authJsonResponse(false, 'غير مسجل الدخول', 401);
}

try {
    $pdo   = getAuthConnection();
    $email = $_SESSION['user']['email'];

    $stmt = $pdo->prepare(
        "SELECT * FROM personal_info WHERE email = :email LIMIT 1"
    );
    $stmt->execute([':email' => $email]);
    $info = $stmt->fetch();

    if (!$info) {
        // Aucune fiche trouvée : réponse succès avec data = null
        authJsonResponse(true, 'aucune donnée', 200, ['data' => null]);
    }

    authJsonResponse(true, 'ok', 200, ['data' => $info]);

} catch (Exception $e) {
    error_log('Prefill error: ' . $e->getMessage());
    authJsonResponse(false, 'حدث خطأ في الخادم', 500);
}
