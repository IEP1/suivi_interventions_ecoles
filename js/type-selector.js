/*
 * Sélection d'un type d'intervention : un seul menu déroulant natif, avec les catégories
 * comme <optgroup> (titres non sélectionnables, sous-titres cliquables) — plus léger qu'une
 * cascade à deux menus. Réutilisé par ecole.html (modale), conseiller.html et saisie-rapide.html.
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

/*
 * Remplit (ou masque) le menu déroulant « Thème / détail » avec les enseignants réels de l'école
 * (structure pédagogique), pour les types de TYPES_PERSONNE_SUIVIE — avec un repli « Autre / non
 * listé… » qui laisse la main au champ texte libre associé (inputId). Choisir un nom recopie sa
 * valeur dans le champ texte : c'est toujours ce champ qui est enregistré, le menu n'est qu'une
 * aide à la saisie.
 */
function remplirPersonneSuivie(selectId, inputId, typeId, equipe) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  const applicable = TYPES_PERSONNE_SUIVIE.includes(typeId) && equipe && equipe.enseignants.length;
  if (!applicable) {
    sel.style.display = 'none';
    sel.innerHTML = '';
    return;
  }
  const tri = [...equipe.enseignants].sort((a, b) => (a.niveau || '').localeCompare(b.niveau || ''));
  sel.innerHTML = '<option value="">— Choisir dans la structure pédagogique —</option>' +
    tri.map(t => {
      const nom = [t.prenom, t.nom].filter(Boolean).join(' ') || 'Sans nom';
      const details = [t.niveau, t.statut].filter(Boolean).join(' · ');
      return `<option value="${nom}">${nom}${details ? ' (' + details + ')' : ''}</option>`;
    }).join('') +
    '<option value="__autre__">Autre / non listé…</option>';
  sel.style.display = 'block';
  sel.onchange = () => {
    const input = document.getElementById(inputId);
    if (sel.value === '__autre__') { input.value = ''; input.focus(); }
    else if (sel.value) { input.value = sel.value; }
  };
}
