#!/usr/bin/env node
// Release Banana Punch en une commande : bump version + entrée changelog
// + vérif TypeScript + commit + OTA preview.
//
//   npm run release
//
import { readFile, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT      = join(dirname(fileURLToPath(import.meta.url)), '..');
const APP_JSON  = join(ROOT, 'app.json');
const PKG_JSON  = join(ROOT, 'package.json');
const CHANGELOG = join(ROOT, 'constants', 'changelog.ts');

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const frDate = (d = new Date()) => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

function bumpPatch(v) {
  const m = v.match(/^(\d+)\.(\d+)\.(\d+)$/);
  return m ? `${m[1]}.${m[2]}.${Number(m[3]) + 1}` : v;
}

function run(cmd) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: ROOT });
}

const rl  = createInterface({ input: stdin, output: stdout });
const ask = (q) => rl.question(q);

try {
  const appRaw     = await readFile(APP_JSON, 'utf8');
  const curVersion = JSON.parse(appRaw).expo.version;
  const suggested  = bumpPatch(curVersion);

  console.log(`\n🍌 Release Banana Punch — version actuelle : ${curVersion}\n`);

  const version = (await ask(`Nouvelle version [${suggested}] : `)).trim() || suggested;
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    console.error(`❌ Version invalide : "${version}" (attendu X.Y.Z)`);
    process.exit(1);
  }

  const title = (await ask('Titre (optionnel) : ')).trim();

  console.log('\nPoints de la mise à jour (un par ligne, ligne vide = fin) :');
  const items = [];
  for (;;) {
    const line = (await ask(`  ${items.length + 1}. `)).trim();
    if (!line) break;
    items.push(line);
  }
  if (items.length === 0) {
    console.error('❌ Au moins un point est requis.');
    process.exit(1);
  }

  const date = frDate();

  console.log('\n─────────────────────────────');
  console.log(`Version : ${version}`);
  console.log(`Date    : ${date}`);
  if (title) console.log(`Titre   : ${title}`);
  console.log('Points  :');
  items.forEach((i) => console.log(`  • ${i}`));
  console.log('─────────────────────────────\n');

  const ok = (await ask('Confirmer (bump + changelog + check + commit + OTA preview) ? [o/N] ')).trim().toLowerCase();
  rl.close();
  if (!['o', 'oui', 'y', 'yes'].includes(ok)) {
    console.log('Annulé — aucun changement.');
    process.exit(0);
  }

  // 1. Versions (app.json + package.json)
  await writeFile(APP_JSON, appRaw.replace(/("version"\s*:\s*)"[^"]*"/, `$1"${version}"`));
  const pkgRaw = await readFile(PKG_JSON, 'utf8');
  await writeFile(PKG_JSON, pkgRaw.replace(/("version"\s*:\s*)"[^"]*"/, `$1"${version}"`));

  // 2. Entrée changelog (insérée en premier)
  const clRaw  = await readFile(CHANGELOG, 'utf8');
  const anchor = 'export const CHANGELOG: ChangelogEntry[] = [';
  if (!clRaw.includes(anchor)) {
    console.error('❌ Ancre changelog introuvable dans constants/changelog.ts');
    process.exit(1);
  }
  const entry = [
    '  {',
    `    version: ${JSON.stringify(version)},`,
    `    date: ${JSON.stringify(date)},`,
    ...(title ? [`    title: ${JSON.stringify(title)},`] : []),
    '    items: [',
    ...items.map((i) => `      ${JSON.stringify(i)},`),
    '    ],',
    '  },',
  ].join('\n');
  await writeFile(CHANGELOG, clRaw.replace(anchor, `${anchor}\n${entry}`));

  // 3. Vérif TypeScript (stoppe avant de publier si erreur)
  run('npx tsc --noEmit');

  // 4. Commit
  const msg = `release: v${version}${title ? ` - ${title}` : ''}`.replace(/"/g, '\\"');
  run('git add -A');
  run(`git commit -m "${msg}"`);

  // 5. OTA preview
  run(`npx eas update --branch preview --message "${msg}" --non-interactive`);

  console.log(`\n✅ v${version} publiée sur le canal preview !`);
} catch (e) {
  try { rl.close(); } catch {}
  console.error('\n❌ Échec :', e?.message ?? e);
  process.exit(1);
}
