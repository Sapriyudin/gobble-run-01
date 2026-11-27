// Every tuning number, colour and stage in one place. The playfield is a fixed
// 1280x720 logical area; the renderer scales it to the window, so no rule below
// depends on the screen size. Distances are metres; the world scrolls left as the
// turkey runs right, and the farmer chases from behind.

export const FIELD = { width: 1280, height: 720, groundY: 620 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display rate. */
export const STEP = 1 / 60;

/** Metres of world per pixel of scroll; the turkey's screen x stays fixed. */
export const PX_PER_M = 24;

export const TURKEY = {
  screenX: 460,
  width: 64,
  height: 58,
  baseSpeed: 5.0,
  sprintSpeed: 8.6,
  slowSpeed: 2.4,
  accel: 14,
  jumpVel: 640,
  gravity: 1700,
  invulnerable: 1.6,
};

export const FARMER = {
  width: 74,
  height: 104,
  chaseSpeed: 5.6,
  closingSpeed: 7.2,
  easingSpeed: 4.4,
  catchGap: 1.2,
  farGap: 26,
  nearGap: 8,
  knockBack: 12,
  throwInterval: 3.4,
  throwIntervalKitchen: 2.4,
  searchTime: 2.2,
};

export const LIVES = 3;

/** The three stages, by distance. Each is harder: faster farmer, more knives, new hazards. */
export const STAGES = [
  { name: 'Farmyard', from: 0, to: 400, knives: 0, oven: false, fenceEvery: 90, hayEvery: 110, cornEvery: 55 },
  { name: 'Barn', from: 400, to: 800, knives: 1, oven: false, fenceEvery: 70, hayEvery: 130, cornEvery: 60 },
  { name: 'Kitchen', from: 800, to: 1200, knives: 2, oven: true, fenceEvery: 60, hayEvery: 150, cornEvery: 70 },
];

export const ESCAPE_DISTANCE = 1200;

export const KNIFE = {
  width: 34,
  height: 14,
  throwSpeed: 420,
  arc: 260,
  fallSpeed: 300,
  fallInterval: 2.6,
  dodgePoints: 5,
};

export const OVEN = {
  width: 96,
  flameHeight: 110,
  warnTime: 0.8,
  flameTime: 1.1,
  gapTime: 1.6,
};

export const FENCE = { width: 26, height: 74 };
export const HAY = { width: 92, height: 64 };
export const CORN = { size: 26, points: 10 };

/** How many hazards can exist at once; pools are allocated once, at boot. */
export const POOL_SIZE = 48;

export const PALETTE = {
  backdrop: '#1a120b',
  skyFarm: '#f2a65a',
  skyBarn: '#c97e4a',
  skyKitchen: '#8a4a3a',
  groundFarm: '#7a5230',
  groundBarn: '#5d3a24',
  groundKitchen: '#4a2c22',
  fence: '#6b4423',
  hay: '#e8b93c',
  hayDark: '#c99a2a',
  turkey: '#8a5230',
  turkeyDark: '#6b3d22',
  tail: ['#a0522d', '#d2691e', '#e8a33c', '#c97e4a'],
  head: '#f2e6d0',
  beak: '#e8862a',
  wattle: '#e5534b',
  farmerSkin: '#f2c9a0',
  farmerHat: '#3a5a2a',
  farmerShirt: '#4a6a9a',
  farmerPants: '#3a3a4a',
  farmerApron: '#f2efe6',
  knife: '#d8dde6',
  knifeHandle: '#7a4a26',
  oven: '#2a2a30',
  ovenDoor: '#b8b0a0',
  flame: '#ff9a2a',
  flameCore: '#ffd94a',
  corn: '#f2c94c',
  cornLeaf: '#5a8a3a',
  panel: '#241a10',
  panelEdge: '#e8a33c',
  text: '#fdf6e3',
  muted: '#d8b98a',
  danger: '#ff5a3c',
  safe: '#7ac74a',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'gobble-run.best';
