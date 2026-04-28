# Active Sprint

**Sprint:** S-09 Story-Akt-1 spielbar plus NPC-Walking plus Saison-Tile-Variationen
**Start:** 2026-04-26
**Geplantes Ende:** 2026-05-04
**Aktueller Stand (2026-04-28):** ALLE TIER-4-DoD-ITEMS V0.1 LIVE.

## Sprint-DoD-Checkliste (V0.1)

### NPC-Walking-Cycles ✓ V0.1 LIVE
- [x] Spec geschrieben: brain/sprints/S-09/npc-walking.md
- [x] Pure-Function: src/entities/npcMovement.ts (Spawn-Radius, Wall-Check, Dialog-Pause)
- [x] Vitest: 13 Tests gruen
- [x] NPC.step() + initMovement() Hooks
- [x] OverworldScene-Integration in update() live
- [ ] Browser-Smoke (Chrome MCP, 20:00-QA-Run)
- [ ] V0.2 Pathfinding (Folge-Sprint S-10)

### Story-Akt-1 ✓ V0.1 LIVE
- [x] Spec geschrieben: brain/sprints/S-09/story-akt-1.md
- [x] Pure-Function: src/data/storyAct1.ts (evaluateAct1Progress + autoSetAct1Flags)
- [x] Vitest: 12 Tests gruen
- [x] OverworldScene-Integration in update() live: Auto-Flag-Setting + advanceAct(1) + collectDiaryEntry(1) + reward-Toast
- [ ] Browser-Smoke End-to-End-Test
- [ ] Story-Akt-2-Spec (Folge-Run)

### Saison-Tile-Variationen ✓ ABGESCHLOSSEN
- [x] Atlas-Pack Sprint 0+1 plus 16 Tile-Variationen integriert (Control-Center 59d1d9a, a5eb995)
- [x] BootScene + MenuScene laden Atlases
- [ ] GardenScene rendert Atlas-Frames (Folge-Run, kosmetisch nicht blockierend)

## Quality-Gates Stand
- TS-strict: GRUEN
- Vitest: 586/586 ueber 35 Suiten
- ESLint: 0/0
- Coverage: heilige Pfade 100/99-100, all-files >99% Lines
- Bundle: ~1.7 MB total, im Budget

## Naechste Tech-Run-Prios
1. Browser-Smoke via Chrome MCP (Pflicht im 20:00-QA-Run)
2. Sprint-S-10 Vorplanung (PixelLab-Walking-Sprites, Pathfinding-V0.2)
3. Save-V11-Bump bei NPC-Walking-State-Persistence (Plan: brain/tech/save_v11_plan.md)

## Sprint-Closure-Bedingung
- [ ] Browser-Smoke ALLE 4 Tier-Tests PASS
- [ ] Producer-Review der DoD-Specs
- [ ] Sprint-Postmortem in brain/postmortems/S-09.md

Stand 2026-04-28: 4 von 6 Closure-Items offen, alle abhaengig vom 20:00-QA-Browser-Smoke.
