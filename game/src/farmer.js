// The farmer: he chases the turkey from behind, and his mood decides how fast
// he closes in. He knows the gap to the turkey and whether the turkey is hidden;
// the world feeds him those facts. Three moods:
//   chase  — the turkey is visible: close the gap, and throw a knife now and then.
//   search — the turkey hid: walk to the haystack, look around, then give up.
//   corner — the kitchen narrows the escape: he presses harder and throws faster.
// He never touches the score or the hazards; the world does that.

import { FARMER } from './config.js';

export const MOOD_CHASE = 'chase';
export const MOOD_SEARCH = 'search';
export const MOOD_CORNER = 'corner';

export function createFarmer() {
  const state = {
    gap: 18,
    mood: MOOD_CHASE,
    searchTimer: 0,
    throwTimer: FARMER.throwInterval,
    walkPhase: 0,
    spotted: false,
  };

  function reset() {
    state.gap = 18;
    state.mood = MOOD_CHASE;
    state.searchTimer = 0;
    state.throwTimer = FARMER.throwInterval;
    state.walkPhase = 0;
    state.spotted = false;
  }

  /**
   * Advance one fixed step. `turkeyHidden` and `inKitchen` come from the world.
   * Returns 'throw' when the farmer lets a knife fly, else null.
   */
  function step(dt, turkeyHidden, inKitchen, turkeySpeed) {
    state.walkPhase += dt * 6;
    let thrown = null;

    if (turkeyHidden && state.mood !== MOOD_SEARCH) {
      state.mood = MOOD_SEARCH;
      state.searchTimer = FARMER.searchTime;
      state.spotted = false;
    }
    if (inKitchen && state.mood === MOOD_CHASE) state.mood = MOOD_CORNER;

    if (state.mood === MOOD_SEARCH) {
      // He walks toward the haystack and looks around; the gap barely moves.
      state.gap = Math.max(6, state.gap - 1.2 * dt);
      state.searchTimer -= dt;
      if (state.searchTimer <= 0) {
        // Gives up: falls back, and the turkey gets a head start.
        state.mood = inKitchen ? MOOD_CORNER : MOOD_CHASE;
        state.gap = Math.min(30, state.gap + 14);
        state.throwTimer = FARMER.throwInterval;
      }
      return thrown;
    }

    // Chase or corner: close in when far, ease off when near, so a sprint can open
    // the gap and a stumble lets him catch up. He matches the turkey's pace plus
    // a little, so standing still is fatal and sprinting is freedom. When the gap
    // grows past the mid range he runs hard, so he stays on screen at the turkey's
    // heels instead of vanishing off the left edge.
    const closing = state.gap > FARMER.farGap ? FARMER.closingSpeed : state.gap > 14 ? 8.8 : FARMER.chaseSpeed;
    const approach = state.mood === MOOD_CORNER ? closing + 0.8 : closing;
    const closingRate = state.gap < FARMER.nearGap ? FARMER.easingSpeed : approach;
    state.gap += (turkeySpeed - closingRate) * dt;
    if (state.gap < 0) state.gap = 0;

    state.spotted = state.gap < FARMER.nearGap + 4;

    state.throwTimer -= dt;
    if (state.throwTimer <= 0) {
      thrown = 'throw';
      state.throwTimer = inKitchen ? FARMER.throwIntervalKitchen : FARMER.throwInterval;
    }
    return thrown;
  }

  /** Shove the farmer back after he lands a hit, so the turkey gets a breather. */
  function knockBack() {
    state.gap = Math.min(30, state.gap + FARMER.knockBack);
    state.throwTimer = Math.max(state.throwTimer, 1.2);
  }

  /** The farmer's box, in screen pixels, from his gap behind the turkey. */
  function box(turkeyScreenX) {
    const x = turkeyScreenX - state.gap * 24 - FARMER.width;
    return { x, y: 620 - FARMER.height, width: FARMER.width, height: FARMER.height };
  }

  return { state, reset, step, knockBack, box };
}
