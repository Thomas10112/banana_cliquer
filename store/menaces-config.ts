// Système Taverne — menaces rencontrées lors des raids de convoi (phase 5).
// Chaque voyage peut déclencher une embuscade ; le héros assigné la résout
// automatiquement via son ATK (offensif) et sa DEF (défensif).

export interface MenaceConfig {
  id: string;
  name: string;
  emoji: string;
  minAge: number;     // ère d'apparition
  basePower: number;  // puissance de base (comparée à l'ATK du héros)
  lootBonus: number;  // +% de bananes raflées si victoire
  lossPct: number;    // % de cargaison perdue si défaite (réduit par la DEF)
}

export const MENACES: MenaceConfig[] = [
  // ── Âge 3 — ✈️ Avion cargo ────────────────────────────────────────────────
  { id: 'chasseurs',   name: 'Chasseurs rivaux',   emoji: '🛩️', minAge: 3, basePower: 80,  lootBonus: 0.20, lossPct: 0.15 },
  { id: 'tempete',     name: 'Tempête magnétique', emoji: '🌩️', minAge: 3, basePower: 130, lootBonus: 0.00, lossPct: 0.25 },
  { id: 'drones',      name: 'Drones pirates',     emoji: '🤖', minAge: 3, basePower: 200, lootBonus: 0.35, lossPct: 0.30 },

  // ── Âge 4 — 🛸 Vaisseau logistique ────────────────────────────────────────
  { id: 'pirates',     name: 'Pirates de l\'espace', emoji: '🏴‍☠️', minAge: 4, basePower: 400, lootBonus: 0.40, lossPct: 0.30 },
  { id: 'asteroides',  name: 'Champ d\'astéroïdes',  emoji: '☄️',  minAge: 4, basePower: 320, lootBonus: 0.10, lossPct: 0.35 },
  { id: 'ia_rebelle',  name: 'IA rebelle',           emoji: '👁️', minAge: 4, basePower: 650, lootBonus: 0.60, lossPct: 0.50 },
];
