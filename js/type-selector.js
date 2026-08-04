/*
 * Sélection en cascade d'un type d'intervention : Catégorie -> Type, plutôt qu'une longue
 * liste de 17 choix d'un coup. Réutilisé par ecole.html (modale) et conseiller.html.
 */
function initialiserSelecteurType({ selCategorieId, selTypeId, inputPersonaliseId, types }) {
  const selCategorie = document.getElementById(selCategorieId);
  const selType = document.getElementById(selTypeId);
  const inputPerso = document.getElementById(inputPersonaliseId);
  const PLACEHOLDER_TYPE = "— Choisir une catégorie d'abord —";

  function remplirCategories() {
    const categories = Object.keys(CATEGORIES_INTERVENTION).filter(c => c !== 'autre' && types.some(t => t.categorie === c));
    selCategorie.innerHTML = '<option value="">— Choisir —</option>' +
      categories.map(c => `<option value="${c}">${CATEGORIES_INTERVENTION[c]}</option>`).join('');
  }

  function remplirTypes(categorie) {
    const options = types.filter(t => t.categorie === categorie);
    if (!categorie) {
      selType.innerHTML = `<option value="">${PLACEHOLDER_TYPE}</option>`;
      selType.disabled = true;
      return;
    }
    selType.innerHTML = '<option value="">— Choisir —</option>' + options.map(t => `<option value="${t.id}">${t.label}</option>`).join('');
    selType.disabled = false;
  }

  selCategorie.addEventListener('change', () => remplirTypes(selCategorie.value));
  selType.addEventListener('change', () => { if (selType.value) inputPerso.value = ''; });
  inputPerso.addEventListener('input', () => {
    if (inputPerso.value.trim()) {
      selCategorie.value = '';
      remplirTypes('');
    }
  });

  remplirCategories();
  remplirTypes('');

  return {
    reset() {
      selCategorie.value = '';
      remplirTypes('');
      inputPerso.value = '';
    },
    majTypes(nouveauxTypes) {
      types = nouveauxTypes;
      remplirCategories();
      remplirTypes(selCategorie.value);
    },
    typeSelectionneId() {
      return selType.value || null;
    }
  };
}
