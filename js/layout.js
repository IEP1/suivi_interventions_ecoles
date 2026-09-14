/* En-tête commun (nav), injecté sur chaque page. */

function injecterEntete(pageActive) {
  const cible = document.getElementById('entete-app');
  if (!cible) return;
  cible.innerHTML = `
    <header class="entete no-print">
      <a href="index.html" class="entete-logo">
        <img src="assets/logo-iep1.png" alt="Logo IEP1">
        <div class="titres">
          <h1>IEP1</h1>
          <p class="sous-titre">Avec les équipes, pour les élèves</p>
        </div>
      </a>
      <nav class="grands-onglets">
        <a href="ecoles.html" class="grand-onglet ${pageActive === 'ecoles.html' ? 'actif' : ''}">
          <span class="icone">🏫</span> Espace école
        </a>
        <a href="conseillers.html" class="grand-onglet ${pageActive === 'conseillers.html' ? 'actif' : ''}">
          <span class="icone">🧑‍🏫</span> Espace formateurs
        </a>
        <a href="saisie-rapide.html" class="grand-onglet ${pageActive === 'saisie-rapide.html' ? 'actif' : ''}" title="Point d'entrée unique pour ajouter une action, pensé pour le téléphone">
          <span class="icone">⚡</span> Saisie rapide
        </a>
      </nav>
    </header>
  `;
}
