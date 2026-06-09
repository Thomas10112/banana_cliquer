// Système Taverne — amélioration du transport courant (piste 0→20, payée en bananes).
// Améliore le commerce : cargaison (bananes livrées/voyage) et vitesse (durée trajet).

export const TRANSPORT_MAX_LEVEL = 20;

/** Multiplicateur de cargaison : +7.5 %/niveau → +150 % (×2.5) au niveau 20. */
export function getTransportCargoMult(level: number): number {
  return 1 + 0.075 * Math.max(0, Math.min(TRANSPORT_MAX_LEVEL, level));
}

/** Multiplicateur de durée de trajet : −1.5 %/niveau → −30 % (×0.70) au niveau 20. */
export function getTransportSpeedMult(level: number): number {
  return 1 - 0.015 * Math.max(0, Math.min(TRANSPORT_MAX_LEVEL, level));
}

/** Coût bananes pour passer de `level` à `level+1`. */
export function getTransportUpgradeCost(level: number): number {
  if (level >= TRANSPORT_MAX_LEVEL) return Infinity;
  return Math.floor(2_000_000 * Math.pow(1.9, level));
}
