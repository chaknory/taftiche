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

// Le pilote (sqlite / mysql) et les identifiants sont centralisés dans config.php.
// Modifiez DB_DRIVER dans ce fichier pour basculer entre les deux environnements.
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/../utils/job_rank.php';

// ==========================================
// Session — identify connected user
// ==========================================

require_once __DIR__ . '/auth/db.php';

session_name('TAFTICHE_SESSION');
session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'secure'   => false,
    'httponly' => true,
    'samesite' => 'Strict',
]);
session_start();

if (empty($_SESSION['user'])) {
    sendResponse(false, 'غير مسجل الدخول', 401);
    exit;
}

$sessionEmail = $_SESSION['user']['email'];

// ==========================================
// Main Logic
// ==========================================

try {
    // 1. Read and parse JSON input
    $rawInput = file_get_contents('php://input');
    error_log('[submit.php] RAW: ' . $rawInput);
    $data = json_decode($rawInput, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        sendResponse(false, 'بيانات JSON غير صالحة', 400);
        exit;
    }

    // Force the email to the session user (prevents spoofing)
    $data['email'] = $sessionEmail;
    error_log('[submit.php] Utilisateur en session : ' . $sessionEmail);

    // 2. Validate required fields
    $errors = validateData($data);
    if (!empty($errors)) {
        error_log('[submit.php] Validation échouée pour ' . $sessionEmail . ' — erreurs : ' . json_encode($errors, JSON_UNESCAPED_UNICODE));
        sendResponse(false, 'بيانات غير صالحة', 422, ['errors' => $errors]);
        exit;
    }
    error_log('[submit.php] Validation réussie pour ' . $sessionEmail);

    // 3. Sanitize data
    $sanitized = sanitizeData($data);

    // 4. Insert or Update based on whether the user already has a record
    if (recordExistsForEmail($sessionEmail)) {
        error_log('[submit.php] UPDATE — mise à jour de la fiche de ' . $sessionEmail);
        updateInDatabase($sanitized, $sessionEmail);
        error_log('[submit.php] UPDATE réussi pour ' . $sessionEmail);
        sendResponse(true, 'تم تحديث المعلومات بنجاح', 200);
    } else {
        error_log('[submit.php] INSERT — création de la fiche de ' . $sessionEmail);
        $id = saveToDatabase($sanitized);
        error_log('[submit.php] INSERT réussi pour ' . $sessionEmail . ' — ID créé : ' . $id);
        sendResponse(true, 'تم حفظ المعلومات بنجاح', 201, ['id' => $id]);
    }

} catch (PDOException $e) {
    error_log('[submit.php] Erreur base de données pour ' . ($sessionEmail ?? 'inconnu') . ' : ' . $e->getMessage());
    sendResponse(false, 'حدث خطأ في قاعدة البيانات', 500);
} catch (Exception $e) {
    error_log('[submit.php] Erreur serveur pour ' . ($sessionEmail ?? 'inconnu') . ' : ' . $e->getMessage());
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

    // القسم المُسند هذا العام
    $validClasses = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة'];
    if (empty($data['current_year_class']) || !in_array($data['current_year_class'], $validClasses)) {
        $errors['current_year_class'] = 'القسم المُسند هذا العام مطلوب';
    }

    // عدد التلاميذ
    if (!isset($data['student_count']) || !is_numeric($data['student_count'])
        || (int)$data['student_count'] < 1 || (int)$data['student_count'] > 200) {
        $errors['student_count'] = 'عدد التلاميذ غير صالح (بين 1 و 200)';
    }

    // معني بالحركة
    if (empty($data['haraka']) || !in_array($data['haraka'], ['نعم', 'لا'])) {
        $errors['haraka'] = 'يرجى تحديد ما إذا كنت معنيًا بالحركة';
    }

    // الرتبة (اختياري — لكن إذا وُجدت يجب أن تكون من القيم المعتمدة)
    $validRanks = array_map(fn(JobRank $r) => $r->value, JobRank::all());
    if (!empty($data['job_rank']) && !in_array($data['job_rank'], $validRanks, true)) {
        $errors['job_rank'] = 'الرتبة المختارة غير صالحة';
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
        'school_entry_date'       => $data['school_entry_date'],
        'diploma'                 => htmlspecialchars(trim($data['diploma']), ENT_QUOTES, 'UTF-8'),
        'first_appointment_date'  => $data['first_appointment_date'] ?? '',
        'job_rank'                => htmlspecialchars(trim($data['job_rank'] ?? ''), ENT_QUOTES, 'UTF-8'),
        'status'                  => htmlspecialchars(trim($data['status'] ?? ''), ENT_QUOTES, 'UTF-8'),
        'echelon'                 => htmlspecialchars(trim($data['echelon'] ?? ''), ENT_QUOTES, 'UTF-8'),
        'grade'                   => htmlspecialchars(trim($data['grade'] ?? ''), ENT_QUOTES, 'UTF-8'),
        'execution_date'          => $data['execution_date'] ?? '',
        'latest_inspection_date'  => $data['latest_inspection_date'] ?? '',
        'latest_inspection_score' => isset($data['latest_inspection_score']) && $data['latest_inspection_score'] !== '' ? (int)$data['latest_inspection_score'] : null,
        'last_inspection_date'    => $data['last_inspection_date'] ?? '',
        'last_inspection_score'   => isset($data['last_inspection_score']) && $data['last_inspection_score'] !== '' ? (int)$data['last_inspection_score'] : null,
        'previous_year_class'     => htmlspecialchars(trim($data['previous_year_class'] ?? ''), ENT_QUOTES, 'UTF-8'),
        'current_year_class'      => htmlspecialchars(trim($data['current_year_class']), ENT_QUOTES, 'UTF-8'),
        'student_count'           => (int)$data['student_count'],
        'haraka'                  => $data['haraka'],
        'children_count'          => isset($data['children_count']) && $data['children_count'] !== '' ? (int)$data['children_count'] : null,
        'tech_institute_grad_year' => htmlspecialchars(trim($data['tech_institute_grad_year'] ?? ''), ENT_QUOTES, 'UTF-8'),
        'university_grad_year'    => htmlspecialchars(trim($data['university_grad_year'] ?? ''), ENT_QUOTES, 'UTF-8')
    ];
}

// ==========================================
// Database Operations
// ==========================================

function recordExistsForEmail($email) {
    $pdo = getConnection();
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM personal_info WHERE email = :email");
    $stmt->execute([':email' => $email]);
    return (int)$stmt->fetchColumn() > 0;
}

function getConnection(): PDO {
    // Délègue à db_connect() défini dans config.php (SQLite ou MySQL)
    return db_connect();
}

function saveToDatabase($data) {
    $pdo = getConnection();

    $sql = "INSERT INTO personal_info
            (district, school_year, school_name, years_worked,
             first_name, family_name, maiden_name, birth_date, birth_place,
             residence, marital_status, spouse_name, gender, phone, email,
             address, school_entry_date, diploma,
             first_appointment_date, job_rank, status, echelon, grade, execution_date,
             latest_inspection_date, latest_inspection_score,
             last_inspection_date, last_inspection_score,
             previous_year_class, current_year_class,
             student_count, haraka, children_count,
             tech_institute_grad_year, university_grad_year,
             created_at)
            VALUES
            (:district, :school_year, :school_name, :years_worked,
             :first_name, :family_name, :maiden_name, :birth_date, :birth_place,
             :residence, :marital_status, :spouse_name, :gender, :phone, :email,
             :address, :school_entry_date, :diploma,
             :first_appointment_date, :job_rank, :status, :echelon, :grade, :execution_date,
             :latest_inspection_date, :latest_inspection_score,
             :last_inspection_date, :last_inspection_score,
             :previous_year_class, :current_year_class,
             :student_count, :haraka, :children_count,
             :tech_institute_grad_year, :university_grad_year,
             " . db_now() . ")"
    ;

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':district'                 => $data['district'],
        ':school_year'              => $data['school_year'],
        ':school_name'              => $data['school_name'],
        ':years_worked'             => $data['years_worked'],
        ':first_name'               => $data['first_name'],
        ':family_name'              => $data['family_name'],
        ':maiden_name'              => $data['maiden_name'],
        ':birth_place'              => $data['birth_place'],
        ':residence'                => $data['residence'],
        ':marital_status'           => $data['marital_status'],
        ':spouse_name'              => $data['spouse_name'],
        ':birth_date'               => $data['birth_date'],
        ':gender'                   => $data['gender'],
        ':phone'                    => $data['phone'],
        ':email'                    => $data['email'],
        ':address'                  => $data['address'],
        ':school_entry_date'        => $data['school_entry_date'],
        ':diploma'                  => $data['diploma'],
        ':first_appointment_date'   => $data['first_appointment_date'] ?: null,
        ':job_rank'                 => $data['job_rank'] ?: null,
        ':status'                   => $data['status'] ?: null,
        ':echelon'                  => $data['echelon'] ?: null,
        ':grade'                    => $data['grade'] ?: null,
        ':execution_date'           => $data['execution_date'] ?: null,
        ':latest_inspection_date'   => $data['latest_inspection_date'] ?: null,
        ':latest_inspection_score'  => $data['latest_inspection_score'],
        ':last_inspection_date'     => $data['last_inspection_date'] ?: null,
        ':last_inspection_score'    => $data['last_inspection_score'],
        ':previous_year_class'      => $data['previous_year_class'] ?: null,
        ':current_year_class'       => $data['current_year_class'],
        ':student_count'            => $data['student_count'],
        ':haraka'                   => $data['haraka'],
        ':children_count'           => $data['children_count'],
        ':tech_institute_grad_year' => $data['tech_institute_grad_year'] ?: null,
        ':university_grad_year'     => $data['university_grad_year'] ?: null,
    ]);

    return $pdo->lastInsertId();
}

function updateInDatabase($data, $email) {
    $pdo = getConnection();

    $sql = "UPDATE personal_info SET
            district = :district,
            school_year = :school_year,
            school_name = :school_name,
            years_worked = :years_worked,
            first_name = :first_name,
            family_name = :family_name,
            maiden_name = :maiden_name,
            birth_date = :birth_date,
            birth_place = :birth_place,
            residence = :residence,
            marital_status = :marital_status,
            spouse_name = :spouse_name,
            gender = :gender,
            phone = :phone,
            address = :address,
            school_entry_date = :school_entry_date,
            diploma = :diploma,
            first_appointment_date = :first_appointment_date,
            job_rank = :job_rank,
            status = :status,
            echelon = :echelon,
            grade = :grade,
            execution_date = :execution_date,
            latest_inspection_date = :latest_inspection_date,
            latest_inspection_score = :latest_inspection_score,
            last_inspection_date = :last_inspection_date,
            last_inspection_score = :last_inspection_score,
            previous_year_class = :previous_year_class,
            current_year_class = :current_year_class,
            student_count = :student_count,
            haraka = :haraka,
            children_count = :children_count,
            tech_institute_grad_year = :tech_institute_grad_year,
            university_grad_year = :university_grad_year,
            updated_at = " . db_now() . "
        WHERE email = :email"
    ;

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':district'                 => $data['district'],
        ':school_year'              => $data['school_year'],
        ':school_name'              => $data['school_name'],
        ':years_worked'             => $data['years_worked'],
        ':first_name'              => $data['first_name'],
        ':family_name'             => $data['family_name'],
        ':maiden_name'             => $data['maiden_name'],
        ':birth_place'             => $data['birth_place'],
        ':residence'               => $data['residence'],
        ':marital_status'          => $data['marital_status'],
        ':spouse_name'             => $data['spouse_name'],
        ':birth_date'              => $data['birth_date'],
        ':gender'                  => $data['gender'],
        ':phone'                   => $data['phone'],
        ':address'                 => $data['address'],
        ':school_entry_date'       => $data['school_entry_date'],
        ':diploma'                 => $data['diploma'],
        ':first_appointment_date'  => $data['first_appointment_date'] ?: null,
        ':job_rank'                => $data['job_rank'] ?: null,
        ':status'                  => $data['status'] ?: null,
        ':echelon'                 => $data['echelon'] ?: null,
        ':grade'                   => $data['grade'] ?: null,
        ':execution_date'          => $data['execution_date'] ?: null,
        ':latest_inspection_date'  => $data['latest_inspection_date'] ?: null,
        ':latest_inspection_score' => $data['latest_inspection_score'],
        ':last_inspection_date'    => $data['last_inspection_date'] ?: null,
        ':last_inspection_score'   => $data['last_inspection_score'],
        ':previous_year_class'     => $data['previous_year_class'] ?: null,
        ':current_year_class'      => $data['current_year_class'],
        ':student_count'           => $data['student_count'],
        ':haraka'                  => $data['haraka'],
        ':children_count'          => $data['children_count'],
        ':tech_institute_grad_year' => $data['tech_institute_grad_year'] ?: null,
        ':university_grad_year'    => $data['university_grad_year'] ?: null,
        ':email'                   => $email,
    ]);
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
