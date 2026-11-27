// Gobble Run's hand-in program (Node 22, standard library only). The game is
// the game/ folder beside this file: plain static files a desktop browser loads
// offline (game/index.html and its ES modules, no library, no network request).
// This program hands it in: it copies game/ and screenshots/ into the output
// directory and writes output/dossier.json, the summary the judge reads, using
// the vendored make.fun library. It runs twice in the grader and both runs must
// write the same bytes, so it does nothing but copy and write.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the game locally with `node serve.ts`, then open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyTree(from, to) {
  if (!existsSync(from)) return;
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

mkdirSync(outDir, { recursive: true });
copyTree(join(root, 'game'), join(outDir, 'game'));
copyTree(join(root, 'screenshots'), join(outDir, 'screenshots'));

// The scorer's caps (see the kit's gate): the dossier text is capped at 160 KiB,
// screenshots at 4 files of 256 KiB each, and game/ at 993 files and 48 MiB.
// buildDossier enforces the text cap; the rest is the entry's own job.
//
// Screenshots are copied as they are named: the first by name is the cover the
// judge sees largest, so name them in the order the game should be introduced:
// 1-start.png (title), 2-play.png (farmyard chase), 3-kitchen.png (oven stage),
// 4-escaped.png (the escaped end screen).
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
