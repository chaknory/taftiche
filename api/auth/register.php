<?php
/**
 * POST /api/auth/register.php
 * Création d'un compte utilisateur.
 *
 * Règles d'accès :
 *  1. Si aucun utilisateur n'existe encore → mode "setup initial" (libre)
 *  2. Sinon → réservé aux administrateurs connectés
 *
 * Corps JSON :
 * {
 *   "first_name" : "محمد",
 *   "last_name"  : "بن سالم",
 *   "email"      : "user@example.com",
 *   "username"   : "mbensalem",
 *   "password"   : "MonMotDePasse123!",
 *   "role"       : "user"   (optionnel, "admin" uniquement pour un admin)
 * }
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

session_name('TAFTICHE_SESSION');
session_start();

try {
    $pdo = getAuthConnection();

    // ── Inscription ouverte à tous ─────────────────────────────────────────
    // Toute personne peut créer un compte librement.
    // Le rôle sera toujours "user" (seul un admin peut s'attribuer "admin").
    $isInitialSetup = false;

    // ── Lecture des données ────────────────────────────────────────────────
    $body = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        authJsonResponse(false, 'بيانات JSON غير صالحة', 400);
    }

    $firstName = trim($body['first_name'] ?? '');
    $lastName  = trim($body['last_name']  ?? '');
    $email     = strtolower(trim($body['email']    ?? ''));
    $username  = trim($body['username'] ?? '');
    $password  = $body['password']  ?? '';
    $role      = trim($body['role'] ?? 'user');

    // ── Validation ─────────────────────────────────────────────────────────
    $errors = [];

    if (mb_strlen($firstName) < 2) $errors['first_name'] = 'الاسم الشخصي مطلوب (حرفان على الأقل)';
    if (mb_strlen($lastName)  < 2) $errors['last_name']  = 'اللقب مطلوب (حرفان على الأقل)';

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'البريد الإلكتروني غير صالح';
    }

    if (!preg_match('/^[a-zA-Z0-9_\.]{3,30}$/', $username)) {
        $errors['username'] = 'اسم المستخدم يجب أن يكون بين 3 و 30 حرفًا (أحرف لاتينية وأرقام و _ و . فقط)';
    }

    // Politique de mot de passe : 8+ chars, 1 majuscule, 1 chiffre
    if (!preg_match('/^(?=.*[A-Z])(?=.*\d).{8,}$/', $password)) {
        $errors['password'] = 'كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل، حرف كبير ورقم واحد';
    }

    if (!in_array($role, ['admin', 'user'], true)) $role = 'user';

    // Seul un admin connecté peut créer un autre admin
    $sessionRole = $_SESSION['user']['role'] ?? 'user';
    if ($role === 'admin' && $sessionRole !== 'admin') {
        $role = 'user';
    }

    // Vérifier unicité email / username
    $dupEmail = $pdo->prepare("SELECT id FROM users WHERE email = :e LIMIT 1");
    $dupEmail->execute([':e' => $email]);
    if ($dupEmail->fetch()) $errors['email'] = 'البريد الإلكتروني مستخدم بالفعل';

    $dupUser = $pdo->prepare("SELECT id FROM users WHERE username = :u LIMIT 1");
    $dupUser->execute([':u' => $username]);
    if ($dupUser->fetch()) $errors['username'] = 'اسم المستخدم مستخدم بالفعل';

    if (!empty($errors)) {
        authJsonResponse(false, 'بيانات غير صالحة', 422, ['errors' => $errors]);
    }

    // ── Hachage du mot de passe ────────────────────────────────────────────
    $algo = PASSWORD_BCRYPT; // PASSWORD_ARGON2ID si disponible
    if (defined('PASSWORD_ARGON2ID')) $algo = PASSWORD_ARGON2ID;
    $hash = password_hash($password, $algo);

    // ── Insertion ──────────────────────────────────────────────────────────
    $stmt = $pdo->prepare("
        INSERT INTO users (first_name, last_name, email, username, password_hash, role)
        VALUES (:fn, :ln, :em, :un, :pw, :ro)
    ");
    $stmt->execute([
        ':fn' => htmlspecialchars($firstName, ENT_QUOTES, 'UTF-8'),
        ':ln' => htmlspecialchars($lastName,  ENT_QUOTES, 'UTF-8'),
        ':em' => $email,
        ':un' => $username,
        ':pw' => $hash,
        ':ro' => $role,
    ]);

    $newId = $pdo->lastInsertId();

    authJsonResponse(true, 'تم إنشاء الحساب بنجاح', 201, [
        'id'       => $newId,
        'username' => $username,
        'role'     => $role,
    ]);

} catch (Exception $e) {
    error_log('Register error: ' . $e->getMessage());
    authJsonResponse(false, 'حدث خطأ في الخادم', 500);
}
