# Correctif 0.6.2 — rédaction des articles

La liste de choix du widget affiche directement les verbes : D’autoriser, D’approuver, De prendre acte, De décider, De donner mandat au Maire, etc.

Le verbe apparaît également à l’ouverture des articles existants enregistrés sans préfixe, et figure dans l’aperçu. La phrase complète est sauvegardée au clic sur Enregistrer. Aucun enregistrement n’est effectué automatiquement au chargement.

Les phrases déjà complètes sont reconnues sans doubler le verbe. Un changement de type conserve la suite du texte. Autre permet une rédaction libre.

Aucune modification des choix de Grist n’est nécessaire. Le widget conserve les catégories historiques dans Categorie_article et accepte aussi les libellés de verbes si certains choix ont déjà été renommés.

## Installation

1. Décompressez le ZIP et déposez le contenu du dossier sanguinet-deliberations à la racine du dépôt GitHub. Remplacez notamment index.html, src/deliberation-editor.js, src/drafting.js et css/drafting.css.
2. Attendez la fin du déploiement dans Actions.
3. Dans le widget de rédaction existant, utilisez cette URL :

https://tride40.github.io/sanguinet-deliberations/index.html?v=0.6.2

Vérifiez que l’en-tête affiche Rédaction · v0.6.2 et que la liste des articles propose les verbes. Ouvrez un ancien brouillon : le préfixe doit apparaître devant son texte. Cliquez sur Enregistrer pour conserver la phrase complète dans Grist.

Le suivi de séance est inchangé. Les tests sur API Grist simulée couvrent un ancien article sans verbe, sa sauvegarde, les catégories renommées, les changements de type et l’absence de doublons.
