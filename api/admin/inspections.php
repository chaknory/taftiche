<?php
/**
 * /api/admin/inspections.php
 * Gestion des visites d'inspection (CRUD) par l'administrateur.
 *
 * GET ?id=X       → inspection unique + catalogue d'observation + réponses
 * GET ?catalogue=1→ catalogue d'observation seul (pour formulaire d'ajout)
 * GET             → liste toutes les inspections (avec nom du l'enseignant)
 * POST   → crée une nouvelle inspection  (body: { personal_info_id, inspector_name, inspection_date, heure_visite, duree_visite, school_name, subject, responses[] })
 * PUT    → modifie une inspection        (body: { id, inspector_name, inspection_date, heure_visite, duree_visite, school_name, subject, responses[] })
 * DELETE → supprime une inspection       (body: { id })
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

    // ── GET ───────────────────────────────────────────────────────────────
    if ($method === 'GET') {

        // ?id=X → inspection unique + catalogue + réponses (pour form d'édition)
        if (!empty($_GET['id'])) {
            $id = (int)$_GET['id'];
            if ($id <= 0) authJsonResponse(false, 'معرّف غير صالح', 400);

            $stmt = $pdo->prepare(
                "SELECT i.id,
                        i.personal_info_id,
                        i.inspector_name,
                        i.inspection_date,
                        i.heure_visite,
                        i.duree_visite,
                        i.school_name,
                        i.subject,
                        i.created_at,
                        i.updated_at,
                        p.first_name,
                        p.family_name
                 FROM inspections i
                 LEFT JOIN personal_info p ON p.id = i.personal_info_id
                 WHERE i.id = ?"
            );
            $stmt->execute([$id]);
            $ins = $stmt->fetch();
            if (!$ins) authJsonResponse(false, 'زيارة التفتيش غير موجودة', 404);

            authJsonResponse(true, 'ok', 200, [
                'inspection' => $ins,
                'catalogue'  => buildObservationCatalogue($pdo, $id),
            ]);
        }

        // ?catalogue=1 → catalogue seul (pour formulaire d'ajout)
        if (!empty($_GET['catalogue'])) {
            authJsonResponse(true, 'ok', 200, [
                'catalogue' => buildObservationCatalogue($pdo, null),
            ]);
        }

        // liste complète des inspections
        $stmt = $pdo->query(
            "SELECT i.id,
                    i.personal_info_id,
                    i.inspector_name,
                    i.inspection_date,
                    i.heure_visite,
                    i.duree_visite,
                    i.school_name,
                    i.subject,
                    i.created_at,
                    i.updated_at,
                    p.first_name,
                    p.family_name
             FROM inspections i
             LEFT JOIN personal_info p ON p.id = i.personal_info_id
             ORDER BY i.inspection_date DESC, i.id DESC"
        );
        authJsonResponse(true, 'ok', 200, ['inspections' => $stmt->fetchAll()]);
    }

    // ── Lecture body JSON ─────────────────────────────────────────────────
    $body = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        authJsonResponse(false, 'JSON invalide', 400);
    }

    // ── POST : créer une inspection ───────────────────────────────────────
    if ($method === 'POST') {
        $errors = [];

        $personalInfoId = isset($body['personal_info_id']) ? (int)$body['personal_info_id'] : 0;
        $inspectorName  = trim($body['inspector_name'] ?? '');
        $inspectionDate = trim($body['inspection_date'] ?? '');
        $heureVisite    = trim($body['heure_visite'] ?? '');
        $dureeVisiteRaw = $body['duree_visite'] ?? null;
        $dureeVisite    = ($dureeVisiteRaw === null || $dureeVisiteRaw === '') ? null : trim((string)$dureeVisiteRaw);
        $schoolName     = trim($body['school_name'] ?? '');
        $subject        = trim($body['subject'] ?? '');

        if ($personalInfoId <= 0) {
            $errors['personal_info_id'] = 'يرجى اختيار الأستاذ/الأستاذة';
        } else {
            // Verify teacher exists
            $chk = $pdo->prepare("SELECT id FROM personal_info WHERE id = ?");
            $chk->execute([$personalInfoId]);
            if (!$chk->fetch()) {
                $errors['personal_info_id'] = 'الأستاذ/الأستاذة غير موجود في قاعدة البيانات';
            }
        }

        if ($inspectorName === '') {
            $errors['inspector_name'] = 'اسم المفتش مطلوب';
        } elseif (mb_strlen($inspectorName) < 2) {
            $errors['inspector_name'] = 'اسم المفتش قصير جدًا';
        }

        if ($inspectionDate === '') {
            $errors['inspection_date'] = 'تاريخ التفتيش مطلوب';
        } elseif (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $inspectionDate)) {
            $errors['inspection_date'] = 'تنسيق التاريخ غير صالح';
        }

        if ($heureVisite !== '' && !preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $heureVisite)) {
            $errors['heure_visite'] = 'تنسيق ساعة الزيارة غير صالح (HH:MM)';
        }

        if ($dureeVisite !== null && !is_numeric($dureeVisite)) {
            $errors['duree_visite'] = 'مدة الزيارة يجب أن تكون رقمًا';
        }

        if (!empty($errors)) {
            authJsonResponse(false, 'بيانات غير صالحة', 422, ['errors' => $errors]);
        }

        $stmt = $pdo->prepare(
              "INSERT INTO inspections (personal_info_id, inspector_name, inspection_date, heure_visite, duree_visite, school_name, subject, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))"
        );
           $stmt->execute([$personalInfoId, $inspectorName, $inspectionDate,
                        $heureVisite !== '' ? $heureVisite : null,
                        $dureeVisite,
                        $schoolName ?: null, $subject ?: null]);

        $newId = $pdo->lastInsertId();

        // Sauvegarde des réponses d'observation si fournies
        if (!empty($body['responses']) && is_array($body['responses'])) {
            saveObservationResponses($pdo, (int)$newId, $body['responses']);
        }

        authJsonResponse(true, 'تم إنشاء زيارة التفتيش بنجاح', 201, ['id' => $newId]);
    }

    // ── PUT : modifier une inspection ─────────────────────────────────────
    if ($method === 'PUT') {
        $errors = [];

        $id             = isset($body['id']) ? (int)$body['id'] : 0;
        $inspectorName  = trim($body['inspector_name'] ?? '');
        $inspectionDate = trim($body['inspection_date'] ?? '');
        $heureVisite    = trim($body['heure_visite'] ?? '');
        $dureeVisiteRaw = $body['duree_visite'] ?? null;
        $dureeVisite    = ($dureeVisiteRaw === null || $dureeVisiteRaw === '') ? null : trim((string)$dureeVisiteRaw);
        $schoolName     = trim($body['school_name'] ?? '');
        $subject        = trim($body['subject'] ?? '');

        if ($id <= 0) {
            authJsonResponse(false, 'معرّف غير صالح', 400);
        }

        // Verify inspection exists
        $chk = $pdo->prepare("SELECT id FROM inspections WHERE id = ?");
        $chk->execute([$id]);
        if (!$chk->fetch()) {
            authJsonResponse(false, 'زيارة التفتيش غير موجودة', 404);
        }

        if ($inspectorName === '') {
            $errors['inspector_name'] = 'اسم المفتش مطلوب';
        } elseif (mb_strlen($inspectorName) < 2) {
            $errors['inspector_name'] = 'اسم المفتش قصير جدًا';
        }

        if ($inspectionDate === '') {
            $errors['inspection_date'] = 'تاريخ التفتيش مطلوب';
        } elseif (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $inspectionDate)) {
            $errors['inspection_date'] = 'تنسيق التاريخ غير صالح';
        }

        if ($heureVisite !== '' && !preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $heureVisite)) {
            $errors['heure_visite'] = 'تنسيق ساعة الزيارة غير صالح (HH:MM)';
        }

        if ($dureeVisite !== null && !is_numeric($dureeVisite)) {
            $errors['duree_visite'] = 'مدة الزيارة يجب أن تكون رقمًا';
        }

        if (!empty($errors)) {
            authJsonResponse(false, 'بيانات غير صالحة', 422, ['errors' => $errors]);
        }

        $stmt = $pdo->prepare(
            "UPDATE inspections
             SET inspector_name  = ?,
                 inspection_date = ?,
                 heure_visite    = ?,
                 duree_visite    = ?,
                 school_name     = ?,
                 subject         = ?,
                 updated_at      = datetime('now')
             WHERE id = ?"
        );
        $stmt->execute([$inspectorName, $inspectionDate,
                        $heureVisite !== '' ? $heureVisite : null,
                        $dureeVisite,
                        $schoolName ?: null, $subject ?: null, $id]);

        // Sauvegarde des réponses d'observation si fournies
        if (isset($body['responses']) && is_array($body['responses'])) {
            saveObservationResponses($pdo, $id, $body['responses']);
        }

        authJsonResponse(true, 'تم تحديث زيارة التفتيش بنجاح');
    }

    // ── DELETE : supprimer une inspection ─────────────────────────────────
    if ($method === 'DELETE') {
        $id = isset($body['id']) ? (int)$body['id'] : 0;
        if ($id <= 0) {
            authJsonResponse(false, 'معرّف غير صالح', 400);
        }

        $chk = $pdo->prepare("SELECT id FROM inspections WHERE id = ?");
        $chk->execute([$id]);
        if (!$chk->fetch()) {
            authJsonResponse(false, 'زيارة التفتيش غير موجودة', 404);
        }

        $pdo->prepare("DELETE FROM inspections WHERE id = ?")->execute([$id]);
        authJsonResponse(true, 'تم حذف زيارة التفتيش بنجاح');
    }

    authJsonResponse(false, 'طريقة الطلب غير مدعومة', 405);

} catch (PDOException $e) {
    error_log('inspections.php PDO error: ' . $e->getMessage());
    authJsonResponse(false, 'خطأ في قاعدة البيانات', 500);
} catch (Throwable $e) {
    error_log('inspections.php error: ' . $e->getMessage());
    authJsonResponse(false, 'خطأ في الخادم', 500);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Construit le catalogue d'observation (sections → items → choix) et,
 * si $inspectionId est fourni, intègre les réponses déjà enregistrées.
 */
function buildObservationCatalogue(PDO $pdo, ?int $inspectionId): array
{
    // Sections
    $sections = $pdo->query(
        "SELECT id, ordre, titre FROM observation_sections ORDER BY ordre"
    )->fetchAll(PDO::FETCH_ASSOC);

    // Items avec info du jeu de choix
    $items = $pdo->query(
        "SELECT it.id, it.section_id, it.ordre, it.libelle,
                it.type_reponse, it.poids, it.choice_set_id,
                cs.code AS choice_set_code, cs.libelle AS choice_set_libelle
         FROM observation_items it
         LEFT JOIN observation_choice_sets cs ON cs.id = it.choice_set_id
         ORDER BY it.section_id, it.ordre"
    )->fetchAll(PDO::FETCH_ASSOC);

    // Tous les choix
    $allChoices = $pdo->query(
        "SELECT id, choice_set_id, ordre, code, libelle, valeur
         FROM observation_choices ORDER BY choice_set_id, ordre"
    )->fetchAll(PDO::FETCH_ASSOC);

    // Index choix par choice_set_id
    $choicesBySet = [];
    foreach ($allChoices as $c) {
        $choicesBySet[$c['choice_set_id']][] = $c;
    }

    // Réponses existantes indexées par item_id
    $responses = [];
    if ($inspectionId !== null) {
        $stmt = $pdo->prepare(
            "SELECT item_id, choice_id, valeur_bool, valeur_num, valeur_texte, commentaire
             FROM observation_responses WHERE inspection_id = ?"
        );
        $stmt->execute([$inspectionId]);
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $responses[(int)$r['item_id']] = $r;
        }
    }

    // Items indexés par section_id
    $itemsBySection = [];
    foreach ($items as $item) {
        $item['choices']  = $choicesBySet[$item['choice_set_id']] ?? [];
        $item['response'] = $responses[(int)$item['id']] ?? null;
        $itemsBySection[(int)$item['section_id']][] = $item;
    }

    // Résultat final
    $result = [];
    foreach ($sections as $section) {
        $section['items'] = $itemsBySection[(int)$section['id']] ?? [];
        $result[] = $section;
    }

    return $result;
}

/**
 * Enregistre (ou remplace) les réponses d'observation pour une inspection.
 * Les réponses vides (tout à null) sont ignorées.
 */
function saveObservationResponses(PDO $pdo, int $inspectionId, array $responses): void
{
    // Supprimer les anciennes réponses
    $pdo->prepare("DELETE FROM observation_responses WHERE inspection_id = ?")
        ->execute([$inspectionId]);

    $stmt = $pdo->prepare(
        "INSERT INTO observation_responses
            (inspection_id, item_id, choice_id, valeur_bool, valeur_num, valeur_texte, commentaire)
         VALUES (?, ?, ?, ?, ?, ?, ?)"
    );

    foreach ($responses as $r) {
        $itemId = isset($r['item_id']) ? (int)$r['item_id'] : 0;
        if ($itemId <= 0) continue;

        $choiceId    = isset($r['choice_id'])    && $r['choice_id']    !== null && $r['choice_id']    !== '' ? (int)$r['choice_id']      : null;
        $valeurBool  = isset($r['valeur_bool'])  && $r['valeur_bool']  !== null && $r['valeur_bool']  !== '' ? (int)$r['valeur_bool']    : null;
        $valeurNum   = isset($r['valeur_num'])   && $r['valeur_num']   !== null && $r['valeur_num']   !== '' ? (float)$r['valeur_num']   : null;
        $valeurTexte = isset($r['valeur_texte']) && $r['valeur_texte'] !== null && $r['valeur_texte'] !== '' ? (string)$r['valeur_texte'] : null;
        $commentaire = isset($r['commentaire'])  && $r['commentaire']  !== null && $r['commentaire']  !== '' ? (string)$r['commentaire']  : null;

        // Ignorer les lignes entièrement vides
        if ($choiceId === null && $valeurBool === null && $valeurNum === null && $valeurTexte === null && $commentaire === null) {
            continue;
        }

        $stmt->execute([$inspectionId, $itemId, $choiceId, $valeurBool, $valeurNum, $valeurTexte, $commentaire]);
    }
}
