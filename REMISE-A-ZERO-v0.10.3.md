# Outil temporaire de remise à zéro — v0.10.3

Le reste de l’application reste identique à la v0.10.2. Cette version ajoute uniquement reset.html, son script, son style et sa logique de suppression.

## Installation

1. Décompressez l’archive, ouvrez le dossier sanguinet-deliberations et déposez son contenu à la racine de votre dépôt GitHub, comme pour les versions précédentes. Attendez le déploiement réussi.
2. Téléchargez une sauvegarde complète de votre document Grist au format .grist. Ne déposez pas cette sauvegarde ni les documents de test dans le dépôt public.
3. Dans Grist, ajoutez une page temporaire avec un widget personnalisé, lié à SEANCES_CM, avec accès complet au document.
4. Utilisez cette URL :

https://tride40.github.io/sanguinet-deliberations/reset.html?v=0.10.3

5. Cliquez sur Analyser. Vérifiez les comptes, cochez la confirmation de sauvegarde, recopiez EFFACER LES TESTS, puis lancez la suppression.
6. Attendez le message final. Rechargez les autres widgets. Retirez la page temporaire quand elle n’est plus utile (ne supprimez pas la table SEANCES_CM).

Aucune nouvelle colonne n’est nécessaire. Les URL des widgets de travail restent inchangées.

## Périmètre

Conservés : ELUS, GROUPES_POLITIQUES, AGENTS, UNITES_ORGANISATIONNELLES, AFFECTATIONS, PARAMETRES_APPLICATION, SEQUENCES_NUMEROTATION, MODELES_DOCUMENTS. Toutes les autres tables non prévues explicitement sont également laissées intactes.

Vidés : séances, participations et pouvoirs, projets et leurs exposés/visas/considérants/articles, tableaux et cellules, annexes, validations, amendements, votes individuels et de groupes, documents générés, ordre du jour, sujets prévisionnels et journal d’actions. Les séances verrouillées et les votes validés sont inclus : cet outil remet l’environnement de test à zéro.

Les tables, colonnes, formules et pages sont conservées. La numérotation n’est pas réinitialisée. Le stockage des pièces jointes n’est pas purgé ; seules les lignes associées sont effacées.

L’ouverture et l’analyse ne modifient rien. La suppression est une demande groupée à Grist, limitée à une liste fixe de tables. Un changement détecté entre l’analyse et la vérification finale oblige à recommencer l’analyse. Cette vérification ne constitue pas un verrou multi-utilisateur : ne saisissez rien en parallèle et fermez les autres widgets de saisie pendant l’opération.

Si une table conservée possède un lien de données vers une table à effacer, l’analyse est bloquée pour examiner ce lien. Une erreur après envoi de la demande nécessite une vérification dans Grist ; l’outil ne relance jamais automatiquement la suppression.

## Scénario

Ouvrez le fichier HTML du scénario sur votre ordinateur : chaque champ possède un bouton Copier. La version Markdown contient les mêmes textes. Dix projets sont adaptés du PDF du 28 mai ; la séance de test est fixée au 28 octobre 2026 à 18 h 30. Le scénario est fourni séparément pour éviter de publier ces contenus dans le dépôt GitHub.
