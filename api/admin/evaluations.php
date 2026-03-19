<?php
/**
 * /api/admin/evaluations.php
 * Gestion des évaluations liées aux inspections (CRUD).
 *
 * Schéma :
 *   evaluations           : id, inspection_id, note_finale (TEXT), titre (TEXT), created_at, updated_at
 *   evaluation_sections   : id, evaluation_id, ordre, titre, contenu
 *   evaluation_subsections: id, section_id, ordre, type ('texte'|'liste'), contenu
 *   evaluation_items      : id, subsection_id, ordre, item
 *
 * GET              → liste toutes les évaluations
 * GET ?id=X        → évaluation unique + sections + items
 * POST             → crée une évaluation  (body JSON)
 * PUT              → modifie une évaluation (body JSON)
 * DELETE           → supprime une évaluation (body JSON)
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

if (empty($_SESSION['user']) || ($_SESSION['user']['role'] ?? '') !== 'admin') {
    authJsonResponse(false, 'غير مصرح لك', 403);
}

try {
    $pdo    = getAuthConnection();
    $method = $_SERVER['REQUEST_METHOD'];

    // ── GET ───────────────────────────────────────────────────────────────
    if ($method === 'GET') {

        // GET ?id=X → évaluation + sections + items
        if (!empty($_GET['id'])) {
            $id = (int)$_GET['id'];
            if ($id <= 0) authJsonResponse(false, 'معرّف غير صالح', 400);

            $stmt = $pdo->prepare(
                "SELECT e.id, e.inspection_id, e.titre, e.note_finale, e.created_at, e.updated_at,
                        i.inspection_date, i.school_name,
                        p.first_name, p.family_name
                 FROM evaluations e
                 LEFT JOIN inspections i ON i.id = e.inspection_id
                 LEFT JOIN personal_info p ON p.id = i.personal_info_id
                 WHERE e.id = ?"
            );
            $stmt->execute([$id]);
            $eval = $stmt->fetch();
            if (!$eval) authJsonResponse(false, 'التقييم غير موجود', 404);

            $eval['sections'] = getSectionsWithItems($pdo, $id);
            authJsonResponse(true, 'ok', 200, ['evaluation' => $eval]);
        }

        // GET liste complète
        $stmt = $pdo->query(
            "SELECT e.id, e.inspection_id, e.titre, e.note_finale, e.created_at, e.updated_at,
                    i.inspection_date, i.school_name,
                    p.first_name, p.family_name
             FROM evaluations e
             LEFT JOIN inspections i ON i.id = e.inspection_id
             LEFT JOIN personal_info p ON p.id = i.personal_info_id
             ORDER BY e.created_at DESC, e.id DESC"
        );
        authJsonResponse(true, 'ok', 200, ['evaluations' => $stmt->fetchAll()]);
    }

    // ── Lecture body ──────────────────────────────────────────────────────
    $body = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        authJsonResponse(false, 'JSON invalide', 400);
    }

    // ── POST : créer une évaluation ───────────────────────────────────────
    if ($method === 'POST') {
        $errors = [];

        $inspectionId = isset($body['inspection_id']) && $body['inspection_id'] !== '' && $body['inspection_id'] !== null
            ? (int)$body['inspection_id'] : null;
        $titre        = trim($body['titre'] ?? '');
        $noteFinale   = isset($body['note_finale']) && $body['note_finale'] !== '' && $body['note_finale'] !== null
            ? trim((string)$body['note_finale']) : null;
        $sections     = $body['sections'] ?? [];

        if ($titre === '') $errors['titre'] = 'عنوان التقييم مطلوب';
        if ($noteFinale !== null && (!is_numeric($noteFinale) || (float)$noteFinale < 0 || (float)$noteFinale > 20)) {
            $errors['note_finale'] = 'العلامة يجب أن تكون بين 0 و 20';
        }
        if ($inspectionId === null || $inspectionId <= 0) {
            $errors['inspection_id'] = 'يرجى اختيار زيارة التفتيش';
        } else {
            $chk = $pdo->prepare("SELECT id FROM inspections WHERE id = ?");
            $chk->execute([$inspectionId]);
            if (!$chk->fetch()) $errors['inspection_id'] = 'الزيارة غير موجودة';
        }

        if (!empty($errors)) {
            authJsonResponse(false, 'بيانات غير صالحة', 422, ['errors' => $errors]);
        }

        $stmt = $pdo->prepare(
            "INSERT INTO evaluations (inspection_id, titre, note_finale, created_at)
             VALUES (?, ?, ?, datetime('now'))"
        );
        $stmt->execute([$inspectionId, $titre, $noteFinale]);
        $newId = (int)$pdo->lastInsertId();

        saveSections($pdo, $newId, $sections);

        authJsonResponse(true, 'تم إنشاء التقييم بنجاح', 201, ['id' => $newId]);
    }

    // ── PUT : modifier une évaluation ─────────────────────────────────────
    if ($method === 'PUT') {
        $errors = [];

        $id           = isset($body['id']) ? (int)$body['id'] : 0;
        $inspectionId = isset($body['inspection_id']) && $body['inspection_id'] !== '' && $body['inspection_id'] !== null
            ? (int)$body['inspection_id'] : null;
        $titre        = trim($body['titre'] ?? '');
        $noteFinale   = isset($body['note_finale']) && $body['note_finale'] !== '' && $body['note_finale'] !== null
            ? trim((string)$body['note_finale']) : null;
        $sections     = $body['sections'] ?? [];

        if ($id <= 0) authJsonResponse(false, 'معرّف غير صالح', 400);

        $chk = $pdo->prepare("SELECT id FROM evaluations WHERE id = ?");
        $chk->execute([$id]);
        if (!$chk->fetch()) authJsonResponse(false, 'التقييم غير موجود', 404);

        if ($titre === '') $errors['titre'] = 'عنوان التقييم مطلوب';
        if ($noteFinale !== null && (!is_numeric($noteFinale) || (float)$noteFinale < 0 || (float)$noteFinale > 20)) {
            $errors['note_finale'] = 'العلامة يجب أن تكون بين 0 و 20';
        }
        if ($inspectionId === null || $inspectionId <= 0) {
            $errors['inspection_id'] = 'يرجى اختيار زيارة التفتيش';
        } else {
            $chkI = $pdo->prepare("SELECT id FROM inspections WHERE id = ?");
            $chkI->execute([$inspectionId]);
            if (!$chkI->fetch()) $errors['inspection_id'] = 'الزيارة غير موجودة';
        }

        if (!empty($errors)) {
            authJsonResponse(false, 'بيانات غير صالحة', 422, ['errors' => $errors]);
        }

        $stmt = $pdo->prepare(
            "UPDATE evaluations SET inspection_id = ?, titre = ?, note_finale = ? WHERE id = ?"
        );
        $stmt->execute([$inspectionId, $titre, $noteFinale, $id]);

        // Remplacer toutes les sections/items
        $del = $pdo->prepare("DELETE FROM evaluation_sections WHERE evaluation_id = ?");
        $del->execute([$id]);
        saveSections($pdo, $id, $sections);

        authJsonResponse(true, 'تم تحديث التقييم بنجاح');
    }

    // ── DELETE : supprimer une évaluation ─────────────────────────────────
    if ($method === 'DELETE') {
        $id = isset($body['id']) ? (int)$body['id'] : 0;
        if ($id <= 0) authJsonResponse(false, 'معرّف غير صالح', 400);

        $stmt = $pdo->prepare("DELETE FROM evaluations WHERE id = ?");
        $stmt->execute([$id]);

        if ($stmt->rowCount() === 0) authJsonResponse(false, 'التقييم غير موجود', 404);

        authJsonResponse(true, 'تم حذف التقييم بنجاح');
    }

    authJsonResponse(false, 'طريقة غير مدعومة', 405);

} catch (Throwable $e) {
    error_log('evaluations.php error: ' . $e->getMessage());
    authJsonResponse(false, 'خطأ في الخادم', 500);
}

// ── Helpers ───────────────────────────────────────────────────────────────

/**
 * Retourne les sections + sous-sections + items d'une évaluation.
 */
function getSectionsWithItems(PDO $pdo, int $evalId): array
{
    $secStmt = $pdo->prepare(
        "SELECT id, ordre, titre, contenu FROM evaluation_sections
         WHERE evaluation_id = ? ORDER BY ordre, id"
    );
    $secStmt->execute([$evalId]);
    $sections = $secStmt->fetchAll();

    if (empty($sections)) return [];

    $sectionIds      = array_column($sections, 'id');
    $inPlaceholders  = implode(',', array_fill(0, count($sectionIds), '?'));

    $subStmt = $pdo->prepare(
        "SELECT id, section_id, ordre, type, contenu FROM evaluation_subsections
         WHERE section_id IN ($inPlaceholders)
         ORDER BY section_id, ordre, id"
    );
    $subStmt->execute($sectionIds);
    $allSubsections = $subStmt->fetchAll();

    if (empty($allSubsections)) {
        foreach ($sections as &$section) {
            $section['subsections'] = [];
        }
        unset($section);
        return $sections;
    }

    $subsectionIds   = array_column($allSubsections, 'id');
    $inPlaceholders2 = implode(',', array_fill(0, count($subsectionIds), '?'));

    $itemStmt = $pdo->prepare(
        "SELECT id, subsection_id, ordre, item FROM evaluation_items
         WHERE subsection_id IN ($inPlaceholders2)
         ORDER BY subsection_id, ordre, id"
    );
    $itemStmt->execute($subsectionIds);
    $allItems = $itemStmt->fetchAll();

    $itemsBySubsection = [];
    foreach ($allItems as $itm) {
        $itemsBySubsection[(int)$itm['subsection_id']][] = $itm;
    }

    $subsectionsBySection = [];
    foreach ($allSubsections as $sub) {
        $sub['items'] = $itemsBySubsection[(int)$sub['id']] ?? [];
        $subsectionsBySection[(int)$sub['section_id']][] = $sub;
    }

    foreach ($sections as &$section) {
        $section['subsections'] = $subsectionsBySection[(int)$section['id']] ?? [];
    }
    unset($section);

    return $sections;
}

/**
 * Enregistre les sections + sous-sections + items pour une évaluation donnée.
 */
function saveSections(PDO $pdo, int $evalId, array $sections): void
{
    $secStmt = $pdo->prepare(
        "INSERT INTO evaluation_sections (evaluation_id, ordre, titre, contenu)
         VALUES (?, ?, ?, ?)"
    );
    $subStmt = $pdo->prepare(
        "INSERT INTO evaluation_subsections (section_id, ordre, type, contenu)
         VALUES (?, ?, ?, ?)"
    );
    $itemStmt = $pdo->prepare(
        "INSERT INTO evaluation_items (subsection_id, ordre, item)
         VALUES (?, ?, ?)"
    );

    foreach ($sections as $secOrdre => $sec) {
        $titre   = trim($sec['titre'] ?? '');
        $contenu = trim($sec['contenu'] ?? '') ?: null;
        if ($titre === '') continue;

        $secStmt->execute([$evalId, (int)$secOrdre, $titre, $contenu]);
        $secId = (int)$pdo->lastInsertId();

        foreach (($sec['subsections'] ?? []) as $subOrdre => $sub) {
            $type       = in_array($sub['type'] ?? '', ['texte', 'liste'], true) ? $sub['type'] : 'texte';
            $subContenu = trim($sub['contenu'] ?? '') ?: null;

            $subStmt->execute([$secId, (int)$subOrdre, $type, $subContenu]);
            $subId = (int)$pdo->lastInsertId();

            foreach (($sub['items'] ?? []) as $itemOrdre => $item) {
                $itemText = trim(is_array($item) ? ($item['item'] ?? '') : (string)$item);
                if ($itemText === '') continue;
                try {
                    $itemStmt->execute([$subId, (int)$itemOrdre, $itemText]);
                } catch (Throwable $itemErr) {
                    error_log('evaluations.php saveSections item error: ' . $itemErr->getMessage() . ' | subId=' . $subId . ' | itemText=' . $itemText);
                }
            }
        }
    }
}
