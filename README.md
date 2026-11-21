# Leonida Ledger — GTA VI Trophy Guide

[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Rank](https://make.fun/badge/gta6-trophy-guide-01/adeqaila/makefun-gta6-trophy-guide-01-slot2/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/adeqaila/makefun-gta6-trophy-guide-01-slot2/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

Entry for the make.fun [gta6-trophy-guide-01](https://make.fun/bounty/gta6-trophy-guide-01) bounty: a complete GTA VI trophy guide for all 55 trophies.

## The guide

- **Audit bar** — 55/55 official list, 55/55 guides with cited sources, 7 source sites, 7 disputes shown.
- **Tracker** — all 55 trophies (1 Platinum, 2 Gold, 6 Silver, 46 Bronze) with cited steps per trophy.
- **Roadmap** — the road to Platinum (~200 hours).
- **Missables** — missable trophies with last-chance chapter markers.
- **Sources** — every claim cited to a named source; where sources differ, the dispute is shown, not hidden.

## How it is built

- `app/data/trophies.json` — all 55 trophies with guides and named sources.
- `app/index.html`, `app/app.js`, `app/style.css` — the guide app (Tracker/Roadmap/Missables/Sources tabs).
- `main.ts` — copies the app and screenshots to `/output`.
- `screenshots/` — 4 real renders of the guide (checklist cover, roadmap, missables, sources).
