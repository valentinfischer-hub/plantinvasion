# TypeScript Strict Mode Migration (S-POLISH)

Stand: 2026-04-29
Verantwortlich: Tech-Code-Agent

---

## Aktueller Stand

### Bereits aktiv in tsconfig.json:
- strict: true - beinhaltet: strictNullChecks, strictFunctionTypes, strictBindCallApply, strictPropertyInitialization, noImplicitAny, noImplicitThis, alwaysStrict
- noUnusedLocals: true
- noUnusedParameters: true
- noFallthroughCasesInSwitch: true

### ESLint-Status: Faktisch erledigt
- Scan 2026-04-29 12:00: nur 2 any-Stellen im gesamten Codebase
- Beide mit eslint-disable-next-line suppressed (Legacy plus variadic logger)
- ~62 any-Errors wurden in Batch 2 bereits behoben - Ziel 0 aktive Violations erreicht

---

## Naechster Schritt: noUncheckedIndexedAccess

### Was das Flag bewirkt:
Array-Zugriff wie arr[0] und Object-Zugriff wie obj[key] werden als T oder undefined typisiert statt als T.
Das zwingt zu explizitem null-check vor dem Benutzen.

### Warum noch nicht aktiviert:
Der Build-Script in package.json ist tsc plus vite build. TypeScript-Fehler brechen damit das Netlify-Deploy-Gate.
Da die Bash-Sandbox derzeit nicht verfuegbar ist (Disk Full), kann kein tsc --noEmit lokal ausgefuehrt werden.

Risiko ohne Vorpruefung: potenziell 50-200 neue TypeScript-Fehler, die den Deploy blockieren.

### Plan fuer Aktivierung (wenn Bash verfuegbar):
1. Vorpruefung: npx tsc --noEmit --noUncheckedIndexedAccess 2 count errors
2. Wenn weniger als 20 Fehler: direkt fixen plus aktivieren
3. Wenn mehr als 20 Fehler: schrittweise per File-Gruppe
4. tsconfig.json: noUncheckedIndexedAccess: true setzen
5. Haeufige Fix-Patterns:
   - arr[0] wird zu: arr[0] ?? defaultValue
   - arr[i] wird zu: const item = arr[i]; if (item undefined) return;
   - obj[key] wird zu: const val = obj[key]; if (val undefined) continue;

### Erwartete Hotspot-Files:
- src/scenes/OverworldScene.ts - Tile-Array-Zugriffe fuer Encounter-Zones
- src/state/gameState.ts - Achievements-Array, Plant-Dex-Lookups
- src/genetics/breedingV2.ts - Gen-Array-Zugriffe (core logic! - Vorsicht)
- src/scenes/BattleScene.ts - Move-Array, Pool-Lookups

Vorsicht bei breedingV2.ts: heiliger Pfad mit 789 Tests. Aenderungen nur nach vollstaendigem Test-Run.

---

## Weitere moegliche Flags (Roadmap):

- noUncheckedIndexedAccess: Hoch, Risiko Mittel (Build-Gate)
- exactOptionalPropertyTypes: Mittel, Risiko Hoch (viele Interfaces)
- noPropertyAccessFromIndexSignature: Niedrig, Risiko Mittel

---

## Status-Log:

- 2026-04-29 16:00: Dokument erstellt, noUncheckedIndexedAccess geplant aber noch nicht aktiviert (Bash down)
