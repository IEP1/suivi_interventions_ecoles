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
      return t && t.categorie === cat;
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
