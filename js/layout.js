/* En-tête commun + modale de connexion au repo de données GitHub, injectés sur chaque page. */

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
        <a href="conseillers.html" class="grand-onglet ${pageActive === 'conseillers.html' ? 'actif' : ''}">
          <span class="icone">🧑‍🏫</span> Espace conseiller
        </a>
        <a href="ecoles.html" class="grand-onglet ${pageActive === 'ecoles.html' ? 'actif' : ''}">
          <span class="icone">🏫</span> Espace école
        </a>
      </nav>
      <button class="btn btn-sm btn-secondaire" id="btn-connexion-donnees" type="button" title="Connexion au stockage des données">⚙ Données</button>
      <button class="btn btn-sm btn-secondaire" id="btn-connexion-gcal" type="button" title="Connexion à Google Agenda">📅 Agenda</button>
    </header>
  `;
  document.getElementById('btn-connexion-donnees').addEventListener('click', ouvrirModaleConnexion);
  injecterModaleConnexion();
  majPastilleConnexion();

  document.getElementById('btn-connexion-gcal').addEventListener('click', ouvrirModaleGcal);
  injecterModaleGcal();
  majPastilleGcal();
}

function injecterModaleConnexion() {
  if (document.getElementById('modale-connexion')) return;
  const div = document.createElement('div');
  div.id = 'modale-connexion';
  div.className = 'no-print';
  div.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(14,33,56,.5);z-index:100;align-items:center;justify-content:center;';
  div.innerHTML = `
    <div class="carte" style="max-width:440px;width:92%;">
      <h3 style="margin-top:0;">Connexion au repo de données</h3>
      <p class="intro" style="margin-bottom:14px;">
        Les données (écoles, interventions) sont stockées dans votre repo GitHub <strong>privé</strong>,
        distinct du repo public du site. Renseignez-le une fois par appareil.
      </p>
      <div class="champ">
        <label for="ci-owner">Compte / organisation GitHub</label>
        <input type="text" id="ci-owner" placeholder="IEP1">
      </div>
      <div class="champ">
        <label for="ci-repo">Nom du repo privé de données</label>
        <input type="text" id="ci-repo" placeholder="suivi_interventions_ecoles-data">
      </div>
      <div class="champ">
        <label for="ci-branch">Branche</label>
        <input type="text" id="ci-branch" placeholder="main">
      </div>
      <div class="champ">
        <label for="ci-token">Token d'accès personnel (fine-grained, droits Contents en lecture/écriture sur ce repo)</label>
        <input type="text" id="ci-token" placeholder="github_pat_...">
      </div>
      <p id="ci-message" class="alerte" style="display:none;"></p>
      <div class="groupe-btns" style="justify-content:flex-end;">
        <button class="btn btn-danger btn-sm" id="ci-deconnecter" type="button">Déconnecter</button>
        <button class="btn btn-secondaire" id="ci-fermer" type="button">Fermer</button>
        <button class="btn btn-primaire" id="ci-tester" type="button">Tester &amp; enregistrer</button>
      </div>
    </div>
  `;
  document.body.appendChild(div);

  document.getElementById('ci-owner').value = ghConfig.owner;
  document.getElementById('ci-repo').value = ghConfig.repo;
  document.getElementById('ci-branch').value = ghConfig.branch;
  document.getElementById('ci-token').value = ghConfig.token;

  document.getElementById('ci-fermer').addEventListener('click', fermerModaleConnexion);
  document.getElementById('ci-deconnecter').addEventListener('click', () => {
    ghConfig.clear();
    ['ci-owner', 'ci-repo', 'ci-branch', 'ci-token'].forEach(id => document.getElementById(id).value = '');
    majPastilleConnexion();
    afficherMessageModale('Déconnecté. Les données seront lues/écrites uniquement en local (démo).', 'alerte-info');
  });
  document.getElementById('ci-tester').addEventListener('click', async () => {
    const owner = document.getElementById('ci-owner').value.trim();
    const repo = document.getElementById('ci-repo').value.trim();
    const branch = document.getElementById('ci-branch').value.trim() || 'main';
    const token = document.getElementById('ci-token').value.trim();
    if (!owner || !repo || !token) {
      afficherMessageModale('Merci de renseigner le compte, le repo et le token.', 'alerte-warn');
      return;
    }
    ghConfig.set(owner, repo, branch, token);
    afficherMessageModale('Test de connexion en cours…', 'alerte-info');
    const ok = await testerConnexion();
    if (ok) {
      afficherMessageModale('Connexion réussie ! Les données seront désormais sauvegardées sur GitHub.', 'alerte-ok');
      majPastilleConnexion();
    } else {
      afficherMessageModale("Échec : vérifiez le nom du repo et les droits du token (Contents: Read and write).", 'alerte-err');
    }
  });
}

function afficherMessageModale(msg, classe) {
  const el = document.getElementById('ci-message');
  el.textContent = msg;
  el.className = 'alerte ' + classe;
  el.style.display = 'block';
}

function ouvrirModaleConnexion() {
  document.getElementById('modale-connexion').style.display = 'flex';
}
function fermerModaleConnexion() {
  document.getElementById('modale-connexion').style.display = 'none';
}

function majPastilleConnexion() {
  const btn = document.getElementById('btn-connexion-donnees');
  if (!btn) return;
  if (ghConfig.isConfigured()) {
    btn.textContent = '🟢 Données : ' + ghConfig.repo;
  } else {
    btn.textContent = '⚪ Données : non connecté';
  }
}

function injecterModaleGcal() {
  if (document.getElementById('modale-gcal')) return;
  const div = document.createElement('div');
  div.id = 'modale-gcal';
  div.className = 'no-print';
  div.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(14,33,56,.5);z-index:100;align-items:flex-start;justify-content:center;overflow-y:auto;padding:32px 16px;';
  const couleursActuelles = gcalConfig.couleurs;
  const optionsCouleurs = GCAL_COULEURS_REF.map(c => `<option value="${c.id}">${c.id} — ${c.nom}</option>`).join('');
  const lignesCouleurs = Object.keys(CATEGORIES_INTERVENTION).map(cat => {
    const valeur = couleursActuelles[cat] || COULEURS_GCAL_CATEGORIE[cat] || '8';
    return `
      <div class="ligne-champs" style="align-items:center;margin-bottom:6px;">
        <span style="flex:1;font-size:0.85rem;">${CATEGORIES_INTERVENTION[cat]}</span>
        <select class="gc-couleur-cat" data-categorie="${cat}" style="width:auto;max-width:150px;">${optionsCouleurs}</select>
      </div>`;
  }).join('');
  div.innerHTML = `
    <div class="carte" style="max-width:460px;width:92%;">
      <h3 style="margin-top:0;">Connexion à Google Agenda</h3>
      <p class="intro" style="margin-bottom:14px;">
        Facultatif : chaque intervention enregistrée dans l'appli est aussi ajoutée automatiquement
        à votre Google Agenda (un seul geste de saisie pour le suivi et pour la DRH). Nécessite un
        Client ID OAuth Google (voir README, section Google Agenda), à créer une seule fois.
      </p>
      <div class="champ">
        <label for="gc-client-id">Client ID OAuth Google</label>
        <input type="text" id="gc-client-id" placeholder="xxxxxxxx.apps.googleusercontent.com">
      </div>
      <div class="champ">
        <label for="gc-calendar-id">Identifiant du calendrier</label>
        <input type="text" id="gc-calendar-id" placeholder="primary">
      </div>
      <p id="gc-message" class="alerte" style="display:none;"></p>
      <div class="groupe-btns" style="justify-content:flex-end;">
        <button class="btn btn-danger btn-sm" id="gc-deconnecter" type="button">Déconnecter</button>
        <button class="btn btn-secondaire" id="gc-fermer" type="button">Fermer</button>
        <button class="btn btn-primaire" id="gc-connecter" type="button">Connecter</button>
      </div>

      <h3>Couleurs par catégorie</h3>
      <p class="intro" style="margin-bottom:10px;">
        Propres à vous : chaque personne peut choisir ses propres couleurs (elles restent dans ce
        navigateur, comme votre connexion). Sert à retrouver vos catégories dans « Utilisation du
        temps » de Google Agenda (voir README pour la correspondance libellé/couleur).
      </p>
      <div id="gc-couleurs-liste">${lignesCouleurs}</div>
      <p id="gc-couleurs-message" class="alerte" style="display:none;"></p>
      <div class="groupe-btns" style="justify-content:flex-end;">
        <button class="btn btn-primaire btn-sm" id="gc-enregistrer-couleurs" type="button">Enregistrer les couleurs</button>
      </div>
    </div>
  `;
  document.body.appendChild(div);

  document.getElementById('gc-client-id').value = gcalConfig.clientId;
  document.getElementById('gc-calendar-id').value = gcalConfig.calendarId;
  div.querySelectorAll('.gc-couleur-cat').forEach(sel => {
    const valeur = couleursActuelles[sel.dataset.categorie] || COULEURS_GCAL_CATEGORIE[sel.dataset.categorie] || '8';
    sel.value = valeur;
  });

  document.getElementById('gc-enregistrer-couleurs').addEventListener('click', () => {
    const map = {};
    div.querySelectorAll('.gc-couleur-cat').forEach(sel => { map[sel.dataset.categorie] = sel.value; });
    gcalConfig.setCouleurs(map);
    const msg = document.getElementById('gc-couleurs-message');
    msg.className = 'alerte alerte-ok'; msg.textContent = 'Couleurs enregistrées.'; msg.style.display = 'block';
  });

  document.getElementById('gc-fermer').addEventListener('click', fermerModaleGcal);
  document.getElementById('gc-deconnecter').addEventListener('click', () => {
    gcalDeconnecter();
    gcalConfig.clear();
    document.getElementById('gc-client-id').value = '';
    document.getElementById('gc-calendar-id').value = '';
    div.querySelectorAll('.gc-couleur-cat').forEach(sel => { sel.value = COULEURS_GCAL_CATEGORIE[sel.dataset.categorie] || '8'; });
    majPastilleGcal();
    afficherMessageModaleGcal('Déconnecté. Les interventions ne seront plus ajoutées à Google Agenda.', 'alerte-info');
  });
  document.getElementById('gc-connecter').addEventListener('click', async () => {
    const clientId = document.getElementById('gc-client-id').value.trim();
    const calendarId = document.getElementById('gc-calendar-id').value.trim() || 'primary';
    if (!clientId) {
      afficherMessageModaleGcal('Merci de renseigner le Client ID OAuth Google.', 'alerte-warn');
      return;
    }
    gcalConfig.set(clientId, calendarId);
    afficherMessageModaleGcal('Ouverture de la fenêtre de consentement Google…', 'alerte-info');
    try {
      await gcalConnecter();
      afficherMessageModaleGcal('Connecté ! Les prochaines interventions seront ajoutées à Google Agenda.', 'alerte-ok');
      majPastilleGcal();
    } catch (e) {
      afficherMessageModaleGcal('Échec de la connexion : ' + e.message, 'alerte-err');
    }
  });
}

function afficherMessageModaleGcal(msg, classe) {
  const el = document.getElementById('gc-message');
  el.textContent = msg;
  el.className = 'alerte ' + classe;
  el.style.display = 'block';
}

function ouvrirModaleGcal() {
  document.getElementById('modale-gcal').style.display = 'flex';
}
function fermerModaleGcal() {
  document.getElementById('modale-gcal').style.display = 'none';
}

function majPastilleGcal() {
  const btn = document.getElementById('btn-connexion-gcal');
  if (!btn) return;
  if (gcalConfig.isConfigured() && gcalConfig.actif) {
    btn.textContent = '🟢 Agenda connecté';
  } else {
    btn.textContent = '⚪ Agenda : non connecté';
  }
}
