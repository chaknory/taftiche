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
