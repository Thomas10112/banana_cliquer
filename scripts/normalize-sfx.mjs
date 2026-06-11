#!/usr/bin/env node
// Égalise le volume des SFX d'upgrade : mesure le volume moyen (volumedetect)
// puis applique le gain pour viser TARGET_MEAN_DB, sans dépasser CEILING_DB en crête.
// Ré-encode sur place (mp3 → libmp3lame VBR ~190k, wav → pcm 16 bits).
//
//   node ./scripts/normalize-sfx.mjs            → applique
//   node ./scripts/normalize-sfx.mjs --dry-run  → mesure seulement
//
import { spawnSync } from 'node:child_process';
import { renameSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, extname, join } from 'node:path';
import ffmpeg from 'ffmpeg-static';

const DRY  = process.argv.includes('--dry-run');
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const TARGET_MEAN_DB = -15;  // niveau moyen visé
const CEILING_DB     = -0.5; // crête max après gain (anti-clipping)

// SFX joués par use-sounds.ts à l'achat d'un upgrade
const FILES = [
  'assets/sounds/age-0/mixkit-monkey-excited-screech-105.wav',
  'assets/sounds/age-0/guerrier.mp3',
  'assets/sounds/age-0/cest-moi-qui-les-ai-plantes-planteees.mp3',
  'assets/sounds/age-0/chewbacca.swf.mp3',
  'assets/sounds/age-1/paysan_sound.mp3',
  'assets/sounds/age-1/charrue_sound.mp3',
  'assets/sounds/age-1/adolfo-h.mp3',
  'assets/sounds/age-1/jacquouille-santé-les-gueux-made-with-Voicemod.mp3',
  'assets/sounds/age-2/eddy-le-quartier-le-chantier-made-with-Voicemod.mp3',
  'assets/sounds/age-2/faaah.mp3',
  'assets/sounds/age-2/usine.mp3',
  'assets/sounds/age-2/locomotive.mp3',
  'assets/sounds/age-3/ingenieur.mp3',
  'assets/sounds/age-3/ordinateur.mp3',
  'assets/sounds/age-3/drone.mp3',
  'assets/sounds/age-3/satellite.mp3',
  'assets/sounds/age-4/robot.mp3',
  'assets/sounds/age-4/ia.mp3',
  'assets/sounds/age-4/megasturucture.mp3',
];

function detect(file) {
  const r = spawnSync(ffmpeg, ['-hide_banner', '-i', file, '-af', 'volumedetect', '-f', 'null', '-'],
    { cwd: ROOT, encoding: 'utf8' });
  const out  = r.stderr ?? '';
  const mean = out.match(/mean_volume:\s*(-?[\d.]+) dB/)?.[1];
  const max  = out.match(/max_volume:\s*(-?[\d.]+) dB/)?.[1];
  if (mean === undefined || max === undefined) throw new Error(`volumedetect échoué pour ${file}`);
  return { mean: Number(mean), max: Number(max) };
}

let failed = 0;
for (const file of FILES) {
  let m;
  try { m = detect(file); } catch (e) { console.error(`❌ ${e.message}`); failed++; continue; }

  let gain = TARGET_MEAN_DB - m.mean;
  if (m.max + gain > CEILING_DB) gain = CEILING_DB - m.max; // plafonne pour éviter la saturation

  const label = `${file}  (moy ${m.mean} dB, crête ${m.max} dB)`;
  if (Math.abs(gain) < 0.5) { console.log(`= ${label} — déjà au niveau`); continue; }
  if (DRY) { console.log(`→ ${label} : gain ${gain.toFixed(1)} dB`); continue; }

  const ext = extname(file).toLowerCase();
  const tmp = join(ROOT, file + '.tmp' + ext);
  const codec = ext === '.wav' ? ['-c:a', 'pcm_s16le'] : ['-c:a', 'libmp3lame', '-q:a', '2'];
  const r = spawnSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', file,
    '-af', `volume=${gain.toFixed(2)}dB`, ...codec, tmp], { cwd: ROOT, encoding: 'utf8' });
  if (r.status !== 0) {
    console.error(`❌ encode échoué pour ${file} : ${r.stderr}`);
    try { unlinkSync(tmp); } catch {}
    failed++;
    continue;
  }
  renameSync(tmp, join(ROOT, file));
  const after = detect(file);
  console.log(`✓ ${label} → gain ${gain.toFixed(1)} dB → moy ${after.mean} dB`);
}

if (failed > 0) { console.error(`\n${failed} fichier(s) en échec`); process.exit(1); }
console.log(DRY ? '\n🔎 DRY-RUN terminé' : '\n✅ Normalisation terminée');
