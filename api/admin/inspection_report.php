<?php
/**
 * /api/admin/inspection_report.php
 * Retourne en JSON toutes les données d'une inspection :
 *   - infos visite + enseignant
 *
 * GET ?id=X
 * Accès réservé aux administrateurs connectés.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once __DIR__ . '/../auth/db.php';

session_name('TAFTICHE_SESSION');
session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'httponly' => true, 'samesite' => 'Strict']);
session_start();

if (empty($_SESSION['user']) || ($_SESSION['user']['role'] ?? '') !== 'admin') {
    authJsonResponse(false, 'غير مصرح لك', 403);
}

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if ($id <= 0) {
    authJsonResponse(false, 'معرّف غير صالح', 400);
}

/**
 * Construit le catalogue d'observation (sections -> items -> choix) et
 * intègre les réponses enregistrées pour l'inspection fournie.
 */
function buildObservationCatalogue(PDO $pdo, int $inspectionId): array
{
    $sections = $pdo->query(
        "SELECT id, ordre, titre FROM observation_sections ORDER BY ordre"
    )->fetchAll(PDO::FETCH_ASSOC);

    $items = $pdo->query(
        "SELECT it.id, it.section_id, it.ordre, it.libelle,
                it.type_reponse, it.poids, it.choice_set_id,
                cs.code AS choice_set_code, cs.libelle AS choice_set_libelle
         FROM observation_items it
         LEFT JOIN observation_choice_sets cs ON cs.id = it.choice_set_id
         ORDER BY it.section_id, it.ordre"
    )->fetchAll(PDO::FETCH_ASSOC);

    $allChoices = $pdo->query(
        "SELECT id, choice_set_id, ordre, code, libelle, valeur
         FROM observation_choices ORDER BY choice_set_id, ordre"
    )->fetchAll(PDO::FETCH_ASSOC);

    $choicesBySet = [];
    foreach ($allChoices as $choice) {
        $choicesBySet[$choice['choice_set_id']][] = $choice;
    }

    $responses = [];
    $stmt = $pdo->prepare(
        "SELECT item_id, choice_id, valeur_bool, valeur_num, valeur_texte, commentaire
         FROM observation_responses WHERE inspection_id = ?"
    );
    $stmt->execute([$inspectionId]);
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $response) {
        $responses[(int)$response['item_id']] = $response;
    }

    $itemsBySection = [];
    foreach ($items as $item) {
        $item['choices'] = $choicesBySet[$item['choice_set_id']] ?? [];
        $item['response'] = $responses[(int)$item['id']] ?? null;
        $itemsBySection[(int)$item['section_id']][] = $item;
    }

    $result = [];
    foreach ($sections as $section) {
        $section['items'] = $itemsBySection[(int)$section['id']] ?? [];
        $result[] = $section;
    }

    return $result;
}

/**
 * Retourne les évaluations d'une inspection avec leurs sections et items.
 */
function buildEvaluations(PDO $pdo, int $inspectionId): array
{
    $stmt = $pdo->prepare(
        "SELECT id, titre, note_finale, created_at
         FROM evaluations
         WHERE inspection_id = ?
         ORDER BY created_at ASC, id ASC"
    );
    $stmt->execute([$inspectionId]);
    $evaluations = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($evaluations as &$eval) {
        $secStmt = $pdo->prepare(
            "SELECT id, ordre, titre, contenu
             FROM evaluation_sections
             WHERE evaluation_id = ?
             ORDER BY ordre, id"
        );
        $secStmt->execute([(int)$eval['id']]);
        $sections = $secStmt->fetchAll(PDO::FETCH_ASSOC);

        $sectionIds = array_column($sections, 'id');
        if (!empty($sectionIds)) {
            $inP     = implode(',', array_fill(0, count($sectionIds), '?'));
            $subStmt = $pdo->prepare(
                "SELECT id, section_id, ordre, type, contenu
                 FROM evaluation_subsections
                 WHERE section_id IN ($inP)
                 ORDER BY section_id, ordre, id"
            );
            $subStmt->execute($sectionIds);
            $allSubs = $subStmt->fetchAll(PDO::FETCH_ASSOC);

            $subsBySec = [];
            $subIds    = [];
            foreach ($allSubs as $sub) {
                $subsBySec[(int)$sub['section_id']][] = $sub;
                $subIds[] = (int)$sub['id'];
            }

            $itemsBySubsec = [];
            if (!empty($subIds)) {
                $inP2    = implode(',', array_fill(0, count($subIds), '?'));
                $itmStmt = $pdo->prepare(
                    "SELECT subsection_id, item
                     FROM evaluation_items
                     WHERE subsection_id IN ($inP2)
                     ORDER BY subsection_id, ordre, id"
                );
                $itmStmt->execute($subIds);
                foreach ($itmStmt->fetchAll(PDO::FETCH_ASSOC) as $itm) {
                    $itemsBySubsec[(int)$itm['subsection_id']][] = $itm['item'];
                }
            }

            foreach ($sections as &$sec) {
                $subs = $subsBySec[(int)$sec['id']] ?? [];
                foreach ($subs as &$s) {
                    $s['items'] = $itemsBySubsec[(int)$s['id']] ?? [];
                }
                unset($s);
                $sec['subsections'] = $subs;
            }
            unset($sec);
        } else {
            foreach ($sections as &$sec) {
                $sec['subsections'] = [];
            }
            unset($sec);
        }
        $eval['sections'] = $sections;
    }
    unset($eval);

    return $evaluations;
}

try {
    $pdo = getAuthConnection();

    // ── Inspection + teacher ─────────────────────────────────────────────
    $stmt = $pdo->prepare(
        "SELECT i.id,
                i.inspector_name,
                i.inspection_date,
                i.heure_visite,
                i.duree_visite,
                i.school_name,
                i.subject,
                i.created_at,
                p.first_name,
                p.family_name,
                p.maiden_name,
                p.gender,
                p.birth_date,
                p.birth_place,
                p.residence,
                p.phone,
                p.email,
                p.district,
                p.school_year,
                p.years_worked,
                p.job_rank,
                p.status        AS teacher_status,
                p.echelon,
                p.grade,
                p.execution_date,
                p.school_entry_date,
                p.diploma,
                p.first_appointment_date,
                p.current_year_class,
                p.previous_year_class,
                p.student_count,
                p.haraka,
                p.marital_status,
                p.spouse_name,
                p.children_count,
                p.tech_institute_grad_year,
                p.university_grad_year
         FROM inspections i
         LEFT JOIN personal_info p ON p.id = i.personal_info_id
         WHERE i.id = ?"
    );
    $stmt->execute([$id]);
    $ins = $stmt->fetch();

    if (!$ins) {
        authJsonResponse(false, 'زيارة التفتيش غير موجودة', 404);
    }

    authJsonResponse(true, 'ok', 200, [
        'inspection'   => $ins,
        'catalogue'    => buildObservationCatalogue($pdo, $id),
        'evaluations'  => buildEvaluations($pdo, $id),
    ]);


} catch (Throwable $e) {
    error_log('inspection_report.php error: ' . $e->getMessage());
    authJsonResponse(false, 'خطأ في الخادم', 500);
}
