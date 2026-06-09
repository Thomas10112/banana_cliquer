import { Tabs } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { useAgeTheme } from '@/hooks/use-age-theme';
import { useAmbiance } from '@/hooks/use-ambiance';
import { useOnboarding } from '@/hooks/use-onboarding';
import { useTutorial } from '@/hooks/use-tutorial';
import { setBananaLocked } from '@/utils/tutorial-refs';
import { GameProvider } from '@/store/game-context';
import { useGameContext } from '@/store/game-context';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { TutorialOverlay } from '@/components/onboarding/TutorialOverlay';
import { formatBananas } from '@/utils/format-bananas';

function formatDuration(seconds: number): string {
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    return `${m} minute${m > 1 ? 's' : ''}`;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h} heure${h > 1 ? 's' : ''}`;
}

function OfflineGainsModal() {
  const { pendingOfflineGains, pendingOfflineSeconds, claimOfflineGains } = useGameContext();
  const visible = pendingOfflineGains > 0;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.emoji}>🌙</Text>
          <Text style={styles.title}>Pendant ton absence…</Text>
          <Text style={styles.subtitle}>
            {formatDuration(pendingOfflineSeconds)} de production accumulée
          </Text>

          <View style={styles.rewardRow}>
            <Text style={styles.rewardAmount}>+{formatBananas(pendingOfflineGains)}</Text>
            <Text style={styles.rewardEmoji}>🍌</Text>
          </View>

          <Pressable style={styles.claimBtn} onPress={claimOfflineGains}>
            <Text style={styles.claimTxt}>Récolter !</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function ResetSuccessModal({ onReplayTutorial }: { onReplayTutorial: () => void }) {
  const { justReset, clearJustReset } = useGameContext();
  return (
    <Modal visible={justReset} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.emoji}>🌱</Text>
          <Text style={styles.title}>Compte réinitialisé</Text>
          <Text style={styles.subtitle}>Tu repars de zéro.{'\n'}Veux-tu revoir le didacticiel ?</Text>
          <Pressable style={[styles.claimBtn, { paddingHorizontal: 20 }]} onPress={() => { clearJustReset(); onReplayTutorial(); }}>
            <Text style={[styles.claimTxt, { fontSize: 15 }]}>🤖 Rejouer le didacticiel</Text>
          </Pressable>
          <Pressable style={styles.skipTutorialBtn} onPress={clearJustReset}>
            <Text style={styles.skipTutorialTxt}>Non merci, je connais</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const ZONE_EMOJIS: Record<string, string> = {
  afrique: '🏕️', amazonie: '🌴', europe: '❄️', asie: '🦅', australie: '🦘', mammouth: '🦣',
  nil: '🌾', flandre: '⚙️', andine: '🏡', orient: '🏺', pacifique: '🌿', epices: '🌺',
  angleterre: '⚒️', ruhr: '🏭', pennsylvanie: '⛏️', detroit: '🔧', siberien: '🚂', bombay: '⚓',
  silicon_valley: '💻', geneve: '🔬', seoul: '📱', bangalore: '🛰️', houston: '🚀', tokyo: '🖥️',
  californie_2050: '🌆', dubai_nexus: '🏙️', singapour_ia: '🧠', cite_polaire: '❄️', sao_paulo_mech: '⚙️', neo_tokyo: '🤖',
};

const TAB_BAR_H = 62;

function ZoneFullToast({ zoneId, onDone }: { zoneId: string; onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const ty     = useSharedValue(100);
  const op     = useSharedValue(0);
  const doneRef = useRef(false);

  function dismiss() {
    if (doneRef.current) return;
    doneRef.current = true;
    ty.value = withTiming(100, { duration: 300 }, (f) => { if (f) runOnJS(onDone)(); });
    op.value = withTiming(0, { duration: 300 });
  }

  useEffect(() => {
    ty.value = withSpring(0, { damping: 14, stiffness: 140 });
    op.value = withTiming(1, { duration: 200 });
    const t = setTimeout(dismiss, 4000);
    return () => clearTimeout(t);
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }],
    opacity: op.value,
  }));

  const emoji = ZONE_EMOJIS[zoneId] ?? '📦';
  const bottom = insets.bottom + TAB_BAR_H + 8;

  return (
    <Animated.View style={[toastStyles.toast, { bottom }, style]}>
      <Pressable style={toastStyles.inner} onPress={dismiss}>
        <Text style={toastStyles.emoji}>{emoji}</Text>
        <View>
          <Text style={toastStyles.title}>Stock plein !</Text>
          <Text style={toastStyles.sub}>Tap pour aller récolter</Text>
        </View>
        <Text style={toastStyles.close}>✕</Text>
      </Pressable>
    </Animated.View>
  );
}

const toastStyles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 12,
    zIndex: 999,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(20,30,60,0.95)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#f9a825',
    shadowColor: '#f9a825',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  emoji: { fontSize: 28 },
  title: { fontSize: 13, fontWeight: '800', color: '#ffd700' },
  sub:   { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 },
  close: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginLeft: 4 },
});

const TAVERN_MIN_AGE = 3;

function TavernLockModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.card}>
          <Text style={styles.emoji}>🔒</Text>
          <Text style={styles.title}>La Taverne est fermée</Text>
          <Text style={styles.subtitle}>Fonctionnalité débloquée à l'Ère Moderne.</Text>
          <Pressable style={[styles.claimBtn, { paddingHorizontal: 28 }]} onPress={onClose}>
            <Text style={styles.claimTxt}>Compris</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

function TabsWithModal() {
  const theme = useAgeTheme();
  const { state, zoneFullQueue, dismissZoneFull } = useGameContext();
  const { hasSeenIntro, completeOnboarding } = useOnboarding();
  const tutorial = useTutorial();
  const [replayIntro, setReplayIntro] = useState(false);
  const [showTavernLock, setShowTavernLock] = useState(false);
  const tavernUnlocked = state.currentAge >= TAVERN_MIN_AGE;
  const showingOnboarding = hasSeenIntro === false || replayIntro;
  useAmbiance(state.currentAge, !showingOnboarding);

  // Bloquer la banane pendant tout le didacticiel sauf step 0
  useEffect(() => {
    setBananaLocked(tutorial.isActive && tutorial.step !== 0);
  }, [tutorial.isActive, tutorial.step]);

  return (
    <>
      <Tabs
        initialRouteName="BananaClicker"
        screenOptions={{
          tabBarActiveTintColor: theme.navActive,
          tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
          tabBarStyle: { backgroundColor: theme.navBg, borderTopColor: 'rgba(255,255,255,0.08)' },
          headerShown: false,
          tabBarButton: HapticTab,
        }}>
        <Tabs.Screen
          name="BananaClicker"
          options={{
            title: 'Banana',
            tabBarIcon: () => <Text style={{ fontSize: 22 }}>🍌</Text>,
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: 'Carte',
            tabBarIcon: () => <Text style={{ fontSize: 22 }}>🗺️</Text>,
          }}
        />
        <Tabs.Screen
          name="taverne"
          options={{
            title: 'Taverne',
            tabBarIcon: () => (
              <View style={tavernUnlocked ? undefined : tavernStyles.lockedIcon}>
                <Text style={{ fontSize: 22, opacity: tavernUnlocked ? 1 : 0.35 }}>🍺</Text>
                {!tavernUnlocked && <Text style={tavernStyles.lockBadge}>🔒</Text>}
              </View>
            ),
          }}
          listeners={{
            tabPress: (e) => {
              if (!tavernUnlocked) {
                e.preventDefault();
                setShowTavernLock(true);
              }
            },
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            title: 'Stats',
            tabBarIcon: () => <Text style={{ fontSize: 22 }}>📊</Text>,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
            tabBarIcon: () => <Text style={{ fontSize: 22 }}>👤</Text>,
          }}
        />
      </Tabs>
      <OfflineGainsModal />
      <ResetSuccessModal onReplayTutorial={() => setReplayIntro(true)} />
      <TavernLockModal visible={showTavernLock} onClose={() => setShowTavernLock(false)} />
      {(hasSeenIntro === false || replayIntro) && (
        <OnboardingFlow onComplete={() => {
          completeOnboarding();
          setReplayIntro(false);
          tutorial.start();
        }} />
      )}
      {tutorial.isActive && (
        <TutorialOverlay
          step={tutorial.step}
          onNext={tutorial.next}
          onEnd={tutorial.end}
        />
      )}
      {zoneFullQueue.length > 0 && (
        <ZoneFullToast
          key={zoneFullQueue[0]}
          zoneId={zoneFullQueue[0]}
          onDone={dismissZoneFull}
        />
      )}
    </>
  );
}

export default function TabLayout() {
  return (
    <GameProvider>
      <TabsWithModal />
    </GameProvider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  emoji:     { fontSize: 52 },
  title:     { fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center' },
  subtitle:  { fontSize: 14, color: 'rgba(255,255,255,0.55)', textAlign: 'center' },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(249,168,37,0.15)',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(249,168,37,0.4)',
    marginTop: 4,
  },
  rewardAmount: { fontSize: 32, fontWeight: '900', color: '#ffd700' },
  rewardEmoji:  { fontSize: 28 },
  claimBtn: {
    backgroundColor: '#f9a825',
    borderRadius: 14,
    paddingHorizontal: 40,
    paddingVertical: 14,
    marginTop: 8,
  },
  claimTxt: { fontSize: 18, fontWeight: '800', color: '#fff' },
  skipTutorialBtn: { paddingVertical: 8 },
  skipTutorialTxt: { fontSize: 14, color: 'rgba(255,255,255,0.35)' },
});

const tavernStyles = StyleSheet.create({
  lockedIcon: { position: 'relative' },
  lockBadge:  { position: 'absolute', right: -8, bottom: -4, fontSize: 11 },
});
