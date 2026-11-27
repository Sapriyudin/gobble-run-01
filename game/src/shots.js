// Staging for screenshots: put the world into a named scene so a screenshot
// shows the game at its best. Each scene sets the distance, the stage, the
// farmer's gap and a few hazards, then the caller paints it twice. The scenes
// are deterministic: the same seed always stages the same picture.

import { FIELD, OVEN, PX_PER_M, STAGES, TURKEY } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

export function stageShot(name, world) {
  const state = world.state;
  const turkey = world.turkey;
  const farmer = world.farmer;

  function clearItems() {
    for (const item of world.items) item.active = false;
  }

  function place(kind, worldX, y, width, height) {
    for (const item of world.items) {
      if (item.active) continue;
      item.active = true;
      item.kind = kind;
      item.worldX = worldX;
      // Track items are placed by distance; the renderer draws them at this
      // screen x, so a staged shot must compute it the way the world does.
      item.x = TURKEY.screenX + (worldX - state.distance) * PX_PER_M;
      item.y = y;
      item.width = width;
      item.height = height;
      item.vx = 0;
      item.vy = 0;
      item.phase = 0;
      item.timer = 0;
      item.passed = false;
      return item;
    }
    return null;
  }

  world.reset();
  if (name === 'start') {
    state.distance = 0;
    state.stage = 0;
    farmer.state.gap = 8;
    farmer.state.mood = 'chase';
    // The title panel covers the middle; keep the props at the edges.
    place('hay', -5, FIELD.groundY - 64, 92, 64);
    place('corn', -8, FIELD.groundY - 26, 26, 26);
    place('fence', 30, FIELD.groundY - 74, 26, 74);
    return { screen: SCREEN_TITLE, best: 1250 };
  }
  if (name === 'kitchen') {
    state.distance = 940;
    state.stage = 2;
    state.score = 1480;
    state.lives = 2;
    farmer.state.gap = 6;
    farmer.state.mood = 'corner';
    farmer.state.spotted = true;
    const oven = place('oven', 965, FIELD.groundY - 64, OVEN.width, 64);
    if (oven) {
      oven.timer = OVEN.warnTime + 0.4;
      oven.phase = oven.timer;
    }
    place('corn', 950, FIELD.groundY - 116, 26, 26);
    place('fence', 975, FIELD.groundY - 74, 26, 74);
    const knife = place('knife-thrown', 0, 260, 34, 14);
    if (knife) knife.x = 620;
    return { screen: SCREEN_PLAY, best: 1480 };
  }
  if (name === 'end') {
    state.distance = 1200;
    state.stage = 2;
    state.score = 2310;
    state.lives = 1;
    state.over = true;
    state.escaped = true;
    farmer.state.gap = 8;
    farmer.state.mood = 'search';
    return { screen: SCREEN_OVER, best: 2310 };
  }
  // 'play': a farmyard chase in full flight.
  state.distance = 210;
  state.stage = 0;
  state.score = 640;
  state.lives = 3;
  farmer.state.gap = 5;
  farmer.state.mood = 'chase';
  farmer.state.spotted = true;
  place('hay', 235, FIELD.groundY - 64, 92, 64);
  place('fence', 240, FIELD.groundY - 74, 26, 74);
  place('corn', 225, FIELD.groundY - 116, 26, 26);
  place('corn', 245, FIELD.groundY - 26, 26, 26);
  const knife = place('knife-thrown', 0, 260, 34, 14);
  if (knife) knife.x = 620;
  return { screen: SCREEN_PLAY, best: 1250 };
}
