# CLAUDE.md

## Autorisations permanentes

- Une fois une modification demandée par l'utilisateur terminée et vérifiée (code, contenu,
  configuration), tu es autorisé à créer le commit et à le pousser sur `origin/main`
  **sans demander confirmation au préalable dans la conversation**, tant que :
  - le changement correspond à ce qui a été demandé ;
  - ce n'est pas une opération destructive ou irréversible (`push --force`, `reset --hard`,
    suppression de branche, réécriture d'historique, `--no-verify`) — celles-ci restent soumises
    à confirmation explicite, comme d'habitude.
- Utilise des messages de commit clairs, en français, décrivant le changement et sa raison.
- Cette autorisation est spécifique à ce dépôt (`IEP1/suivi_interventions_ecoles`) et ne s'étend
  pas aux autres dépôts (notamment `suivi_interventions_ecoles-data`, privé).

## Contexte du projet

Voir le [README.md](README.md) pour l'architecture (site statique + repo privé de données) et le
fonctionnement de l'application.
