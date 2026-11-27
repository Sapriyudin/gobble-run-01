// Keyboard and mouse input, with no game rules in it: it only reports what the
// player is holding and which actions were pressed since the last read. The game
// reads it once a frame and clears the pressed actions with takeActions().

export const ACTION_JUMP = 1;
export const ACTION_HIDE = 2;
export const ACTION_CONFIRM = 4;
export const ACTION_PAUSE = 8;

const LEFT_KEYS = new Set(['ArrowLeft', 'a', 'A']);
const RIGHT_KEYS = new Set(['ArrowRight', 'd', 'D']);
const JUMP_KEYS = new Set(['ArrowUp', 'w', 'W', ' ']);
const HIDE_KEYS = new Set(['ArrowDown', 's', 'S']);
const CONFIRM_KEYS = new Set([' ', 'Enter']);
const PAUSE_KEYS = new Set(['p', 'P', 'Escape']);

export function createInput(canvas) {
  const held = new Set();
  let pressed = 0;

  function onKeyDown(event) {
    if (JUMP_KEYS.has(event.key)) {
      pressed |= ACTION_JUMP | ACTION_CONFIRM;
      event.preventDefault();
    } else if (HIDE_KEYS.has(event.key)) {
      pressed |= ACTION_HIDE;
      event.preventDefault();
    } else if (CONFIRM_KEYS.has(event.key)) {
      pressed |= ACTION_CONFIRM;
      event.preventDefault();
    } else if (PAUSE_KEYS.has(event.key)) {
      pressed |= ACTION_PAUSE;
      event.preventDefault();
    }
    held.add(event.key);
    if (LEFT_KEYS.has(event.key) || RIGHT_KEYS.has(event.key)) event.preventDefault();
  }

  function onKeyUp(event) {
    held.delete(event.key);
  }

  function onPointerDown(event) {
    pressed |= ACTION_JUMP | ACTION_CONFIRM;
    event.preventDefault();
  }

  function onBlur() {
    held.clear();
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  canvas.addEventListener('pointerdown', onPointerDown);

  /** -1 to slow, 0 to run, 1 to sprint. */
  function runDirection() {
    let dir = 0;
    for (const key of held) {
      if (LEFT_KEYS.has(key)) dir -= 1;
      if (RIGHT_KEYS.has(key)) dir += 1;
    }
    return dir;
  }

  function hiding() {
    for (const key of held) if (HIDE_KEYS.has(key)) return true;
    return false;
  }

  function takeActions() {
    const out = pressed;
    pressed = 0;
    return out;
  }

  return { runDirection, hiding, takeActions };
}
