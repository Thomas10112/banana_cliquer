import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ImageSourcePropType, useWindowDimensions } from 'react-native';
import { Dimensions, ImageBackground, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useGameContext } from '@/store/game-context';
import { formatBananas } from '@/utils/format-bananas';
import { QUESTS } from '@/store/quests-config';
import { UPGRADES } from '@/store/upgrades-config';
import { AGES } from '@/store/ages-config';
import { ACHIEVEMENTS } from '@/store/achievements-config';
import { BananaButton } from '@/components/banana-clicker/banana-button';
import { StatsBar } from '@/components/banana-clicker/stats-bar';
import { UpgradesPanel } from '@/components/banana-clicker/upgrades-panel';
import { QuestsPanel } from '@/components/banana-clicker/quests-panel';
import { BananaParticles } from '@/components/banana-clicker/banana-particles';
import { GoldenBanana } from '@/components/banana-clicker/golden-banana';
import { AchievementNotification } from '@/components/banana-clicker/achievement-notification';
import { WeatherOverlay } from '@/components/banana-clicker/weather-overlay';
import { useSounds } from '@/hooks/use-sounds';

type Panel = 'upgrades' | 'quests';

const AGE_BACKGROUNDS: Record<number, ImageSourcePropType> = {
  0: require('@/assets/images/bg_banana_clicker.png'),
  1: require('@/assets/images/bg_ere_agricole.png'),
  2: require('@/assets/images/bg_ere_industriel.png'),
};

const HERO_HEIGHT = Dimensions.get('window').height * 0.55;

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

interface MigrationModalProps {
  migrationNumber: number;
  isAgeAdvance: boolean;
  nextAgeName?: string;
  currentAgeName: string;
  req: { totalBananas: number; claimedQuestId: string; description: string };
  questMet: boolean;
  bananaMet: boolean;
  totalBananas: number;
  canMigrate: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const MIGRATION_BONUSES = [
  { emoji: '🧬', label: '+1 🍌/clic permanent' },
  { emoji: '🚀', label: 'Accélérateur ×3 BPS' },
  { emoji: '⚡', label: 'Combo de clics' },
];

function MigrationModal({
  migrationNumber, isAgeAdvance, nextAgeName, currentAgeName,
  req, questMet, bananaMet, totalBananas, canMigrate, onConfirm, onClose,
}: MigrationModalProps) {
  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={modalStyles.backdrop} onPress={onClose} />
      <View style={modalStyles.sheet}>
        <Text style={modalStyles.emoji}>🌍</Text>
        <Text style={modalStyles.title}>Grande Migration</Text>
        <Text style={modalStyles.subtitle}>
          {isAgeAdvance && nextAgeName
            ? `Passage vers ${nextAgeName}`
            : `Tu restes dans ${currentAgeName}`}
        </Text>

        {/* Progression des 3 migrations */}
        <View style={modalStyles.progressStrip}>
          {MIGRATION_BONUSES.map((b, i) => {
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
                  {num}/3
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
            <Text style={modalStyles.criteriaText}>Tous les upgrades de l'âge débloqués</Text>
          </View>
          <View style={modalStyles.criteriaRow}>
            <Text style={[modalStyles.criteriaCheck, bananaMet && modalStyles.met]}>{bananaMet ? '✓' : '○'}</Text>
            <Text style={modalStyles.criteriaText}>
              {formatBananas(req.totalBananas)} 🍌 récoltées
              {!bananaMet && ` (${formatBananas(totalBananas)} / ${formatBananas(req.totalBananas)})`}
            </Text>
          </View>
        </View>

        <Pressable
          style={[modalStyles.confirmBtn, !canMigrate && modalStyles.confirmBtnDisabled]}
          onPress={canMigrate ? onConfirm : undefined}
        >
          <Text style={modalStyles.confirmTxt}>
            {canMigrate ? '🌍 Migrer maintenant' : '🔒 Critères non remplis'}
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

function MigrationButton({ onPress, migrationNumber, ready }: { onPress: () => void; migrationNumber: number; ready: boolean }) {
  const scale = useSharedValue(1);
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
      <Pressable style={[styles.migrationBtn, !ready && styles.migrationBtnLocked]} onPress={onPress}>
        <Text style={styles.migrationEmoji}>{ready ? '🌍' : '🔒'}</Text>
        <View>
          <Text style={styles.migrationTitle}>Grande Migration {migrationNumber}/3</Text>
          <Text style={styles.migrationSub}>{ready ? 'Prêt à migrer !' : 'Critères non remplis'}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function BananaClicker() {
  const { state, bps, click, buyUpgrade, claimQuest, migrate, collectGolden, weatherEmoji, weatherLabel, weatherType, activateBooster, isBoosterActive, boosterCooldownLeft } = useGameContext();
  const sounds = useSounds();

  const [activePanel, setActivePanel]     = useState<Panel>('upgrades');
  const [clickCount, setClickCount]       = useState(0);
  const [newUpgrade, setNewUpgrade]       = useState(false);
  const [goldenBanana, setGoldenBanana]   = useState<{ x: number; y: number } | null>(null);
  const [shownAchievement, setShownAchievement] = useState<string | null>(null);
  const [comboMultiplier, setComboMultiplier]   = useState(1);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [showMigrationAnim, setShowMigrationAnim]   = useState(false);

  const prevClaimed      = useRef<string[]>(state.claimedQuests);
  const prevAchievements = useRef<string[]>(state.unlockedAchievements);
  const nextGoldenRef    = useRef<ReturnType<typeof setTimeout>>();
  const lastClickRef     = useRef(0);
  const comboCountRef    = useRef(0);
  const comboResetRef    = useRef<ReturnType<typeof setTimeout>>();

  // --- Grande Migration ---
  const migrationInAge   = state.totalMigrations % 3;
  const currentAgeConfig = AGES[state.currentAge];
  const req              = currentAgeConfig?.migrations?.[migrationInAge] ?? null;
  const ageQuestIds      = useMemo(
    () => QUESTS.filter(q => (q.minAge ?? 0) === state.currentAge).map(q => q.id),
    [state.currentAge],
  );
  const allQuestsClaimed = ageQuestIds.length > 0 && ageQuestIds.every(id => state.claimedQuests.includes(id));
  const questMet         = allQuestsClaimed;
  const bananaMet        = req !== null && state.totalBananas >= req.totalBananas;
  const canMigrate       = questMet && bananaMet;
  const showMigrationBtn = questMet;

  // --- Quêtes ---
  const completedQuestIds = useMemo(
    () => QUESTS.filter(q => (q.minAge ?? 0) === state.currentAge && q.check(state)).map(q => q.id),
    [state],
  );
  const unclaimedCount = completedQuestIds.filter(id => !state.claimedQuests.includes(id)).length;

  // Dot vert quand un upgrade se débloque
  useEffect(() => {
    const newlyClaimed = state.claimedQuests.filter(id => !prevClaimed.current.includes(id));
    if (newlyClaimed.length > 0 && UPGRADES.some(u => newlyClaimed.includes(u.unlockedBy ?? ''))) {
      setNewUpgrade(true);
    }
    prevClaimed.current = state.claimedQuests;
  }, [state.claimedQuests]);

  // Notif succès
  useEffect(() => {
    const newlyUnlocked = state.unlockedAchievements.filter(
      id => !prevAchievements.current.includes(id),
    );
    if (newlyUnlocked.length > 0) setShownAchievement(newlyUnlocked[0]);
    prevAchievements.current = state.unlockedAchievements;
  }, [state.unlockedAchievements]);

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
  const handleClick = useCallback(() => {
    const now = Date.now();
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

  const handleBuy = useCallback((id: string) => {
    buyUpgrade(id);
    sounds.playBuy(id);
  }, [buyUpgrade, sounds]);

  const handleClaim = useCallback((id: string) => {
    claimQuest(id);
    sounds.playQuest();
  }, [claimQuest, sounds]);

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
    if (panel === 'upgrades') setNewUpgrade(false);
  }

  function handleMigrate() {
    setShowMigrationModal(true);
  }

  function confirmMigrate() {
    setShowMigrationModal(false);
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {achievement && (
        <AchievementNotification
          achievement={achievement}
          onDone={() => setShownAchievement(null)}
        />
      )}

      <ImageBackground
        source={AGE_BACKGROUNDS[state.currentAge] ?? require('@/assets/images/bg_banana_clicker.png')}
        style={styles.hero}
        resizeMode="cover"
      >
        <WeatherOverlay type={weatherType} height={HERO_HEIGHT} />
        <View style={styles.statsWrapper}>
          <StatsBar bananas={state.bananas} bps={bps} />
          {weatherLabel ? (
            <Text style={styles.weather}>{weatherEmoji} {weatherLabel}</Text>
          ) : null}
        </View>
        <View style={styles.bananaCenter}>
          <BananaParticles clickCount={clickCount} />
          <BananaButton onPress={handleClick} />
        </View>
        {goldenBanana && (
          <GoldenBanana
            x={goldenBanana.x}
            y={goldenBanana.y}
            onCollect={handleGoldenCollect}
            onExpire={handleGoldenExpire}
          />
        )}
      </ImageBackground>

      {/* Booster */}
      {state.boosterUnlocked && (
        <Pressable
          style={[styles.boosterBtn, isBoosterActive && styles.boosterBtnActive, boosterCooldownLeft > 0 && !isBoosterActive && styles.boosterBtnCooldown]}
          onPress={activateBooster}
          disabled={isBoosterActive || boosterCooldownLeft > 0}
        >
          <Text style={styles.boosterEmoji}>🚀</Text>
          <Text style={styles.boosterTxt}>
            {isBoosterActive
              ? `BOOST ACTIF — ${Math.ceil(state.boosterLastUsed + 120 - state.playTimeSeconds)}s`
              : boosterCooldownLeft > 0
              ? `Recharge — ${Math.ceil(boosterCooldownLeft / 60)}min`
              : '×3 BPS · 2 min'}
          </Text>
        </Pressable>
      )}

      {/* Combo */}
      {state.comboUnlocked && comboMultiplier > 1 && (
        <View style={styles.comboBadge}>
          <Text style={styles.comboTxt}>⚡ Combo ×{comboMultiplier}</Text>
        </View>
      )}

      {showMigrationBtn && (
        <MigrationButton
          onPress={handleMigrate}
          migrationNumber={migrationInAge + 1}
          ready={canMigrate}
        />
      )}

      {showMigrationModal && req && (
        <MigrationModal
          migrationNumber={migrationInAge + 1}
          isAgeAdvance={migrationInAge === 2}
          nextAgeName={AGES[state.currentAge + 1]?.name}
          currentAgeName={currentAgeConfig?.name ?? ''}
          req={req}
          questMet={questMet}
          bananaMet={bananaMet}
          totalBananas={state.totalBananas}
          canMigrate={canMigrate}
          onConfirm={confirmMigrate}
          onClose={() => setShowMigrationModal(false)}
        />
      )}

      {showMigrationAnim && (
        <MigrationAnimation currentAge={state.currentAge} onComplete={finalizeMigrate} />
      )}

      <View style={styles.tabSwitcher}>
        <Pressable
          style={[styles.tab, activePanel === 'upgrades' && styles.tabActive]}
          onPress={() => handleTabChange('upgrades')}
        >
          <View style={styles.tabLabel}>
            <Text style={[styles.tabText, activePanel === 'upgrades' && styles.tabTextActive]}>
              Améliorations
            </Text>
            {newUpgrade && <PulseDot color="#66bb6a" />}
          </View>
        </Pressable>

        <Pressable
          style={[styles.tab, activePanel === 'quests' && styles.tabActive]}
          onPress={() => handleTabChange('quests')}
        >
          <View style={styles.tabLabel}>
            <Text style={[styles.tabText, activePanel === 'quests' && styles.tabTextActive]}>
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
          claimedQuestIds={state.claimedQuests}
          currentAge={state.currentAge}
        />
      ) : (
        <QuestsPanel state={state} onClaim={handleClaim} />
      )}
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
    backgroundColor: '#fffde7',
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  hero: {
    height: HERO_HEIGHT,
    width: '100%',
  },
  statsWrapper: {
    paddingTop: 16,
    alignItems: 'center',
    gap: 4,
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
  comboBadge: {
    alignSelf: 'center', backgroundColor: '#f57f17',
    paddingHorizontal: 14, paddingVertical: 4, borderRadius: 12, marginTop: 4,
  },
  comboTxt: { fontSize: 14, fontWeight: '800', color: '#fff' },
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
