# Plantinvasion

Mobile-Game-Projekt: 32-bit Pixel-Art-Idle-Breeder. Spieler zuechtet Pflanzen, kreuzt sie fuer neue Arten, sie kaempfen automatisch in der Arena. Story-RPG-Elemente plus Multiplayer-Trading geplant.

## Tech-Stack
- **Phaser 3.90** (Game-Engine, TypeScript-strict)
- **Vite 5** (Dev-Server + Build, Bundle-Splitting fuer Phaser-Chunk)
- **Vitest 2** (Unit-Tests, V8-Coverage)
- **ESLint 9 Flat-Config** (TypeScript-ESLint)
- **Supabase** (Backend hinter MP_ENABLED-Feature-Flag, ab Sprint S-11)
- **Sentry + PostHog** (Production-Telemetrie)
- **Capacitor + Codemagic** (Mobile-Build, Phase 5)
- **PixelLab.ai** (Sprite-Generation via API)

## Setup
```bash
npm install
npm run dev          # http://localhost:5173
npm test             # Vitest
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run build        # Vite Production Build
```

## Tier-System fuer Architektur-Prio (V2 SKILL)
Code wird nach Tiers priorisiert:
1. **Tier 1** Game-Start plus FTUE (BootScene, MenuScene, Save-Bootstrap)
2. **Tier 2** Garten-Experience (GardenScene, Saeen, Kreuzen, Bloom, Harvest)
3. **Tier 3** UI/UX uebergreifend (Toast-Helper, drawModalBox, uiTheme-Konstanten)
4. **Tier 4** Sprint-DoD-Items (NPC-Walking V0.1, Story-Akt-1 V0.1)
5. **Tier 5** Polish + Refactor (Coverage, ESLint, Type-Strenge)
6. **Tier 6** Multiplayer-Foundation (Supabase hinter MP_ENABLED, Sprint S-11)

## Quality-Gates
- TypeScript-Strict: 0 Fehler, 0 inline `any` (Stand 2026-04-27)
- ESLint: 0 Errors, 0 Warnings
- Vitest: 586+ Tests gruen ueber 35 Suiten
- Coverage: heilige Pfade (Genetik, Save-Migration) = 100% Lines / 99-100% Branches
- Bundle: < 5 MB (aktuell ~1.7 MB total mit Phaser-Chunk separat)
- 60fps locked

## Status
- **Phase 0:** Skeleton steht (Phaser + Vite + TS).
- **Phase 1:** GDD + Genetik-Regeln + Crossing-V2 abgeschlossen.
- **Phase 2:** Save-System V10, 8 Biome, Boosters, Foraging V0.2, Achievements V0.1.
- **Sprint-S-09 (aktuell):** Story-Akt-1 V0.1 plus NPC-Walking V0.1 live. Browser-Smoke ausstehend fuer visuelle Verifikation.

## Doku
- `brain/tech/architecture.md` Single-Source-of-Truth fuer Code-Layout
- `brain/tech/save_system.md` Save-Migration-Plan
- `brain/tech/save_v11_plan.md` PROPOSED V11-Bump
- `brain/tech/tier_status.md` aktueller Tier-1-6-Status
- `brain/sprints/S-09/` aktive DoD-Specs (npc-walking.md, story-akt-1.md)
- `brain/qa/bugs.md` Bug-Tracker
