# Plantinvasion Bug-Tracker

## Konvention
- ID-Schema: B-NNN (chronologisch).
- Status: OPEN, IN_PROGRESS, RESOLVED, WONTFIX.
- Bei RESOLVED immer Commit-Hash + Datum.

## Bugs

### B-012 RESOLVED 2026-04-27
**Title:** Saeen-Modal: User wusste nicht warum eine Pflanze nicht eingesaet werden konnte.

**Symptom:**
- Bei vollem Garten zeigte das Modal nach Klick auf einen Seed nur einen generischen Toast "Fehlgeschlagen" oder den vermischten Reason "Kein freier Slot oder unbekannte Spezies".
- User konnte nicht ableiten ob das Inventar leer ist, ob die Spezies fehlt oder ob alle Slots belegt sind.

**Root-Cause:**
- `gameStore.plantSeed` warf einen einzigen Reason-String fuer zwei voellig verschiedene Failure-Faelle (volle Garten vs unbekannte Spezies).
- `GardenScene.openSeedPlantModal` machte keinen Vorab-Check auf freie Slots, oeffnete also das Modal und zeigte den Fehler erst nach Seed-Klick.

**Fix V0.1 (Auto-Slot-Pick, dieser Commit):**
- Neuer Helper `gameStore.getFreeSlotCount(): number`.
- `plantSeed` splittet Reason: "Garten voll. Ernte oder verschiebe Pflanzen." vs "Unbekannte Spezies".
- Modal macht Vorab-Check: bei 0 freien Slots wird Modal gar nicht mehr geoeffnet, stattdessen direkter Toast.
- Modal-Title zeigt jetzt freie Slot-Anzahl: "Pflanze einsaeen (N frei)".
- Auto-Slot-Pick (`findFreeGridSlot`) blieb unveraendert, war bereits aktiv.

**Fix V0.2 (Slot-First-UI, 2026-04-27 Run 12:00):**
- `gameStore.plantSeedAt(seedSlug, gridX, gridY)` neuer Slot-First-API.
- `createPlantOfSpeciesAt` und `isSlotOccupied` als Helpers exportiert.
- Garten-Slots sind jetzt klickbar (Phaser-Hotspots ueber jedem Slot, hinter den Plant-Cards). Klick auf leeren Slot oeffnet Slot-spezifisches Saeen-Modal mit Title `Slot X,Y bepflanzen`. Klick auf besetzten Slot greift weiter durch zum Plant-Card-Detail.
- Saeen-Header-Button bleibt aktiv (V0.1-Auto-Slot-Pick als Fallback fuer User die einfach den naechsten freien Slot wollen).
- Cross-Mode unterdrueckt Slot-Click (Hotspot returnt early).

**Tests:**
- `src/state/__tests__/plantSeed.b012.test.ts` (6 Tests, alle gruen).
- Coverage: `getFreeSlotCount` 100%, `plantSeed` Reason-Branches 100%.

**Hinweis Provenienz:**
- Der referenzierte QA-Critic-Report `brain/agents/qa-critic/critical_2026-04-26_12.md` existierte zum Zeitpunkt des Fix nicht im Repo. Tech-Code hat das Problem im Self-Audit der `GardenScene.openSeedPlantModal`-Sequenz identifiziert. QA-Critic-Doku waere ein Folge-Item.

**Commit:** `2fa24f8` (2026-04-27 09:00, gepusht auf origin/main).

### B-013 RESOLVED 2026-04-28
**Title:** NPC-Quest-Indicator crasht mit "Cannot read properties of null (reading 'drawImage')" nach Scene-Teardown.

**Symptom:**
- 3+ Console-Errors pro Tick wenn Player in OverworldScene mit aktiven NPCs.
- Stack: NPC.setQuestIndicator -> Phaser-Text.setColor -> updateUVs -> drawImage.

**Root-Cause:**
- `this.questIndicator` Reference bleibt nach Scene-Teardown (Garden-zu-Overworld-Wechsel) gueltig im JS-Heap aber das zugrundeliegende Phaser-Text-GameObject ist destroyed.
- setText/setColor crashen weil internal canvas-Context null ist.

**Fix:**
- Safety-Check `this.questIndicator.active && this.questIndicator.scene` vor jedem setText/setColor-Aufruf.
- Bei stale-Reference: Cleanup + Re-Create im naechsten Pfad.

**Discovery:**
- Browser-Smoke via Chrome MCP (Tech-Code Run-XX, V3 SKILL Auto-Approval-Pfad).
- Tier-2-Garten visuell PASS, aber Console-Errors gefunden bei NPC-Walking-Tick.

**Commit:** `a9cd655` (2026-04-28, gepusht auf origin/main).

**Tests:** Vitest hat dies nicht catched weil Phaser-Text-Lifecycle nur in Browser ausgewertet wird. Browser-Smoke ist Pflicht-Verifikation.
