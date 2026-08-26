/*
 * Données initiales, extraites de "2026 IEP1 Liste des écoles + référents
 * CPC_ DESED.xlsx" et de "Tableau bord circonscription IEP1.xlsx". Servent de
 * point de départ tant qu'aucune donnée n'a encore été enregistrée sur le
 * repo GitHub privé. Modifiables ensuite entièrement depuis l'application.
 *
 * Les id d'école reprennent volontairement ceux déjà utilisés dans le repo
 * "carrefour_des_pratiques" (mêmes établissements, mêmes clés stables).
 */

const SEED_ECOLES = [
  { id: 'bardou', nom: 'BARDOU Victorien', type: 'elementaire', direction: 'CHALUMEAU Stéphanie', cpcReferent: 'nadia' },
  { id: 'benebig', nom: 'BENEBIG Louis', type: 'elementaire', direction: 'BENOIST Viviane', cpcReferent: null },
  { id: 'cht', nom: 'CHT (Médipôle)', type: 'structure', direction: 'TENG Sonja', cpcReferent: 'vaea' },
  { id: 'clain', nom: 'CLAIN Gustave', type: 'elementaire', direction: 'DJEKIC Carole', cpcReferent: 'vincent' },
  { id: 'dorbritz', nom: 'DORBRITZ Frédéric-Louis', type: 'elementaire', direction: 'HUSSON Olivier', cpcReferent: 'vaea' },
  { id: 'dsmer', nom: 'DUMBEA-SUR-MER', type: 'elementaire', direction: 'TANAKA Kyncienta', cpcReferent: 'vaea' },
  { id: 'eepu-fong', nom: 'FONG Renée élém.', type: 'elementaire', direction: 'COURTINE Stéphane', cpcReferent: null },
  { id: 'empu-fong', nom: 'FONG Renée mat.', type: 'maternelle', direction: 'DUMAS Vanessa', cpcReferent: null },
  { id: 'eepu-mdr', nom: 'DELACHARLERIE-ROLLY Michelle élém.', type: 'elementaire', direction: 'GUIHARD Karen', cpcReferent: 'nadege' },
  { id: 'empu-mdr', nom: 'DELACHARLERIE-ROLLY Michelle mat.', type: 'maternelle', direction: 'CANTINOLLE Xavier', cpcReferent: 'nadege' },
  { id: 'dillenseger', nom: 'GS DILLENSEGER Alphonse', type: 'groupe-scolaire', direction: 'ROUMAGNE-LAVAUX Christelle', cpcReferent: 'nadia' },
  { id: 'l-de-greslan', nom: 'GS LOUISE DE GRESLAN', type: 'groupe-scolaire', direction: 'LAFENÊTRE Jérôme', cpcReferent: 'nadege' },
  { id: 'mainguet', nom: 'MAINGUET Jack', type: 'elementaire', direction: 'CHANSIGAUD Angélique', cpcReferent: 'vincent' },
  { id: 'myosotis', nom: 'LES MYOSOTIS', type: 'maternelle', direction: 'DESPINOY Emmanuelle', cpcReferent: 'nadia' },
  { id: 'niaoulis', nom: 'LES NIAOULIS', type: 'maternelle', direction: 'GUBANSKI Franck', cpcReferent: null },
  { id: 'oasis', nom: "L'OASIS", type: 'maternelle', direction: 'DOUCET Sylviane', cpcReferent: 'vincent' },
  { id: 'orangers', nom: 'LES ORANGERS', type: 'maternelle', direction: 'RIGAULT Harmony', cpcReferent: 'vincent' },
  { id: 'yahoue', nom: 'GS YAHOUE', type: 'groupe-scolaire', direction: 'GUAGENTI Karine', cpcReferent: 'nadege' },
  { id: 'petunias', nom: 'LES PETUNIAS', type: 'maternelle', direction: 'MONNIN Isabelle', cpcReferent: 'nadia' },
  { id: 's-russier', nom: 'RUSSIER Suzanne', type: 'elementaire', direction: 'GEOFFROY Pascale', cpcReferent: 'nadia' },
  { id: 'f-surleau', nom: 'SURLEAU Frédéric', type: 'elementaire', direction: 'CUGGIA Nathalie', cpcReferent: 'vaea' }
];

const TYPES_ECOLE = {
  'maternelle': 'École maternelle',
  'elementaire': 'École élémentaire',
  'groupe-scolaire': 'Groupe scolaire',
  'structure': 'Structure'
};

/*
 * Intervenants pouvant saisir des interventions : les conseillers pédagogiques
 * (CPC) référents des écoles ci-dessus, plus le secrétariat et l'IAP (qui
 * saisissent occasionnellement pour leur propre compte ou pour le compte d'un
 * CPC). CPC, PEMF et IAP sont tous des formateurs.
 *
 * Noms de démonstration volontairement génériques : les vrais noms des formateurs
 * ne vivent que dans le repo privé de données (intervenants.json), jamais ici —
 * voir la « frontière vie privée » dans le README. Les id, eux, restent stables
 * (ce sont les mêmes que dans le repo privé et dans l'historique des interventions
 * déjà enregistrées) ; ne pas les changer.
 */
const SEED_INTERVENANTS = [
  { id: 'cyrille', nom: 'IAP (démo)', role: 'iap' },
  { id: 'nadia', nom: 'CPC 1 (démo)', role: 'cpc' },
  { id: 'nadege', nom: 'CPC 2 (démo)', role: 'cpc' },
  { id: 'vaea', nom: 'CPC 3 (démo)', role: 'cpc' },
  { id: 'stephanie', nom: 'CPC 4 (démo)', role: 'cpc' },
  { id: 'marielouise', nom: 'CPC 5 (démo)', role: 'cpc' },
  { id: 'vincent', nom: 'CPC 6 (démo)', role: 'cpc' },
  { id: 'mareen', nom: 'Secrétariat (démo)', role: 'secretariat' }
];

/*
 * Types d'intervention proposés au clic (typologie officielle à 16 valeurs, éditable et
 * complétable depuis l'appli — toute action personnalisée créée par un conseiller vient s'ajouter
 * ici pour être réutilisée ensuite). Le lieu (école ou pas) n'est plus porté par le type : il se
 * choisit au cas par cas à la saisie (champ "Où ?"), car un même type peut avoir lieu à l'école ou
 * pas selon les circonstances.
 *
 * enEcole : true pour les types qui ont un sens depuis la fiche d'une école précise (ecole.html) —
 * sert uniquement à alléger la liste proposée là-bas, pas une contrainte de données (un type non
 * listé ici reste choisissable ailleurs, ex. saisie rapide ou espace conseiller).
 */
const SEED_TYPES_INTERVENTION = [
  { id: 'accompagnement-individuel', label: 'Accompagnement individuel', categorie: 'accompagnement', enEcole: true },
  { id: 'accompagnement-equipe', label: "Accompagnement d'équipe", categorie: 'accompagnement', enEcole: true },
  { id: 'instance-ecole', label: "Instance d'école", categorie: 'accompagnement', enEcole: true },
  { id: 'animation-pedagogique', label: 'Animation pédagogique', categorie: 'formation', enEcole: true },
  { id: 'formation-donnee', label: 'Formation donnée', categorie: 'formation', enEcole: true },
  { id: 'formation-recue', label: 'Formation reçue', categorie: 'formation', enEcole: false },
  { id: 'projet-ecole', label: "Projet d'école", categorie: 'projets', enEcole: true },
  { id: 'action-projet-pedagogique', label: 'Projet pédagogique', categorie: 'projets', enEcole: true },
  { id: 'liaison-intercycles', label: 'Liaison inter-cycles', categorie: 'projets', enEcole: true },
  { id: 'gt-groupe-travail', label: 'GT (Groupe de Travail)', categorie: 'circonscription', enEcole: false },
  { id: 'groupe-travail-referent', label: 'Mission référent', categorie: 'circonscription', enEcole: false },
  { id: 'reunion-circonscription', label: 'Réunion de circonscription', categorie: 'circonscription', enEcole: false },
  { id: 'inspection-eae', label: 'Inspection / EAE', categorie: 'circonscription', enEcole: true },
  { id: 'jury-correction', label: 'Jury / correction', categorie: 'reglementaire', enEcole: false },
  { id: 'redaction-sujets', label: 'Rédaction de sujets', categorie: 'reglementaire', enEcole: false },
  { id: 'situation-particuliere', label: 'Situation particulière', categorie: 'divers', enEcole: true },
  { id: 'tache-administrative', label: 'Tâche administrative', categorie: 'divers', enEcole: false }
];

/*
 * Profils/publics proposés uniquement pour les types où la distinction est utile pour les
 * statistiques (accompagnement individuel/d'équipe, inspection/EAE, instance d'école) — masqué
 * pour tous les autres.
 */
const PROFILS_PAR_TYPE = {
  'accompagnement-individuel': ['T0', 'T1', 'T2', 'T3', 'Titulaire', 'Remplaçant', 'Stagiaire', 'Direction'],
  'inspection-eae': ['T0', 'T1', 'T2', 'T3', 'Titulaire', 'Remplaçant', 'Stagiaire', 'Direction'],
  'accompagnement-equipe': ['Équipe complète', 'Équipe de cycle', 'Groupe'],
  'instance-ecole': ['Conseil de cycle', 'Conseil des maîtres', "Conseil d'école", 'Visite d\'accompagnement (VA)', 'Résidence pédagogique'],
  'liaison-intercycles': ['SG-CP', 'CM2-6ème'],
  'action-projet-pedagogique': ['Projet fédérateur', "Projet d'action de classe"]
};

/*
 * Types pour lesquels le champ « Thème / détail » a un sens (typologie officielle, colonne
 * "Comment ça se remplit") — la clé conditionne à la fois l'affichage du champ (masqué sinon,
 * ex. Réunion de circonscription qui n'en a pas) et son texte d'exemple. Affiché en plus du profil
 * pour les types qui ont les deux (ex. Projet pédagogique : profil fédérateur/classe + nom du
 * projet). Les types à « personne suivie » (TYPES_PERSONNE_SUIVIE) ont leur propre widget, pas
 * besoin d'entrée ici.
 */
const DETAIL_THEME_PAR_TYPE = {
  'animation-pedagogique': 'Ex : Différenciation en maths — quel sujet',
  'formation-donnee': 'Ex : Journée de formation Narramus — quel sujet',
  'formation-recue': 'Ex : Séminaire DENC — quel sujet',
  'projet-ecole': "Ex : Aide à l'écriture du projet — quel type d'aide",
  'action-projet-pedagogique': 'Ex : Nom du projet',
  'gt-groupe-travail': 'Ex : Nom du GT',
  'groupe-travail-referent': 'Ex : Quelle mission',
  'jury-correction': 'Ex : Quel sujet / jury',
  'redaction-sujets': 'Ex : Quel sujet',
  'situation-particuliere': 'Ex : Détails',
  'tache-administrative': 'Ex : Détails'
};

/*
 * Types qui suivent une personne précise plutôt qu'un thème général — le champ « Thème / détail »
 * y propose alors en premier les enseignants réels de l'école (structure pédagogique), avec repli
 * en texte libre (personne pas encore renseignée, stagiaire, remplaçant récent…).
 */
const TYPES_PERSONNE_SUIVIE = ['accompagnement-individuel', 'inspection-eae'];

/*
 * Cycles proposés en précision de « Équipe de cycle » (profil de l'accompagnement d'équipe) —
 * plusieurs cycles peuvent être cochés à la fois (ex. accompagnement transversal cycle 2 + 3).
 */
const CYCLES_ECOLE = ['Cycle 1', 'Cycle 2', 'Cycle 3'];

/* Origine de l'action : proposée pour tous les types, toujours facultative. */
const ORIGINES_INTERVENTION = [
  'Mon initiative',
  "Demande équipe",
  'Demande direction',
  "Demande IAP",
  'Commande DENC',
  'Obligation réglementaire'
];

/*
 * Anciens types (34 valeurs, avant le passage à la typologie à 16 ci-dessus, puis types retirés
 * ensuite), conservés uniquement comme repli d'affichage pour les interventions déjà saisies sous
 * ces id — jamais proposés à la saisie. Les id repris à l'identique dans la liste active
 * (projet-ecole, formation-recue) n'ont pas besoin d'entrée ici.
 */
const TYPES_HERITES = {
  'instruction-domicile': 'Instruction à domicile',
  'agrement': 'Agrément',
  'accompagnement-titulaire': 'Accompagnement enseignant titulaire',
  'accompagnement-suppleant': 'Accompagnement enseignant remplaçant',
  'accompagnement-t1t2t3': 'Accompagnement T0 / T1 / T2 / T3',
  'accompagnement-sortant': 'Accompagnement enseignant sortant',
  'suivi-stagiaire': 'Suivi de stagiaire (IFMNC / INSPE)',
  'accompagnement-direction': "Accompagnement direction d'école",
  'conseil-maitres': 'Conseil des maîtres',
  'conseil-cycle': 'Conseil de cycle',
  'conseil-ecole': "Conseil d'école",
  'liaison-gs-cp': 'Liaison GS / CP',
  'liaison-cm2-6e': 'Liaison CM2 / 6e',
  'projet-pedagogique': 'Projet pédagogique spécifique',
  'defis-concours-ecole': 'Défi / concours école',
  'evenement-rencontre': 'Évènement / rencontre (carrefour des pratiques…)',
  'animation-pedagogique': 'Animation pédagogique / formation',
  'groupe-travail': 'Groupe de travail circonscription / DENC',
  'dossier-referent': 'Suivi de dossier référent',
  'reunion': 'Réunion',
  'college-inspecteurs': "Collège / conseil d'inspecteurs",
  'seminaire': 'Séminaire (DENC ou autre)',
  'administratif': 'Tâche administrative / bureau',
  'inspection': 'Inspection (enseignant titulaire)',
  'eae-entretien': 'EAE / entretien (cadrage, recrutement)',
  'logistique-vehicule': 'Logistique (véhicule de service)',
  'continuite-pedagogique': 'Continuité pédagogique / gestion de crise',
  'examen': 'Jury / correction (concours, CAFIPEMF, CAPPEI…)',
  'demande-equipe': "Intervention à la demande de l'équipe",
  'demande-direction': 'Intervention à la demande de la direction',
  'demande-ien': "Intervention à la demande de l'IEN",
  'relation-famille-equipe': 'Relation direction / équipe / famille (entretien, visite de rentrée)'
};

/** Libellé d'affichage d'un typeId, y compris pour les anciens id retirés de la liste active. */
function libelleType(typeId, types) {
  const t = (types || SEED_TYPES_INTERVENTION).find(t => t.id === typeId);
  return t ? t.label : (TYPES_HERITES[typeId] || typeId);
}

/*
 * Périodes de l'année scolaire (entre les vacances), issues du calendrier officiel
 * "Année scolaire 2026.docx" fourni par la circonscription :
 * rentrée élèves 16/02, vacances 04-19/04, 06-21/06, 08-23/08, 10-25/10, été à partir du 19/12.
 * À compléter pour les années suivantes dès que leur calendrier est connu (sinon repli automatique
 * sur un découpage à peu près égal, voir bornesPeriode() dans js/stats.js).
 */
const PERIODES_SCOLAIRES = {
  2026: [
    { debut: '2026-02-16', fin: '2026-04-03' },
    { debut: '2026-04-20', fin: '2026-06-05' },
    { debut: '2026-06-22', fin: '2026-08-07' },
    { debut: '2026-08-24', fin: '2026-10-09' },
    { debut: '2026-10-26', fin: '2026-12-18' }
  ]
};

const CATEGORIES_INTERVENTION = {
  'accompagnement': 'Accompagnement',
  'formation': 'Formation',
  'projets': 'Projets et actions',
  'circonscription': 'Circonscription et institution',
  'reglementaire': 'Missions réglementaires',
  'divers': 'Divers'
};

/*
 * Anciennes catégories (avant le passage à la typologie à 16 types), reprises ici uniquement pour
 * que les interventions déjà stockées avec ces id (types-intervention.json pas encore mis à jour
 * côté repo privé, ou anciens types conservés via TYPES_HERITES) affichent la bonne couleur/le bon
 * libellé au lieu de tomber dans une couleur par défaut du navigateur/graphique.
 */
const CATEGORIES_HERITEES = {
  'individuel': 'accompagnement',
  'instance': 'accompagnement',
  'projet': 'projets',
  'gt': 'circonscription',
  'formation-donnee': 'formation',
  'formation-recue': 'formation',
  'reunion': 'circonscription',
  'administratif': 'divers',
  'examen': 'reglementaire',
  'sollicitation': 'accompagnement',
  'autre': 'divers'
};

/** Ramène n'importe quelle catégorie (actuelle ou héritée, ou vide/inconnue) vers un id valide. */
function categorieResolue(cat) {
  if (cat && CATEGORIES_INTERVENTION[cat]) return cat;
  return (cat && CATEGORIES_HERITEES[cat]) || 'divers';
}

/*
 * Palette partagée par catégorie, utilisée par les graphiques (Chart.js, couleurs hex) et par le
 * connecteur Google Agenda (colorId officiel Google Calendar, 1 à 11) — voir README pour la
 * correspondance à configurer une fois côté Google Agenda ("Utilisation du temps" > libellés).
 */
const COULEURS_CATEGORIE = {
  'accompagnement': '#005E86',
  'formation': '#6B3FA0',
  'projets': '#7C9947',
  'circonscription': '#123C62',
  'reglementaire': '#C24B7C',
  'divers': '#8A97A3'
};

const COULEURS_GCAL_CATEGORIE = {
  'accompagnement': '7',   // Peacock
  'formation': '3',        // Grape
  'projets': '10',         // Basil
  'circonscription': '9',  // Blueberry
  'reglementaire': '4',    // Flamingo
  'divers': '8'            // Graphite
};
