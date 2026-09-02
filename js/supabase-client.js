/*
 * Client Supabase — remplace js/github-store.js (2026-08-31, voir supabase/schema.sql).
 *
 * URL + clé "anon" : volontairement en clair ici, ce sont des identifiants PUBLICS conçus pour
 * vivre dans du code client (contrairement à un token GitHub) — la vraie protection des données
 * est posée côté serveur par les policies RLS de chaque table (voir supabase/schema.sql). Ne pas
 * mettre ici la clé "service_role" : elle a tous les droits et ne doit jamais quitter un script
 * serveur/local de confiance.
 *
 * Nécessite le SDK chargé juste avant ce fichier (voir <script> dans chaque page) :
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
 */
const SUPABASE_URL = 'https://kgklcrxecietxbkvwrnw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtna2xjcnhlY2lldHhia3Z3cm53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxMTcxNDUsImV4cCI6MjEwMzY5MzE0NX0.YCieusV14yUf4WdkTvihdzZ0XkTWGjf3r5LXI9Ht2lY';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
