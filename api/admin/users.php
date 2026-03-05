<?php
/**
 * /api/admin/users.php
 * Gestion des utilisateurs par l'administrateur.
 *
 * GET    → liste tous les utilisateurs
 * PUT    → modifie un utilisateur  (body: { id, first_name, last_name, email, username, role, is_active [, password] })
 * DELETE → supprime un utilisateur (body: { id })
 *
 * Accès réservé aux administrateurs connectés.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once __DIR__ . '/../auth/db.php';

session_name('TAFTICHE_SESSION');
session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'httponly' => true, 'samesite' => 'Strict']);
session_start();

// ── Vérification admin ────────────────────────────────────────────────────
if (empty($_SESSION['user']) || ($_SESSION['user']['role'] ?? '') !== 'admin') {
    authJsonResponse(false, 'غير مصرح لك', 403);
}

$currentAdminId = (int)$_SESSION['user']['id'];

try {
    $pdo    = getAuthConnection();
    $method = $_SERVER['REQUEST_METHOD'];

    // ── GET : liste des utilisateurs ──────────────────────────────────────
    if ($method === 'GET') {
        $stmt = $pdo->query(
            "SELECT id, first_name, last_name, email, username, role, is_active,
                    failed_attempts, last_login, created_at
             FROM users
             ORDER BY created_at DESC"
        );
        authJsonResponse(true, 'ok', 200, ['users' => $stmt->fetchAll()]);
    }

    // ── Lecture body JSON ─────────────────────────────────────────────────
    $body = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        authJsonResponse(false, 'JSON غير صالح', 400);
    }

    // ── POST : création d'un utilisateur ──────────────────────────────────
    if ($method === 'POST') {
        $firstName = trim($body['first_name'] ?? '');
        $lastName  = trim($body['last_name']  ?? '');
        $email     = strtolower(trim($body['email']    ?? ''));
        $username  = trim($body['username']   ?? '');
        $password  = $body['password'] ?? '';
        $role      = in_array($body['role'] ?? '', ['admin','user'], true) ? $body['role'] : 'user';

        $errors = [];

        if (mb_strlen($firstName) < 2) $errors['first_name'] = 'الاسم الشخصي مطلوب (حرفان على الأقل)';
        if (mb_strlen($lastName)  < 2) $errors['last_name']  = 'اللقب مطلوب (حرفان على الأقل)';

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'البريد الإلكتروني غير صالح';
        } else {
            $dup = $pdo->prepare("SELECT id FROM users WHERE email = :e LIMIT 1");
            $dup->execute([':e' => $email]);
            if ($dup->fetch()) $errors['email'] = 'البريد الإلكتروني مستخدم بالفعل';
        }

        if (!preg_match('/^[a-zA-Z0-9_\.]{3,30}$/', $username)) {
            $errors['username'] = 'اسم المستخدم يجب أن يكون بين 3 و 30 حرفًا (أحرف لاتينية وأرقام و _ و . فقط)';
        } else {
            $dup2 = $pdo->prepare("SELECT id FROM users WHERE username = :u LIMIT 1");
            $dup2->execute([':u' => $username]);
            if ($dup2->fetch()) $errors['username'] = 'اسم المستخدم مستخدم بالفعل';
        }

        if (!preg_match('/^[\x21-\x7E]+$/', $password)) {
            $errors['password'] = 'كلمة المرور تقبل فقط الأحرف اللاتينية والأرقام والرموز الخاصة';
        } elseif (!preg_match('/^(?=.*[A-Z])(?=.*\d).{8,}$/', $password)) {
            $errors['password'] = 'كلمة المرور: 8 أحرف على الأقل، حرف كبير ورقم';
        }

        if (!empty($errors)) authJsonResponse(false, 'بيانات غير صالحة', 422, ['errors' => $errors]);

        $hash = password_hash($password, PASSWORD_BCRYPT);
        $pdo->prepare(
            "INSERT INTO users (first_name, last_name, email, username, password_hash, role, is_active)
             VALUES (:fn, :ln, :em, :un, :ph, :ro, 1)"
        )->execute([':fn'=>$firstName, ':ln'=>$lastName, ':em'=>$email,
                    ':un'=>$username, ':ph'=>$hash, ':ro'=>$role]);

        authJsonResponse(true, 'تم إنشاء المستخدم بنجاح', 201);
    }

    $id = (int)($body['id'] ?? 0);
    if (!$id) authJsonResponse(false, 'المعرف مطلوب', 400);

    // ── DELETE : suppression ──────────────────────────────────────────────
    if ($method === 'DELETE') {
        if ($id === $currentAdminId) {
            authJsonResponse(false, 'لا يمكنك حذف حسابك الخاص', 400);
        }
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = :id");
        $stmt->execute([':id' => $id]);
        if ($stmt->rowCount() === 0) authJsonResponse(false, 'المستخدم غير موجود', 404);
        // Supprimer aussi les données personnelles liées (même email)
        $pdo->prepare("DELETE FROM personal_info WHERE email = (SELECT email FROM users WHERE id = :id)")
            ->execute([':id' => $id]);
        authJsonResponse(true, 'تم حذف المستخدم بنجاح');
    }

    // ── PUT : modification ────────────────────────────────────────────────
    if ($method === 'PUT') {
        // Récupérer l'utilisateur existant
        $existing = $pdo->prepare("SELECT * FROM users WHERE id = :id");
        $existing->execute([':id' => $id]);
        $user = $existing->fetch();
        if (!$user) authJsonResponse(false, 'المستخدم غير موجود', 404);

        $firstName = trim($body['first_name'] ?? $user['first_name']);
        $lastName  = trim($body['last_name']  ?? $user['last_name']);
        $email     = strtolower(trim($body['email']    ?? $user['email']));
        $username  = trim($body['username']   ?? $user['username']);
        $role      = in_array($body['role'] ?? '', ['admin','user'], true) ? $body['role'] : $user['role'];
        $isActive  = isset($body['is_active']) ? (int)(bool)$body['is_active'] : $user['is_active'];
        $password  = $body['password'] ?? '';

        // Empêcher de se dégrader soi-même si on est le seul admin
        if ($id === $currentAdminId && $role !== 'admin') {
            $countAdmins = (int)$pdo->query("SELECT COUNT(*) FROM users WHERE role='admin'")->fetchColumn();
            if ($countAdmins <= 1) authJsonResponse(false, 'لا يمكنك إزالة صلاحيات المسؤول الوحيد', 400);
        }

        // Unicité email/username (hors soi-même)
        $errors = [];
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors['email'] = 'البريد الإلكتروني غير صالح';

        $dup = $pdo->prepare("SELECT id FROM users WHERE email = :e AND id != :id LIMIT 1");
        $dup->execute([':e' => $email, ':id' => $id]);
        if ($dup->fetch()) $errors['email'] = 'البريد الإلكتروني مستخدم بالفعل';

        $dup2 = $pdo->prepare("SELECT id FROM users WHERE username = :u AND id != :id LIMIT 1");
        $dup2->execute([':u' => $username, ':id' => $id]);
        if ($dup2->fetch()) $errors['username'] = 'اسم المستخدم مستخدم بالفعل';

        if (!empty($errors)) authJsonResponse(false, 'بيانات غير صالحة', 422, ['errors' => $errors]);

        // Construire requête UPDATE
        if ($password !== '') {
            if (!preg_match('/^(?=.*[A-Z])(?=.*\d).{8,}$/', $password)) {
                authJsonResponse(false, 'كلمة المرور يجب أن تحتوي على 8 أحرف، حرف كبير ورقم', 422,
                    ['errors' => ['password' => 'كلمة المرور ضعيفة']]);
            }
            $hash = password_hash($password, PASSWORD_BCRYPT);
            $pdo->prepare(
                "UPDATE users SET first_name=:fn, last_name=:ln, email=:em, username=:un,
                 role=:ro, is_active=:ia, password_hash=:ph, failed_attempts=0, locked_until=NULL
                 WHERE id = :id"
            )->execute([':fn'=>$firstName,':ln'=>$lastName,':em'=>$email,':un'=>$username,
                         ':ro'=>$role,':ia'=>$isActive,':ph'=>$hash,':id'=>$id]);
        } else {
            $pdo->prepare(
                "UPDATE users SET first_name=:fn, last_name=:ln, email=:em, username=:un,
                 role=:ro, is_active=:ia WHERE id = :id"
            )->execute([':fn'=>$firstName,':ln'=>$lastName,':em'=>$email,':un'=>$username,
                         ':ro'=>$role,':ia'=>$isActive,':id'=>$id]);
        }

        authJsonResponse(true, 'تم تحديث المستخدم بنجاح');
    }

    authJsonResponse(false, 'طريقة الطلب غير مدعومة', 405);

} catch (PDOException $e) {
    error_log('admin/users PDO: ' . $e->getMessage());
    authJsonResponse(false, 'خطأ في قاعدة البيانات', 500);
} catch (Exception $e) {
    error_log('admin/users: ' . $e->getMessage());
    authJsonResponse(false, 'خطأ في الخادم', 500);
}
