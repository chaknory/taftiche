-- Migration : ajout de la colonne class_note à personal_info
-- ملاحظة نصية للقسم

-- SQLite
ALTER TABLE personal_info ADD COLUMN class_note TEXT;

-- MySQL (même syntaxe)
-- ALTER TABLE `personal_info` ADD COLUMN `class_note` TEXT DEFAULT NULL COMMENT 'ملاحظة نصية للقسم' AFTER `haraka`;
