/*
 * Couche de stockage : lit/écrit les données de l'appli dans le repo GitHub privé de données, via
 * un proxy serveur (netlify/functions/data.js) qui détient seul le token GitHub. Plus aucun
 * appareil n'a besoin de "se connecter" : la lecture et l'écriture marchent directement, pour
 * quiconque ouvre le site — l'accès se règle en partageant (ou non) l'URL du site, pas par un
 * token personnel à copier.
 *
 * Repli local : si le proxy est injoignable (ex. site ouvert en local avec un simple serveur
 * statique, sans `netlify dev`), l'appli retombe sur les données de démarrage (js/seed-data.js)
 * sans planter — pratique pour prévisualiser une modification de code sans dépendre de Netlify.
 */
const API_DATA = '/api/data';

/** Lit un fichier JSON du repo de données. Retourne {data, sha} ou {data: fallback, sha: null} si absent/injoignable. */
async function chargerJSON(path, fallback) {
  let res;
  try {
    res = await fetch(`${API_DATA}?path=${encodeURIComponent(path)}`);
  } catch (e) {
    // Échec réseau (proxy injoignable, ex. prévisualisation locale sans Netlify) : mode démo.
    console.warn('chargerJSON : proxy de données injoignable, repli sur les données de démonstration —', path);
    return { data: fallback, sha: null };
  }
  if (res.status === 404) {
    // Sur Netlify, notre fonction renvoie {data:null} (jamais un 404 HTTP) pour un fichier absent :
    // un vrai 404 ici signifie que /api/data lui-même n'existe pas (site servi hors Netlify).
    console.warn("chargerJSON : /api/data introuvable (site non servi depuis Netlify ?), repli sur les données de démonstration —", path);
    return { data: fallback, sha: null };
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const erreur = new Error(err.error || `Erreur ${res.status} sur ${path}`);
    console.error('chargerJSON', path, erreur);
    throw erreur;
  }
  const { data, sha } = await res.json();
  return data === null ? { data: fallback, sha: null } : { data, sha };
}

/** Écrit un fichier JSON dans le repo de données (crée ou met à jour). */
async function sauvegarderJSON(path, data, message) {
  let res;
  try {
    res = await fetch(API_DATA, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, data, message })
    });
  } catch (e) {
    throw new Error("Impossible de joindre le stockage des données — vérifiez la connexion internet, ou que le site est bien servi depuis Netlify (pas un aperçu local sans fonctions).");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Échec de sauvegarde (${res.status})`);
  }
  return res.json();
}
