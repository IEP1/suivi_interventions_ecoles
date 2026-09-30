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
  chaque école choisie (ou une action générale, enregistrée dans l'historique mais jamais comptée
  dans les statistiques). La page affiche les dernières actions saisies par cet intervenant, toutes
  écoles confondues, ainsi qu'un **Bilan de l'année** (répartition en % par catégorie et par type,
  école uniquement, doughnut inclus) pour préparer le bilan d'action de fin d'année.
  `conseillers.html` affiche le même bilan au niveau de l'équipe entière.
- **Lieu, au cas par cas** : le lieu n'est jamais déduit du type d'action — à chaque saisie, on
  choisit une école dans la liste, « Autre » (texte libre : DENC, domicile…) ou rien. Seules les
  actions liées à une école comptent dans les statistiques (accueil, bilans) ; les autres restent
  quand même dans l'historique pour garder une trace.
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
  la demande de… » (c'est le rôle du champ Origine, à l'étape suivante).
- **Intervenants** (`conseillers.html`) : ajout et suppression manuels d'intervenants (nom + rôle
  parmi conseiller pédagogique / PEMF / secrétariat / IAP). Les noms dans `SEED_INTERVENANTS`
  (`js/seed-data.js`, public) sont volontairement des noms de démonstration génériques — les vrais
  noms des formateurs ne vivent que dans la table `intervenants` de Supabase. Les `id`, eux, sont
  stables entre code et base (ne pas les changer). Depuis le retrait de `maj-listes.html`
  (2026-09-28), la base Supabase est la seule référence : un intervenant qui quitte la
  circonscription se supprime avec la croix de sa carte (possible seulement s'il n'a aucune action
  enregistrée).
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

**Anti-pause automatique** : le plan gratuit Supabase met un projet en pause après 7 jours sans
requête. `.github/workflows/ping-supabase.yml` fait une petite lecture toutes les 3 jours pour
l'éviter — automatique, gratuit (repo public), rien à faire. Visible dans l'onglet *Actions* du
repo GitHub ; un bouton "Run workflow" y permet aussi un déclenchement manuel si besoin.

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
exactement dans les mêmes tables Supabase que le reste de l'appli.

Pour l'installer comme un raccourci d'icône sur le téléphone (pas une vraie appli, pas de compte
séparé — juste un signet plein écran) :
- **iPhone (Safari)** : ouvrir `saisie-rapide.html`, bouton Partager ⬆ → « Sur l'écran d'accueil ».
- **Android (Chrome)** : ouvrir la page, menu ⋮ → « Ajouter à l'écran d'accueil ».

La personne (« Qui ») n'est demandée qu'une fois par téléphone (mémorisée dans le navigateur) —
logique puisque chacun installe son propre raccourci sur son propre téléphone.

## Import depuis Google Agenda (`import-agenda.html`)

*Historique : l'appli a eu une connexion OAuth outil → Google Agenda (écriture automatique à
chaque intervention saisie). Retirée le 2026-09-14 : les restrictions Google Cloud rencontrées à
sa mise en service, plus l'arrivée de l'import ci-dessous (plus simple, sans OAuth), l'ont rendue
inutile — chacun remplit directement son agenda, puis l'importe.*

Les actions des formateurs finissent toutes dans leur Google Agenda (saisie directe, ou envoi
automatique depuis Poésie, l'outil obligatoire) : Google Agenda est donc la source, et cette page
y relit les visites d'école pour ne rien ressaisir. Pas de connexion OAuth (bloquée par les
restrictions de l'organisation, voir historique ci-dessus).

**Agenda connecté (depuis le 2026-09-28, méthode principale)** — chaque formateur colle **une
seule fois** l'« Adresse secrète au format iCal » de son agenda (Google Agenda → Paramètres → son
agenda → Intégrer l'agenda). Ensuite, à chaque ouverture de la page, l'agenda est relu
automatiquement, sans export :

- L'adresse est stockée dans la table `agenda_liens`, **fermée à la clé anon** (le navigateur
  peut l'écrire via `enregistrer_lien_agenda()`, jamais la relire) — elle donne accès à tout
  l'agenda de la personne.
- La lecture passe par la fonction serveur Supabase `lire-agenda`
  (`supabase/functions/lire-agenda/index.ts`), qui ne renvoie que les évènements **du 1er janvier
  à aujourd'hui** contenant un nom d'école ou un mot-clé d'intervention : les rendez-vous
  personnels ne quittent jamais le serveur (n'importe qui ayant le lien du site peut appeler la
  fonction pour n'importe quel formateur). Ses mots-clés recopient ceux de `js/import-agenda.js` :
  **à garder alignés** (redéployer la fonction après modification).
- Pour couper l'accès : bouton « Retirer » sur la page, ou « Réinitialiser » l'adresse secrète
  dans Google Agenda.

**Évènements Poésie (règle principale, 2026-10-01)** — Poésie écrit des évènements structurés :
titre `COMMUNE - Ecole : NOM` (ou `DENC : …`, `NOUMEA - Institut formation`…) et description
`Actions : - Catégorie / Sous-catégorie / Détail ( Durée… ) ( commentaire )`. Ils sont lus de
façon fiable (`analyserEvenementPoesie()` dans `js/import-agenda.js`) :

- **école** lue uniquement après « Ecole : » (jamais la commune en préfixe) ; les autres lieux
  deviennent une action sans école avec le lieu noté ;
- **type** donné par la table `POESIE_VERS_TYPE` (intitulé Poésie → type IEP1 + précision),
  validée avec l'IEP1 sur un agenda réel. Non repris : rédaction de bulletin de visite (la visite
  est déjà comptée), réunions avec des partenaires extérieurs sans école de la circonscription ;
- **thème** = commentaire libre Poésie (utile : nom de l'enseignant accompagné). Si le commentaire
  contient des mots liés aux élèves, familles ou à la santé (`MOTS_INFO_SENSIBLE`), la ligne est
  décochée et signalée « info élève / santé ? » pour être relue avant import ;
- les évènements **hors Poésie** (texte libre, souvent en double d'une entrée Poésie) sont
  masqués par défaut, jamais cochés d'office.

Tout reste modifiable ligne par ligne (école, type, précision, thème) avant import.

**Évènements saisis à la main (hors Poésie)** — pris en charge aussi, préremplis d'après leur
titre (mots-clés, ex. « EE … » → Situation particulière, « EducNum » → GT, « Cc » → Conseil de
cycle). **Filtre éducatif** : seul ce qui relève du travail éducatif remonte (mots éducatifs, sans
mot personnel type coiffeur/banque/médecin dans le titre, jamais un évènement « Privé ») — le reste
ne quitte pas le serveur et n'apparaît nulle part. **Anti-doublon Poésie** : un évènement manuel
à la même date et dans la même école qu'une action Poésie est décoché (« déjà dans Poésie ? »).

**Revue et import** — cochées d'office seulement les lignes sûres **avec une école** (les actions
sans école restent visibles mais décochées) ; une action possiblement déjà rentrée dans le suivi
(même école, même date) est **encadrée de rouge**. Champ « Afficher à partir du » prérempli avec
la date du dernier évènement importé (reprise là où on s'était arrêté). Import groupé des lignes
cochées, ou bouton **Valider** au bout de chaque ligne pour l'importer seule. Bouton **Ne pas
importer** (par ligne ou pour la sélection) : l'évènement n'est plus jamais reproposé
(`agenda_imports.ecarte`) et apparaît dans l'onglet **« Non importées »**, d'où « Remettre à
importer » le renvoie dans la liste en cas d'erreur.

**Limite Google (erreur 429)** — Google refuse temporairement les lectures trop rapprochées d'une
même adresse iCal. La fonction `lire-agenda` garde donc la dernière lecture réussie (évènements
déjà filtrés, colonnes `cache_*` d'`agenda_liens`, fermées à la clé anon) : resservie pendant
5 minutes, ou si Google refuse momentanément (la page affiche alors l'heure de cette lecture).

**Écoles hors circonscription** — une école Poésie « … - Ecole : X » absente de nos 21 écoles est
rangée dans **« Autre école (hors circonscription) »** (ligne unique de la table `ecoles`, nom réel
de l'école dans le lieu, modifiable). Aussi disponible en saisie rapide (onglet « École hors
circonscription »), dans la liste des écoles (groupe « Hors circonscription ») et comptée dans les
bilans, mais jamais dans les taux de couverture des écoles de la circonscription.

**Méthode de secours** (repliée sur la page) : déposer un fichier `.ics` exporté depuis Google
Agenda → Paramètres → son agenda → Exporter.

Ensuite, dans les deux cas :

1. Depuis l'espace formateur (**📥 Importer mon agenda**, à côté de « + Ajouter une action »),
   ouvrir la page : elle affiche directement les actions à valider.
2. L'outil détecte automatiquement, par mots-clés, l'école concernée (`js/import-agenda.js`,
   `ECOLES_MOTS_CLES_AGENDA`) et suggère un type d'intervention. Chaque ligne reste éditable
   (école, type, thème) avant import ; les lignes incertaines sont marquées **« à vérifier »**,
   décochées par défaut — rien n'est jamais enregistré sans revue.
3. Un évènement déjà importé une fois n'est plus jamais reproposé à la relecture suivante
   (table `agenda_imports`). Une ligne dont l'école et la date correspondent à une action
   déjà enregistrée reste affichée (jamais masquée) mais marquée **« doublon possible ? »** et
   décochée par défaut — ça peut très bien être une deuxième action bien réelle le même jour (ex.
   plusieurs suivis de suppléants différents dans la même école), donc c'est à vérifier au cas par
   cas plutôt que filtré automatiquement.

Cette détection est volontairement approximative (texte libre saisi par chacun) — si les mots-clés
ne suffisent pas pour votre façon de titrer vos évènements, adaptez `ECOLES_MOTS_CLES_AGENDA` /
`TYPES_MOTS_CLES_AGENDA` dans `js/import-agenda.js`.

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
