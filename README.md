# Taftiche - البطاقة الشخصية لأستاذ اللغة العربية

Application web de gestion des fiches personnelles des enseignants de langue arabe, développée pour la Direction de l'Éducation de la wilaya de Biskra — Inspection de l'Enseignement Primaire.

## Structure du projet

```
project/
├── index.html        # Page principale (formulaire)
├── css/
│   └── style.css     # Feuille de styles
├── js/
│   └── app.js        # Logique côté client
├── api/
│   └── submit.php    # Traitement et enregistrement des données
└── database/
    └── schema.sql    # Schéma de la base de données
```

## Fonctionnalités

- Formulaire de saisie des informations personnelles des enseignants
- Interface en langue arabe (RTL)
- Envoi et enregistrement des données via PHP
- Base de données SQL

## Prérequis

- Serveur web (Apache / Nginx)
- PHP 7.4 ou supérieur
- MySQL / MariaDB

## Installation

1. Cloner ou copier le projet dans le répertoire racine de votre serveur web (ex. `htdocs` ou `www`).
2. Importer le schéma de base de données :
   ```bash
   mysql -u root -p nom_de_la_base < database/schema.sql
   ```
3. Configurer les paramètres de connexion à la base de données dans `api/submit.php`.
4. Accéder à l'application via `http://localhost/project/`.

## Utilisation

Remplir tous les champs du formulaire puis soumettre. Les données sont enregistrées dans la base de données via `api/submit.php`.



Lancer le serveur PHP intégré depuis la racine du projet : php -S localhost:8000