<?php
/**
 * /api/admin/schools.php
 * Gestion de la table `ecole` par l'administrateur.
 *
 * GET    → liste toutes les écoles
 * POST   → crée une école  (body: { nom })
 * PUT    → modifie une école (body: { id, nom })
 * DELETE → supprime une école (body: { id })
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

try {
    $pdo    = getAuthConnection();
    $method = $_SERVER['REQUEST_METHOD'];
    $cols   = [];
    try {
        $stmtCols = $pdo->query("PRAGMA table_info(ecole)");
        $colsRows = $stmtCols ? $stmtCols->fetchAll(PDO::FETCH_ASSOC) : [];
        foreach ($colsRows as $c) { $cols[] = $c['name']; }
    } catch (PDOException $e) {
        // MySQL fallback
        try {
            $stmtCols = $pdo->query("SHOW COLUMNS FROM ecole");
            $colsRows = $stmtCols ? $stmtCols->fetchAll(PDO::FETCH_ASSOC) : [];
            foreach ($colsRows as $c) { $cols[] = $c['Field']; }
        } catch (PDOException $e2) {
            $cols = [];
        }
    }

    $has = function (string $name) use ($cols): bool {
        return in_array($name, $cols, true);
    };

    $idCol       = $has('id') ? 'id' : 'id_ecole';
    $districtCol = $has('district') ? 'district' : ($has('id_district') ? 'id_district' : null);

    // ── GET : liste des écoles ────────────────────────────────────────────
    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT * FROM ecole ORDER BY nom ASC");
        $schools = $stmt->fetchAll();
        foreach ($schools as &$s) {
            if (!isset($s['id']) && isset($s['id_ecole'])) {
                $s['id'] = $s['id_ecole'];
            }
            if (!isset($s['district']) && isset($s['id_district'])) {
                $s['district'] = $s['id_district'];
            }
        }
        unset($s);
        authJsonResponse(true, 'ok', 200, ['schools' => $schools]);
    }

    // ── Lecture body JSON ─────────────────────────────────────────────────
    $body = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        authJsonResponse(false, 'JSON غير صالح', 400);
    }

    // ── POST : création d'une école ───────────────────────────────────────
    if ($method === 'POST') {
        $nom          = trim($body['nom'] ?? '');
        $district     = isset($body['district'])     ? trim($body['district'])     : null;
        $code         = isset($body['code'])         ? trim($body['code'])         : null;
        $adresse      = isset($body['adresse'])      ? trim($body['adresse'])      : null;
        $ville        = isset($body['ville'])        ? trim($body['ville'])        : null;
        $nb_directeur = isset($body['nb_directeur']) ? (int)$body['nb_directeur'] : 0;
        $nb_sub_dir   = isset($body['nb_sub_dir'])   ? (int)$body['nb_sub_dir']   : 0;
        $nb_Prf_arb   = isset($body['nb_Prf_arb'])   ? (int)$body['nb_Prf_arb']   : 0;
        $nb_prf_frc   = isset($body['nb_prf_frc'])   ? (int)$body['nb_prf_frc']   : 0;
        $nb_prf_ang   = isset($body['nb_prf_ang'])   ? (int)$body['nb_prf_ang']   : 0;
        $nb_prf_sprt  = isset($body['nb_prf_sprt'])  ? (int)$body['nb_prf_sprt']  : 0;

        if (mb_strlen($nom) < 2) {
            authJsonResponse(false, 'اسم المدرسة مطلوب', 422, ['errors' => ['nom' => 'اسم المدرسة مطلوب (حرفان على الأقل)']]);
        }

        // Duplicate check
        $dup = $pdo->prepare("SELECT $idCol FROM ecole WHERE TRIM(LOWER(nom)) = TRIM(LOWER(:nom)) LIMIT 1");
        $dup->execute([':nom' => $nom]);
        if ($dup->fetch()) {
            authJsonResponse(false, 'هذه المدرسة موجودة بالفعل', 422, ['errors' => ['nom' => 'اسم المدرسة مستخدم بالفعل']]);
        }

        $districtInsertCol = $districtCol ? ", $districtCol" : '';
        $districtInsertVal = $districtCol ? ", :district" : '';

        $insertStmt = $pdo->prepare("INSERT INTO ecole (nom$districtInsertCol, code, adresse, ville, nb_directeur, nb_sub_dir, nb_Prf_arb, nb_prf_frc, nb_prf_ang, nb_prf_sprt)
                                     VALUES (:nom$districtInsertVal, :code, :adresse, :ville, :nb_directeur, :nb_sub_dir, :nb_Prf_arb, :nb_prf_frc, :nb_prf_ang, :nb_prf_sprt)");
        $insertParams = [
            ':nom' => $nom,
            ':code' => $code ?: null,
            ':adresse' => $adresse ?: null,
            ':ville' => $ville ?: null,
            ':nb_directeur' => $nb_directeur,
            ':nb_sub_dir' => $nb_sub_dir,
            ':nb_Prf_arb' => $nb_Prf_arb,
            ':nb_prf_frc' => $nb_prf_frc,
            ':nb_prf_ang' => $nb_prf_ang,
            ':nb_prf_sprt' => $nb_prf_sprt,
        ];
        if ($districtCol) {
            $insertParams[':district'] = $district ?: null;
        }
        $insertStmt->execute($insertParams);
        authJsonResponse(true, 'تمت إضافة المدرسة', 201, ['id' => (int)$pdo->lastInsertId()]);
    }

    // ── PUT : modification d'une école ────────────────────────────────────
    if ($method === 'PUT') {
        $id           = (int)($body['id'] ?? 0);
        $nom          = trim($body['nom'] ?? '');
        $district     = isset($body['district'])     ? trim($body['district'])     : null;
        $code         = isset($body['code'])         ? trim($body['code'])         : null;
        $adresse      = isset($body['adresse'])      ? trim($body['adresse'])      : null;
        $ville        = isset($body['ville'])        ? trim($body['ville'])        : null;
        $nb_directeur = isset($body['nb_directeur']) ? (int)$body['nb_directeur'] : 0;
        $nb_sub_dir   = isset($body['nb_sub_dir'])   ? (int)$body['nb_sub_dir']   : 0;
        $nb_Prf_arb   = isset($body['nb_Prf_arb'])   ? (int)$body['nb_Prf_arb']   : 0;
        $nb_prf_frc   = isset($body['nb_prf_frc'])   ? (int)$body['nb_prf_frc']   : 0;
        $nb_prf_ang   = isset($body['nb_prf_ang'])   ? (int)$body['nb_prf_ang']   : 0;
        $nb_prf_sprt  = isset($body['nb_prf_sprt'])  ? (int)$body['nb_prf_sprt']  : 0;

        if (!$id) authJsonResponse(false, 'معرّف المدرسة مطلوب', 400);
        if (mb_strlen($nom) < 2) {
            authJsonResponse(false, 'اسم المدرسة مطلوب', 422, ['errors' => ['nom' => 'اسم المدرسة مطلوب']]);
        }

        // Duplicate check (excluding self)
        $dup = $pdo->prepare("SELECT $idCol FROM ecole WHERE TRIM(LOWER(nom)) = TRIM(LOWER(:nom)) AND $idCol != :id LIMIT 1");
        $dup->execute([':nom' => $nom, ':id' => $id]);
        if ($dup->fetch()) {
            authJsonResponse(false, 'هذه المدرسة موجودة بالفعل', 422, ['errors' => ['nom' => 'اسم المدرسة مستخدم بالفعل']]);
        }

        $districtUpdateSet = $districtCol ? "$districtCol = :district, " : '';
        $stmt = $pdo->prepare("UPDATE ecole SET nom = :nom, $districtUpdateSet code = :code,
                                adresse = :adresse, ville = :ville, nb_directeur = :nb_directeur,
                                nb_sub_dir = :nb_sub_dir, nb_Prf_arb = :nb_Prf_arb,
                                nb_prf_frc = :nb_prf_frc, nb_prf_ang = :nb_prf_ang,
                                nb_prf_sprt = :nb_prf_sprt WHERE $idCol = :id");
        $updateParams = [
            ':nom' => $nom,
            ':code' => $code ?: null,
            ':adresse' => $adresse ?: null,
            ':ville' => $ville ?: null,
            ':nb_directeur' => $nb_directeur,
            ':nb_sub_dir' => $nb_sub_dir,
            ':nb_Prf_arb' => $nb_Prf_arb,
            ':nb_prf_frc' => $nb_prf_frc,
            ':nb_prf_ang' => $nb_prf_ang,
            ':nb_prf_sprt' => $nb_prf_sprt,
            ':id' => $id,
        ];
        if ($districtCol) {
            $updateParams[':district'] = $district ?: null;
        }
        $stmt->execute($updateParams);

        if ($stmt->rowCount() === 0) authJsonResponse(false, 'المدرسة غير موجودة', 404);
        authJsonResponse(true, 'تم تحديث المدرسة');
    }

    // ── DELETE : suppression d'une école ─────────────────────────────────
    if ($method === 'DELETE') {
        $id = (int)($body['id'] ?? 0);
        if (!$id) authJsonResponse(false, 'معرّف المدرسة مطلوب', 400);

        $stmt = $pdo->prepare("DELETE FROM ecole WHERE $idCol = :id");
        $stmt->execute([':id' => $id]);

        if ($stmt->rowCount() === 0) authJsonResponse(false, 'المدرسة غير موجودة', 404);
        authJsonResponse(true, 'تم حذف المدرسة');
    }

    authJsonResponse(false, 'طريقة غير مدعومة', 405);

} catch (PDOException $e) {
    authJsonResponse(false, 'خطأ في قاعدة البيانات', 500);
}
