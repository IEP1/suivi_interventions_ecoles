/*
 * Sélection d'un type d'intervention : un seul menu déroulant natif, avec les catégories
 * comme <optgroup> (titres non sélectionnables, sous-titres cliquables) — plus léger qu'une
 * cascade à deux menus. Réutilisé par ecole.html (modale) et conseiller.html.
 */
function initialiserSelecteurType({ selTypeId, inputPersonaliseId, types }) {
  const selType = document.getElementById(selTypeId);
  const inputPerso = document.getElementById(inputPersonaliseId);

  function remplir() {
    const categories = Object.keys(CATEGORIES_INTERVENTION).filter(c => c !== 'autre' && types.some(t => t.categorie === c));
    selType.innerHTML = '<option value="">— Choisir un type d\'intervention —</option>' +
      categories.map(c => `<optgroup label="${CATEGORIES_INTERVENTION[c]}">` +
        types.filter(t => t.categorie === c).map(t => `<option value="${t.id}">${t.label}</option>`).join('') +
        `</optgroup>`).join('');
  }

  selType.addEventListener('change', () => { if (selType.value) inputPerso.value = ''; });
  inputPerso.addEventListener('input', () => { if (inputPerso.value.trim()) selType.value = ''; });

  remplir();

  return {
    reset() {
      selType.value = '';
      inputPerso.value = '';
    },
    majTypes(nouveauxTypes) {
      types = nouveauxTypes;
      remplir();
    },
    typeSelectionneId() {
      return selType.value || null;
    }
  };
}
