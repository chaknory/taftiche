<?php
/**
 * API Backend - Réception des informations personnelles
 * =====================================================
 * Ce fichier reçoit les données du formulaire en JSON
 * et les enregistre dans une base de données SQLite.
 * 
 * Configuration requise:
 * - PHP 7.4+
 * - Extension PDO SQLite (pdo_sqlite)
 *
 * La base de données SQLite est créée et initialisée
 * automatiquement au premier appel si elle n'existe pas.
 */

// ==========================================
// Configuration
// ==========================================

// Headers CORS (à adapter en production)
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, 'طريقة الطلب غير مسموح بها', 405);
    exit;
}

// ==========================================
// Database Configuration
// ==========================================

// Chemin vers le fichier SQLite (un niveau au-dessus du dossier api/)
define('DB_PATH', __DIR__ . '/../database/personal_info.sqlite');

// Chemin vers le schéma SQL pour l'initialisation automatique
define('DB_SCHEMA', __DIR__ . '/../database/schema.sql');

// ==========================================
// Main Logic
// ==========================================

try {
    // 1. Read and parse JSON input
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        sendResponse(false, 'بيانات JSON غير صالحة', 400);
        exit;
    }

    // 2. Validate required fields
    $errors = validateData($data);
    if (!empty($errors)) {
        sendResponse(false, 'بيانات غير صالحة', 422, ['errors' => $errors]);
        exit;
    }

    // 3. Sanitize data
    $sanitized = sanitizeData($data);

    // 4. Check email uniqueness
    if (isEmailTaken($sanitized['email'])) {
        sendResponse(false,
            'يبدو أن هذا البريد الإلكتروني مسجّل مسبقًا. هل سبق لك تعبئة الاستمارة؟ إذا كان هذا خطأ، تواصل مع المسؤول.',
            422,
            ['errors' => ['email' => 'البريد الإلكتروني مستخدم بالفعل']]
        );
    }

    // 5. Save to database
    $id = saveToDatabase($sanitized);

    // 6. Success response
    sendResponse(true, 'تم حفظ المعلومات بنجاح', 201, ['id' => $id]);

} catch (PDOException $e) {
    error_log('Database error: ' . $e->getMessage());
    sendResponse(false, 'حدث خطأ في قاعدة البيانات', 500);
} catch (Exception $e) {
    error_log('Server error: ' . $e->getMessage());
    sendResponse(false, 'حدث خطأ في الخادم', 500);
}

// ==========================================
// Validation
// ==========================================

function validateData($data) {
    $errors = [];

    // المقاطعة المدرسية
    if (empty($data['district']) || mb_strlen(trim($data['district'])) < 1) {
        $errors['district'] = 'المقاطعة المدرسية مطلوبة';
    }

    // السنة الدراسية
    if (empty($data['school_year']) || mb_strlen(trim($data['school_year'])) < 4) {
        $errors['school_year'] = 'السنة الدراسية مطلوبة';
    }

    // اسم المدرسة
    if (empty($data['school_name']) || mb_strlen(trim($data['school_name'])) < 3) {
        $errors['school_name'] = 'اسم المدرسة مطلوب (3 أحرف على الأقل)';
    }

    // عدد سنوات العمل
    if (!isset($data['years_worked']) || !is_numeric($data['years_worked'])
        || (int)$data['years_worked'] < 0 || (int)$data['years_worked'] > 60) {
        $errors['years_worked'] = 'عدد سنوات العمل غير صالح (بين 0 و 60)';
    }

    // الاسم الشخصي
    if (empty($data['first_name']) || mb_strlen(trim($data['first_name'])) < 2) {
        $errors['first_name'] = 'الاسم الشخصي مطلوب (2 أحرف على الأقل)';
    }

    // الاسم العائلي
    if (empty($data['family_name']) || mb_strlen(trim($data['family_name'])) < 2) {
        $errors['family_name'] = 'الاسم العائلي مطلوب (2 أحرف على الأقل)';
    }

    // اللقب الأصلي للمتزوجة (اختياري)

    // تاريخ الميلاد
    if (empty($data['birth_date']) || !isValidDate($data['birth_date'])) {
        $errors['birth_date'] = 'تاريخ الميلاد غير صالح';
    }

    // مكان الميلاد
    if (empty($data['birth_place']) || mb_strlen(trim($data['birth_place'])) < 2) {
        $errors['birth_place'] = 'مكان الميلاد مطلوب';
    }

    // مكان الإقامة
    if (empty($data['residence']) || mb_strlen(trim($data['residence'])) < 2) {
        $errors['residence'] = 'مكان الإقامة مطلوب (2 أحرف على الأقل)';
    }

    // الحالة المدنية
    $validMarital = ['أعزب', 'متزوج', 'أرمل', 'مطلق'];
    if (empty($data['marital_status']) || !in_array($data['marital_status'], $validMarital)) {
        $errors['marital_status'] = 'الحالة المدنية غير صالحة';
    }

    // اسم الزوج (خاص بالمرأة المتزوجة)
    $isMarriedWoman = ($data['gender'] ?? '') === 'أنثى' && ($data['marital_status'] ?? '') === 'متزوج';
    if ($isMarriedWoman && (empty($data['spouse_name']) || mb_strlen(trim($data['spouse_name'])) < 3)) {
        $errors['spouse_name'] = 'اسم الزوج مطلوب (3 أحرف على الأقل)';
    }

    // الجنس
    if (empty($data['gender']) || !in_array($data['gender'], ['ذكر', 'أنثى'])) {
        $errors['gender'] = 'الجنس غير صالح';
    }

    // رقم الهاتف
    if (empty($data['phone']) || !preg_match('/^[\+]?[0-9\s\-]{8,15}$/', trim($data['phone']))) {
        $errors['phone'] = 'رقم الهاتف غير صالح';
    }

    // البريد الإلكتروني
    if (empty($data['email']) || !filter_var(trim($data['email']), FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'البريد الإلكتروني غير صالح';
    }

    // العنوان
    if (empty($data['address']) || mb_strlen(trim($data['address'])) < 5) {
        $errors['address'] = 'العنوان مطلوب (5 أحرف على الأقل)';
    }

    // تاريخ الدخول المدرسي
    if (empty($data['school_entry_date']) || !isValidDate($data['school_entry_date'])) {
        $errors['school_entry_date'] = 'تاريخ الدخول المدرسي غير صالح';
    }

    // الشهادة / الدبلوم
    if (empty($data['diploma']) || mb_strlen(trim($data['diploma'])) < 2) {
        $errors['diploma'] = 'الشهادة / الدبلوم مطلوب (2 أحرف على الأقل)';
    }

    return $errors;
}

function isValidDate($date) {
    $d = DateTime::createFromFormat('Y-m-d', $date);
    return $d && $d->format('Y-m-d') === $date;
}

// ==========================================
// Sanitization
// ==========================================

function sanitizeData($data) {
    return [
        'district'          => htmlspecialchars(trim($data['district']), ENT_QUOTES, 'UTF-8'),
        'school_year'       => htmlspecialchars(trim($data['school_year']), ENT_QUOTES, 'UTF-8'),
        'school_name'       => htmlspecialchars(trim($data['school_name']), ENT_QUOTES, 'UTF-8'),
        'years_worked'      => (int)$data['years_worked'],
        'first_name'        => htmlspecialchars(trim($data['first_name']), ENT_QUOTES, 'UTF-8'),
        'family_name'       => htmlspecialchars(trim($data['family_name']), ENT_QUOTES, 'UTF-8'),
        'maiden_name'       => htmlspecialchars(trim($data['maiden_name'] ?? ''), ENT_QUOTES, 'UTF-8'),
        'birth_place'       => htmlspecialchars(trim($data['birth_place']), ENT_QUOTES, 'UTF-8'),
        'residence'         => htmlspecialchars(trim($data['residence']), ENT_QUOTES, 'UTF-8'),
        'marital_status'    => $data['marital_status'],
        'spouse_name'       => htmlspecialchars(trim($data['spouse_name'] ?? ''), ENT_QUOTES, 'UTF-8'),
        'birth_date'        => $data['birth_date'],
        'gender'            => $data['gender'],
        'phone'             => preg_replace('/[^\+0-9\-\s]/', '', trim($data['phone'])),
        'email'             => filter_var(trim($data['email']), FILTER_SANITIZE_EMAIL),
        'address'           => htmlspecialchars(trim($data['address']), ENT_QUOTES, 'UTF-8'),
        'school_entry_date' => $data['school_entry_date'],
        'diploma'           => htmlspecialchars(trim($data['diploma']), ENT_QUOTES, 'UTF-8')
    ];
}

// ==========================================
// Database Operations
// ==========================================

function isEmailTaken($email) {
    $pdo = getConnection();
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM personal_info WHERE email = :email");
    $stmt->execute([':email' => $email]);
    return (int)$stmt->fetchColumn() > 0;
}

function getConnection() {
    $dbPath   = DB_PATH;
    $isNew    = !file_exists($dbPath);

    $pdo = new PDO('sqlite:' . $dbPath, null, null, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    // Optimisations SQLite recommandées
    $pdo->exec('PRAGMA journal_mode = WAL;');
    $pdo->exec('PRAGMA foreign_keys = ON;');
    $pdo->exec('PRAGMA synchronous   = NORMAL;');

    // Initialisation automatique du schéma si la base est nouvelle
    if ($isNew) {
        $schema = file_get_contents(DB_SCHEMA);
        $pdo->exec($schema);
    }

    return $pdo;
}

function saveToDatabase($data) {
    $pdo = getConnection();

    $sql = "INSERT INTO personal_info 
            (district, school_year, school_name, years_worked, first_name, family_name, maiden_name, birth_date, birth_place, residence, marital_status, spouse_name, gender, phone, email, address, school_entry_date, diploma, created_at) 
            VALUES 
            (:district, :school_year, :school_name, :years_worked, :first_name, :family_name, :maiden_name, :birth_date, :birth_place, :residence, :marital_status, :spouse_name, :gender, :phone, :email, :address, :school_entry_date, :diploma, datetime('now'));";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':district'          => $data['district'],
        ':school_year'       => $data['school_year'],
        ':school_name'       => $data['school_name'],
        ':years_worked'      => $data['years_worked'],
        ':first_name'        => $data['first_name'],
        ':family_name'       => $data['family_name'],
        ':maiden_name'       => $data['maiden_name'],
        ':birth_place'       => $data['birth_place'],
        ':residence'         => $data['residence'],
        ':marital_status'    => $data['marital_status'],
        ':spouse_name'       => $data['spouse_name'],
        ':birth_date'        => $data['birth_date'],
        ':gender'            => $data['gender'],
        ':phone'             => $data['phone'],
        ':email'             => $data['email'],
        ':address'           => $data['address'],
        ':school_entry_date' => $data['school_entry_date'],
        ':diploma'           => $data['diploma']
    ]);

    return $pdo->lastInsertId();
}

// ==========================================
// Response Helper
// ==========================================

function sendResponse($success, $message, $statusCode = 200, $extra = []) {
    http_response_code($statusCode);
    
    $response = array_merge([
        'success' => $success,
        'message' => $message
    ], $extra);

    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}
