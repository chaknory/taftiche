ALTER TABLE personal_info ADD COLUMN class_note TEXT;

--CREATE TABLE evaluation_items (
--    id INTEGER PRIMARY KEY AUTOINCREMENT,
--    subsection_id INTEGER NOT NULL,
--    ordre INTEGER NOT NULL,
--    item TEXT NOT NULL,
--    FOREIGN KEY (subsection_id) REFERENCES evaluation_subsections(id) ON DELETE CASCADE
--);

--CREATE TABLE evaluation_subsections (
--    id INTEGER PRIMARY KEY AUTOINCREMENT,
--    section_id INTEGER NOT NULL,
--    ordre INTEGER NOT NULL,
--    type TEXT NOT NULL CHECK (type IN ('texte', 'liste')),
--    contenu TEXT,
--    FOREIGN KEY (section_id) REFERENCES evaluation_sections(id) ON DELETE CASCADE
--);



-- for sqlite
--CREATE TABLE evaluation_sections (
--    id INTEGER PRIMARY KEY AUTOINCREMENT,
--    evaluation_id INTEGER NOT NULL,
--    ordre INTEGER NOT NULL,
--    titre TEXT NOT NULL,
-- 	  contenu TEXT NULL,
--    FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE
--);

-- for mysql
--CREATE TABLE evaluation_sections (
--    id INT AUTO_INCREMENT PRIMARY KEY,
   -- evaluation_id INT NOT NULL,
   -- ordre INT NOT NULL,
   -- titre VARCHAR(255) NOT NULL,
   -- contenu TEXT NULL,
   -- FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE
--);


--alter table evaluations drop COLUMN points_faibles;
--alter table evaluations drop COLUMN points_forts;
--alter table evaluations drop COLUMN recommandations;

--insert into observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id) VALUES (16,1,'بعد حضور الدروس و الإطلاع على الملف، و مناقشة المدرس(ة) ','texte',null,null);
--insert into observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id) VALUES (17,1,'بعد حضور الدروس و الإطلاع على الملف، و مناقشة المدرس(ة) ','texte',null,null);
--insert into observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id) VALUES (14,1,'الواجبات:','choix',null,2);
--insert into observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id) VALUES (14,2,'الفروض/ هل هي كافية و مناسبة ؟','texte',null,null);
--insert into observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id) VALUES (14,3,'الفروض/ هل هي مُصَحَّحَة ؟','texte',null,null);
--insert into observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id) VALUES (14,4,'قيمة التصحيح:','texte',null,null);
--insert into observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id) VALUES (13,1,'البرامج المقررة','texte',null,null);
--insert into observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id) VALUES (13,2,'التدرج','choix',null,1);
--insert into observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id) VALUES (12,1,' دفاتر التلاميذ','texte',null,null);
--insert into observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id) VALUES (12,2,'هل يعتني بها التلاميذ؟','texte',null,null);
--insert into observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id) VALUES (11,1,'السبورة','texte',null,null);
--insert into observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id) VALUES (11,2,'الكتاب','texte',null,null);

--insert into observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id) VALUES (10,1,'هل توجد تطبيقات على الدروس؟','texte',null,null);
--insert into observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id) VALUES (10,2,'هل هي مناسِبة؟','choix',null,1);
--insert into observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id) VALUES (3,1,'المعلومات، قيمتها:','texte',null,null);
--insert into observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id) VALUES (3,2,'هل تسلسلها منطقي؟','choix',null,1);
--insert into observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id) VALUES (3,3,'هل حققت الدروس أهدافها؟','texte',null,null);
--insert into observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id) VALUES (4,1,'المشاركة :','texte',null,null);

--insert into observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id) VALUES (2,1,'نوع الدروس','texte',null,null);
--insert into observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id) VALUES (2,2,'مواضيعه','texte',null,null);
--insert into observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id) VALUES (2,3,'التوازيع و الوثائق و المعلقات:','texte',null,null);
--insert into observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id) VALUES (2,4,'قيمة الإعداد','texte',null,null);
--insert into observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id) VALUES (2,5,'السجلات','texte',null,null);
--insert into observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id) VALUES (2,6,' مستعملة حسب التوجيهات التربوية؟','choix',null,1);


--DELETE FROM sqlite_sequence WHERE name = 'observation_items';

--INSERT INTO observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id) VALUES (1, 5, 'التهوية', 'choix', 1, 2);

-- ajout pour la case du consetement
--ALTER TABLE users ADD COLUMN consent_given BOOLEAN;
--ALTER TABLE users ADD COLUMN consent_timestamp DATETIME;


--INSERT INTO observation_choice_sets (code, libelle) VALUES ('OUI_NON','نعم / لا') ON CONFLICT(code) DO NOTHING;

--INSERT INTO observation_choice_sets (code, libelle) VALUES ('OUI_AH_NON','نعم / أحيانًا / لا') ON CONFLICT(code) DO NOTHING;

-- Imaginons inspection_id = 2
-- 1) ظروف التفتيش
--INSERT INTO observation_responses (inspection_id, item_id, choice_id, commentaire)
--SELECT 2, it.id, ch.id, NULL
--FROM observation_items it
--JOIN observation_sections s ON s.id=it.section_id AND s.titre='ظروف التفتيش'
--JOIN observation_choice_sets cs ON cs.id=it.choice_set_id AND cs.code='OUI_NON'
--JOIN observation_choices ch ON ch.choice_set_id=cs.id AND ch.code='OUI'
--WHERE it.libelle IN ('الانضباط','الإضاءة','التهوية','الجلوس');
--
---- 2) إنجاز الدروس (exemple avec commentaire)
--INSERT INTO observation_responses (inspection_id, item_id, choice_id, commentaire)
--SELECT 2, it.id, ch.id, 'مقبولة مع حاجة إلى تنويع أنشطة الجماعات'
--FROM observation_items it
--JOIN observation_sections s ON s.id=it.section_id AND s.titre='إنجاز الدروس'
--JOIN observation_choice_sets cs ON cs.id=it.choice_set_id AND cs.code='OUI_AH_NON'
--JOIN observation_choices ch ON ch.choice_set_id=cs.id AND ch.code='AH'
--WHERE it.libelle='مشاركة التلاميذ';
--
---- 3) الوثائق والوسائل (texte libre pour "التقويم")
--INSERT INTO observation_responses (inspection_id, item_id, valeur_texte)
--SELECT 2, it.id, 'مراقبة مستمرة منتظمة + أسئلة قصيرة ختامية'
--FROM observation_items it
--JOIN observation_sections s ON s.id=it.section_id
--WHERE s.titre='الوثائق والوسائل' AND it.libelle='التقويم (وصف مختصر)';
--


-- 1) ظروف التفتيش
--INSERT INTO observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id)
--SELECT s.id, 1, 'الانضباط',      'choix', 1, cs.id
--FROM observation_sections s, observation_choice_sets cs
--WHERE s.titre='ظروف التفتيش' AND cs.code='OUI_NON';
--INSERT INTO observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id)
--SELECT s.id, 2, 'الإضاءة',       'choix', 1, cs.id FROM observation_sections s, observation_choice_sets cs
--WHERE s.titre='ظروف التفتيش' AND cs.code='OUI_NON';
--INSERT INTO observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id)
--SELECT s.id, 3, 'التهوية',       'choix', 1, cs.id FROM observation_sections s, observation_choice_sets cs
--WHERE s.titre='ظروف التفتيش' AND cs.code='OUI_NON';
--INSERT INTO observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id)
--SELECT s.id, 4, 'الجلوس',        'choix', 1, cs.id FROM observation_sections s, observation_choice_sets cs
--WHERE s.titre='ظروف التفتيش' AND cs.code='OUI_NON';
--
---- 2) تحضير الدرس
--INSERT INTO observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id)
--SELECT s.id, 1, 'الربط بالمكتسبات السابقة', 'choix', 1, cs.id
--FROM observation_sections s, observation_choice_sets cs
--WHERE s.titre='تحضير الدرس' AND cs.code='OUI_AH_NON';
--INSERT INTO observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id)
--SELECT s.id, 2, 'وضوح الأهداف وملاءمتها',    'choix', 1, cs.id
--FROM observation_sections s, observation_choice_sets cs
--WHERE s.titre='تحضير الدرس' AND cs.code='OUI_AH_NON';
--INSERT INTO observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id)
--SELECT s.id, 3, 'اختيار المنهجية والخطة',   'choix', 1, cs.id
--FROM observation_sections s, observation_choice_sets cs
--WHERE s.titre='تحضير الدرس' AND cs.code='OUI_AH_NON';
--
---- 3) إنجاز الدروس
--INSERT INTO observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id)
--SELECT s.id, 1, 'تسلسل الأنشطة منطقي',      'choix', 1, cs.id
--FROM observation_sections s, observation_choice_sets cs
--WHERE s.titre='إنجاز الدروس' AND cs.code='OUI_AH_NON';
--INSERT INTO observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id)
--SELECT s.id, 2, 'تحقق أهداف الحصة',         'choix', 1, cs.id
--FROM observation_sections s, observation_choice_sets cs
--WHERE s.titre='إنجاز الدروس' AND cs.code='OUI_AH_NON';
--INSERT INTO observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id)
--SELECT s.id, 3, 'إنجاز المتعلمين للمهام',   'choix', 1, cs.id
--FROM observation_sections s, observation_choice_sets cs
--WHERE s.titre='إنجاز الدروس' AND cs.code='OUI_AH_NON';
---- Participation (échelle simple + commentaire libre)
--INSERT INTO observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id)
--SELECT s.id, 4, 'مشاركة التلاميذ',          'choix', 1, cs.id
--FROM observation_sections s, observation_choice_sets cs
--WHERE s.titre='إنجاز الدروس' AND cs.code='OUI_AH_NON';
--
---- 4) الوثائق والوسائل
--INSERT INTO observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id)
--SELECT s.id, 1, 'الكتاب المدرسي متوفر',     'choix', 1, cs.id
--FROM observation_sections s, observation_choice_sets cs
--WHERE s.titre='الوثائق والوسائل' AND cs.code='OUI_NON';
--INSERT INTO observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id)
--SELECT s.id, 2, 'الدفتر مراقب بانتظام',     'choix', 1, cs.id
--FROM observation_sections s, observation_choice_sets cs
--WHERE s.titre='الوثائق والوسائل' AND cs.code='OUI_NON';
--INSERT INTO observation_items (section_id, ordre, libelle, type_reponse, poids, choice_set_id)
--SELECT s.id, 3, 'وسائل أخرى مناسبة',        'choix', 1, cs.id
--FROM observation_sections s, observation_choice_sets cs
--WHERE s.titre='الوثائق والوسائل' AND cs.code='OUI_AH_NON';
--INSERT INTO observation_items (section_id, ordre, libelle, type_reponse, poids)
--SELECT s.id, 4, 'التقويم (وصف مختصر)',       'texte', 0.5
--FROM observation_sections s WHERE s.titre='الوثائق والوسائل';


--INSERT INTO observation_choice_sets (code, libelle) VALUES
--('OUI_AH_NON', 'نعم / أحيانًا / لا'),
--('OUI_NON',    'نعم / لا');
--
--INSERT INTO observation_choices (choice_set_id, ordre, code, libelle, valeur)
--SELECT id, 1, 'OUI', 'نعم', 2   FROM observation_choice_sets WHERE code='OUI_AH_NON';
--INSERT INTO observation_choices (choice_set_id, ordre, code, libelle, valeur)
--SELECT id, 2, 'AH',  'أحيانًا', 1 FROM observation_choice_sets WHERE code='OUI_AH_NON';
--INSERT INTO observation_choices (choice_set_id, ordre, code, libelle, valeur)
--SELECT id, 3, 'NON', 'لا', 0   FROM observation_choice_sets WHERE code='OUI_AH_NON';
--
--INSERT INTO observation_choices (choice_set_id, ordre, code, libelle, valeur)
--SELECT id, 1, 'OUI', 'نعم', 1 FROM observation_choice_sets WHERE code='OUI_NON';
--INSERT INTO observation_choices (choice_set_id, ordre, code, libelle, valeur)
--SELECT id, 2, 'NON', 'لا',  0 FROM observation_choice_sets WHERE code='OUI_NON';



-- Une ligne par item pour une inspection :
-- si type == 'choix' -> choice_id
-- si type == 'bool'  -> valeur_bool
-- si type == 'note'  -> valeur_num
-- si type == 'texte' -> valeur_texte
-- TABLE IF NOT EXISTS observation_responses (
--  id              INTEGER PRIMARY KEY AUTOINCREMENT,
--  inspection_id   INTEGER NOT NULL,
--  item_id         INTEGER NOT NULL,
--  choice_id       INTEGER,               -- pour type 'choix'
--  valeur_bool     INTEGER CHECK (valeur_bool IN (0,1)),
--  valeur_num      REAL,
--  valeur_texte    TEXT,
--  commentaire     TEXT,
--  FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE,
--  FOREIGN KEY (item_id)       REFERENCES observation_items(id) ON DELETE CASCADE,
--  FOREIGN KEY (choice_id)     REFERENCES observation_choices(id) ON DELETE SET NULL,
--  UNIQUE (inspection_id, item_id)
--);
-- Optionnel : contrainte de cohérence (déclencheur) pour n'accepter
-- qu’un seul mode de réponse en fonction du type de l’item.


---- TABLE IF NOT EXISTS observation_choices (
--  id              INTEGER PRIMARY KEY AUTOINCREMENT,
--  choice_set_id   INTEGER NOT NULL,
--  ordre           INTEGER,
--  code            TEXT NOT NULL,      -- ex: 'OUI', 'AH', 'NON'
--  libelle         TEXT NOT NULL,      -- ex: 'نعم', 'أحيانًا', 'لا'
--  valeur          REAL NOT NULL,      -- ex: 2, 1, 0
--  FOREIGN KEY (choice_set_id) REFERENCES observation_choice_sets(id) ON DELETE CASCADE
--);


--CREATE TABLE IF NOT EXISTS observation_items (
--  id              INTEGER PRIMARY KEY AUTOINCREMENT,
--  section_id      INTEGER NOT NULL,
--  ordre           INTEGER,
--  libelle         TEXT NOT NULL,   -- ex: 'الانضباط'
--  type_reponse    TEXT NOT NULL DEFAULT 'choix'
--                      CHECK (type_reponse IN ('choix','bool','note','texte')),
--  poids           REAL DEFAULT 1.0,       -- pour note pondérée
--  choice_set_id   INTEGER,                -- null si bool/note/texte
--  FOREIGN KEY (section_id)    REFERENCES observation_sections(id) ON DELETE CASCADE,
--  FOREIGN KEY (choice_set_id) REFERENCES observation_choice_sets(id) ON DELETE SET NULL
--);

--CREATE TABLE IF NOT EXISTS observation_choice_sets (
--  id        INTEGER PRIMARY KEY AUTOINCREMENT,
--  code      TEXT UNIQUE NOT NULL,     -- ex: 'OUI_NON_AH'
--  libelle   TEXT                      -- ex: 'Oui / أحيانًا / لا'
--);

--CREATE TABLE IF NOT EXISTS observation_sections (
--  id        INTEGER PRIMARY KEY AUTOINCREMENT,
--  ordre     INTEGER,
--  titre     TEXT NOT NULL          -- ex: 'ظروف التفتيش'
--);


--INSERT INTO observation_sections (ordre, titre) VALUES
--(1, 'ظروف التفتيش'),
--(2, 'تحضير الدرس'),
--(3, 'إنجاز الدروس'),
--(4, 'الوثائق والوسائل');
--(5, 'التطبيقات التعليمية'),
--(6, 'مشاركة التلاميذ'),
--(7, 'الوسائل التعليمية'),
--(8, 'وسائل أخرى'),
--(9, 'هل هي مراقبة من حيث'),
--(10, 'الفروض المنزلية'),
--(11, 'تقويم الدروس المُشَاهدة (نقد، و توجيه)'),
--(12, 'التقرير العام');

--update observation_sections set titre='تحضير الدروس' where id =2
--update observation_sections set titre='تحضير الدروس' where id =2
--alter table inspections ADD COLUMN heure_visite TEXT;
--alter table inspections ADD COLUMN duree_visite TEXT;
--alter table inspections ADD COLUMN classe TEXT;
--update inspections SET classe='س4' where id=1;
--update inspections SET classe='ج5' where id=2;



--INSERT INTO district ( numero,ville,responsable_inspecteur_id,created_at,updated_at) 
--VALUES ('10','بسكرة', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--
--INSERT INTO inspecteur (id_user, nom,prenom,email,actif,created_at,updated_at) VALUES (5,'علمي','ندى','nada@gmail.com',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
--
--
--INSERT INTO ecole (
--	id_college, nom, code, adresse, ville, nb_directeur,nb_sub_dir,nb_Prf_arb,nb_prf_frc,nb_prf_ang	,nb_prf_sprt,
--    created_at, updated_at
--) VALUES (3,'بومزراڨ مبروك بن موسى', 6, 'حي 400 مسكن ـ عدل','بسكرة',1,0,10,1,1,1, CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
--
--INSERT INTO ecole (
--    id_college, nom, code, adresse, ville, nb_directeur,nb_sub_dir,nb_Prf_arb,nb_prf_frc,nb_prf_ang	,nb_prf_sprt,
--    created_at, updated_at
--) VALUES (3,'سلطان محمد', 7, 'حي 200 + 200 + 300 مسكن','بسكرة',0,0,0,0,0,0, CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
--
--INSERT INTO ecole (
--    id_college, nom, code, adresse, ville, nb_directeur,nb_sub_dir,nb_Prf_arb,nb_prf_frc,nb_prf_ang	,nb_prf_sprt,
--    created_at, updated_at
--) VALUES (3,'لوام أحمد', 8, 'حي 1000 مسكن ـ عدل','بسكرة',1,0,10,1,1,1, CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
--
--INSERT INTO ecole (
--    id_college, nom, code, adresse, ville, nb_directeur,nb_sub_dir,nb_Prf_arb,nb_prf_frc,nb_prf_ang	,nb_prf_sprt,
--    created_at, updated_at
--) VALUES (4,'حرزلي بلقاسم ـ أبو الشهداء الخمسة', 9, 'حي 900 مسكن','بسكرة',0,0,0,0,0,0, CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
--