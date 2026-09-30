/*
 * Fonction serveur Supabase « lire-agenda » (2026-09-28) — appelée par import-agenda.html.
 *
 * Relit le Google Agenda d'un formateur via son « adresse secrète au format iCal » (table
 * agenda_liens, jamais lisible par le navigateur, voir supabase/schema.sql) et renvoie seulement
 * les évènements utiles à l'import : de l'année en cours jusqu'à aujourd'hui, créés par Poésie ou
 * passant le filtre éducatif (jamais « Privé »). Le reste de l'agenda (rendez-vous
 * personnels…) ne quitte jamais le serveur : n'importe qui ayant le lien du site peut appeler
 * cette fonction pour n'importe quel formateur, c'est donc ce filtre qui protège la vie privée.
 *
 * Déploiement : Supabase → Edge Functions (verify_jwt activé : la clé anon du site suffit).
 * Les listes du filtre éducatif recopient celles de js/import-agenda.js : à garder alignées.
 */
import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Filtre éducatif — listes recopiées de js/import-agenda.js (MOTS_PERSONNELS_AGENDA,
// MOTS_EDUCATIFS_AGENDA) : à garder alignées. Un évènement hors Poésie n'est renvoyé que s'il
// contient un mot éducatif et aucun mot personnel dans son titre, et n'est pas marqué « Privé ».
const MOTS_PERSONNELS = [
  'COIFF', 'BANQUE', 'MEDECIN', 'DOCTEUR', 'DENTISTE', 'KINE', 'OSTEO', 'OPHTALMO', 'PHARMACIE',
  'VETERINAIRE', 'GARAGE', 'CONTROLE TECHNIQUE', 'VIDANGE', 'NOTAIRE', 'IMPOTS', 'ASSURANCE',
  'MUTUELLE', 'ANNIVERSAIRE', 'MARIAGE', 'VACANCES', ' CONGE', ' PERSO', 'PRIVE', 'COURSES',
  'SALLE DE SPORT', 'FITNESS', 'YOGA', 'MASSAGE', 'ESTHETI', 'MANUCURE', 'PEDICURE', 'RADIOLOG',
  'PRISE DE SANG', 'LABORATOIRE', 'NOUNOU', 'BABY-SIT', 'BABYSIT'
];
const MOTS_EDUCATIFS = [
  'BARDOU', 'BENEBIG', 'MEDIPOLE', 'CHT', 'CLAIN', 'DORBRITZ', 'DUMBEA-SUR-MER', 'DUMBEA SUR MER',
  'FONG', 'DELACHARLERIE', 'ROLLY', 'MDR', 'DILLENSEGER', 'GRESLAN', 'MAINGUET', 'MYOSOTIS',
  'NIAOULIS', 'OASIS', 'ORANGERS', 'YAHOUE', 'PETUNIAS', 'RUSSIER', 'SURLEAU',
  'ECOLE', 'CLASSE', 'ELEVE', 'ENSEIGNANT', 'CYCLE', ' CC ', ' EE ', 'EQUIPE EDUCATIVE',
  'EQUIPES EDUCATIVES', 'EQUIPE TECHNIQUE', 'MATERNELLE', 'ELEMENTAIRE', 'COLLEGE', 'LYCEE', 'SEGPA',
  'ULIS', 'CLIS', ' CP ', ' CE1', ' CE2', ' CM1', ' CM2', ' GS ', ' MS ', ' PS ',
  'CIRCONSCRIPTION', 'IEP', 'CPC', 'PEMF', 'DENC', 'DESED', 'DANE', 'DINUM', 'DECAT', 'INSPECT', 'IEF',
  'VISITE', 'FORMATION', 'FORMATEUR', 'ANIMATION', 'ACCOMPAGNEMENT', 'CONSEIL', 'RESIDENCE', 'JURY',
  'CORRECTION', 'CAFIPEMF', 'CAPPEI', 'CRPE', 'CONCOURS', 'SUJET', 'PROJET', 'LIAISON', 'GT ',
  'GROUPE DE TRAVAIL', 'ADMINISTRATI', 'REUNION', 'ATELIER', 'WEBINAIRE', 'SEMINAIRE', 'INTERVENTION',
  'RENCONTRE', 'PRESENTATION', 'PREPARATION', 'ECHANGE', 'POINT ', 'PEDAGO', 'SCOLAIRE', 'EVALUATION',
  'LSU', 'APER', 'EDUCNUM', 'EDUC NUM', 'EDUCATION', 'NUMERIQUE', ' IA ', 'PIX', 'TERRA NUMERICA',
  'PIROGUE', ' PIL', 'ERASMUS', 'MATHS', 'HISTOIRE', 'GEO', 'EMC', 'SCIENCES', 'LECTURE',
  'ESCAPE GAME', 'LABEL', 'USEP', 'CMJ', 'PARENTALITE', 'ALERTE', 'CRF', 'ORTHOPHON', 'PSYCHOLOGUE',
  'RASED', 'AESH', 'MDPH'
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

type Evenement = { uid: string; date: string; summary?: string; description?: string; location?: string; annule?: boolean; prive?: boolean };

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
      if (courant && courant.uid && courant.date && !courant.annule && !courant.prive) {
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
    else if (cle === 'CLASS') courant.prive = /PRIVATE|CONFIDENTIAL/i.test(valeur);
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
  const { data: lien, error } = await admin.from('agenda_liens')
    .select('ics_url, cache_evenements, cache_le').eq('intervenant_id', intervenantId).maybeSingle();
  if (error) return reponse({ erreur: error.message }, 500);
  if (!lien) return reponse({ erreur: 'Aucun agenda connecté pour cette personne.' }, 404);

  // Fenêtre : du 1er janvier (de l'année d'il y a 30 jours, pour ne rien perdre de décembre en
  // janvier) jusqu'à aujourd'hui inclus, heure de Nouvelle-Calédonie. Les évènements à venir ne
  // remontent pas : une visite prévue peut encore être annulée.
  const aujourdhui = new Date(Date.now() + 11 * 3600000).toISOString().slice(0, 10);
  const debut = new Date(Date.now() + 11 * 3600000 - 30 * 86400000).getUTCFullYear() + '-01-01';

  // Google renvoie 429 quand on relit trop souvent la même adresse : la dernière lecture réussie
  // (évènements déjà filtrés) est gardée dans agenda_liens et resservie pendant 5 minutes, ou quand
  // Google refuse momentanément — avec son heure, pour que la page puisse le signaler.
  const cacheValide = lien.cache_evenements && lien.cache_le;
  if (cacheValide && Date.now() - new Date(lien.cache_le).getTime() < 5 * 60000) {
    return reponse({ evenements: lien.cache_evenements, debut, fin: aujourdhui, luLe: lien.cache_le });
  }

  let texte: string;
  try {
    const r = await fetch(lien.ics_url);
    if (!r.ok) throw new Error(r.status === 404
      ? "Google ne reconnaît plus cette adresse (réinitialisée ?) : recollez la nouvelle adresse secrète."
      : r.status === 429
        ? 'Google limite momentanément les lectures trop rapprochées de cet agenda : réessayez dans quelques minutes.'
        : `Google Agenda a répondu ${r.status}.`);
    texte = await r.text();
  } catch (e) {
    const message = (e as Error).message;
    await admin.from('agenda_liens').update({ derniere_erreur: message }).eq('intervenant_id', intervenantId);
    if (cacheValide) {
      return reponse({ evenements: lien.cache_evenements, debut, fin: aujourdhui, luLe: lien.cache_le, avertissement: message });
    }
    return reponse({ erreur: message }, 502);
  }

  // Un évènement créé par Poésie (description « Actions : … ») est toujours professionnel : gardé.
  // Les autres doivent passer le filtre éducatif (voir MOTS_EDUCATIFS / MOTS_PERSONNELS).
  const tous = parserICS(texte);
  const evenements = tous.filter(e => {
    if (e.date < debut || e.date > aujourdhui) return false;
    if (/^\s*Actions\s*:/i.test(e.description || '')) return true;
    if (MOTS_PERSONNELS.some(m => normaliser(e.summary || '').includes(m))) return false;
    const t = normaliser([e.summary, e.description, e.location].filter(Boolean).join(' '));
    return MOTS_EDUCATIFS.some(m => t.includes(m));
  });

  const maintenant = new Date().toISOString();
  await admin.from('agenda_liens').update({
    derniere_lecture: maintenant, derniere_erreur: null, cache_evenements: evenements, cache_le: maintenant
  }).eq('intervenant_id', intervenantId);
  return reponse({ evenements, debut, fin: aujourdhui, luLe: maintenant });
});
