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
  // Pas « DUMBEA » seul : Poésie préfixe chaque titre par la commune (« DUMBEA - Ecole : … »).
  'dsmer': ['DUMBEA-SUR-MER', 'DUMBEA SUR MER', 'DSM'],
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

/*
 * ===== Évènements Poésie =====
 * Poésie (outil de saisie obligatoire) écrit dans Google Agenda des évènements structurés :
 *   titre       « DUMBEA - Ecole  : MAINGUET Jack », « DENC : IEP1 - Nouméa », « NOUMEA - Institut formation »
 *   description « Actions :\n\n- Catégorie / Sous-catégorie / Détail ( Durée : 3h 0min ) ( commentaire ) »
 * (une ligne « - » par action, parfois plusieurs par évènement). Le type IEP1 se déduit alors de
 * façon fiable de l'intitulé Poésie, via POESIE_VERS_TYPE ci-dessous, au lieu d'être deviné.
 */

/** true si l'évènement a été créé par Poésie (description commençant par « Actions : »). */
function estEvenementPoesie(evenement) {
  return /^\s*Actions\s*:/i.test((evenement.description || '').replace(/<[^>]+>/g, ''));
}

/**
 * Correspondance intitulé Poésie → type IEP1, validée avec l'IEP1 le 2026-09-30 sur un agenda réel.
 * Testée dans l'ordre sur « Catégorie / Sous-catégorie / Détail » normalisé : la première règle qui
 * correspond gagne. typeId null + ignorer:true = action Poésie volontairement non importée ;
 * typeId null sans ignorer = pas de type évident, laissé à choisir (ligne « à vérifier »).
 * aVerifier : type proposé mais pas certain (ligne décochée par défaut).
 * themeDetail : le « Détail » Poésie devient le thème (ex. le sujet du GT).
 */
const POESIE_VERS_TYPE = [
  // La visite elle-même est déjà comptée : le bulletin la compterait deux fois.
  { motif: /REDACTION (DE )?BULLETIN DE VISITE/, ignorer: true },
  { motif: /ACCOMPAGNEMENT D.ENSEIGNANTS \/ ENSEIGNANT TITULAIRE/, typeId: 'accompagnement-individuel', profil: 'Titulaire' },
  { motif: /ACCOMPAGNEMENT D.ENSEIGNANTS \/ ENSEIGNANT REMPLACANT/, typeId: 'accompagnement-individuel', profil: 'Remplaçant' },
  { motif: /IFMNC \/ SUIVI DE STAGIAIRE/, typeId: 'accompagnement-individuel', profil: 'Stagiaire' },
  { motif: /PLAN DE FORMATION/, typeId: 'formation-donnee' },
  { motif: /CAFIPEMF \/ FORMATEUR/, typeId: 'formation-donnee', theme: 'CAFIPEMF' },
  // « Préparation animation pédagogique / conseil de cycle » : animation pédagogique par défaut,
  // instance d'école quand le commentaire parle d'un conseil de cycle (voir analyserEvenementPoesie).
  { motif: /PREPARATION ANIMATION PEDAGOGIQUE/, typeId: 'animation-pedagogique',
    siCommentaire: { motif: /CONSEIL DE CYCLE/, typeId: 'instance-ecole', profil: 'Conseil de cycle' } },
  { motif: /REUNIONS PEDAGOGIQUES \/ ANIMATION PEDAGOGIQUE/, typeId: 'animation-pedagogique' },
  { motif: /CONSEIL DE CYCLE/, typeId: 'instance-ecole', profil: 'Conseil de cycle' },
  { motif: /CONSEIL D.ECOLE/, typeId: 'instance-ecole', profil: "Conseil d'école" },
  { motif: /CONSEIL DES MAITRES/, typeId: 'instance-ecole', profil: 'Conseil des maîtres' },
  { motif: /REUNION GROUPE DE TRAVAIL/, typeId: 'groupe-travail', themeDetail: true },
  { motif: /SUIVI DE DOSSIERS REFERENTS/, typeId: 'groupe-travail-referent', themeDetail: true },
  { motif: /REUNIONS? DE SERVICE|REUNION MAITRES FORMATEURS/, typeId: 'reunion-circonscription' },
  { motif: /CONCEPTION DE SUJETS/, typeId: 'redaction-sujets' },
  { motif: /\/ JURY|REUNION EN LIEN AVEC LES CONCOURS/, typeId: 'jury-correction' },
  { motif: /LIAISON INTER/, typeId: 'liaison-intercycles' },
  { motif: /TACHES ADMINISTRATIVES|TACHES PEDAGOGIQUES/, typeId: 'tache-administrative' },
  { motif: /RELATION DIRECTEUR, EQUIPE, ECOLE ET FAMILLE/, typeId: 'situation-particuliere' },
  // Pas de type « famille / partenaire » dans la typologie : équipe par défaut, à confirmer.
  { motif: /EVALUATION IEF/, typeId: 'accompagnement-equipe', aVerifier: true },
  { motif: /VISITE DE RENTREE/, typeId: 'accompagnement-equipe', profil: 'Équipe complète' },
  { motif: /EVENEMENTS \/ RENCONTRES/, typeId: 'accompagnement-equipe', profil: 'Équipe complète' },
  { motif: /REUNION DESED/, typeId: 'accompagnement-individuel' },
  // Réunions avec des partenaires extérieurs : hors suivi des écoles, sauf si une de nos écoles
  // est citée (titre ou commentaire) — le type reste alors à choisir.
  { motif: /AUTRES REUNIONS \/ PARTENAIRES/, ignorerSansEcole: true }
  // Non listés : pas de type évident, à choisir ligne par ligne.
];

/*
 * Commentaire Poésie recopié dans « Thème » : précieux pour un accompagnement (nom de
 * l'enseignant), mais peut contenir des informations sur des élèves, familles ou la santé — lisibles
 * ensuite par toute personne ayant le lien du site. Ces mots-là ne bloquent rien : la ligne est
 * décochée et signalée « info sensible ? » pour que la personne relise/raccourcisse le thème avant
 * d'importer.
 */
const MOTS_INFO_SENSIBLE = [
  'ELEVE', 'ENFANT', 'HANDICAP', 'CLIS', 'ULIS', 'MDPH', 'AESH', ' PPS', ' PAP', 'SAUT DE CLASSE',
  'MAINTIEN', 'EQUIPE EDUCATIVE', 'FAMILLE', 'PARENT', 'MALADIE', 'SANTE', 'SIGNALEMENT',
  'INFORMATION PREOCCUPANTE', 'MALTRAITANCE', 'DECES'
];
function contientInfoSensible(texte) {
  const t = ' ' + normaliserTexteAgenda(texte) + ' ';
  return MOTS_INFO_SENSIBLE.some(m => t.includes(m));
}

/**
 * Découpe le titre Poésie en lieu : { ecoleNom, lieu } — ecoleNom seulement pour « … - Ecole : NOM »
 * (seule partie où chercher une école : la commune en préfixe ne doit jamais servir à la détection).
 */
function lireLieuPoesie(titre) {
  const propre = (titre || '').replace(/\s+/g, ' ').trim();
  const m = /^(.+?) - (.+?) ?: ?(.+)$/.exec(propre);
  if (m && /^ECOLE$/.test(normaliserTexteAgenda(m[2]).trim())) return { ecoleNom: m[3], lieu: propre };
  return { ecoleNom: null, lieu: propre };
}

/** Lignes « - Cat / Sous-cat / Détail ( Durée… ) ( commentaire ) » → [{ intitule, detail, commentaire }]. */
function lireActionsPoesie(description) {
  return (description || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').split('\n')
    .filter(l => /^\s*-\s/.test(l) && l.includes('/'))
    .map(l => {
      let texte = l.replace(/^\s*-\s*/, '').trim();
      let commentaire = '';
      // Commentaire libre = dernière parenthèse « ( … ) » (avec espaces intérieurs, comme les
      // ajouts de Poésie) qui n'est pas « Durée » / « Nombre » — à ne pas confondre avec les
      // parenthèses collées de l'intitulé lui-même, ex. « Stagiaire (IFMNC, IFAP ..) ».
      const mCom = /\(\s+((?:[^()]|\([^()]*\))*?)\s+\)\s*$/.exec(texte);
      if (mCom && !/^(Durée|Nombre)\s*:/i.test(mCom[1])) {
        commentaire = mCom[1].trim();
        texte = texte.slice(0, mCom.index).trim();
      }
      texte = texte.replace(/\(\s*(Durée|Nombre)\s*:[^)]*\)/gi, '').replace(/\s+/g, ' ').trim();
      const morceaux = texte.split(' / ');
      return { intitule: texte, detail: morceaux[morceaux.length - 1], commentaire };
    });
}

/** Ligne(s) de revue pour un évènement Poésie : une par action listée dans la description. */
function analyserEvenementPoesie(evenement, ecoles) {
  const { ecoleNom, lieu } = lireLieuPoesie(evenement.summary);
  const { ecoleId, ambigu } = ecoleNom
    ? detecterEcoleAgenda(normaliserTexteAgenda(' ' + ecoleNom + ' '), ecoles)
    : { ecoleId: null, ambigu: false };
  const actions = lireActionsPoesie(evenement.description);
  return actions.map((action, i) => {
    let regle = POESIE_VERS_TYPE.find(r => r.motif.test(normaliserTexteAgenda(action.intitule))) || {};
    const commentaireNormalise = normaliserTexteAgenda(action.commentaire);
    if (regle.siCommentaire && regle.siCommentaire.motif.test(commentaireNormalise)) regle = regle.siCommentaire;
    // École citée seulement dans le commentaire (ex. réunion partenaire « pour l'école MAINGUET »).
    let ecole = { ecoleId, ambigu };
    if (!ecole.ecoleId && action.commentaire) {
      const dansCommentaire = detecterEcoleAgenda(' ' + commentaireNormalise + ' ', ecoles);
      if (dansCommentaire.ecoleId) ecole = dansCommentaire;
    }
    const ignoree = !!regle.ignorer || (!!regle.ignorerSansEcole && !ecole.ecoleId);
    return {
      uid: actions.length > 1 ? `${evenement.uid}#${i}` : evenement.uid,
      date: evenement.date,
      poesie: true,
      intitulePoesie: action.intitule,
      texteOriginal: evenement.summary || '(sans titre)',
      ecoleId: ecole.ecoleId,
      ecoleAmbigue: ecole.ambigu,
      // Lieu gardé pour une action sans école du suivi (DENC, Institut de formation, école hors circo…).
      lieuLibre: ecole.ecoleId ? '' : lieu,
      typeId: regle.typeId || null,
      profil: regle.profil || '',
      ignoree,
      raisonIgnoree: regle.ignorer ? 'bulletin' : (ignoree ? 'partenaire' : ''),
      typeAVerifier: !!regle.aVerifier || !regle.typeId,
      infoSensible: contientInfoSensible(action.commentaire),
      theme: action.commentaire || (regle.themeDetail ? action.detail : '') || regle.theme || ''
    };
  });
}

/**
 * Analyse un évènement .ics (voir js/ics-parser.js) et renvoie les lignes de revue prêtes à afficher
 * (une par action pour un évènement Poésie, une seule sinon) :
 * { uid, date, poesie, texteOriginal, ecoleId, ecoleAmbigue, typeId, profil, theme, lieuLibre… }.
 */
function analyserEvenementAgenda(evenement, ecoles) {
  if (estEvenementPoesie(evenement)) {
    const lignes = analyserEvenementPoesie(evenement, ecoles);
    if (lignes.length) return lignes;
  }
  const texteComplet = [evenement.summary, evenement.description, evenement.location].filter(Boolean).join(' — ');
  const texteNormalise = normaliserTexteAgenda(texteComplet);
  const { ecoleId, ambigu } = detecterEcoleAgenda(texteNormalise, ecoles);
  const typeId = detecterTypeAgenda(texteNormalise);
  return [{
    uid: evenement.uid,
    date: evenement.date,
    poesie: false,
    texteOriginal: evenement.summary || evenement.description || '(sans titre)',
    ecoleId,
    ecoleAmbigue: ambigu,
    lieuLibre: '',
    typeId,
    profil: '',
    ignoree: false,
    typeAVerifier: !typeId,
    theme: (evenement.summary || '').trim()
  }];
}
