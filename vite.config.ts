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
        manualChunks: {
          phaser: ['phaser']
        }
      }
    }
  }
});
