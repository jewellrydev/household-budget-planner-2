// Household Budget Planner — hand-in program for make.fun's
// "Make the best household budget site" bounty (Node 22, stdlib only).
//
// The site itself is plain static files under app/ (index.html, style.css,
// main.js, data.js): a browser opens app/index.html and the planner works
// with no network request. This program hands the site in: it copies app/
// and screenshots/ from beside this file into the output directory and
// writes dossier.json there with the vendored make.fun library, so the
// judge can read the site's screenshots, first-load files and source.
// It exits when done — it starts no server.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 16777216,
  }),
);

// Say what went in, so a run's log shows the hand-in is complete.
const appFiles = readdirSync(join(out, 'app'));
const shots = readdirSync(join(out, 'screenshots'));
console.log(
  `Handed in the Household Budget Planner to ${out} ` +
    `(${appFiles.length} app files, ${shots.length} screenshots, dossier.json written)`,
);
