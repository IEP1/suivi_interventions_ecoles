-- Schéma initial IEP1 — Suivi des interventions (migration GitHub-JSON → Supabase, 2026-08-31)
--
-- À coller tel quel dans Supabase → SQL Editor → New query → Run.
-- Remplace le stockage "un fichier JSON par école" par de vraies tables relationnelles, pour
-- permettre des rapports croisés (école × période × formateur × catégorie) sans code JS sur
-- mesure à chaque nouveau besoin.
--
-- Modèle d'accès : pas de compte utilisateur dans cette appli (accès par lien uniquement, décision
-- assumée) — chaque table est donc ouverte en lecture ET écriture au rôle "anon" (clé publique
-- utilisée côté client). La sécurité réelle, c'est de ne partager le lien du site qu'aux personnes
-- voulues, exactement comme pour la fonction Netlify qu'on remplace.

-- ===== Écoles =====
create table public.ecoles (
  id text primary key,                    -- ids stables existants (ex. 'bardou'), repris tels quels
  nom text not null,
  type text not null,                     -- 'maternelle' | 'elementaire' | 'groupe-scolaire' | 'structure'
  direction text,
  cpc_referent_id text,                   -- FK logique vers intervenants.id, posée après (ordre de création)
  psychologue_scolaire text
);

-- ===== Intervenants (formateurs, secrétariat, IAP) =====
create table public.intervenants (
  id text primary key,                    -- ids stables existants (ex. 'nadia')
  nom text not null,
  role text not null                      -- 'cpc' | 'pemf' | 'secretariat' | 'iap'
);

alter table public.ecoles
  add constraint ecoles_cpc_referent_fk foreign key (cpc_referent_id) references public.intervenants(id);

-- ===== Types d'intervention (la typologie à 18 valeurs) =====
create table public.types_intervention (
  id text primary key,                    -- ex. 'accompagnement-individuel'
  label text not null,
  categorie text not null,                -- 'accompagnement' | 'formation' | 'projets' | 'circonscription' | 'reglementaire' | 'divers'
  en_ecole boolean not null default true  -- affichée dans la liste filtrée d'ecole.html ?
);

-- ===== Actions (remplace interventions/<ecoleId>.json ET actions-generales/<intervenantId>.json) =====
-- ecole_id nullable = action générale (sans école, ex. réunion de circonscription).
create table public.actions (
  id text primary key,                    -- ids existants repris tels quels (genererIdIntervention())
  ecole_id text references public.ecoles(id) on delete set null,
  intervenant_id text not null references public.intervenants(id),
  type_id text not null references public.types_intervention(id),
  date date not null,
  theme text,
  notes text,
  profil text,
  origine text,
  lieu_libre text,                        -- uniquement si ecole_id est null (ex. "DENC")
  groupe_id text,                         -- relie les copies d'une même saisie multi-écoles
  cree_le timestamptz not null default now()
);
create index actions_ecole_idx on public.actions (ecole_id);
create index actions_intervenant_idx on public.actions (intervenant_id);
create index actions_date_idx on public.actions (date);

-- ===== Structure pédagogique (prépare l'axe "suivi des suppléants" à venir) =====
create table public.equipe_enseignants (
  id text primary key,                    -- ids existants repris tels quels (genererIdEnseignant())
  ecole_id text not null references public.ecoles(id) on delete cascade,
  nom text,
  prenom text,
  niveau text,
  statut text,                            -- ex. "Titulaire", "Remplaçant" — futur axe suppléants
  referent text
);
create index equipe_enseignants_ecole_idx on public.equipe_enseignants (ecole_id);

-- ===== Bilan qualitatif de fin d'année =====
create table public.bilans_annuels (
  annee integer primary key,
  axes_forts text,
  points_vigilance text,
  perspectives text,
  modifie_le timestamptz
);

-- ===== Journal d'audit (remplace l'historique des commits Git) =====
create table public.journal_audit (
  id uuid primary key default gen_random_uuid(),
  table_nom text not null,
  ligne_id text not null,
  action text not null,                   -- 'insert' | 'update' | 'delete'
  avant jsonb,
  apres jsonb,
  horodatage timestamptz not null default now()
);
create index journal_audit_table_ligne_idx on public.journal_audit (table_nom, ligne_id);

-- ===== Accès : ouvert (lecture + écriture) à la clé publique "anon", sur toutes les tables =====
-- Pas de compte utilisateur dans cette appli : le contrôle d'accès se fait en ne partageant le
-- lien du site qu'aux personnes voulues, pas au niveau de la base.
alter table public.ecoles enable row level security;
alter table public.intervenants enable row level security;
alter table public.types_intervention enable row level security;
alter table public.actions enable row level security;
alter table public.equipe_enseignants enable row level security;
alter table public.bilans_annuels enable row level security;
alter table public.journal_audit enable row level security;

create policy "ouvert" on public.ecoles for all using (true) with check (true);
create policy "ouvert" on public.intervenants for all using (true) with check (true);
create policy "ouvert" on public.types_intervention for all using (true) with check (true);
create policy "ouvert" on public.actions for all using (true) with check (true);
create policy "ouvert" on public.equipe_enseignants for all using (true) with check (true);
create policy "ouvert" on public.bilans_annuels for all using (true) with check (true);
create policy "ouvert" on public.journal_audit for all using (true) with check (true);

grant usage on schema public to anon, authenticated, service_role;
grant all on public.ecoles, public.intervenants, public.types_intervention, public.actions,
  public.equipe_enseignants, public.bilans_annuels, public.journal_audit to anon, authenticated, service_role;

-- ===== Import depuis Google Agenda (2026-09-14, voir import-agenda.html) =====
-- Un évènement d'agenda déjà importé une fois (identifié par son UID .ics) ne doit pas être
-- réimporté si la personne dépose à nouveau le même fichier exporté plus tard (qui contient tout
-- l'historique de son agenda, pas seulement les nouveaux évènements).
create table public.agenda_imports (
  id uuid primary key default gen_random_uuid(),
  intervenant_id text not null references public.intervenants(id),
  uid text not null,                      -- UID de l'évènement dans le fichier .ics exporté
  action_id text references public.actions(id) on delete set null,
  importe_le timestamptz not null default now(),
  unique (intervenant_id, uid)
);
create index agenda_imports_intervenant_idx on public.agenda_imports (intervenant_id);

alter table public.agenda_imports enable row level security;
create policy "ouvert" on public.agenda_imports for all using (true) with check (true);
grant all on public.agenda_imports to anon, authenticated, service_role;

-- ===== Lecture directe de Google Agenda par « adresse secrète iCal » (2026-09-28) =====
-- Chaque formateur colle UNE fois l'« Adresse secrète au format iCal » de son agenda (Google
-- Agenda → Paramètres → son agenda → Intégrer l'agenda) : ensuite import-agenda.html relit
-- l'agenda sans export manuel, via la fonction serveur supabase/functions/lire-agenda.
--
-- Contrairement au reste de la base, cette table n'est PAS ouverte à la clé anon : l'adresse
-- secrète donne accès à tout l'agenda de la personne, n'importe qui ayant le lien du site ne doit
-- pas pouvoir la relire. Le navigateur passe uniquement par les 3 fonctions ci-dessous (écrire,
-- retirer, savoir si c'est configuré), et seule la fonction serveur (service_role) lit l'adresse.
create table public.agenda_liens (
  intervenant_id text primary key references public.intervenants(id) on delete cascade,
  ics_url text not null,
  enregistre_le timestamptz not null default now(),
  derniere_lecture timestamptz,
  derniere_erreur text
);
alter table public.agenda_liens enable row level security;
revoke all on public.agenda_liens from anon, authenticated;
grant all on public.agenda_liens to service_role;

-- Le format imposé (calendar.google.com, « private- », /basic.ics) empêche aussi de faire lire au
-- serveur une adresse quelconque.
create or replace function public.enregistrer_lien_agenda(p_intervenant text, p_url text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_url is null or trim(p_url) !~ '^https://calendar\.google\.com/calendar/ical/[^/\s]+/private-[0-9a-f]+/basic\.ics$' then
    raise exception 'Adresse invalide : copier l''« Adresse secrète au format iCal » (elle contient « private- » et se termine par /basic.ics).';
  end if;
  if not exists (select 1 from intervenants where id = p_intervenant) then
    raise exception 'Intervenant inconnu';
  end if;
  insert into agenda_liens (intervenant_id, ics_url) values (p_intervenant, trim(p_url))
  on conflict (intervenant_id) do update
    set ics_url = excluded.ics_url, enregistre_le = now(), derniere_lecture = null, derniere_erreur = null;
end $$;
-- (redéfinie plus bas, section « Dernière lecture d'agenda », pour vider aussi le cache.)

create or replace function public.retirer_lien_agenda(p_intervenant text)
returns void language sql security definer set search_path = public as $$
  delete from agenda_liens where intervenant_id = p_intervenant;
$$;

create or replace function public.statut_lien_agenda(p_intervenant text)
returns table (configure boolean, derniere_lecture timestamptz, derniere_erreur text)
language sql stable security definer set search_path = public as $$
  select true, l.derniere_lecture, l.derniere_erreur from agenda_liens l where l.intervenant_id = p_intervenant
  union all
  select false, null::timestamptz, null::text where not exists (select 1 from agenda_liens where intervenant_id = p_intervenant);
$$;

revoke all on function public.enregistrer_lien_agenda(text, text), public.retirer_lien_agenda(text), public.statut_lien_agenda(text) from public;
grant execute on function public.enregistrer_lien_agenda(text, text), public.retirer_lien_agenda(text), public.statut_lien_agenda(text) to anon, authenticated;

-- ===== « Autre école (hors circonscription) » (2026-10-01) =====
-- Une seule ligne qui regroupe les interventions dans des écoles extérieures à la circonscription
-- (nom réel de l'école dans actions.lieu_libre). Comptée dans les totaux, jamais dans les taux de
-- couverture ni comme école de référence — voir ID_ECOLE_HORS_CIRCO dans js/seed-data.js.
insert into public.ecoles (id, nom, type)
values ('hors-circonscription', 'Autre école (hors circonscription)', 'hors-circonscription')
on conflict (id) do nothing;

-- ===== « Ne pas importer » (2026-10-01) =====
-- Un évènement d'agenda écarté volontairement est mémorisé ici (ecarte = true, sans action) : il
-- n'est plus jamais reproposé à l'import, mais reste listé dans l'onglet « Non importées »
-- d'import-agenda.html, d'où on peut le remettre à importer (la ligne est alors supprimée).
alter table public.agenda_imports add column if not exists ecarte boolean not null default false;

-- ===== Dernière lecture d'agenda gardée côté serveur (2026-10-01) =====
-- Google renvoie 429 si on relit trop souvent la même adresse iCal : la fonction lire-agenda garde
-- ici les évènements (déjà filtrés) de la dernière lecture réussie, resservis pendant 5 minutes ou
-- quand Google refuse momentanément. Table toujours fermée à la clé anon.
alter table public.agenda_liens add column if not exists cache_evenements jsonb;
alter table public.agenda_liens add column if not exists cache_le timestamptz;
create or replace function public.enregistrer_lien_agenda(p_intervenant text, p_url text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_url is null or trim(p_url) !~ '^https://calendar\.google\.com/calendar/ical/[^/\s]+/private-[0-9a-f]+/basic\.ics$' then
    raise exception 'Adresse invalide : copier l''« Adresse secrète au format iCal » (elle contient « private- » et se termine par /basic.ics).';
  end if;
  if not exists (select 1 from intervenants where id = p_intervenant) then
    raise exception 'Intervenant inconnu';
  end if;
  insert into agenda_liens (intervenant_id, ics_url) values (p_intervenant, trim(p_url))
  on conflict (intervenant_id) do update
    set ics_url = excluded.ics_url, enregistre_le = now(), derniere_lecture = null, derniere_erreur = null,
        cache_evenements = null, cache_le = null;
end $$;

-- ===== Corbeille des actions (2026-10-01) =====
-- Supprimer une action la déplace ici (ligne complète en jsonb + lien éventuel vers l'agenda) :
-- récupérable 5 jours depuis la fiche formateur ou la fiche école, puis effacée définitivement par
-- purger_corbeille() (appelée à chaque suppression et à l'ouverture des corbeilles).
create table public.actions_corbeille (
  id text primary key,
  intervenant_id text,
  ecole_id text,
  ligne jsonb not null,
  agenda_uid text,
  supprime_le timestamptz not null default now()
);
create index actions_corbeille_intervenant_idx on public.actions_corbeille (intervenant_id);
create index actions_corbeille_ecole_idx on public.actions_corbeille (ecole_id);
alter table public.actions_corbeille enable row level security;
create policy "ouvert" on public.actions_corbeille for all using (true) with check (true);
grant all on public.actions_corbeille to anon, authenticated, service_role;

create or replace function public.purger_corbeille() returns integer
language sql set search_path = public as $$
  with suppr as (delete from actions_corbeille where supprime_le < now() - interval '5 days' returning 1)
  select count(*)::int from suppr;
$$;

create or replace function public.mettre_action_a_la_corbeille(p_id text) returns void
language plpgsql set search_path = public as $$
begin
  perform purger_corbeille();
  insert into actions_corbeille (id, intervenant_id, ecole_id, ligne, agenda_uid, supprime_le)
  select a.id, a.intervenant_id, a.ecole_id, to_jsonb(a),
         (select g.uid from agenda_imports g where g.action_id = a.id limit 1), now()
  from actions a where a.id = p_id
  on conflict (id) do update set ligne = excluded.ligne, agenda_uid = excluded.agenda_uid, supprime_le = now();
  delete from actions where id = p_id;
end $$;

create or replace function public.restaurer_action(p_id text) returns void
language plpgsql set search_path = public as $$
declare c actions_corbeille;
begin
  select * into c from actions_corbeille where id = p_id and supprime_le >= now() - interval '5 days';
  if not found then raise exception 'Action introuvable dans la corbeille (délai de 5 jours dépassé ?)'; end if;
  insert into actions select * from jsonb_populate_record(null::actions, c.ligne);
  if c.agenda_uid is not null then
    update agenda_imports set action_id = p_id where intervenant_id = c.intervenant_id and uid = c.agenda_uid;
  end if;
  delete from actions_corbeille where id = p_id;
end $$;

grant execute on function public.purger_corbeille(), public.mettre_action_a_la_corbeille(text), public.restaurer_action(text) to anon, authenticated;
