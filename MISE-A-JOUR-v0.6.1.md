# Mise à jour 0.6.1 — verbes des articles

La sélection du type d’article ajoute le verbe correspondant devant la zone de saisie :

- Prise d’acte : De prendre acte
- Approbation : D’approuver
- Autorisation : D’autoriser
- Décision : De décider
- Fixation d’un montant ou tarif : De fixer
- Attribution : D’attribuer
- Modification : De modifier
- Abrogation : D’abroger
- Mandat donné au Maire : De donner mandat au Maire
- Disposition financière : De prévoir
- Autre : rédaction libre, en conservant la phrase existante.

Le verbe est affiché séparément, comme « Vu » et « Considérant ». La phrase complète est enregistrée dans Texte_article et figure dans l’aperçu. Un changement de type remplace le verbe reconnu et conserve la suite du texte. Les apostrophes droites et typographiques sont reconnues pour éviter les doublons. Les textes existants ne sont pas réécrits au simple chargement.

## Installation

1. Décompressez l’archive et déposez le contenu du dossier sanguinet-deliberations à la racine du dépôt GitHub, comme précédemment.
2. Attendez la fin du déploiement GitHub Pages.
3. Dans le widget de rédaction existant, remplacez son URL par :

   https://tride40.github.io/sanguinet-deliberations/index.html?v=0.6.1

Aucune modification des tables Grist n’est nécessaire. Le suivi de séance est inchangé.

## Vérification

Créez un article, sélectionnez « Autorisation » et saisissez « le Maire à signer la convention. ». L’aperçu et l’enregistrement doivent contenir « D’autoriser le Maire à signer la convention. ». Après rechargement du projet, le préfixe doit apparaître une seule fois.

Tests effectués avec une simulation de l’API Grist : changement de type, conservation du texte, retour en rédaction libre, absence de doublon, enregistrement et relecture de la phrase complète, ainsi que les vérifications de sauvegarde et de tableaux de la version précédente.
