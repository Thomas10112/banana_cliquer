import React, { useState } from 'react';
import { Dimensions, ImageBackground, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGameContext } from '@/store/game-context';
import {
  HEROES, getHero, statAt, skillAt, RARITY_COLOR, RARITY_STARS, RARITY_LABEL,
  HERO_MAX_LEVEL, SkillType, Skill,
} from '@/store/heroes-config';
import { computeHeroBuffs, getHeroLevelUpCost, HERO_SLOTS } from '@/store/hero-effects';
import { MENACES } from '@/store/menaces-config';
import {
  TRANSPORT_MAX_LEVEL, getTransportCargoMult, getTransportSpeedMult, getTransportUpgradeCost,
} from '@/store/transport-config';
import { PULL_COST_SINGLE, PULL_COST_TEN, PITY_THRESHOLD } from '@/store/gacha';
import { formatBananas } from '@/utils/format-bananas';

const CREW_MIN_AGE = 3;
const TAVERNE_BG = require('@/assets/images/taverne.jpg');
const HERO_H = Dimensions.get('window').height * 0.40;

const SKILL_META: Record<SkillType, { emoji: string; label: string; isCount?: boolean }> = {
  cargo:    { emoji: '📦', label: 'Cargaison' },
  speed:    { emoji: '⚡', label: 'Trajet' },
  double:   { emoji: '✌️', label: 'Double livraison' },
  stock:    { emoji: '🏪', label: 'Stock' },
  bps:      { emoji: '🍌', label: 'BPS' },
  crit:     { emoji: '💥', label: 'Critique' },
  multi:    { emoji: '🗺️', label: 'Multi-zone' },
  offline:  { emoji: '🌙', label: 'Hors-ligne' },
  discount: { emoji: '💰', label: 'Transport' },
  synergy:  { emoji: '🤝', label: 'Synergie' },
};

function formatSkill(skill: Skill, level: number): string {
  const meta = SKILL_META[skill.type];
  const v = skillAt(skill, level);
  if (meta.isCount || skill.type === 'multi') return `${meta.emoji} ${meta.label} +${Math.round(v)}/voyage`;
  const sign = skill.type === 'speed' || skill.type === 'discount' ? '−' : '+';
  return `${meta.emoji} ${meta.label} ${sign}${Math.round(v * 100)}%`;
}

const getMenace = (id: string) => MENACES.find(m => m.id === id);

export default function TaverneScreen() {
  const { state, upgradeTransport, pullGacha, clearPull, devAddTokens, levelUpHero, assignHero, unassignHero } = useGameContext();
  const [selectedHero, setSelectedHero] = useState<string | null>(null);
  const unlocked = state.currentAge >= CREW_MIN_AGE;

  if (!unlocked) {
    return (
      <ImageBackground source={TAVERNE_BG} style={styles.lockedBg} resizeMode="cover">
        <View style={styles.lockedScrim} />
        <SafeAreaView style={styles.lockedWrap} edges={['top']}>
          <Text style={styles.lockedEmoji}>🔒</Text>
          <Text style={styles.lockedTitle}>La Taverne est fermée</Text>
          <Text style={styles.lockedSub}>Fonctionnalité débloquée à l'Ère Moderne.</Text>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  const ownedCount = HEROES.filter(h => (state.heroLevels[h.id] ?? 0) > 0).length;
  const canSingle = state.crewTokens >= PULL_COST_SINGLE;
  const canTen    = state.crewTokens >= PULL_COST_TEN;

  const tLevel     = state.transportLevels[state.currentAge] ?? 0;
  const tMaxed     = tLevel >= TRANSPORT_MAX_LEVEL;
  const tCost      = getTransportUpgradeCost(tLevel);
  const tCanAfford = !tMaxed && state.bananas >= tCost;
  const cargoBonus = Math.round((getTransportCargoMult(tLevel) - 1) * 100);
  const speedBonus = Math.round((1 - getTransportSpeedMult(tLevel)) * 100);
  const cargoNext  = Math.round((getTransportCargoMult(tLevel + 1) - 1) * 100);
  const speedNext  = Math.round((1 - getTransportSpeedMult(tLevel + 1)) * 100);

  // Équipage
  const slots   = Array.from({ length: HERO_SLOTS }, (_, i) => state.heroSlots[i] ?? null);
  const buffs   = computeHeroBuffs(state);
  const owned   = HEROES.filter(h => (state.heroLevels[h.id] ?? 0) > 0);
  const heroDef = selectedHero ? getHero(selectedHero) : undefined;
  const heroLvl = selectedHero ? (state.heroLevels[selectedHero] ?? 0) : 0;

  const assignSelected = () => {
    if (!selectedHero) return;
    const cur = slots.indexOf(selectedHero);
    if (cur >= 0) { unassignHero(cur); return; }     // déjà assigné → on retire
    const free = slots.indexOf(null);
    assignHero(selectedHero, free >= 0 ? free : 0);  // sinon 1er slot libre, ou remplace le 1er
  };

  return (
    <View style={styles.container}>
      {/* Hero zone — fond taverne */}
      <ImageBackground source={TAVERNE_BG} style={[styles.hero, { height: HERO_H }]} resizeMode="cover">
        <View style={styles.heroScrim} />
        <SafeAreaView edges={['top']} style={styles.heroContent}>
          <Text style={styles.heroTitle}>🍺 La Taverne</Text>
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatVal}>🎟️ {formatBananas(state.crewTokens)}</Text>
              <Text style={styles.heroStatLbl}>Jetons</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatVal}>{ownedCount}/{HEROES.length}</Text>
              <Text style={styles.heroStatLbl}>Héros</Text>
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>

      <ScrollView style={styles.panel} contentContainerStyle={styles.content}>
        {/* Transport */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>📦 Transport</Text>
            <Text style={styles.levelPill}>Niv. {tLevel} / {TRANSPORT_MAX_LEVEL}</Text>
          </View>

          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${(tLevel / TRANSPORT_MAX_LEVEL) * 100}%` }]} />
          </View>

          <View style={styles.bonusRow}>
            <View style={styles.bonusBox}>
              <Text style={styles.bonusVal}>+{cargoBonus}%</Text>
              <Text style={styles.bonusLbl}>📦 Cargaison</Text>
            </View>
            <View style={styles.bonusBox}>
              <Text style={styles.bonusVal}>−{speedBonus}%</Text>
              <Text style={styles.bonusLbl}>⚡ Trajet</Text>
            </View>
          </View>

          {tMaxed ? (
            <View style={[styles.upgradeBtn, styles.upgradeBtnMax]}>
              <Text style={styles.upgradeTxt}>Niveau maximum atteint ✓</Text>
            </View>
          ) : (
            <Pressable
              style={[styles.upgradeBtn, !tCanAfford && styles.upgradeBtnDisabled]}
              onPress={() => tCanAfford && upgradeTransport()}
            >
              <Text style={styles.upgradeTxt}>
                {tCanAfford ? 'Améliorer' : '🔒'} {formatBananas(tCost)} 🍌
              </Text>
              <Text style={styles.upgradeNext}>→ +{cargoNext}% cargo · −{speedNext}% trajet</Text>
            </Pressable>
          )}
          <Text style={styles.cardHint}>S'améliore aussi depuis la carte 🗺️</Text>
        </View>

        {/* Gacha — recrutement */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>🎲 Recrutement</Text>
            <Text style={styles.levelPill}>Pitié {state.gachaPity}/{PITY_THRESHOLD}</Text>
          </View>
          <Text style={styles.cardHint}>
            ⭐60% · ⭐⭐30% · ⭐⭐⭐8% · ⭐⭐⭐⭐2%{'\n'}Légendaire garanti au {PITY_THRESHOLD}ᵉ tirage · ⭐⭐+ garanti sur un ×10
          </Text>
          <View style={styles.pullRow}>
            <Pressable style={[styles.pullBtn, !canSingle && styles.upgradeBtnDisabled]} onPress={() => canSingle && pullGacha(1)}>
              <Text style={styles.pullTitle}>Tirage ×1</Text>
              <Text style={styles.pullCost}>🎟️ {PULL_COST_SINGLE}</Text>
            </Pressable>
            <Pressable style={[styles.pullBtn, styles.pullBtn10, !canTen && styles.upgradeBtnDisabled]} onPress={() => canTen && pullGacha(10)}>
              <Text style={styles.pullTitle}>Tirage ×10</Text>
              <Text style={styles.pullCost}>🎟️ {PULL_COST_TEN}</Text>
            </Pressable>
          </View>
          <Pressable style={styles.devBtn} onPress={() => devAddTokens(1000)}>
            <Text style={styles.devBtnTxt}>🛠 DEV +1000 🎟️</Text>
          </Pressable>
        </View>

        {/* Équipage — slots + collection */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>🎖️ Équipage</Text>
            <Text style={styles.levelPill}>⚔️ {buffs.atk} · 🛡️ {buffs.def}</Text>
          </View>

          <View style={styles.slotsRow}>
            {slots.map((heroId, i) => {
              const hero = heroId ? getHero(heroId) : undefined;
              return (
                <Pressable
                  key={i}
                  style={[styles.slot, hero && { borderColor: RARITY_COLOR[hero.rarity] }]}
                  onPress={() => (hero ? unassignHero(i) : undefined)}
                >
                  {hero ? (
                    <>
                      <Text style={styles.slotEmoji}>{hero.emoji}</Text>
                      <Text style={styles.slotName} numberOfLines={1}>{hero.name.split(' ')[0]}</Text>
                      <Text style={styles.slotLvl}>Niv. {state.heroLevels[heroId!] ?? 0}</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.slotPlus}>＋</Text>
                      <Text style={styles.slotEmpty}>Libre</Text>
                    </>
                  )}
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.cardHint}>Touche un slot occupé pour libérer · touche un héros pour l'assigner</Text>

          {owned.length === 0 ? (
            <Text style={styles.emptyTxt}>Aucun héros recruté. Tente ta chance au recrutement 🎲</Text>
          ) : (
            <View style={styles.heroGrid}>
              {HEROES.map(h => {
                const lvl       = state.heroLevels[h.id] ?? 0;
                const isOwned   = lvl > 0;
                const assigned  = slots.includes(h.id);
                return (
                  <Pressable
                    key={h.id}
                    disabled={!isOwned}
                    style={[
                      styles.heroCell,
                      isOwned ? { borderColor: RARITY_COLOR[h.rarity] } : styles.heroCellLocked,
                      assigned && styles.heroCellAssigned,
                    ]}
                    onPress={() => setSelectedHero(h.id)}
                  >
                    <Text style={[styles.heroCellEmoji, !isOwned && styles.heroCellEmojiLocked]}>
                      {isOwned ? h.emoji : '❔'}
                    </Text>
                    <Text style={styles.heroCellStars}>{RARITY_STARS[h.rarity]}</Text>
                    {isOwned
                      ? <Text style={styles.heroCellLvl}>Niv. {lvl}</Text>
                      : <Text style={styles.heroCellLockedTxt}>?</Text>}
                    {assigned && <Text style={styles.heroCellBadge}>assigné</Text>}
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Raids — journal */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⚔️ Raids de convoi</Text>
          <Text style={styles.cardHint}>
            ~25% des voyages déclenchent une embuscade. L'⚔️ ATK rafle plus, la 🛡️ DEF protège la cargaison.
          </Text>
          {state.raidLog.length === 0 ? (
            <Text style={styles.emptyTxt}>Aucune embuscade pour l'instant. Assigne un héros pour défendre tes convois.</Text>
          ) : (
            <View style={styles.raidList}>
              {state.raidLog.slice(0, 8).map(r => {
                const m = getMenace(r.menaceId);
                return (
                  <View key={r.id} style={styles.raidRow}>
                    <Text style={styles.raidEmoji}>{m?.emoji ?? '⚔️'}</Text>
                    <Text style={styles.raidName} numberOfLines={1}>{m?.name ?? 'Embuscade'}</Text>
                    <Text style={[styles.raidResult, r.won ? styles.raidWon : styles.raidLost]}>
                      {r.won ? `🏆 +${formatBananas(r.delta)}` : `💥 ${formatBananas(r.delta)}`} 🍌
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modale de révélation du tirage */}
      <Modal visible={state.lastPull !== null} transparent animationType="fade" statusBarTranslucent>
        <Pressable style={pull.overlay} onPress={clearPull}>
          <View style={pull.card}>
            <Text style={pull.title}>🎲 Recrutement</Text>
            <ScrollView contentContainerStyle={pull.grid}>
              {state.lastPull?.map((r, i) => {
                const hero = getHero(r.heroId);
                return (
                  <View key={i} style={[pull.heroCard, { borderColor: RARITY_COLOR[r.rarity] }]}>
                    <Text style={pull.heroEmoji}>{hero?.emoji}</Text>
                    <Text style={pull.heroName} numberOfLines={1}>{hero?.name}</Text>
                    <Text style={[pull.heroStars, { color: RARITY_COLOR[r.rarity] }]}>{RARITY_STARS[r.rarity]}</Text>
                    <Text style={[pull.heroTag, r.isNew ? pull.tagNew : pull.tagDup]}>
                      {r.isNew ? 'NOUVEAU' : '+1 frag'}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
            <Pressable style={pull.closeBtn} onPress={clearPull}>
              <Text style={pull.closeTxt}>Continuer</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Modale détail héros — stats, level-up, assignation */}
      <Modal visible={heroDef !== undefined} transparent animationType="fade" statusBarTranslucent>
        <Pressable style={pull.overlay} onPress={() => setSelectedHero(null)}>
          {heroDef && (() => {
            const cur       = heroLvl;
            const isMax     = cur >= HERO_MAX_LEVEL;
            const cost      = getHeroLevelUpCost(heroDef.rarity, cur);
            const canLevel  = !isMax && state.bananas >= cost;
            const assigned  = slots.includes(heroDef.id);
            const next      = Math.min(HERO_MAX_LEVEL, cur + 1);
            return (
              <Pressable style={[hero.card, { borderColor: RARITY_COLOR[heroDef.rarity] }]} onPress={() => {}}>
                <Text style={hero.emoji}>{heroDef.emoji}</Text>
                <Text style={hero.name}>{heroDef.name}</Text>
                <Text style={[hero.rarity, { color: RARITY_COLOR[heroDef.rarity] }]}>
                  {RARITY_STARS[heroDef.rarity]} {RARITY_LABEL[heroDef.rarity]} · Niv. {cur}/{HERO_MAX_LEVEL}
                </Text>
                <Text style={hero.lore}>{heroDef.lore}</Text>

                <View style={hero.statsRow}>
                  <View style={hero.statBox}><Text style={hero.statVal}>⚔️ {statAt(heroDef.atk, cur)}</Text><Text style={hero.statLbl}>ATK</Text></View>
                  <View style={hero.statBox}><Text style={hero.statVal}>🛡️ {statAt(heroDef.def, cur)}</Text><Text style={hero.statLbl}>DEF</Text></View>
                </View>

                <View style={hero.skillBox}>
                  <Text style={hero.skillTxt}>{formatSkill(heroDef.skill, cur)}</Text>
                  {heroDef.passive && <Text style={hero.skillTxt}>{formatSkill(heroDef.passive, cur)}</Text>}
                  {heroDef.ultimate && <Text style={hero.ultTxt}>✨ {heroDef.ultimate}</Text>}
                </View>

                {isMax ? (
                  <View style={[hero.btn, hero.btnMax]}><Text style={hero.btnTxt}>Niveau maximum ✓</Text></View>
                ) : (
                  <Pressable
                    style={[hero.btn, !canLevel && hero.btnDisabled]}
                    onPress={() => canLevel && levelUpHero(heroDef.id)}
                  >
                    <Text style={hero.btnTxt}>⬆️ Niv. {next} — {formatBananas(cost)} 🍌</Text>
                  </Pressable>
                )}

                <Pressable style={[hero.btn, assigned ? hero.btnUnassign : hero.btnAssign]} onPress={assignSelected}>
                  <Text style={hero.btnTxt}>{assigned ? '✕ Retirer de l\'équipage' : '🎖️ Assigner à l\'équipage'}</Text>
                </Pressable>

                <Pressable style={hero.close} onPress={() => setSelectedHero(null)}>
                  <Text style={hero.closeTxt}>Fermer</Text>
                </Pressable>
              </Pressable>
            );
          })()}
        </Pressable>
      </Modal>
    </View>
  );
}

const pull = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: {
    backgroundColor: '#1a1a2e', borderRadius: 24, padding: 20, width: '100%', maxHeight: '80%', gap: 14,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)',
  },
  title: { fontSize: 22, fontWeight: '900', color: '#fff', textAlign: 'center' },
  grid:  { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  heroCard: {
    width: '30%', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 8,
    alignItems: 'center', gap: 2, borderWidth: 1.5,
  },
  heroEmoji: { fontSize: 30 },
  heroName:  { fontSize: 10, fontWeight: '700', color: '#fff', textAlign: 'center' },
  heroStars: { fontSize: 9 },
  heroTag:   { fontSize: 8, fontWeight: '800', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, overflow: 'hidden' },
  tagNew:    { backgroundColor: 'rgba(139,195,74,0.25)', color: '#aed581' },
  tagDup:    { backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' },
  closeBtn:  { backgroundColor: '#f9a825', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  closeTxt:  { fontSize: 16, fontWeight: '800', color: '#fff' },
});

const hero = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a2e', borderRadius: 24, padding: 20, width: '100%', maxWidth: 420, gap: 8,
    borderWidth: 2, alignItems: 'center',
  },
  emoji:  { fontSize: 52 },
  name:   { fontSize: 20, fontWeight: '900', color: '#fff', textAlign: 'center' },
  rarity: { fontSize: 13, fontWeight: '800' },
  lore:   { fontSize: 12, color: 'rgba(255,255,255,0.55)', textAlign: 'center', fontStyle: 'italic', marginBottom: 4 },
  statsRow: { flexDirection: 'row', gap: 12, width: '100%' },
  statBox:  { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 10, alignItems: 'center', gap: 2 },
  statVal:  { fontSize: 17, fontWeight: '900', color: '#fff' },
  statLbl:  { fontSize: 10, color: 'rgba(255,255,255,0.5)' },
  skillBox: { width: '100%', backgroundColor: 'rgba(255,215,0,0.08)', borderRadius: 12, padding: 12, gap: 4 },
  skillTxt: { fontSize: 13, fontWeight: '700', color: '#ffd54f' },
  ultTxt:   { fontSize: 12, fontWeight: '700', color: '#ce93d8' },
  btn:        { width: '100%', backgroundColor: '#f9a825', borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  btnDisabled:{ backgroundColor: 'rgba(255,255,255,0.08)' },
  btnMax:     { backgroundColor: 'rgba(139,195,74,0.18)' },
  btnAssign:  { backgroundColor: '#5e35b1' },
  btnUnassign:{ backgroundColor: 'rgba(255,255,255,0.1)' },
  btnTxt:     { fontSize: 14, fontWeight: '800', color: '#fff' },
  close:    { paddingVertical: 8, marginTop: 2 },
  closeTxt: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.45)' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },

  // Hero zone
  hero:        { width: '100%' },
  heroScrim:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  heroContent: { flex: 1, justifyContent: 'space-between', padding: 16 },
  heroTitle:   { fontSize: 26, fontWeight: '900', color: '#fff', textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 6 },
  heroStatsRow:{ flexDirection: 'row', gap: 10 },
  heroStat: {
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 8,
    alignItems: 'center', gap: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  heroStatVal: { fontSize: 16, fontWeight: '800', color: '#ffd700' },
  heroStatLbl: { fontSize: 11, color: 'rgba(255,255,255,0.6)' },

  // Panel
  panel:   { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 16, gap: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  cardHint:  { fontSize: 12, color: 'rgba(255,255,255,0.45)' },
  soon:      { opacity: 0.6 },

  levelPill: {
    fontSize: 12, fontWeight: '800', color: '#ffd700',
    backgroundColor: 'rgba(255,215,0,0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  progressBg:   { height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#f9a825', borderRadius: 4 },
  bonusRow:  { flexDirection: 'row', gap: 12 },
  bonusBox:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 12, padding: 12, alignItems: 'center', gap: 2 },
  bonusVal:  { fontSize: 18, fontWeight: '900', color: '#8bc34a' },
  bonusLbl:  { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  upgradeBtn: {
    backgroundColor: '#f9a825', borderRadius: 12, paddingVertical: 12, alignItems: 'center', gap: 2, marginTop: 2,
  },
  upgradeBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.08)' },
  upgradeBtnMax:      { backgroundColor: 'rgba(139,195,74,0.18)' },
  upgradeTxt:  { fontSize: 15, fontWeight: '800', color: '#fff' },
  upgradeNext: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },

  // Gacha
  pullRow: { flexDirection: 'row', gap: 12 },
  pullBtn: {
    flex: 1, backgroundColor: '#5e35b1', borderRadius: 12, paddingVertical: 12, alignItems: 'center', gap: 2,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  pullBtn10:  { backgroundColor: '#7b1fa2' },
  pullTitle:  { fontSize: 15, fontWeight: '800', color: '#fff' },
  pullCost:   { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  devBtn:     { alignSelf: 'center', paddingVertical: 6, paddingHorizontal: 14, marginTop: 2 },
  devBtnTxt:  { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.35)' },

  // Équipage — slots
  slotsRow: { flexDirection: 'row', gap: 10 },
  slot: {
    flex: 1, aspectRatio: 0.85, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', gap: 2, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)',
  },
  slotEmoji: { fontSize: 30 },
  slotName:  { fontSize: 11, fontWeight: '700', color: '#fff' },
  slotLvl:   { fontSize: 10, color: '#ffd54f', fontWeight: '700' },
  slotPlus:  { fontSize: 28, color: 'rgba(255,255,255,0.25)', fontWeight: '300' },
  slotEmpty: { fontSize: 10, color: 'rgba(255,255,255,0.35)' },

  // Équipage — collection
  emptyTxt: { fontSize: 12, color: 'rgba(255,255,255,0.45)', textAlign: 'center', paddingVertical: 12, fontStyle: 'italic' },
  heroGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  heroCell: {
    width: '22%', aspectRatio: 0.78, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', gap: 1, borderWidth: 1.5, paddingVertical: 4,
  },
  heroCellLocked:   { borderColor: 'rgba(255,255,255,0.08)', opacity: 0.5 },
  heroCellAssigned: { backgroundColor: 'rgba(94,53,177,0.3)' },
  heroCellEmoji:       { fontSize: 24 },
  heroCellEmojiLocked: { opacity: 0.6 },
  heroCellStars:       { fontSize: 7 },
  heroCellLvl:         { fontSize: 9, color: '#ffd54f', fontWeight: '700' },
  heroCellLockedTxt:   { fontSize: 9, color: 'rgba(255,255,255,0.4)' },
  heroCellBadge:       { fontSize: 7, fontWeight: '800', color: '#b39ddb' },

  // Raids — journal
  raidList: { gap: 6, marginTop: 4 },
  raidRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: 8 },
  raidEmoji:  { fontSize: 18 },
  raidName:   { flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  raidResult: { fontSize: 12, fontWeight: '800' },
  raidWon:    { color: '#8bc34a' },
  raidLost:   { color: '#ef5350' },

  // Locked
  lockedBg:    { flex: 1 },
  lockedScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  lockedWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  lockedEmoji: { fontSize: 64 },
  lockedTitle: { fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center' },
  lockedSub:   { fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
});
