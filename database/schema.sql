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
    address             TEXT    NOT NULL,                                        -- العنوان
    school_entry_date   TEXT    NOT NULL,                                        -- تاريخ الدخول المدرسي (YYYY-MM-DD)
    diploma             TEXT    NOT NULL,                                        -- الشهادة / الدبلوم
    first_appointment_date TEXT,                                                 -- تاريخ أول تعيين بالتعليم
    rank                TEXT,                                                    -- الرتبة
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
-- Table des évaluations
-- جدول التقييمات
-- =============================================

CREATE TABLE IF NOT EXISTS evaluations (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    inspection_id       INTEGER NOT NULL,                                        -- معرف التفتيش
    points_forts        TEXT,                                                    -- نقاط القوة
    points_faibles      TEXT,                                                    -- نقاط الضعف
    recommandations     TEXT,                                                    -- التوصيات
    note_finale         TEXT,                                                    -- النقطة النهائية
    created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at          TEXT,
    FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_evaluations_inspection ON evaluations(inspection_id);

CREATE TRIGGER IF NOT EXISTS trg_evaluations_updated_at
AFTER UPDATE ON evaluations
FOR EACH ROW
BEGIN
    UPDATE evaluations SET updated_at = datetime('now') WHERE id = OLD.id;
END;

-- =============================================
-- Table des observations en classe
-- جدول الملاحظات الصفية
-- =============================================

CREATE TABLE IF NOT EXISTS observations (
    id                          INTEGER PRIMARY KEY AUTOINCREMENT,
    inspection_id               INTEGER NOT NULL,                                -- معرف التفتيش
    comportement_professionnel  TEXT,                                            -- السلوك المهني
    respect_instructions        TEXT,                                            -- احترام التعليمات
    preparation_pedagogique     TEXT,                                            -- التحضير البيداغوجي
    strategie_enseignement      TEXT,                                            -- استراتيجية التدريس
    participation_eleves        TEXT,                                            -- مشاركة التلاميذ
    gestion_classe              TEXT,                                            -- تدبير الفصل
    maitrise_contenu            TEXT,                                            -- إتقان المحتوى
    moyens_didactiques          TEXT,                                            -- الوسائل الديداكتيكية
    remarques_supplementaires   TEXT,                                            -- ملاحظات إضافية
    created_at                  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at                  TEXT,
    FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_observations_inspection ON observations(inspection_id);

CREATE TRIGGER IF NOT EXISTS trg_observations_updated_at
AFTER UPDATE ON observations
FOR EACH ROW
BEGIN
    UPDATE observations SET updated_at = datetime('now') WHERE id = OLD.id;
END;
