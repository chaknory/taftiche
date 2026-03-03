<?php
/**
 * GET /api/auth/session.php
 * Retourne l'état de la session courante.
 * Prend aussi en charge la reconnexion automatique via le cookie "تذكرني".
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

// ── Session active ────────────────────────────────────────────────────────
if (!empty($_SESSION['user'])) {
    authJsonResponse(true, 'session active', 200, ['user' => $_SESSION['user']]);
}

// ── Tentative de reconnexion via cookie "تذكرني" ─────────────────────────
if (!empty($_COOKIE['remember_token'])) {
    try {
        $pdo       = getAuthConnection();
        $hashTok   = hash('sha256', $_COOKIE['remember_token']);
        $stmt      = $pdo->prepare(
            "SELECT * FROM users WHERE remember_token = :t AND is_active = 1 LIMIT 1"
        );
        $stmt->execute([':t' => $hashTok]);
        $user = $stmt->fetch();

        if ($user) {
            // Rotation du token (sécurité)
            $newToken = bin2hex(random_bytes(32));
            $pdo->prepare("UPDATE users SET remember_token = :t, last_login = datetime('now') WHERE id = :id")
                ->execute([':t' => hash('sha256', $newToken), ':id' => $user['id']]);

            setcookie('remember_token', $newToken, [
                'expires'  => time() + (REMEMBER_COOKIE_DAYS * 86400),
                'path'     => '/',
                'secure'   => false,
                'httponly' => true,
                'samesite' => 'Strict',
            ]);

            session_regenerate_id(true);
            $_SESSION['user'] = [
                'id'         => $user['id'],
                'username'   => $user['username'],
                'first_name' => $user['first_name'],
                'last_name'  => $user['last_name'],
                'email'      => $user['email'],
                'role'       => $user['role'],
            ];

            authJsonResponse(true, 'session restaurée', 200, ['user' => $_SESSION['user']]);
        }
    } catch (Exception $e) {
        // Cookie invalide → continuer
    }
}

// ── Non authentifié ───────────────────────────────────────────────────────
authJsonResponse(false, 'غير مسجل الدخول', 401);
