// Leonida Ledger — hand-in program (Node 22, standard library only).
//
// The guide itself is plain static files under app/ (index.html, app.js, style.css
// and data/trophies.json) plus screenshots/ of the finished app. This program is the
// only moving part: it gathers those two folders into the output directory and asks
// the vendored make.fun library to write dossier.json from them, so the judge reads
// exactly what is in the repository. vendor/makefun-frontend.ts stays untouched.
//
// Run locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// In the grader the output directory is /output. Two runs must produce identical bytes.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyTree(source, target) {
  if (existsSync(source)) cpSync(source, target, { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
copyTree(join(repoRoot, 'app'), join(outputDir, 'app'));
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
copyTree(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'));

const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
