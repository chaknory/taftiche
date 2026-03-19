-- =============================================
-- Script de création de la base de données
-- استمارة المعلومات الشخصية
-- Compatible SQLite 3
-- =============================================

-- Table des informations personnelles
CREATE TABLE IF NOT EXISTS personal_info (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    district            TEXT    NOT NULL,                                        -- المقاطعة المدرسية
    school_year         TEXT    NOT NULL,                                        -- السنة الدراسية
    school_name         TEXT    NOT NULL,                                        -- اسم المدرسة
    years_worked        INTEGER NOT NULL CHECK(years_worked >= 0 AND years_worked <= 60), -- عدد سنوات العمل
    first_name          TEXT    NOT NULL,                                        -- الاسم الشخصي
    family_name         TEXT    NOT NULL,                                        -- الاسم العائلي
    maiden_name         TEXT,                                                    -- اللقب الأصلي للمتزوجة (اختياري)
    birth_place         TEXT    NOT NULL,                                        -- مكان الميلاد
    residence           TEXT    NOT NULL,                                        -- مكان الإقامة
    marital_status      TEXT    NOT NULL CHECK(marital_status IN ('أعزب','متزوج','أرمل','مطلق')), -- الحالة المدنية
    spouse_name         TEXT,                                                    -- اسم الزوج (للمتزوجة فقط)
    birth_date          TEXT    NOT NULL,                                        -- تاريخ الميلاد (YYYY-MM-DD)
    gender              TEXT    NOT NULL CHECK(gender IN ('ذكر','أنثى')),        -- الجنس
    phone               TEXT    NOT NULL,                                        -- رقم الهاتف
    email               TEXT    NOT NULL UNIQUE,                                  -- البريد الإلكتروني
    school_entry_date   TEXT    NOT NULL,                                        -- تاريخ الدخول المدرسي (YYYY-MM-DD)
    diploma             TEXT    NOT NULL,                                        -- الشهادة / الدبلوم
    first_appointment_date TEXT,                                                 -- تاريخ أول تعيين بالتعليم
    job_rank            TEXT,                                                    -- الرتبة
    status              TEXT,                                                    -- الصفة
    echelon             TEXT,                                                    -- السلم
    grade               TEXT,                                                    -- الدرجة
    execution_date      TEXT,                                                    -- تاريخ التنفيذ
    latest_inspection_date  TEXT,                                                -- تاريخ آخر تفتيش
    latest_inspection_score INTEGER CHECK(latest_inspection_score IS NULL OR (latest_inspection_score >= 0 AND latest_inspection_score <= 20)), -- علامة آخر تفتيش
    last_inspection_date    TEXT,                                                -- تاريخ التفتيش ما قبل الأخير
    last_inspection_score   INTEGER CHECK(last_inspection_score IS NULL OR (last_inspection_score >= 0 AND last_inspection_score <= 20)), -- علامة التفتيش ما قبل الأخير
    previous_year_class TEXT,                                                    -- القسم المُسند العام الماضي
    current_year_class  TEXT,                                                    -- القسم المُسند هذا العام
    student_count       INTEGER CHECK(student_count IS NULL OR (student_count >= 0 AND student_count <= 200)), -- عدد التلاميذ
    haraka              TEXT    CHECK(haraka IS NULL OR haraka IN ('نعم','لا')), -- معني بالحركة
    class_note          TEXT,                                                    -- ملاحظة نصية للقسم
    children_count      INTEGER CHECK(children_count IS NULL OR (children_count >= 0 AND children_count <= 30)), -- عدد الأطفال
    tech_institute_grad_year TEXT,                                               -- سنة التخرج من المعهد التكنولوجي
    university_grad_year TEXT,                                                   -- سنة التخرج من الجامعة
    created_at          TEXT    NOT NULL DEFAULT (datetime('now')),              -- تاريخ الإنشاء
    updated_at          TEXT                                                     -- تاريخ التحديث
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_email   ON personal_info(email);
CREATE INDEX IF NOT EXISTS idx_phone   ON personal_info(phone);
CREATE INDEX IF NOT EXISTS idx_created ON personal_info(created_at);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER IF NOT EXISTS trg_personal_info_updated_at
AFTER UPDATE ON personal_info
FOR EACH ROW
BEGIN
    UPDATE personal_info SET updated_at = datetime('now') WHERE id = OLD.id;
END;

-- =============================================
-- Table des utilisateurs (authentification)
-- =============================================

CREATE TABLE IF NOT EXISTS users (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name          TEXT    NOT NULL,                                        -- الاسم الشخصي
    last_name           TEXT    NOT NULL,                                        -- اللقب
    email               TEXT    NOT NULL UNIQUE,                                 -- البريد الإلكتروني
    username            TEXT    NOT NULL UNIQUE,                                 -- اسم المستخدم
    password_hash       TEXT    NOT NULL,                                        -- كلمة المرور (مشفرة)
    role                TEXT    NOT NULL DEFAULT 'user'
                                CHECK(role IN ('admin','user')),                 -- الصلاحية
    is_active           INTEGER NOT NULL DEFAULT 1
                                CHECK(is_active IN (0,1)),                       -- الحساب مفعّل
    failed_attempts     INTEGER NOT NULL DEFAULT 0,                              -- محاولات الدخول الفاشلة
    locked_until        TEXT,                                                    -- مؤقت الإغلاق (ISO datetime)
    remember_token      TEXT,                                                    -- رمز "تذكرني"
    reset_token         TEXT,                                                    -- رمز إعادة تعيين كلمة المرور
    reset_token_expires TEXT,                                                    -- انتهاء صلاحية رمز الإعادة
    last_login          TEXT,                                                    -- آخر تسجيل دخول
    created_at          TEXT    NOT NULL DEFAULT (datetime('now')),              -- تاريخ الإنشاء
    updated_at          TEXT                                                     -- تاريخ التحديث
);

CREATE INDEX IF NOT EXISTS idx_users_email    ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_remember ON users(remember_token);

CREATE TRIGGER IF NOT EXISTS trg_users_updated_at
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    UPDATE users SET updated_at = datetime('now') WHERE id = OLD.id;
END;

-- =============================================
-- Table des inspections
-- جدول التفتيشات
-- =============================================

CREATE TABLE IF NOT EXISTS inspections (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    enseignant_id       INTEGER,                                                 -- المعلم المفتَّش عليه
    etablissement       TEXT,                                                    -- اسم المؤسسة
    annee_scolaire      TEXT,                                                    -- السنة الدراسية
    date_visite         TEXT,                                                    -- تاريخ الزيارة (YYYY-MM-DD)
    heure_visite        TEXT,                                                    -- ساعة الزيارة
    niveau              TEXT,                                                    -- المستوى
    effectif            INTEGER,                                                 -- عدد التلاميذ
    discipline          TEXT,                                                    -- المادة
    lecon               TEXT,                                                    -- الدرس
    pages_manuel        TEXT,                                                    -- صفحات الكتاب المدرسي
    created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at          TEXT,
    FOREIGN KEY (enseignant_id) REFERENCES personal_info(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_inspections_enseignant ON inspections(enseignant_id);
CREATE INDEX IF NOT EXISTS idx_inspections_date       ON inspections(date_visite);

CREATE TRIGGER IF NOT EXISTS trg_inspections_updated_at
AFTER UPDATE ON inspections
FOR EACH ROW
BEGIN
    UPDATE inspections SET updated_at = datetime('now') WHERE id = OLD.id;
END;

-- =============================================
-- Table des écoles
-- جدول المدارس
-- =============================================

CREATE TABLE IF NOT EXISTS ecole (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    nom            TEXT    NOT NULL UNIQUE,    -- اسم المدرسة
    district       TEXT    DEFAULT NULL,       -- المقاطعة
    code           TEXT    DEFAULT NULL,       -- الرمز
    adresse        TEXT    DEFAULT NULL,       -- العنوان
    ville          TEXT    DEFAULT NULL,       -- المدينة
    nb_directeur   INTEGER DEFAULT 0,
    nb_sub_dir     INTEGER DEFAULT 0,
    nb_Prf_arb     INTEGER DEFAULT 0,
    nb_prf_frc     INTEGER DEFAULT 0,
    nb_prf_ang     INTEGER DEFAULT 0,
    nb_prf_sprt    INTEGER DEFAULT 0,
    created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at     TEXT
);

CREATE INDEX IF NOT EXISTS idx_ecole_nom ON ecole(nom);

CREATE TRIGGER IF NOT EXISTS trg_ecole_updated_at
AFTER UPDATE ON ecole
FOR EACH ROW
BEGIN
    UPDATE ecole SET updated_at = datetime('now') WHERE id = OLD.id;
END;

-- Données initiales
INSERT OR IGNORE INTO ecole (nom) VALUES
    ('مدرسة نورالدين زنكي'),
    ('مدرسة أبوبكر الصديق'),
    ('مدرسة عمرالفاروق');

-- =============================================
-- Tables des évaluations
-- جداول التقييمات
-- =============================================

CREATE TABLE IF NOT EXISTS evaluations (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    inspection_id   INTEGER DEFAULT NULL,
    note_finale     TEXT    DEFAULT NULL,
    titre           TEXT    DEFAULT '',
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT,
    FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_evaluations_inspection ON evaluations(inspection_id);

CREATE TRIGGER IF NOT EXISTS trg_evaluations_updated_at
AFTER UPDATE ON evaluations
FOR EACH ROW
BEGIN
    UPDATE evaluations SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE TABLE IF NOT EXISTS evaluation_sections (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    evaluation_id   INTEGER NOT NULL,
    ordre           INTEGER NOT NULL DEFAULT 0,
    titre           TEXT    NOT NULL,
    contenu         TEXT    DEFAULT NULL,
    FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_eval_sections_evaluation ON evaluation_sections(evaluation_id);

CREATE TABLE IF NOT EXISTS evaluation_subsections (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    section_id INTEGER NOT NULL,
    ordre      INTEGER NOT NULL DEFAULT 0,
    type       TEXT    NOT NULL DEFAULT 'texte' CHECK(type IN ('texte','liste')),
    contenu    TEXT    DEFAULT NULL,
    FOREIGN KEY (section_id) REFERENCES evaluation_sections(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_eval_subsections_section ON evaluation_subsections(section_id);

CREATE TABLE IF NOT EXISTS evaluation_items (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    subsection_id INTEGER NOT NULL,
    ordre         INTEGER NOT NULL DEFAULT 0,
    item          TEXT    NOT NULL,
    FOREIGN KEY (subsection_id) REFERENCES evaluation_subsections(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_eval_items_subsection ON evaluation_items(subsection_id);
