# FPS-Lock Audit 2026-04-29

**Ziel:** 60-FPS-Lock FI-Score von 3 auf 5 heben (stabile 60fps auf 90% der Geräte)

## Phaser-Konfiguration (D-041 Run 1)

```typescript
fps: {
  target: 60,
  forceSetTimeOut: false,  // requestAnimationFrame bevorzugt
  smoothStep: true          // NEU: reduziert Delta-Jitter bei variablem RAF-Timing
},
render: {
  roundPixels: true,   // NEU: kein Sub-Pixel-Rendering, reduziert GPU-Arbeit
  antialias: false,    // Pixel-Art braucht kein AA
  pixelArt: true
}
```

## FPS-Drop-Monitor (D-041 Run 6)

`src/utils/fpsMonitor.ts`: Überwacht jeden `step`-Event, feuert PostHog `fps_drop` Event
wenn FPS > 100ms unter 55fps fallen. Threshold: 55fps, Sustain: 100ms.

## Bekannte FPS-Killer (identifiziert via Profiler)

| Problem | Ort | Fix |
|---|---|---|
| Zu viele gleichzeitige Tweens | GardenScene (viele Pflanzen) | Tween-Pool, killTweensOf vor neuem Tween |
| Particle-Overflow bei Victory | BattleScene.spawnVictoryConfetti | Max-Particles Cap |
| NPC-Movement alle NPCs jedes Frame | OverworldScene.update | Frustum-Cull (S-POLISH Run16) |
| Sub-Pixel Sprite-Rendering | Gesamt | roundPixels: true (behoben) |

## Walk-Bob (D-041 Run 11)

sin()-basierter Bob per Tile-Schritt in PlayerController. Kein zusätzlicher Tween-Overhead,
pure Mathe in advanceMovement(). FPS-neutral.

## Messtrategie

PostHog `fps_drop`-Events werden aggregiert. Ziel: < 2% der Frames unter 55fps.
Dashboard: PostHog -> Events -> fps_drop -> by Session.

## FI-Score

60-FPS-Lock: 3 -> **4** (smoothStep + roundPixels + Monitor implementiert, fehlende Daten für 5)
