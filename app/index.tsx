import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions, ImageBackground, Linking, Modal,
  Pressable, ScrollView, StyleSheet, Switch, Text, View,
} from 'react-native';
import Animated, {
  Easing, runOnJS,
  useAnimatedStyle, useSharedValue,
  withDelay, withRepeat, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import { Image as ExpoImage } from 'expo-image';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '@/hooks/use-settings';
import { useProfile } from '@/hooks/use-profile';

const { width: SW, height: SH } = Dimensions.get('window');
const VERSION  = Constants.expoConfig?.version ?? '1.0.0';
const BG       = require('@/assets/images/backgrounds/bg_banana_clicker.png');
const LOGO     = require('@/assets/images/upgrades/age-0/singe.png');

const PARTICLES = [
  { x: 18,      delay: 0,    size: 20 },
  { x: 72,      delay: 1600, size: 16 },
  { x: 148,     delay: 900,  size: 26 },
  { x: 210,     delay: 2700, size: 18 },
  { x: SW * 0.6, delay: 500,  size: 22 },
  { x: SW - 70, delay: 1300, size: 19 },
  { x: SW - 24, delay: 2100, size: 15 },
];

// ─── Banana flottante ─────────────────────────────────────────────────────────

function FloatingBanana({ x, delay, size }: { x: number; delay: number; size: number }) {
  const ty = useSharedValue(SH * 0.65);
  const op = useSharedValue(0);

  useEffect(() => {
    const dur = 5500 + Math.random() * 3500;
    ty.value = withDelay(delay, withRepeat(withSequence(
      withTiming(SH * 0.04, { duration: dur, easing: Easing.linear }),
      withTiming(SH * 0.65, { duration: 0 }),
    ), -1));
    op.value = withDelay(delay, withRepeat(withSequence(
      withTiming(0.45, { duration: 700 }),
      withTiming(0.45, { duration: dur - 1400 }),
      withTiming(0,    { duration: 700 }),
      withTiming(0,    { duration: 0 }),
    ), -1));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }],
    opacity:   op.value,
  }));

  return (
    <Animated.Text style={[{ position: 'absolute', left: x, fontSize: size }, style]}>
      🍌
    </Animated.Text>
  );
}

// ─── Ligne de menu ────────────────────────────────────────────────────────────

function MenuRow({
  emoji, label, onPress, right,
}: { emoji: string; label: string; onPress?: () => void; right?: React.ReactNode }) {
  return (
    <Pressable style={m.row} onPress={onPress} android_ripple={{ color: 'rgba(255,255,255,0.07)' }}>
      <Text style={m.rowEmoji}>{emoji}</Text>
      <Text style={m.rowLabel}>{label}</Text>
      <View style={m.rowRight}>{right ?? <Text style={m.chevron}>›</Text>}</View>
    </Pressable>
  );
}

// ─── Panneau menu ─────────────────────────────────────────────────────────────

const CGU_TEXT = `Bienvenue dans Banana Punch.

En utilisant cette application, vous acceptez les présentes conditions d'utilisation.

1. Données — Votre progression est sauvegardée localement sur votre appareil.
2. Contenu — Le jeu est destiné à tous publics.
3. Mises à jour — Des mises à jour peuvent être envoyées automatiquement.
4. Responsabilité — L'application est fournie "telle quelle" sans garantie.

Contact : support@bananapunch.app`;

function MenuPanel({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const { settings, set } = useSettings();
  const { pseudo }        = useProfile();
  const tx      = useSharedValue(SW);
  const bgOp    = useSharedValue(0);
  const closingRef = useRef(false);
  const [showCgu, setShowCgu] = useState(false);

  useEffect(() => {
    if (visible) {
      closingRef.current = false;
      tx.value   = withSpring(0, { damping: 22, stiffness: 200 });
      bgOp.value = withTiming(1, { duration: 240 });
    }
  }, [visible]);

  function close() {
    if (closingRef.current) return;
    closingRef.current = true;
    tx.value   = withTiming(SW * 0.82, { duration: 260 });
    bgOp.value = withTiming(0, { duration: 260 }, (f) => { if (f) runOnJS(onClose)(); });
  }

  function goTo(route: string) {
    close();
    setTimeout(() => router.push(route as any), 300);
  }

  const panelStyle   = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }] }));
  const overlayStyle = useAnimatedStyle(() => ({ opacity: bgOp.value }));

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Overlay sombre */}
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.55)' }, overlayStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>

      {/* Panneau */}
      <Animated.View style={[m.panel, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }, panelStyle]}>
        {/* En-tête */}
        <View style={m.panelHeader}>
          <Text style={m.panelTitle}>Menu</Text>
          <Pressable onPress={close} style={m.closeBtn} hitSlop={12}>
            <Text style={m.closeTxt}>✕</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {/* Compte */}
          <Text style={m.section}>Compte</Text>
          <MenuRow
            emoji="👤"
            label={pseudo && pseudo !== 'Explorateur' ? pseudo : 'Mon Compte'}
            onPress={() => goTo('/(tabs)/profile')}
          />

          {/* Informations */}
          <Text style={m.section}>Informations</Text>
          <MenuRow
            emoji="📜"
            label="Conditions d'utilisation"
            onPress={() => setShowCgu(true)}
          />
          <MenuRow
            emoji="💬"
            label="Service client"
            onPress={() => Linking.openURL('mailto:support@bananapunch.app')}
          />

          {/* Paramètres */}
          <Text style={m.section}>Paramètres</Text>
          <MenuRow
            emoji="🔊"
            label="Musique d'ambiance"
            right={
              <Switch
                value={settings.musicEnabled}
                onValueChange={v => set('musicEnabled', v)}
                trackColor={{ false: '#2a2a3a', true: '#f9a825' }}
                thumbColor="#fff"
              />
            }
          />
          <MenuRow
            emoji="🔔"
            label="Effets sonores"
            right={
              <Switch
                value={settings.soundEnabled}
                onValueChange={v => set('soundEnabled', v)}
                trackColor={{ false: '#2a2a3a', true: '#f9a825' }}
                thumbColor="#fff"
              />
            }
          />
        </ScrollView>

        <Text style={m.version}>Banana Punch v{VERSION}</Text>
      </Animated.View>

      {/* Modal CGU */}
      <Modal visible={showCgu} transparent animationType="fade" onRequestClose={() => setShowCgu(false)}>
        <View style={m.cguOverlay}>
          <View style={m.cguCard}>
            <Text style={m.cguTitle}>Conditions d'utilisation</Text>
            <ScrollView style={{ maxHeight: SH * 0.55 }}>
              <Text style={m.cguText}>{CGU_TEXT}</Text>
            </ScrollView>
            <Pressable style={m.cguBtn} onPress={() => setShowCgu(false)}>
              <Text style={m.cguBtnTxt}>Fermer</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Écran d'accueil ──────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);

  const logoScale  = useSharedValue(0);
  const titleOp    = useSharedValue(0);
  const titleTy    = useSharedValue(24);
  const btnOp      = useSharedValue(0);
  const btnScale   = useSharedValue(0.85);
  const pulse      = useSharedValue(1);

  useEffect(() => {
    logoScale.value = withDelay(150, withSpring(1, { damping: 11, stiffness: 90 }));
    titleOp.value   = withDelay(550, withTiming(1, { duration: 500 }));
    titleTy.value   = withDelay(550, withTiming(0, { duration: 500 }));
    btnOp.value     = withDelay(1050, withTiming(1, { duration: 400 }));
    btnScale.value  = withDelay(1050, withSpring(1, { damping: 13 }));
    pulse.value     = withDelay(1500, withRepeat(withSequence(
      withTiming(1.055, { duration: 850, easing: Easing.inOut(Easing.sin) }),
      withTiming(1,     { duration: 850, easing: Easing.inOut(Easing.sin) }),
    ), -1));
  }, []);

  const logoStyle  = useAnimatedStyle(() => ({ transform: [{ scale: logoScale.value }] }));
  const titleStyle = useAnimatedStyle(() => ({ opacity: titleOp.value, transform: [{ translateY: titleTy.value }] }));
  const btnStyle   = useAnimatedStyle(() => ({
    opacity:   btnOp.value,
    transform: [{ scale: btnScale.value * pulse.value }],
  }));

  function play() {
    router.push('/(tabs)/BananaClicker' as any);
  }

  return (
    <ImageBackground source={BG} style={s.bg} resizeMode="cover">
      <View style={s.overlay} />

      {/* Bananes flottantes */}
      {PARTICLES.map((p, i) => <FloatingBanana key={i} {...p} />)}

      {/* Bouton hamburger */}
      <Pressable
        style={[s.menuBtn, { top: insets.top + 10 }]}
        onPress={() => setMenuOpen(true)}
        hitSlop={14}
      >
        <Text style={s.menuIcon}>≡</Text>
      </Pressable>

      {/* Contenu principal */}
      <View style={s.content}>
        {/* Logo */}
        <Animated.View style={[s.logoWrap, logoStyle]}>
          <ExpoImage source={LOGO} style={s.logo} contentFit="contain" />
        </Animated.View>

        {/* Titre */}
        <Animated.View style={[s.titleWrap, titleStyle]}>
          <Text style={s.title}>BANANA PUNCH</Text>
          <Text style={s.subtitle}>L'empire des bananes</Text>
        </Animated.View>

        {/* Bouton Jouer */}
        <Animated.View style={[s.playWrap, btnStyle]}>
          <Pressable style={s.playBtn} onPress={play}>
            <Text style={s.playTxt}>▶  JOUER</Text>
          </Pressable>
        </Animated.View>
      </View>

      {/* Panneau menu */}
      {menuOpen && <MenuPanel visible={menuOpen} onClose={() => setMenuOpen(false)} />}
    </ImageBackground>
  );
}

// ─── Styles écran ─────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  bg:      { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(4,8,20,0.52)' },

  menuBtn:  { position: 'absolute', right: 18, zIndex: 10, padding: 6 },
  menuIcon: { fontSize: 30, color: '#fff', fontWeight: '700', lineHeight: 34 },

  content: {
    flex: 1, alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: '12%',
  },

  logoWrap: {
    width: 110, height: 110, borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#f9a825', shadowOpacity: 0.6,
    shadowRadius: 20, shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  logo: { width: '100%', height: '100%' },

  titleWrap: { alignItems: 'center', gap: 8 },
  title: {
    fontSize: 38, fontWeight: '900', color: '#ffd700',
    letterSpacing: 3,
    textShadowColor: 'rgba(249,168,37,0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  subtitle: {
    fontSize: 15, fontWeight: '500',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 1.5,
  },

  playWrap: { alignItems: 'center', gap: 14 },
  playBtn: {
    backgroundColor: '#f9a825',
    borderRadius: 18,
    paddingHorizontal: 52, paddingVertical: 16,
    shadowColor: '#f9a825', shadowOpacity: 0.7,
    shadowRadius: 16, shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  playTxt: { fontSize: 22, fontWeight: '900', color: '#0a0a0a', letterSpacing: 2 },
  tapHint: { fontSize: 12, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.8 },
});

// ─── Styles panneau menu ──────────────────────────────────────────────────────

const m = StyleSheet.create({
  panel: {
    position: 'absolute', right: 0, top: 0, bottom: 0,
    width: SW * 0.80,
    backgroundColor: '#0c0d1a',
    borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000', shadowOpacity: 0.5,
    shadowRadius: 20, shadowOffset: { width: -4, height: 0 },
    elevation: 20,
  },

  panelHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)',
    marginBottom: 8,
  },
  panelTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  closeBtn:   { padding: 6 },
  closeTxt:   { fontSize: 18, color: 'rgba(255,255,255,0.4)' },

  section: {
    fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1.2, textTransform: 'uppercase',
    paddingHorizontal: 20, marginTop: 22, marginBottom: 4,
  },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
    gap: 14,
  },
  rowEmoji: { fontSize: 20, width: 28, textAlign: 'center' },
  rowLabel: { flex: 1, fontSize: 15, color: '#ebebeb', fontWeight: '500' },
  rowRight: { minWidth: 28, alignItems: 'flex-end' },
  chevron:  { fontSize: 22, color: 'rgba(255,255,255,0.25)', marginRight: -4 },

  version: {
    textAlign: 'center', fontSize: 12,
    color: 'rgba(255,255,255,0.2)', marginTop: 12,
  },

  // CGU modal
  cguOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  cguCard: {
    backgroundColor: '#12131f', borderRadius: 20, padding: 24,
    width: '100%', gap: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  cguTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  cguText:  { fontSize: 14, lineHeight: 22, color: 'rgba(255,255,255,0.7)' },
  cguBtn: {
    backgroundColor: '#f9a825', borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
  },
  cguBtnTxt: { fontSize: 15, fontWeight: '800', color: '#0a0a0a' },
});
