/*
 * Fonction serveur Supabase « lire-agenda » (2026-09-28) — appelée par import-agenda.html.
 *
 * Relit le Google Agenda d'un formateur via son « adresse secrète au format iCal » (table
 * agenda_liens, jamais lisible par le navigateur, voir supabase/schema.sql) et renvoie seulement
 * les évènements utiles à l'import : de l'année en cours jusqu'à aujourd'hui, et contenant un nom
 * d'école ou un mot-clé d'intervention. Le reste de l'agenda (rendez-vous personnels…) ne quitte
 * jamais le serveur : n'importe qui ayant le lien du site peut appeler cette fonction pour
 * n'importe quel formateur, c'est donc ce filtre qui protège la vie privée.
 *
 * Déploiement : Supabase → Edge Functions (verify_jwt activé : la clé anon du site suffit).
 * Les listes de mots-clés recopient celles de js/import-agenda.js (école + type) : à garder
 * alignées, sinon des évènements reconnus côté page ne remonteraient jamais du serveur.
 */
import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const MOTS_PERTINENTS = [
  // Écoles (ECOLES_MOTS_CLES_AGENDA)
  'BARDOU', 'BENEBIG', 'MEDIPOLE', 'CHT', 'CLAIN', 'DORBRITZ', 'DUMBEA', 'FONG', 'DELACHARLERIE',
  'ROLLY', 'MDR', 'DILLENSEGER', 'GRESLAN', 'MAINGUET', 'MYOSOTIS', 'NIAOULIS', 'OASIS', 'ORANGERS',
  'YAHOUE', 'PETUNIAS', 'RUSSIER', 'SURLEAU',
  // Types (TYPES_MOTS_CLES_AGENDA)
  'ANIMATION PEDA', 'FORMATION', 'CONSEIL', 'RESIDENCE PEDAGOGIQUE', 'VISITE', 'INSPECTION', 'EAE',
  'REUNION CIRCO', 'REUNION IEP', 'JURY', 'CORRECTION', 'CAFIPEMF', 'CAPPEI', 'REDACTION SUJET',
  'PROJET', 'LIAISON', ' GT ', 'GROUPE DE TRAVAIL', 'ADMINISTRATIF', 'ACCOMPAGNEMENT',
  // Génériques
  'ECOLE', 'CLASSE', 'CIRCONSCRIPTION', 'IEP'
];

function normaliser(s: string) {
  return ' ' + (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase() + ' ';
}

function desechapper(v: string) {
  return (v || '').replace(/\\n/gi, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
}

/* Même conversion que dateICSVersISO (js/ics-parser.js) : heure UTC ramenée à UTC+11. */
function dateISO(valeur: string): string | null {
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/.exec((valeur || '').trim());
  if (!m) return null;
  const [, a, mo, j, h, mi, s, z] = m;
  if (!h || !z) return `${a}-${mo}-${j}`;
  return new Date(Date.UTC(+a, +mo - 1, +j, +h, +mi, +s || 0) + 11 * 3600000).toISOString().slice(0, 10);
}

type Evenement = { uid: string; date: string; summary?: string; description?: string; location?: string; annule?: boolean };

function parserICS(texte: string): Evenement[] {
  const lignes: string[] = [];
  texte.split(/\r\n|\n|\r/).forEach(l => {
    if ((l.startsWith(' ') || l.startsWith('\t')) && lignes.length) lignes[lignes.length - 1] += l.slice(1);
    else lignes.push(l);
  });
  const evenements: Evenement[] = [];
  let courant: (Evenement & { recurrenceId?: string }) | null = null;
  for (const ligne of lignes) {
    if (ligne.startsWith('BEGIN:VEVENT')) { courant = { uid: '', date: '' }; continue; }
    if (ligne.startsWith('END:VEVENT')) {
      if (courant && courant.uid && courant.date && !courant.annule) {
        // Une occurrence modifiée d'un évènement récurrent garde l'UID du parent : on la distingue,
        // sinon l'importer ferait disparaître toutes les autres occurrences (agenda_imports.uid).
        if (courant.recurrenceId) courant.uid += '#' + courant.recurrenceId;
        delete courant.recurrenceId;
        evenements.push(courant);
      }
      courant = null;
      continue;
    }
    if (!courant) continue;
    const i = ligne.indexOf(':');
    if (i === -1) continue;
    const cle = ligne.slice(0, i).split(';')[0].toUpperCase();
    const valeur = ligne.slice(i + 1);
    if (cle === 'UID') courant.uid = valeur.trim();
    else if (cle === 'SUMMARY') courant.summary = desechapper(valeur);
    else if (cle === 'DESCRIPTION') courant.description = desechapper(valeur);
    else if (cle === 'LOCATION') courant.location = desechapper(valeur);
    else if (cle === 'DTSTART') courant.date = dateISO(valeur) || '';
    else if (cle === 'RECURRENCE-ID') courant.recurrenceId = valeur.trim();
    else if (cle === 'STATUS' && valeur.trim().toUpperCase() === 'CANCELLED') courant.annule = true;
  }
  return evenements;
}

function reponse(corps: unknown, statut = 200) {
  return new Response(JSON.stringify(corps), { status: statut, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  let intervenantId = '';
  try { intervenantId = String((await req.json()).intervenantId || ''); } catch { /* corps vide */ }
  if (!intervenantId) return reponse({ erreur: 'intervenantId manquant' }, 400);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: lien, error } = await admin.from('agenda_liens').select('ics_url').eq('intervenant_id', intervenantId).maybeSingle();
  if (error) return reponse({ erreur: error.message }, 500);
  if (!lien) return reponse({ erreur: 'Aucun agenda connecté pour cette personne.' }, 404);

  let texte: string;
  try {
    const r = await fetch(lien.ics_url);
    if (!r.ok) throw new Error(r.status === 404
      ? "Google ne reconnaît plus cette adresse (réinitialisée ?) : recollez la nouvelle adresse secrète."
      : `Google Agenda a répondu ${r.status}.`);
    texte = await r.text();
  } catch (e) {
    const message = (e as Error).message;
    await admin.from('agenda_liens').update({ derniere_erreur: message }).eq('intervenant_id', intervenantId);
    return reponse({ erreur: message }, 502);
  }

  // Fenêtre : du 1er janvier (de l'année d'il y a 30 jours, pour ne rien perdre de décembre en
  // janvier) jusqu'à aujourd'hui inclus, heure de Nouvelle-Calédonie. Les évènements à venir ne
  // remontent pas : une visite prévue peut encore être annulée.
  const aujourdhui = new Date(Date.now() + 11 * 3600000).toISOString().slice(0, 10);
  const debut = new Date(Date.now() + 11 * 3600000 - 30 * 86400000).getUTCFullYear() + '-01-01';

  const tous = parserICS(texte);
  const evenements = tous.filter(e => {
    if (e.date < debut || e.date > aujourdhui) return false;
    const t = normaliser([e.summary, e.description, e.location].filter(Boolean).join(' '));
    return MOTS_PERTINENTS.some(m => t.includes(m));
  });

  await admin.from('agenda_liens').update({ derniere_lecture: new Date().toISOString(), derniere_erreur: null }).eq('intervenant_id', intervenantId);
  return reponse({ evenements, debut, fin: aujourdhui });
});
