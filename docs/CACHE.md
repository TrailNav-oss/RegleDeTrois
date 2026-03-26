# CACHE — Proportio

> Fichier de reprise rapide. Mis à jour après chaque session / fix significatif.
> Claude : LIS CE FICHIER EN PREMIER pour comprendre l'état du projet.

## État courant
- **Version** : v0.0.9 build 11
- **Branche active** : main
- **Dernière session** : 3 (2026-03-17)
- **Stabilité** : stable

## En cours
- [ ] Recruter 12 testeurs opt-in sur les tracks closed testing (beta-amis, beta-communaute)
- [ ] Compléter le store listing Play Store (screenshots, questionnaire)

## Backlog bugs (par priorité)
### P0 — Critiques
- aucun

### P1 — Importants
- aucun

### P2 — Mineurs
- aucun

## Backlog features
- [ ] Screenshots Play Store (toutes les tailles requises)
- [ ] Questionnaire contenu Play Store
- [ ] iOS : passer aux IDs AdMob production quand ciblé

## Décisions récentes
| Date | Décision | Raison |
|------|----------|--------|
| 2026-03-17 | sanitizeNumericInput centralisé dans src/utils/sanitize.ts | Réutilisable sur tous les écrans, testable unitairement |
| 2026-03-17 | Fallback i18n → EN au lieu de FR | Testeurs non-francophones voyaient FR par défaut |
| 2026-03-15 | Multi-track deploy (beta-amis, beta-communaute) | Recruter plus de testeurs pour atteindre 12 opt-in / 14 jours |
| 2026-03-15 | Architecture 100% locale (pas de Firebase/Supabase) | Simplicité, pas de backend à maintenir |
| 2026-03-15 | Dossier V0.0.2 = travail actif, V0.0.1 = backup | Séparer clairement les versions |

## Notes de session
- v0.0.9 (versionCode 11) — fix inputs + fallback langue
- OTA poussée sur production (2026-03-17)
- 113 tests (7 suites), tsc clean
