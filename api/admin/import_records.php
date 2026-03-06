<?php
/**
 * /api/admin/import_records.php
 * Importation en masse de fiches personal_info depuis un fichier Excel (xlsx/csv)
 * parsé côté client avec SheetJS et envoyé ici sous forme de tableau JSON.
 *
 * POST  { records: [ {col: val, ...}, ... ] }
 *       → insère les lignes valides, retourne un résumé
 *
 * Accès réservé aux administrateurs connectés.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once __DIR__ . '/../auth/db.php';

session_name('TAFTICHE_SESSION');
session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'httponly' => true, 'samesite' => 'Strict']);
session_start();

if (empty($_SESSION['user']) || ($_SESSION['user']['role'] ?? '') !== 'admin') {
    authJsonResponse(false, 'غير مصرح لك', 403);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    authJsonResponse(false, 'طريقة الطلب غير مدعومة', 405);
}

$body = json_decode(file_get_contents('php://input'), true);
if (json_last_error() !== JSON_ERROR_NONE || !isset($body['records']) || !is_array($body['records'])) {
    authJsonResponse(false, 'بيانات JSON غير صالحة', 400);
}

$records = $body['records'];
if (count($records) === 0) {
    authJsonResponse(false, 'الملف لا يحتوي على أي سجلات', 400);
}
if (count($records) > 500) {
    authJsonResponse(false, 'الحد الأقصى للاستيراد هو 500 سجل في المرة الواحدة', 400);
}

// ── Mapping colonnes arabes → champs BDD ─────────────────────────────────
// Normalise la clé (supprime espaces superflus, tirets bas → espace)
function normalizeKey(string $k): string {
    return trim(str_replace(['_', '  '], [' ', ' '], mb_strtolower($k, 'UTF-8')));
}

// Table de correspondance (valeurs normalisées → champ PHP)
$colMap = [
    'المقاطعة'                    => 'district',
    'العام الدراسي'               => 'school_year',
    'اسم المؤسسة'                 => 'school_name',
    'اسم_المؤسسة'                 => 'school_name',
    'سنوات العمل'                 => 'years_worked',
    'سنوات_العمل'                 => 'years_worked',
    'الجنس'                       => 'gender',
    'الاسم الشخصي'                => 'first_name',
    'الاسم_الشخصي'                => 'first_name',
    'الاسم العائلي'               => 'family_name',
    'الاسم_العائلي'               => 'family_name',
    'الاسم الأصلي للمتزوجة'       => 'maiden_name',
    'الاسم_الأصلي_للمتزوجة'       => 'maiden_name',
    'تاريخ الازدياد'              => 'birth_date',
    'تاريخ_الازدياد'              => 'birth_date',
    'مكان الازدياد'               => 'birth_place',
    'مكان_الازدياد'               => 'birth_place',
    'الإقامة'                     => 'residence',
    'الوضعية العائلية'            => 'marital_status',
    'الوضعية_العائلية'            => 'marital_status',
    'عدد الأبناء'                 => 'children_count',
    'عدد_الأبناء'                 => 'children_count',
    'رقم الهاتف'                  => 'phone',
    'رقم_الهاتف'                  => 'phone',
    'البريد الإلكتروني'           => 'email',
    'البريد_الإلكتروني'           => 'email',
    'العنوان'                     => 'address',
    'تاريخ التعيين بالمدرسة'      => 'school_entry_date',
    'تاريخ_التعيين_بالمدرسة'      => 'school_entry_date',
    'الشهادة'                     => 'diploma',
    'تاريخ التعيين الأول'         => 'first_appointment_date',
    'تاريخ_التعيين_الأول'         => 'first_appointment_date',
    'الرتبة'                      => 'rank',
    'الوضعية الإدارية'            => 'status',
    'الوضعية_الإدارية'            => 'status',
    'السلم'                       => 'echelon',
    'الدرجة'                      => 'grade',
    'تاريخ السريان'               => 'execution_date',
    'تاريخ_السريان'               => 'execution_date',
    'تاريخ التفتيش قبل الأخير'   => 'last_inspection_date',
    'تاريخ_التفتيش_قبل_الأخير'   => 'last_inspection_date',
    'علامة التفتيش قبل الأخير'   => 'last_inspection_score',
    'علامة_التفتيش_قبل_الأخير'   => 'last_inspection_score',
    'تاريخ آخر تفتيش'             => 'latest_inspection_date',
    'تاريخ_آخر_تفتيش'             => 'latest_inspection_date',
    'علامة آخر تفتيش'             => 'latest_inspection_score',
    'علامة_آخر_تفتيش'             => 'latest_inspection_score',
    'فصل السنة الماضية'           => 'previous_year_class',
    'فصل_السنة_الماضية'           => 'previous_year_class',
    'عدد التلاميذ'                => 'student_count',
    'عدد_التلاميذ'                => 'student_count',
    'فصل السنة الحالية'           => 'current_year_class',
    'فصل_السنة_الحالية'           => 'current_year_class',
    'حركة'                        => 'haraka',
    'سنة تخرج المعهد التقني'      => 'tech_institute_grad_year',
    'سنة_تخرج_المعهد_التقني'      => 'tech_institute_grad_year',
    'سنة آخر شهادة جامعية'        => 'university_grad_year',
    'سنة_آخر_شهادة_جامعية'        => 'university_grad_year',
    'سنة أخر شهادة جامعية'        => 'university_grad_year',
    'سنة_أخر_شهادة_جامعية'        => 'university_grad_year',
];

function mapRow(array $row): array {
    global $colMap;
    $mapped = [];
    foreach ($row as $k => $v) {
        $nk = normalizeKey($k);
        // Cherche correspondance directe ou normalisée
        if (isset($colMap[$k])) {
            $mapped[$colMap[$k]] = $v;
        } elseif (isset($colMap[$nk])) {
            $mapped[$colMap[$nk]] = $v;
        }
        // sinon on ignore la colonne inconnue
    }
    return $mapped;
}

// ── Sanitize / validation par ligne ──────────────────────────────────────
function sanitizeStr(mixed $v, int $max = 200): string {
    return htmlspecialchars(mb_substr(trim((string)($v ?? '')), 0, $max), ENT_QUOTES, 'UTF-8');
}

// Normalize date: accepte DD/MM/YYYY, YYYY-MM-DD, timestamp Excel
function normalizeDate(mixed $v): ?string {
    if ($v === null || $v === '') return null;
    $s = trim((string)$v);
    // YYYY-MM-DD
    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $s)) return $s;
    // DD/MM/YYYY
    if (preg_match('#^(\d{1,2})/(\d{1,2})/(\d{4})$#', $s, $m)) {
        return sprintf('%04d-%02d-%02d', $m[3], $m[2], $m[1]);
    }
    // Timestamp numérique Excel (jours depuis 1899-12-30)
    if (is_numeric($s) && $s > 1000) {
        $ts = round(((float)$s - 25569) * 86400);
        $d = date('Y-m-d', $ts);
        if ($d !== false) return $d;
    }
    return null;
}

try {
    $pdo = getAuthConnection();

    $stmt = $pdo->prepare(
        "INSERT INTO personal_info
            (district, school_year, school_name, years_worked,
             first_name, family_name, maiden_name,
             birth_date, birth_place, residence, gender,
             marital_status, spouse_name, children_count,
             phone, email, address,
             school_entry_date, diploma,
             first_appointment_date, rank, status, echelon, grade, execution_date,
             latest_inspection_date, latest_inspection_score,
             last_inspection_date, last_inspection_score,
             previous_year_class, current_year_class,
             student_count, haraka,
             tech_institute_grad_year, university_grad_year)
         VALUES
            (:di, :sy, :sname, :yw,
             :fn, :fam, :mn,
             :bd, :bp, :res, :gen,
             :ms, :sn, :cc,
             :ph, :em, :addr,
             :sed, :dip,
             :fad, :rnk, :stat, :ech, :grd, :exd,
             :lid, :lis,
             :laid, :lais,
             :pyc, :cyc,
             :sc, :hrk,
             :tigy, :ugy)"
    );

    $inserted = 0;
    $skipped  = 0;
    $errors   = [];

    foreach ($records as $idx => $rawRow) {
        if (!is_array($rawRow)) {
            $errors[] = ['row' => $idx + 2, 'msg' => 'صف غير صالح'];
            continue;
        }

        $row = mapRow($rawRow);

        // ── Extraction des champs ─────────────────────────────────────────
        $firstName   = sanitizeStr($row['first_name']   ?? '');
        $familyName  = sanitizeStr($row['family_name']  ?? '');
        $maidenName  = sanitizeStr($row['maiden_name']  ?? '');
        $gender      = in_array($row['gender'] ?? '', ['ذكر','أنثى'], true) ? $row['gender'] : '';
        $birthDate   = normalizeDate($row['birth_date']  ?? null);
        $birthPlace  = sanitizeStr($row['birth_place']  ?? '');
        $residence   = sanitizeStr($row['residence']    ?? '');
        $maritalStatus = in_array($row['marital_status'] ?? '', ['أعزب','متزوج','أرمل','مطلق'], true)
                            ? $row['marital_status'] : '';
        $childrenCount = (isset($row['children_count']) && $row['children_count'] !== '')
                            ? (int)$row['children_count'] : null;
        $phone       = preg_replace('/[^\+0-9\-\s]/', '', trim((string)($row['phone'] ?? '')));
        $email       = strtolower(trim((string)($row['email'] ?? '')));
        $address     = sanitizeStr($row['address']      ?? '');
        $district    = sanitizeStr($row['district']     ?? '11');
        $schoolYear  = sanitizeStr($row['school_year']  ?? '2025 / 2026');
        $schoolName  = sanitizeStr($row['school_name']  ?? '');
        $yearsWorked = (isset($row['years_worked']) && $row['years_worked'] !== '') ? (int)$row['years_worked'] : 0;
        $schoolEntry = normalizeDate($row['school_entry_date'] ?? null) ?? date('Y-m-d');
        $diploma     = sanitizeStr($row['diploma']      ?? '');
        $firstAppDate   = normalizeDate($row['first_appointment_date'] ?? null);
        $rank           = sanitizeStr($row['rank']      ?? '');
        $rstatus        = sanitizeStr($row['status']    ?? '');
        $echelon        = sanitizeStr($row['echelon']   ?? '');
        $grade          = sanitizeStr($row['grade']     ?? '');
        $executionDate  = normalizeDate($row['execution_date'] ?? null);
        $latestInspDate = normalizeDate($row['latest_inspection_date'] ?? null);
        $latestInspScore = (isset($row['latest_inspection_score']) && $row['latest_inspection_score'] !== '')
                            ? (int)$row['latest_inspection_score'] : null;
        $lastInspDate   = normalizeDate($row['last_inspection_date'] ?? null);
        $lastInspScore  = (isset($row['last_inspection_score']) && $row['last_inspection_score'] !== '')
                            ? (int)$row['last_inspection_score'] : null;
        $prevClass      = sanitizeStr($row['previous_year_class'] ?? '');
        $currClass      = sanitizeStr($row['current_year_class']  ?? '');
        $studentCount   = (isset($row['student_count']) && $row['student_count'] !== '')
                            ? (int)$row['student_count'] : null;
        $haraka         = in_array($row['haraka'] ?? '', ['نعم','لا'], true) ? $row['haraka'] : null;
        $techGrad       = sanitizeStr($row['tech_institute_grad_year'] ?? '');
        $uniGrad        = sanitizeStr($row['university_grad_year']      ?? '');

        // ── Validation minimale ───────────────────────────────────────────
        $rowErrors = [];
        if (mb_strlen($firstName)  < 2) $rowErrors[] = 'الاسم الشخصي مطلوب';
        if (mb_strlen($familyName) < 2) $rowErrors[] = 'الاسم العائلي مطلوب';
        if (!$gender)                   $rowErrors[] = 'الجنس مطلوب (ذكر/أنثى)';
        if (!$birthDate)                $rowErrors[] = 'تاريخ الميلاد مطلوب أو غير صالح';
        if (mb_strlen($birthPlace) < 2) $rowErrors[] = 'مكان الازدياد مطلوب';
        if (mb_strlen($residence)  < 2) $rowErrors[] = 'الإقامة مطلوبة';
        if (!$maritalStatus)            $rowErrors[] = 'الوضعية العائلية مطلوبة (أعزب/متزوج/أرمل/مطلق)';
        if (!preg_match('/^0[56][0-9]{8}$/', $phone)) $rowErrors[] = 'رقم الهاتف غير صالح';
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $rowErrors[] = 'البريد الإلكتروني غير صالح';
        if (mb_strlen($address)    < 5) $rowErrors[] = 'العنوان مطلوب';
        if (mb_strlen($diploma)    < 2) $rowErrors[] = 'الشهادة مطلوبة';
        if (mb_strlen($schoolName) < 2) $rowErrors[] = 'اسم المؤسسة مطلوب';

        if (!empty($rowErrors)) {
            $errors[] = ['row' => $idx + 2, 'msg' => implode(' / ', $rowErrors),
                         'name' => "$firstName $familyName"];
            continue;
        }

        // ── Vérification doublon email ────────────────────────────────────
        $dup = $pdo->prepare('SELECT id FROM personal_info WHERE email = :e LIMIT 1');
        $dup->execute([':e' => $email]);
        if ($dup->fetch()) {
            $skipped++;
            $errors[] = ['row' => $idx + 2, 'msg' => "البريد الإلكتروني مستخدم بالفعل: $email",
                         'name' => "$firstName $familyName", 'type' => 'duplicate'];
            continue;
        }

        // ── Insertion ─────────────────────────────────────────────────────
        $stmt->execute([
            ':di'   => $district ?: '11',   ':sy'   => $schoolYear,   ':sname'=> $schoolName,
            ':yw'   => $yearsWorked,         ':fn'   => $firstName,    ':fam'  => $familyName,
            ':mn'   => $maidenName ?: null,
            ':bd'   => $birthDate,           ':bp'   => $birthPlace,   ':res'  => $residence,
            ':gen'  => $gender,              ':ms'   => $maritalStatus,':sn'   => null,
            ':cc'   => $childrenCount,       ':ph'   => $phone,        ':em'   => $email,
            ':addr' => $address,             ':sed'  => $schoolEntry,  ':dip'  => $diploma,
            ':fad'  => $firstAppDate  ?: null,
            ':rnk'  => $rank     ?: null,    ':stat' => $rstatus  ?: null,
            ':ech'  => $echelon  ?: null,    ':grd'  => $grade    ?: null,
            ':exd'  => $executionDate   ?: null,
            ':lid'  => $latestInspDate  ?: null, ':lis'  => $latestInspScore,
            ':laid' => $lastInspDate    ?: null, ':lais' => $lastInspScore,
            ':pyc'  => $prevClass    ?: null,    ':cyc'  => $currClass  ?: null,
            ':sc'   => $studentCount,        ':hrk'  => $haraka,
            ':tigy' => $techGrad ?: null,    ':ugy'  => $uniGrad   ?: null,
        ]);
        $inserted++;
    }

    authJsonResponse(true, 'تم الاستيراد', 200, [
        'inserted' => $inserted,
        'skipped'  => $skipped,
        'errors'   => $errors,
        'total'    => count($records),
    ]);

} catch (Throwable $e) {
    authJsonResponse(false, 'خطأ داخلي في الخادم', 500);
}
