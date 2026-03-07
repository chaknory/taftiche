<?php
/**
 * POST /api/auth/reset_password.php
 * Corps JSON : { "token": "…", "password": "…", "password_confirm": "…" }
 *
 * - Vérifie le token (SHA-256) stocké en base et son expiration
 * - Valide le nouveau mot de passe selon la même politique que register.php
 * - Met à jour le hash, invalide le token, remet à zéro les tentatives échouées
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

function respond(bool $ok, string $msg, int $code = 200): void
{
    http_response_code($code);
    echo json_encode(['success' => $ok, 'message' => $msg]);
    exit;
}

try {
    $body = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        respond(false, 'بيانات JSON غير صالحة', 400);
    }

    $rawToken        = trim($body['token']            ?? '');
    $password        = $body['password']              ?? '';
    $passwordConfirm = $body['password_confirm']      ?? '';

    // ── Validation du format du token (64 chars hex) ───────────────────────
    if (!preg_match('/^[0-9a-f]{64}$/i', $rawToken)) {
        respond(false, 'رابط إعادة التعيين غير صالح.', 400);
    }

    // ── Validation du mot de passe ─────────────────────────────────────────
    if (!preg_match('/^[\x21-\x7E]+$/', $password)) {
        respond(false, 'كلمة المرور تقبل فقط الأحرف اللاتينية والأرقام والرموز الخاصة (بدون مسافة أو أحرف عربية)', 422);
    }
    if (!preg_match('/^(?=.*[A-Z])(?=.*\d).{8,}$/', $password)) {
        respond(false, 'كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل، حرف كبير واحد ورقم واحد', 422);
    }
    if ($password !== $passwordConfirm) {
        respond(false, 'كلمتا المرور غير متطابقتين', 422);
    }

    $pdo       = getAuthConnection();
    $tokenHash = hash('sha256', $rawToken);

    // ── Recherche du token (non expiré) ────────────────────────────────────
    $stmt = $pdo->prepare(
        "SELECT id FROM users
          WHERE reset_token         = :t
            AND reset_token_expires > " . db_now() . "
            AND is_active           = 1
          LIMIT 1"
    );
    $stmt->execute([':t' => $tokenHash]);
    $user = $stmt->fetch();

    if (!$user) {
        respond(false, 'رابط إعادة التعيين منتهي الصلاحية أو غير صالح. يرجى طلب رابط جديد.', 400);
    }

    // ── Mise à jour du mot de passe ────────────────────────────────────────
    $newHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

    $upd = $pdo->prepare(
        "UPDATE users
            SET password_hash       = :h,
                reset_token         = NULL,
                reset_token_expires = NULL,
                failed_attempts     = 0,
                locked_until        = NULL
          WHERE id = :id"
    );
    $upd->execute([':h' => $newHash, ':id' => $user['id']]);

    respond(true, 'تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.');

} catch (Throwable $e) {
    error_log('[reset_password] ' . $e->getMessage());
    respond(false, 'حدث خطأ داخلي، يرجى المحاولة مجددًا.', 500);
}
