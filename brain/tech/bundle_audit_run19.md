# Bundle Audit Run19 - 2026-04-28

## vite build Ergebnis

| Datei | Roh | Gzipped |
|-------|-----|---------|
| index.html | 1.45 KB | 0.78 KB |
| assets/index-*.js (App) | 476.63 KB | 146.87 KB |
| assets/phaser-*.js (Phaser) | 1,478.57 KB | 339.68 KB |
| **Total** | **~1.95 MB** | **~487 KB** |

Budget: 5 MB total (brain/tech/architecture.md) → Budget-Compliance: OK

## Sprite Assets

- 25 PNG-Sprites (5 Pflanzen x 5 Wachstumsstadien)
- Groesste PNG: 12KB (venus-flytrap adult/juvenile)
- Sprites-Total in dist: ~212KB

## Empfehlungen fuer spaeter

- Lazy-Loading fuer Phaser-Chunk via dynamic import() wenn > 2MB
- WebP-Konvertierung der PNGs (spart ~30-40%)
- Keine ungenutzten Imports gefunden (tsc noUnusedLocals:true sauber)

## Status

BUILD: OK | GZIP-TOTAL: ~487KB | BUDGET: 5MB | COMPLIANCE: OK
