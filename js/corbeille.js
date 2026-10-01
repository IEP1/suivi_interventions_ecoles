/*
 * Corbeille des actions supprimées (2026-10-01) — partagée par conseiller.html et ecole.html.
 * Une action supprimée est récupérable 5 jours (table actions_corbeille, voir supabase/schema.sql),
 * puis effacée définitivement. Nécessite seed-data.js (libelleType), stats.js (formaterDate) et
 * data-store.js (Store.chargerCorbeille / restaurerAction).
 *
 * Usage : rendreCorbeille({ conteneurId, filtre: { intervenantId } | { ecoleId }, types,
 *                           intervenants, ecoles, apresRestauration })
 * Le conteneur est un <details> (replié par défaut) ; son <summary> affiche le nombre d'actions.
 */
const DUREE_CORBEILLE_JOURS = 5;

async function rendreCorbeille(options) {
  const conteneur = document.getElementById(options.conteneurId);
  let actions;
  try {
    actions = await Store.chargerCorbeille(options.filtre);
  } catch (e) {
    conteneur.innerHTML = `<summary>🗑 Corbeille</summary><p class="alerte alerte-err">${e.message}</p>`;
    return;
  }
  const joursRestants = a => Math.max(0, Math.ceil(DUREE_CORBEILLE_JOURS - (Date.now() - new Date(a.supprimeLe).getTime()) / 86400000));
  const nomIntervenant = id => { const i = (options.intervenants || []).find(x => x.id === id); return i ? i.nom : id; };
  const nomEcole = id => { const e = (options.ecoles || []).find(x => x.id === id); return e ? e.nom : '—'; };

  conteneur.innerHTML = `
    <summary style="cursor:pointer;font-weight:600;">🗑 Corbeille (${actions.length})
      <span style="font-weight:400;color:var(--texte-muted);font-size:0.85rem;"> — actions supprimées, récupérables ${DUREE_CORBEILLE_JOURS} jours</span></summary>
    ${actions.length ? `
    <div class="table-wrap" style="margin-top:10px;">
      <table>
        <thead><tr><th>Date</th><th>Type</th><th>${options.filtre.ecoleId ? 'Intervenant' : 'École'}</th><th>Thème</th><th>Effacement définitif</th><th></th></tr></thead>
        <tbody>${actions.map(a => `
          <tr>
            <td style="white-space:nowrap;">${formaterDate(a.date)}</td>
            <td>${libelleType(a.typeId, options.types)}</td>
            <td>${options.filtre.ecoleId ? nomIntervenant(a.intervenantId) : (a.ecoleId ? nomEcole(a.ecoleId) : (a.lieuLibre || '—'))}</td>
            <td>${a.theme || '—'}</td>
            <td style="white-space:nowrap;">${joursRestants(a) <= 1 ? 'demain' : `dans ${joursRestants(a)} jours`}</td>
            <td><button type="button" class="btn btn-sm btn-secondaire" data-restaurer="${a.id}">Restaurer</button></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>` : '<p class="intro" style="margin:10px 0 0;">La corbeille est vide.</p>'}`;

  conteneur.querySelectorAll('[data-restaurer]').forEach(btn => btn.addEventListener('click', async () => {
    btn.disabled = true;
    try {
      await Store.restaurerAction(btn.dataset.restaurer);
      await rendreCorbeille(options);
      conteneur.open = true;
      if (options.apresRestauration) await options.apresRestauration();
    } catch (e) {
      btn.disabled = false;
      alert('Restauration impossible : ' + e.message);
    }
  }));
}
