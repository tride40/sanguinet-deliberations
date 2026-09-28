# Sanguinet – Délibérations v0.10.2

## Ajustements simples réalisés

- Un bouton « Programmer un conseil » ouvre le formulaire de création uniquement à la demande.
- Le jour et l’heure disposent de deux champs distincts, avec l’indication de l’heure locale de Paris.
- Le bouton de sauvegarde distingue « Créer le conseil » et « Enregistrer la nouvelle date ».
- Après enregistrement, le formulaire se referme et le conseil apparaît dans la liste.
- Chaque fiche de conseil provisoire propose directement « Confirmer la date » et « Modifier la date ».
- Une date confirmée reste protégée. « Voir la date confirmée », puis « Rendre la date modifiable » permet de la repasser explicitement en prévision avant modification.
- « Fermer » abandonne la saisie après confirmation lorsqu’elle a changé, sans enregistrer de nouvelle date.
- Les boutons et les titres s’adaptent aux widgets étroits. Les colonnes de préparation passent sur une seule colonne quand la place manque.
- Les bandeaux de planification et de préparation ne restent plus superposés au contenu lors du défilement.

La création, les contrôles et les journaux utilisent les règles existantes. Une séance envoyée ou commencée reste protégée. La confirmation de la date reste indépendante du verrouillage de l’ordre du jour.

## Installation

Déposez le contenu du dossier sanguinet-deliberations à la racine du dépôt GitHub. Après le déploiement, mettez à jour les URL des deux widgets :

Planification des conseils :

https://tride40.github.io/sanguinet-deliberations/planning.html?v=0.10.2

Préparation du conseil :

https://tride40.github.io/sanguinet-deliberations/preparation.html?v=0.10.2

Conservez l’accès complet au document. Aucune modification des tables Grist n’est nécessaire.

## Vérifications

Tests réussis avec l’API Grist simulée : création, confirmation, réouverture, annulation sans écriture, sauvegarde d’une nouvelle date sans modifier les autres paramètres du conseil ni son ordre du jour. Le parcours sujet → rédaction → préparation → suivi de séance passe toujours. Les débordements horizontaux et les limites des boutons ont été vérifiés à 380, 600, 920 et 1 200 pixels. Contrôle visuel des deux pages sur grands et petits écrans.

Les fichiers de génération des documents, de rédaction et de suivi de séance sont identiques à ceux de la v0.10.1.

## Travaux conservés pour plus tard

- Lancement explicite du seul prochain conseil, puis clôture avant lancement du suivant.
- Page Archives et classement des conseils et des documents.
- Identification de l’agent connecté et droits par rôle.
- Documents définitifs après vote, dossiers après conseil et conservation des exemplaires signés et télétransmis.

L’envoi, l’impression pour signature et la télétransmission restent effectués hors application.
