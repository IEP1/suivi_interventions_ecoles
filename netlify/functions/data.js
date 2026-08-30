/*
 * Proxy serveur vers l'API GitHub Contents, pour le repo privé de données.
 *
 * Le token GitHub (variable d'environnement GITHUB_TOKEN, réglée dans Netlify → Site
 * configuration → Environment variables) ne vit QUE côté serveur : il n'est jamais envoyé au
 * navigateur, jamais visible dans le code source de l'appli (qui, lui, reste public sur GitHub
 * Pages... enfin ici sur Netlify). Plus personne — formateur, secrétariat, IAP, inspecteur de
 * passage — n'a besoin de "se connecter" pour lire ou écrire : l'accès se règle uniquement en
 * partageant (ou non) l'URL du site.
 *
 * GET  /api/data?path=<chemin>              -> lit un fichier JSON du repo de données
 * POST /api/data  { path, data, message }   -> crée/met à jour un fichier JSON
 *
 * Variables d'environnement attendues (Netlify → Site configuration → Environment variables) :
 *   GITHUB_TOKEN  - fine-grained personal access token, Contents: Read and write, limité au repo
 *                   de données ci-dessous.
 *   GITHUB_OWNER  - ex. "IEP1"
 *   GITHUB_REPO   - ex. "suivi_interventions_ecoles-data"
 *   GITHUB_BRANCH - ex. "main" (facultatif, "main" par défaut)
 */
const GH_API = 'https://api.github.com';

function ghHeaders() {
  return {
    'Accept': 'application/vnd.github+json',
    'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
    'User-Agent': 'iep1-suivi-interventions'
  };
}

function contentsUrl(path) {
  return `${GH_API}/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/${path}`;
}

function reponse(statusCode, corps) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps) };
}

exports.handler = async (event) => {
  if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_OWNER || !process.env.GITHUB_REPO) {
    return reponse(500, { error: "Fonction mal configurée : variables d'environnement GITHUB_TOKEN / GITHUB_OWNER / GITHUB_REPO manquantes (Netlify → Site configuration → Environment variables)." });
  }
  const branch = process.env.GITHUB_BRANCH || 'main';

  try {
    if (event.httpMethod === 'GET') {
      const path = event.queryStringParameters && event.queryStringParameters.path;
      if (!path) return reponse(400, { error: 'Paramètre "path" manquant.' });

      const res = await fetch(`${contentsUrl(path)}?ref=${branch}`, { headers: ghHeaders() });
      if (res.status === 404) return reponse(200, { data: null, sha: null });
      if (!res.ok) return reponse(res.status, { error: `Erreur GitHub ${res.status} sur ${path}` });

      const json = await res.json();
      const contenu = Buffer.from(json.content, 'base64').toString('utf-8');
      return reponse(200, { data: JSON.parse(contenu), sha: json.sha });
    }

    if (event.httpMethod === 'POST') {
      const corpsRecu = JSON.parse(event.body || '{}');
      const { path, data, message } = corpsRecu;
      if (!path) return reponse(400, { error: 'Paramètre "path" manquant.' });

      // On relit le sha juste avant d'écrire pour limiter les conflits (comportement identique à
      // l'ancien client direct : dernier écrit gagne, sinon 409 si quelqu'un a écrit entre-temps).
      let sha = null;
      const lecture = await fetch(`${contentsUrl(path)}?ref=${branch}`, { headers: ghHeaders() });
      if (lecture.ok) sha = (await lecture.json()).sha;

      const body = {
        message: message || `Mise à jour ${path}`,
        content: Buffer.from(JSON.stringify(data, null, 2), 'utf-8').toString('base64'),
        branch
      };
      if (sha) body.sha = sha;

      const res = await fetch(contentsUrl(path), { method: 'PUT', headers: ghHeaders(), body: JSON.stringify(body) });
      if (res.status === 409) {
        return reponse(409, { error: "CONFLIT : quelqu'un d'autre vient de modifier ce fichier. Rechargez la page et recommencez." });
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return reponse(res.status, { error: `Échec de sauvegarde (${res.status}) : ${err.message || ''}` });
      }
      const resultat = await res.json();
      return reponse(200, { sha: resultat.content ? resultat.content.sha : null });
    }

    return reponse(405, { error: 'Méthode non supportée.' });
  } catch (e) {
    return reponse(500, { error: e.message });
  }
};
