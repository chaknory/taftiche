<?php
/**
 * POST /api/auth/forgot_password.php
 * Corps JSON : { "email": "user@example.com" }
 *
 * Sécurités :
 *  - Génère un token aléatoire de 32 octets (hex = 64 chars) → jamais stocké en clair
 *  - Seul le hash SHA-256 du token est stocké en base (comme pour les API keys)
 *  - Expiration : 1 heure
 *  - TOUJOURS répondre avec succès générique (anti-énumération d'emails)
 *
 * Configuration :
 *  - MAIL_FROM    : variable d'environnement ou constante ci-dessous
 *  - APP_BASE_URL : variable d'environnement ou détection automatique
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

// ── Configuration de l'envoi des mails ────────────────────────────────────
// Surchargez via variables d'environnement (ex. dans .env ou la config Apache/Nginx)
define('MAIL_FROM',      getenv('MAIL_FROM')      ?: 'no-reply@education.dz');
define('MAIL_FROM_NAME', getenv('MAIL_FROM_NAME') ?: 'مديرية التربية بسكرة');
define('APP_BASE_URL',   rtrim(getenv('APP_BASE_URL') ?: _detectBaseUrl(), '/'));

function _detectBaseUrl(): string
{
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host   = $_SERVER['HTTP_HOST'] ?? 'localhost';
    // Remonte de /api/auth/ (2 niveaux) vers la racine de l'application
    $scriptDir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? ''));
    $root = rtrim(dirname(dirname($scriptDir)), '/');
    return $scheme . '://' . $host . ($root === '/' ? '' : $root);
}

// ── Réponse générique (anti-énumération) ──────────────────────────────────
function genericSuccess(): void
{
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'إذا كان البريد الإلكتروني مسجلاً لدينا، ستتلقى رسالة تحتوي على رابط إعادة التعيين.',
    ]);
    exit;
}

try {
    $body = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        genericSuccess(); // ne pas révéler l'erreur
    }

    $email = strtolower(trim($body['email'] ?? ''));

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        genericSuccess();
    }

    $pdo = getAuthConnection();

    $stmt = $pdo->prepare(
        "SELECT id, first_name, last_name FROM users
          WHERE email = :e AND is_active = 1
          LIMIT 1"
    );
    $stmt->execute([':e' => $email]);
    $user = $stmt->fetch();

    if ($user) {
        // Générer un token cryptographiquement sûr
        $rawToken  = bin2hex(random_bytes(32)); // 64 chars hex — envoyé par mail
        $tokenHash = hash('sha256', $rawToken); // stocké en base de données
        $expires   = date('Y-m-d H:i:s', strtotime('+1 hour'));

        $upd = $pdo->prepare(
            "UPDATE users
                SET reset_token         = :t,
                    reset_token_expires = :e
              WHERE id = :id"
        );
        $upd->execute([':t' => $tokenHash, ':e' => $expires, ':id' => $user['id']]);

        $resetLink = rtrim(APP_BASE_URL, '/') . '/reset_password.html?token=' . urlencode($rawToken);
        $fullName  = $user['first_name'] . ' ' . $user['last_name'];

        _sendResetEmail($email, $fullName, $resetLink);
    }

    genericSuccess();

} catch (Throwable $e) {
    error_log('[forgot_password] ' . $e->getMessage());
    genericSuccess(); // toujours répondre de manière générique
}

// ── Envoi du mail de réinitialisation ─────────────────────────────────────
function _sendResetEmail(string $to, string $name, string $link): void
{
    $subjectRaw = 'إعادة تعيين كلمة المرور';
    $subject    = '=?UTF-8?B?' . base64_encode($subjectRaw) . '?=';

    $fromEncoded = '=?UTF-8?B?' . base64_encode(MAIL_FROM_NAME) . '?=';

    $headers  = "From: {$fromEncoded} <" . MAIL_FROM . ">\r\n";
    $headers .= "Reply-To: " . MAIL_FROM . "\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "X-Mailer: PHP/" . PHP_VERSION . "\r\n";

    $nameHtml = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
    $linkHtml = htmlspecialchars($link, ENT_QUOTES, 'UTF-8');

    $body = <<<HTML
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f0f4f8;padding:32px 16px;margin:0">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:10px;
              padding:36px 32px;border:1px solid #d8e3ee;direction:rtl;text-align:right">

    <div style="text-align:center;margin-bottom:24px">
      <div style="display:inline-block;background:#1a3a5c;color:#fff;border-radius:50%;
                  width:52px;height:52px;line-height:52px;font-size:24px;text-align:center">
        ✉
      </div>
    </div>

    <h2 style="color:#1a3a5c;margin:0 0 8px">إعادة تعيين كلمة المرور</h2>
    <p style="color:#444;line-height:1.7">مرحبًا <strong>{$nameHtml}</strong>،</p>
    <p style="color:#444;line-height:1.7">
      تلقّينا طلبًا لإعادة تعيين كلمة المرور الخاصة بحسابك.
      انقر على الزر أدناه للمتابعة:
    </p>

    <div style="text-align:center;margin:28px 0">
      <a href="{$linkHtml}"
         style="background:#1a3a5c;color:#ffffff;padding:13px 32px;border-radius:6px;
                text-decoration:none;font-size:15px;display:inline-block;font-weight:bold">
        إعادة تعيين كلمة المرور
      </a>
    </div>

    <p style="color:#888;font-size:13px;line-height:1.6">
      ⚠️ هذا الرابط صالح لمدة <strong>ساعة واحدة</strong> فقط.
    </p>
    <p style="color:#888;font-size:13px;line-height:1.6">
      إذا لم تطلب إعادة التعيين، يمكنك تجاهل هذه الرسالة بأمان.
    </p>

    <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
    <p style="color:#bbb;font-size:11px;text-align:center;margin:0">
      مديرية التربية لولاية بسكرة – مفتشية التعليم الابتدائي
    </p>
  </div>
</body>
</html>
HTML;

    // Utilise la fonction mail() native de PHP.
    // Configurez sendmail_path / SMTP dans php.ini selon votre environnement.
    mail($to, $subject, $body, $headers);
}
