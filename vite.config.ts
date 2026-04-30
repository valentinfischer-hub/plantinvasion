import { defineConfig } from 'vite';

/**
 * Vite-Build-Config fuer Plantinvasion.
 *
 * Bundle-Splitting:
 *  - phaser bekommt einen eigenen Chunk (~1.4 MB minified). Re-Builds des App-Codes
 *    invalidieren den Phaser-Chunk dann nicht mehr -> bessere CDN-Cache-Hit-Rate
 *    bei Updates und schnelleres Wiederladen fuer existierende Spieler.
 *  - chunkSizeWarningLimit auf 1500 KB hochgezogen, da Phaser eine harte Untergrenze
 *    setzt. Budget bleibt bei 5 MB total (siehe brain/tech/architecture.md).
 *
 * Feature-Flags:
 *  - VITE_MP_ENABLED steuert Multiplayer-Code-Pfade. Default false in .env.example.
 */
export default defineConfig({
  base: './',
  server: {
    host: true,
    port: 5173
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // D-041 Run12: Granulares Chunk-Splitting fuer besseres Browser-Caching
        // phaser: eigener Chunk (~1.4 MB), aendert sich selten -> langer CDN-Cache
        // game-data: alle statischen Daten (species, moves, maps) -> separate Cache-Gruppe
        // ui: UI-Komponenten + Overlays -> klein, haeufig geupdated
        manualChunks(id: string) {
          if (id.includes('node_modules/phaser')) return 'phaser';
          if (id.includes('/src/data/species') || id.includes('/src/data/moves') || id.includes('/src/data/maps')) return 'game-data';
          if (id.includes('/src/ui/') || id.includes('/src/audio/')) return 'ui';
          if (id.includes('/src/scenes/Battle') || id.includes('/src/data/battle')) return 'battle';
        }
      }
    }
  }
});
