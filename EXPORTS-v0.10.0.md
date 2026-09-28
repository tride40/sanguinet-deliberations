# Sanguinet – Délibérations v0.10.0

## Installation

1. Décompressez l’archive et déposez tout le contenu du dossier sanguinet-deliberations à la racine de votre dépôt GitHub, en remplaçant les fichiers existants. Incluez les nouveaux dossiers **vendor** et **assets** : ils sont nécessaires aux exports.
2. Attendez le déploiement réussi dans GitHub Actions.
3. Dans votre widget Grist **Préparation du conseil**, remplacez l’URL par :

   https://tride40.github.io/sanguinet-deliberations/preparation.html?v=0.10.0

4. Conservez l’accès complet au document. Aucune nouvelle table ou colonne Grist n’est nécessaire. Les autres widgets restent utilisables sans changement d’URL.

## Télécharger les documents avant conseil

Dans Préparation du conseil, sélectionnez le conseil, puis descendez jusqu’à **Documents avant le conseil**.

- **Convocation seule avec ordre du jour** : le courrier et les points inscrits dans leur ordre enregistré.
- **Ensemble des projets de délibération** : les projets inscrits à l’ordre du jour, chaque projet commençant sur une nouvelle page.
- **Dossier complet** : page de garde, convocation avec ordre du jour, puis projets.

Choisissez couleur ou noir et blanc. Cochez PDF, Word modifiable, ou les deux. Pour les documents comportant la convocation, vérifiez la date du courrier, le nom et la qualité du signataire. Le nom est prérempli depuis le maire défini dans PARAMETRES_APPLICATION si ce paramètre est renseigné. Les modifications de ces champs ne changent pas les données enregistrées dans Grist. Aucune signature manuscrite n’est ajoutée.

Cliquez sur **Préparer les téléchargements**, puis sur chaque lien de téléchargement. Les documents sont générés localement dans le navigateur, à partir des données enregistrées. Aucun envoi, aucune impression, aucune télétransmission et aucun archivage dans Grist ne sont effectués. Conservez les fichiers effectivement envoyés dans votre espace habituel.

Enregistrez vos modifications de séance ou d’ordre du jour avant de générer. Si la préparation est encore ouverte, un message rappelle qu’il s’agit d’une version de travail. Après toute modification des projets, générez à nouveau les documents. Les liens sont effacés lorsque vous changez de séance, de choix d’export ou que vous actualisez.

## Présentation

Les documents reprennent le logo, les titres sobres, le bleu #35679A et les coordonnées discrètes du modèle validé. Le Word utilise Arial ; le PDF utilise Helvetica, une police de dimensions proches, disponible directement dans le lecteur PDF. Les documents restent du texte sélectionnable, pas des captures d’écran.

La convocation n’affiche plus « Nos réf. ». Si l’ordre du jour complet tient sous le courrier, il reste sur cette page. Sinon, il commence sur la page suivante, avec un renvoi sur la page du courrier et autant de pages de continuation que nécessaire. Les points sans délibération sont conservés dans la convocation mais ne produisent pas de faux projets. La communication des décisions du maire doit donc être un point enregistré si vous souhaitez la faire figurer à l’ordre du jour ; elle n’est pas ajoutée arbitrairement.

Les exposés des motifs, visas, considérants, articles et tableaux sont repris. Les éléments explicitement exclus du dossier préparatoire ne sont pas exportés. Les notes internes et commentaires internes des lignes de tableaux ne figurent pas dans les documents. Les en-têtes des tableaux sont répétés sur les pages suivantes si l’option est activée. Les montants, pourcentages, surfaces et dates sont formatés selon les colonnes.

La variante noir et blanc convertit le logo en niveaux de gris et utilise des textes et bordures sans couleur.

## Annexes et limites explicites

Les pièces jointes ne sont pas fusionnées dans cette version. Si un projet possède des annexes, un avertissement affiche leurs titres et vous demande de confirmer que vous les joindrez séparément. Chaque projet concerné comporte alors une liste « Annexes à joindre séparément ». Sans cette confirmation, la génération des projets et du dossier complet est bloquée. La convocation seule reste disponible.

L’export est également bloqué pour un projet comportant des contenus structurés supplémentaires dans CONTENUS_ARTICLES : ils ne sont pas encore pris en charge et ne doivent pas être omis silencieusement. Une ligne de tableau trop haute pour une page, une colonne trop étroite ou un caractère non pris en charge déclenche un message explicite.

Les délibérations définitives avec leurs votes, le classement des exemplaires signés et les archives feront l’objet de l’étape suivante. Les évolutions demandées concernant le lancement du seul prochain conseil et la refonte de la saisie des dates restent à réaliser.

## Vérifications

Tests automatisés réussis avec une API Grist simulée : trois types de documents, deux variantes, deux formats ; pagination courte et longue ; tableaux sur plusieurs pages ; exclusion des notes internes et des éléments non destinés au dossier ; gestion des annexes ; refus d’un export après erreur de lecture ; absence d’écriture dans Grist. Le parcours complet de planification, rédaction, préparation et suivi de séance passe toujours. Les fichiers du suivi de séance sont inchangés.

Les PDF ont été contrôlés visuellement. Les fichiers Word sont de vrais DOCX modifiables et leur structure a été vérifiée. L’ouverture automatisée de Word n’étant pas disponible dans cet environnement, leur rendu final et leur pagination restent à contrôler dans votre Word au premier essai. Après modification manuelle d’un DOCX, sa pagination peut évoluer ; les numéros de page sont des champs Word.

Premier essai : exportez une convocation en PDF et Word, puis le dossier complet contenant votre projet de test. Vérifiez les coordonnées, le signataire, les textes et les tableaux avant usage réel.
