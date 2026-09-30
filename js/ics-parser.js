/*
 * Lecteur minimal de fichier .ics (RFC 5545), pour import-agenda.html — sans dépendance externe :
 * seules les propriétés utiles à l'import (UID, SUMMARY, DESCRIPTION, LOCATION, DTSTART) de chaque
 * VEVENT sont extraites, tout le reste du fichier (VTIMEZONE, VALARM…) est ignoré.
 */

/** "Déplie" les lignes RFC 5545 (une ligne qui continue commence par une espace/tabulation). */
function deplierLignesICS(texte) {
  const lignesBrutes = texte.split(/\r\n|\n|\r/);
  const lignes = [];
  lignesBrutes.forEach(l => {
    if ((l.startsWith(' ') || l.startsWith('\t')) && lignes.length) {
      lignes[lignes.length - 1] += l.slice(1);
    } else {
      lignes.push(l);
    }
  });
  return lignes;
}

/** Défait les échappements texte standard du format .ics (\n, \, ; ,). */
function desechapperTexteICS(v) {
  return (v || '').replace(/\\n/gi, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
}

/*
 * Convertit une valeur DTSTART ("20260305", "20260305T083000" ou "20260305T083000Z") en date
 * "AAAA-MM-JJ". Une heure UTC explicite ("Z") est ramenée à l'heure de Nouvelle-Calédonie
 * (UTC+11, pas d'heure d'été) avant de prendre le jour, pour qu'un évènement du soir ne tombe
 * pas sur le mauvais jour calendaire local.
 */
function dateICSVersISO(valeurBrute) {
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/.exec((valeurBrute || '').trim());
  if (!m) return null;
  const [, aaaa, mois, jour, heure, min, sec, z] = m;
  if (!heure || !z) return `${aaaa}-${mois}-${jour}`; // journée entière, ou heure déjà locale (TZID)
  const instantUTC = Date.UTC(+aaaa, +mois - 1, +jour, +heure, +min, +sec || 0);
  return new Date(instantUTC + 11 * 3600000).toISOString().slice(0, 10);
}

/** Renvoie la liste des évènements du fichier : [{ uid, date, summary, description, location }]. */
function parserICS(texte) {
  const lignes = deplierLignesICS(texte);
  const evenements = [];
  let courant = null;
  lignes.forEach(ligne => {
    if (ligne.startsWith('BEGIN:VEVENT')) { courant = {}; return; }
    if (ligne.startsWith('END:VEVENT')) { if (courant) evenements.push(courant); courant = null; return; }
    if (!courant) return;
    const sepIdx = ligne.indexOf(':');
    if (sepIdx === -1) return;
    const cle = ligne.slice(0, sepIdx).split(';')[0].toUpperCase();
    const valeur = ligne.slice(sepIdx + 1);
    if (cle === 'UID') courant.uid = valeur.trim();
    else if (cle === 'SUMMARY') courant.summary = desechapperTexteICS(valeur);
    else if (cle === 'DESCRIPTION') courant.description = desechapperTexteICS(valeur);
    else if (cle === 'LOCATION') courant.location = desechapperTexteICS(valeur);
    else if (cle === 'DTSTART') courant.date = dateICSVersISO(valeur);
    // Visibilité « Privé » choisie dans Google Agenda : jamais importé (voir estEvenementEducatif).
    else if (cle === 'CLASS') courant.prive = /PRIVATE|CONFIDENTIAL/i.test(valeur);
  });
  return evenements.filter(e => e.uid && e.date);
}
