// The player's turkey: where it is, how fast it runs, whether it is jumping or
// hiding. It knows nothing about the farmer, the hazards or the score; the world
// tells it what happened. The turkey's screen x is fixed: the world scrolls past
// it, and its distance is how far the world has moved.

import { FIELD, TURKEY } from './config.js';

export function createTurkey() {
  const state = {
    y: FIELD.groundY - TURKEY.height,
    vy: 0,
    speed: TURKEY.baseSpeed,
    jumping: false,
    hidden: false,
    invulnerable: 0,
    runPhase: 0,
  };

  function reset() {
    state.y = FIELD.groundY - TURKEY.height;
    state.vy = 0;
    state.speed = TURKEY.baseSpeed;
    state.jumping = false;
    state.hidden = false;
    state.invulnerable = 0;
    state.runPhase = 0;
  }

  /** Advance one fixed step. `dir` is -1 (slow), 0 (run) or 1 (sprint). */
  function step(dt, dir, wantHide) {
    const target =
      dir > 0 ? TURKEY.sprintSpeed : dir < 0 ? TURKEY.slowSpeed : TURKEY.baseSpeed;
    const rate = TURKEY.accel * dt;
    if (state.speed < target) state.speed = Math.min(target, state.speed + rate);
    else if (state.speed > target) state.speed = Math.max(target, state.speed - rate);
    state.runPhase += state.speed * dt;

    if (state.invulnerable > 0) state.invulnerable = Math.max(0, state.invulnerable - dt);

    if (state.jumping) {
      state.vy += TURKEY.gravity * dt;
      state.y += state.vy * dt;
      if (state.y >= FIELD.groundY - TURKEY.height) {
        state.y = FIELD.groundY - TURKEY.height;
        state.vy = 0;
        state.jumping = false;
      }
    }
    state.hidden = wantHide && !state.jumping;
  }

  function jump() {
    if (state.jumping || state.hidden) return false;
    state.jumping = true;
    state.vy = -TURKEY.jumpVel;
    return true;
  }

  /** The turkey's box, in screen pixels (x fixed, y from the jump). */
  function box() {
    return {
      x: TURKEY.screenX,
      y: state.y,
      width: TURKEY.width,
      height: TURKEY.height,
    };
  }

  return { state, reset, step, jump, box };
}
