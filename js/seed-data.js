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
 * Intervenants pouvant saisir des interventions : les 5 conseillers
 * pédagogiques (CPC) référents des écoles ci-dessus, plus le secrétariat et
 * l'IEN (qui saisissent occasionnellement pour leur propre compte ou pour le
 * compte d'un CPC).
 */
const SEED_INTERVENANTS = [
  { id: 'cyrille', nom: 'Cyrille PHILIPPE', role: 'ien' },
  { id: 'nadia', nom: 'Nadia CAFFA', role: 'cpc' },
  { id: 'nadege', nom: 'Nadège REDON', role: 'cpc' },
  { id: 'vaea', nom: 'Vaéa DOUARCHE', role: 'cpc' },
  { id: 'stephanie', nom: 'Stéphanie MATHELON', role: 'cpc' },
  { id: 'marielouise', nom: 'Marie-Louise KAKUE', role: 'cpc' },
  { id: 'vincent', nom: 'Vincent RENAIS', role: 'cpc' },
  { id: 'mareen', nom: 'Mareen BASTIEN', role: 'secretariat' }
];

/*
 * Types d'intervention proposés au clic (liste de démarrage, éditable et
 * complétable depuis l'appli — toute action personnalisée créée par un
 * conseiller vient s'ajouter ici pour être réutilisée ensuite).
 */
/*
 * `ecole: true` = ce type est par nature lié à une école (l'appli affiche automatiquement la
 * sélection d'écoles) ; `false` = action générale, sans lien avec une école précise.
 */
const SEED_TYPES_INTERVENTION = [
  { id: 'accompagnement-titulaire', label: 'Accompagnement enseignant titulaire', categorie: 'individuel', ecole: true },
  { id: 'accompagnement-suppleant', label: 'Accompagnement enseignant suppléant', categorie: 'individuel', ecole: true },
  { id: 'accompagnement-t1t2t3', label: 'Accompagnement T0 / T1 / T2 / T3', categorie: 'individuel', ecole: true },
  { id: 'suivi-stagiaire', label: 'Suivi de stagiaire (instituts)', categorie: 'individuel', ecole: true },
  { id: 'accompagnement-direction', label: "Accompagnement direction d'école", categorie: 'individuel', ecole: true },
  { id: 'conseil-maitres', label: 'Conseil des maîtres', categorie: 'instance', ecole: true },
  { id: 'conseil-cycle', label: 'Conseil de cycle', categorie: 'instance', ecole: true },
  { id: 'conseil-ecole', label: "Conseil d'école", categorie: 'instance', ecole: true },
  { id: 'projet-ecole', label: "Accompagnement projet d'école", categorie: 'projet', ecole: true },
  { id: 'liaison-gs-cp', label: 'Liaison GS / CP', categorie: 'projet', ecole: true },
  { id: 'liaison-cm2-6e', label: 'Liaison CM2 / 6e', categorie: 'projet', ecole: true },
  { id: 'projet-pedagogique', label: 'Projet pédagogique spécifique', categorie: 'projet', ecole: true },
  { id: 'animation-pedagogique', label: 'Animation pédagogique / formation', categorie: 'formation-donnee', ecole: true },
  { id: 'groupe-travail', label: 'Groupe de travail circonscription / DENC', categorie: 'gt', ecole: false },
  { id: 'formation-recue', label: 'Formation reçue (stage, séminaire…)', categorie: 'formation-recue', ecole: false },
  { id: 'reunion', label: 'Réunion', categorie: 'reunion', ecole: false },
  { id: 'administratif', label: 'Tâche administrative / bureau', categorie: 'administratif', ecole: false },
  { id: 'examen', label: "Jury / correction d'examen", categorie: 'examen', ecole: false },
  { id: 'demande-equipe', label: "Intervention à la demande de l'équipe", categorie: 'sollicitation', ecole: true },
  { id: 'demande-direction', label: 'Intervention à la demande de la direction', categorie: 'sollicitation', ecole: true },
  { id: 'demande-ien', label: "Intervention à la demande de l'IEN", categorie: 'sollicitation', ecole: true }
];

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
  'individuel': 'Accompagnement individuel',
  'instance': 'Instance',
  'projet': 'Projet',
  'gt': 'Groupe de travail',
  'formation-donnee': 'Formation donnée',
  'formation-recue': 'Formation reçue',
  'reunion': 'Réunion',
  'administratif': 'Administratif / bureau',
  'examen': 'Jury / examen',
  'sollicitation': 'Sur sollicitation',
  'autre': 'Autre'
};

/*
 * Palette partagée par catégorie, utilisée par les graphiques (Chart.js, couleurs hex) et par le
 * connecteur Google Agenda (colorId officiel Google Calendar, 1 à 11) — voir README pour la
 * correspondance à configurer une fois côté Google Agenda ("Utilisation du temps" > libellés).
 */
const COULEURS_CATEGORIE = {
  'individuel': '#005E86',
  'instance': '#E3A429',
  'projet': '#7C9947',
  'gt': '#39B2C5',
  'formation-donnee': '#6B3FA0',
  'formation-recue': '#9B6FC9',
  'reunion': '#123C62',
  'administratif': '#5B6B78',
  'examen': '#C24B7C',
  'sollicitation': '#DC472F',
  'autre': '#8A97A3'
};

const COULEURS_GCAL_CATEGORIE = {
  'individuel': '7',        // Peacock
  'instance': '5',          // Banana
  'projet': '10',           // Basil
  'gt': '2',                // Sage
  'formation-donnee': '3',  // Grape
  'formation-recue': '1',   // Lavender
  'reunion': '9',           // Blueberry
  'administratif': '8',     // Graphite
  'examen': '4',            // Flamingo
  'sollicitation': '11',    // Tomato
  'autre': '8'              // Graphite
};
