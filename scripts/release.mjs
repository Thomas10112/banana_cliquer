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

const DRY       = process.argv.includes('--dry-run');
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

// Arguments optionnels (mode non-interactif / automatisable) :
//   --version 0.2.0 --title "..." --item "..." --item "..."
const argVal  = (name) => { const i = process.argv.indexOf(name); return i !== -1 ? process.argv[i + 1] : undefined; };
const argVals = (name) => process.argv.reduce((a, v, i) => (v === name && process.argv[i + 1] ? [...a, process.argv[i + 1]] : a), []);
const FLAG_VERSION = argVal('--version');
const INTERACTIVE  = !FLAG_VERSION; // si --version fourni → pas de prompts

let rl = null;
const ask = (q) => { if (!rl) rl = createInterface({ input: stdin, output: stdout }); return rl.question(q); };

try {
  const appRaw     = await readFile(APP_JSON, 'utf8');
  const curVersion = JSON.parse(appRaw).expo.version;
  const suggested  = bumpPatch(curVersion);

  console.log(`\n🍌 Release Banana Punch — version actuelle : ${curVersion}${DRY ? '  (DRY-RUN)' : ''}\n`);

  let version, title, items;
  if (INTERACTIVE) {
    version = (await ask(`Nouvelle version [${suggested}] : `)).trim() || suggested;
    title   = (await ask('Titre (optionnel) : ')).trim();
    console.log('\nPoints de la mise à jour (un par ligne, ligne vide = fin) :');
    items = [];
    for (;;) {
      const line = (await ask(`  ${items.length + 1}. `)).trim();
      if (!line) break;
      items.push(line);
    }
  } else {
    version = FLAG_VERSION.trim();
    title   = (argVal('--title') ?? '').trim();
    items   = argVals('--item').map((i) => i.trim());
  }

  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    console.error(`❌ Version invalide : "${version}" (attendu X.Y.Z)`);
    process.exit(1);
  }
  if (items.length === 0) {
    console.error('❌ Au moins un point est requis (--item "..." ou en mode interactif).');
    process.exit(1);
  }

  const date = frDate();
  const msg  = `release: v${version}${title ? ` - ${title}` : ''}`.replace(/"/g, '\\"');

  // Entrée changelog qui sera insérée en premier
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

  console.log('\n─────────────────────────────');
  console.log(`Version : ${curVersion} → ${version}`);
  console.log(`Date    : ${date}`);
  if (title) console.log(`Titre   : ${title}`);
  console.log('Points  :');
  items.forEach((i) => console.log(`  • ${i}`));
  console.log('\nEntrée changelog générée :');
  console.log(entry);
  console.log('─────────────────────────────\n');

  if (DRY) {
    rl?.close();
    console.log('🔎 DRY-RUN — aucun fichier modifié, aucun commit, aucune publication.');
    console.log('Ce qui serait exécuté :');
    console.log(`  • app.json + package.json : version → ${version}`);
    console.log('  • constants/changelog.ts  : entrée ci-dessus insérée en premier');
    console.log('  • npx tsc --noEmit');
    console.log(`  • git commit -m "${msg}"`);
    console.log(`  • npx eas update --branch preview --message "${msg}" --non-interactive`);
    process.exit(0);
  }

  if (INTERACTIVE) {
    const ok = (await ask('Confirmer (bump + changelog + check + commit + OTA preview) ? [o/N] ')).trim().toLowerCase();
    rl?.close();
    if (!['o', 'oui', 'y', 'yes'].includes(ok)) {
      console.log('Annulé — aucun changement.');
      process.exit(0);
    }
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
  await writeFile(CHANGELOG, clRaw.replace(anchor, `${anchor}\n${entry}`));

  // 3. Vérif TypeScript (stoppe avant de publier si erreur)
  run('npx tsc --noEmit');

  // 4. Commit
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
