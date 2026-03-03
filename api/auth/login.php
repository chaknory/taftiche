<?php
/**
 * POST /api/auth/login.php
 * Corps JSON : { "username": "…", "password": "…", "remember_me": true|false }
 *
 * Sécurités :
 *  - Verrouillage du compte après MAX_FAILED_ATTEMPTS échecs consécutifs
 *  - Hachage bcrypt / argon2id via password_verify()
 *  - Session régénérée à chaque login
 *  - Cookie "tذكرني" HttpOnly + SameSite=Strict
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'طريقة الطلب غير مسموح بها']);
    exit;
}

require_once __DIR__ . '/db.php';

// ── Démarrage session ──────────────────────────────────────────────────────
session_name('TAFTICHE_SESSION');
session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'secure'   => false,      // mettre true en HTTPS
    'httponly' => true,
    'samesite' => 'Strict',
]);
session_start();

try {
    // ── Lecture entrée JSON ────────────────────────────────────────────────
    $body = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        authJsonResponse(false, 'بيانات JSON غير صالحة', 400);
    }

    $identifier = trim($body['username'] ?? '');
    $password   = $body['password']    ?? '';
    $rememberMe = !empty($body['remember_me']);

    if ($identifier === '' || $password === '') {
        authJsonResponse(false, 'يرجى ملء جميع الحقول', 422);
    }

    $pdo  = getAuthConnection();
    $user = findUserByIdentifier($pdo, $identifier);

    // ── Utilisateur inexistant ─────────────────────────────────────────────
    if (!$user) {
        // Même délai que si mauvais mot de passe (anti-timing)
        password_verify($password, '$2y$12$invalidhashinvalidhashinvalidha.');
        authJsonResponse(false, 'اسم المستخدم أو كلمة المرور غير صحيحة', 401);
    }

    // ── Compte désactivé ──────────────────────────────────────────────────
    if (!$user['is_active']) {
        authJsonResponse(false, 'الحساب معطّل، يرجى التواصل مع المسؤول', 403);
    }

    // ── Compte verrouillé ? ────────────────────────────────────────────────
    if ($user['locked_until'] && strtotime($user['locked_until']) > time()) {
        $remaining = ceil((strtotime($user['locked_until']) - time()) / 60);
        authJsonResponse(false, "الحساب مقفل مؤقتًا، حاول مجددًا بعد {$remaining} دقيقة", 429);
    }

    // ── Vérification mot de passe ──────────────────────────────────────────
    if (!password_verify($password, $user['password_hash'])) {
        $newAttempts = (int)$user['failed_attempts'] + 1;
        $lockedUntil = null;

        if ($newAttempts >= MAX_FAILED_ATTEMPTS) {
            $lockedUntil = date('Y-m-d H:i:s', strtotime('+' . LOCK_DURATION_MINUTES . ' minutes'));
        }

        $upd = $pdo->prepare(
            "UPDATE users SET failed_attempts = :a, locked_until = :l WHERE id = :id"
        );
        $upd->execute([':a' => $newAttempts, ':l' => $lockedUntil, ':id' => $user['id']]);

        $remaining = MAX_FAILED_ATTEMPTS - $newAttempts;
        $msg = $remaining > 0
            ? "كلمة المرور غير صحيحة – تبقى {$remaining} محاولة"
            : 'الحساب مقفل مؤقتًا بسبب محاولات الدخول المتكررة';

        authJsonResponse(false, $msg, 401);
    }

    // ── Mot de passe correct ──────────────────────────────────────────────

    // Mise à jour : réinitialiser les tentatives, enregistrer last_login
    $upd = $pdo->prepare(
        "UPDATE users SET failed_attempts = 0, locked_until = NULL,
                          last_login = datetime('now') WHERE id = :id"
    );
    $upd->execute([':id' => $user['id']]);

    // Regénérer l'identifiant de session (protection fixation)
    session_regenerate_id(true);

    // Stocker les infos utilisateur en session
    $_SESSION['user'] = [
        'id'         => $user['id'],
        'username'   => $user['username'],
        'first_name' => $user['first_name'],
        'last_name'  => $user['last_name'],
        'email'      => $user['email'],
        'role'       => $user['role'],
    ];

    // ── Cookie "تذكرني" ───────────────────────────────────────────────────
    if ($rememberMe) {
        $token    = bin2hex(random_bytes(32));
        $expires  = time() + (REMEMBER_COOKIE_DAYS * 86400);
        $hashTok  = hash('sha256', $token);

        $pdo->prepare("UPDATE users SET remember_token = :t WHERE id = :id")
            ->execute([':t' => $hashTok, ':id' => $user['id']]);

        setcookie('remember_token', $token, [
            'expires'  => $expires,
            'path'     => '/',
            'secure'   => false,
            'httponly' => true,
            'samesite' => 'Strict',
        ]);
    }

    authJsonResponse(true, 'تم تسجيل الدخول بنجاح', 200, [
        'user' => $_SESSION['user'],
    ]);

} catch (Exception $e) {
    error_log('Auth login error: ' . $e->getMessage());
    authJsonResponse(false, 'حدث خطأ في الخادم', 500);
}
