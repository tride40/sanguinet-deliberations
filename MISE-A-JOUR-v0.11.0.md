# Sanguinet – Délibérations v0.11.0

## Installation : conserver vos données et vos tests

1. Décompressez l’archive. Déposez le contenu du dossier **sanguinet-deliberations** à la racine du dépôt GitHub, en remplaçant les fichiers existants. Déposez aussi tout le dossier vendor : les nouveaux fichiers PDF.js sont nécessaires aux scans, au Word et au noir et blanc.
2. Attendez le déploiement GitHub Pages réussi.
3. Dans les widgets existants, utilisez les URL suivantes et conservez l’accès complet au document :

- Planification : https://tride40.github.io/sanguinet-deliberations/planning.html?v=0.11.0
- Rédaction : https://tride40.github.io/sanguinet-deliberations/index.html?v=0.11.0
- Préparation : https://tride40.github.io/sanguinet-deliberations/preparation.html?v=0.11.0
- Suivi de séance : https://tride40.github.io/sanguinet-deliberations/session.html?v=0.11.0

4. Ajoutez une nouvelle page Grist **Conseils terminés**, widget Personnalisé lié à **SEANCES_CM**, avec accès complet :

https://tride40.github.io/sanguinet-deliberations/archives.html?v=0.11.0

5. Rechargez les pages. Il n’est pas nécessaire de remettre les tests à zéro.

Les colonnes techniques nécessaires sont ajoutées uniquement à la première utilisation de la fonction concernée : ARTICLES.Prefixe_personnalise lors de l’enregistrement d’une expression personnalisée ; DOCUMENTS_GENERES.Empreinte_source, Nom_original et Date_archivage lors de l’archivage d’un PDF signé. Les tables existantes sont conservées. Aucune écriture n’est effectuée au seul chargement d’une page.

Si Grist signale qu’une colonne attendue contient une formule, ne remplacez pas cette formule sans examen : transmettez le message pour adapter le branchement. En particulier, les numéros officiels utilisent la colonne existante Numero_deliberation, qui doit être saisissable.

## Ajustements réalisés

- Le lieu et le nombre de membres sont proposés à la création d’un conseil, avec les valeurs par défaut. Ils restent modifiables dans Préparation avant verrouillage.
- Recherche du rapporteur par nom, insensible aux accents.
- Choix d’article « De donner mandat » et ajout de « D’abroger et de remplacer ».
- Avec « Autre », expression introductive facultative, conservée après enregistrement et présentée comme les verbes prédéfinis.
- Bouton Ajouter une annexe directement en rédaction : titre, PDF, inclusion avant/après conseil. Le projet doit d’abord être enregistré et être modifiable.
- À la fin de l’appel, une confirmation propose l’enregistrement. Le président et le secrétaire restent obligatoires et doivent être présents.
- Documents avant conseil visibles uniquement lorsque l’ordre du jour est verrouillé. Une réouverture masque le bloc.
- Destinataire de la convocation placé au-dessus du titre, aligné à droite.
- Noms de fichiers lisibles : « Dossier avant conseil - Conseil du 2026-10-28 - Couleur.pdf », par exemple. Le fichier individuel définitif inclut son numéro officiel et un extrait de son objet, jamais la référence interne de projet.
- Suppression du bloc d’annexes ressemblant à un article supplémentaire. Les renvois présents dans vos articles sont conservés.

Les textes déjà enregistrés ne sont pas réécrits silencieusement. Le doublon « De donner mandat au Maire De donner mandat… » repéré dans le test reste à corriger dans son article s’il n’a pas déjà été corrigé. Pour un conseil déjà engagé, la correction de texte peut se faire dans la table ARTICLES ; ne modifiez que le texte concerné, puis régénérez l’acte. La correction des résultats de vote passe, elle, par la réouverture explicite décrite ci-dessous.

## Avant conseil : convocation signée et annexes

1. Verrouillez l’ordre du jour.
2. Générez la convocation seule, puis faites-la signer hors application.
3. Dans Préparation, choisissez son PDF scanné dans le bloc Convocation signée, puis cliquez sur Archiver la convocation signée.
4. Générez le dossier complet : couverture, convocation signée, projets dans l’ordre du jour, puis annexes.

Si aucun PDF signé n’est archivé, la page le précise et le dossier utilise la convocation générée non signée. Si le calendrier, le lieu, la date prévue de convocation ou l’ordre du jour a changé depuis le dépôt du scan, le dossier est bloqué pour éviter de réutiliser l’ancienne convocation. Pour en refaire une, choisissez Convocation seule et cochez « Générer une nouvelle convocation non signée à faire signer ». Téléversez ensuite le nouveau scan.

Les scans sont rattachés à la séance ou à la délibération dans DOCUMENTS_GENERES. Un nouveau téléversement crée une nouvelle version ; les anciennes ne sont pas supprimées. Les références de version vérifient la cohérence des données, mais ne vérifient pas la présence ou l’authenticité d’une signature dans le scan : il faut sélectionner le bon document.

Les annexes dont la case d’inclusion correspondante est cochée sont ajoutées en fin de dossier, dans l’ordre des délibérations puis leur ordre d’annexe. Un même fichier joint plusieurs fois n’est fusionné qu’une fois. Un fichier manquant ou illisible bloque la génération plutôt que de produire un dossier incomplet.

## Lancement et clôture

Seul le prochain conseil non terminé est proposé dans Suivi de séance. Une séance déjà en cours est prioritaire. Le bouton **Lancer le conseil municipal** active l’appel, les pouvoirs et les votes ; il exige un ordre du jour verrouillé.

Après validation de tous les points, cliquez sur **Terminer le conseil municipal**, puis confirmez. Une séance suspendue doit être reprise avant la clôture. Le conseil rejoint Conseils terminés et n’apparaît plus dans les listes de planification et préparation. Le conseil suivant devient disponible.

Pour votre conseil de test dont les votes sont déjà validés, lancez simplement le conseil puis terminez-le : les votes existants sont conservés.

## Délibérations définitives

Dans Conseils terminés :

1. Choisissez la séance.
2. Renseignez et enregistrez le **numéro officiel** de chaque décision à éditer, par exemple 2026-71. L’outil contrôle les doublons dans le document, sans inventer de numéro et sans utiliser la référence interne du projet.
3. Choisissez couleur/noir et blanc et PDF/Word ou les deux.
4. Cliquez sur Exporter cette délibération ou Exporter le dossier complet.

Les actes reprennent le numéro, l’objet, la date et l’heure, le président et le secrétaire, le scrutin, les voix enregistrées (y compris abstentions et NPPV), le résultat, les textes et tableaux inclus dans l’acte définitif, ainsi que les espaces de signature.

Les votes par pouvoir sont comptés à partir des voix sauvegardées pour le point, sans recalcul à partir de l’appel actuel. Une proposition rejetée est présentée comme rejetée, sans affirmer que ses articles ont été adoptés. Les points ajournés, retirés et d’information restent visibles dans la page, sans acte définitif généré. Le dossier complet contient donc les délibérations adoptées et rejetées, avec une couverture, puis leurs annexes.

Un résultat non validé, des voix incohérentes, un numéro manquant ou dupliqué, des contenus structurés supplémentaires non pris en charge ou un amendement non intégré bloquent l’édition. L’intégration rédactionnelle des amendements reste à effectuer et à contrôler dans Grist avant d’indiquer Integre_texte_definitif. L’application ne remplace pas automatiquement les textes à partir d’un amendement libre.

## Archivage des exemplaires signés

Après impression/signature et numérisation hors application, téléversez le PDF signé dans la fiche de la délibération, sur Conseils terminés. Le statut Signé archivé, la version et le téléchargement apparaissent dans sa fiche. Les convocations signées du conseil sont également consultables sur cette page.

L’export définitif généré reste un document à faire signer ; il ne remplace jamais le scan archivé et ne réutilise pas un scan de délibération à la place du texte généré.

Une réouverture pour correction des résultats est possible depuis Conseils terminés, à condition qu’aucun autre conseil ne soit en cours. Corrigez et revalidez dans Suivi de séance, puis terminez de nouveau le conseil. Les anciens PDF signés restent dans l’historique et sont signalés lorsque leurs données ne correspondent plus à celles de l’acte. Les téléchargements déjà enregistrés sur votre ordinateur ne sont pas modifiés.

## Formats et limites précises

- Téléversement depuis les widgets : PDF lisible non chiffré, jusqu’à 30 Mo par fichier. Les annexes déjà enregistrées dans Grist doivent également être des PDF pour être fusionnées.
- PDF couleur : conservation des pages annexées, de leurs dimensions et de leur orientation. La pagination des pages générées tient compte du dossier complet ; les numéros déjà imprimés dans les scans ne sont pas effacés.
- Noir et blanc : les pages scannées et annexées sont converties en niveaux de gris. Les fichiers originaux archivés restent inchangés.
- Word : le texte généré est modifiable ; les pages des scans et annexes PDF sont insérées comme images, à leur format d’origine. Leur texte n’est pas transformé en texte Word.
- L’envoi, l’impression, la signature, la publication et la télétransmission restent hors application.
- L’identification automatique de l’agent et les droits par rôle ne sont pas encore configurés. Les protections des widgets ne remplacent pas les permissions Grist sur les tables.

## Vérifications effectuées

Tests dans le navigateur avec une API Grist simulée : création, recherche, expression personnalisée sauvegardée/rechargée, téléversement et rattachement, archivage versionné, remplacement de la convocation, fusion PDF et insertion Word, lancement/clôture, numéro obligatoire, exports individuel/complet et refus des données incomplètes. Contrôle des exports couleur et noir et blanc et des documents longs, des tableaux et des exclusions. Les PDF produits ont été examinés visuellement ; les Word ont été contrôlés structurellement, sans rendu dans Microsoft Word. Le parcours avec votre serveur Grist réel reste à vérifier après installation ; aucune donnée réelle n’a été modifiée pendant le développement.

Les transferts utilisent l’API de pièces jointes et les accès temporaires documentés par Grist : https://support.getgrist.com/api/ et https://support.getgrist.com/code/modules/grist_plugin_api/ . Les fichiers restent stockés dans votre document Grist, pas dans GitHub.
