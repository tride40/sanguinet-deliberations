# Sanguinet – Délibérations v0.7.0

## Cette version

La rédaction et la préparation sont utilisées par la DGS, sans circuit de transmission entre services. L’écran de rédaction affiche « Brouillon DGS » ; la valeur technique existante « Brouillon service » reste compatible avec les tables Grist. L’unité DGS est présélectionnée pour un nouveau projet lorsqu’une unité nommée DGS ou Direction générale des services existe sans ambiguïté.

Le nouveau widget Planification permet de créer et modifier une séance (date, heure de Paris, lieu, date prévue de convocation, membres en exercice), d’y affecter des projets, de les classer et de verrouiller l’ordre du jour. Aucune nouvelle colonne n’est nécessaire.

## Installation

1. Décompressez l’archive. Déposez le contenu du dossier sanguinet-deliberations à la racine du dépôt GitHub, comme précédemment. Incluez le nouveau fichier planning.html, les dossiers src et css.
2. Attendez la fin du déploiement GitHub Pages dans Actions.
3. Dans Grist, ajoutez une page avec une vue Personnalisée, associée à SEANCES_CM. Nommez-la « Planification des conseils ».
4. Choisissez URL personnalisée et renseignez :

   https://tride40.github.io/sanguinet-deliberations/planning.html?v=0.7.0

5. Autorisez l’accès complet au document. La bannière doit confirmer la connexion.
6. Dans le widget de rédaction existant, mettez à jour l’URL :

   https://tride40.github.io/sanguinet-deliberations/index.html?v=0.7.0

7. Gardez votre widget de suivi de séance. Ses fichiers sont conservés sans modification.

## Premier essai complet

1. Dans Planification, cliquez sur « Planifier un conseil ». Renseignez sa date, son heure et son lieu. Vérifiez le nombre de membres en exercice puis cliquez sur « Créer la séance ».
2. Dans Rédaction, cliquez sur Actualiser pour charger les nouvelles séances. Créez un projet et choisissez cette séance prévue, puis enregistrez. Vous pouvez aussi conserver un projet sans séance jusqu’à son affectation depuis Planification.
3. Revenez dans Planification, actualisez puis choisissez le conseil. Le projet apparaît dans « Projets disponibles » avec la mention « Fléché vers cette séance ».
4. Cliquez sur « Ajouter à l’ordre du jour ». Classez les points avec les flèches, puis cliquez sur « Enregistrer l’ordre du jour ».
5. Tant que la préparation est ouverte, les brouillons DGS restent modifiables dans Rédaction. Après modification de l’objet, du rapporteur ou du service, leur point d’ordre du jour est mis à jour au même enregistrement. Actualisez l’autre widget pour voir les changements.
6. Cliquez sur « Verrouiller l’ordre du jour » lorsque le classement est prêt. La rédaction des projets affectés à cette séance devient alors en lecture seule après actualisation ; une sauvegarde depuis un écran resté ouvert est également refusée.
7. Si nécessaire, utilisez « Rouvrir la préparation ». Cette action est refusée si la séance est indiquée comme envoyée ou tenue, si une date d’envoi de convocation est enregistrée, ou si un point a déjà un suivi de vote en cours ou validé.
8. Dans Suivi de séance, cliquez sur Actualiser puis choisissez ce conseil : ses points sont présents dans le même ordre. Vous pouvez poursuivre les essais de l’appel, des pouvoirs et des votes.

## Changer l’affectation d’un projet

- Un projet simplement fléché vers une séance peut être déplacé depuis la sélection de séance dans Rédaction. Dans Planification, « Libérer » remet son affectation à zéro sans supprimer le texte.
- Un projet inscrit à l’ordre du jour doit d’abord être retiré dans Planification, puis l’ordre du jour doit être enregistré. Il redevient disponible sans séance et peut être ajouté à un autre conseil.
- Un projet n’est jamais supprimé lorsque vous le retirez de l’ordre du jour. Les projets déjà affectés à un autre conseil ne sont pas proposés à l’ajout.
- Les points sans délibération déjà présents sont conservés et peuvent être réordonnés. Leur création et leur retrait depuis cet écran ne font pas partie de cette version.

## Périmètre et vérifications

La date de convocation est prévue manuellement. L’écran n’envoie pas de convocations, ne calcule pas de délai légal et ne génère pas encore les dossiers Word/PDF. Le verrouillage de l’ordre du jour n’est pas une validation juridique des textes.

Le mode DGS organise le travail dans les widgets. La reconnaissance du compte et les droits d’accès par personne restent à configurer plus tard dans Grist. Aucun auteur fictif n’est inscrit dans le journal.

Les enregistrements sont envoyés par lot, avec relecture des données pour détecter un écran devenu obsolète. Cela ne remplace pas un verrou serveur pour des modifications simultanées : pour ces premiers essais DGS, travaillez avec un seul opérateur à la fois.

Les tests sur une API Grist simulée, basée sur le schéma fourni, couvrent la création de séances, les heures été/hiver de Paris, l’affectation, le classement, le retrait sans suppression des projets, le changement de séance, le verrouillage et la réouverture, la synchronisation des titres avec la rédaction, les échecs d’écriture et les conflits de données. Les tests de rédaction, de tableaux et de préfixes des articles passent également. Le premier essai sur votre document réel reste à effectuer après publication.
