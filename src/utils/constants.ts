// Game-weite Konstanten fuer Tile-Movement, Animation, Rendering

export const TILE_SIZE = 16;

// Player-Movement
export const PLAYER_SPEED_PX_PER_SEC = 240;       // 15 Tiles/Sec, Stardew-aehnlich
export const PLAYER_RUN_MULTIPLIER = 1.5;
export const PLAYER_ANIM_FPS = 8;

// Camera
export const CAMERA_ZOOM = 2.0;
export const CAMERA_LERP = 0.1;

// Wurzelheim Map-Dimensionen
export const WURZELHEIM_WIDTH_TILES = 30;
export const WURZELHEIM_HEIGHT_TILES = 20;

// Game-Canvas-Default (responsive via FIT)
export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 720;

// Overworld-spezifische Sub-Canvas (Camera-Viewport)
export const OVERWORLD_VIEWPORT_WIDTH = 480;
export const OVERWORLD_VIEWPORT_HEIGHT = 480;

// Encounter (V0.3)
export const ENCOUNTER_RATE_TALL_GRASS = 0.05;
