/*
 * Assistant par étapes générique : affiche une seule étape à la fois (qui / quoi / où / détails
 * selon la page), navigation Suivant/Précédent uniquement (pas d'onglets cliquables), puis une
 * étape de récapitulatif ajoutée automatiquement à la fin avant validation. Réutilisé par
 * ecole.html, conseiller.html et saisie-rapide.html — le contenu de chaque étape (champs,
 * validation) reste propre à chaque page, seule la mécanique de navigation est partagée.
 *
 * Structure HTML attendue dans `racine` :
 *   .assistant-titre-etape         (libellé de l'étape en cours)
 *   .assistant-barre > span        (barre de progression, largeur en %)
 *   .assistant-message             (zone d'erreur de validation, cachée par défaut)
 *   .etape-assistant[data-etape="ID"]   (une par étape déclarée, une seule visible à la fois)
 *   .etape-recap                   (générée à la volée par construireRecap() à la dernière étape)
 *   .assistant-precedent / .assistant-suivant / .assistant-valider   (boutons de navigation)
 */
function creerAssistant({ racine, etapes, construireRecap, onValider, labelValider }) {
  let index = 0;

  const titreEtape = racine.querySelector('.assistant-titre-etape');
  const barre = racine.querySelector('.assistant-barre > span');
  const divMessage = racine.querySelector('.assistant-message');
  const divRecap = racine.querySelector('.etape-recap');
  const btnPrecedent = racine.querySelector('.assistant-precedent');
  const btnSuivant = racine.querySelector('.assistant-suivant');
  const btnValider = racine.querySelector('.assistant-valider');

  function etapeDiv(id) {
    return racine.querySelector(`.etape-assistant[data-etape="${id}"]`);
  }

  function masquerErreur() {
    if (divMessage) divMessage.style.display = 'none';
  }

  function afficherMessage(msg, classe) {
    if (!divMessage) return;
    divMessage.className = 'assistant-message alerte ' + classe;
    divMessage.textContent = msg;
    divMessage.style.display = 'block';
  }
  function afficherErreur(msg) { afficherMessage(msg, 'alerte-warn'); }
  function afficherMessageOk(msg) { afficherMessage(msg, 'alerte-ok'); }

  function afficher() {
    masquerErreur();
    const surRecap = index >= etapes.length;
    etapes.forEach(e => { etapeDiv(e.id).style.display = 'none'; });
    if (divRecap) divRecap.style.display = surRecap ? 'block' : 'none';

    if (surRecap) {
      titreEtape.textContent = 'Récapitulatif';
      if (divRecap) divRecap.innerHTML = construireRecap();
    } else {
      const e = etapes[index];
      etapeDiv(e.id).style.display = 'block';
      if (e.onEntree) e.onEntree();
      titreEtape.textContent = e.titre;
    }

    const etapeAffichee = Math.min(index, etapes.length) + 1;
    const total = etapes.length + 1; // +1 pour le récapitulatif
    if (barre) barre.style.width = Math.round((etapeAffichee / total) * 100) + '%';

    btnPrecedent.style.display = index === 0 ? 'none' : 'inline-flex';
    btnSuivant.style.display = surRecap ? 'none' : 'inline-flex';
    btnValider.style.display = surRecap ? 'inline-flex' : 'none';
    if (labelValider && surRecap) btnValider.textContent = labelValider;
  }

  btnSuivant.addEventListener('click', () => {
    const e = etapes[index];
    const resultat = e.valider ? e.valider() : true;
    if (resultat !== true) { afficherErreur(resultat); return; }
    index++;
    afficher();
  });
  btnPrecedent.addEventListener('click', () => {
    index = Math.max(0, index - 1);
    afficher();
  });
  btnValider.addEventListener('click', onValider);

  afficher(); // état initial cohérent même si l'appelant n'invoque pas reinitialiser() tout de suite

  return {
    reinitialiser() { index = 0; afficher(); },
    aller(i) { index = Math.max(0, Math.min(etapes.length, i)); afficher(); },
    etapeActuelleId() { return index < etapes.length ? etapes[index].id : 'recap'; },
    afficherErreur,
    afficherMessageOk,
    afficherMessage
  };
}
