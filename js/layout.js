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
      <a href="saisie-rapide.html" class="btn btn-sm btn-orange" title="Formulaire minimal, pensé pour le téléphone">⚡ Saisie rapide</a>
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
  const hexDe = (id) => (GCAL_COULEURS_REF.find(c => c.id === id) || {}).hex || '#8A97A3';
  const lignesCouleurs = Object.keys(CATEGORIES_INTERVENTION).map(cat => {
    const valeur = couleursActuelles[cat] || COULEURS_GCAL_CATEGORIE[cat] || '8';
    const swatches = GCAL_COULEURS_REF.map(c => `
      <button type="button" class="gc-swatch" data-id="${c.id}" title="${c.nom}"
        style="width:20px;height:20px;border-radius:50%;border:2px solid ${c.id === valeur ? '#0F2942' : 'transparent'};background:${c.hex};cursor:pointer;padding:0;flex-shrink:0;"></button>`).join('');
    return `
      <div class="gc-ligne-couleur" data-categorie="${cat}" data-selected="${valeur}" style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span class="gc-apercu" style="width:22px;height:22px;border-radius:50%;flex-shrink:0;border:1px solid var(--bordure);background:${hexDe(valeur)};"></span>
        <span style="flex:1;font-size:0.85rem;">${CATEGORIES_INTERVENTION[cat]}</span>
        <div style="display:flex;gap:4px;flex-wrap:wrap;max-width:200px;">${swatches}</div>
      </div>`;
  }).join('');
  div.innerHTML = `
    <div class="carte" style="max-width:460px;width:92%;">
      <div class="barre-actions" style="margin-bottom:6px;">
        <h3 style="margin:0;">Connexion à Google Agenda</h3>
        <button type="button" class="btn btn-sm btn-secondaire" id="gc-aide" title="Comment se connecter ?">?</button>
      </div>
      <div id="gc-tuto" style="display:none;background:var(--bg);border:1px solid var(--bordure);border-radius:var(--radius-sm);padding:12px 14px;margin-bottom:14px;font-size:0.85rem;">
        <b>Comment se connecter :</b>
        <ol style="margin:8px 0 0;padding-left:20px;">
          <li>Demander le <b>Client ID</b> à la personne référente du site (le même pour tout le monde).</li>
          <li>Le coller ci-dessous dans « Client ID OAuth Google ».</li>
          <li>Cliquer <b>Connecter</b>, puis se connecter avec son <b>propre compte Google</b> (jamais celui de quelqu'un d'autre).</li>
          <li>Google affiche un écran « application non vérifiée » : cliquer <i>Paramètres avancés</i> puis <i>Accéder à… (non sécurisé)</i> — normal pour un usage interne.</li>
        </ol>
      </div>
      <p class="intro" style="margin-bottom:14px;">
        Facultatif : chaque intervention enregistrée dans l'appli est aussi ajoutée automatiquement
        à votre Google Agenda (un seul geste de saisie pour le suivi et pour la DRH).
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

  document.getElementById('gc-aide').addEventListener('click', () => {
    const tuto = document.getElementById('gc-tuto');
    tuto.style.display = tuto.style.display === 'none' ? 'block' : 'none';
  });

  function selectionnerCouleur(ligne, id) {
    ligne.dataset.selected = id;
    ligne.querySelector('.gc-apercu').style.background = hexDe(id);
    ligne.querySelectorAll('.gc-swatch').forEach(b => {
      b.style.borderColor = b.dataset.id === id ? '#0F2942' : 'transparent';
    });
  }
  div.querySelectorAll('.gc-ligne-couleur').forEach(ligne => {
    ligne.querySelectorAll('.gc-swatch').forEach(btn => {
      btn.addEventListener('click', () => selectionnerCouleur(ligne, btn.dataset.id));
    });
  });

  document.getElementById('gc-enregistrer-couleurs').addEventListener('click', () => {
    const map = {};
    div.querySelectorAll('.gc-ligne-couleur').forEach(ligne => { map[ligne.dataset.categorie] = ligne.dataset.selected; });
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
    div.querySelectorAll('.gc-ligne-couleur').forEach(ligne => {
      selectionnerCouleur(ligne, COULEURS_GCAL_CATEGORIE[ligne.dataset.categorie] || '8');
    });
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
