-- =============================================
-- Schéma MySQL — Taftiche
-- استمارة المعلومات الشخصية
-- Compatible MySQL 8.0+ / MariaDB 10.5+
-- Encodage : utf8mb4 (support arabe + emoji)
-- =============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =============================================
-- Table des informations personnelles
-- =============================================

CREATE TABLE IF NOT EXISTS `personal_info` (
    `id`                    INT             NOT NULL AUTO_INCREMENT,
    `district`              VARCHAR(100)    NOT NULL                     COMMENT 'المقاطعة المدرسية',
    `school_year`           VARCHAR(20)     NOT NULL                     COMMENT 'السنة الدراسية',
    `school_name`           VARCHAR(200)    NOT NULL                     COMMENT 'اسم المدرسة',
    `years_worked`          TINYINT UNSIGNED NOT NULL                    COMMENT 'عدد سنوات العمل',
    `first_name`            VARCHAR(100)    NOT NULL                     COMMENT 'الاسم الشخصي',
    `family_name`           VARCHAR(100)    NOT NULL                     COMMENT 'الاسم العائلي',
    `maiden_name`           VARCHAR(100)    DEFAULT NULL                 COMMENT 'اللقب الأصلي للمتزوجة',
    `birth_place`           VARCHAR(100)    NOT NULL                     COMMENT 'مكان الميلاد',
    `residence`             VARCHAR(100)    NOT NULL                     COMMENT 'مكان الإقامة',
    `marital_status`        ENUM('أعزب','متزوج','أرمل','مطلق') NOT NULL COMMENT 'الحالة المدنية',
    `spouse_name`           VARCHAR(100)    DEFAULT NULL                 COMMENT 'اسم الزوج',
    `birth_date`            DATE            NOT NULL                     COMMENT 'تاريخ الميلاد',
    `gender`                ENUM('ذكر','أنثى') NOT NULL                  COMMENT 'الجنس',
    `phone`                 VARCHAR(20)     NOT NULL                     COMMENT 'رقم الهاتف',
    `email`                 VARCHAR(150)    NOT NULL                     COMMENT 'البريد الإلكتروني',
    `address`               VARCHAR(255)    NOT NULL                     COMMENT 'العنوان',
    `school_entry_date`     DATE            NOT NULL                     COMMENT 'تاريخ الدخول المدرسي',
    `diploma`               VARCHAR(150)    NOT NULL                     COMMENT 'الشهادة / الدبلوم',
    `first_appointment_date` DATE           DEFAULT NULL                 COMMENT 'تاريخ أول تعيين',
    `job_rank`              VARCHAR(100)    DEFAULT NULL                 COMMENT 'الرتبة',
    `status`                VARCHAR(100)    DEFAULT NULL                 COMMENT 'الصفة',
    `echelon`               VARCHAR(50)     DEFAULT NULL                 COMMENT 'السلم',
    `grade`                 VARCHAR(50)     DEFAULT NULL                 COMMENT 'الدرجة',
    `execution_date`        DATE            DEFAULT NULL                 COMMENT 'تاريخ التنفيذ',
    `latest_inspection_date`  DATE          DEFAULT NULL                 COMMENT 'تاريخ آخر تفتيش',
    `latest_inspection_score` TINYINT       DEFAULT NULL                 COMMENT 'علامة آخر تفتيش',
    `last_inspection_date`    DATE          DEFAULT NULL                 COMMENT 'تاريخ التفتيش ما قبل الأخير',
    `last_inspection_score`   TINYINT       DEFAULT NULL                 COMMENT 'علامة التفتيش ما قبل الأخير',
    `previous_year_class`   VARCHAR(50)     DEFAULT NULL                 COMMENT 'القسم المُسند العام الماضي',
    `current_year_class`    VARCHAR(50)     DEFAULT NULL                 COMMENT 'القسم المُسند هذا العام',
    `student_count`         SMALLINT        DEFAULT NULL                 COMMENT 'عدد التلاميذ',
    `haraka`                ENUM('نعم','لا') DEFAULT NULL                COMMENT 'معني بالحركة',
    `children_count`        TINYINT         DEFAULT NULL                 COMMENT 'عدد الأطفال',
    `tech_institute_grad_year` VARCHAR(10)  DEFAULT NULL                 COMMENT 'سنة التخرج من المعهد التكنولوجي',
    `university_grad_year`  VARCHAR(10)     DEFAULT NULL                 COMMENT 'سنة التخرج من الجامعة',
    `created_at`            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`            DATETIME        DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_email`   (`email`),
    KEY        `idx_phone`   (`phone`),
    KEY        `idx_created` (`created_at`),

    CONSTRAINT `chk_years_worked`          CHECK (`years_worked` BETWEEN 0 AND 60),
    CONSTRAINT `chk_latest_inspection_score` CHECK (`latest_inspection_score` IS NULL OR `latest_inspection_score` BETWEEN 0 AND 20),
    CONSTRAINT `chk_last_inspection_score`   CHECK (`last_inspection_score`   IS NULL OR `last_inspection_score`   BETWEEN 0 AND 20),
    CONSTRAINT `chk_student_count`          CHECK (`student_count` IS NULL OR `student_count` BETWEEN 0 AND 200),
    CONSTRAINT `chk_children_count`         CHECK (`children_count` IS NULL OR `children_count` BETWEEN 0 AND 30)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table des utilisateurs (authentification)
-- =============================================

CREATE TABLE IF NOT EXISTS `users` (
    `id`                    INT             NOT NULL AUTO_INCREMENT,
    `first_name`            VARCHAR(100)    NOT NULL                     COMMENT 'الاسم الشخصي',
    `last_name`             VARCHAR(100)    NOT NULL                     COMMENT 'اللقب',
    `email`                 VARCHAR(150)    NOT NULL                     COMMENT 'البريد الإلكتروني',
    `username`              VARCHAR(60)     NOT NULL                     COMMENT 'اسم المستخدم',
    `password_hash`         VARCHAR(255)    NOT NULL                     COMMENT 'كلمة المرور (مشفرة)',
    `role`                  ENUM('admin','user') NOT NULL DEFAULT 'user' COMMENT 'الصلاحية',
    `is_active`             TINYINT(1)      NOT NULL DEFAULT 1           COMMENT 'الحساب مفعّل',
    `failed_attempts`       TINYINT         NOT NULL DEFAULT 0           COMMENT 'محاولات الدخول الفاشلة',
    `locked_until`          DATETIME        DEFAULT NULL                 COMMENT 'مؤقت الإغلاق',
    `remember_token`        VARCHAR(255)    DEFAULT NULL                 COMMENT 'رمز تذكرني',
    `reset_token`           VARCHAR(255)    DEFAULT NULL                 COMMENT 'رمز إعادة تعيين كلمة المرور',
    `reset_token_expires`   DATETIME        DEFAULT NULL                 COMMENT 'انتهاء صلاحية رمز الإعادة',
    `last_login`            DATETIME        DEFAULT NULL                 COMMENT 'آخر تسجيل دخول',
    `created_at`            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`            DATETIME        DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_users_email`    (`email`),
    UNIQUE KEY `idx_users_username` (`username`),
    KEY        `idx_users_remember` (`remember_token`(64))

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table des inspections
-- جدول التفتيشات
-- =============================================

CREATE TABLE IF NOT EXISTS `inspections` (
    `id`                    INT             NOT NULL AUTO_INCREMENT,
    `enseignant_id`         INT             DEFAULT NULL                 COMMENT 'المعلم المفتَّش عليه',
    `etablissement`         VARCHAR(200)    DEFAULT NULL                 COMMENT 'اسم المؤسسة',
    `annee_scolaire`        VARCHAR(20)     DEFAULT NULL                 COMMENT 'السنة الدراسية',
    `date_visite`           DATE            DEFAULT NULL                 COMMENT 'تاريخ الزيارة',
    `heure_visite`          TIME            DEFAULT NULL                 COMMENT 'ساعة الزيارة',
    `niveau`                VARCHAR(50)     DEFAULT NULL                 COMMENT 'المستوى',
    `effectif`              SMALLINT        DEFAULT NULL                 COMMENT 'عدد التلاميذ',
    `discipline`            VARCHAR(100)    DEFAULT NULL                 COMMENT 'المادة',
    `lecon`                 VARCHAR(255)    DEFAULT NULL                 COMMENT 'الدرس',
    `pages_manuel`          VARCHAR(100)    DEFAULT NULL                 COMMENT 'صفحات الكتاب المدرسي',
    `created_at`            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`            DATETIME        DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    KEY `idx_inspections_enseignant` (`enseignant_id`),
    KEY `idx_inspections_date`       (`date_visite`),

    CONSTRAINT `fk_inspections_enseignant`
        FOREIGN KEY (`enseignant_id`) REFERENCES `personal_info` (`id`) ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table des évaluations
-- جدول التقييمات
-- =============================================

CREATE TABLE IF NOT EXISTS `evaluations` (
    `id`                    INT             NOT NULL AUTO_INCREMENT,
    `inspection_id`         INT             NOT NULL                     COMMENT 'معرف التفتيش',
    `points_forts`          TEXT            DEFAULT NULL                 COMMENT 'نقاط القوة',
    `points_faibles`        TEXT            DEFAULT NULL                 COMMENT 'نقاط الضعف',
    `recommandations`       TEXT            DEFAULT NULL                 COMMENT 'التوصيات',
    `note_finale`           VARCHAR(20)     DEFAULT NULL                 COMMENT 'النقطة النهائية',
    `created_at`            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`            DATETIME        DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    KEY `idx_evaluations_inspection` (`inspection_id`),

    CONSTRAINT `fk_evaluations_inspection`
        FOREIGN KEY (`inspection_id`) REFERENCES `inspections` (`id`) ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
