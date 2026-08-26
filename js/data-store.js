/*
 * Accès haut niveau aux données de l'appli : combine le stockage GitHub
 * (js/github-store.js) et les données de démarrage (js/seed-data.js).
 * Chaque école a son propre fichier d'interventions => pas de conflit entre
 * conseillers qui saisissent en même temps sur des écoles différentes.
 */

const Store = {
  async chargerEcoles() {
    const { data } = await chargerJSON('ecoles.json', SEED_ECOLES);
    return data;
  },
  async sauvegarderEcoles(liste) {
    await sauvegarderJSON('ecoles.json', liste, 'Mise à jour liste des écoles');
  },

  async chargerIntervenants() {
    const { data } = await chargerJSON('intervenants.json', SEED_INTERVENANTS);
    return data;
  },
  async sauvegarderIntervenants(liste) {
    await sauvegarderJSON('intervenants.json', liste, 'Mise à jour liste des intervenants');
  },

  async chargerTypes() {
    const { data } = await chargerJSON('types-intervention.json', SEED_TYPES_INTERVENTION);
    return data;
  },
  async sauvegarderTypes(liste) {
    await sauvegarderJSON('types-intervention.json', liste, "Mise à jour des types d'intervention");
  },
  /** Ajoute un type personnalisé s'il n'existe pas déjà (comparaison sur le libellé) et le retourne. */
  async ajouterTypePersonnalise(label) {
    const types = await this.chargerTypes();
    const existant = types.find(t => t.label.trim().toLowerCase() === label.trim().toLowerCase());
    if (existant) return existant;
    const type = { id: 'perso-' + Date.now().toString(36), label: label.trim(), categorie: 'autre' };
    types.push(type);
    await this.sauvegarderTypes(types);
    return type;
  },

  /** Structure pédagogique d'une école : { psychologueScolaire: '', enseignants: [...] }. */
  async chargerEquipeEcole(ecoleId) {
    const { data } = await chargerJSON(`equipes/${ecoleId}.json`, { psychologueScolaire: '', enseignants: [] });
    return data;
  },
  async sauvegarderEquipeEcole(ecoleId, data, nomEcole) {
    await sauvegarderJSON(`equipes/${ecoleId}.json`, data, `Mise à jour structure pédagogique ${nomEcole || ecoleId}`);
  },

  /** Interventions d'une école : { interventions: [...] }. */
  async chargerInterventionsEcole(ecoleId) {
    const { data } = await chargerJSON(`interventions/${ecoleId}.json`, { interventions: [] });
    return data;
  },
  async sauvegarderInterventionsEcole(ecoleId, data, nomEcole) {
    await sauvegarderJSON(`interventions/${ecoleId}.json`, data, `Mise à jour interventions ${nomEcole || ecoleId}`);
  },

  /** Ajoute une intervention à une école (lecture puis écriture du fichier de cette école). */
  async ajouterIntervention(ecoleId, intervention, nomEcole) {
    const data = await this.chargerInterventionsEcole(ecoleId);
    data.interventions.push(intervention);
    await this.sauvegarderInterventionsEcole(ecoleId, data, nomEcole);
  },

  /** Charge la liste des écoles ET leurs interventions (pour le tableau de bord et les stats). */
  async chargerToutesLesEcolesAvecInterventions() {
    const ecoles = await this.chargerEcoles();
    const resultats = await Promise.all(ecoles.map(async e => ({
      ...e,
      interventions: (await this.chargerInterventionsEcole(e.id)).interventions
    })));
    return resultats;
  },

  /** Actions d'un intervenant non liées à une école (réunions, administratif, formation…). */
  async chargerActionsGeneralesIntervenant(intervenantId) {
    const { data } = await chargerJSON(`actions-generales/${intervenantId}.json`, { actions: [] });
    return data;
  },
  async sauvegarderActionsGeneralesIntervenant(intervenantId, data, nomIntervenant) {
    await sauvegarderJSON(`actions-generales/${intervenantId}.json`, data, `Mise à jour actions générales ${nomIntervenant || intervenantId}`);
  },
  async ajouterActionGenerale(intervenantId, action, nomIntervenant) {
    const data = await this.chargerActionsGeneralesIntervenant(intervenantId);
    data.actions.push(action);
    await this.sauvegarderActionsGeneralesIntervenant(intervenantId, data, nomIntervenant);
  },

  /*
   * Supprime une action déjà enregistrée, qu'elle vive dans le fichier d'une école (intervention,
   * ecoleId renseigné) ou dans les actions générales d'un intervenant (ecoleId null/undefined).
   */
  async supprimerAction(intervenantId, nomIntervenant, actionId, ecoleId, nomEcole) {
    if (ecoleId) {
      const data = await this.chargerInterventionsEcole(ecoleId);
      data.interventions = data.interventions.filter(iv => iv.id !== actionId);
      await this.sauvegarderInterventionsEcole(ecoleId, data, nomEcole);
    } else {
      const data = await this.chargerActionsGeneralesIntervenant(intervenantId);
      data.actions = data.actions.filter(a => a.id !== actionId);
      await this.sauvegarderActionsGeneralesIntervenant(intervenantId, data, nomIntervenant);
    }
  },

  /*
   * Remplace une action existante par sa nouvelle version (même id) : supprime l'ancienne copie à
   * son emplacement d'origine puis réinsère la nouvelle à son emplacement choisi — gère ainsi le
   * cas où l'école a changé (ou a été retirée/ajoutée) lors de la modification.
   */
  async remplacerAction(intervenantId, nomIntervenant, ancienEcoleId, ancienNomEcole, nouvelleAction, nouvelEcoleId, nouvelNomEcole) {
    await this.supprimerAction(intervenantId, nomIntervenant, nouvelleAction.id, ancienEcoleId, ancienNomEcole);
    if (nouvelEcoleId) {
      await this.ajouterIntervention(nouvelEcoleId, nouvelleAction, nouvelNomEcole);
    } else {
      await this.ajouterActionGenerale(intervenantId, nouvelleAction, nomIntervenant);
    }
  },

  /** Bilan d'un conseiller : ses interventions école + ses actions générales, à plat. */
  async chargerToutesLesActionsIntervenant(intervenantId) {
    const ecoles = await this.chargerToutesLesEcolesAvecInterventions();
    const actions = [];
    ecoles.forEach(e => e.interventions
      .filter(iv => iv.intervenantId === intervenantId)
      .forEach(iv => actions.push({ ...iv, ecoleId: e.id, ecoleNom: e.nom })));
    const generales = await this.chargerActionsGeneralesIntervenant(intervenantId);
    generales.actions.forEach(a => actions.push({ ...a, ecoleId: null, ecoleNom: null }));
    return actions;
  },

  /** Bilan d'équipe : toutes les actions (école + générales), tous intervenants confondus. */
  async chargerToutesLesActions() {
    const [ecoles, intervenants] = await Promise.all([this.chargerToutesLesEcolesAvecInterventions(), this.chargerIntervenants()]);
    const actions = [];
    ecoles.forEach(e => e.interventions.forEach(iv => actions.push({ ...iv, ecoleId: e.id, ecoleNom: e.nom })));
    const toutesGenerales = await Promise.all(intervenants.map(i => this.chargerActionsGeneralesIntervenant(i.id)));
    toutesGenerales.forEach(g => g.actions.forEach(a => actions.push({ ...a, ecoleId: null, ecoleNom: null })));
    return actions;
  },

  /** Texte qualitatif du bilan de fin d'année (rédigé par l'IAP), un fichier par année scolaire. */
  async chargerBilanAnnuel(annee) {
    const { data } = await chargerJSON(`bilans/${annee}.json`, { axesForts: '', pointsVigilance: '', perspectives: '', modifieLe: null });
    return data;
  },
  async sauvegarderBilanAnnuel(annee, texte) {
    await sauvegarderJSON(`bilans/${annee}.json`, { ...texte, modifieLe: horodatageMaintenant() }, `Bilan de fin d'année ${annee}`);
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
