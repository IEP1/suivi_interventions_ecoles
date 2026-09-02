/*
 * Accès haut niveau aux données de l'appli — backend Supabase (voir supabase/schema.sql).
 * Remplace l'ancien stockage GitHub-JSON (js/github-store.js, retiré le 2026-08-31). Chaque
 * méthode garde exactement la même signature et la même forme de retour (camelCase) qu'avant, pour
 * que les pages appelantes n'aient rien à changer — seule cette couche parle vraiment à la base
 * (colonnes snake_case, voir mapActionVersDb/mapActionVersJs).
 *
 * Toute erreur Supabase est transformée en Error JS classique (mêmes try/catch qu'avant dans les
 * pages). Le journal d'audit (table journal_audit) trace qui/quoi/quand sur la table "actions" —
 * remplace l'historique de commits Git qu'offrait l'ancien système.
 */

function leverSiErreur(erreur) {
  if (erreur) throw new Error(erreur.message);
}

/** Best-effort : une panne du journal ne doit jamais faire échouer l'opération principale. */
async function journaliser(tableNom, ligneId, action, avant, apres) {
  try {
    await sb.from('journal_audit').insert({ table_nom: tableNom, ligne_id: String(ligneId), action, avant, apres });
  } catch (e) {
    console.warn('journal_audit :', e.message);
  }
}

function mapActionVersJs(a) {
  return {
    id: a.id,
    date: a.date,
    typeId: a.type_id,
    intervenantId: a.intervenant_id,
    theme: a.theme || '',
    notes: a.notes || '',
    profil: a.profil || '',
    origine: a.origine || '',
    lieuLibre: a.lieu_libre || undefined,
    groupeId: a.groupe_id || undefined,
    horodatage: a.cree_le
  };
}

function mapActionVersDb(a, ecoleId) {
  return {
    id: a.id,
    ecole_id: ecoleId || null,
    intervenant_id: a.intervenantId,
    type_id: a.typeId,
    date: a.date,
    theme: a.theme || null,
    notes: a.notes || null,
    profil: a.profil || null,
    origine: a.origine || null,
    lieu_libre: a.lieuLibre || null,
    groupe_id: a.groupeId || null,
    cree_le: a.horodatage || horodatageMaintenant()
  };
}

/** Remplace tout le contenu d'une table (delete puis insert) — pour les cas "voici la liste complète voulue". */
async function remplacerContenuTable(table, colonneFiltre, valeurFiltre, lignes) {
  const suppression = sb.from(table).delete();
  const { error: e1 } = await (colonneFiltre ? suppression.eq(colonneFiltre, valeurFiltre) : suppression.neq('id', '__jamais__'));
  leverSiErreur(e1);
  if (lignes.length) {
    const { error: e2 } = await sb.from(table).insert(lignes);
    leverSiErreur(e2);
  }
}

/** Synchronise une petite table (intervenants, types) avec une liste voulue : supprime les absents, upsert le reste. */
async function synchroniserTable(table, lignes) {
  const { data: existants, error: e1 } = await sb.from(table).select('id');
  leverSiErreur(e1);
  const idsVoulus = new Set(lignes.map(l => l.id));
  const aSupprimer = (existants || []).filter(e => !idsVoulus.has(e.id)).map(e => e.id);
  if (aSupprimer.length) {
    const { error: e2 } = await sb.from(table).delete().in('id', aSupprimer);
    leverSiErreur(e2);
  }
  if (lignes.length) {
    const { error: e3 } = await sb.from(table).upsert(lignes);
    leverSiErreur(e3);
  }
}

const Store = {
  async chargerEcoles() {
    const { data, error } = await sb.from('ecoles').select('id, nom, type, direction, cpc_referent_id');
    leverSiErreur(error);
    return (data || []).map(e => ({ id: e.id, nom: e.nom, type: e.type, direction: e.direction, cpcReferent: e.cpc_referent_id }));
  },
  /* Upsert uniquement (ajoute/actualise) : ne supprime jamais une école, il n'existe pas de
     fonctionnalité "supprimer une école" dans l'appli — évite un risque de suppression en masse
     par erreur alors que des interventions/équipes en dépendent. */
  async sauvegarderEcoles(liste) {
    const lignes = liste.map(e => ({ id: e.id, nom: e.nom, type: e.type, direction: e.direction || null, cpc_referent_id: e.cpcReferent || null }));
    if (!lignes.length) return;
    const { error } = await sb.from('ecoles').upsert(lignes);
    leverSiErreur(error);
  },

  async chargerIntervenants() {
    const { data, error } = await sb.from('intervenants').select('*');
    leverSiErreur(error);
    return data || [];
  },
  async sauvegarderIntervenants(liste) {
    await synchroniserTable('intervenants', liste);
  },

  async chargerTypes() {
    const { data, error } = await sb.from('types_intervention').select('*');
    leverSiErreur(error);
    return (data || []).map(t => ({ id: t.id, label: t.label, categorie: t.categorie, enEcole: t.en_ecole }));
  },
  async sauvegarderTypes(liste) {
    const lignes = liste.map(t => ({ id: t.id, label: t.label, categorie: t.categorie, en_ecole: t.enEcole !== false }));
    await synchroniserTable('types_intervention', lignes);
  },
  /** Ajoute un type personnalisé s'il n'existe pas déjà (comparaison sur le libellé) et le retourne. */
  async ajouterTypePersonnalise(label) {
    const types = await this.chargerTypes();
    const existant = types.find(t => t.label.trim().toLowerCase() === label.trim().toLowerCase());
    if (existant) return existant;
    const type = { id: 'perso-' + Date.now().toString(36), label: label.trim(), categorie: 'autre', enEcole: true };
    const { error } = await sb.from('types_intervention').insert({ id: type.id, label: type.label, categorie: type.categorie, en_ecole: true });
    leverSiErreur(error);
    return type;
  },

  /** Structure pédagogique d'une école : { psychologueScolaire: '', enseignants: [...] }. */
  async chargerEquipeEcole(ecoleId) {
    const [ecoleRes, ensRes] = await Promise.all([
      sb.from('ecoles').select('psychologue_scolaire').eq('id', ecoleId).maybeSingle(),
      sb.from('equipe_enseignants').select('*').eq('ecole_id', ecoleId)
    ]);
    leverSiErreur(ecoleRes.error);
    leverSiErreur(ensRes.error);
    return {
      psychologueScolaire: (ecoleRes.data && ecoleRes.data.psychologue_scolaire) || '',
      enseignants: (ensRes.data || []).map(e => ({ id: e.id, nom: e.nom, prenom: e.prenom, niveau: e.niveau, statut: e.statut, referent: e.referent }))
    };
  },
  async sauvegarderEquipeEcole(ecoleId, data, nomEcole) {
    const { error: e1 } = await sb.from('ecoles').update({ psychologue_scolaire: data.psychologueScolaire || null }).eq('id', ecoleId);
    leverSiErreur(e1);
    const lignes = (data.enseignants || []).map(e => ({
      id: e.id, ecole_id: ecoleId, nom: e.nom || null, prenom: e.prenom || null,
      niveau: e.niveau || null, statut: e.statut || null, referent: e.referent || null
    }));
    await remplacerContenuTable('equipe_enseignants', 'ecole_id', ecoleId, lignes);
  },

  /** Interventions d'une école : { interventions: [...] }. */
  async chargerInterventionsEcole(ecoleId) {
    const { data, error } = await sb.from('actions').select('*').eq('ecole_id', ecoleId).order('date', { ascending: false });
    leverSiErreur(error);
    return { interventions: (data || []).map(mapActionVersJs) };
  },
  /* Remplace tout l'historique de cette école — utilisé pour des réaffectations en masse
     (maj-listes.html), pas pour l'ajout au quotidien (voir ajouterIntervention ci-dessous, qui
     insère une seule ligne sans toucher au reste). */
  async sauvegarderInterventionsEcole(ecoleId, data, nomEcole) {
    const lignes = (data.interventions || []).map(iv => mapActionVersDb(iv, ecoleId));
    await remplacerContenuTable('actions', 'ecole_id', ecoleId, lignes);
  },

  /** Ajoute une intervention à une école (une seule ligne insérée). */
  async ajouterIntervention(ecoleId, intervention, nomEcole) {
    const ligne = mapActionVersDb(intervention, ecoleId);
    const { error } = await sb.from('actions').insert(ligne);
    leverSiErreur(error);
    journaliser('actions', ligne.id, 'insert', null, ligne);
  },

  /** Charge la liste des écoles ET leurs interventions (pour le tableau de bord et les stats). */
  async chargerToutesLesEcolesAvecInterventions() {
    const [ecoles, actionsRes] = await Promise.all([
      this.chargerEcoles(),
      sb.from('actions').select('*').not('ecole_id', 'is', null)
    ]);
    leverSiErreur(actionsRes.error);
    const parEcole = {};
    (actionsRes.data || []).forEach(a => { (parEcole[a.ecole_id] = parEcole[a.ecole_id] || []).push(mapActionVersJs(a)); });
    return ecoles.map(e => ({ ...e, interventions: parEcole[e.id] || [] }));
  },

  /** Actions d'un intervenant non liées à une école (réunions, administratif, formation…). */
  async chargerActionsGeneralesIntervenant(intervenantId) {
    const { data, error } = await sb.from('actions').select('*').eq('intervenant_id', intervenantId).is('ecole_id', null);
    leverSiErreur(error);
    return { actions: (data || []).map(mapActionVersJs) };
  },
  async sauvegarderActionsGeneralesIntervenant(intervenantId, data, nomIntervenant) {
    const lignes = (data.actions || []).map(a => ({ ...mapActionVersDb(a, null), intervenant_id: intervenantId }));
    const { error: e1 } = await sb.from('actions').delete().eq('intervenant_id', intervenantId).is('ecole_id', null);
    leverSiErreur(e1);
    if (lignes.length) {
      const { error: e2 } = await sb.from('actions').insert(lignes);
      leverSiErreur(e2);
    }
  },
  async ajouterActionGenerale(intervenantId, action, nomIntervenant) {
    const ligne = mapActionVersDb(action, null);
    const { error } = await sb.from('actions').insert(ligne);
    leverSiErreur(error);
    journaliser('actions', ligne.id, 'insert', null, ligne);
  },

  /** Supprime une action déjà enregistrée (école ou générale, retrouvée par son id unique). */
  async supprimerAction(intervenantId, nomIntervenant, actionId, ecoleId, nomEcole) {
    const { data: avant } = await sb.from('actions').select('*').eq('id', actionId).maybeSingle();
    const { error } = await sb.from('actions').delete().eq('id', actionId);
    leverSiErreur(error);
    journaliser('actions', actionId, 'delete', avant || null, null);
  },

  /** Remplace une action existante par sa nouvelle version (même id) — gère aussi un changement d'école. */
  async remplacerAction(intervenantId, nomIntervenant, ancienEcoleId, ancienNomEcole, nouvelleAction, nouvelEcoleId, nouvelNomEcole) {
    const { data: avant } = await sb.from('actions').select('*').eq('id', nouvelleAction.id).maybeSingle();
    const ligne = mapActionVersDb(nouvelleAction, nouvelEcoleId);
    const { error } = await sb.from('actions').update(ligne).eq('id', nouvelleAction.id);
    leverSiErreur(error);
    journaliser('actions', nouvelleAction.id, 'update', avant || null, ligne);
  },

  /** Bilan d'un conseiller : ses interventions école + ses actions générales, à plat. */
  async chargerToutesLesActionsIntervenant(intervenantId) {
    const { data, error } = await sb.from('actions').select('*, ecoles(nom)').eq('intervenant_id', intervenantId);
    leverSiErreur(error);
    return (data || []).map(a => ({ ...mapActionVersJs(a), ecoleId: a.ecole_id, ecoleNom: a.ecoles ? a.ecoles.nom : null }));
  },

  /** Bilan d'équipe : toutes les actions (école + générales), tous intervenants confondus. */
  async chargerToutesLesActions() {
    const { data, error } = await sb.from('actions').select('*, ecoles(nom)');
    leverSiErreur(error);
    return (data || []).map(a => ({ ...mapActionVersJs(a), ecoleId: a.ecole_id, ecoleNom: a.ecoles ? a.ecoles.nom : null }));
  },

  /** Texte qualitatif du bilan de fin d'année (rédigé par l'IAP), une ligne par année scolaire. */
  async chargerBilanAnnuel(annee) {
    const { data, error } = await sb.from('bilans_annuels').select('*').eq('annee', Number(annee)).maybeSingle();
    leverSiErreur(error);
    return data
      ? { axesForts: data.axes_forts || '', pointsVigilance: data.points_vigilance || '', perspectives: data.perspectives || '', modifieLe: data.modifie_le }
      : { axesForts: '', pointsVigilance: '', perspectives: '', modifieLe: null };
  },
  async sauvegarderBilanAnnuel(annee, texte) {
    const ligne = {
      annee: Number(annee),
      axes_forts: texte.axesForts || null,
      points_vigilance: texte.pointsVigilance || null,
      perspectives: texte.perspectives || null,
      modifie_le: horodatageMaintenant()
    };
    const { error } = await sb.from('bilans_annuels').upsert(ligne);
    leverSiErreur(error);
  }
};

function genererIdIntervention() {
  return 'iv-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
}

function genererIdEnseignant() {
  return 'ens-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
}

function genererIdIntervenant(nom) {
  const base = nom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '').slice(0, 14) || 'intervenant';
  return base + '-' + Math.random().toString(36).slice(2, 6);
}

function horodatageMaintenant() {
  return new Date().toISOString();
}

/** Année scolaire en cours (calendrier austral : commence en février). Ex: "2026" pour l'année scolaire 2026. */
function anneeScolaireCourante(date = new Date()) {
  const mois = date.getMonth() + 1; // 1-12
  return mois >= 2 ? date.getFullYear() : date.getFullYear() - 1;
}

/** Bornes [debut, fin] de l'année scolaire donnée (1er fév -> 31 déc de la même année civile, calendrier NC). */
function bornesAnneeScolaire(annee) {
  return { debut: `${annee}-02-01`, fin: `${annee}-12-31` };
}

/**
 * Bornes [debut, fin] d'une période scolaire (1 à 5) pour une année donnée.
 * Utilise le calendrier officiel s'il est renseigné dans PERIODES_SCOLAIRES (js/seed-data.js),
 * sinon répartit l'année scolaire en 5 tranches à peu près égales.
 */
function bornesPeriode(annee, numeroPeriode) {
  const officiel = PERIODES_SCOLAIRES[annee];
  if (officiel && officiel[numeroPeriode - 1]) return officiel[numeroPeriode - 1];

  const { debut, fin } = bornesAnneeScolaire(annee);
  const msDebut = new Date(debut).getTime();
  const msFin = new Date(fin).getTime();
  const pas = (msFin - msDebut) / 5;
  const iso = (ms) => new Date(ms).toISOString().slice(0, 10);
  return {
    debut: iso(msDebut + pas * (numeroPeriode - 1)),
    fin: iso(msDebut + pas * numeroPeriode - 86400000)
  };
}
