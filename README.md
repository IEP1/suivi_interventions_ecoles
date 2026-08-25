# Suivi des interventions — IEP1

Mémoire et suivi des interventions menées par les formateurs (CPC, PEMF, IAP) dans les écoles de
la circonscription : accompagnement individuel ou d'équipe, visites d'accompagnement, résidences
pédagogiques, conseils des maîtres, projets d'école, liaisons, animations, etc.

Site 100% statique (HTML/CSS/JS, aucune installation). Les données (écoles, intervenants, types
d'intervention, historique) sont stockées dans un **second repo GitHub privé**, distinct de
celui-ci, pour ne jamais exposer de données publiquement.

## Mise en service (une seule fois)

1. **Créer le repo de données privé**, par ex. `IEP1/suivi_interventions_ecoles-data`, sur
   github.com → *New repository* → cocher **Private**. Il peut rester vide, l'appli crée les
   fichiers seule au premier enregistrement.

2. **Créer un token d'accès personnel (fine-grained)** :
   github.com → *Settings* → *Developer settings* → *Personal access tokens* → *Fine-grained
   tokens* → *Generate new token*.
   - *Repository access* : seulement le repo de données créé à l'étape 1.
   - *Permissions* → *Contents* : **Read and write**.
   - Copier le token généré (il ne sera plus jamais affiché).
   - Un seul token peut être partagé entre les formateurs (CPC, PEMF), le secrétariat et l'IAP,
     ou chacun peut créer le sien avec les mêmes droits — au choix.

3. **Activer GitHub Pages** sur *ce* repo (le code) : *Settings* → *Pages* → *Deploy from a
   branch* → branche `main`, dossier `/ (root)`.

4. Chaque personne, sur son navigateur, ouvre le site puis clique **⚙ Données** en haut de page
   et renseigne : compte/organisation, nom du repo privé, branche (`main`), et le token créé à
   l'étape 2. Le token reste uniquement dans le navigateur (localStorage), jamais dans le code.

Tant que rien n'est connecté, le site fonctionne quand même en **mode démo local** : les 21
écoles réelles et les types d'intervention proposés s'affichent (données de démarrage), mais
rien ne peut être enregistré durablement.

## Fonctionnement

- **Accueil** (`index.html`) : page d'entrée neutre, avec les deux accès (Espace école, Espace
  formateurs). Le tableau de bord statistique de la circonscription a été volontairement retiré du
  menu pour l'instant (voir « Bilan de fin d'année » ci-dessous).
- **Bilan de fin d'année** (`bilan-annuel.html`) : page **non reliée au menu** — accessible
  uniquement par son URL directe, réservée à l'IAP. Reprend les indicateurs de couverture (% d'écoles
  avec accompagnement individuel, formation donnée, instance suivie, projet d'école accompagné…),
  les graphiques par type/catégorie et la répartition par formateur (bilan quantitatif), et ajoute un
  **bilan qualitatif** éditable (axes forts, points de vigilance, perspectives), à rédiger en fin
  d'année scolaire et enregistré dans `bilans/<année>.json`. Il n'existe pas de système de comptes
  sur ce site (accès par simple lien) : cette page n'est donc pas protégée techniquement, seulement
  tenue à l'écart de la navigation courante pour éviter les interprétations en cours d'année au sein
  de l'équipe de circonscription.
- **Écoles** (`ecoles.html` → `ecole.html`) : liste des 21 écoles groupées par type
  (maternelles / élémentaires / groupes scolaires / structures), avec une pastille indiquant la
  fraîcheur du dernier suivi. Chaque fiche école a deux onglets : **Suivi** (statistiques,
  graphique, historique, ajout d'une intervention) et **Structure pédagogique** (lecture seule ;
  le bouton « Modifier » ouvre `equipe.html` pour l'éditer, comme avant).
- **Thème / détail — personne suivie** : pour les types qui suivent une personne précise
  (Accompagnement individuel, Inspection/EAE), un menu déroulant propose d'abord les enseignants
  réels de l'école (issus de la structure pédagogique) au lieu de ressaisir un nom à la main ; le
  choix recopie sa valeur dans le champ texte, qui reste modifiable et sert de repli (« Autre / non
  listé… ») quand la personne n'y figure pas encore. Voir `remplirPersonneSuivie()` dans
  `js/type-selector.js`, utilisé par `ecole.html`, `conseiller.html` et `saisie-rapide.html`.
- **Espace formateurs** (`conseillers.html` → `conseiller.html`) : chaque intervenant (CPC, PEMF,
  secrétariat, IAP — CPC/PEMF/IAP sont tous des formateurs) peut saisir une action et l'attribuer
  en une fois à une ou plusieurs écoles
  (ses écoles référentes pré-cochées, sélection libre, ou onglet « Autre / pas d'école » pour une
  action sans lien avec une école précise). Un même geste crée une entrée dans l'historique de
  chaque école choisie (ou une action générale, envoyée à Google Agenda mais jamais comptée dans
  les statistiques). La page affiche les dernières actions saisies par cet intervenant, toutes
  écoles confondues, ainsi qu'un **Bilan de l'année** (répartition en % par catégorie et par type,
  école uniquement, doughnut inclus) pour préparer le bilan d'action de fin d'année.
  `conseillers.html` affiche le même bilan au niveau de l'équipe entière.
- **Lieu, au cas par cas** : le lieu n'est jamais déduit du type d'action — à chaque saisie, on
  choisit une école dans la liste, « Autre » (texte libre : DENC, domicile…) ou rien. Seules les
  actions liées à une école comptent dans les statistiques (accueil, bilans) ; les autres partent
  quand même vers Google Agenda pour garder une trace personnelle.
- **Types d'intervention** : typologie officielle à 16 valeurs, réparties en 6 catégories
  (Accompagnement, Formation, Projets et actions, Circonscription et institution, Missions
  réglementaires, Divers) — voir `js/seed-data.js`. Deux axes complémentaires, facultatifs et
  toujours saisis à côté du type : **Profil/public** (T0-T3, titulaire, remplaçant, stagiaire,
  direction — uniquement pour Accompagnement individuel/d'équipe et Inspection/EAE) et
  **Origine** (mon initiative, demande équipe/direction/IAP, commande DENC, obligation
  réglementaire — pour tous les types). Pour l'Accompagnement d'équipe, choisir le profil
  « Équipe de cycle » propose ensuite de cocher un ou plusieurs cycles concernés (Cycle 1/2/3,
  `CYCLES_ECOLE`), et choisir « Groupe » propose de cocher les enseignants concernés dans la
  structure pédagogique de l'école (repli sans cette liste si l'école n'a pas encore de structure
  renseignée, ou si plusieurs écoles sont visées à la fois). Le résultat est recopié directement
  dans le champ Profil (ex. `Groupe (Julie MARTIN, Marc DUPONT)`) — voir `rendrePrecisionEquipe()`
  et `valeurProfilAvecPrecision()` dans `js/type-selector.js`. Toute action personnalisée saisie une fois vient enrichir
  la liste proposée aux suivantes. Les anciens types (avant cette typologie) restent lisibles dans
  l'historique via `TYPES_HERITES`, sans être proposés à la nouvelle saisie. La précision d'« Instance
  d'école » inclut aussi la visite d'accompagnement (VA) et la résidence pédagogique, aux côtés des
  conseils de cycle/maîtres/école. Le champ « action personnalisée » rappelle de ne pas y noter « à
  la demande de… » (c'est le rôle du champ Origine, à l'étape suivante) — pour nettoyer les
  doublons déjà accumulés dans le repo de données, voir « Nettoyer les types personnalisés en
  double » sur `maj-listes.html` : liste chaque type personnalisé enregistré avec son nombre
  d'utilisations, et permet de le fusionner vers un type officiel (réaffecte automatiquement les
  interventions concernées) ou de le supprimer s'il n'est utilisé nulle part.
- **Intervenants** (`conseillers.html`) : ajout et suppression manuels d'intervenants (nom + rôle
  parmi conseiller pédagogique / PEMF / secrétariat / IAP). Les noms dans `SEED_INTERVENANTS`
  (`js/seed-data.js`, public) sont volontairement des noms de démonstration génériques — les vrais
  noms des formateurs ne vivent que dans `intervenants.json` du repo privé de données. Les `id`,
  eux, sont stables entre code et repo privé (ne pas les changer). `maj-listes.html` **fusionne**
  les intervenants (comme les types) : un nom déjà personnalisé dans le repo privé n'est jamais
  écrasé par le nom de démonstration du code.
- **Écoles de référence** (`conseiller.html`) : chaque intervenant peut cocher ses écoles de
  référence depuis sa propre page, pour y accéder plus vite et pré-remplir automatiquement la
  liste lors de la saisie d'une action groupée.
- **Structure pédagogique** (`equipe.html`) : accessible depuis chaque fiche école (bouton
  « Modifier »), permet de saisir/éditer l'équipe enseignante (nom, prénom, niveau de classe,
  statut, référent ou responsabilité) et le psychologue scolaire référent. Ces informations ne
  sont **jamais publiées** dans le code : elles vivent uniquement dans le repo privé de données.

Chaque école a son propre fichier de données dans le repo privé (`interventions/<id>.json`,
`equipes/<id>.json`), ce qui évite les conflits entre conseillers qui saisissent en même temps
sur des écoles différentes. Chaque écriture crée un commit sur le repo de données : c'est votre
historique de sauvegardes.

## Fichiers du repo de données

- `ecoles.json` — liste des écoles (nom, type, direction, CPC référent).
- `intervenants.json` — formateurs (CPC, PEMF), secrétariat, IAP.
- `types-intervention.json` — types d'intervention proposés (dont les types personnalisés créés
  en cours d'usage).
- `interventions/<ecoleId>.json` — historique des interventions de cette école.
- `actions-generales/<intervenantId>.json` — actions saisies par cet intervenant sans lien avec une
  école précise (réunion, administratif, formation, examen…).
- `equipes/<ecoleId>.json` — structure pédagogique de cette école (enseignants, psychologue
  référent).
- `bilans/<année>.json` — bilan qualitatif de fin d'année (axes forts, points de vigilance,
  perspectives), saisi depuis `bilan-annuel.html`.

## Pré-remplir la structure pédagogique (une seule fois)

Un fichier local `js/import-equipes.local.js` (jamais publié, voir `.gitignore`) contient la
structure pédagogique des 21 écoles extraite de "Tableau bord circonscription IEP1.xlsx". Pour
l'importer dans le repo privé :

1. Ces deux fichiers existent déjà dans votre dossier de projet local (jamais poussés sur
   GitHub, voir `.gitignore`) : `js/import-equipes.local.js` et `import.html`.
2. Lancez le site en local (`python -m http.server` à la racine du projet) et ouvrez
   `http://localhost:8000/import.html` (ou le port utilisé).
3. Connectez le repo de données via **⚙ Données** si besoin, puis cliquez
   **Importer la structure pédagogique**.
4. Le fichier source contient quelques accents mal restitués (encodage déjà abîmé dans le
   classeur d'origine) : une correction automatique a été appliquée à l'extraction, mais
   relisez chaque école ensuite (bouton **Modifier** sur sa fiche) pour corriger d'éventuelles
   coquilles.

## Saisie rapide (téléphone)

Le site complet (tableau de bord, bilans, historiques) est pensé comme un outil de **vérification
pour la hiérarchie**. Pour la saisie quotidienne sur le terrain, `saisie-rapide.html` est un
formulaire minimal (qui / quoi / où, une école à la fois, tout le reste replié sous « + Détails »)
qui écrit exactement dans les mêmes destinations que le reste de l'appli (repo privé + Google
Agenda si connecté) — juste avec beaucoup moins de gestes.

Pour l'installer comme un raccourci d'icône sur le téléphone (pas une vraie appli, pas de compte
séparé — juste un signet plein écran) :
- **iPhone (Safari)** : ouvrir `saisie-rapide.html`, bouton Partager ⬆ → « Sur l'écran d'accueil ».
- **Android (Chrome)** : ouvrir la page, menu ⋮ → « Ajouter à l'écran d'accueil ».

La personne (« Qui ») n'est demandée qu'une fois par téléphone (mémorisée dans le navigateur) —
logique puisque chacun installe son propre raccourci sur son propre téléphone.

## Google Agenda (optionnel)

Pour éviter la double saisie (l'outil pour le suivi/le chef, Google Agenda pour la DRH), chaque
intervention enregistrée dans l'appli (fiche école ou espace formateurs) peut être **automatiquement
ajoutée à votre Google Agenda** en même temps. C'est une saisie à sens unique (outil → agenda) :
l'appli n'importe jamais depuis l'agenda, elle ne fait qu'y écrire.

Mise en service (une seule fois, par personne qui veut ce lien) :

1. Sur [console.cloud.google.com](https://console.cloud.google.com), créer un projet (ou réutiliser
   un projet existant).
2. *APIs & Services* → *Bibliothèque* → activer **Google Calendar API**.
3. *APIs & Services* → *Écran de consentement OAuth* → type **Externe**, renseigner un nom
   d'application, puis dans l'onglet *Utilisateurs test*, ajouter votre propre adresse Google.
   Rester en statut **Test** suffit pour un usage personnel (pas besoin de validation par Google).
4. *APIs & Services* → *Identifiants* → *Créer des identifiants* → **ID client OAuth** → type
   **Application Web**. Dans *Origines JavaScript autorisées*, ajouter l'URL de votre site
   GitHub Pages (ex. `https://iep1.github.io`) et, pour les tests en local,
   `http://localhost:8000` (ou le port utilisé). Copier le **Client ID** généré (pas de secret à
   copier : ce type de client est public par construction, comme le token n'est jamais demandé
   côté serveur).
5. Dans l'appli, cliquer **📅 Agenda** en haut de page, coller le Client ID (l'identifiant du
   calendrier peut rester `primary` pour votre agenda principal), puis **Connecter**. Google
   affichera un écran « application non vérifiée » (normal pour un usage personnel en statut
   Test) : cliquer *Paramètres avancés* puis *Accéder à [nom de l'app] (non sécurisé)*, puis
   autoriser l'accès à l'agenda.
6. Chaque intervention créée ensuite génère un événement Google Agenda sur toute la journée,
   intitulé `École — Type : Thème` (ou juste `Type : Thème` pour une action générale sans école),
   coloré selon sa catégorie. Le jeton de connexion n'est jamais stocké : il est redemandé
   (silencieusement si possible) à chaque nouvelle session de navigateur.
7. **Pour que "Utilisation du temps" (Réglages Google Agenda → Utilisation du temps → gérer les
   libellés) régroupe automatiquement ces événements par catégorie**, associer une fois à chaque
   couleur ci-dessous le libellé correspondant (les couleurs sont fixées par l'appli, voir
   `COULEURS_GCAL_CATEGORIE` dans `js/seed-data.js` — seul le nom du libellé est à votre choix) :

   | Catégorie | Couleur Google Agenda | Libellé suggéré |
   |---|---|---|
   | Accompagnement | Peacock (bleu paon) | Accompagnement |
   | Formation | Grape (violet) | Formation |
   | Projets et actions | Basil (vert) | Projets |
   | Circonscription et institution | Blueberry (bleu marine) | Circonscription |
   | Missions réglementaires | Flamingo (rose) | Réglementaire |
   | Divers | Graphite (gris) | Divers |

   Ces couleurs sont modifiables par chacun depuis la section « Couleurs par catégorie » de la
   modale 📅 Agenda (elles restent alors propres à votre navigateur, comme le reste de la
   connexion) — utile si vous avez déjà vos propres couleurs/libellés dans Google Agenda.

## Cache navigateur (important pour les futures modifications)

Chaque `<script src="js/...">` et `<link href="css/style.css">` porte un suffixe `?v=6`. Les
navigateurs mettent ces fichiers en cache agressivement ; sans ce suffixe, une page HTML modifiée
peut charger d'anciens fichiers JS/CSS en cache et planter (erreurs `null` sur des éléments qui
n'existent plus). **À chaque modification d'un fichier dans `js/` ou `css/style.css`, augmenter
le numéro `?v=` dans tous les fichiers HTML qui le chargent.**

## À venir (v2)

- Synthèse automatique du projet d'école par établissement (axes prioritaires, actions
  correspondantes), une fois le suivi des interventions bien installé.
- Suivi des enseignants suppléants, école par école : tableau séparé (pas mêlé à l'historique
  d'interventions ni aux statistiques) à concevoir et intégrer ultérieurement.
