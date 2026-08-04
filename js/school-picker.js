/*
 * Grille de petits boutons (chips) pour choisir une ou plusieurs écoles, plus léger
 * qu'une longue liste à cases à cocher. Réutilisé par conseiller.html.
 */
function creerGrilleChipsEcoles(container, ecoles, selectionInitiale) {
  const selection = new Set(selectionInitiale || []);

  function rendre() {
    container.innerHTML = ecoles.map(e => `
      <button type="button" class="chip-ecole${selection.has(e.id) ? ' selectionne' : ''}" data-id="${e.id}">${e.nom}</button>
    `).join('');
    container.querySelectorAll('.chip-ecole').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (selection.has(id)) selection.delete(id); else selection.add(id);
        btn.classList.toggle('selectionne');
      });
    });
  }
  rendre();

  return {
    getSelection: () => [...selection],
    setSelection(ids) {
      selection.clear();
      (ids || []).forEach(id => selection.add(id));
      rendre();
    },
    selectAll() {
      ecoles.forEach(e => selection.add(e.id));
      rendre();
    },
    selectNone() {
      selection.clear();
      rendre();
    }
  };
}

/** Affiche une liste en lecture seule (chips-liens) d'écoles, avec un message si vide. */
function rendreChipsLecture(container, ecoles, messageVide) {
  if (!ecoles.length) {
    container.innerHTML = `<p class="intro" style="margin:0;">${messageVide}</p>`;
    return;
  }
  container.innerHTML = '<div class="chips-lecture">' +
    ecoles.map(e => `<a class="chip-ecole-lien" href="ecole.html?id=${e.id}">${e.nom}</a>`).join('') +
    '</div>';
}
