/*
 * Connecteur Google Agenda (optionnel) : pousse automatiquement un événement dans Google Agenda
 * à chaque intervention enregistrée dans l'appli, pour éviter la double saisie (outil pour le
 * chef, agenda pour la DRH). Écriture uniquement (jamais de lecture/synchro inverse).
 *
 * OAuth 2.0 côté navigateur via Google Identity Services (aucun secret ni backend : le Client ID
 * OAuth d'une "Web application" est public par construction, comme pour une SPA). Le jeton d'accès
 * ne vit qu'en mémoire (jamais dans localStorage) et est redemandé à chaque session.
 */
const GCAL_API = 'https://www.googleapis.com/calendar/v3';

/*
 * Client ID OAuth Google, commun à tout le monde — comme la clé Supabase, ce n'est pas un secret :
 * un Client ID de type "Web application" est public par construction (voir doc Google OAuth,
 * et README section Google Agenda). Créé une seule fois par la personne référente du site ; codé
 * en dur ici pour que personne d'autre n'ait jamais à s'en préoccuper — chacun clique juste
 * "Connecter" et s'authentifie avec son PROPRE compte Google, jamais celui de quelqu'un d'autre.
 */
const GCAL_CLIENT_ID = 'REMPLACER_PAR_LE_CLIENT_ID.apps.googleusercontent.com';

/** Les 11 couleurs d'événement Google Agenda (id officiel + nom + teinte approximative). */
const GCAL_COULEURS_REF = [
  { id: '1', nom: 'Lavande', hex: '#7986CB' },
  { id: '2', nom: 'Sauge', hex: '#33B679' },
  { id: '3', nom: 'Raisin', hex: '#8E24AA' },
  { id: '4', nom: 'Flamant', hex: '#E67C73' },
  { id: '5', nom: 'Banane', hex: '#F6BF26' },
  { id: '6', nom: 'Mandarine', hex: '#F4511E' },
  { id: '7', nom: 'Paon', hex: '#039BE5' },
  { id: '8', nom: 'Graphite', hex: '#616161' },
  { id: '9', nom: 'Myrtille', hex: '#3F51B5' },
  { id: '10', nom: 'Basilic', hex: '#0B8043' },
  { id: '11', nom: 'Tomate', hex: '#D50000' }
];

const gcalConfig = {
  get clientId() { return GCAL_CLIENT_ID; },
  get calendarId() { return localStorage.getItem('sie_gcal_calendar_id') || 'primary'; },
  get actif() { return localStorage.getItem('sie_gcal_actif') === '1'; },
  /** Couleurs personnalisées par catégorie (remplacent COULEURS_GCAL_CATEGORIE), propres à
   *  chaque personne puisque stockées dans son navigateur, comme la connexion elle-même. */
  get couleurs() {
    try { return JSON.parse(localStorage.getItem('sie_gcal_couleurs') || '{}'); } catch (e) { return {}; }
  },
  setCouleurs(map) { localStorage.setItem('sie_gcal_couleurs', JSON.stringify(map)); },
  set(calendarId) {
    localStorage.setItem('sie_gcal_calendar_id', calendarId || 'primary');
  },
  setActif(actif) { localStorage.setItem('sie_gcal_actif', actif ? '1' : '0'); },
  clear() {
    ['sie_gcal_calendar_id', 'sie_gcal_actif', 'sie_gcal_couleurs'].forEach(k => localStorage.removeItem(k));
    _gcalAccessToken = null;
    _gcalAccessTokenExpiry = 0;
  },
  isConfigured() { return !!GCAL_CLIENT_ID && !GCAL_CLIENT_ID.startsWith('REMPLACER_'); }
};

let _gcalTokenClient = null;
let _gcalAccessToken = null;
let _gcalAccessTokenExpiry = 0;

function gcalInitTokenClient() {
  if (_gcalTokenClient || !window.google || !window.google.accounts || !gcalConfig.clientId) return;
  _gcalTokenClient = google.accounts.oauth2.initTokenClient({
    client_id: gcalConfig.clientId,
    scope: 'https://www.googleapis.com/auth/calendar.events',
    callback: () => {}
  });
}

/** Demande un jeton d'accès. interactif=true affiche la fenêtre de consentement Google si besoin. */
function gcalDemanderToken(interactif) {
  return new Promise((resolve, reject) => {
    if (!window.google || !window.google.accounts) { reject(new Error('Google Identity Services non chargé (vérifiez votre connexion internet).')); return; }
    gcalInitTokenClient();
    if (!_gcalTokenClient) { reject(new Error('Client ID Google Agenda non configuré.')); return; }
    _gcalTokenClient.callback = (reponse) => {
      if (reponse.error) { reject(new Error(reponse.error)); return; }
      _gcalAccessToken = reponse.access_token;
      _gcalAccessTokenExpiry = Date.now() + (reponse.expires_in - 60) * 1000;
      resolve(_gcalAccessToken);
    };
    _gcalTokenClient.requestAccessToken({ prompt: interactif ? 'consent' : '' });
  });
}

async function gcalToken() {
  if (_gcalAccessToken && Date.now() < _gcalAccessTokenExpiry) return _gcalAccessToken;
  try {
    return await gcalDemanderToken(false);
  } catch (e) {
    return gcalDemanderToken(true);
  }
}

/** Connexion explicite (bouton) : ouvre la fenêtre de consentement Google si besoin. */
async function gcalConnecter() {
  await gcalDemanderToken(true);
  gcalConfig.setActif(true);
}

function gcalDeconnecter() {
  _gcalAccessToken = null;
  _gcalAccessTokenExpiry = 0;
  gcalConfig.setActif(false);
}

/** Crée un événement (journée entière, pas d'heure) dans le calendrier configuré. */
async function gcalCreerEvenement({ titre, description, date, colorId }) {
  const token = await gcalToken();
  const lendemain = new Date(date + 'T00:00:00');
  lendemain.setDate(lendemain.getDate() + 1);
  const res = await fetch(`${GCAL_API}/calendars/${encodeURIComponent(gcalConfig.calendarId)}/events`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      summary: titre,
      description,
      start: { date },
      end: { date: lendemain.toISOString().slice(0, 10) },
      ...(colorId ? { colorId } : {})
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Échec création événement Google Agenda (${res.status}) : ${err.error?.message || ''}`);
  }
  return res.json();
}

/**
 * Pousse une intervention vers Google Agenda si le connecteur est actif — ne fait rien sinon.
 * N'échoue jamais bruyamment : les erreurs sont journalisées en console (l'enregistrement
 * principal dans le repo de données ne doit jamais être bloqué par un souci côté Google).
 * ecoleNom absent (action générale, non liée à une école) : titre sans préfixe d'école.
 * categorie sert à colorer l'événement (voir COULEURS_GCAL_CATEGORIE, js/seed-data.js) pour que
 * "Utilisation du temps" dans Google Agenda catégorise automatiquement, une fois les libellés
 * associés à ces couleurs configurés côté Google (voir README).
 */
async function gcalPousserIntervention({ ecoleNom, typeLabel, theme, notes, date, categorie }) {
  if (!gcalConfig.actif || !gcalConfig.isConfigured()) return;
  const titre = `${ecoleNom ? ecoleNom + ' — ' : ''}${typeLabel}${theme ? ' : ' + theme : ''}`;
  const description = [notes, 'Ajouté automatiquement depuis Suivi des interventions IEP1.'].filter(Boolean).join('\n\n');
  const cat = categorieResolue(categorie);
  const colorId = gcalConfig.couleurs[cat] || COULEURS_GCAL_CATEGORIE[cat] || COULEURS_GCAL_CATEGORIE.divers;
  try {
    await gcalCreerEvenement({ titre, description, date, colorId });
  } catch (e) {
    console.warn('Google Agenda :', e.message);
    throw e;
  }
}
