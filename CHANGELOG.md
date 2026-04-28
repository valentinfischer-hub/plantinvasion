# CHANGELOG

## 2026-04-27 / 2026-04-28 - Tag-Marathon (V2-SKILL Aktivierung)

**55+ Commits, 220 -> 586 Tests, ESLint 82 -> 0/0 Warnings, Coverage 95% -> 99% Lines.**

### Tier-1 Game-Start
- BootScene-Toter-Code entfernt (war nicht in main.ts scene-Array, Hotfix 77b75fb hatte Atlas-Loads zu MenuScene verschoben)
- MenuScene Loading-Indikator hinzugefuegt (FTUE)

### Tier-2 Garten
- B-012 Saeen-Modal V0.1: eindeutige Reasons (Garten-voll vs Spezies-Fehler), Vorab-Check
- B-012 V0.2 Slot-First-UI: User klickt erst leeren Slot, dann Seed-Picker
- Console-Zero-Tolerance durchgesetzt: 15 console.log auf debugLog hinter DEBUG_OVERLAY-Flag

### Tier-3 UI/UX
- Zentraler Toast-Helper (src/ui/Toast.ts) mit 5 ToastTypes
- uiTheme.ts mit Modal/Toast/Tile-Konstanten
- drawModalBox-Helper - alle 5 GardenScene-Modale migriert
- OverworldScene Zone-Toast plus Tagesbelohnung-Toast auf showToast
- PauseOverlay auf uiTheme-Konstanten
- AchievementToast FONT_FAMILY-Konsistenz

### Tier-4 Sprint-S-09 V0.1
- NPC-Walking pure-function (npcMovement.ts) mit Spawn-Radius + Wall-Check + Dialog-Pause
- NPC.ts step() + initMovement() Hooks
- OverworldScene-Hookup live in update()
- Story-Akt-1 pure-function (storyAct1.ts) mit evaluateAct1Progress + autoSetAct1Flags
- Story-Akt-1 OverworldScene-Integration: Auto-Flag-Setting + Akt-Advance + Diary-Entry

### Tier-5 Polish
- ESLint 82 -> 0/0 Warnings (asRecord-Helper in storage.ts, GameState time/story-Type-Erweiterung, 14 any-Casts in OverworldScene weg, 7 in BattleScene, globalThis-Type fuer __game/__layout/__overworld/__battle, AudioContext via unknown)
- supabase.ts Coverage 54 -> 97% via vi.doMock auf featureFlags
- Alle src/data/-Files haben jetzt Vitest-Coverage: boosters (21), companion (13), roles (8), encounters (10), quests (10), achievements (7), genes (19), foraging (14), moves (12), bosses (7), items (11), species (11), storyAct1 (12), npcMovement (13), 8 Map-Files (50)

### Brain-Doku
- brain/qa/bugs.md neu (B-012 V0.1+V0.2 RESOLVED)
- brain/sprints/S-09/npc-walking.md plus story-akt-1.md
- brain/tech/architecture.md V1.1 mit Tier-System
- brain/tech/save_v11_plan.md PROPOSED
- brain/tech/tier_status.md alle 6 Tiers

### V2-SKILL.md aktiviert
- Tier-1-3-First-Logik (Game-Start vor Garten vor UI/UX)
- Hard-vs-Soft-Quality-Gates
- Time-Box-Regel
- Multi-Patch-Pattern (3 Commits pro Feature-Run)
- Auto-Approval (autonomy_permissions Memory)
