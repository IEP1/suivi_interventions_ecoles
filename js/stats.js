/* Calculs statistiques pour le tableau de bord et les fiches école. */

function interventionsDansPeriode(interventions, debut, fin) {
  return interventions.filter(iv => iv.date >= debut && iv.date <= fin);
}

/**
 * Calcule les indicateurs globaux de la circonscription sur une période.
 * ecolesAvecInterventions : [{ id, nom, ..., interventions: [...] }]
 * types : liste des types d'intervention (pour libellés/catégories)
 */
function calculerStatsGlobales(ecolesAvecInterventions, debut, fin, types) {
  const nbEcoles = ecolesAvecInterventions.length;
  const parEcole = ecolesAvecInterventions.map(e => ({
    ...e,
    interventionsPeriode: interventionsDansPeriode(e.interventions, debut, fin)
  }));

  const toutesInterventions = parEcole.flatMap(e => e.interventionsPeriode);

  const parType = types.map(t => {
    const ecolesCouvertes = parEcole.filter(e => e.interventionsPeriode.some(iv => iv.typeId === t.id));
    const nbInterventions = toutesInterventions.filter(iv => iv.typeId === t.id).length;
    return {
      typeId: t.id,
      label: t.label,
      categorie: t.categorie,
      nbEcolesCouvertes: ecolesCouvertes.length,
      pctEcoles: nbEcoles ? Math.round((ecolesCouvertes.length / nbEcoles) * 100) : 0,
      nbInterventions
    };
  }).sort((a, b) => b.nbInterventions - a.nbInterventions);

  const parCategorie = {};
  Object.keys(CATEGORIES_INTERVENTION).forEach(cat => {
    parCategorie[cat] = toutesInterventions.filter(iv => {
      const t = types.find(t => t.id === iv.typeId);
      return categorieResolue(t ? t.categorie : null) === cat;
    }).length;
  });

  const parIntervenant = {};
  toutesInterventions.forEach(iv => {
    parIntervenant[iv.intervenantId] = (parIntervenant[iv.intervenantId] || 0) + 1;
  });

  return {
    nbEcoles,
    totalInterventions: toutesInterventions.length,
    parType,
    parCategorie,
    parIntervenant,
    parEcole
  };
}

/**
 * Bilan d'action (conseiller ou équipe) : répartition en % du total, pour un bilan de fin
 * d'année. Ne compte que les actions liées à une école (ecoleId défini) — une action sans école
 * part vers Google Agenda mais n'entre dans aucune statistique, seulement dans l'historique brut.
 * actions : liste à plat (voir Store.chargerToutesLesActionsIntervenant / chargerToutesLesActions)
 */
function calculerBilanActions(actions, debut, fin, types) {
  const actionsEcole = actions.filter(a => a.ecoleId);
  const periode = interventionsDansPeriode(actionsEcole, debut, fin);
  const total = periode.length;

  const parCategorie = Object.keys(CATEGORIES_INTERVENTION).map(cat => {
    const n = periode.filter(a => {
      const t = types.find(t => t.id === a.typeId);
      return categorieResolue(t ? t.categorie : null) === cat;
    }).length;
    return { categorie: cat, label: CATEGORIES_INTERVENTION[cat], n, pct: total ? Math.round((n / total) * 100) : 0 };
  }).filter(c => c.n > 0).sort((a, b) => b.n - a.n);

  const parType = types.map(t => {
    const n = periode.filter(a => a.typeId === t.id).length;
    return { typeId: t.id, label: t.label, categorie: categorieResolue(t.categorie), n, pct: total ? Math.round((n / total) * 100) : 0 };
  }).filter(t => t.n > 0).sort((a, b) => b.n - a.n);

  return { total, parCategorie, parType };
}

/** Fraîcheur du suivi d'une école : dernière intervention, en jours, et étiquette visuelle. */
function calculerFraicheurEcole(interventions, aujourdHui = new Date()) {
  if (!interventions.length) return { derniereDate: null, jours: null, classe: 'pastille-jamais', libelle: 'Jamais suivie' };
  const derniere = interventions.map(iv => iv.date).sort().at(-1);
  const jours = Math.floor((aujourdHui - new Date(derniere)) / (1000 * 60 * 60 * 24));
  let classe = 'pastille-recent', libelle = `Il y a ${jours} j`;
  if (jours > 90) { classe = 'pastille-ancien'; }
  else if (jours > 30) { classe = 'pastille-moyen'; }
  if (jours === 0) libelle = "Aujourd'hui";
  else if (jours === 1) libelle = 'Hier';
  return { derniereDate: derniere, jours, classe, libelle };
}

function formaterDate(iso) {
  if (!iso) return '—';
  const [a, m, j] = iso.split('-');
  return `${j}/${m}/${a}`;
}

function formaterPeriodeLibelle(annee) {
  return `Année scolaire ${annee}`;
}
