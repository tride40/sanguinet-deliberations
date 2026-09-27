# Sanguinet – Délibérations v0.9.0

## Installation

1. Décompressez l’archive. Déposez le contenu du dossier sanguinet-deliberations à la racine du dépôt GitHub, en remplaçant les fichiers existants. Attendez le déploiement réussi dans Actions.
2. Dans le widget Planification des conseils, utilisez cette URL :

   https://tride40.github.io/sanguinet-deliberations/planning.html?v=0.9.0

3. Dans le widget Rédaction des délibérations, utilisez cette URL :

   https://tride40.github.io/sanguinet-deliberations/index.html?v=0.9.0

4. Ajoutez une nouvelle page Grist avec une vue personnalisée, rattachée à SEANCES_CM. Nommez-la « Préparation du conseil », choisissez une URL personnalisée et saisissez :

   https://tride40.github.io/sanguinet-deliberations/preparation.html?v=0.9.0

5. Accordez l’accès complet au document à cette nouvelle vue. Conservez cet accès pour la planification et la rédaction. La planification utilise SEANCES_CM ; la rédaction utilise DELIBERATIONS.
6. Conservez votre widget Suivi de séance tel quel.

Aucune nouvelle colonne n’est nécessaire si vous avez déjà activé la planification v0.8. Les séances, sujets, délibérations, ordres du jour et votes existants sont conservés. Si la structure v0.8 manque, la planification propose son activation ; ne supprimez aucune table existante.

## 1. Planification des futurs conseils

Cette page permet uniquement de créer ou modifier la date et l’heure d’un conseil, de confirmer sa date, puis d’y prévoir des sujets avec un intitulé et une note. Une date précise est demandée, même provisoire. Une date confirmée doit être explicitement rouverte avant modification.

Les sujets peuvent être corrigés ou déplacés tant qu’ils ne sont pas reliés à une délibération et que la préparation des conseils concernés est ouverte.

Cliquer sur un sujet ouvre la rédaction avec son intitulé, sa note et le conseil présélectionnés. Aucun brouillon n’est créé à l’ouverture : il est créé et relié au sujet seulement au premier clic sur Enregistrer. Revenir à la planification sans enregistrer ne crée rien. Si le sujet possède déjà une délibération, le clic ouvre ce projet existant.

L’éditeur s’ouvre dans le widget courant. Le lien de retour ramène aux conseils programmés ; votre page Grist de rédaction séparée reste disponible.

## 2. Rédaction des délibérations

Utilisez Nouveau projet pour rédiger directement, sans sujet préalable. Vous pouvez choisir un conseil programmé ou laisser la séance vide et l’affecter plus tard.

La note d’un sujet apparaît dans la note interne de préparation. Elle reste modifiable et ne figure pas dans l’aperçu destiné aux élus. Les articles, visas, considérants et tableaux conservent leur fonctionnement.

## 3. Préparation du conseil

Cette nouvelle page sélectionne par défaut le prochain conseil programmé. Elle permet de renseigner le lieu, la date prévue de convocation et les membres en exercice, d’associer des délibérations existantes, puis de les inscrire et les classer à l’ordre du jour.

La date du conseil se modifie dans Planification. Retirer un point de l’ordre du jour ne supprime pas son projet de délibération. Le verrouillage et la réouverture de l’ordre du jour restent explicites ; une séance envoyée ou commencée reste protégée.

Le choix d’une séance dans la rédaction ne suffit pas à inscrire automatiquement la délibération à l’ordre du jour : cette inscription se fait ici.

La génération de la convocation, l’export du dossier destiné aux élus et l’archivage des actes définitifs constituent la prochaine étape. Ces fonctions ne sont pas encore disponibles dans cette version.

## 4. Suivi de séance

Le suivi conserve l’appel, les pouvoirs, les votes et leurs validations. Il retrouve l’ordre du jour préparé dans la troisième page. Ses fichiers sont identiques à ceux de la version précédente.

## Premier essai conseillé

1. Créez un conseil provisoire puis un sujet dans Planification.
2. Cliquez sur le sujet : vérifiez le titre, la note et la séance dans la rédaction.
3. Enregistrez le projet. Revenez au sujet et ouvrez-le à nouveau : le même projet doit être repris.
4. Ouvrez Préparation du conseil, inscrivez ce projet à l’ordre du jour, enregistrez le classement puis verrouillez-le.
5. Retrouvez le même ordre du jour dans Suivi de séance.

Après une modification effectuée dans une autre vue, utilisez Actualiser pour relire les données.

## Vérifications et périmètre

Les tests automatisés avec une API Grist simulée vérifient la séparation des pages, l’absence de création à l’ouverture d’un sujet, l’enregistrement conjoint du projet et de son lien, la reprise après une erreur, l’ouverture d’un projet déjà lié, la rédaction indépendante, le classement et le verrouillage de l’ordre du jour, ainsi que sa lecture par le suivi de séance. Les tests existants de rédaction, articles et tableaux passent également. Les deux pages de planification et de préparation ont été vérifiées visuellement.

Le premier essai dans votre document Grist réel reste à effectuer après publication. Cette version est destinée à l’usage DGS ; l’identification automatique de l’agent et les droits par compte seront configurés ultérieurement.
