--sqlite insert
-- Inspecteurs
INSERT INTO inspecteur (matricule, nom, prenom, email)
VALUES 
 ('I001', 'Dupont', 'Alice', 'alice.dupont@ac-exemple.fr'),
 ('I002', 'Martin', 'Karim', 'karim.martin@ac-exemple.fr');

-- Districts (responsable = inspecteur I001)
INSERT INTO district (numero, ville, responsable_inspecteur_id)
SELECT 'D-93-01', 'Saint-Denis', id_inspecteur
FROM inspecteur WHERE matricule='I001';

-- Collèges
INSERT INTO college (numero, nom, id_district)
SELECT 'C-9301-01', 'Collège Jean Jaurès', d.id_district
FROM district d WHERE d.numero='D-93-01';

-- Écoles
INSERT INTO ecole (nom, code_uai, ville, id_college)
SELECT 'École Élémentaire Victor Hugo', '0931234A', 'Saint-Denis', c.id_college
FROM college c WHERE c.numero='C-9301-01';

-- Inspection (inspecteur I002 inspecte l’école)
INSERT INTO inspection (id_ecole, id_inspecteur, date_visite, type, statut, rapport, note_globale)
SELECT e.id_ecole, i.id_inspecteur, '2026-04-10', 'annuelle', 'planifiée',
       'Préparation des documents OK.', 4.5
FROM ecole e CROSS JOIN inspecteur i
WHERE e.code_uai='0931234A' AND i.matricule='I002';