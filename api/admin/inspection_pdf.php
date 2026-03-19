<?php
/**
 * /api/admin/inspection_pdf.php
 * Génère un rapport HTML imprimable (PDF via navigateur) pour une inspection donnée.
 *
 * GET ?id=X → retourne une page HTML complète avec :
 *   - informations de la visite d'inspection (+ enseignant)
 *
 * Accès réservé aux administrateurs connectés.
 */

require_once __DIR__ . '/../auth/db.php';

session_name('TAFTICHE_SESSION');
session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'httponly' => true, 'samesite' => 'Strict']);
session_start();

if (empty($_SESSION['user']) || ($_SESSION['user']['role'] ?? '') !== 'admin') {
    http_response_code(403);
    exit('غير مصرح لك');
}

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if ($id <= 0) {
    http_response_code(400);
    exit('معرّف غير صالح');
}

try {
    $pdo = getAuthConnection();

    // ── Inspection + teacher info ─────────────────────────────────────────
    $stmt = $pdo->prepare(
        "SELECT i.id,
                i.inspector_name,
                i.inspection_date,
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
                p.current_year_class,
                p.student_count,
                p.diploma
         FROM inspections i
         LEFT JOIN personal_info p ON p.id = i.personal_info_id
         WHERE i.id = ?"
    );
    $stmt->execute([$id]);
    $ins = $stmt->fetch();

    if (!$ins) {
        http_response_code(404);
        exit('زيارة التفتيش غير موجودة');
    }

} catch (Throwable $e) {
    error_log('inspection_pdf.php error: ' . $e->getMessage());
    http_response_code(500);
    exit('خطأ في الخادم');
}

// ── Helpers ───────────────────────────────────────────────────────────────
function h(mixed $v): string {
    return htmlspecialchars((string)($v ?? ''), ENT_QUOTES | ENT_HTML5, 'UTF-8');
}

function fmtDate(?string $d): string {
    if (!$d) return '–';
    $ts = strtotime($d);
    if (!$ts) return h($d);
    return date('d/m/Y', $ts);
}

function val(?string $v, string $fallback = '–'): string {
    $t = trim((string)($v ?? ''));
    return $t !== '' ? h($t) : $fallback;
}

/**
 * Construit les sections/items d'observation avec réponses pour une inspection.
 */
function getObservationCatalogue(PDO $pdo, int $inspectionId): array {
    $sections = $pdo->query(
        "SELECT id, ordre, titre FROM observation_sections ORDER BY ordre"
    )->fetchAll(PDO::FETCH_ASSOC);

    $items = $pdo->query(
        "SELECT it.id, it.section_id, it.ordre, it.libelle,
                it.type_reponse, it.choice_set_id
         FROM observation_items it
         ORDER BY it.section_id, it.ordre"
    )->fetchAll(PDO::FETCH_ASSOC);

    $allChoices = $pdo->query(
        "SELECT id, choice_set_id, code, libelle
         FROM observation_choices ORDER BY choice_set_id, ordre"
    )->fetchAll(PDO::FETCH_ASSOC);

    $choicesBySet = [];
    foreach ($allChoices as $choice) {
        $choicesBySet[$choice['choice_set_id']][] = $choice;
    }

    $respStmt = $pdo->prepare(
        "SELECT item_id, choice_id, valeur_bool, valeur_num, valeur_texte, commentaire
         FROM observation_responses WHERE inspection_id = ?"
    );
    $respStmt->execute([$inspectionId]);
    $responses = [];
    foreach ($respStmt->fetchAll(PDO::FETCH_ASSOC) as $response) {
        $responses[(int)$response['item_id']] = $response;
    }

    $itemsBySection = [];
    foreach ($items as $item) {
        $item['choices'] = $choicesBySet[$item['choice_set_id']] ?? [];
        $item['response'] = $responses[(int)$item['id']] ?? null;
        $itemsBySection[(int)$item['section_id']][] = $item;
    }

    $catalogue = [];
    foreach ($sections as $section) {
        $section['items'] = $itemsBySection[(int)$section['id']] ?? [];
        $catalogue[] = $section;
    }

    return $catalogue;
}

function getObservationValue(array $item): string {
    $response = $item['response'] ?? null;
    if (!$response || !is_array($response)) return '';

    $type = $item['type_reponse'] ?? '';
    if ($type === 'choix') {
        foreach (($item['choices'] ?? []) as $choice) {
            if ((string)($choice['id'] ?? '') === (string)($response['choice_id'] ?? '')) {
                return trim((string)($choice['libelle'] ?? ''));
            }
        }
        return '';
    }

    if ($type === 'texte') {
        return trim((string)($response['valeur_texte'] ?? ''));
    }

    if ($type === 'bool') {
        if (!isset($response['valeur_bool']) || $response['valeur_bool'] === '') return '';
        return ((int)$response['valeur_bool'] === 1) ? 'نعم' : 'لا';
    }

    if ($type === 'note') {
        return isset($response['valeur_num']) && $response['valeur_num'] !== ''
            ? trim((string)$response['valeur_num'])
            : '';
    }

    return '';
}

$teacherName = trim(($ins['family_name'] ?? '') . ' ' . ($ins['first_name'] ?? ''));
if ($teacherName === '') $teacherName = '–';

$observationCatalogue = [];
try {
    $observationCatalogue = getObservationCatalogue($pdo, $id);
} catch (Throwable $e) {
    error_log('inspection_pdf.php observations error: ' . $e->getMessage());
}

header('Content-Type: text/html; charset=UTF-8');
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تقرير زيارة التفتيش – <?= h($teacherName) ?></title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: 'Cairo', 'Arial', sans-serif;
            font-size: 13px;
            color: #1a1a1a;
            background: #f5f7fa;
            padding: 20px;
            direction: rtl;
        }

        .report-page {
            max-width: 900px;
            margin: 0 auto;
            background: #fff;
            border-radius: 10px;
            box-shadow: 0 2px 16px rgba(0,0,0,.1);
            overflow: hidden;
        }

        /* ── Header ── */
        .report-header {
            background: linear-gradient(135deg, #1a3a5c 0%, #2d6697 100%);
            color: #fff;
            padding: 28px 32px 22px;
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .report-header .logo-wrap {
            width: 64px;
            height: 64px;
            background: rgba(255,255,255,.15);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            flex-shrink: 0;
        }

        .report-header .header-text h1 {
            font-size: 1.15rem;
            font-weight: 700;
            line-height: 1.4;
        }

        .report-header .header-text p {
            font-size: .8rem;
            opacity: .8;
            margin-top: 3px;
        }

        .report-header .date-badge {
            margin-right: auto;
            margin-left: 0;
            background: rgba(255,255,255,.15);
            border-radius: 8px;
            padding: 8px 14px;
            font-size: .78rem;
            text-align: center;
            line-height: 1.6;
        }

        /* ── Body ── */
        .report-body {
            padding: 24px 32px 32px;
        }

        /* ── Section ── */
        .section {
            margin-bottom: 24px;
        }

        .section-title {
            font-size: .95rem;
            font-weight: 700;
            color: #1a3a5c;
            border-bottom: 2px solid #2d6697;
            padding-bottom: 6px;
            margin-bottom: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .section-title .icon {
            font-size: 1.1rem;
        }

        /* ── Grid de champs ── */
        .fields-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px 16px;
        }

        .fields-grid.cols-2 {
            grid-template-columns: repeat(2, 1fr);
        }

        .field-item {
            background: #f8fafd;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 8px 12px;
        }

        .field-label {
            font-size: .72rem;
            color: #64748b;
            font-weight: 600;
            margin-bottom: 3px;
            text-transform: uppercase;
            letter-spacing: .02em;
        }

        .field-value {
            font-size: .88rem;
            color: #1e293b;
            font-weight: 600;
        }

        /* ── Score badge ── */
        .score-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 54px;
            height: 54px;
            border-radius: 50%;
            background: #1a3a5c;
            color: #fff;
            font-size: 1.3rem;
            font-weight: 700;
            box-shadow: 0 2px 8px rgba(26,58,92,.3);
        }

        .score-wrap {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .score-label {
            font-size: .82rem;
            color: #64748b;
        }

        /* ── Text fields (long) ── */
        .text-field {
            background: #f8fafd;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 10px 14px;
            margin-bottom: 10px;
        }

        .text-field .field-label {
            margin-bottom: 6px;
        }

        .text-field .field-value {
            font-weight: 400;
            font-size: .88rem;
            white-space: pre-wrap;
            line-height: 1.7;
        }

        /* ── Observations ── */
        .obs-section-block {
            margin-top: 10px;
            border: 1px solid #d8dee8;
            border-radius: 6px;
            overflow: hidden;
        }

        .obs-section-title {
            background: #eef1f6;
            color: #1a3a5c;
            padding: 8px 12px;
            font-weight: 700;
            font-size: .84rem;
            border-bottom: 1px solid #d8dee8;
        }

        .obs-item {
            padding: 8px 12px;
            border-bottom: 1px solid #edf2f7;
            font-size: .84rem;
            line-height: 1.7;
            color: #1e293b;
        }

        .obs-item:last-child {
            border-bottom: none;
        }

        .obs-label {
            color: #1a3a5c;
            font-weight: 700;
        }

        .obs-comment {
            margin-top: 4px;
            color: #475569;
            font-size: .8rem;
        }

        .obs-inline {
            padding: 8px 12px;
            font-size: .84rem;
            line-height: 1.9;
            color: #1e293b;
        }

        .obs-inline .sep {
            color: #94a3b8;
            margin: 0 6px;
        }

        /* ── Empty states ── */
        .empty-box {
            text-align: center;
            padding: 20px;
            color: #94a3b8;
            font-style: italic;
            background: #f8fafd;
            border: 1px dashed #cbd5e1;
            border-radius: 8px;
        }

        /* ── Footer ── */
        .report-footer {
            border-top: 1px solid #e2e8f0;
            padding: 14px 32px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: .75rem;
            color: #94a3b8;
        }

        /* ── Print button ── */
        .print-toolbar {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            padding: 14px 32px 0;
        }

        .btn-print {
            background: #1a3a5c;
            color: #fff;
            border: none;
            border-radius: 6px;
            padding: 8px 20px;
            font-family: 'Cairo', sans-serif;
            font-size: .88rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .btn-print:hover { background: #2d6697; }

        .btn-close {
            background: #64748b;
            color: #fff;
            border: none;
            border-radius: 6px;
            padding: 8px 16px;
            font-family: 'Cairo', sans-serif;
            font-size: .88rem;
            cursor: pointer;
        }

        .btn-close:hover { background: #475569; }

        /* ── Print styles ── */
        @media print {
            body { background: #fff; padding: 0; font-size: 12px; }
            .report-page { box-shadow: none; border-radius: 0; max-width: 100%; }
            .print-toolbar { display: none !important; }
            .report-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .obs-table th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .section { page-break-inside: avoid; }
        }
    </style>
</head>
<body>

<div class="print-toolbar">
    <button class="btn-close" onclick="window.close()">✕ إغلاق</button>
    <button class="btn-print" onclick="window.print()">🖨️ طباعة / حفظ PDF</button>
</div>

<div class="report-page">

    <!-- ── Header ── -->
    <div class="report-header">
        <div class="logo-wrap">🏫</div>
        <div class="header-text">
            <h1>تقرير زيارة التفتيش</h1>
            <p>مديرية التربية – بسكرة</p>
        </div>
        <div class="date-badge">
            <div style="font-weight:700;font-size:.9rem"><?= h($teacherName) ?></div>
            <div style="opacity:.85;margin-top:2px">تاريخ الزيارة: <?= fmtDate($ins['inspection_date']) ?></div>
        </div>
    </div>

    <div class="report-body">

        <!-- ── 1. Inspection Info ── -->
        <div class="section">
            <div class="section-title"><span class="icon">📋</span> معلومات الزيارة</div>
            <div class="fields-grid">
                <div class="field-item">
                    <div class="field-label">المفتش</div>
                    <div class="field-value"><?= val($ins['inspector_name']) ?></div>
                </div>
                <div class="field-item">
                    <div class="field-label">تاريخ الزيارة</div>
                    <div class="field-value"><?= fmtDate($ins['inspection_date']) ?></div>
                </div>
                <div class="field-item">
                    <div class="field-label">المدرسة</div>
                    <div class="field-value"><?= val($ins['school_name']) ?></div>
                </div>
                <div class="field-item">
                    <div class="field-label">المادة</div>
                    <div class="field-value"><?= val($ins['subject']) ?></div>
                </div>
                <div class="field-item">
                    <div class="field-label">تاريخ الإنشاء</div>
                    <div class="field-value"><?= fmtDate($ins['created_at']) ?></div>
                </div>
            </div>
        </div>

        <!-- ── 2. Teacher Info ── -->
        <?php if ($ins['first_name'] || $ins['family_name']): ?>
        <div class="section">
            <div class="section-title"><span class="icon">👤</span> معلومات الأستاذ / الأستاذة</div>
            <div class="fields-grid">
                <div class="field-item">
                    <div class="field-label">الاسم الكامل</div>
                    <div class="field-value"><?= h($teacherName) ?></div>
                </div>
                <?php if ($ins['maiden_name']): ?>
                <div class="field-item">
                    <div class="field-label">اللقب الأصلي</div>
                    <div class="field-value"><?= val($ins['maiden_name']) ?></div>
                </div>
                <?php endif; ?>
                <div class="field-item">
                    <div class="field-label">الجنس</div>
                    <div class="field-value"><?= val($ins['gender']) ?></div>
                </div>
                <div class="field-item">
                    <div class="field-label">تاريخ الميلاد</div>
                    <div class="field-value"><?= fmtDate($ins['birth_date']) ?></div>
                </div>
                <div class="field-item">
                    <div class="field-label">مكان الميلاد</div>
                    <div class="field-value"><?= val($ins['birth_place']) ?></div>
                </div>
                <div class="field-item">
                    <div class="field-label">مكان الإقامة</div>
                    <div class="field-value"><?= val($ins['residence']) ?></div>
                </div>
                <div class="field-item">
                    <div class="field-label">الرقم الهاتفي</div>
                    <div class="field-value" style="direction:ltr;text-align:right"><?= val($ins['phone']) ?></div>
                </div>
                <div class="field-item">
                    <div class="field-label">البريد الإلكتروني</div>
                    <div class="field-value" style="direction:ltr;text-align:right;font-size:.8rem"><?= val($ins['email']) ?></div>
                </div>
                <div class="field-item">
                    <div class="field-label">المقاطعة</div>
                    <div class="field-value"><?= val($ins['district']) ?></div>
                </div>
                <div class="field-item">
                    <div class="field-label">السنة الدراسية</div>
                    <div class="field-value"><?= val($ins['school_year']) ?></div>
                </div>
                <div class="field-item">
                    <div class="field-label">سنوات العمل</div>
                    <div class="field-value"><?= val($ins['years_worked']) ?></div>
                </div>
                <div class="field-item">
                    <div class="field-label">الرتبة</div>
                    <div class="field-value"><?= val($ins['job_rank']) ?></div>
                </div>
                <div class="field-item">
                    <div class="field-label">الصفة</div>
                    <div class="field-value"><?= val($ins['teacher_status']) ?></div>
                </div>
                <div class="field-item">
                    <div class="field-label">السلم / الدرجة</div>
                    <div class="field-value"><?= val($ins['echelon']) ?><?= $ins['echelon'] && $ins['grade'] ? ' / ' . val($ins['grade']) : val($ins['grade']) ?></div>
                </div>
                <div class="field-item">
                    <div class="field-label">القسم الحالي</div>
                    <div class="field-value"><?= val($ins['current_year_class']) ?></div>
                </div>
                <div class="field-item">
                    <div class="field-label">عدد التلاميذ</div>
                    <div class="field-value"><?= val($ins['student_count']) ?></div>
                </div>
                <div class="field-item">
                    <div class="field-label">الشهادة</div>
                    <div class="field-value"><?= val($ins['diploma']) ?></div>
                </div>
            </div>
        </div>
        <?php endif; ?>

        <!-- ── 3. Observations ── -->
        <div class="section">
            <div class="section-title"><span class="icon">📝</span> الملاحظات المرتبطة بالتفتيش</div>

            <?php
            $hasObservationRows = false;
            foreach ($observationCatalogue as $section):
                $sectionRows = [];
                foreach (($section['items'] ?? []) as $item):
                    $value = getObservationValue($item);
                    $comment = trim((string)(($item['response']['commentaire'] ?? '')));
                    if ($value === '' && $comment === '') continue;

                    $choiceCodes = array_map(
                        static fn(array $choice): string => strtoupper((string)($choice['code'] ?? '')),
                        $item['choices'] ?? []
                    );
                    $uniqueCodes = array_values(array_unique(array_filter($choiceCodes)));
                    $isYesNo = in_array('OUI', $uniqueCodes, true) && in_array('NON', $uniqueCodes, true) && count($uniqueCodes) <= 2;

                    $sectionRows[] = [
                        'label' => (string)($item['libelle'] ?? ''),
                        'value' => $value,
                        'comment' => $comment,
                        'is_yes_no' => $isYesNo,
                    ];
                endforeach;

                if (empty($sectionRows)) continue;
                $hasObservationRows = true;

                $allYesNoNoComment = true;
                foreach ($sectionRows as $row) {
                    if (!$row['is_yes_no'] || $row['comment'] !== '') {
                        $allYesNoNoComment = false;
                        break;
                    }
                }
            ?>
                <div class="obs-section-block">
                    <div class="obs-section-title"><?= h($section['titre'] ?? '') ?></div>

                    <?php if ($allYesNoNoComment): ?>
                        <div class="obs-inline">
                            <?php foreach ($sectionRows as $idx => $row): ?>
                                <span><span class="obs-label"><?= h($row['label']) ?></span>: <?= h($row['value']) ?></span><?php if ($idx < count($sectionRows) - 1): ?><span class="sep">|</span><?php endif; ?>
                            <?php endforeach; ?>
                        </div>
                    <?php else: ?>
                        <?php foreach ($sectionRows as $row): ?>
                            <div class="obs-item">
                                <div><span class="obs-label"><?= h($row['label']) ?></span>: <?= h($row['value']) ?></div>
                                <?php if ($row['comment'] !== ''): ?>
                                    <div class="obs-comment">ملاحظة: <?= h($row['comment']) ?></div>
                                <?php endif; ?>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
            <?php endforeach; ?>

            <?php if (!$hasObservationRows): ?>
                <div class="empty-box">لا توجد ملاحظات مسجلة لهذه الزيارة</div>
            <?php endif; ?>
        </div>

        <!-- ── 4. Évaluations ── -->
        <?php
        $evaluations = [];
        try {
            $evalStmt = $pdo->prepare(
                "SELECT e.id, e.titre, e.note_finale, e.created_at
                 FROM evaluations e
                 WHERE e.inspection_id = ?
                 ORDER BY e.created_at ASC"
            );
            $evalStmt->execute([$id]);
            $evaluations = $evalStmt->fetchAll();
        } catch (Throwable $e2) {
            error_log('inspection_pdf.php evaluations error: ' . $e2->getMessage());
        }

        if (!empty($evaluations)):
        ?>
        <div class="section">
            <div class="section-title"><span class="icon">📊</span> التقييمات</div>

            <?php foreach ($evaluations as $eval): ?>
            <?php
            $evalSections = [];
            try {
                $secStmt = $pdo->prepare(
                    "SELECT s.id, s.ordre, s.titre, s.contenu
                     FROM evaluation_sections s
                     WHERE s.evaluation_id = ?
                     ORDER BY s.ordre, s.id"
                );
                $secStmt->execute([(int)$eval['id']]);
                $evalSections = $secStmt->fetchAll();

                if (!empty($evalSections)) {
                    $secIds = array_column($evalSections, 'id');
                    $inP    = implode(',', array_fill(0, count($secIds), '?'));

                    $subStmt = $pdo->prepare(
                        "SELECT id, section_id, ordre, type, contenu
                         FROM evaluation_subsections
                         WHERE section_id IN ($inP)
                         ORDER BY section_id, ordre, id"
                    );
                    $subStmt->execute($secIds);
                    $allSubs = $subStmt->fetchAll();

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
                        foreach ($itmStmt->fetchAll() as $itm) {
                            $itemsBySubsec[(int)$itm['subsection_id']][] = $itm;
                        }
                    }

                    foreach ($evalSections as &$sec) {
                        $subs = $subsBySec[(int)$sec['id']] ?? [];
                        foreach ($subs as &$s) {
                            $s['items'] = $itemsBySubsec[(int)$s['id']] ?? [];
                        }
                        unset($s);
                        $sec['subsections'] = $subs;
                    }
                    unset($sec);
                }
            } catch (Throwable $e3) {
                error_log('inspection_pdf.php eval sections error: ' . $e3->getMessage());
            }
            ?>
            <div style="border:1px solid #d0dae8;border-radius:8px;margin-bottom:16px;overflow:hidden">
                <!-- En-tête du rapport d'évaluation -->
                <div style="background:#1a3a5c;color:#fff;padding:10px 14px;display:flex;justify-content:space-between;align-items:center">
                    <strong style="font-size:.92rem"><?= h($eval['titre']) ?></strong>
                    <?php if ($eval['note_finale'] !== null && $eval['note_finale'] !== ''): ?>
                    <span style="background:rgba(255,255,255,.15);border-radius:20px;padding:3px 14px;font-size:.85rem;font-weight:700">
                        العلامة: <?= h((string)$eval['note_finale']) ?> / 20
                    </span>
                    <?php endif; ?>
                </div>

                <?php if (!empty($evalSections)): ?>
                <?php foreach ($evalSections as $sec): ?>
                <div class="obs-section-block" style="margin:0;border:none;border-top:1px solid #e2e8f0;border-radius:0">
                    <div class="obs-section-title" style="border-radius:0"><?= h($sec['titre']) ?></div>
                    <?php if (!empty($sec['contenu'])): ?>
                    <div class="obs-item" style="font-style:italic;color:#475569"><?= h($sec['contenu']) ?></div>
                    <?php endif; ?>
                    <?php foreach (($sec['subsections'] ?? []) as $sub): ?>
                        <?php if (!empty($sub['contenu'])): ?>
                        <div class="obs-item" style="padding-right:28px;<?= ($sub['type'] === 'texte') ? 'white-space:pre-wrap' : '' ?>"><?= h($sub['contenu']) ?></div>
                        <?php endif; ?>
                        <?php foreach (($sub['items'] ?? []) as $itm): ?>
                        <div class="obs-item" style="padding-right:36px">• <?= h($itm['item'] ?? '') ?></div>
                        <?php endforeach; ?>
                    <?php endforeach; ?>
                    <?php if (empty($sec['subsections']) && empty($sec['contenu'])): ?>
                    <div class="obs-item" style="color:#94a3b8;font-style:italic">—</div>
                    <?php endif; ?>
                </div>
                <?php endforeach; ?>
                <?php else: ?>
                <div class="obs-item" style="color:#94a3b8;font-style:italic;padding:10px 14px">لا توجد أقسام مسجلة لهذا التقييم.</div>
                <?php endif; ?>
            </div>
            <?php endforeach; ?>
        </div>
        <?php endif; ?>

    </div><!-- /.report-body -->

    <!-- ── Footer ── -->
    <div class="report-footer">
        <span>مديرية التربية – بسكرة</span>
        <span>تاريخ الطباعة: <?= date('d/m/Y H:i') ?></span>
        <span>زيارة رقم: <?= h($id) ?></span>
    </div>

</div><!-- /.report-page -->

</body>
</html>
