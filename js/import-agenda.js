/*
 * Détection automatique, à partir d'un évènement Google Agenda exporté (.ics), de l'école
 * concernée et du type d'intervention le plus probable — sert uniquement à préremplir la revue
 * d'import (import-agenda.html), jamais à enregistrer sans passer par cette revue humaine : un
 * texte libre saisi par chacun dans son agenda ne peut pas être reconnu à coup sûr.
 */

/** Majuscules, sans accents : comparaison texte robuste aux variantes de saisie. */
function normaliserTexteAgenda(s) {
  return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
}

/*
 * Mots distinctifs par école (dérivés des noms dans js/seed-data.js) : suffisent seuls dans la
 * plupart des cas (BARDOU, MAINGUET, DILLENSEGER…). Les deux paires élém/mat qui partagent le même
 * nom de famille (FONG, DELACHARLERIE-ROLLY/MDR) ont besoin d'un mot-clé de désambiguïsation en plus
 * (voir detecterEcoleAgenda ci-dessous).
 */
const ECOLES_MOTS_CLES_AGENDA = {
  'bardou': ['BARDOU'],
  'benebig': ['BENEBIG'],
  'cht': ['MEDIPOLE', 'CHT'],
  'clain': ['CLAIN'],
  'dorbritz': ['DORBRITZ'],
  'dsmer': ['DUMBEA'],
  'eepu-fong': ['FONG'],
  'empu-fong': ['FONG'],
  'eepu-mdr': ['DELACHARLERIE', 'ROLLY', 'MDR'],
  'empu-mdr': ['DELACHARLERIE', 'ROLLY', 'MDR'],
  'dillenseger': ['DILLENSEGER'],
  'l-de-greslan': ['GRESLAN'],
  'mainguet': ['MAINGUET'],
  'myosotis': ['MYOSOTIS'],
  'niaoulis': ['NIAOULIS'],
  'oasis': ['OASIS'],
  'orangers': ['ORANGERS'],
  'yahoue': ['YAHOUE'],
  'petunias': ['PETUNIAS'],
  's-russier': ['RUSSIER'],
  'f-surleau': ['SURLEAU']
};
const MOTS_MATERNELLE_AGENDA = ['MATERNELLE', 'MAT.', ' MAT '];
const MOTS_ELEMENTAIRE_AGENDA = ['ELEMENTAIRE', 'ELEM.', ' ELEM '];

/**
 * Renvoie { ecoleId, ambigu } à partir d'un texte déjà normalisé (voir normaliserTexteAgenda) —
 * ecoleId à null si aucune correspondance, ambigu=true si plusieurs écoles candidates n'ont pas pu
 * être départagées (à choisir soi-même dans la revue).
 */
function detecterEcoleAgenda(texteNormalise, ecoles) {
  const candidats = new Set();
  Object.keys(ECOLES_MOTS_CLES_AGENDA).forEach(ecoleId => {
    if (!ecoles.some(e => e.id === ecoleId)) return;
    if (ECOLES_MOTS_CLES_AGENDA[ecoleId].some(mot => texteNormalise.includes(mot))) candidats.add(ecoleId);
  });
  if (candidats.size === 0) return { ecoleId: null, ambigu: false };
  if (candidats.size === 1) return { ecoleId: [...candidats][0], ambigu: false };

  const estMaternelle = MOTS_MATERNELLE_AGENDA.some(m => texteNormalise.includes(m));
  const estElementaire = MOTS_ELEMENTAIRE_AGENDA.some(m => texteNormalise.includes(m));
  const affines = [...candidats].filter(id => {
    const ecole = ecoles.find(e => e.id === id);
    if (estMaternelle && !estElementaire) return ecole.type === 'maternelle';
    if (estElementaire && !estMaternelle) return ecole.type === 'elementaire';
    return true;
  });
  if (affines.length === 1) return { ecoleId: affines[0], ambigu: false };
  return { ecoleId: affines[0] || [...candidats][0], ambigu: true };
}

/* Mots-clés par type, uniquement pour proposer une suggestion — la revue humaine reste requise
   pour confirmer ou corriger. Testés dans cet ordre : le premier qui correspond gagne. */
const TYPES_MOTS_CLES_AGENDA = [
  ['animation-pedagogique', ['ANIMATION PEDA']],
  ['formation-donnee', ['FORMATION']],
  ['instance-ecole', ["CONSEIL D'ECOLE", 'CONSEIL ECOLE', 'CONSEIL DE CYCLE', 'CONSEIL DES MAITRES', 'RESIDENCE PEDAGOGIQUE', "VISITE D'ACCOMPAGNEMENT"]],
  ['inspection-eae', ['INSPECTION', 'EAE']],
  ['reunion-circonscription', ['REUNION CIRCO', 'REUNION IEP']],
  ['jury-correction', ['JURY', 'CORRECTION', 'CAFIPEMF', 'CAPPEI']],
  ['redaction-sujets', ['REDACTION SUJET']],
  ['projet-ecole', ["PROJET D'ECOLE", 'PROJET ECOLE']],
  ['action-projet-pedagogique', ['PROJET PEDAGOGIQUE']],
  ['liaison-intercycles', ['LIAISON CM2', 'LIAISON GS', 'LIAISON INTERCYCLE']],
  ['groupe-travail', [' GT ', 'GROUPE DE TRAVAIL']],
  ['tache-administrative', ['ADMINISTRATIF']],
  ['accompagnement-equipe', ["ACCOMPAGNEMENT D'EQUIPE", 'ACCOMPAGNEMENT EQUIPE', 'EQUIPE CYCLE', "ACCOMPAGNEMENT D EQUIPE"]],
  ['accompagnement-individuel', ['ACCOMPAGNEMENT']]
];

/** Renvoie un typeId suggéré (ou null si aucun mot-clé ne correspond) à partir d'un texte normalisé. */
function detecterTypeAgenda(texteNormalise) {
  for (const [typeId, mots] of TYPES_MOTS_CLES_AGENDA) {
    if (mots.some(mot => texteNormalise.includes(mot))) return typeId;
  }
  return null;
}

/**
 * Analyse un évènement .ics (voir js/ics-parser.js) et renvoie une ligne de revue prête à afficher :
 * { uid, date, texteOriginal, ecoleId, ecoleAmbigue, typeId, theme }.
 */
function analyserEvenementAgenda(evenement, ecoles) {
  const texteComplet = [evenement.summary, evenement.description, evenement.location].filter(Boolean).join(' — ');
  const texteNormalise = normaliserTexteAgenda(texteComplet);
  const { ecoleId, ambigu } = detecterEcoleAgenda(texteNormalise, ecoles);
  return {
    uid: evenement.uid,
    date: evenement.date,
    texteOriginal: evenement.summary || evenement.description || '(sans titre)',
    ecoleId,
    ecoleAmbigue: ambigu,
    typeId: detecterTypeAgenda(texteNormalise),
    theme: (evenement.summary || '').trim()
  };
}
