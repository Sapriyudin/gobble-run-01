// The game's rules and state, with no drawing and no browser in it: the turkey,
// the farmer, the stages, and every hazard (fences, haystacks, corn, ovens,
// thrown and falling knives). step() advances one fixed step and returns what
// happened as bit flags, so the caller can react without the world knowing about
// screens or sound. Pools are allocated once, at boot; nothing allocates after.

import {
  CORN,
  ESCAPE_DISTANCE,
  FARMER,
  FENCE,
  FIELD,
  HAY,
  KNIFE,
  LIVES,
  OVEN,
  POOL_SIZE,
  PX_PER_M,
  STAGES,
  TURKEY,
} from './config.js';
import { createTurkey } from './turkey.js';
import { createFarmer, MOOD_SEARCH } from './farmer.js';

export const EVENT_HIT = 1;
export const EVENT_CORN = 2;
export const EVENT_OVER = 4;
export const EVENT_ESCAPED = 8;
export const EVENT_SPOTTED = 16;
export const EVENT_NEAR_MISS = 32;

function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function createWorld(random, audio) {
  const turkey = createTurkey();
  const farmer = createFarmer();
  const items = [];
  for (let index = 0; index < POOL_SIZE; index += 1) {
    items.push({
      active: false, kind: '', worldX: 0, x: 0, y: 0, width: 0, height: 0,
      vx: 0, vy: 0, phase: 0, timer: 0, passed: false,
    });
  }
  const state = {
    distance: 0,
    score: 0,
    lives: LIVES,
    stage: 0,
    elapsed: 0,
    over: false,
    escaped: false,
    nextFence: 60,
    nextHay: 45,
    nextCorn: 30,
    nextOven: 860,
    nextFall: 6,
    nearHay: null,
  };

  function stageAt(distance) {
    for (let i = STAGES.length - 1; i >= 0; i -= 1) {
      if (distance >= STAGES[i].from) return i;
    }
    return 0;
  }

  function reset() {
    turkey.reset();
    farmer.reset();
    for (const item of items) item.active = false;
    state.distance = 0;
    state.score = 0;
    state.lives = LIVES;
    state.stage = 0;
    state.elapsed = 0;
    state.over = false;
    state.escaped = false;
    state.nextFence = 60;
    state.nextHay = 45;
    state.nextCorn = 30;
    state.nextOven = 860;
    state.nextFall = 6;
    state.nearHay = null;
  }

  function freeItem() {
    for (let index = 0; index < items.length; index += 1) {
      if (!items[index].active) return items[index];
    }
    return null;
  }

  function spawn(kind, worldX, y, width, height) {
    const item = freeItem();
    if (item === null) return null;
    item.active = true;
    item.kind = kind;
    item.worldX = worldX;
    item.x = 0;
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

  function throwKnife() {
    const box = farmer.box(TURKEY.screenX);
    const item = spawn('knife-thrown', 0, box.y + 30, KNIFE.width, KNIFE.height);
    if (item === null) return;
    item.x = box.x + FARMER.width - 10;
    item.vx = KNIFE.throwSpeed;
    item.vy = -KNIFE.arc;
    audio.whoosh();
  }

  function dropKnife() {
    const item = spawn('knife-fall', 0, -KNIFE.height, KNIFE.width * 1.4, KNIFE.height * 2.2);
    if (item === null) return;
    item.x = TURKEY.screenX + 220 + random() * 420;
    item.vy = KNIFE.fallSpeed;
  }

  /** One fixed step. `dir` is -1/0/1, `jump` and `hide` are this frame's inputs. */
  function step(dt, dir, jump, hide, harmless) {
    let events = 0;
    if (state.over) return events;
    state.elapsed += dt;

    const stage = STAGES[state.stage];
    const inKitchen = state.stage === 2;

    // The turkey runs; its speed scrolls the world and grows the distance.
    if (jump) turkey.jump();
    const nearHay = state.nearHay;
    const wantHide = hide && nearHay !== null && !turkey.state.jumping;
    turkey.step(dt, dir, wantHide);
    if (!harmless) state.distance += (turkey.state.speed * dt);
    state.stage = stageAt(state.distance);

    // The farmer chases, searches when the turkey hides, and throws knives.
    const thrown = farmer.step(dt, turkey.state.hidden, inKitchen, turkey.state.speed);
    if (thrown === 'throw') throwKnife();
    if (farmer.state.spotted && !turkey.state.hidden) events |= EVENT_SPOTTED;

    // Spawn the track ahead of the turkey, by distance.
    if (state.distance + 60 > state.nextFence) {
      spawn('fence', state.nextFence, FIELD.groundY - FENCE.height, FENCE.width, FENCE.height);
      state.nextFence += stage.fenceEvery + random() * 40;
    }
    if (state.distance + 60 > state.nextHay) {
      spawn('hay', state.nextHay, FIELD.groundY - HAY.height, HAY.width, HAY.height);
      state.nextHay += stage.hayEvery + random() * 50;
    }
    if (state.distance + 60 > state.nextCorn) {
      const arc = random() < 0.4;
      spawn('corn', state.nextCorn, FIELD.groundY - CORN.size - (arc ? 90 : 0), CORN.size, CORN.size);
      state.nextCorn += stage.cornEvery + random() * 30;
    }
    if (inKitchen && state.distance + 60 > state.nextOven) {
      spawn('oven', state.nextOven, FIELD.groundY - 64, OVEN.width, 64);
      state.nextOven += 120 + random() * 60;
    }
    if (stage.knives > 0) {
      state.nextFall -= dt;
      if (state.nextFall <= 0) {
        for (let n = 0; n < stage.knives; n += 1) dropKnife();
        state.nextFall = KNIFE.fallInterval + random();
      }
    }

    const turkeyBox = turkey.box();
    const farmerBox = farmer.box(TURKEY.screenX);
    state.nearHay = null;

    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      if (!item.active) continue;
      // Track items scroll left with the world; projectiles fly on their own.
      if (item.kind === 'knife-thrown') {
        item.x += item.vx * dt;
        item.vy += 900 * dt;
        item.y += item.vy * dt;
        if (item.x > FIELD.width + 60 || item.y > FIELD.groundY) {
          if (!item.passed && item.x > turkeyBox.x + turkeyBox.width) {
            state.score += KNIFE.dodgePoints;
            events |= EVENT_NEAR_MISS;
          }
          item.active = false;
          continue;
        }
      } else if (item.kind === 'knife-fall') {
        item.y += item.vy * dt;
        if (item.y > FIELD.groundY) {
          item.active = false;
          state.score += KNIFE.dodgePoints;
          events |= EVENT_NEAR_MISS;
          continue;
        }
      } else {
        item.x = TURKEY.screenX + (item.worldX - state.distance) * PX_PER_M;
        if (item.x + item.width < -80) {
          item.active = false;
          continue;
        }
        if (item.kind === 'oven') {
          item.timer += dt;
          const cycle = OVEN.warnTime + OVEN.flameTime + OVEN.gapTime;
          item.phase = item.timer % cycle;
        }
      }

      if (harmless) continue;
      const box = { x: item.x, y: item.y, width: item.width, height: item.height };
      if (item.kind === 'hay') {
        if (Math.abs(item.x - turkeyBox.x) < 90) state.nearHay = item;
        continue;
      }
      if (item.kind === 'corn') {
        if (overlaps(box, turkeyBox)) {
          item.active = false;
          state.score += CORN.points;
          events |= EVENT_CORN;
        }
        continue;
      }
      if (item.kind === 'oven') {
        const flaming = item.phase >= OVEN.warnTime && item.phase < OVEN.warnTime + OVEN.flameTime;
        if (flaming) {
          const flameBox = { x: item.x + 8, y: item.y - OVEN.flameHeight, width: item.width - 16, height: OVEN.flameHeight + 64 };
          if (overlaps(flameBox, turkeyBox) && turkey.state.invulnerable === 0) {
            state.lives -= 1;
            turkey.state.invulnerable = TURKEY.invulnerable;
            farmer.knockBack();
            events |= EVENT_HIT;
            if (state.lives <= 0) {
              state.over = true;
              events |= EVENT_OVER;
              return events;
            }
          }
        }
        continue;
      }
      // Fences and knives hurt on contact, unless the turkey is invulnerable.
      if (overlaps(box, turkeyBox) && turkey.state.invulnerable === 0) {
        item.active = false;
        state.lives -= 1;
        turkey.state.invulnerable = TURKEY.invulnerable;
        farmer.knockBack();
        events |= EVENT_HIT;
        if (state.lives <= 0) {
          state.over = true;
          events |= EVENT_OVER;
          return events;
        }
      }
    }

    // The farmer catches the turkey when the gap closes.
    if (!harmless && !turkey.state.hidden && farmer.state.gap <= FARMER.catchGap) {
      if (turkey.state.invulnerable === 0) {
        state.lives -= 1;
        turkey.state.invulnerable = TURKEY.invulnerable;
        farmer.knockBack();
        events |= EVENT_HIT;
        if (state.lives <= 0) {
          state.over = true;
          events |= EVENT_OVER;
          return events;
        }
      }
    }

    // Hiding only counts while a haystack is near; otherwise the farmer sees all.
    if (turkey.state.hidden && state.nearHay === null && farmer.state.mood !== MOOD_SEARCH) {
      turkey.state.hidden = false;
    }

    // Score is distance plus what the turkey collects and dodges.
    state.score += turkey.state.speed * dt * 1;
    if (state.distance >= ESCAPE_DISTANCE) {
      state.over = true;
      state.escaped = true;
      events |= EVENT_ESCAPED;
    }
    return events;
  }

  reset();
  return { state, turkey, farmer, items, reset, step };
}
