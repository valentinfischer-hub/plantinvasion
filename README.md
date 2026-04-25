# Plantinvasion

Mobile-Game-Projekt: 32-bit Pixel-Art-Idle-Breeder. Spieler zuechtet Pflanzen, kreuzt sie fuer neue Arten, sie kaempfen automatisch in der Arena.

## Tech-Stack
- Phaser 3.90 (Game Engine, TypeScript)
- Vite 5 (Dev Server + Build)
- Capacitor (Mobile-Wrapper, kommt in Phase 5)
- Supabase (Backend, Cloud-Saves)
- Codemagic (Cloud-Build und Mobile-Deploy)
- PixelLab.ai (Sprite-Generation via API)

## Setup
```bash
npm install
npm run dev
```
Oeffnet http://localhost:5173.

## Build
```bash
npm run build
```
Statisches Build in `dist/`.

## Status
Phase 0: Skeleton steht (Phaser+Vite+TS), Codemagic-Pipeline aktiv.
Phase 1: GDD und Genetik-Regeln in Arbeit.
