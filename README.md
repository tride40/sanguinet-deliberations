# Version 0.5.2 — Appel progressif et recherche des mandataires

Dans les paramètres de séance, choisir l’élu puis Présent, Absent ayant donné pouvoir, ou Absent sans pouvoir. L’appel avance vers le prochain élu non renseigné ; le sélecteur permet de revenir sur toute personne.

Absent ayant donné pouvoir ouvre le choix du mandataire avec recherche par nom et prénom (sans distinction de casse ni d’accents). L’élu donnant pouvoir est exclu. Un élu portant déjà un autre pouvoir est affiché indisponible. Le mandataire choisi est marqué présent automatiquement. S’il avait lui-même donné pouvoir, son ancien pouvoir est retiré et cette modification est indiquée.

Les choix restent dans la fenêtre jusqu’au clic sur Enregistrer. L’enregistrement sauvegarde en une fois les présences et les pouvoirs, y compris la présence automatique du mandataire. Il est possible d’enregistrer un appel incomplet puis de le reprendre : les élus non renseignés ne sont pas transformés en absents. Président et secrétaire peuvent être complétés dans la section dépliable ; ils restent requis avant validation d’un vote.

Le menu Modifier un pouvoir utilise désormais le même appel et la même recherche. Pour corriger un pouvoir, sélectionner l’élu absent puis cliquer de nouveau sur Absent ayant donné pouvoir. Pour le retirer, choisir Présent ou une absence sans pouvoir. Un mandataire portant un pouvoir ne peut être marqué absent tant que ce pouvoir n’a pas été réattribué.

Aucune modification des tables Grist nécessaire. Les validations et votes déjà enregistrés restent conservés.

Tests : appel partiel puis reprise, recherche normalisée, présence automatique, pouvoir sur soi interdit, mandataire déjà chargé indisponible, réattribution, ancien pouvoir retiré, ainsi que le parcours de sauvegarde/relecture et de validation de la v0.5. Tests exécutés avec un pont Grist simulé reprenant votre schéma ; le premier essai dans votre instance reste à effectuer.

Publication : déposer le contenu du dossier sanguinet-deliberations à la racine du dépôt GitHub, y compris le nouveau fichier src/call-model.js. Attendre le succès de GitHub Pages, puis utiliser dans Grist :

https://tride40.github.io/sanguinet-deliberations/session.html?v=0.5.2

Vérifier que Version 0.5.2 apparaît dans le widget. Conserver l’accès complet au document.


# Correctif 0.5.1

Reconnaissance du niveau d’accès Grist via interaction.accessLevel, avec compatibilité access_level. Le script connecté est versionné dans son URL pour éviter un ancien fichier en cache. Aucun changement de schéma ou de données.

# Version 0.5.0 — Suivi de séance connecté

Voir INSTALLATION.md pour l’installation dans Grist et le parcours de test. session.html est maintenant la version connectée ; demo-session.html conserve la démonstration. Aucun fichier de données municipal n’est inclus.

# Sanguinet – Délibérations

Widget Grist autonome pour la rédaction et, à terme, la génération des délibérations du Conseil municipal de Sanguinet.

## Version 0.3

- Connexion au document Grist `Délibérations`.
- Lecture/écriture de `DELIBERATIONS`, `EXPOSE_MOTIFS`, `VISAS`, `CONSIDERANTS`, `ARTICLES`.
- Éditeur visuel de tableaux relié à `TABLEAUX`, `COLONNES_TABLEAUX`, `LIGNES_TABLEAUX`, `CELLULES_TABLEAUX`.
- Ajout/suppression de colonnes et lignes, choix des formats de valeurs, style, largeur, titre, note et répétition d’en-tête.
- Les tableaux sont rattachés aux articles et sauvegardés dans Grist avec le reste de la délibération.
- Mode démonstration disponible hors Grist.

## Déploiement prévu

Projet GitHub et GitHub Pages séparé de l’application de gestion des projets municipaux.


## v0.4 — Prototype Suivi de séance

Nouvelle page `session.html` :
- panneau d’ouverture de séance dans un tiroir dédié ;
- paramètres fixes masqués pendant la conduite de séance ;
- écran principal allégé par point ;
- décision Adoptée / Rejetée / Ajournée / Retirée ;
- unanimité en un clic ;
- saisie par groupes politiques ;
- saisie détaillée à la demande ;
- fonctions rares regroupées sous « Autres actions » ;
- navigation point par point et résultat calculé en direct ;
- mode démonstration autonome pour tester l’ergonomie avant connexion complète à Grist.

La connexion Grist en écriture du module de séance sera activée après validation de cette ergonomie et ajout des données nécessaires aux groupes politiques.

## v0.4.1 — Correction des actions exceptionnelles

Décompresser toute l’archive puis ouvrir `session.html` dans un navigateur récent. Aucune installation nécessaire.

- Modale et menu masqués au chargement, y compris avant exécution du script.
- Ouverture par « Autres actions », puis choix parmi les six actions.
- Titre et formulaire adaptés à chaque action.
- Fermeture par ×, Annuler, clic sur le fond, Enregistrer ou Échap.
- Navigation clavier contenue dans la modale et retour au bouton à la fermeture.

Le comportement démonstration de la v0.4 est conservé : « Enregistrer » ferme la fenêtre et affiche une confirmation simulée ; les actions ne sont pas persistées et ne sont pas écrites dans Grist.

## v0.4.2 — Votes et validation

- Cercle proportionnel : vert pour, rouge contre, orange abstention, gris non-participation. Cercle neutre sans vote ; chiffre rouge si décision rejetée.
- Pastille verte « Validé » et consultation en lecture seule après validation.
- « Modifier le résultat » autorise une correction, puis « Valider les modifications » la confirme ; « Annuler la modification » restaure le résultat validé.
- Quitter un point en cours de correction abandonne la correction non validée.
- Résultats et brouillons distincts pour chaque point pendant la session. La navigation seule ne valide aucun point.
- Les premiers points prévalidés sont des exemples fictifs. Les données restent en mémoire : recharger la page réinitialise cette démonstration, sans écriture Grist.

## v0.4.3 — Des groupes aux exceptions individuelles

Deux choix : Unanimité ou Par groupes. Après le vote des groupes, « Ajuster les votes individuels » affiche les élus avec le vote hérité de leur groupe. Les exceptions sont conservées quand le panneau est masqué ou le vote du groupe modifié ; « Suivre le groupe » retire une exception. Revenir à Unanimité remet tous les votes à Pour et efface les exceptions.

Les groupes et les détails utilisent désormais le même ensemble de votants fictifs (25 par défaut), pour conserver les totaux lors de l’ouverture des détails. Les effectifs affichés sont ceux des votants de la démonstration, selon sa répartition fictive. Le détail reste consultable après validation, en lecture seule.

## v0.4.4 — Résultat automatique

Bouton bleu renforcé pour les exceptions individuelles. Le choix manuel Adoptée/Rejetée est remplacé par « Soumis au vote » ; Ajournée et Retirée restent disponibles.

Résultat recalculé à chaque vote de groupe ou exception : unanimité si au moins une voix pour et aucune contre (unanimité des suffrages exprimés), majorité si pour > contre, rejet si contre > pour. Abstentions et non-participations sont affichées séparément. En cas d’égalité, le départage doit être renseigné (voix prépondérante du président, sauf scrutin secret) ; aucun suffrage exprimé laisse le résultat en attente. La validation est bloquée tant que le résultat est incomplet. Le choix de départage est effacé si les votes changent.

Règle : article L2121-20 du CGCT — https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000053152931/
