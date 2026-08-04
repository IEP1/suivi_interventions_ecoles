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
