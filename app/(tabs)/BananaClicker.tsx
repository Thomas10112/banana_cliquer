import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { ImageSourcePropType, useWindowDimensions } from 'react-native';
import { Dimensions, ImageBackground, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useGameContext } from '@/store/game-context';
import { formatBananas, formatRate } from '@/utils/format-bananas';
import { ScrollView } from 'react-native';
import { QUESTS } from '@/store/quests-config';
import { SIDE_QUESTS } from '@/store/side-quests-config';
import { UPGRADES } from '@/store/upgrades-config';
import { AGES } from '@/store/ages-config';
import { ZONES } from '@/store/zones-config';
import { ACHIEVEMENTS } from '@/store/achievements-config';
import { BOOSTER_DURATION } from '@/store/game-reducer';
import { BananaButton, BananaButtonHandle } from '@/components/banana-clicker/banana-button';
import { StatsBar } from '@/components/banana-clicker/stats-bar';
import { UpgradesPanel } from '@/components/banana-clicker/upgrades-panel';
import { QuestsPanel } from '@/components/banana-clicker/quests-panel';
import { BananaParticles } from '@/components/banana-clicker/banana-particles';
import { GoldenBanana } from '@/components/banana-clicker/golden-banana';
import { AchievementNotification } from '@/components/banana-clicker/achievement-notification';
import { QuestNotification } from '@/components/banana-clicker/quest-notification';
import { WeatherOverlay } from '@/components/banana-clicker/weather-overlay';
import { EndGameCelebration } from '@/components/banana-clicker/end-game-celebration';
import { SettingsModal } from '@/components/settings-modal';
import { useSounds } from '@/hooks/use-sounds';
import { useProfile } from '@/hooks/use-profile';
import { useAgeTheme } from '@/hooks/use-age-theme';
import { registerTutorialRef, fireTutorialEvent, isBananaLocked } from '@/utils/tutorial-refs';

type Panel = 'upgrades' | 'quests';
type BreakdownMode = 'bpc' | 'bps';

// ─── Breakdown modal ──────────────────────────────────────────────────────────

interface BreakdownLine {
  label: string;
  value: string;
  highlight?: boolean;
  separator?: boolean;
}

function BreakdownModal({ mode, state, bps, bpc, comboMultiplier, weatherMultiplier, weatherEmoji, isBoosterActive, onClose }: {
  mode: BreakdownMode;
  state: ReturnType<typeof import('@/store/use-game').useGame>['state'];
  bps: number; bpc: number;
  comboMultiplier: number;
  weatherMultiplier: number;
  weatherEmoji: string;
  isBoosterActive: boolean;
  onClose: () => void;
}) {
  const lines: BreakdownLine[] = [];

  if (mode === 'bpc') {
    const zoneClick = ZONES
      .filter(z => (state.zoneLevels[z.id] ?? 0) >= 1 && z.bonus.clickBonus)
      .reduce((sum, z) => sum + (z.bonus.clickBonus ?? 0), 0);
    const base = state.bananasPerClick + (state.heritageBpc ?? 0) + zoneClick;

    lines.push({ label: '⚡ Base', value: `${formatRate(state.bananasPerClick)} / clic` });
    if ((state.heritageBpc ?? 0) > 0)
      lines.push({ label: '🧬 Héritage migrations', value: `+${state.heritageBpc} / clic` });
    ZONES.filter(z => (state.zoneLevels[z.id] ?? 0) >= 1 && z.bonus.clickBonus).forEach(z => {
      lines.push({ label: `🌍 ${z.id}`, value: `+${formatRate(z.bonus.clickBonus!)} / clic` });
    });
    lines.push({ label: 'Sous-total', value: `${formatRate(base)} / clic`, separator: true });
    if (state.comboUnlocked && comboMultiplier > 1)
      lines.push({ label: `🔥 Combo actuel`, value: `×${comboMultiplier}` });
    lines.push({ label: '✅ Total effectif', value: `${formatRate(base * comboMultiplier)} / clic`, highlight: true });

  } else {
    const baseMult = ZONES
      .filter(z => (state.zoneLevels[z.id] ?? 0) >= 1 && z.bonus.bpsMultiplier)
      .reduce((m, z) => m + (z.bonus.bpsMultiplier ?? 0), 1);

    let upgradeBase = 0;
    UPGRADES.filter(u => (u.minAge ?? 0) === state.currentAge).forEach(u => {
      const count = state.upgrades[u.id] ?? 0;
      if (count === 0) return;
      const contrib = u.baseBps * count;
      upgradeBase += contrib;
      lines.push({ label: `${u.name} ×${count}`, value: `${formatRate(contrib)} / sec` });
    });

    lines.push({ label: 'Sous-total upgrades', value: `${formatRate(upgradeBase)} / sec`, separator: true });

    ZONES.filter(z => (state.zoneLevels[z.id] ?? 0) >= 1 && z.bonus.bpsMultiplier).forEach(z => {
      lines.push({ label: `🌍 Zone ×${z.bonus.bpsMultiplier! * 100 | 0}% BPS`, value: `+${formatRate(upgradeBase * z.bonus.bpsMultiplier!)} / sec` });
    });

    if ((state.heritageBps ?? 0) > 0)
      lines.push({ label: '🧬 Héritage BPS', value: `+${formatRate(state.heritageBps!)} / sec` });

    const baseNet = upgradeBase * baseMult + (state.heritageBps ?? 0);
    lines.push({ label: 'Production nette', value: `${formatRate(baseNet)} / sec`, separator: true });

    if (weatherMultiplier !== 1)
      lines.push({ label: `${weatherEmoji} Météo`, value: `×${weatherMultiplier.toFixed(2)}` });
    if (isBoosterActive)
      lines.push({ label: '🚀 Accélérateur', value: '×3' });

    lines.push({ label: '✅ Total effectif', value: `${formatRate(bps)} / sec`, highlight: true });
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={bdStyles.overlay} onPress={onClose}>
        <Pressable style={bdStyles.card} onPress={() => {}}>
          <Text style={bdStyles.title}>
            {mode === 'bpc' ? '🍌 Détail / clic' : '🍌 Détail / sec'}
          </Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {lines.map((l, i) => (
              <View key={i} style={[bdStyles.row, l.separator && bdStyles.rowSep, l.highlight && bdStyles.rowHL]}>
                <Text style={[bdStyles.label, l.highlight && bdStyles.labelHL]}>{l.label}</Text>
                <Text style={[bdStyles.value, l.highlight && bdStyles.valueHL]}>{l.value}</Text>
              </View>
            ))}
          </ScrollView>
          <Pressable style={bdStyles.closeBtn} onPress={onClose}>
            <Text style={bdStyles.closeTxt}>Fermer</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const bdStyles = StyleSheet.create({
  overlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  card:     { backgroundColor: '#12131f', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '75%' },
  title:    { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 16, textAlign: 'center' },
  row:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  rowSep:   { marginTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)' },
  rowHL:    { backgroundColor: 'rgba(249,168,37,0.1)', borderRadius: 10, paddingHorizontal: 8, marginTop: 8 },
  label:    { fontSize: 13, color: 'rgba(255,255,255,0.65)', flex: 1 },
  labelHL:  { color: '#ffd700', fontWeight: '700' },
  value:    { fontSize: 13, fontWeight: '600', color: '#fff' },
  valueHL:  { color: '#ffd700', fontWeight: '900', fontSize: 15 },
  closeBtn: { backgroundColor: '#f9a825', borderRadius: 14, paddingVertical: 12, alignItems: 'center', marginTop: 16 },
  closeTxt: { fontSize: 15, fontWeight: '800', color: '#0a0a0a' },
});

const AGE_BACKGROUNDS: Record<number, ImageSourcePropType> = {
  0: require('@/assets/images/backgrounds/bg_banana_clicker.png'),
  1: require('@/assets/images/backgrounds/bg_ere_agricole.png'),
  2: require('@/assets/images/backgrounds/bg_ere_industriel.png'),
  3: require('@/assets/images/backgrounds/bg_ere_moderne.png'),
  4: require('@/assets/images/backgrounds/bg_ere_robotique.png'),
};

const HERO_HEIGHT = Dimensions.get('window').height * 0.55;

const COMBO_LEVELS = [
  { min: 5,   emoji: '🌟', label: '×5',   color: '#e040fb', bg: 'rgba(142,36,170,0.25)',  border: '#ce93d8' },
  { min: 3,   emoji: '💥', label: '×3',   color: '#ff5252', bg: 'rgba(229,57,53,0.2)',    border: '#e53935' },
  { min: 2,   emoji: '🔥', label: '×2',   color: '#ff9800', bg: 'rgba(255,112,67,0.2)',   border: '#ff7043' },
  { min: 1.5, emoji: '⚡', label: '×1.5', color: '#ffee58', bg: 'rgba(249,168,37,0.2)',   border: '#f9a825' },
];

// ─── Badge combo (haut-gauche, léger) ────────────────────────────────────────

function ComboBadge({ multiplier, unlocked }: { multiplier: number; unlocked: boolean }) {
  const op = useSharedValue(0);
  const sc = useSharedValue(0.7);

  useEffect(() => {
    if (multiplier > 1) {
      op.value = withTiming(1, { duration: 120 });
      sc.value = withSpring(1, { damping: 12, stiffness: 260 });
    } else {
      op.value = withTiming(0, { duration: 200 });
    }
  }, [multiplier]);

  const style = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ scale: sc.value }],
  }));

  if (!unlocked) return null;
  const cfg = COMBO_LEVELS.find(l => multiplier >= l.min);
  if (!cfg) return null;

  return (
    <Animated.View style={[comboBadgeStyles.wrap, { borderColor: cfg.border, backgroundColor: cfg.bg }, style]}>
      <Text style={comboBadgeStyles.emoji}>{cfg.emoji}</Text>
      <Text style={[comboBadgeStyles.label, { color: cfg.color }]}>{cfg.label}</Text>
    </Animated.View>
  );
}

const comboBadgeStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 12, borderWidth: 1.5,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  emoji: { fontSize: 16 },
  label: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
});

function PulseDot({ color }: { color: string }) {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.4, { duration: 500 }), withTiming(1, { duration: 500 })),
      -1,
    );
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

interface HalfUpgradeReq {
  id: string;
  name: string;
  owned: number;
  required: number;
}

interface MigrationModalProps {
  migrationNumber: number;
  totalInAge: number;
  isAgeAdvance: boolean;
  isFinal: boolean;
  nextAgeName?: string;
  currentAgeName: string;
  req: { totalBananas: number; claimedQuestId: string; description: string; minTransports?: number; allZonesMaxed?: boolean; halfUpgrades?: boolean };
  questMet: boolean;
  bananaMet: boolean;
  transportMet: boolean;
  zonesMaxedMet: boolean;
  halfReqs: HalfUpgradeReq[];
  totalBananas: number;
  whalesOwned: number;
  canMigrate: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const MIGRATION_BONUSES = [
  { emoji: '🧬', label: '+1 🍌/clic permanent' },
  { emoji: '🚀', label: 'Accélérateur ×3 BPS' },
  { emoji: '⚡', label: 'Combo de clics' },
];

// Dernier âge : 2 migrations seulement, la seconde termine le jeu
const LAST_AGE_BONUSES = [
  { emoji: '🧬', label: '+1 🍌/clic permanent' },
  { emoji: '🏁', label: 'Fin du jeu !' },
];

function MigrationModal({
  migrationNumber, totalInAge, isAgeAdvance, isFinal, nextAgeName, currentAgeName,
  req, questMet, bananaMet, transportMet, zonesMaxedMet, halfReqs,
  totalBananas, whalesOwned, canMigrate, onConfirm, onClose,
}: MigrationModalProps) {
  const router = useRouter();
  const bonuses = totalInAge === 2 ? LAST_AGE_BONUSES : MIGRATION_BONUSES;
  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={modalStyles.backdrop} onPress={onClose} />
      <View style={modalStyles.sheet}>
        <Text style={modalStyles.emoji}>{isFinal ? '🏁' : '🌍'}</Text>
        <Text style={modalStyles.title}>{isFinal ? 'Migration Finale' : 'Grande Migration'}</Text>
        <Text style={modalStyles.subtitle}>
          {isFinal
            ? 'La dernière étape de votre voyage !'
            : isAgeAdvance && nextAgeName
            ? `Passage vers ${nextAgeName}`
            : `Tu restes dans ${currentAgeName}`}
        </Text>

        {/* Progression des migrations de l'âge */}
        <View style={modalStyles.progressStrip}>
          {bonuses.map((b, i) => {
            const num     = i + 1;
            const isCurrent = num === migrationNumber;
            const isDone    = num < migrationNumber;
            return (
              <View key={i} style={[modalStyles.progressItem, isCurrent && modalStyles.progressItemActive]}>
                <Text style={modalStyles.progressEmoji}>{isDone ? '✓' : b.emoji}</Text>
                <Text style={[modalStyles.progressLabel, isCurrent && modalStyles.progressLabelActive]}>
                  {b.label}
                </Text>
                <Text style={[modalStyles.progressNum, isCurrent && modalStyles.progressNumActive]}>
                  {num}/{totalInAge}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Critères */}
        <View style={modalStyles.criteriaBox}>
          <Text style={modalStyles.criteriaTitle}>Critères pour cette migration</Text>
          <View style={modalStyles.criteriaRow}>
            <Text style={[modalStyles.criteriaCheck, questMet && modalStyles.met]}>{questMet ? '✓' : '○'}</Text>
            <Text style={[modalStyles.criteriaText, { flex: 1 }]}>Tous les upgrades de l'âge débloqués</Text>
            {!questMet && (
              <Pressable onPress={() => { onClose(); router.navigate('/(tabs)/BananaClicker' as any); }}>
                <Text style={modalStyles.goBtn}>Quêtes →</Text>
              </Pressable>
            )}
          </View>
          {req.totalBananas > 0 && (
            <View style={modalStyles.criteriaRow}>
              <Text style={[modalStyles.criteriaCheck, bananaMet && modalStyles.met]}>{bananaMet ? '✓' : '○'}</Text>
              <Text style={[modalStyles.criteriaText, { flex: 1 }]}>
                {formatBananas(req.totalBananas)} 🍌 récoltées
                {!bananaMet && ` (${formatBananas(totalBananas)} / ${formatBananas(req.totalBananas)})`}
              </Text>
            </View>
          )}
          {req.halfUpgrades && halfReqs.map(r => {
            const met = r.owned >= r.required;
            return (
              <View key={r.id} style={modalStyles.criteriaRow}>
                <Text style={[modalStyles.criteriaCheck, met && modalStyles.met]}>{met ? '✓' : '○'}</Text>
                <Text style={[modalStyles.criteriaText, { flex: 1 }]}>
                  {r.name} : la moitié de la limite ({r.owned}/{r.required})
                </Text>
              </View>
            );
          })}
          {req.minTransports && (
            <View style={modalStyles.criteriaRow}>
              <Text style={[modalStyles.criteriaCheck, transportMet && modalStyles.met]}>{transportMet ? '✓' : '○'}</Text>
              <Text style={[modalStyles.criteriaText, { flex: 1 }]}>
                Au moins {req.minTransports} transport actif
                {!transportMet && ` (${whalesOwned}/${req.minTransports})`}
              </Text>
              {!transportMet && (
                <Pressable onPress={() => { onClose(); router.navigate('/(tabs)/' as any); }}>
                  <Text style={modalStyles.goBtn}>Carte →</Text>
                </Pressable>
              )}
            </View>
          )}
          {req.allZonesMaxed && (
            <View style={modalStyles.criteriaRow}>
              <Text style={[modalStyles.criteriaCheck, zonesMaxedMet && modalStyles.met]}>{zonesMaxedMet ? '✓' : '○'}</Text>
              <Text style={[modalStyles.criteriaText, { flex: 1 }]}>Toutes les zones de l'âge au niveau 3</Text>
              {!zonesMaxedMet && (
                <Pressable onPress={() => { onClose(); router.navigate('/(tabs)/' as any); }}>
                  <Text style={modalStyles.goBtn}>Carte →</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>

        <Pressable
          style={[modalStyles.confirmBtn, !canMigrate && modalStyles.confirmBtnDisabled]}
          onPress={canMigrate ? onConfirm : undefined}
        >
          <Text style={modalStyles.confirmTxt}>
            {canMigrate ? (isFinal ? '🏁 Terminer le jeu' : '🌍 Migrer maintenant') : '🔒 Critères non remplis'}
          </Text>
        </Pressable>
        <Pressable style={modalStyles.cancelBtn} onPress={onClose}>
          <Text style={modalStyles.cancelTxt}>Annuler</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

// ─── Animation de migration ────────────────────────────────────────────────────

const AGE_MIGRATION_ANIM: Record<number, { emoji: string; trail: string; label: string; color: string }> = {
  0: { emoji: '🐒', trail: '🍌', label: 'La tribu migre vers de nouvelles terres !',   color: '#1b5e20' },
  1: { emoji: '🧑‍🌾', trail: '🌾', label: 'Les paysans partent fonder un nouveau monde !', color: '#e65100' },
  2: { emoji: '🚂',   trail: '💨', label: 'La locomotive siffle le grand départ !',      color: '#37474f' },
  3: { emoji: '🚁',   trail: '⭐', label: 'Le drone balise la route vers demain !',      color: '#0d47a1' },
  4: { emoji: '🤖',   trail: '💫', label: 'Les robots exécutent la grande migration !',  color: '#4a148c' },
};

function BananaTrail({ delay, sw }: { delay: number; sw: number }) {
  const x = useSharedValue(-40);
  const y = useSharedValue(Math.random() * 80 - 40);
  const op = useSharedValue(0);

  useEffect(() => {
    x.value  = withDelay(delay, withTiming(sw + 40, { duration: 1800, easing: Easing.linear }));
    op.value = withDelay(delay, withSequence(withTiming(1, { duration: 100 }), withDelay(1400, withTiming(0, { duration: 300 }))));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }],
    opacity: op.value,
  }));
  return <Animated.Text style={[{ position: 'absolute', fontSize: 22 }, style]}>🍌</Animated.Text>;
}

function MigrationAnimation({ currentAge, onComplete }: { currentAge: number; onComplete: () => void }) {
  const { width: sw, height: sh } = useWindowDimensions();
  const cfg    = AGE_MIGRATION_ANIM[currentAge] ?? AGE_MIGRATION_ANIM[0];
  const x      = useSharedValue(-120);
  const scaleV = useSharedValue(1);
  const rot    = useSharedValue(0);
  const bgOp   = useSharedValue(0);
  const txtOp  = useSharedValue(0);

  useEffect(() => {
    // Fond
    bgOp.value = withTiming(1, { duration: 250 });

    // Personnage entre depuis la gauche
    x.value = withTiming(sw / 2 - 55, { duration: 550, easing: Easing.out(Easing.back(1.4)) });

    // Texte apparaît
    txtOp.value = withDelay(400, withTiming(1, { duration: 300 }));

    // Danse au centre
    setTimeout(() => {
      scaleV.value = withRepeat(
        withSequence(withTiming(1.35, { duration: 180 }), withTiming(1, { duration: 180 })), 3,
      );
      rot.value = withRepeat(
        withSequence(withTiming(-18, { duration: 120 }), withTiming(18, { duration: 120 }), withTiming(0, { duration: 120 })), 3,
      );
    }, 600);

    // Sort par la droite
    setTimeout(() => {
      x.value    = withTiming(sw + 120, { duration: 480, easing: Easing.in(Easing.cubic) });
      scaleV.value = withTiming(0.6, { duration: 480 });
      txtOp.value  = withTiming(0, { duration: 300 });
      bgOp.value   = withDelay(300, withTiming(0, { duration: 300 }));
    }, 1800);

    // Déclenche la migration
    setTimeout(() => runOnJS(onComplete)(), 2400);
  }, []);

  const charStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { scale: scaleV.value }, { rotate: `${rot.value}deg` }],
  }));
  const bgStyle  = useAnimatedStyle(() => ({ opacity: bgOp.value }));
  const txtStyle = useAnimatedStyle(() => ({ opacity: txtOp.value }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'flex-start', backgroundColor: `${cfg.color}ee` }, bgStyle]} pointerEvents="none">
      {/* Traîne de bananes */}
      {[0, 200, 420, 650, 900].map((d, i) => (
        <View key={i} style={{ position: 'absolute', top: sh / 2 - 20, left: 0, right: 0 }}>
          <BananaTrail delay={d} sw={sw} />
        </View>
      ))}

      {/* Personnage */}
      <Animated.Text style={[{ position: 'absolute', top: sh / 2 - 65, left: 0, fontSize: 100 }, charStyle]}>
        {cfg.emoji}
      </Animated.Text>

      {/* Texte */}
      <Animated.View style={[{ position: 'absolute', bottom: sh / 3, width: '100%', alignItems: 'center', paddingHorizontal: 32 }, txtStyle]}>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 4 }}>
          {cfg.label}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

function MigrationButton({ onPress, migrationNumber, totalInAge, isFinal, ready }: { onPress: () => void; migrationNumber: number; totalInAge: number; isFinal: boolean; ready: boolean }) {
  const scale = useSharedValue(1);
  const isAgeAdvance = !isFinal && migrationNumber === totalInAge;
  useEffect(() => {
    if (!ready) return;
    scale.value = withRepeat(
      withSequence(withTiming(1.03, { duration: 900 }), withTiming(1, { duration: 900 })),
      -1,
    );
    return () => { scale.value = 1; };
  }, [ready]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={style}>
      <Pressable style={[styles.migrationBtn, !ready && styles.migrationBtnLocked, (isAgeAdvance || isFinal) && ready && styles.migrationBtnAge]} onPress={onPress}>
        <Text style={styles.migrationEmoji}>{!ready ? '🔒' : isFinal ? '🏁' : isAgeAdvance ? '🌅' : '🌍'}</Text>
        <View>
          <Text style={styles.migrationTitle}>
            {isFinal ? 'Migration Finale' : isAgeAdvance ? 'Changer d\'Ère' : `Migration ${migrationNumber}/${totalInAge}`}
          </Text>
          <Text style={styles.migrationSub}>
            {!ready
              ? 'Critères non remplis'
              : isFinal ? 'Terminer le jeu !'
              : isAgeAdvance ? 'Passer à l\'ère suivante !'
              : 'Prêt à migrer !'}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function BananaClicker() {
  const { state, bps, bpc, click, buyUpgrade, bulkBuyUpgrade, claimQuest, claimSideQuest, migrate, collectGolden, weatherEmoji, weatherLabel, weatherType, weatherMultiplier, activateBooster, deactivateBooster, isBoosterActive, boosterCooldownLeft, boosterRemaining, upgradeAutoClick } = useGameContext();
  const theme  = useAgeTheme();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { pseudo } = useProfile();

  const bananaRef       = useRef<View>(null);
  const bananaButtonRef = useRef<BananaButtonHandle>(null);
  const statsRef        = useRef<View>(null);
  const upgradesTabRef  = useRef<any>(null);
  const questsTabRef    = useRef<any>(null);
  const panelRef        = useRef<View>(null);

  useEffect(() => {
    registerTutorialRef('banana',       bananaRef);
    registerTutorialRef('statsBar',     statsRef);
    registerTutorialRef('upgradesTab',  upgradesTabRef);
    registerTutorialRef('questsTab',    questsTabRef);
    registerTutorialRef('upgradesPanel', panelRef);
    registerTutorialRef('questsPanel',   panelRef);
  }, []);
  const sounds = useSounds();

  const [activePanel, setActivePanel]     = useState<Panel>('upgrades');
  const [clickCount, setClickCount]       = useState(0);
  const [newUpgrade, setNewUpgrade]       = useState(false);
  const [goldenBanana, setGoldenBanana]   = useState<{ x: number; y: number } | null>(null);
  const [shownAchievement, setShownAchievement] = useState<string | null>(null);
  const [questNotif, setQuestNotif]             = useState<{ id: string; title: string; reward: number } | null>(null);
  const prevCompleted = useRef<string[]>([]);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [breakdown, setBreakdown] = useState<BreakdownMode | null>(null);
  const [autoClickEnabled, setAutoClickEnabled] = useState(true);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [showMigrationAnim, setShowMigrationAnim]   = useState(false);
  const [showEndGame, setShowEndGame]               = useState(false);
  const [showSettings, setShowSettings]             = useState(false);

  const prevClaimed      = useRef<string[]>(state.claimedQuests);
  const prevAchievements = useRef<string[]>(state.unlockedAchievements);
  const nextGoldenRef    = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastClickRef     = useRef(0);
  const comboCountRef    = useRef(0);
  const comboResetRef    = useRef<ReturnType<typeof setTimeout>>(undefined);
  const comboUnlockedRef = useRef(state.comboUnlocked);
  useEffect(() => { comboUnlockedRef.current = state.comboUnlocked; }, [state.comboUnlocked]);

  // --- Grande Migration ---
  const migrationInAge   = state.totalMigrations % 3;
  const currentAgeConfig = AGES[state.currentAge];
  const migrationsInAge  = currentAgeConfig?.migrations?.length ?? 0;
  const req              = currentAgeConfig?.migrations?.[migrationInAge] ?? null;
  const isLastAge        = state.currentAge === AGES.length - 1;
  const isFinalMigration = isLastAge && req !== null && migrationInAge === migrationsInAge - 1;
  const gameFinished     = isLastAge && migrationsInAge > 0 && migrationInAge >= migrationsInAge;
  const ageQuestIds      = useMemo(
    () => QUESTS.filter(q => (q.minAge ?? 0) === state.currentAge).map(q => q.id),
    [state.currentAge],
  );
  const allQuestsClaimed = ageQuestIds.length > 0 && ageQuestIds.every(id => state.claimedQuests.includes(id));
  const questMet        = allQuestsClaimed;
  const bananaMet       = req !== null && (req.totalBananas <= 0 || state.totalBananas >= req.totalBananas);
  const transportMet    = !req?.minTransports || state.whalesOwned >= req.minTransports;
  const zonesMaxedMet   = !req?.allZonesMaxed || ZONES
    .filter(z => z.minAge === state.currentAge)
    .every(z => (state.zoneLevels[z.id] ?? 0) >= 3);
  // Dernier âge : posséder la moitié de la limite de chaque amélioration
  const halfReqs = useMemo<HalfUpgradeReq[]>(() => {
    if (!req?.halfUpgrades) return [];
    return UPGRADES
      .filter(u => (u.minAge ?? 0) === state.currentAge && u.maxCount)
      .map(u => ({
        id: u.id,
        name: u.name,
        owned: state.upgrades[u.id] ?? 0,
        required: Math.ceil((u.maxCount ?? 0) / 2),
      }));
  }, [req, state.currentAge, state.upgrades]);
  const halfMet          = halfReqs.every(r => r.owned >= r.required);
  const canMigrate       = req !== null && questMet && bananaMet && transportMet && zonesMaxedMet && halfMet;
  const showMigrationBtn = questMet && req !== null;

  // --- Quêtes ---
  const completedQuestIds = useMemo(
    () => QUESTS.filter(q => (q.minAge ?? 0) === state.currentAge && q.check(state)).map(q => q.id),
    [state],
  );
  const unclaimedAgeCount = completedQuestIds.filter(id => !state.claimedQuests.includes(id)).length;
  const claimableSideCount = useMemo(
    () => SIDE_QUESTS.filter(q =>
      q.minAge <= state.currentAge &&
      !state.claimedSideQuests.includes(q.id) &&
      q.check(state),
    ).length,
    [state],
  );
  const unclaimedCount = unclaimedAgeCount + claimableSideCount;

  // Dot vert quand un upgrade se débloque
  useEffect(() => {
    const newlyClaimed = state.claimedQuests.filter(id => !prevClaimed.current.includes(id));
    if (newlyClaimed.length > 0 && UPGRADES.some(u => newlyClaimed.includes(u.unlockedBy ?? ''))) {
      setNewUpgrade(true);
    }
    prevClaimed.current = state.claimedQuests;
  }, [state.claimedQuests]);

  // Notif quête complétée (non réclamée)
  useEffect(() => {
    if (questNotif) return; // une notif à la fois
    const newlyCompleted = completedQuestIds.filter(
      id => !state.claimedQuests.includes(id) && !prevCompleted.current.includes(id),
    );
    if (newlyCompleted.length > 0) {
      const quest = QUESTS.find(q => q.id === newlyCompleted[0]);
      if (quest) setQuestNotif({ id: quest.id, title: quest.title, reward: quest.reward });
    }
    prevCompleted.current = completedQuestIds;
  }, [completedQuestIds]);

  // Notif succès
  useEffect(() => {
    const newlyUnlocked = state.unlockedAchievements.filter(
      id => !prevAchievements.current.includes(id),
    );
    if (newlyUnlocked.length > 0) setShownAchievement(newlyUnlocked[0]);
    prevAchievements.current = state.unlockedAchievements;
  }, [state.unlockedAchievements]);

  const handleClickRef = useRef<(() => void) | null>(null);

  // --- Banane dorée ---
  function scheduleNextGolden() {
    const delay = (Math.random() * 30 + 30) * 1000;
    nextGoldenRef.current = setTimeout(() => {
      setGoldenBanana({ x: Math.random() * 55 + 15, y: Math.random() * 40 + 15 });
    }, delay);
  }

  useEffect(() => {
    scheduleNextGolden();
    return () => clearTimeout(nextGoldenRef.current);
  }, []);

  // --- Combo ---
  function getComboMultiplier(count: number): number {
    if (count < 3)  return 1;
    if (count < 7)  return 1.5;
    if (count < 15) return 2;
    if (count < 25) return 3;
    return 5;
  }

  // --- Handlers ---
  const handleClick = useCallback((evt?: { nativeEvent: { locationX: number; locationY: number } }) => {
    if (isBananaLocked()) return;
    const now = Date.now();

    if (!comboUnlockedRef.current) {
      // Combo pas encore débloqué : reset silencieux
      comboCountRef.current = 0;
      lastClickRef.current  = now;
      click(1);
      setClickCount(c => c + 1);
      return;
    }

    if (now - lastClickRef.current < 600) {
      comboCountRef.current = Math.min(comboCountRef.current + 1, 30);
    } else {
      comboCountRef.current = 0;
    }
    lastClickRef.current = now;
    const mult = getComboMultiplier(comboCountRef.current);
    setComboMultiplier(mult);
    clearTimeout(comboResetRef.current);
    comboResetRef.current = setTimeout(() => {
      comboCountRef.current = 0;
      setComboMultiplier(1);
    }, 1200);
    click(mult);
    setClickCount(c => c + 1);
  }, [click]);

  // Toujours à jour pour l'auto-clic
  handleClickRef.current = handleClick;

  // --- Auto-clic ---
  const AUTO_CLICK_RATES = [0, 1, 3, 8];
  useEffect(() => {
    if (state.autoClickLevel === 0 || !autoClickEnabled) return;
    const ms = 1000 / AUTO_CLICK_RATES[state.autoClickLevel];
    const id = setInterval(() => {
      handleClickRef.current?.();
      bananaButtonRef.current?.press();
    }, ms);
    return () => clearInterval(id);
  }, [state.autoClickLevel, autoClickEnabled]);

  const handleBuy = useCallback((id: string) => {
    buyUpgrade(id);
    sounds.playBuy(id);
  }, [buyUpgrade, sounds]);

  const handleBulkBuy = useCallback((id: string, qty: number) => {
    bulkBuyUpgrade(id, qty);
    sounds.playBuy(id);
  }, [bulkBuyUpgrade, sounds]);

  const handleClaim = useCallback((id: string) => {
    claimQuest(id);
    sounds.playQuest();
  }, [claimQuest, sounds]);

  const handleClaimSide = useCallback((id: string) => {
    claimSideQuest(id);
    sounds.playQuest();
  }, [claimSideQuest, sounds]);

  function handleGoldenCollect() {
    collectGolden();
    setGoldenBanana(null);
    scheduleNextGolden();
  }

  function handleGoldenExpire() {
    setGoldenBanana(null);
    scheduleNextGolden();
  }

  function handleTabChange(panel: Panel) {
    setActivePanel(panel);
    if (panel === 'upgrades') { setNewUpgrade(false); fireTutorialEvent('upgradesTabOpened'); }
    if (panel === 'quests')   { fireTutorialEvent('questsTabOpened'); }
  }

  function handleMigrate() {
    setShowMigrationModal(true);
  }

  function confirmMigrate() {
    setShowMigrationModal(false);
    if (isFinalMigration) {
      // Dernière migration du dernier âge : fin du jeu, célébration gorille
      migrate();
      sounds.playEndGame();
      setShowEndGame(true);
      return;
    }
    if (migrationInAge === 2) sounds.playAgeTransition();
    else sounds.playMigration();
    setShowMigrationAnim(true);
  }

  function finalizeMigrate() {
    setShowMigrationAnim(false);
    migrate();
  }

  const achievement = shownAchievement
    ? ACHIEVEMENTS.find(a => a.id === shownAchievement) ?? null
    : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.panelBg }]} edges={['bottom']}>
      {achievement && (
        <AchievementNotification
          achievement={achievement}
          onDone={() => setShownAchievement(null)}
        />
      )}
      {questNotif && (
        <QuestNotification
          title={questNotif.title}
          reward={questNotif.reward}
          onClaim={() => { claimQuest(questNotif.id); setQuestNotif(null); }}
          onDone={() => setQuestNotif(null)}
        />
      )}

      {breakdown && (
        <BreakdownModal
          mode={breakdown}
          state={state}
          bps={bps} bpc={bpc}
          comboMultiplier={comboMultiplier}
          weatherMultiplier={weatherMultiplier}
          weatherEmoji={weatherEmoji}
          isBoosterActive={isBoosterActive}
          onClose={() => setBreakdown(null)}
        />
      )}

      <ImageBackground
        source={AGE_BACKGROUNDS[state.currentAge] ?? require('@/assets/images/backgrounds/bg_banana_clicker.png')}
        style={styles.hero}
        resizeMode="cover"
      >
        {/* Zone de clic étendue à tout le héro */}
        <Pressable style={StyleSheet.absoluteFill} onPress={(e) => handleClick(e)} />
        <WeatherOverlay type={weatherType} height={HERO_HEIGHT} active={isFocused} />
        <View ref={statsRef} style={[styles.statsWrapper, { paddingTop: insets.top + 8 }]} pointerEvents="none">
          <StatsBar
            bananas={state.bananas} bps={bps} bpc={bpc} comboMultiplier={comboMultiplier}
            active={isFocused}
            onPressBps={() => setBreakdown('bps')}
            onPressBpc={() => setBreakdown('bpc')}
          />
          {weatherLabel ? (
            <Text style={styles.weather}>{weatherEmoji} {weatherLabel}</Text>
          ) : null}
        </View>
        {/* Badge combo haut-gauche */}
        <View style={[styles.comboBadgePos, { top: insets.top + 8 }]} pointerEvents="none">
          <ComboBadge multiplier={comboMultiplier} unlocked={state.comboUnlocked} />
        </View>
        <View ref={bananaRef} style={styles.bananaCenter} pointerEvents="none">
          <BananaParticles clickCount={clickCount} />
          <BananaButton ref={bananaButtonRef} onPress={handleClick} />
        </View>
        {goldenBanana && (
          <GoldenBanana
            x={goldenBanana.x}
            y={goldenBanana.y}
            onCollect={handleGoldenCollect}
            onExpire={handleGoldenExpire}
          />
        )}
        {/* Roue crantée — paramètres son */}
        <Pressable style={styles.settingsBtn} onPress={() => setShowSettings(true)} hitSlop={8}>
          <Text style={styles.settingsEmoji}>⚙️</Text>
        </Pressable>
      </ImageBackground>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      {/* Booster */}
      {state.boosterUnlocked && (
        <Pressable
          style={[styles.boosterBtn, isBoosterActive && styles.boosterBtnActive, boosterCooldownLeft > 0 && !isBoosterActive && styles.boosterBtnCooldown]}
          onPress={isBoosterActive ? deactivateBooster : activateBooster}
          disabled={boosterCooldownLeft > 0 && !isBoosterActive}
        >
          <Text style={styles.boosterEmoji}>{isBoosterActive ? '⏸️' : '🚀'}</Text>
          <Text style={styles.boosterTxt}>
            {isBoosterActive
              ? `BOOST ×3 — ${Math.ceil(boosterRemaining)}s · Pause`
              : boosterCooldownLeft > 0
              ? `Recharge — ${Math.ceil(boosterCooldownLeft / 60)}min`
              : boosterRemaining < BOOSTER_DURATION
              ? `×3 BPS · ${Math.ceil(boosterRemaining)}s dispo`
              : '×3 BPS · 3 min'}
          </Text>
        </Pressable>
      )}

      {/* Auto-clic — bouton icône en haut à droite du héro */}
      {(() => {
        const COSTS  = [100, 1000, 10000];
        const LABELS = ['1/s', '3/s', '8/s'];
        const lvl    = state.autoClickLevel;
        const maxed  = lvl >= 3;
        const cost   = maxed ? 0 : COSTS[lvl];
        const canAfford = !maxed && state.bananas >= cost;
        const purchased  = lvl >= 1;

        // Pas encore acheté
        if (!purchased) return (
          <Pressable
            style={[styles.autoClickIcon, styles.autoClickIconLocked, !canAfford && styles.autoClickIconDisabled]}
            onPress={() => canAfford && upgradeAutoClick()}
          >
            <Text style={styles.autoClickIconEmoji}>🤖</Text>
            <Text style={styles.autoClickIconSub}>{canAfford ? `${cost}🍌` : '🔒'}</Text>
          </Pressable>
        );

        // Acheté
        return (
          <View style={styles.autoClickWrapper}>
            {/* Toggle on/off */}
            <Pressable
              style={[styles.autoClickIcon, autoClickEnabled && styles.autoClickIconOn, maxed && styles.autoClickIconMax]}
              onPress={() => setAutoClickEnabled(e => !e)}
            >
              <Text style={styles.autoClickIconEmoji}>🤖</Text>
              <Text style={[styles.autoClickIconSub, autoClickEnabled && styles.autoClickIconSubOn]}>
                {autoClickEnabled ? LABELS[lvl - 1] : '⏸'}
              </Text>
              <View style={styles.autoClickDots}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <View key={i} style={[styles.autoClickDot, i < lvl && (maxed ? styles.autoClickDotMax : styles.autoClickDotFilled)]} />
                ))}
              </View>
            </Pressable>

            {/* Pastille upgrade — séparée du toggle */}
            {!maxed && (
              <Pressable
                style={[styles.autoClickUpgrade, canAfford && styles.autoClickUpgradeReady]}
                onPress={() => canAfford && upgradeAutoClick()}
              >
                <Text style={[styles.autoClickUpgradeTxt, canAfford && styles.autoClickUpgradeTxtReady]}>
                  {canAfford ? `⬆ ${cost}🍌` : `🔒 ${cost}🍌`}
                </Text>
              </Pressable>
            )}
          </View>
        );
      })()}

      {showMigrationBtn && (
        <MigrationButton
          onPress={handleMigrate}
          migrationNumber={migrationInAge + 1}
          totalInAge={migrationsInAge}
          isFinal={isFinalMigration}
          ready={canMigrate}
        />
      )}

      {/* Jeu terminé — bannière permanente, tap pour revoir la célébration */}
      {gameFinished && (
        <Pressable style={[styles.migrationBtn, styles.finishedBanner]} onPress={() => setShowEndGame(true)}>
          <Text style={styles.migrationEmoji}>🏆</Text>
          <View>
            <Text style={styles.migrationTitle}>Jeu terminé — Bravo {pseudo} !</Text>
            <Text style={styles.migrationSub}>Tap pour revoir la célébration</Text>
          </View>
        </Pressable>
      )}

      {showMigrationModal && req && (
        <MigrationModal
          migrationNumber={migrationInAge + 1}
          totalInAge={migrationsInAge}
          isAgeAdvance={!isLastAge && migrationInAge === 2}
          isFinal={isFinalMigration}
          nextAgeName={AGES[state.currentAge + 1]?.name}
          currentAgeName={currentAgeConfig?.name ?? ''}
          req={req}
          questMet={questMet}
          bananaMet={bananaMet}
          transportMet={transportMet}
          zonesMaxedMet={zonesMaxedMet}
          halfReqs={halfReqs}
          totalBananas={state.totalBananas}
          whalesOwned={state.whalesOwned}
          canMigrate={canMigrate}
          onConfirm={confirmMigrate}
          onClose={() => setShowMigrationModal(false)}
        />
      )}

      {showMigrationAnim && (
        <MigrationAnimation currentAge={state.currentAge} onComplete={finalizeMigrate} />
      )}

      {showEndGame && (
        <EndGameCelebration playerName={pseudo} onClose={() => setShowEndGame(false)} />
      )}

      <View style={[styles.tabSwitcher, { backgroundColor: theme.panelBg, borderBottomColor: theme.panelBorder }]}>
        <Pressable
          ref={upgradesTabRef}
          style={[styles.tab, activePanel === 'upgrades' && { borderBottomWidth: 2, borderBottomColor: theme.tabAccent }]}
          onPress={() => handleTabChange('upgrades')}
        >
          <View style={styles.tabLabel}>
            <Text style={[styles.tabText, { color: theme.tabInactive }, activePanel === 'upgrades' && { color: theme.tabAccent }]}>
              Améliorations
            </Text>
            {newUpgrade && <PulseDot color="#66bb6a" />}
          </View>
        </Pressable>

        <Pressable
          ref={questsTabRef}
          style={[styles.tab, activePanel === 'quests' && { borderBottomWidth: 2, borderBottomColor: theme.tabAccent }]}
          onPress={() => handleTabChange('quests')}
        >
          <View style={styles.tabLabel}>
            <Text style={[styles.tabText, { color: theme.tabInactive }, activePanel === 'quests' && { color: theme.tabAccent }]}>
              Quêtes
            </Text>
            {unclaimedCount > 0 && <PulseDot color="#ef5350" />}
          </View>
        </Pressable>
      </View>

      {activePanel === 'upgrades' ? (
        <UpgradesPanel
          upgrades={state.upgrades}
          bananas={state.bananas}
          onBuy={handleBuy}
          onBuyBulk={handleBulkBuy}
          claimedQuestIds={state.claimedQuests}
          currentAge={state.currentAge}
        />
      ) : (
        <QuestsPanel state={state} onClaim={handleClaim} onClaimSide={handleClaimSide} />
      )}
      {/* Ref invisible pour mesurer la zone panel */}
      <View ref={panelRef} style={StyleSheet.absoluteFill} pointerEvents="none" />
    </SafeAreaView>
  );
}

const modalStyles = StyleSheet.create({
  backdrop:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#1a1a2e', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 28, alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  emoji:    { fontSize: 48 },
  title:    { fontSize: 22, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.55)', textAlign: 'center' },
  bonusBox: {
    backgroundColor: 'rgba(249,168,37,0.15)', borderWidth: 1, borderColor: '#f9a825',
    borderRadius: 14, padding: 14, alignItems: 'center', width: '100%', gap: 4,
  },
  bonusLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  bonusValue: { fontSize: 16, fontWeight: '700', color: '#f9a825' },
  criteriaBox: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14,
    padding: 14, width: '100%', gap: 8,
  },
  criteriaTitle: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 2 },
  criteriaRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  criteriaCheck: { fontSize: 16, color: 'rgba(255,255,255,0.3)', width: 20 },
  met:           { color: '#66bb6a' },
  criteriaText:  { fontSize: 13, color: '#fff', flex: 1 },
  goBtn:         { fontSize: 12, fontWeight: '800', color: '#f9a825', paddingHorizontal: 8, paddingVertical: 4 },
  confirmBtn: {
    backgroundColor: '#1b5e20', borderRadius: 14, paddingVertical: 14,
    width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#4caf50',
  },
  confirmBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' },
  confirmTxt: { fontSize: 16, fontWeight: '800', color: '#fff' },
  cancelBtn:  { paddingVertical: 10 },
  cancelTxt:  { fontSize: 14, color: 'rgba(255,255,255,0.4)' },
  progressStrip: { width: '100%', gap: 6 },
  progressItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 10,
    borderWidth: 1, borderColor: 'transparent',
  },
  progressItemActive: { backgroundColor: 'rgba(249,168,37,0.15)', borderColor: '#f9a825' },
  progressEmoji:      { fontSize: 20, width: 28, textAlign: 'center' },
  progressLabel:      { flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  progressLabelActive:{ color: '#fff', fontWeight: '700' },
  progressNum:        { fontSize: 11, color: 'rgba(255,255,255,0.3)' },
  progressNumActive:  { color: '#f9a825', fontWeight: '700' },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  hero: {
    height: HERO_HEIGHT,
    width: '100%',
  },
  statsWrapper: {
    alignItems: 'center',
    gap: 4,
  },
  comboBadgePos: {
    position: 'absolute',
    left: 12,
  },
  weather: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  bananaCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  migrationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1b5e20',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#4caf50',
  },
  migrationEmoji: { fontSize: 32 },
  migrationTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  migrationSub:        { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  migrationBtnLocked:  { backgroundColor: '#4e342e', borderColor: '#8d6e63' },
  migrationBtnAge:     { backgroundColor: '#0d47a1', borderColor: '#42a5f5' },
  finishedBanner:      { backgroundColor: '#4a3500', borderColor: '#ffd700' },
  settingsBtn: {
    position: 'absolute',
    bottom: 10,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(20,20,50,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsEmoji: { fontSize: 20 },
  boosterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#1a237e', paddingHorizontal: 16, paddingVertical: 10,
    marginHorizontal: 16, marginTop: 4, borderRadius: 12,
    borderWidth: 1, borderColor: '#3949ab',
  },
  boosterBtnActive:   { backgroundColor: '#0d47a1', borderColor: '#42a5f5' },
  boosterBtnCooldown: { backgroundColor: '#1a1a2e', borderColor: '#37474f', opacity: 0.7 },
  boosterEmoji: { fontSize: 20 },
  boosterTxt:   { fontSize: 13, fontWeight: '700', color: '#fff' },
  autoClickWrapper: {
    position: 'absolute',
    top: 12,
    right: 12,
    alignItems: 'center',
    gap: 4,
  },
  autoClickIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(20,20,50,0.75)',
    borderWidth: 1.5,
    borderColor: 'rgba(100,100,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoClickIconOn:       { borderColor: '#7c4dff', backgroundColor: 'rgba(60,20,120,0.85)' },
  autoClickIconMax:      { borderColor: '#ffd700', backgroundColor: 'rgba(50,40,0,0.85)' },
  autoClickIconLocked:   { borderColor: 'rgba(255,255,255,0.15)' },
  autoClickIconDisabled: { opacity: 0.4 },
  autoClickIconEmoji:    { fontSize: 22, lineHeight: 26 },
  autoClickIconSub:      { fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: '700' },
  autoClickIconSubOn:    { color: '#b388ff' },
  autoClickDots:         { flexDirection: 'row', gap: 2, marginTop: 1 },
  autoClickDot:          { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' },
  autoClickDotFilled:    { backgroundColor: '#b388ff' },
  autoClickDotMax:       { backgroundColor: '#ffd700' },
  autoClickUpgrade: {
    backgroundColor: 'rgba(20,20,50,0.75)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(100,100,255,0.3)',
  },
  autoClickUpgradeReady:    { borderColor: '#7c4dff', backgroundColor: 'rgba(60,20,120,0.85)' },
  autoClickUpgradeTxt:      { fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: '700' },
  autoClickUpgradeTxtReady: { color: '#b388ff' },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#fff8e1',
    borderBottomWidth: 1,
    borderBottomColor: '#ffe082',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#f9a825',
  },
  tabLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8d6e63',
  },
  tabTextActive: {
    color: '#e65100',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
