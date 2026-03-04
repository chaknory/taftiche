<?php
/**
 * /api/admin/personal_info.php
 * Gestion des fiches personal_info par l'administrateur.
 *
 * GET    → liste tous les enregistrements
 * PUT    → modifie un enregistrement  (body: { id, ...fields })
 * DELETE → supprime un enregistrement (body: { id })
 *
 * Accès réservé aux administrateurs connectés.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, PUT, DELETE, OPTIONS');
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

try {
    $pdo    = getAuthConnection();
    $method = $_SERVER['REQUEST_METHOD'];

    // ── GET : liste des fiches ────────────────────────────────────────────
    if ($method === 'GET') {
        $stmt = $pdo->query(
            "SELECT id, first_name, family_name, maiden_name, gender, birth_date,
                    birth_place, residence, marital_status, spouse_name, children_count,
                    phone, email, address,
                    district, school_year, school_name, years_worked,
                    school_entry_date, diploma,
                    first_appointment_date, rank, status, echelon, grade, execution_date,
                    latest_inspection_date, latest_inspection_score,
                    last_inspection_date, last_inspection_score,
                    previous_year_class, current_year_class,
                    student_count, haraka,
                    tech_institute_grad_year, university_grad_year,
                    created_at, updated_at
             FROM personal_info
             ORDER BY created_at DESC"
        );
        authJsonResponse(true, 'ok', 200, ['records' => $stmt->fetchAll()]);
    }

    // ── Lecture body JSON ─────────────────────────────────────────────────
    $body = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        authJsonResponse(false, 'JSON غير صالح', 400);
    }

    $id = (int)($body['id'] ?? 0);
    if (!$id) authJsonResponse(false, 'المعرف مطلوب', 400);

    // ── DELETE ────────────────────────────────────────────────────────────
    if ($method === 'DELETE') {
        $stmt = $pdo->prepare("DELETE FROM personal_info WHERE id = :id");
        $stmt->execute([':id' => $id]);
        if ($stmt->rowCount() === 0) authJsonResponse(false, 'السجل غير موجود', 404);
        authJsonResponse(true, 'تم حذف السجل بنجاح');
    }

    // ── PUT : modification ────────────────────────────────────────────────
    if ($method === 'PUT') {
        $existing = $pdo->prepare("SELECT * FROM personal_info WHERE id = :id");
        $existing->execute([':id' => $id]);
        $rec = $existing->fetch();
        if (!$rec) authJsonResponse(false, 'السجل غير موجود', 404);

        $s = fn($k) => isset($body[$k]) ? htmlspecialchars(trim($body[$k]), ENT_QUOTES, 'UTF-8') : $rec[$k];

        $firstName            = $s('first_name');
        $familyName           = $s('family_name');
        $maidenName           = $s('maiden_name');
        $gender               = in_array($body['gender'] ?? '', ['ذكر','أنثى'], true) ? $body['gender'] : $rec['gender'];
        $birthDate            = $body['birth_date']         ?? $rec['birth_date'];
        $birthPlace           = $s('birth_place');
        $residence            = $s('residence');
        $maritalStatus        = in_array($body['marital_status'] ?? '', ['أعزب','متزوج','أرمل','مطلق'], true)
                                    ? $body['marital_status'] : $rec['marital_status'];
        $spouseName           = $s('spouse_name');
        $childrenCount        = isset($body['children_count']) && $body['children_count'] !== '' ? (int)$body['children_count'] : $rec['children_count'];
        $phone                = isset($body['phone']) ? preg_replace('/[^\+0-9\-\s]/', '', trim($body['phone'])) : $rec['phone'];
        $email                = isset($body['email']) ? strtolower(trim($body['email'])) : $rec['email'];
        $address              = $s('address');
        $district             = $s('district');
        $schoolYear           = $s('school_year');
        $schoolName           = $s('school_name');
        $yearsWorked          = isset($body['years_worked']) ? (int)$body['years_worked'] : $rec['years_worked'];
        $schoolEntry          = $body['school_entry_date']   ?? $rec['school_entry_date'];
        $diploma              = $s('diploma');
        $firstAppointmentDate = $body['first_appointment_date'] ?? $rec['first_appointment_date'];
        $rank                 = $s('rank');
        $status               = $s('status');
        $echelon              = $s('echelon');
        $grade                = $s('grade');
        $executionDate        = $body['execution_date']          ?? $rec['execution_date'];
        $latestInspDate       = $body['latest_inspection_date']  ?? $rec['latest_inspection_date'];
        $latestInspScore      = isset($body['latest_inspection_score']) && $body['latest_inspection_score'] !== '' ? (int)$body['latest_inspection_score'] : $rec['latest_inspection_score'];
        $lastInspDate         = $body['last_inspection_date']    ?? $rec['last_inspection_date'];
        $lastInspScore        = isset($body['last_inspection_score']) && $body['last_inspection_score'] !== '' ? (int)$body['last_inspection_score'] : $rec['last_inspection_score'];
        $previousYearClass    = $s('previous_year_class');
        $currentYearClass     = $s('current_year_class');
        $studentCount         = isset($body['student_count']) && $body['student_count'] !== '' ? (int)$body['student_count'] : $rec['student_count'];
        $haraka               = in_array($body['haraka'] ?? '', ['نعم','لا'], true) ? $body['haraka'] : $rec['haraka'];
        $techInstGradYear     = $s('tech_institute_grad_year');
        $uniGradYear          = $s('university_grad_year');

        // Validation minimale
        $errors = [];
        if (mb_strlen($firstName)  < 2) $errors['first_name']  = 'الاسم الشخصي مطلوب';
        if (mb_strlen($familyName) < 2) $errors['family_name'] = 'الاسم العائلي مطلوب';
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors['email'] = 'البريد الإلكتروني غير صالح';

        // Unicité email (hors soi-même)
        $dup = $pdo->prepare("SELECT id FROM personal_info WHERE email = :e AND id != :id LIMIT 1");
        $dup->execute([':e' => $email, ':id' => $id]);
        if ($dup->fetch()) $errors['email'] = 'البريد الإلكتروني مستخدم بالفعل';

        if (!empty($errors)) authJsonResponse(false, 'بيانات غير صالحة', 422, ['errors' => $errors]);

        $pdo->prepare(
            "UPDATE personal_info SET
                first_name=:fn, family_name=:fam, maiden_name=:mn,
                gender=:gen, birth_date=:bd, birth_place=:bp, residence=:res,
                marital_status=:ms, spouse_name=:sn, children_count=:cc,
                phone=:ph, email=:em, address=:addr,
                district=:di, school_year=:sy, school_name=:sname,
                years_worked=:yw, school_entry_date=:sed, diploma=:dip,
                first_appointment_date=:fad, rank=:rnk, status=:stat,
                echelon=:ech, grade=:grd, execution_date=:exd,
                latest_inspection_date=:lid, latest_inspection_score=:lis,
                last_inspection_date=:laid, last_inspection_score=:lais,
                previous_year_class=:pyc, current_year_class=:cyc,
                student_count=:sc, haraka=:hrk,
                tech_institute_grad_year=:tigy, university_grad_year=:ugy
             WHERE id = :id"
        )->execute([
            ':fn'   => $firstName,    ':fam'  => $familyName,   ':mn'   => $maidenName,
            ':gen'  => $gender,       ':bd'   => $birthDate,    ':bp'   => $birthPlace,
            ':res'  => $residence,    ':ms'   => $maritalStatus, ':sn'  => $spouseName,
            ':cc'   => $childrenCount,':ph'   => $phone,         ':em'  => $email,
            ':addr' => $address,      ':di'   => $district,      ':sy'  => $schoolYear,
            ':sname'=> $schoolName,   ':yw'   => $yearsWorked,   ':sed' => $schoolEntry,
            ':dip'  => $diploma,      ':fad'  => $firstAppointmentDate ?: null,
            ':rnk'  => $rank ?: null, ':stat' => $status ?: null, ':ech' => $echelon ?: null,
            ':grd'  => $grade ?: null,':exd'  => $executionDate ?: null,
            ':lid'  => $latestInspDate ?: null,  ':lis'  => $latestInspScore,
            ':laid' => $lastInspDate ?: null,    ':lais' => $lastInspScore,
            ':pyc'  => $previousYearClass ?: null, ':cyc' => $currentYearClass ?: null,
            ':sc'   => $studentCount,  ':hrk'  => $haraka ?: null,
            ':tigy' => $techInstGradYear ?: null, ':ugy'  => $uniGradYear ?: null,
            ':id'   => $id,
        ]);

        authJsonResponse(true, 'تم تحديث السجل بنجاح');
    }

    authJsonResponse(false, 'طريقة الطلب غير مدعومة', 405);

} catch (PDOException $e) {
    error_log('admin/personal_info PDO: ' . $e->getMessage());
    authJsonResponse(false, 'خطأ في قاعدة البيانات', 500);
} catch (Exception $e) {
    error_log('admin/personal_info: ' . $e->getMessage());
    authJsonResponse(false, 'خطأ في الخادم', 500);
}
