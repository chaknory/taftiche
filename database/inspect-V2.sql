-- =========================================================
--  Grille d'observation d'une inspection (SQLite)
--  - Référentiel paramétrique (sections, items, échelles)
--  - Réponses par inspection
--  Conforme à la capture fournie
-- =========================================================

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

------------------------------------------------------------
-- (1) TABLES DU RÉFÉRENTIEL
------------------------------------------------------------

-- Sections / Rubriques (ex: ظروف التفتيش، تحضير الدرس، إنجاز الدروس، الوثائق والوسائل)
DROP TABLE IF EXISTS observation_sections;
CREATE TABLE IF NOT EXISTS observation_sections (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  ordre     INTEGER,
  titre     TEXT NOT NULL            -- ex: 'ظروف التفتيش'
);

-- Jeux d'échelles (permet d'avoir Oui/لا/أحيانًا, Oui/لا, أو تقدير نوعي)
DROP TABLE IF EXISTS observation_choice_sets;
CREATE TABLE IF NOT EXISTS observation_choice_sets (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  code      TEXT UNIQUE NOT NULL,    -- ex: 'OUI_AH_NON'
  libelle   TEXT                     -- ex: 'نعم / أحيانًا / لا'
);

-- Choix possibles pour une échelle donnée, avec valeur numérique pour calculs
DROP TABLE IF EXISTS observation_choices;
CREATE TABLE IF NOT EXISTS observation_choices (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  choice_set_id   INTEGER NOT NULL,
  ordre           INTEGER,
  code            TEXT NOT NULL,     -- ex: 'OUI', 'AH', 'NON', 'ACC'
  libelle         TEXT NOT NULL,     -- ex: 'نعم', 'أحيانًا', 'لا', 'مقبول'
  valeur          REAL NOT NULL,     -- score numérique (pondérable)
  FOREIGN KEY (choice_set_id) REFERENCES observation_choice_sets(id) ON DELETE CASCADE
);

-- Items / Indicateurs par section
-- type_reponse: 'choix' (échelle), 'bool', 'note', 'texte'
DROP TABLE IF EXISTS observation_items;
CREATE TABLE IF NOT EXISTS observation_items (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  section_id      INTEGER NOT NULL,
  ordre           INTEGER,
  libelle         TEXT NOT NULL,         -- ex: 'الانضباط'
  type_reponse    TEXT NOT NULL DEFAULT 'choix'
                    CHECK (type_reponse IN ('choix','bool','note','texte')),
  poids           REAL DEFAULT 1.0,      -- poids pour une note pondérée
  choice_set_id   INTEGER,               -- requis si type='choix'
  FOREIGN KEY (section_id)    REFERENCES observation_sections(id) ON DELETE CASCADE,
  FOREIGN KEY (choice_set_id) REFERENCES observation_choice_sets(id) ON DELETE SET NULL
);

------------------------------------------------------------
-- (2) RÉPONSES POUR UNE INSPECTION DONNÉE
------------------------------------------------------------
-- Une (et une seule) réponse par item et par inspection
--  * type == 'choix' -> choice_id
--  * type == 'bool'  -> valeur_bool
--  * type == 'note'  -> valeur_num
--  * type == 'texte' -> valeur_texte
DROP TABLE IF EXISTS observation_responses;
CREATE TABLE IF NOT EXISTS observation_responses (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  inspection_id   INTEGER NOT NULL,
  item_id         INTEGER NOT NULL,
  choice_id       INTEGER,                          -- pour type 'choix'
  valeur_bool     INTEGER CHECK (valeur_bool IN (0,1)),
  valeur_num      REAL,
  valeur_texte    TEXT,
  commentaire     TEXT,                              -- ملاحظة إضافية لكل مؤشر
  FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id)       REFERENCES observation_items(id) ON DELETE CASCADE,
  FOREIGN KEY (choice_id)     REFERENCES observation_choices(id) ON DELETE SET NULL,
  UNIQUE (inspection_id, item_id)
);

-- Index de confort
CREATE INDEX IF NOT EXISTS idx_obs_resp_insp ON observation_responses(inspection_id);
CREATE INDEX IF NOT EXISTS idx_obs_items_section ON observation_items(section_id);

------------------------------------------------------------
-- (3) PRÉ-CHARGEMENT DES ÉCHELLES (conformes à la feuille)
------------------------------------------------------------

-- Oui / أحيانًا / لا  (valeurs 2 / 1 / 0)
INSERT INTO observation_choice_sets (code, libelle) VALUES
('OUI_AH_NON', 'نعم / أحيانًا / لا')
ON CONFLICT(code) DO NOTHING;

INSERT INTO observation_choices (choice_set_id, ordre, code, libelle, valeur)
SELECT cs.id, 1, 'OUI', 'نعم', 2 FROM observation_choice_sets cs WHERE cs.code='OUI_AH_NON';
INSERT INTO observation_choices (choice_set_id, ordre, code, libelle, valeur)
SELECT cs.id, 2, 'AH',  'أحيانًا', 1 FROM observation_choice_sets cs WHERE cs.code='OUI_AH_NON';
INSERT INTO observation_choices (choice_set_id, ordre, code, libelle, valeur)
SELECT cs.id, 3, 'NON', 'لا', 0 FROM observation_choice_sets cs WHERE cs.code='OUI_AH_NON';

-- Oui / لا (valeurs 1 / 0)
INSERT INTO observation_choice_sets (code, libelle) VALUES
('OUI_NON', 'نعم / لا')
ON CONFLICT(code) DO NOTHING;

INSERT INTO observation_choices (choice_set_id, ordre, code, libelle, valeur)
SELECT cs.id, 1, 'OUI', 'نعم', 1 FROM observation_choice_sets cs WHERE cs.code='OUI_NON';
INSERT INTO observation_choices (choice_set_id, ordre, code, libelle, valeur)
SELECT cs.id, 2, 'NON', 'لا', 0 FROM observation_choice_sets cs WHERE cs.code='OUI_NON';

-- تقدير نوعي (pour "مشاركة التلاميذ: مقبولة")
INSERT INTO observation_choice_sets (code, libelle) VALUES
('APPRECIATION5', 'ممتاز / جيد جدا / جيد / مقبول / ضعيف')
ON CONFLICT(code) DO NOTHING;

INSERT INTO observation_choices (choice_set_id, ordre, code, libelle, valeur)
SELECT cs.id, 1, 'EXC', 'ممتاز',     4 FROM observation_choice_sets cs WHERE cs.code='APPRECIATION5';
INSERT INTO observation_choices (choice_set_id, ordre, code, libelle, valeur)
SELECT cs.id, 2, 'VG',  'جيد جدا',   3 FROM observation_choice_sets cs WHERE cs.code='APPRECIATION5';
INSERT INTO observation_choices (choice_set_id, ordre, code, libelle, valeur)
SELECT cs.id, 3, 'G',   'جيد',       2 FROM observation_choice_sets cs WHERE cs.code='APPRECIATION5';
INSERT INTO observation_choices (choice_set_id, ordre, code, libelle, valeur)
SELECT cs.id, 4, 'ACC', 'مقبول',     1 FROM observation_choice_sets cs WHERE cs.code='APPRECIATION5';
INSERT INTO observation_choices (choice_set_id, ordre, code, libelle, valeur)
SELECT cs.id, 5, 'FAI', 'ضعيف',      0 FROM observation_choice_sets cs WHERE cs.code='APPRECIATION5';

------------------------------------------------------------
-- (4) PRÉ-CHARGEMENT DES SECTIONS (d'après votre capture)
------------------------------------------------------------

INSERT INTO observation_sections (ordre, titre) VALUES
(1, 'ظروف التفتيش'),
(2, 'تحضير الدرس'),
(3, 'إنجاز الدروس'),
(4, 'الوثائق والوسائل');

------------------------------------------------------------
-- (5) PRÉ-CHARGEMENT DES ITEMS (fidèles à la page)
-- NB: Les champs purement administratifs (تاريخ/مدة/عدد/قسم…) restent dans `inspections`.
------------------------------------------------------------

-- ========== 1) ظروف التفتيش ==========
-- الانضباط / الإضاءة / التهوية / الجلوس  (Oui / لا)
INSERT INTO observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id)
SELECT s.id, 1, 'الانضباط', 'choix', 1, cs.id
FROM observation_sections s, observation_choice_sets cs
WHERE s.titre='ظروف التفتيش' AND cs.code='OUI_NON';

INSERT INTO observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id)
SELECT s.id, 2, 'الإضاءة', 'choix', 1, cs.id
FROM observation_sections s, observation_choice_sets cs
WHERE s.titre='ظروف التفتيش' AND cs.code='OUI_NON';

INSERT INTO observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id)
SELECT s.id, 3, 'التهوية', 'choix', 1, cs.id
FROM observation_sections s, observation_choice_sets cs
WHERE s.titre='ظروف التفتيش' AND cs.code='OUI_NON';

INSERT INTO observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id)
SELECT s.id, 4, 'الجلوس', 'choix', 1, cs.id
FROM observation_sections s, observation_choice_sets cs
WHERE s.titre='ظروف التفتيش' AND cs.code='OUI_NON';

-- ========== 2) تحضير الدرس ==========
-- الربط بالمكتسبات السابقة / وضوح الأهداف وملاءمتها / اختيار المنهجية والخطة (Oui/أحيانًا/لا)
INSERT INTO observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id)
SELECT s.id, 1, 'الربط بالمكتسبات السابقة', 'choix', 1, cs.id
FROM observation_sections s, observation_choice_sets cs
WHERE s.titre='تحضير الدرس' AND cs.code='OUI_AH_NON';

INSERT INTO observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id)
SELECT s.id, 2, 'وضوح الأهداف وملاءمتها', 'choix', 1, cs.id
FROM observation_sections s, observation_choice_sets cs
WHERE s.titre='تحضير الدرس' AND cs.code='OUI_AH_NON';

INSERT INTO observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id)
SELECT s.id, 3, 'اختيار المنهجية والخطة', 'choix', 1, cs.id
FROM observation_sections s, observation_choice_sets cs
WHERE s.titre='تحضير الدرس' AND cs.code='OUI_AH_NON';

-- ========== 3) إنجاز الدروس ==========
-- "المعلومات: تقديم" (paragraphe libre dans la page) -> on le capture en TEXTE
INSERT INTO observation_items (section_id, ordre, libelle, type_reponse, poids)
SELECT s.id, 1, 'المعلومات: تقديم (وصف)', 'texte', 0.5
FROM observation_sections s WHERE s.titre='إنجاز الدروس';

-- هل تسلسلها منطقي؟  / هل تحققت أهداف الحصة؟ / هل تمكن المتعلمون من الإنجاز الصحيح؟  (Oui/أحيانًا/لا)
INSERT INTO observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id)
SELECT s.id, 2, 'هل تسلسلها منطقي؟', 'choix', 1, cs.id
FROM observation_sections s, observation_choice_sets cs
WHERE s.titre='إنجاز الدروس' AND cs.code='OUI_AH_NON';

INSERT INTO observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id)
SELECT s.id, 3, 'هل تحققت أهداف الحصة؟', 'choix', 1, cs.id
FROM observation_sections s, observation_choice_sets cs
WHERE s.titre='إنجاز الدروس' AND cs.code='OUI_AH_NON';

INSERT INTO observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id)
SELECT s.id, 4, 'هل تمكن المتعلمون من الإنجاز الصحيح للمهام الموزعة عليهم؟', 'choix', 1, cs.id
FROM observation_sections s, observation_choice_sets cs
WHERE s.titre='إنجاز الدروس' AND cs.code='OUI_AH_NON';

-- مشاركة التلاميذ: (تقدير نوعي كما في "مقبولة")
INSERT INTO observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id)
SELECT s.id, 5, 'مشاركة التلاميذ', 'choix', 1, cs.id
FROM observation_sections s, observation_choice_sets cs
WHERE s.titre='إنجاز الدروس' AND cs.code='APPRECIATION5';

-- ========== 4) الوثائق والوسائل ==========
-- الكتاب المدرسي / الدفتر / وسائل أخرى / أعمال تطبيقية / التقويم (وصف)
INSERT INTO observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id)
SELECT s.id, 1, 'الكتاب المدرسي متوفر', 'choix', 1, cs.id
FROM observation_sections s, observation_choice_sets cs
WHERE s.titre='الوثائق والوسائل' AND cs.code='OUI_NON';

INSERT INTO observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id)
SELECT s.id, 2, 'الدفتر مراقب بانتظام', 'choix', 1, cs.id
FROM observation_sections s, observation_choice_sets cs
WHERE s.titre='الوثائق والوسائل' AND cs.code='OUI_NON';

INSERT INTO observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id)
SELECT s.id, 3, 'وسائل أخرى مناسبة', 'choix', 1, cs.id
FROM observation_sections s, observation_choice_sets cs
WHERE s.titre='الوثائق والوسائل' AND cs.code='OUI_AH_NON';

INSERT INTO observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id)
SELECT s.id, 4, 'أعمال تطبيقية منجزة', 'choix', 1, cs2.id
FROM observation_sections s, observation_choice_sets cs2
WHERE s.titre='الوثائق والوسائل' AND cs2.code='OUI_NON';

INSERT INTO observation_items (section_id, ordre, libelle, type_reponse, poids)
SELECT s.id, 5, 'التقويم (وصف مختصر)', 'texte', 0.5
FROM observation_sections s WHERE s.titre='الوثائق والوسائل';

COMMIT;

-- =========================================================
--  VUES UTILES (OPTIONNEL) POUR RENDRE LE TABLEAU DU RAPPORT
-- =========================================================

-- Vue : liste des items avec leur section (pour l'affichage ordonné)
DROP VIEW IF EXISTS v_obs_items_catalogue;
CREATE VIEW v_obs_items_catalogue AS
SELECT s.ordre AS section_ordre,
       s.titre AS section_titre,
       it.ordre AS item_ordre,
       it.id    AS item_id,
       it.libelle,
       it.type_reponse,
       it.poids,
       it.choice_set_id
FROM observation_items it
JOIN observation_sections s ON s.id = it.section_id
ORDER BY s.ordre, it.ordre;

-- Vue : réponses prêtes à afficher pour une inspection donnée
DROP VIEW IF EXISTS v_obs_responses_display;
CREATE VIEW v_obs_responses_display AS
SELECT
  r.inspection_id,
  s.titre AS rubrique,
  it.ordre AS item_ordre,
  it.libelle AS item,
  COALESCE(ch.libelle,
           CASE
             WHEN r.valeur_bool IS NOT NULL THEN CASE r.valeur_bool WHEN 1 THEN 'نعم' ELSE 'لا' END
             WHEN r.valeur_num  IS NOT NULL THEN printf('%.2f', r.valeur_num)
             ELSE r.valeur_texte
           END
  ) AS reponse,
  r.commentaire
FROM observation_responses r
JOIN observation_items it   ON it.id = r.item_id
JOIN observation_sections s ON s.id = it.section_id
LEFT JOIN observation_choices ch ON ch.id = r.choice_id
ORDER BY s.ordre, it.ordre;

-- Vue : score (pondéré) par rubrique pour une inspection
DROP VIEW IF EXISTS v_obs_scores_by_section;
CREATE VIEW v_obs_scores_by_section AS
SELECT
  r.inspection_id,
  s.titre AS rubrique,
  SUM(
    COALESCE(ch.valeur,
             CASE
               WHEN r.valeur_bool IS NOT NULL THEN r.valeur_bool
               WHEN r.valeur_num  IS NOT NULL THEN r.valeur_num
               ELSE 0
             END
    ) * COALESCE(it.poids,1.0)
  ) AS score_obtenu,
  SUM(CASE WHEN it.type_reponse IN ('choix','bool','note') THEN COALESCE(it.poids,1.0) ELSE 0 END) AS score_max
FROM observation_responses r
JOIN observation_items it   ON it.id = r.item_id
JOIN observation_sections s ON s.id = it.section_id
LEFT JOIN observation_choices ch ON ch.id = r.choice_id
GROUP BY r.inspection_id, s.id
ORDER BY MIN(s.ordre);



--insertion 


-- Supposez une inspection existante avec id = 101

-- 1) ظروف التفتيش : tout "نعم"
INSERT INTO observation_responses (inspection_id, item_id, choice_id)
SELECT 101, it.id, ch.id
FROM observation_items it
JOIN observation_sections s ON s.id=it.section_id AND s.titre='ظروف التفتيش'
JOIN observation_choice_sets cs ON cs.id=it.choice_set_id AND cs.code='OUI_NON'
JOIN observation_choices ch ON ch.choice_set_id=cs.id AND ch.code='OUI';

-- 2) إنجاز الدروس : commentaire texte + réponses mixtes
INSERT INTO observation_responses (inspection_id, item_id, valeur_texte)
SELECT 101, it.id, 'تم ربط المكتسبات السابقة بالتعلمات الجديدة ضمن وضعيات تعليمية.'
FROM observation_items it
JOIN observation_sections s ON s.id=it.section_id
WHERE s.titre='إنجاز الدروس' AND it.libelle LIKE 'المعلومات:%';

INSERT INTO observation_responses (inspection_id, item_id, choice_id, commentaire)
SELECT 101, it.id, ch.id, 'تحسن في الانتقال بين الأنشطة'
FROM observation_items it
JOIN observation_sections s ON s.id=it.section_id AND s.titre='إنجاز الدروس'
JOIN observation_choice_sets cs ON cs.id=it.choice_set_id AND cs.code='OUI_AH_NON'
JOIN observation_choices ch ON ch.choice_set_id=cs.id AND ch.code='AH'
WHERE it.libelle='هل تسلسلها منطقي؟';

INSERT INTO observation_responses (inspection_id, item_id, choice_id)
SELECT 101, it.id, ch.id
FROM observation_items it
JOIN observation_sections s ON s.id=it.section_id AND s.titre='إنجاز الدروس'
JOIN observation_choice_sets cs ON cs.id=it.choice_set_id AND cs.code='APPRECIATION5'
JOIN observation_choices ch ON ch.choice_set_id=cs.id AND ch.code='ACC'
WHERE it.libelle='مشاركة التلاميذ';

-- 3) الوثائق والوسائل : livre + cahier = نعم ; autres = حسب الحالة ; تقويم = وصف
INSERT INTO observation_responses (inspection_id, item_id, choice_id)
SELECT 101, it.id, ch.id
FROM observation_items it
JOIN observation_sections s ON s.id=it.section_id AND s.titre='الوثائق والوسائل'
JOIN observation_choice_sets cs ON cs.id=it.choice_set_id AND cs.code='OUI_NON'
JOIN observation_choices ch ON ch.choice_set_id=cs.id AND ch.code='OUI'
WHERE it.libelle IN ('الكتاب المدرسي متوفر','الدفتر مراقب بانتظام','أعمال تطبيقية منجزة');

INSERT INTO observation_responses (inspection_id, item_id, valeur_texte)
SELECT 101, it.id, 'مراقبة مستمرة منتظمة + أسئلة ختامية قصيرة'
FROM observation_items it
JOIN observation_sections s ON s.id=it.section_id
WHERE s.titre='الوثائق والوسائل' AND it.libelle='التقويم (وصف مختصر)';
``