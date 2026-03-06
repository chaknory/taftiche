# Taftiche - البطاقة الشخصية لأستاذ اللغة العربية

Application web de gestion des fiches personnelles des enseignants de langue arabe, développée pour la Direction de l'Éducation de la wilaya de Biskra — Inspection de l'Enseignement Primaire.

## Structure du projet

```
project/
├── index.html            # Page principale (formulaire)
├── css/
│   └── style.css         # Feuille de styles
├── js/
│   └── app.js            # Logique côté client
├── api/
│   ├── config.php        # ← Configuration de la base de données (SQLite / MySQL)
│   └── submit.php        # Traitement et enregistrement des données
└── database/
    ├── schema.sql         # Schéma SQLite (local)
    └── schema_mysql.sql   # Schéma MySQL  (production)
```

## Fonctionnalités

- Formulaire de saisie des informations personnelles des enseignants
- Interface en langue arabe (RTL)
- Envoi et enregistrement des données via PHP
- Base de données configurable : **SQLite** (local) ou **MySQL** (production)

## Prérequis

- Serveur web (Apache / Nginx) ou serveur PHP intégré
- PHP 7.4 ou supérieur avec les extensions `pdo_sqlite` et/ou `pdo_mysql`
- MySQL 8.0+ / MariaDB 10.5+ (en production uniquement)

---

## Configuration de la base de données

Tout se passe dans **`api/config.php`**. Une seule ligne à modifier :

```php
define('DB_DRIVER', 'sqlite');   // 'sqlite' → local | 'mysql' → production
```

### Mode SQLite (développement local)

Aucune configuration supplémentaire. La base de données est créée automatiquement
dans `database/personal_info.sqlite` au premier appel.

### Mode MySQL (hébergement de production)

1. Créez la base de données chez votre hébergeur (ex. via phpMyAdmin).
2. Importez le schéma MySQL :
   ```bash
   mysql -u utilisateur -p nom_de_la_base < database/schema_mysql.sql
   ```
3. Renseignez les identifiants dans `api/config.php` :
   ```php
   define('DB_DRIVER',        'mysql');
   define('DB_MYSQL_HOST',     'localhost');
   define('DB_MYSQL_PORT',     '3306');
   define('DB_MYSQL_DBNAME',   'nom_de_la_base');
   define('DB_MYSQL_USER',     'utilisateur');
   define('DB_MYSQL_PASSWORD', 'mot_de_passe');
   ```

> **Conseil :** ne commitez jamais `api/config.php` avec de vrais identifiants.
> Ajoutez-le à `.gitignore` ou utilisez des variables d'environnement en production.

---

## Installation locale (SQLite)

1. Cloner le dépôt dans le répertoire de votre serveur web (ex. `htdocs` ou `www`).
2. S'assurer que `DB_DRIVER` vaut `'sqlite'` dans `api/config.php`.
3. Lancer le serveur PHP intégré depuis la racine du projet :
   ```bash
   php -S localhost:8000
   ```
4. Accéder à l'application via `http://localhost:8000/`.

## Installation en production (MySQL)

1. Uploader les fichiers sur le serveur.
2. Importer `database/schema_mysql.sql` dans votre base MySQL.
3. Configurer `api/config.php` avec `DB_DRIVER = 'mysql'` et vos identifiants.
4. Accéder à l'application via l'URL de votre hébergeur.

## Utilisation

Remplir tous les champs du formulaire puis soumettre. Les données sont enregistrées dans la base de données via `api/submit.php`.