-- =============================================
-- Migration : ajout des champs manquants
-- à exécuter UNE SEULE FOIS sur une base existante
-- SQLite 3 (ALTER TABLE … ADD COLUMN)
-- =============================================

-- تاريخ أول تعيين بالتعليم
ALTER TABLE personal_info ADD COLUMN first_appointment_date TEXT;

-- الرتبة : renommer l'ancienne colonne rank → job_rank (bases existantes)
ALTER TABLE personal_info RENAME COLUMN rank TO job_rank;
-- si la colonne n'existait pas encore, l'ajouter
ALTER TABLE personal_info ADD COLUMN job_rank TEXT;

-- الصفة
ALTER TABLE personal_info ADD COLUMN status TEXT;

-- السلم
ALTER TABLE personal_info ADD COLUMN echelon TEXT;

-- الدرجة
ALTER TABLE personal_info ADD COLUMN grade TEXT;

-- تاريخ التنفيذ
ALTER TABLE personal_info ADD COLUMN execution_date TEXT;

-- تاريخ آخر تفتيش
ALTER TABLE personal_info ADD COLUMN latest_inspection_date TEXT;

-- علامة آخر تفتيش
ALTER TABLE personal_info ADD COLUMN latest_inspection_score INTEGER
    CHECK(latest_inspection_score IS NULL OR (latest_inspection_score >= 0 AND latest_inspection_score <= 20));

-- تاريخ التفتيش ما قبل الأخير
ALTER TABLE personal_info ADD COLUMN last_inspection_date TEXT;

-- علامة التفتيش ما قبل الأخير
ALTER TABLE personal_info ADD COLUMN last_inspection_score INTEGER
    CHECK(last_inspection_score IS NULL OR (last_inspection_score >= 0 AND last_inspection_score <= 20));

-- القسم المُسند العام الماضي
ALTER TABLE personal_info ADD COLUMN previous_year_class TEXT;

-- القسم المُسند هذا العام
ALTER TABLE personal_info ADD COLUMN current_year_class TEXT;

-- عدد التلاميذ
ALTER TABLE personal_info ADD COLUMN student_count INTEGER
    CHECK(student_count IS NULL OR (student_count >= 0 AND student_count <= 200));

-- معني بالحركة
ALTER TABLE personal_info ADD COLUMN haraka TEXT
    CHECK(haraka IS NULL OR haraka IN ('نعم','لا'));

-- عدد الأطفال
ALTER TABLE personal_info ADD COLUMN children_count INTEGER
    CHECK(children_count IS NULL OR (children_count >= 0 AND children_count <= 30));

-- سنة التخرج من المعهد التكنولوجي
ALTER TABLE personal_info ADD COLUMN tech_institute_grad_year TEXT;

-- سنة التخرج من الجامعة
ALTER TABLE personal_info ADD COLUMN university_grad_year TEXT;
