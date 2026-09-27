# Sanguinet – Délibérations v0.6.0

## Installation de la page de rédaction

1. Décompressez l’archive. Ouvrez le dossier `sanguinet-deliberations`.
2. Dans votre dépôt GitHub `tride40/sanguinet-deliberations`, déposez son contenu à la racine : les fichiers HTML, les dossiers `src` et `css`, et la documentation. Ne déposez ni le ZIP ni le dossier parent. Validez le dépôt des fichiers.
3. Attendez la coche verte du déploiement dans l’onglet Actions de GitHub.
4. Dans Grist, ajoutez une nouvelle page avec un widget personnalisé, rattaché à la table `DELIBERATIONS`. N’écrasez pas votre widget de suivi de séance.
5. Choisissez l’URL personnalisée suivante :

   https://tride40.github.io/sanguinet-deliberations/index.html?v=0.6.0

6. Accordez l’accès complet au document. La bannière doit indiquer « Connecté à Grist — rédaction des projets de délibérations ».
7. Nommez la page « Rédaction des délibérations ».

## Premier essai

- Cliquez sur « Nouveau projet », renseignez l’objet et choisissez le service rédacteur. La DGS figure dans la même liste que les autres unités, selon votre référentiel Grist.
- La séance et le rapporteur peuvent être renseignés plus tard. Seul l’objet est nécessaire pour enregistrer un brouillon.
- Ajoutez les paragraphes de l’exposé des motifs, les visas, les considérants et les articles. Les lignes peuvent être réordonnées par glisser-déposer.
- Dans un article, « Insérer un tableau » ouvre la saisie des colonnes et lignes. « Enregistrer le tableau » le conserve dans votre brouillon à l’écran ; cliquez ensuite sur « Enregistrer » pour sauvegarder tout le projet dans Grist.
- « Voir l’aperçu complet » affiche le projet avec ses tableaux, sans résultat de vote ni signatures.
- Retrouvez votre texte dans « Reprendre un projet ». Une recherche par objet permet de filtrer la liste.
- Rechargez la page, sélectionnez le projet et vérifiez que vos textes et tableaux sont conservés.

## Périmètre de cette version

La page permet de créer et modifier les brouillons, y compris ceux rédigés par la DGS. Elle utilise les tables existantes et n’exige pas de nouvelle colonne. L’auteur n’est pas choisi manuellement et reste non renseigné dans le journal tant que la reconnaissance du compte n’est pas configurée.

Les projets engagés dans le circuit de validation ou déjà liés à l’ordre du jour sont affichés en lecture seule. Les projets au statut « Corrections demandées » sont modifiables s’ils ne sont pas déjà inscrits à l’ordre du jour. Aucun point n’est ajouté automatiquement à l’ordre du jour.

Le contrôle de complétude est indicatif : il ne bloque pas la sauvegarde d’un brouillon. Il ne constitue pas un contrôle juridique.

Le circuit de transmission et de contrôle DGS, la préparation de l’ordre du jour et du dossier, les exports Word/PDF et l’ajout de pièces jointes depuis le widget seront développés séparément. Les annexes déjà liées apparaissent par leur titre ; leurs fichiers restent gérés dans la table ANNEXES de Grist. L’aperçu est un outil de relecture, pas encore la mise en page définitive des actes.

Les projets contenant des éléments dans la table CONTENUS_ARTICLES sont protégés en lecture seule ; leur aperçu est indisponible dans cette version, pour ne pas présenter un texte incomplet. L’éditeur utilise actuellement le texte principal de chaque article et ses tableaux.

Le suivi de séance reste dans `session.html`, à sa version 0.5.3. Ses scripts et styles ne sont pas modifiés.

## Essai local et fiabilité

Vous pouvez ouvrir `index.html` localement pour essayer la rédaction, les tableaux et l’aperçu. La sauvegarde est désactivée hors de Grist : les saisies locales ne sont pas conservées après fermeture.

Les modifications du projet et de ses contenus sont envoyées dans un seul lot Grist. Avant l’enregistrement, une relecture détecte les modifications intervenues depuis l’ouverture du projet. En cas de conflit, le widget conserve votre saisie à l’écran sans écraser les données de Grist. Copiez vos passages avant d’actualiser.

Cette vérification n’est pas un verrou serveur entre plusieurs rédacteurs simultanés. Pour les premiers essais, évitez de modifier le même projet en parallèle. Les contrôles de lecture seule de l’interface ne remplacent pas les règles d’accès Grist, qui seront à configurer avec la reconnaissance des comptes.

Les tests automatisés couvrent la création, les tableaux, leur suppression, la reprise de brouillons, les erreurs d’écriture, les modifications concurrentes et les droits d’accès, avec une simulation de l’API basée sur le schéma de votre fichier Grist. Un premier enregistrement dans votre document réel reste à vérifier après installation.
