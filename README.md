# Suivi des interventions — IEP1

Tableau de bord et suivi des interventions menées par les conseillers pédagogiques (CPC) dans
les écoles de la circonscription : accompagnement individuel, conseils des maîtres, projets
d'école, liaisons, animations, etc.

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
   - Un seul token peut être partagé entre les 5 conseillers, le secrétariat et l'IEN, ou chacun
     peut créer le sien avec les mêmes droits — au choix.

3. **Activer GitHub Pages** sur *ce* repo (le code) : *Settings* → *Pages* → *Deploy from a
   branch* → branche `main`, dossier `/ (root)`.

4. Chaque personne, sur son navigateur, ouvre le site puis clique **⚙ Données** en haut de page
   et renseigne : compte/organisation, nom du repo privé, branche (`main`), et le token créé à
   l'étape 2. Le token reste uniquement dans le navigateur (localStorage), jamais dans le code.

Tant que rien n'est connecté, le site fonctionne quand même en **mode démo local** : les 21
écoles réelles et les types d'intervention proposés s'affichent (données de démarrage), mais
rien ne peut être enregistré durablement.

## Fonctionnement

- **Accueil** (`index.html`) : tableau de bord circonscription — indicateurs de couverture
  (% d'écoles avec accompagnement titulaire, suivi de suppléant, conseil des maîtres suivi,
  accompagnement projet d'école…), écoles peu ou jamais suivies sur la période, graphiques
  dynamiques par type et par catégorie, sélecteur d'année scolaire.
- **Écoles** (`ecoles.html` → `ecole.html`) : liste des 21 écoles groupées par type
  (maternelles / élémentaires / groupes scolaires / structures), avec une pastille indiquant la
  fraîcheur du dernier suivi. Chaque fiche école affiche ses statistiques, son historique complet
  et permet d'ajouter une intervention (type prédéfini en un clic, ou action personnalisée
  libre).
- **Conseillers** (`conseillers.html` → `conseiller.html`) : chaque intervenant (5 CPC,
  secrétariat, IEN) peut saisir une action et l'attribuer en une fois à une ou plusieurs écoles
  (ses écoles référentes pré-cochées, ou sélection libre). Un même geste crée une entrée dans
  l'historique de chaque école choisie. La page affiche aussi les dernières actions saisies par
  cet intervenant, toutes écoles confondues.
- **Types d'intervention** : liste de départ éditable (accompagnement titulaire/suppléant/T1-T3,
  suivi de stagiaire, conseils des maîtres/d'école/de cycle, projet d'école, liaisons GS-CP et
  CM2-6e, animations pédagogiques, interventions sur sollicitation…). Toute action personnalisée
  saisie une fois vient enrichir la liste proposée aux suivantes.

Chaque école a son propre fichier de données dans le repo privé (`interventions/<id>.json`), ce
qui évite les conflits entre conseillers qui saisissent en même temps sur des écoles
différentes. Chaque écriture crée un commit sur le repo de données : c'est votre historique de
sauvegardes.

## Fichiers du repo de données

- `ecoles.json` — liste des écoles (nom, type, direction, CPC référent).
- `intervenants.json` — les 5 CPC, le secrétariat, l'IEN.
- `types-intervention.json` — types d'intervention proposés (dont les types personnalisés créés
  en cours d'usage).
- `interventions/<ecoleId>.json` — historique des interventions de cette école.

## À venir (v2)

- Synthèse automatique du projet d'école par établissement (axes prioritaires, actions
  correspondantes), une fois le suivi des interventions bien installé.
