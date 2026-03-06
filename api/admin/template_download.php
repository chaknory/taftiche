<?php
/**
 * /api/admin/template_download.php
 * Génère et télécharge un fichier xlsx de modèle pour l'importation en masse.
 * Utilise ZipArchive (natif PHP) pour créer le fichier xlsx (format OOXML).
 */

require_once __DIR__ . '/../auth/db.php';

session_name('TAFTICHE_SESSION');
session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'httponly' => true, 'samesite' => 'Strict']);
session_start();

if (empty($_SESSION['user']) || ($_SESSION['user']['role'] ?? '') !== 'admin') {
    http_response_code(403);
    exit('غير مصرح لك');
}

// ── En-têtes des colonnes ─────────────────────────────────────────────────
$headers = [
    'المقاطعة',
    'العام الدراسي',
    'اسم المؤسسة',
    'سنوات العمل',
    'الجنس',
    'الاسم الشخصي',
    'الاسم العائلي',
    'الاسم الأصلي للمتزوجة',
    'تاريخ الازدياد',
    'مكان الازدياد',
    'الإقامة',
    'الوضعية العائلية',
    'عدد الأبناء',
    'رقم الهاتف',
    'البريد الإلكتروني',
    'العنوان',
    'تاريخ التعيين بالمدرسة',
    'الشهادة',
    'تاريخ التعيين الأول',
    'الرتبة',
    'الوضعية الإدارية',
    'السلم',
    'الدرجة',
    'تاريخ السريان',
    'تاريخ التفتيش قبل الأخير',
    'علامة التفتيش قبل الأخير',
    'تاريخ آخر تفتيش',
    'علامة آخر تفتيش',
    'فصل السنة الماضية',
    'عدد التلاميذ',
    'فصل السنة الحالية',
    'حركة',
    'سنة تخرج المعهد التقني',
    'سنة آخر شهادة جامعية',
];

// ── Commentaires/exemples (ligne 2) ──────────────────────────────────────
$examples = [
    '11',
    '2025 / 2026',
    'ابتدائية الشهيد علي',
    '15',
    'أنثى',
    'فاطمة',
    'بوعلام',
    'حداد',
    '01/05/1985',
    'وهران',
    'وهران',
    'متزوج',
    '2',
    '0551234567',
    'fatima.boualem@example.com',
    'شارع النصر، وهران',
    '01/09/2010',
    'ليسانس تعليم ابتدائي',
    '01/09/2009',
    'أستاذ مدرسة ابتدائية',
    'أستاذ',
    '7',
    '3',
    '01/01/2023',
    '15/03/2020',
    '14',
    '10/11/2023',
    '16',
    'السنة الثالثة',
    '28',
    'السنة الثالثة',
    'لا',
    '',
    '',
];

// ── Helper: nom de colonne Excel (0→A, 25→Z, 26→AA…) ─────────────────────
function colName(int $n): string {
    $s = '';
    do {
        $s = chr($n % 26 + 65) . $s;
        $n = intdiv($n, 26) - 1;
    } while ($n >= 0);
    return $s;
}

function xmlStr(string $s): string {
    return htmlspecialchars($s, ENT_XML1, 'UTF-8');
}

// ── Shared strings: headers + examples ───────────────────────────────────
$allStrings = array_merge($headers, $examples);
$strIndex = [];
$ssItems  = '';
$ssIdx    = 0;

foreach ($allStrings as $str) {
    if (!isset($strIndex[$str])) {
        $strIndex[$str] = $ssIdx++;
        $ssItems .= '<si><t xml:space="preserve">' . xmlStr($str) . '</t></si>';
    }
}

$sharedStrings = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    . '<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"'
    . ' count="' . count($allStrings) . '" uniqueCount="' . $ssIdx . '">'
    . $ssItems . '</sst>';

// ── Feuille de calcul ─────────────────────────────────────────────────────
// Ligne 1 : en-têtes (fond coloré via style 1)
$row1Cells = '';
foreach ($headers as $i => $h) {
    $col = colName($i);
    $row1Cells .= '<c r="' . $col . '1" t="s" s="1"><v>' . $strIndex[$h] . '</v></c>';
}

// Ligne 2 : exemples (style normal)
$row2Cells = '';
foreach ($examples as $i => $ex) {
    if ($ex === '') continue;
    $col = colName($i);
    $row2Cells .= '<c r="' . $col . '2" t="s"><v>' . $strIndex[$ex] . '</v></c>';
}

// Largeurs de colonnes
$colDefs = '';
foreach ($headers as $i => $_) {
    $w = in_array($i, [1, 8, 16, 18, 23, 24, 26, 29]) ? 18 : 14;
    $colDefs .= '<col min="' . ($i+1) . '" max="' . ($i+1) . '" width="' . $w . '" customWidth="1"/>';
}

$sheet = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    . '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"'
    . ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
    . '<sheetViews><sheetView workbookViewId="0" rightToLeft="1"/></sheetViews>'
    . '<cols>' . $colDefs . '</cols>'
    . '<sheetData>'
    . '<row r="1">' . $row1Cells . '</row>'
    . '<row r="2">' . $row2Cells . '</row>'
    . '</sheetData></worksheet>';

// ── Styles (en-tête en gras + fond bleu foncé + texte blanc) ─────────────
$styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    . '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
    . '<fonts count="2">'
    . '<font><sz val="10"/><name val="Calibri"/></font>'
    . '<font><b/><color rgb="FFFFFFFF"/><sz val="10"/><name val="Calibri"/></font>'
    . '</fonts>'
    . '<fills count="3">'
    . '<fill><patternFill patternType="none"/></fill>'
    . '<fill><patternFill patternType="gray125"/></fill>'
    . '<fill><patternFill patternType="solid"><fgColor rgb="FF1F5A8C"/></patternFill></fill>'
    . '</fills>'
    . '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'
    . '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
    . '<cellXfs count="2">'
    . '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
    . '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"><alignment horizontal="center" wrapText="1"/></xf>'
    . '</cellXfs>'
    . '</styleSheet>';

// ── Fichiers XML fixes ────────────────────────────────────────────────────
$contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    . '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    . '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    . '<Default Extension="xml" ContentType="application/xml"/>'
    . '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
    . '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
    . '<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>'
    . '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
    . '</Types>';

$rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    . '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    . '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
    . '</Relationships>';

$workbook = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    . '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"'
    . ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
    . '<sheets><sheet name="البطاقات" sheetId="1" r:id="rId1"/></sheets>'
    . '</workbook>';

$workbookRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    . '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    . '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
    . '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>'
    . '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
    . '</Relationships>';

// ── Assemblage du zip ────────────────────────────────────────────────────
$tmpFile = tempnam(sys_get_temp_dir(), 'tpl_xlsx_');
$zip = new ZipArchive();
if ($zip->open($tmpFile, ZipArchive::OVERWRITE) !== true) {
    http_response_code(500);
    exit('Erreur lors de la création du fichier xlsx');
}

$zip->addFromString('[Content_Types].xml',          $contentTypes);
$zip->addFromString('_rels/.rels',                  $rels);
$zip->addFromString('xl/workbook.xml',              $workbook);
$zip->addFromString('xl/_rels/workbook.xml.rels',   $workbookRels);
$zip->addFromString('xl/sharedStrings.xml',         $sharedStrings);
$zip->addFromString('xl/styles.xml',                $styles);
$zip->addFromString('xl/worksheets/sheet1.xml',     $sheet);
$zip->close();

// ── Envoi du fichier ──────────────────────────────────────────────────────
header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
header('Content-Disposition: attachment; filename="users_template_ar_v2.xlsx"');
header('Content-Length: ' . filesize($tmpFile));
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');

readfile($tmpFile);
unlink($tmpFile);
exit;
