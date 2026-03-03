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
    email               TEXT    NOT NULL,                                        -- البريد الإلكتروني
    address             TEXT    NOT NULL,                                        -- العنوان
    school_entry_date   TEXT    NOT NULL,                                        -- تاريخ الدخول المدرسي (YYYY-MM-DD)
    diploma             TEXT    NOT NULL,                                        -- الشهادة / الدبلوم
    created_at          TEXT    NOT NULL DEFAULT (datetime('now')),              -- تاريخ الإنشاء
    updated_at          TEXT                                                     -- تاريخ التحديث
);

CREATE INDEX IF NOT EXISTS idx_email   ON personal_info(email);
CREATE INDEX IF NOT EXISTS idx_phone   ON personal_info(phone);
CREATE INDEX IF NOT EXISTS idx_created ON personal_info(created_at);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER IF NOT EXISTS trg_personal_info_updated_at
AFTER UPDATE ON personal_info
FOR EACH ROW
BEGIN
    UPDATE personal_info SET updated_at = datetime('now') WHERE id = OLD.id;
END;
