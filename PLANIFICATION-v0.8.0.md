# Sanguinet – Délibérations v0.8.0

## Installation

1. Décompressez le ZIP et déposez le contenu du dossier sanguinet-deliberations à la racine de votre dépôt GitHub, comme précédemment. Attendez la réussite du déploiement dans Actions.
2. Dans le widget Planification des conseils, utilisez :

   https://tride40.github.io/sanguinet-deliberations/planning.html?v=0.8.0

3. Dans le widget Rédaction des délibérations, utilisez :

   https://tride40.github.io/sanguinet-deliberations/index.html?v=0.8.0

4. Conservez l’accès complet au document pour les deux widgets. Ne changez pas le widget de suivi de séance.
5. À la première ouverture de Planification, cliquez sur « Activer la nouvelle planification ». Ce bouton ajoute uniquement les éléments manquants :

   - la colonne de données Date_confirmee (Bool) dans SEANCES_CM ;
   - la table SUJETS_PREVISIONNELS, avec Seance (référence à SEANCES_CM), Intitule (texte), Note (texte), Deliberation (référence à DELIBERATIONS).

   Les séances, projets, textes et votes existants sont conservés. L’activation peut être relancée sans recréer les éléments déjà présents. Si un champ de même nom existe avec un autre type, le widget indique le problème et ne le modifie pas automatiquement.

Les séances existantes sont affichées avec une date provisoire tant que vous ne la confirmez pas ; leur date et leur ordre du jour ne sont pas modifiés par l’activation. Un compte disposant des droits de modification de structure du document doit effectuer cette activation. Si Grist la refuse, transmettez le message affiché : ne supprimez aucune table existante.

## Deux parties dans la planification

### 1. Prévoir un conseil municipal

Créez le conseil à une date précise, même provisoire. Le formulaire conserve les champs date et heure de Paris, lieu, date prévue de convocation et membres en exercice.

« Confirmer la date du conseil » fixe la date. « Modifier la date confirmée » la repasse explicitement en prévision pour permettre son changement, tant que la séance n’a pas été envoyée ou commencée.

Cette confirmation est indépendante du verrouillage de l’ordre du jour : confirmer la date ne verrouille ni les sujets ni les textes. La date et les informations de séance peuvent encore être révisées avant envoi, même si l’ordre du jour est verrouillé, sans modifier son contenu.

### 2. Conseils programmés

Chaque carte affiche la date provisoire ou confirmée, le lieu et les éléments associés :

- « À rédiger » : un sujet prévisionnel avec son intitulé et sa note ;
- « En rédaction » : un brouillon de délibération ;
- « À l’ordre du jour » : une délibération déjà inscrite comme point ;
- les autres états existants, le cas échéant.

« Préparer ce conseil » sélectionne la séance pour modifier ses informations et organiser son ordre du jour. La liste des points et leur classement restent disponibles sous les cartes.

## Les trois parcours de rédaction

### Anticiper un sujet

Dans la carte d’un conseil, cliquez sur « Sujet à prévoir ». Renseignez par exemple « Renouvellement de la convention avec l’association… » et ajoutez une note : échéance, documents à demander, points à vérifier.

Ce sujet reste distinct des délibérations et n’est pas ajouté à l’ordre du jour. « Modifier / déplacer » permet de corriger sa fiche ou de choisir un autre conseil dont la préparation est ouverte.

« Commencer la rédaction » crée un brouillon avec son intitulé, sa séance et sa note interne, puis ouvre l’éditeur. La fiche est reliée au brouillon ; elle ne crée pas un deuxième sujet visible dans la carte. Le lien évite de recréer un brouillon si la même fiche est ouverte de nouveau. La fiche d’origine reste conservée dans SUJETS_PREVISIONNELS.

La note apparaît dans « Note interne de préparation » dans la rédaction. Elle est enregistrée dans Observations_internes et ne figure pas dans l’aperçu de la délibération. Vous pouvez la compléter au cours du travail.

### Rédiger directement pour un conseil

Cliquez sur « Rédiger une délibération » dans la carte du conseil. L’éditeur s’ouvre avec la séance déjà choisie. Aucun sujet prévisionnel n’est nécessaire et aucun enregistrement n’est créé avant le clic sur Enregistrer.

### Rédiger sans séance

Cliquez sur « Rédiger sans séance » ou utilisez « Nouveau projet » dans votre widget de rédaction. Laissez la séance vide et enregistrez le brouillon.

Le projet apparaît dans « Délibérations sans séance ». Vous pourrez l’ouvrir ou cliquer sur « Affecter à un conseil » plus tard. Cette affectation le place dans la carte de la séance, sans l’inscrire automatiquement à l’ordre du jour.

Les boutons de rédaction ouvrent l’éditeur dans le widget courant. « Retour aux conseils programmés » ramène à la planification. Votre widget de rédaction séparé reste utilisable. Après un changement dans un autre widget, cliquez sur Actualiser.

## Ordre du jour et protections

L’inscription à l’ordre du jour reste une action explicite, distincte du simple choix d’une séance. Le classement, le retrait d’un point sans supprimer le projet, le verrouillage et la réouverture fonctionnent comme auparavant.

Une séance verrouillée ne reçoit plus de nouveaux sujets ni de nouvelles affectations. Les séances envoyées ou comportant un suivi de vote en cours ou validé restent protégées. Les règles d’accès par compte et l’identification automatique de l’agent restent à configurer plus tard ; cette version est destinée à l’usage DGS.

## Vérifications effectuées

Tests avec une API Grist simulée à partir du schéma fourni : activation initiale et reprise après erreur sans doublon, conservation des données existantes, date provisoire et confirmation indépendante de l’ordre du jour, création et déplacement d’un sujet, conversion unique en brouillon, conservation de la note interne, rédaction directe avec ou sans séance, affectation ultérieure, navigation entre les écrans et verrouillage.

Les tests de rédaction, d’articles et de tableaux passent également. L’affichage a été vérifié sur grand écran et écran étroit. Le suivi de séance n’a pas été modifié. Le premier essai sur votre document Grist réel reste à effectuer après installation.

Comme dans les versions précédentes, une relecture avant sauvegarde détecte les données devenues obsolètes. Ce contrôle ne remplace pas un verrou serveur : gardez un seul opérateur pendant les premiers essais.
