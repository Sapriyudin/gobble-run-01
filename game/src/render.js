// Drawing only: the world's state and the current screen in, pixels out. The
// 1280x720 playfield is scaled to fit the window and centred, the margin filled
// with the backdrop colour. Everything is flat canvas shapes in an autumn palette:
// a turkey with a fan tail, a farmer in a hat and apron, the farm, the barn and
// the kitchen, a HUD, and panels for the title, pause and end screens. Text that
// holds a number is rebuilt only when the number changes, so a frame allocates nothing.

import { FIELD, FONT, LIVES, OVEN, PALETTE, STAGES, TURKEY } from './config.js';
import { MOOD_SEARCH } from './farmer.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

const PANEL = { width: 640, top: 150, line: 34, bottom: 76 };
const LIFE_SIZE = 22;
const LIFE_GAP = 8;

function cachedLabel(prefix) {
  let value = -1;
  let text = '';
  return function label(next) {
    if (next !== value) {
      value = next;
      text = prefix + next;
    }
    return text;
  };
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const scoreLabel = cachedLabel('Score ');
  const distLabel = cachedLabel('Distance ');
  const stageLabel = cachedLabel('');
  const finalLabel = cachedLabel('Score ');
  const bestLabel = cachedLabel('Best ');

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  const fonts = new Map();
  function text(value, x, y, size, color, align) {
    if (!fonts.has(size)) fonts.set(size, `${size}px ${FONT}`);
    context.font = fonts.get(size);
    context.fillStyle = color;
    context.textAlign = align;
    context.fillText(value, x, y);
  }

  function drawKnife(x, y, width, height, angle) {
    context.save();
    context.translate(x + width / 2, y + height / 2);
    context.rotate(angle || 0);
    context.fillStyle = '#7a4a26';
    context.fillRect(-width * 0.28, -height / 2, width * 0.28, height);
    context.fillStyle = '#d8dde6';
    context.beginPath();
    context.moveTo(0, -height / 2);
    context.lineTo(width * 0.72, 0);
    context.lineTo(0, height / 2);
    context.closePath();
    context.fill();
    context.restore();
  }

  function drawTurkey(box, phase, hidden, invulnerable) {
    if (invulnerable > 0 && Math.floor(invulnerable * 10) % 2 === 0) return;
    const cx = box.x + box.width / 2;
    const base = box.y + box.height;
    const bob = Math.sin(phase * 9) * 3;
    if (hidden) {
      // Tucked behind the hay: only the tail fan and an eye show.
      for (let i = 0; i < 3; i += 1) {
        context.fillStyle = PALETTE.tail[i];
        context.beginPath();
        context.arc(cx, base - 14, box.width * (0.5 - i * 0.1), Math.PI, 0);
        context.fill();
      }
      return;
    }
    for (let i = 0; i < 4; i += 1) {
      context.fillStyle = PALETTE.tail[i];
      context.beginPath();
      context.arc(cx - 6, base - 16 + bob, box.width * (0.66 - i * 0.11), Math.PI * 1.05, 0);
      context.fill();
    }
    context.fillStyle = PALETTE.turkey;
    context.beginPath();
    context.ellipse(cx, base - 14 + bob, box.width * 0.36, box.height * 0.42, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = PALETTE.turkeyDark;
    context.beginPath();
    context.ellipse(cx - 4, base - 6 + bob, box.width * 0.2, 6, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = PALETTE.head;
    context.beginPath();
    context.arc(cx + box.width * 0.3, base - 44 + bob, 11, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = PALETTE.beak;
    context.beginPath();
    context.moveTo(cx + box.width * 0.3 + 8, base - 46 + bob);
    context.lineTo(cx + box.width * 0.3 + 22, base - 42 + bob);
    context.lineTo(cx + box.width * 0.3 + 8, base - 38 + bob);
    context.closePath();
    context.fill();
    context.fillStyle = PALETTE.wattle;
    context.fillRect(cx + box.width * 0.3 + 4, base - 34 + bob, 6, 12);
    context.fillStyle = '#1a1a1a';
    context.beginPath();
    context.arc(cx + box.width * 0.3 + 4, base - 48 + bob, 2.4, 0, Math.PI * 2);
    context.fill();
  }

  function drawFarmer(box, phase, mood, spotted) {
    const cx = box.x + box.width / 2;
    const base = box.y + box.height;
    const stride = Math.sin(phase) * 6;
    context.fillStyle = PALETTE.farmerPants;
    context.fillRect(cx - 16, base - 44, 13, 44 + (stride > 0 ? stride : 0));
    context.fillRect(cx + 3, base - 44, 13, 44 + (stride < 0 ? -stride : 0));
    context.fillStyle = PALETTE.farmerShirt;
    context.fillRect(cx - 20, base - 84, 40, 44);
    context.fillStyle = PALETTE.farmerApron;
    context.fillRect(cx - 14, base - 80, 28, 52);
    context.fillStyle = PALETTE.farmerSkin;
    context.beginPath();
    context.arc(cx, base - 96, 15, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = PALETTE.farmerHat;
    context.beginPath();
    context.ellipse(cx, base - 106, 26, 7, 0, 0, Math.PI * 2);
    context.fill();
    context.fillRect(cx - 14, base - 124, 28, 20);
    context.fillStyle = '#1a1a1a';
    context.beginPath();
    context.arc(cx + 6, base - 98, 2.2, 0, Math.PI * 2);
    context.fill();
    if (spotted) {
      text('!', cx, base - 140, 40, PALETTE.danger, 'center');
    } else if (mood === MOOD_SEARCH) {
      text('?', cx, base - 140, 36, PALETTE.muted, 'center');
    }
  }

  function drawBackground(stage, distance) {
    const sky = stage === 0 ? PALETTE.skyFarm : stage === 1 ? PALETTE.skyBarn : PALETTE.skyKitchen;
    const ground = stage === 0 ? PALETTE.groundFarm : stage === 1 ? PALETTE.groundBarn : PALETTE.groundKitchen;
    context.fillStyle = sky;
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    // Sun and clouds drift slowly with the distance, so the world feels alive.
    context.fillStyle = '#ffd94a';
    context.beginPath();
    context.arc(1120 - (distance % 400), 90, 44, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = 'rgba(253, 246, 227, 0.85)';
    context.beginPath();
    context.ellipse(240 - ((distance * 0.4) % 1400), 110, 90, 22, 0, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.ellipse(760 - ((distance * 0.4) % 1400), 70, 110, 26, 0, 0, Math.PI * 2);
    context.fill();
    if (stage === 2) {
      // Kitchen: a wall, a window on the right (clear of the HUD), a shelf of
      // pots, a hanging lamp and a counter edge behind the run.
      context.fillStyle = '#6a3a2a';
      context.fillRect(0, 0, FIELD.width, 300);
      context.fillStyle = '#f2e6d0';
      context.fillRect(1020, 80, 180, 140);
      context.fillStyle = '#8a4a3a';
      context.fillRect(1020, 80, 180, 10);
      context.fillRect(1020, 210, 180, 10);
      context.fillRect(1100, 80, 10, 140);
      context.fillStyle = '#4a2c22';
      context.fillRect(0, 300, FIELD.width, 14);
      context.fillStyle = '#3a2a1a';
      context.fillRect(120, 180, 300, 10);
      context.fillStyle = '#2a2a30';
      context.beginPath();
      context.arc(170, 168, 18, 0, Math.PI * 2);
      context.fill();
      context.beginPath();
      context.arc(250, 168, 18, 0, Math.PI * 2);
      context.fill();
      context.beginPath();
      context.arc(330, 168, 18, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#ffd94a';
      context.beginPath();
      context.arc(640, 90, 26, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#3a2a1a';
      context.fillRect(638, 40, 4, 26);
    } else {
      // Farm and barn: fence posts and trees scrolling past.
      context.fillStyle = PALETTE.fence;
      const offset = (distance * 24) % 120;
      for (let x = -offset; x < FIELD.width; x += 120) {
        context.fillRect(x, FIELD.groundY - 90, 10, 90);
        context.fillRect(x, FIELD.groundY - 90, 120, 8);
        context.fillRect(x, FIELD.groundY - 56, 120, 8);
      }
      context.fillStyle = '#5a7a3a';
      context.beginPath();
      context.arc(180 - ((distance * 0.3) % 1500), FIELD.groundY - 60, 60, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#6b4423';
      context.fillRect(168 - ((distance * 0.3) % 1500), FIELD.groundY - 60, 24, 60);
    }
    context.fillStyle = ground;
    context.fillRect(0, FIELD.groundY, FIELD.width, FIELD.height - FIELD.groundY);
    context.fillStyle = 'rgba(0,0,0,0.18)';
    context.fillRect(0, FIELD.groundY, FIELD.width, 8);
  }

  function drawField(world) {
    const state = world.state;
    drawBackground(state.stage, state.distance);
    for (const item of world.items) {
      if (!item.active) continue;
      if (item.kind === 'fence') {
        context.fillStyle = PALETTE.fence;
        context.fillRect(item.x, item.y, 8, item.height);
        context.fillRect(item.x + item.width - 8, item.y, 8, item.height);
        context.fillRect(item.x, item.y + 10, item.width, 8);
        context.fillRect(item.x, item.y + item.height / 2, item.width, 8);
      } else if (item.kind === 'hay') {
        context.fillStyle = PALETTE.hay;
        context.beginPath();
        context.ellipse(item.x + item.width / 2, item.y + item.height, item.width / 2, item.height, 0, Math.PI, 0);
        context.fill();
        context.fillStyle = PALETTE.hayDark;
        for (let i = 0; i < 5; i += 1) {
          context.fillRect(item.x + 12 + i * 16, item.y + 18 + (i % 2) * 12, 3, 22);
        }
      } else if (item.kind === 'corn') {
        context.fillStyle = PALETTE.corn;
        context.beginPath();
        context.ellipse(item.x + item.width / 2, item.y + item.height / 2, item.width / 3, item.height / 2, 0, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = PALETTE.cornLeaf;
        context.fillRect(item.x + item.width / 2 - 2, item.y + item.height - 6, 4, 12);
      } else if (item.kind === 'oven') {
        const flaming = item.phase >= OVEN.warnTime && item.phase < OVEN.warnTime + OVEN.flameTime;
        const warning = !flaming && item.phase < OVEN.warnTime;
        context.fillStyle = PALETTE.oven;
        context.fillRect(item.x, item.y, item.width, item.height);
        context.fillStyle = PALETTE.ovenDoor;
        context.fillRect(item.x + 12, item.y + 12, item.width - 24, item.height - 24);
        context.fillStyle = '#1a1a1a';
        context.fillRect(item.x + 20, item.y + 20, item.width - 40, item.height - 40);
        if (warning) {
          context.fillStyle = PALETTE.flame;
          context.beginPath();
          context.arc(item.x + item.width / 2, item.y - 12, 8 + Math.sin(item.timer * 10) * 3, 0, Math.PI * 2);
          context.fill();
        }
        if (flaming) {
          context.fillStyle = PALETTE.flame;
          context.beginPath();
          context.moveTo(item.x + 8, item.y);
          context.quadraticCurveTo(item.x + item.width / 2, item.y - OVEN.flameHeight - 20, item.x + item.width - 8, item.y);
          context.closePath();
          context.fill();
          context.fillStyle = PALETTE.flameCore;
          context.beginPath();
          context.moveTo(item.x + 24, item.y);
          context.quadraticCurveTo(item.x + item.width / 2, item.y - OVEN.flameHeight * 0.55, item.x + item.width - 24, item.y);
          context.closePath();
          context.fill();
        }
      } else if (item.kind === 'knife-thrown') {
        drawKnife(item.x, item.y, item.width, item.height, 0.5);
      } else if (item.kind === 'knife-fall') {
        drawKnife(item.x, item.y, item.width, item.height, 0);
      }
    }
    const turkey = world.turkey;
    drawTurkey(turkey.box(), turkey.state.runPhase, turkey.state.hidden, turkey.state.invulnerable);
    const farmer = world.farmer;
    drawFarmer(farmer.box(TURKEY.screenX), farmer.state.walkPhase, farmer.state.mood, farmer.state.spotted);
  }

  function drawHud(world) {
    const state = world.state;
    context.textBaseline = 'top';
    text(scoreLabel(Math.floor(state.score)), 24, 18, 28, PALETTE.text, 'left');
    text(distLabel(Math.floor(state.distance) + ' m'), 24, 52, 22, PALETTE.muted, 'left');
    text(stageLabel(STAGES[state.stage].name), FIELD.width / 2, 18, 28, PALETTE.text, 'center');
    const firstLife = FIELD.width - 24 - LIVES * (LIFE_SIZE + LIFE_GAP) + LIFE_GAP;
    text('Lives', firstLife - 12, 18, 28, PALETTE.text, 'right');
    for (let life = 0; life < LIVES; life += 1) {
      context.fillStyle = life < state.lives ? PALETTE.turkey : 'rgba(0,0,0,0.35)';
      context.beginPath();
      context.arc(firstLife + life * (LIFE_SIZE + LIFE_GAP) + LIFE_SIZE / 2, 30, LIFE_SIZE / 2, 0, Math.PI * 2);
      context.fill();
    }
  }

  function drawPanel(title, lines, prompt) {
    const height = PANEL.top + lines.length * PANEL.line + PANEL.bottom;
    const x = (FIELD.width - PANEL.width) / 2;
    const y = (FIELD.height - height) / 2;
    context.fillStyle = PALETTE.panel;
    context.fillRect(x, y, PANEL.width, height);
    context.strokeStyle = PALETTE.panelEdge;
    context.lineWidth = 3;
    context.strokeRect(x, y, PANEL.width, height);
    context.textBaseline = 'alphabetic';
    text(title, FIELD.width / 2, y + 78, 46, PALETTE.text, 'center');
    for (let index = 0; index < lines.length; index += 1) {
      text(lines[index], FIELD.width / 2, y + PANEL.top + index * PANEL.line, 21, PALETTE.muted, 'center');
    }
    text(prompt, FIELD.width / 2, y + height - 38, 23, PALETTE.corn, 'center');
  }

  const TITLE_LINES = [
    'Thanksgiving is coming. The farmer is coming faster.',
    'Run, jump and hide from the farmyard to the kitchen.',
    'Reach the forest gate and you are free.',
    'Move: ← → or A D to run · Space to jump · ↓ to hide',
    '',
  ];
  const PAUSED_LINES = ['The farmer waits. The knives wait too.'];
  const OVER_CAUGHT = ['', 'The farmer got his Thanksgiving dinner.'];
  const OVER_ESCAPED = ['', 'You made it to the forest. Happy Thanksgiving!'];

  function draw(world, screen, best) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    drawField(world);
    if (screen === SCREEN_TITLE) {
      TITLE_LINES[4] = bestLabel(best);
      drawPanel('Gobble Run', TITLE_LINES, 'Press Space or click to start');
      return;
    }
    drawHud(world);
    if (screen === SCREEN_PAUSED) {
      drawPanel('Paused', PAUSED_LINES, 'Press P to resume');
    } else if (screen === SCREEN_OVER) {
      if (world.state.escaped) {
        OVER_ESCAPED[0] = finalLabel(world.state.score);
        drawPanel('Escaped!', OVER_ESCAPED, 'Press Space or click to run again');
      } else {
        OVER_CAUGHT[0] = finalLabel(world.state.score);
        drawPanel('Caught for dinner', OVER_CAUGHT, 'Press Space or click to run again');
      }
    }
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw };
}
