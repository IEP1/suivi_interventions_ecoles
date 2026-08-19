/*
 * Sélection d'un type d'intervention : un seul menu déroulant natif, avec les catégories
 * comme <optgroup> (titres non sélectionnables, sous-titres cliquables) — plus léger qu'une
 * cascade à deux menus. Réutilisé par ecole.html (modale) et conseiller.html.
 *
 * filtrerEnEcole : si vrai, ne propose que les types marqués enEcole: true dans seed-data.js
 * (un type sans le champ enEcole, ex. un type personnalisé, reste proposé par défaut).
 */
function initialiserSelecteurType({ selTypeId, inputPersonaliseId, types, filtrerEnEcole }) {
  const selType = document.getElementById(selTypeId);
  const inputPerso = document.getElementById(inputPersonaliseId);

  function typesVisibles() {
    return filtrerEnEcole ? types.filter(t => t.enEcole !== false) : types;
  }

  function remplir() {
    const visibles = typesVisibles();
    const categories = Object.keys(CATEGORIES_INTERVENTION).filter(c => c !== 'autre' && visibles.some(t => t.categorie === c));
    // Types personnalisés créés en cours d'usage (categorie 'autre', ou catégorie inconnue/héritée) :
    // sans ce groupe ils restaient invisibles dans le menu et ne pouvaient jamais être réutilisés.
    const personnalises = visibles.filter(t => !CATEGORIES_INTERVENTION[t.categorie] || t.categorie === 'autre');
    selType.innerHTML = '<option value="">— Choisir un type d\'intervention —</option>' +
      categories.map(c => `<optgroup label="${CATEGORIES_INTERVENTION[c]}">` +
        visibles.filter(t => t.categorie === c).map(t => `<option value="${t.id}">${t.label}</option>`).join('') +
        `</optgroup>`).join('') +
      (personnalises.length ? `<optgroup label="Actions personnalisées">` +
        personnalises.map(t => `<option value="${t.id}">${t.label}</option>`).join('') + `</optgroup>` : '');
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
