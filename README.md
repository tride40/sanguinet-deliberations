# Sanguinet — Délibérations v0.5.3

## Changements

- Suppression du sélecteur manuel Agent de saisie. La reconnaissance du compte est reportée à une prochaine configuration. Pour les nouvelles écritures, JOURNAL_ACTIONS.Utilisateur et ORDRE_DU_JOUR.Valide_par restent sans référence (0), sans choisir un agent par défaut ni inventer une identité. Les autres données du journal et l’horodatage restent enregistrés.
- Président et secrétaire sont immédiatement visibles en tête de l’appel. Les deux sont obligatoires et doivent être marqués présents avant d’enregistrer l’appel. Un appel partiel reste enregistrable lorsque ces deux responsables sont renseignés et présents. Toute validation de point requiert aussi leur renseignement.
- Le suivi de séance ne crée plus de séance, de délibération ni de point d’ordre du jour. Il charge les séances et leurs points préparés en amont dans Grist. Les anciens enregistrements restent conservés.
- La recherche du mandataire, la présence automatique, les votes par groupes, les exceptions et le verrouillage des résultats sont conservés.

## Publier et installer

1. Décompresser l’archive.
2. Déposer le contenu du dossier sanguinet-deliberations à la racine du dépôt GitHub, en remplaçant les fichiers existants. Ne pas déposer le ZIP ni de fichier .grist.
3. Attendre la publication GitHub Pages.
4. Dans les options du widget personnalisé lié à SEANCES_CM, utiliser :

https://tride40.github.io/sanguinet-deliberations/session.html?v=0.5.3

5. Conserver l’accès complet et vérifier l’affichage Version 0.5.3.

Aucune modification des colonnes Grist nécessaire. L’URL ouverte hors Grist affiche une invitation à installer le widget ; c’est normal.

## Déroulement prévu

En amont : préparer SEANCES_CM, les projets dans DELIBERATIONS et les lignes ORDRE_DU_JOUR avec leurs liens Seance et Deliberation. La convocation et le dossier transmis aux élus relèvent de cette phase de préparation ; cette livraison ne crée pas de nouvel outil de convocation ou de constitution du dossier. Le module de rédaction existant index.html est conservé, séparément, lié à DELIBERATIONS.

Pendant la réunion : choisir la séance préparée, renseigner le président et le secrétaire puis faire l’appel. Les pouvoirs se choisissent avec recherche et marquent le mandataire présent. Enregistrer l’appel, puis saisir et valider les votes des points déjà inscrits. Après toute préparation externe de l’ordre du jour, utiliser Actualiser pour le relire. Une séance sans point affiche une indication de préparation, sans bouton de création.

## Vérifications

Tests dans un navigateur avec un pont Grist simulé reprenant le schéma fourni : ordre du jour existant chargé, absence des trois commandes agent/création de séance/ajout de point, champs président et secrétaire visibles, enregistrement refusé avec champ vide ou responsable absent, appel partiel avec responsables renseignés, présence automatique du mandataire, validation et relecture sans auteur inventé. Les premiers essais dans l’instance réelle restent nécessaires après publication.

Les règles de sauvegarde des voix et pouvoirs restent celles de la v0.5 : une voix directe utilise Elu ; une voix exercée par pouvoir utilise Elu pour le mandataire et Mandant pour l’élu représenté. Le groupe appliqué est celui de l’élu représenté. Les totaux et le résultat sont calculés à partir de ces voix ; aucun vote n’est attribué par défaut à un nouveau point.

Les écritures de validation sont envoyées ensemble. Les modifications externes détectées avant sauvegarde bloquent l’écrasement ; ce contrôle n’est pas un verrou transactionnel multi-utilisateur. Le verrouillage d’un point est ergonomique et ne remplace pas les droits Grist. Les amendements enregistrés restent à intégrer au texte dans le module de rédaction. Numérotation officielle, convocation et exports définitifs ne sont pas ajoutés par cette version.
