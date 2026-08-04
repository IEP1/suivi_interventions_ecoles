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
  { id: 'benebig', nom: 'BENEBIG Louis', type: 'elementaire', direction: 'BENOIST Viviane', cpcReferent: 'maria' },
  { id: 'cht', nom: 'CHT (Médipôle)', type: 'structure', direction: 'TENG Sonja', cpcReferent: 'vaea' },
  { id: 'clain', nom: 'CLAIN Gustave', type: 'elementaire', direction: 'DJEKIC Carole', cpcReferent: 'vincent' },
  { id: 'dorbritz', nom: 'DORBRITZ Frédéric-Louis', type: 'elementaire', direction: 'HUSSON Olivier', cpcReferent: 'vaea' },
  { id: 'dsmer', nom: 'DUMBEA-SUR-MER', type: 'elementaire', direction: 'TANAKA Kyncienta', cpcReferent: 'vaea' },
  { id: 'eepu-fong', nom: 'FONG Renée élém.', type: 'elementaire', direction: 'COURTINE Stéphane', cpcReferent: 'maria' },
  { id: 'empu-fong', nom: 'FONG Renée mat.', type: 'maternelle', direction: 'DUMAS Vanessa', cpcReferent: 'maria' },
  { id: 'eepu-mdr', nom: 'DELACHARLERIE-ROLLY Michelle élém.', type: 'elementaire', direction: 'GUIHARD Karen', cpcReferent: 'nadege' },
  { id: 'empu-mdr', nom: 'DELACHARLERIE-ROLLY Michelle mat.', type: 'maternelle', direction: 'CANTINOLLE Xavier', cpcReferent: 'nadege' },
  { id: 'dillenseger', nom: 'GS DILLENSEGER Alphonse', type: 'groupe-scolaire', direction: 'ROUMAGNE-LAVAUX Christelle', cpcReferent: 'nadia' },
  { id: 'l-de-greslan', nom: 'GS LOUISE DE GRESLAN', type: 'groupe-scolaire', direction: 'LAFENÊTRE Jérôme', cpcReferent: 'nadege' },
  { id: 'mainguet', nom: 'MAINGUET Jack', type: 'elementaire', direction: 'CHANSIGAUD Angélique', cpcReferent: 'vincent' },
  { id: 'myosotis', nom: 'LES MYOSOTIS', type: 'maternelle', direction: 'DESPINOY Emmanuelle', cpcReferent: 'nadia' },
  { id: 'niaoulis', nom: 'LES NIAOULIS', type: 'maternelle', direction: 'GUBANSKI Franck', cpcReferent: 'maria' },
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
  { id: 'vincent', nom: 'Vincent RENAIS', role: 'cpc' },
  { id: 'maria', nom: 'Maria', role: 'cpc' },
  { id: 'nadia', nom: 'Nadia CAFFA', role: 'cpc' },
  { id: 'nadege', nom: 'Nadège REDON', role: 'cpc' },
  { id: 'vaea', nom: 'Vaea', role: 'cpc' },
  { id: 'secretariat', nom: 'Secrétariat IEP1', role: 'secretariat' },
  { id: 'ien', nom: "IEN (Inspecteur)", role: 'ien' }
];

/*
 * Types d'intervention proposés au clic (liste de démarrage, éditable et
 * complétable depuis l'appli — toute action personnalisée créée par un
 * conseiller vient s'ajouter ici pour être réutilisée ensuite).
 */
const SEED_TYPES_INTERVENTION = [
  { id: 'accompagnement-titulaire', label: 'Accompagnement enseignant titulaire', categorie: 'individuel' },
  { id: 'accompagnement-suppleant', label: 'Accompagnement enseignant suppléant', categorie: 'individuel' },
  { id: 'accompagnement-t1t2t3', label: 'Accompagnement T1 / T2 / T3 (entrée dans le métier)', categorie: 'individuel' },
  { id: 'suivi-stagiaire', label: 'Suivi de stagiaire (PES / INSPE)', categorie: 'individuel' },
  { id: 'accompagnement-direction', label: "Accompagnement direction d'école", categorie: 'individuel' },
  { id: 'conseil-maitres', label: 'Conseil des maîtres', categorie: 'instance' },
  { id: 'conseil-ecole', label: "Conseil d'école", categorie: 'instance' },
  { id: 'conseil-cycle', label: 'Conseil de cycle', categorie: 'instance' },
  { id: 'projet-ecole', label: "Accompagnement projet d'école", categorie: 'projet' },
  { id: 'liaison-gs-cp', label: 'Liaison GS / CP', categorie: 'projet' },
  { id: 'liaison-cm2-6e', label: 'Liaison CM2 / 6e', categorie: 'projet' },
  { id: 'projet-pedagogique', label: 'Projet pédagogique spécifique', categorie: 'projet' },
  { id: 'animation-pedagogique', label: 'Animation pédagogique / formation', categorie: 'formation' },
  { id: 'groupe-travail', label: 'Groupe de travail circonscription / DENC', categorie: 'formation' },
  { id: 'demande-equipe', label: "Intervention à la demande de l'équipe", categorie: 'sollicitation' },
  { id: 'demande-direction', label: 'Intervention à la demande de la direction', categorie: 'sollicitation' },
  { id: 'demande-ien', label: "Intervention à la demande de l'IEN", categorie: 'sollicitation' }
];

const CATEGORIES_INTERVENTION = {
  'individuel': 'Accompagnement individuel',
  'instance': 'Instance',
  'projet': 'Projet',
  'formation': 'Formation / animation',
  'sollicitation': 'Sur sollicitation',
  'autre': 'Autre'
};
