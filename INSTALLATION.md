# Sanguinet — Délibérations v0.5.0

## Installation, pas à pas

### 1. Mettre à jour GitHub

Décompressez toute l’archive. Dans le dépôt `tride40/sanguinet-deliberations`, utilisez Add file > Upload files pour déposer le contenu du dossier `sanguinet-deliberations` à la racine, en remplaçant les fichiers existants. Ne déposez pas le ZIP et ne déposez aucun fichier .grist.

Conservez les dossiers css et src. Les fichiers session.html et index.html doivent être directement à la racine. Validez avec Commit changes, puis attendez la coche verte de la publication GitHub Pages.

La page https://tride40.github.io/sanguinet-deliberations/session.html?v=0.5.0 affiche maintenant, hors de Grist, une invitation à l’installer dans un widget. C’est normal : les élus et séances réels ne sont accessibles qu’à travers Grist. La démonstration séparée reste disponible dans demo-session.html.

### 2. Ajouter le suivi de séance dans Grist

Dans votre document Délibérations :

1. Ajouter nouveau > Ajouter une page, puis choisir le widget Personnalisé (Custom).
2. Choisir SEANCES_CM comme table de données, même si elle est vide.
3. Dans les options du widget, choisir l’URL personnalisée et saisir :

https://tride40.github.io/sanguinet-deliberations/session.html?v=0.5.0

4. Autoriser l’accès complet au document. Il est nécessaire pour lire les différentes tables et enregistrer les votes ; aucune clé API n’est à créer ni à mettre dans GitHub.
5. Nommer cette page « Suivi de séance ».

Le message « Connecté à Grist » doit apparaître. Aucun exemple fictif n’est écrit au chargement. Le widget charge les séances depuis votre document et propose son propre sélecteur ; il ne suit pas automatiquement la ligne sélectionnée dans une autre table.

### 3. Premier test depuis un document vide

1. Choisir votre nom dans Agent de saisie. Ce champ déclare l’auteur de la saisie ; il ne remplace pas une authentification ni une règle d’accès Grist.
2. Cliquer sur Nouvelle séance ; saisir intitulé, date et heure de Paris, lieu et membres en exercice.
3. Ouvrir Voir / modifier les paramètres ; choisir président et secrétaire puis renseigner chaque élu, son groupe de séance et son éventuel mandataire. Les présences ne sont jamais déduites des votes ni remplies automatiquement comme « Présent ».
4. Enregistrer. Pour une séance de 27 membres, les 27 participations doivent être renseignées. Le module applique un contrôle de quorum ordinaire ; il ne gère pas les exceptions de nouvelle convocation sans quorum.
5. Ajouter un point > Nouvelle délibération, puis renseigner son objet. Le widget crée une délibération en brouillon et la rattache à l’ordre du jour. Il ne lui attribue pas de numéro officiel.
6. Cliquer sur Unanimité, ou choisir le vote de chaque groupe. Un nouveau point n’a aucun vote par défaut.
7. Ouvrir Saisir les exceptions individuelles si nécessaire. « Suivre le groupe » supprime une exception. Pour une non-participation, renseigner le motif.
8. Enregistrer un brouillon ou valider. Une validation enregistre les votes, groupes, décision, statut du point et journal dans un même lot d’actions Grist.
9. Actualiser le widget : retrouver les votes et la pastille verte. Cliquer sur Modifier le résultat, corriger puis revalider, ou annuler la correction.
10. Vérifier les lignes créées dans VOTES_DELIBERATIONS et le texte de Decision_apercu. Effectuer ce premier essai avant toute utilisation réelle.

Une absence de quorum, un pouvoir invalide, une saisie incomplète, une absence de suffrage exprimé ou un départage manquant bloque la validation. La validation est également bloquée pendant une suspension. Les brouillons permettent de conserver une saisie partielle.

### 4. Rédiger les délibérations

Le module de rédaction antérieur est conservé à index.html. Pour l’utiliser dans Grist, ajouter un deuxième widget personnalisé lié à DELIBERATIONS avec l’URL :

https://tride40.github.io/sanguinet-deliberations/index.html?v=0.5.0

Accorder l’accès complet et sélectionner la délibération à rédiger dans la table associée. Le raccordement de rédaction existant est conservé ; cette livraison cible le suivi de séance. La numérotation officielle et les exports définitifs ne font pas partie de ce nouveau raccordement.

## Conventions de sauvegarde

- Vote direct : Elu = élu votant, Vote_par_pouvoir = faux, Mandant vide.
- Vote par pouvoir : Elu = élu qui exerce le pouvoir, Vote_par_pouvoir = vrai, Mandant = élu représenté. La voix est regroupée selon le groupe du mandant. L’unicité porte sur l’élu représenté, pas uniquement sur Elu.
- Groupe_seance est conservé par participation ; Groupe_vote est conservé par voix. Les changements ultérieurs d’appartenance ne réécrivent pas les votes sauvegardés.
- Une exception est explicitement conservée même si le vote de groupe change. Le bouton Unanimité remet toutes les voix à Pour et retire les exceptions.
- Ajournée et Retirée suppriment les lignes de vote de ce point dans la même sauvegarde et conservent la trace précédente dans le journal.
- Les arrivées, départs et pouvoirs mettent à jour les participations et le journal. Les résultats déjà validés sont relus avec leur électorat sauvegardé.
- Les observations, suspensions et reprises sont enregistrées dans JOURNAL_ACTIONS. Les amendements vont dans AMENDEMENTS_SEANCE ; ils ne modifient pas automatiquement le texte de l’acte.

## Périmètre et limites

Cette version est une première version connectée à tester. Elle utilise le schéma du fichier transmis « Délibérations (2).grist », avec la correction finale du type Resultat_vote effectuée ensuite par l’utilisateur. Elle n’écrit pas dans les colonnes de formule du résultat.

Tests automatisés : document vide, création, présences, pouvoirs, groupes, exceptions, sauvegarde et relecture, verrouillage, correction/annulation, rejet, panne de sauvegarde, changement externe, points sans vote, les six actions exceptionnelles, suspension et conservation des résultats historiques. Les requêtes d’écriture ont été contrôlées contre les identifiants et formules de votre export. 256 combinaisons de décompte ont également été testées.

Ces tests utilisent un pont Grist simulé dans un navigateur et des données fictives anonymisées. Ils ne remplacent pas le premier essai dans votre document Grist réel ; la communication avec votre instance et le recalcul par son moteur n’ont pas été exécutés ici.

Le contrôle de modifications concurrentes relit le document avant une sauvegarde et refuse l’écrasement si un changement est détecté. Ce n’est pas un verrou transactionnel multi-utilisateur : pour les premiers tests, utilisez un seul opérateur de séance. Le bouton Modifier le résultat est un verrou ergonomique ; il n’empêche pas les modifications directes dans les tables par des utilisateurs autorisés.

La création d’une délibération et son rattachement à l’ordre du jour utilisent deux requêtes successives. Si le rattachement échoue, la délibération créée reste disponible : actualiser, puis Ajouter un point > Délibération existante à rattacher. Ne recréez pas le même projet.

En cas d’erreur de lecture juste après une sauvegarde ou de coupure réseau, vérifier les tables ou actualiser avant de réessayer une création. Le widget ne relance pas automatiquement les écritures et n’utilise pas de stockage local en remplacement de Grist.

Documentation API utilisée : https://support.getgrist.com/widget-custom/ et https://support.getgrist.com/code/interfaces/grist_plugin_api.GristDocAPI/
