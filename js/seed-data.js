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
 * Types d'intervention proposés au clic (typologie officielle à 16 valeurs, éditable et
 * complétable depuis l'appli — toute action personnalisée créée par un conseiller vient s'ajouter
 * ici pour être réutilisée ensuite). Le lieu (école ou pas) n'est plus porté par le type : il se
 * choisit au cas par cas à la saisie (champ "Où ?"), car un même type peut avoir lieu à l'école ou
 * pas selon les circonstances.
 */
const SEED_TYPES_INTERVENTION = [
  { id: 'accompagnement-individuel', label: 'Accompagnement individuel', categorie: 'accompagnement' },
  { id: 'accompagnement-equipe', label: "Accompagnement d'équipe", categorie: 'accompagnement' },
  { id: 'instance-ecole', label: "Instance d'école", categorie: 'accompagnement' },
  { id: 'formation-donnee', label: 'Formation donnée', categorie: 'formation' },
  { id: 'formation-recue', label: 'Formation reçue', categorie: 'formation' },
  { id: 'projet-ecole', label: "Projet d'école", categorie: 'projets' },
  { id: 'liaison-intercycles', label: 'Liaison inter-cycles', categorie: 'projets' },
  { id: 'action-projet-pedagogique', label: 'Action / projet pédagogique', categorie: 'projets' },
  { id: 'groupe-travail-referent', label: 'Groupe de travail / mission référent', categorie: 'circonscription' },
  { id: 'reunion-circonscription', label: 'Réunion de circonscription / DENC', categorie: 'circonscription' },
  { id: 'inspection-eae', label: 'Inspection / EAE', categorie: 'circonscription' },
  { id: 'instruction-domicile', label: 'Instruction à domicile', categorie: 'reglementaire' },
  { id: 'agrement', label: 'Agrément', categorie: 'reglementaire' },
  { id: 'jury-correction', label: 'Jury / correction', categorie: 'reglementaire' },
  { id: 'situation-particuliere', label: 'Situation particulière', categorie: 'divers' },
  { id: 'tache-administrative', label: 'Tâche administrative', categorie: 'divers' }
];

/*
 * Profils/publics proposés uniquement pour les types où la distinction est utile pour les
 * statistiques (accompagnement individuel/d'équipe, inspection/EAE) — masqué pour tous les autres.
 */
const PROFILS_PAR_TYPE = {
  'accompagnement-individuel': ['T0', 'T1', 'T2', 'T3', 'Titulaire', 'Remplaçant', 'Stagiaire', 'Direction'],
  'inspection-eae': ['T0', 'T1', 'T2', 'T3', 'Titulaire', 'Remplaçant', 'Stagiaire', 'Direction'],
  'accompagnement-equipe': ['Équipe complète', 'Équipe de cycle', 'Groupe']
};

/* Origine de l'action : proposée pour tous les types, toujours facultative. */
const ORIGINES_INTERVENTION = [
  'Mon initiative',
  "Demande équipe",
  'Demande direction',
  "Demande IEN",
  'Commande DENC',
  'Obligation réglementaire'
];

/*
 * Anciens types (34 valeurs, avant le passage à la typologie à 16 ci-dessus), conservés
 * uniquement comme repli d'affichage pour les interventions déjà saisies sous ces id — jamais
 * proposés à la saisie. Les id repris à l'identique dans la nouvelle liste (projet-ecole,
 * agrement, instruction-domicile, formation-recue) n'ont pas besoin d'entrée ici.
 */
const TYPES_HERITES = {
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
