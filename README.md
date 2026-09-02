# Suivi des interventions — IEP1

Mémoire et suivi des interventions menées par les formateurs (CPC, PEMF, IAP) dans les écoles de
la circonscription : accompagnement individuel ou d'équipe, visites d'accompagnement, résidences
pédagogiques, conseils des maîtres, projets d'école, liaisons, animations, etc.

Site 100% statique (HTML/CSS/JS) hébergé sur **Netlify** (gratuit, uniquement pour l'hébergement —
plus de fonction serveur). Les données (écoles, intervenants, types d'intervention, historique)
sont stockées dans une **base Supabase** (Postgres, gratuit à cette échelle) — voir
`supabase/schema.sql` pour les tables et `js/supabase-client.js` pour la connexion. L'appli parle
directement à Supabase depuis le navigateur avec une clé publique (`anon`), sécurisée côté serveur
par des règles d'accès (Row Level Security) plutôt que par un jeton à distribuer. Personne
(formateur, secrétariat, IAP, inspecteur de passage…) n'a besoin de "se connecter" : ouvrir le lien
du site suffit, en lecture comme en écriture. L'accès se règle uniquement en choisissant à qui on
donne ce lien.

*Historique : avant le 30/08/2026, les données vivaient dans un repo GitHub privé, lu/écrit via un
token personnel collé dans une modale "⚙ Données" — un visiteur sans token voyait silencieusement
les données de démonstration, ce qui a fait croire à un inspecteur que l'outil était vide. Un
correctif intermédiaire (proxy via une fonction serveur Netlify) a réglé l'urgence le temps de
migrer vers Supabase le 31/08/2026, architecture définitive décrite ci-dessous. Ne pas réintroduire
la modale de token GitHub : c'était la cause du bug initial.*

## Mise en service (une seule fois, par la personne référente du site)

1. **Créer un projet Supabase** (gratuit, [supabase.com](https://supabase.com)) → New project.
   Noter le mot de passe de base généré (affiché une seule fois) dans un endroit sûr.

2. **Créer les tables** : Supabase → *SQL Editor* → coller le contenu de `supabase/schema.sql` →
   *Run*. Crée les tables, active la sécurité par ligne (RLS) et ouvre l'accès lecture/écriture à
   la clé publique (`anon`) — cohérent avec le principe "accès par lien" de cette appli, sans
   compte utilisateur.

3. Dans *Project Settings* → *API Keys*, récupérer l'**URL du projet** et la clé **`anon`
   `public`** (jamais la `service_role`, réservée aux scripts d'administration). Les coller dans
   `js/supabase-client.js` (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) — ce sont des identifiants
   publics par conception, sans risque à publier dans le code.

4. **Créer un compte Netlify** (gratuit, [netlify.com](https://www.netlify.com)) puis
   *Add new site* → *Import an existing project* → connecter GitHub → choisir **ce** repo (le
   code, `suivi_interventions_ecoles`). Laisser les réglages de build par défaut (aucune commande
   de build nécessaire, c'est un site statique).

5. **Diffuser l'URL Netlify** (ex. `https://iep1-suivi.netlify.app`, personnalisable dans *Site
   configuration* → *Domain management*) aux personnes concernées — c'est ce lien, et lui seul,
   qui contrôle qui a accès à l'outil.

Le site fonctionne identiquement en local (`python -m http.server`) ou sur Netlify : les
identifiants Supabase sont dans le code, pas dépendants de l'hébergeur.

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
  doublons déjà accumulés dans la base, voir « Nettoyer les types personnalisés en
  double » sur `maj-listes.html` : liste chaque type personnalisé enregistré avec son nombre
  d'utilisations, et permet de le fusionner vers un type officiel (réaffecte automatiquement les
  interventions concernées) ou de le supprimer s'il n'est utilisé nulle part.
- **Intervenants** (`conseillers.html`) : ajout et suppression manuels d'intervenants (nom + rôle
  parmi conseiller pédagogique / PEMF / secrétariat / IAP). Les noms dans `SEED_INTERVENANTS`
  (`js/seed-data.js`, public) sont volontairement des noms de démonstration génériques — les vrais
  noms des formateurs ne vivent que dans la table `intervenants` de Supabase. Les `id`, eux, sont
  stables entre code et base (ne pas les changer). `maj-listes.html` **fusionne** les intervenants
  (comme les types) : un nom déjà personnalisé dans la base n'est jamais écrasé par le nom de
  démonstration du code.
- **Écoles de référence** (`conseiller.html`) : chaque intervenant peut cocher ses écoles de
  référence depuis sa propre page, pour y accéder plus vite et pré-remplir automatiquement la
  liste lors de la saisie d'une action groupée.
- **Structure pédagogique** (`equipe.html`) : accessible depuis chaque fiche école (bouton
  « Modifier »), permet de saisir/éditer l'équipe enseignante (nom, prénom, niveau de classe,
  statut, référent ou responsabilité) et le psychologue scolaire référent. Ces informations ne
  sont **jamais publiées** dans le code : elles vivent uniquement dans la base Supabase.

Toutes les actions (école ou générales) vivent dans une seule table `actions` (voir schéma
ci-dessous), ce qui évite les conflits entre formateurs qui saisissent en même temps sur des écoles
différentes. Chaque écriture est aussi tracée dans `journal_audit` (qui/quoi/quand/avant/après) :
c'est l'équivalent de l'historique de commits qu'offrait l'ancien système GitHub.

## Tables Supabase (voir `supabase/schema.sql` pour le détail complet)

- `ecoles` — liste des écoles (nom, type, direction, CPC référent, psychologue scolaire).
- `intervenants` — formateurs (CPC, PEMF), secrétariat, IAP.
- `types_intervention` — types d'intervention proposés (dont les types personnalisés créés en
  cours d'usage, et les anciens types retirés mais encore référencés par l'historique).
- `actions` — chaque intervention/action (école optionnelle — nulle pour une action générale sans
  lien avec une école précise, ex. réunion, administratif, formation).
- `equipe_enseignants` — structure pédagogique par école (enseignants, niveau, statut).
- `bilans_annuels` — bilan qualitatif de fin d'année (axes forts, points de vigilance,
  perspectives), saisi depuis `bilan-annuel.html`.
- `journal_audit` — historique de chaque création/modification/suppression sur la table `actions`.

**Migration future du schéma** : toute évolution (nouvelle colonne, nouvelle table, renommage
d'une valeur déjà enregistrée) se fait via un script SQL collé dans le *SQL Editor* de Supabase —
jamais en donnant un accès élevé (`service_role`) à un outil tiers en permanence. Cette clé ne sert
que ponctuellement, pour une opération en masse explicitement demandée (ex. migration initiale).

## Pré-remplir la structure pédagogique (historique, déjà fait)

`js/import-equipes.local.js` + `import.html` (jamais publiés, voir `.gitignore`) ont servi une
seule fois à importer la structure pédagogique des 21 écoles extraite de "Tableau bord
circonscription IEP1.xlsx", à l'époque du repo GitHub privé. Cet import a déjà été fait puis migré
vers Supabase le 31/08/2026 — ces fichiers datent d'avant et appellent encore directement l'API
GitHub avec un token collé sur place ; à réécrire entièrement (appels Supabase, comme
`js/data-store.js`) si un import de masse similaire devait resservir un jour.

## Saisie rapide (téléphone)

`saisie-rapide.html` est le **point d'entrée unique** pour ajouter une action au quotidien (qui /
quoi / où — une ou plusieurs écoles à la fois — / détails), aussi bien depuis le terrain que
depuis l'espace formateur (`conseiller.html` y renvoie via un lien pré-rempli `?qui=`). Elle écrit
exactement dans les mêmes tables Supabase que le reste de l'appli, plus Google Agenda si connecté.

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
   Netlify (ex. `https://iep1-suivi.netlify.app`) et, pour les tests en local,
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
