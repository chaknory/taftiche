-- =============================================
-- Script de création de la base de données
-- استمارة المعلومات الشخصية
-- =============================================

CREATE DATABASE IF NOT EXISTS personal_info_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE personal_info_db;

-- Table des informations personnelles
CREATE TABLE IF NOT EXISTS personal_info (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    district            VARCHAR(50)     NOT NULL    COMMENT 'المقاطعة المدرسية',
    school_year         VARCHAR(20)     NOT NULL    COMMENT 'السنة الدراسية',
    school_name         VARCHAR(100)    NOT NULL    COMMENT 'اسم المدرسة',
    years_worked        TINYINT UNSIGNED NOT NULL   COMMENT 'عدد سنوات العمل فيها',
    first_name          VARCHAR(50)     NOT NULL    COMMENT 'الاسم الشخصي',
    family_name         VARCHAR(50)     NOT NULL    COMMENT 'الاسم العائلي',
    maiden_name         VARCHAR(50)     NULL        COMMENT 'اللقب الأصلي للمتزوجة (اختياري)',
    birth_place         VARCHAR(100)    NOT NULL    COMMENT 'مكان الميلاد',
    marital_status      ENUM('أعزب','متزوج','أرمل','مطلق') NOT NULL COMMENT 'الحالة المدنية',
    spouse_name         VARCHAR(100)    NULL        COMMENT 'اسم الزوج (للمتزوجة فقط)',
    birth_date          DATE            NOT NULL    COMMENT 'تاريخ الميلاد',
    gender              ENUM('ذكر', 'أنثى') NOT NULL COMMENT 'الجنس',
    phone               VARCHAR(20)     NOT NULL    COMMENT 'رقم الهاتف',
    email               VARCHAR(150)    NOT NULL    COMMENT 'البريد الإلكتروني',
    address             TEXT            NOT NULL    COMMENT 'العنوان',
    school_entry_date   DATE            NOT NULL    COMMENT 'تاريخ الدخول المدرسي الأولي',
    created_at          DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP COMMENT 'تاريخ الإنشاء',
    updated_at          DATETIME        NULL        ON UPDATE CURRENT_TIMESTAMP COMMENT 'تاريخ التحديث',
    
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_created (created_at)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='جدول المعلومات الشخصية';
