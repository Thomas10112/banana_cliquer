// Petit bus audio partagé entre la musique d'ambiance (use-ambiance) et les SFX
// (use-sounds). Permet de « ducker » la musique — la baisser brièvement — quand
// un son d'upgrade joue, puis de la remonter en douceur. Sobre, sans excès.

type VolumeTarget = { volume: number } | null;

let activePlayer: VolumeTarget = null;
let baseVolume = 0.25;

let restoreTimer: ReturnType<typeof setTimeout> | undefined;
let rampTimer: ReturnType<typeof setInterval> | undefined;

const DUCK_FACTOR = 0.4;  // musique abaissée à 40 % de son volume pendant le SFX
const HOLD_MS     = 300;  // maintien après le dernier achat
const RAMP_MS     = 550;  // remontée douce
const RAMP_STEPS  = 12;

function clearTimers() {
  clearTimeout(restoreTimer);
  clearInterval(rampTimer);
  restoreTimer = undefined;
  rampTimer = undefined;
}

/** Déclaré par use-ambiance : le player musical actuellement audible + son volume nominal. */
export function setActiveMusic(player: VolumeTarget, base: number) {
  clearTimers();
  if (activePlayer && activePlayer !== player) {
    try { activePlayer.volume = baseVolume; } catch {}
  }
  activePlayer = player;
  baseVolume = base;
}

/** Appelé par use-sounds quand un son d'upgrade démarre : baisse la musique puis la rétablit. */
export function duckMusic() {
  if (!activePlayer) return;
  clearTimers();

  try { activePlayer.volume = Math.min(activePlayer.volume, baseVolume * DUCK_FACTOR); } catch {}

  // Après un court maintien (réinitialisé à chaque achat), on remonte progressivement.
  restoreTimer = setTimeout(() => {
    const from = activePlayer ? activePlayer.volume : baseVolume;
    let step = 0;
    rampTimer = setInterval(() => {
      step++;
      if (!activePlayer) { clearTimers(); return; }
      const t = step / RAMP_STEPS;
      try { activePlayer.volume = from + (baseVolume - from) * t; } catch {}
      if (step >= RAMP_STEPS) {
        try { activePlayer.volume = baseVolume; } catch {}
        clearTimers();
      }
    }, RAMP_MS / RAMP_STEPS);
  }, HOLD_MS);
}
