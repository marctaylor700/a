/**
 * Eyeshine — first-person night census (not a shooter).
 * Frozen contract. Other modules may add keys; do not rename these.
 */
export const GAME_ID = 'eyeshine';
export const TITLE = 'Eyeshine';
export const CENSUS_TARGET = 8;

export const DOM = {
  shell: 'game-shell',
  canvas: 'game-canvas',
  overlay: 'game-overlay',
  overlayTitle: 'overlay-title',
  overlayText: 'overlay-text',
  overlayBtn: 'overlay-btn',
  hud: 'game-hud',
  compass: 'hud-compass',
  objective: 'hud-objective',
  log: 'hud-log',
  stamina: 'hud-stamina',
  spirit: 'hud-spirit',
  prompt: 'hud-prompt',
  fact: 'hud-fact',
  cross: 'hud-cross',
  damage: 'hud-damage',
  srLive: 'sr-live',
};

export const PALETTE = {
  night: 0x14101d,
  nightDeep: 0x0e0a16,
  dusk: 0x2a1f3d,
  moon: 0xf0e7d8,
  eyeshine: 0xefa83b,
  laterite: 0xc2492a,
  leaf: 0x6a8a4a,
  leafDark: 0x3d5a32,
  bark: 0x4a3428,
  fossa: 0x6b3a28,
  water: 0x1a3a44,
};

export const WORLD = {
  size: 180,
  segments: 96,
  hillAmp: 4.2,
  treeCount: 220,
  fernCount: 280,
  rockCount: 48,
  fireflyCount: 70,
  fruitCount: 22,
  fogNear: 12,
  fogFar: 78,
  fogColor: 0x1a1524,
  moonDir: [-0.35, 0.72, -0.28],
};

export const PLAYER = {
  eyeHeight: 0.92,
  crouchHeight: 0.48,
  radius: 0.38,
  walkSpeed: 5.4,
  boundSpeed: 9.2,
  jumpSpeed: 7.6,
  gravity: 22,
  staminaMax: 100,
  staminaDrain: 22,
  staminaRegen: 14,
  mouseSens: 0.0022,
  bobAmp: 0.028,
};

export const FOSSA = {
  walkSpeed: 3.4,
  chaseSpeed: 7.1,
  detectRadius: 22,
  catchRadius: 1.35,
  loseInterest: 34,
};

export const PATHS = {
  speciesJson: 'data/species.json',
  images: 'images/',
  textures: 'images/game/',
};

export function $(id) {
  return document.getElementById(id);
}
