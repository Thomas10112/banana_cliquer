#!/usr/bin/env node
// Simulateur d'économie Banana Punch — un « bot » joue la partie en accéléré
// avec les vraies formules du jeu et sort un audit d'équilibrage.
//
//   node scripts/simulate-economy.mjs
//
// Modèle : clics réguliers + achats gloutons (meilleur retour sur investissement),
// migrations dès que possible. Ignoré : météo, accélérateur, combo, livraisons
// baleines (marginaux) → les durées réelles seront un peu plus courtes.

// ── Données du jeu (copie de store/*.ts, sans les require() d'images) ────────
const UPGRADES = [
  { id: 'monkey',          age: 0, baseCost: 10,         baseBps: 0.1,       max: 100, unlockedBy: null },
  { id: 'guerrier_massai', age: 0, baseCost: 50,         baseBps: 0.5,       max: 100, unlockedBy: ['monkey', 10] },
  { id: 'bananier',        age: 0, baseCost: 250,        baseBps: 2,         max: 50,  unlockedBy: ['guerrier_massai', 5] },
  { id: 'girafe',          age: 0, baseCost: 1000,       baseBps: 7,         max: 25,  unlockedBy: ['bananier', 3] },
  { id: 'paysan',          age: 1, baseCost: 250,        baseBps: 8,         max: 100, unlockedBy: null },
  { id: 'charrue',         age: 1, baseCost: 900,        baseBps: 25,        max: 75,  unlockedBy: ['paysan', 10] },
  { id: 'moulin',          age: 1, baseCost: 3000,       baseBps: 80,        max: 50,  unlockedBy: ['charrue', 5] },
  { id: 'marche',          age: 1, baseCost: 10000,      baseBps: 250,       max: 25,  unlockedBy: ['moulin', 3] },
  { id: 'ouvrier',         age: 2, baseCost: 15000,      baseBps: 600,       max: 100, unlockedBy: null },
  { id: 'machine_vapeur',  age: 2, baseCost: 60000,      baseBps: 2000,      max: 75,  unlockedBy: ['ouvrier', 10] },
  { id: 'usine',           age: 2, baseCost: 250000,     baseBps: 7000,      max: 50,  unlockedBy: ['machine_vapeur', 5] },
  { id: 'locomotive',      age: 2, baseCost: 1000000,    baseBps: 25000,     max: 25,  unlockedBy: ['usine', 3] },
  { id: 'ingenieur',       age: 3, baseCost: 2000000,     baseBps: 60000,     max: 100, unlockedBy: null },
  { id: 'ordinateur',      age: 3, baseCost: 9000000,     baseBps: 200000,    max: 75,  unlockedBy: ['ingenieur', 10] },
  { id: 'drone',           age: 3, baseCost: 35000000,    baseBps: 700000,    max: 50,  unlockedBy: ['ordinateur', 5] },
  { id: 'satellite',       age: 3, baseCost: 140000000,   baseBps: 2500000,   max: 25,  unlockedBy: ['drone', 3] },
  { id: 'robot',           age: 4, baseCost: 1600000000,  baseBps: 8000000,   max: 100, unlockedBy: null },
  { id: 'ia',              age: 4, baseCost: 6000000000,  baseBps: 30000000,  max: 75,  unlockedBy: ['robot', 10] },
  { id: 'megastructure',   age: 4, baseCost: 30000000000, baseBps: 150000000, max: 50,  unlockedBy: ['ia', 5] },
];

const ZONES = [
  { id: 'afrique',   age: 0, cost: 50,    click: 0.5 }, { id: 'amazonie',  age: 0, cost: 200,   mult: 0.10 },
  { id: 'europe',    age: 0, cost: 500,   mult: 0.15 }, { id: 'asie',      age: 0, cost: 1000,  click: 0.5 },
  { id: 'australie', age: 0, cost: 1500,  mult: 0.20 }, { id: 'mammouth',  age: 0, cost: 2500,  click: 1 },
  { id: 'nil',       age: 1, cost: 500,   mult: 0.10 }, { id: 'flandre',   age: 1, cost: 1500,  mult: 0.15 },
  { id: 'andine',    age: 1, cost: 3000,  click: 5 },   { id: 'orient',    age: 1, cost: 7000,  mult: 0.20 },
  { id: 'pacifique', age: 1, cost: 15000, click: 8 },   { id: 'epices',    age: 1, cost: 30000, mult: 0.25 },
  { id: 'angleterre',   age: 2, cost: 50000,   click: 20 },  { id: 'ruhr',     age: 2, cost: 150000,  mult: 0.15 },
  { id: 'pennsylvanie', age: 2, cost: 400000,  click: 50 },  { id: 'detroit',  age: 2, cost: 1000000, mult: 0.20 },
  { id: 'siberien',     age: 2, cost: 3000000, mult: 0.25 }, { id: 'bombay',   age: 2, cost: 8000000, click: 100 },
  { id: 'silicon_valley', age: 3, cost: 20e6,  click: 200 }, { id: 'geneve',   age: 3, cost: 60e6,  mult: 0.30 },
  { id: 'seoul',          age: 3, cost: 150e6, click: 300 }, { id: 'bangalore',age: 3, cost: 400e6, mult: 0.35 },
  { id: 'houston',        age: 3, cost: 1.2e9, mult: 0.40 }, { id: 'tokyo',    age: 3, cost: 4e9,   click: 500 },
];

// Migrations : [bananes cumulées, quête = (upgrade, n possédés), zones max requises ?]
const MIGRATIONS = [
  [ // âge 0
    { bananas: 1500,   quest: ['bananier', 3],   allZonesMaxed: false },
    { bananas: 4000,   quest: ['girafe', 1],     allZonesMaxed: false },
    { bananas: 8000,   quest: ['girafe', 1],     allZonesMaxed: true },
  ],
  [ // âge 1
    { bananas: 20000,  quest: ['charrue', 5],    allZonesMaxed: false },
    { bananas: 60000,  quest: ['marche', 1],     allZonesMaxed: false },
    { bananas: 120000, quest: ['marche', 1],     allZonesMaxed: true },
  ],
  [ // âge 2
    { bananas: 500000,  quest: ['machine_vapeur', 5], allZonesMaxed: false },
    { bananas: 1500000, quest: ['locomotive', 1],     allZonesMaxed: false },
    { bananas: 3000000, quest: ['locomotive', 1],     allZonesMaxed: true },
  ],
  [ // âge 3
    { bananas: 10e6, quest: ['ordinateur', 5], allZonesMaxed: false },
    { bananas: 30e6, quest: ['satellite', 1],  allZonesMaxed: false },
    { bananas: 70e6, quest: ['satellite', 1],  allZonesMaxed: true },
  ],
];

const AGE_NAMES = ['🌿 Sauvage', '🌾 Agricole', '🏭 Industrielle', '🚁 Moderne', '🤖 Robotique'];
const upgradeCost = (u, n) => Math.floor(u.baseCost * Math.pow(1.15, n));
const zoneUpCost  = (z, lvl) => Math.floor(z.cost * [0, 3, 8][lvl]); // 1→2 ×3, 2→3 ×8
const WHALE_COST = 300;
const MAX_TIME = 400 * 3600; // garde-fou : 400 h simulées

// ── Simulation ───────────────────────────────────────────────────────────────
function simulate(cps) {
  const s = {
    t: 0, bananas: 0, earned: 0,           // earned = totalBananas (cumul depuis la migration)
    age: 0, migrations: 0,
    counts: {}, zoneLevels: {}, whales: 0,
    heritageBpc: 0, heritageBps: 0,
  };
  const events = [];           // migrations + jalons
  let lastBuyAt = 0, worstWait = { age: 0, dur: 0, at: 0 };

  const zoneMult  = () => ZONES.filter(z => (s.zoneLevels[z.id] ?? 0) >= 1 && z.mult)
                               .reduce((m, z) => m + z.mult, 1);
  const zoneClick = () => ZONES.filter(z => (s.zoneLevels[z.id] ?? 0) >= 1 && z.click)
                               .reduce((c, z) => c + z.click, 0);
  const bps = () => UPGRADES.reduce((t, u) => t + u.baseBps * (s.counts[u.id] ?? 0), 0)
                    * zoneMult() + s.heritageBps;
  const bpc = () => 1 + s.heritageBpc + zoneClick();

  while (s.t < MAX_TIME) {
    s.t += 1;
    const gain = bps() + cps * bpc();
    s.bananas += gain; s.earned += gain;

    // Achats gloutons : meilleur retour sur investissement parmi les achats possibles
    let bought = true;
    while (bought) {
      bought = false;
      const cands = [];
      if (s.whales < 1 && s.age < 4) cands.push({ cost: WHALE_COST, pay: 0, buy: () => { s.whales += 1; } });
      for (const u of UPGRADES) {
        if (u.age !== s.age) continue;
        const n = s.counts[u.id] ?? 0;
        if (n >= u.max) continue;
        if (u.unlockedBy && (s.counts[u.unlockedBy[0]] ?? 0) < u.unlockedBy[1]) continue;
        const cost = upgradeCost(u, n);
        cands.push({ cost, pay: cost / (u.baseBps * zoneMult()),
                     buy: () => { s.counts[u.id] = n + 1; } });
      }
      for (const z of ZONES) {
        if (z.age !== s.age) continue;
        const lvl = s.zoneLevels[z.id] ?? 0;
        const needMax = MIGRATIONS[s.age]?.[s.migrations % 3]?.allZonesMaxed;
        if (lvl === 0) {
          const value = z.mult ? z.mult * bps() / zoneMult() * zoneMult() : z.click * cps;
          cands.push({ cost: z.cost, pay: value > 0 ? z.cost / value : 1e9,
                       buy: () => { s.zoneLevels[z.id] = 1; } });
        } else if (lvl < 3 && needMax) {
          // requis pour la 3e migration : pas de gain direct → payback pénalisé mais achetable
          cands.push({ cost: zoneUpCost(z, lvl), pay: 5e5,
                       buy: () => { s.zoneLevels[z.id] = lvl + 1; } });
        }
      }
      cands.sort((a, b) => a.pay - b.pay);
      for (const c of cands) {
        if (c.cost <= s.bananas) {
          s.bananas -= c.cost; c.buy(); bought = true;
          const wait = s.t - lastBuyAt;
          if (wait > worstWait.dur) worstWait = { age: s.age, dur: wait, at: s.t };
          lastBuyAt = s.t;
          break;
        }
      }
    }

    // Migration dès que possible
    const mig = MIGRATIONS[s.age]?.[s.migrations % 3];
    if (mig) {
      const questOk = (s.counts[mig.quest[0]] ?? 0) >= mig.quest[1];
      const zonesOk = !mig.allZonesMaxed ||
        ZONES.filter(z => z.age === s.age).every(z => (s.zoneLevels[z.id] ?? 0) === 3);
      if (questOk && zonesOk && s.whales >= 1 && s.earned >= mig.bananas) {
        s.heritageBps += Math.floor(bps() * 0.10);
        s.heritageBpc += 1;
        s.migrations  += 1;
        events.push({ t: s.t, label: `Migration ${((s.migrations - 1) % 3) + 1}/3 — ${AGE_NAMES[s.age]}`,
                      bps: bps(), age: s.age });
        if (s.migrations % 3 === 0) s.age += 1;
        s.bananas = 0; s.earned = 0; s.counts = {}; s.zoneLevels = {}; s.whales = 0;
        lastBuyAt = s.t;
      }
    }

    // Fin de partie : 1 Mégastructure
    if ((s.counts.megastructure ?? 0) >= 1) {
      events.push({ t: s.t, label: '🏁 Première Mégastructure (fin de contenu)', bps: bps(), age: 4 });
      break;
    }
  }
  return { events, worstWait, timedOut: s.t >= MAX_TIME, endT: s.t };
}

// ── Rapport ──────────────────────────────────────────────────────────────────
const fmtT = (sec) => {
  const h = Math.floor(sec / 3600), m = Math.round((sec % 3600) / 60);
  return h > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${m} min`;
};
const fmtN = (n) => n >= 1e9 ? `${(n / 1e9).toFixed(1)}Md` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M`
              : n >= 1e3 ? `${(n / 1e3).toFixed(1)}k` : `${Math.round(n * 10) / 10}`;

console.log('🍌 SIMULATEUR D\'ÉCONOMIE — BANANA PUNCH');
console.log('═'.repeat(64));

for (const [profile, cps] of [['Joueur actif (3 clics/s)', 3], ['Joueur posé (1 clic/s)', 1]]) {
  const { events, worstWait, timedOut, endT } = simulate(cps);
  console.log(`\n▶ ${profile}`);
  console.log('─'.repeat(64));
  let prev = 0;
  for (const e of events) {
    console.log(`  ${fmtT(e.t).padStart(7)}  (+${fmtT(e.t - prev).padEnd(7)})  ${e.label}  [BPS ${fmtN(e.bps)}]`);
    prev = e.t;
  }
  if (timedOut) console.log(`  ⚠️  SIMULATION COUPÉE à ${fmtT(endT)} — progression bloquée !`);

  // Temps par âge (barres)
  const perAge = new Map();
  let last = 0;
  for (const e of events) { perAge.set(e.age, (perAge.get(e.age) ?? 0) + (e.t - last)); last = e.t; }
  if (timedOut) perAge.set(events.length ? events[events.length - 1].age + (events[events.length - 1].label.startsWith('Migration 3') ? 1 : 0) : 0,
                           (perAge.get(4) ?? 0) + (endT - last));
  const maxDur = Math.max(...perAge.values());
  console.log('\n  Temps passé par âge :');
  for (const [age, dur] of [...perAge.entries()].sort((a, b) => a[0] - b[0])) {
    const bar = '█'.repeat(Math.max(1, Math.round((dur / maxDur) * 36)));
    console.log(`  ${AGE_NAMES[age].padEnd(16)} ${bar} ${fmtT(dur)}`);
  }
  console.log(`\n  Plus longue attente sans rien pouvoir acheter : ${fmtT(worstWait.dur)} (${AGE_NAMES[worstWait.age]})`);
}

// ── Audit statique : retour sur investissement de chaque upgrade ─────────────
console.log('\n' + '═'.repeat(64));
console.log('🔬 AUDIT — retour sur investissement (coût ÷ BPS, 1er achat)');
console.log('─'.repeat(64));
let prevAge = -1;
for (const u of UPGRADES) {
  if (u.age !== prevAge) { console.log(`  ${AGE_NAMES[u.age]}`); prevAge = u.age; }
  const payback = u.baseCost / u.baseBps;
  const flag = payback < 10 ? '  🚨 TROP RENTABLE' : payback > 200 ? '  🐌 trop lent' : '';
  console.log(`    ${u.id.padEnd(16)} ${fmtN(u.baseCost).padStart(7)} 🍌 → ${fmtN(u.baseBps).padStart(7)} bps  = ${String(Math.round(payback)).padStart(4)}s${flag}`);
}
