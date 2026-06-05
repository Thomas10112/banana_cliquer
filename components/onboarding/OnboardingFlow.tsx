import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions, KeyboardAvoidingView, Modal, Platform,
  Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import Animated, {
  runOnJS, useAnimatedStyle, useSharedValue,
  withDelay, withRepeat, withSequence, withSpring, withTiming, Easing,
} from 'react-native-reanimated';
import { useAudioPlayer } from 'expo-audio';
import { useProfile } from '@/hooks/use-profile';

const { width: SW, height: SH } = Dimensions.get('window');
const FADE_MS = 350;

// ─── Helper : texte en fondu ──────────────────────────────────────────────────

function FadeText({ text, delay = 0, large, small, accent }: {
  text: string; delay?: number;
  large?: boolean; small?: boolean; accent?: boolean;
}) {
  const op = useSharedValue(0);
  const ty = useSharedValue(8);
  useEffect(() => {
    op.value = withDelay(delay, withTiming(1, { duration: 500 }));
    ty.value = withDelay(delay, withTiming(0, { duration: 500 }));
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: op.value, transform: [{ translateY: ty.value }],
  }));
  const txtStyle = accent ? s.accentTxt : large ? s.largeTxt : s.smallTxt;
  return <Animated.Text style={[txtStyle, style]}>{text}</Animated.Text>;
}

// ─── Scène 0 : Le Robot ───────────────────────────────────────────────────────

function SceneRobot() {
  const scale = useSharedValue(0);
  const op    = useSharedValue(0);
  const glow  = useSharedValue(0.4);

  useEffect(() => {
    op.value    = withTiming(1, { duration: 600 });
    scale.value = withSpring(1, { damping: 10, stiffness: 120 });
    glow.value  = withRepeat(withSequence(
      withTiming(1,   { duration: 1000 }),
      withTiming(0.4, { duration: 1000 }),
    ), -1);
  }, []);

  const robotStyle = useAnimatedStyle(() => ({ opacity: op.value, transform: [{ scale: scale.value }] }));
  const glowStyle  = useAnimatedStyle(() => ({ opacity: glow.value }));

  return (
    <View style={s.sceneCenter}>
      <Animated.View style={[s.glowRing, glowStyle]} />
      <Animated.Text style={[{ fontSize: 96 }, robotStyle]}>🤖</Animated.Text>
      <View style={s.badgeRow}>
        <View style={s.unitBadge}><Text style={s.unitTxt}>UNIT-2157</Text></View>
      </View>
      <FadeText delay={700}  text="Ligne sécurisée. Chiffrement actif." large />
      <FadeText delay={1400} text="Je suis UNIT-2157." large />
      <FadeText delay={2000} text="Système de voyage temporel — année 2157." small />
    </View>
  );
}

// ─── Scène 1 : Le cosmos ──────────────────────────────────────────────────────

function Star({ x, y, delay }: { x: number; y: number; delay: number }) {
  const op = useSharedValue(0);
  useEffect(() => {
    op.value = withDelay(delay, withRepeat(withSequence(
      withTiming(1,   { duration: 700 }),
      withTiming(0.1, { duration: 700 }),
    ), -1));
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: op.value }));
  return <Animated.Text style={[{ position: 'absolute', left: x, top: y, fontSize: 10, color: '#fff' }, style]}>✦</Animated.Text>;
}

const STARS = Array.from({ length: 22 }, (_, i) => ({
  x: (i * 137.5) % SW,
  y: (i * 97.3) % (SH * 0.75),
  delay: i * 110,
}));

function SceneCosmos() {
  return (
    <View style={StyleSheet.absoluteFill}>
      {STARS.map((st, i) => <Star key={i} x={st.x} y={st.y} delay={st.delay} />)}
      <View style={s.sceneCenter}>
        <FadeText delay={300}  text="En 2157, les intelligences artificielles" large />
        <FadeText delay={1000} text="contrôlent toutes les ressources mondiales." large />
        <FadeText delay={2000} text="Y compris la plus précieuse d'entre elles." small />
        <FadeText delay={2700} text="La banane." accent />
      </View>
    </View>
  );
}

// ─── Scène 2 : La banane tombe ────────────────────────────────────────────────

const BANANA_ANGLES = [0, 60, 120, 180, 240, 300];

function OrbBanana({ angle, delay }: { angle: number; delay: number }) {
  const o = useSharedValue(0);
  const ox = Math.cos((angle * Math.PI) / 180) * 80;
  const oy = Math.sin((angle * Math.PI) / 180) * 60;

  useEffect(() => {
    o.value = withDelay(delay, withSpring(1, { damping: 8 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity:   o.value,
    transform: [
      { translateX: ox * o.value },
      { translateY: oy * o.value },
      { scale: 0.5 + 0.5 * o.value },
    ],
  }));
  return (
    <Animated.Text style={[{ position: 'absolute', fontSize: 30 }, style]}>🍌</Animated.Text>
  );
}

function SceneBanana() {
  const ty     = useSharedValue(-SH * 0.45);
  const squash = useSharedValue(1);

  useEffect(() => {
    ty.value = withTiming(0, { duration: 750, easing: Easing.in(Easing.quad) }, () => {
      squash.value = withSequence(
        withTiming(0.65, { duration: 110 }),
        withSpring(1, { damping: 6 }),
      );
    });
  }, []);

  const bananaStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }, { scaleY: squash.value }],
  }));

  return (
    <View style={s.sceneCenter}>
      <View style={{ width: 200, height: 200, alignItems: 'center', justifyContent: 'center' }}>
        {BANANA_ANGLES.map((angle, i) => (
          <OrbBanana key={i} angle={angle} delay={800 + i * 90} />
        ))}
        <Animated.Text style={[{ fontSize: 96 }, bananaStyle]}>🍌</Animated.Text>
      </View>
      <FadeText delay={1100} text="Celui qui contrôle les bananes" large />
      <FadeText delay={1800} text="contrôle l'humanité." large />
      <FadeText delay={2600} text="C'est ainsi que les IA ont pris le pouvoir." small />
    </View>
  );
}

// ─── Scène 3 : Les singes collectent ─────────────────────────────────────────

function FloatBanana({ fromX, delay }: { fromX: number; delay: number }) {
  const ty = useSharedValue(0);
  const op = useSharedValue(0);

  useEffect(() => {
    // Cycle de 2000ms : monte en 1600ms + pause 400ms
    ty.value = withDelay(delay, withRepeat(withSequence(
      withTiming(-170, { duration: 1600, easing: Easing.out(Easing.cubic) }),
      withTiming(0,    { duration: 0 }),
      withTiming(0,    { duration: 400 }),
    ), -1));
    // Cycle de 2000ms : visible 1000ms, fondu 600ms, pause 400ms
    op.value = withDelay(delay, withRepeat(withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(1, { duration: 800 }),
      withTiming(0, { duration: 600 }),
      withTiming(0, { duration: 400 }),
    ), -1));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ translateX: fromX }, { translateY: ty.value }],
  }));
  return <Animated.Text style={[{ position: 'absolute', bottom: 90, fontSize: 28 }, style]}>🍌</Animated.Text>;
}

function Monkey({ offset, delay }: { offset: number; delay: number }) {
  const tx     = useSharedValue(offset > 0 ? SW / 2 : -SW / 2);
  const bounce = useSharedValue(0);

  useEffect(() => {
    tx.value = withDelay(delay, withSpring(offset, { damping: 12 }));
    bounce.value = withDelay(delay + 500, withRepeat(withSequence(
      withTiming(-8, { duration: 350 }),
      withTiming(0,  { duration: 350 }),
    ), -1));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: bounce.value }],
  }));
  return <Animated.Text style={[{ fontSize: 56, position: 'absolute' }, style]}>🐒</Animated.Text>;
}

function SceneMonkeys() {
  return (
    <View style={s.sceneCenter}>
      <FadeText delay={200}  text="Pour changer le futur," large />
      <FadeText delay={900}  text="je dois changer le passé." large />

      <View style={{ height: 160, width: SW * 0.85, position: 'relative', alignItems: 'center' }}>
        <Monkey offset={-90} delay={300} />
        <Monkey offset={0}   delay={500} />
        <Monkey offset={90}  delay={200} />

        <FloatBanana fromX={-90} delay={800}  />
        <FloatBanana fromX={-90} delay={1700} />
        <FloatBanana fromX={0}   delay={400}  />
        <FloatBanana fromX={0}   delay={1300} />
        <FloatBanana fromX={90}  delay={600}  />
        <FloatBanana fromX={90}  delay={1500} />
      </View>

      <FadeText delay={2200} text="Quelqu'un doit bâtir l'empire bananier avant qu'elles arrivent au pouvoir." small />
    </View>
  );
}

// ─── Scène 4 : C'est vous ────────────────────────────────────────────────────

function SceneYou() {
  const scale = useSharedValue(0.7);
  const op    = useSharedValue(0);

  useEffect(() => {
    op.value    = withTiming(1, { duration: 500 });
    scale.value = withSpring(1, { damping: 12 });
  }, []);

  const style = useAnimatedStyle(() => ({ opacity: op.value, transform: [{ scale: scale.value }] }));

  return (
    <View style={s.sceneCenter}>
      <Animated.Text style={[{ fontSize: 80 }, style]}>🤖</Animated.Text>
      <FadeText delay={500}  text="J'ai analysé des millions de trajectoires." large />
      <FadeText delay={1200} text="Une seule personne peut tout changer." large />
      <FadeText delay={2000} text="C'est vous." accent />
    </View>
  );
}

// ─── Scène 5 : Limitation + Rendez-vous ──────────────────────────────────────

function SceneMission() {
  const op = useSharedValue(0);

  useEffect(() => {
    op.value = withTiming(1, { duration: 600 });
  }, []);

  const style = useAnimatedStyle(() => ({ opacity: op.value }));

  return (
    <View style={s.sceneCenter}>
      <Animated.Text style={[{ fontSize: 60 }, style]}>⚠️</Animated.Text>
      <FadeText delay={500}  text="Notre technologie ne nous permet pas" large />
      <FadeText delay={1100} text="d'interférer avec le passé." large />
      <FadeText delay={1900} text="Je ne peux que vous parler." small />
      <FadeText delay={2500} text="Agir... c'est votre rôle." small />
      <FadeText delay={3400} text="Nous nous retrouverons en 2157." accent />
    </View>
  );
}

// ─── Scène 6 : Saisie du nom ─────────────────────────────────────────────────

function SceneName({ onComplete }: { onComplete: () => void }) {
  const { pseudo: saved, setPseudo } = useProfile();
  const [name, setName] = useState('');
  const op = useSharedValue(0);

  // Sync quand AsyncStorage charge le pseudo sauvegardé
  useEffect(() => {
    if (saved && saved !== 'Explorateur') setName(saved);
  }, [saved]);

  useEffect(() => { op.value = withTiming(1, { duration: 600 }); }, []);
  const style = useAnimatedStyle(() => ({ opacity: op.value }));

  function confirm() {
    const pseudo = name.trim() || 'Explorateur';
    setPseudo(pseudo);
    onComplete();
  }

  return (
    <Animated.View style={[s.sceneCenter, { gap: 20 }, style]}>
      <Text style={{ fontSize: 72 }}>🤖</Text>
      <Text style={s.nameQuestion}>Mais avant de commencer…{'\n'}comment vous appelez-vous ?</Text>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%', gap: 12 }}>
        <TextInput
          style={s.input}
          placeholder="Ton nom ou pseudo"
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={name}
          onChangeText={setName}
          maxLength={24}
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={confirm}
        />
        <Pressable style={s.startBtn} onPress={confirm}>
          <Text style={s.startBtnTxt}>Commencer l'aventure →</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

// ─── Composants de scènes ────────────────────────────────────────────────────

const SCENES = [SceneRobot, SceneCosmos, SceneBanana, SceneMonkeys, SceneYou, SceneMission];
const TOTAL  = SCENES.length + 1; // +1 pour la scène nom

// ─── OnboardingFlow ───────────────────────────────────────────────────────────

interface Props { onComplete: () => void }

const FADE_OUT_MS  = 800;
const FADE_STEPS   = 20;

export function OnboardingFlow({ onComplete }: Props) {
  const [scene, setScene] = useState(0);
  const screenOp  = useSharedValue(1);
  const music     = useAudioPlayer(require('@/assets/sounds/ambiances/music_tutorial_slide.mp3'));
  const fadingRef = useRef(false);
  const pausedRef = useRef(false);

  useEffect(() => {
    music.loop   = true;
    music.volume = 1;
    music.play();
    return () => { if (!pausedRef.current) music.pause(); };
  }, []);

  function fadeOutAndComplete() {
    if (fadingRef.current) return;
    fadingRef.current = true;
    const stepMs = FADE_OUT_MS / FADE_STEPS;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      music.volume = Math.max(0, 1 - step / FADE_STEPS);
      if (step >= FADE_STEPS) {
        clearInterval(timer);
        pausedRef.current = true;
        music.pause();
        onComplete();
      }
    }, stepMs);
  }

  const isNameScene = scene === SCENES.length;

  function goToScene(next: number) {
    screenOp.value = withTiming(0, { duration: FADE_MS }, () => {
      runOnJS(setScene)(next);
      screenOp.value = withTiming(1, { duration: FADE_MS });
    });
  }

  function handleTap() {
    if (isNameScene) return;
    const next = scene + 1;
    if (next <= SCENES.length) goToScene(next);
  }

  const screenStyle = useAnimatedStyle(() => ({ opacity: screenOp.value }));
  const SceneComponent = SCENES[scene];

  return (
    <Modal visible animationType="fade" statusBarTranslucent>
      <View style={s.root}>

        {/* Skip */}
        {!isNameScene && (
          <Pressable style={s.skip} onPress={() => goToScene(SCENES.length)}>
            <Text style={s.skipTxt}>Passer →</Text>
          </Pressable>
        )}

        {/* Contenu de la scène */}
        <Pressable style={{ flex: 1, width: '100%' }} onPress={handleTap}>
          <Animated.View style={[{ flex: 1 }, screenStyle]}>
            {isNameScene
              ? <SceneName onComplete={fadeOutAndComplete} />
              : <SceneComponent />
            }
          </Animated.View>
        </Pressable>

        {/* Hint tap + points */}
        {!isNameScene && (
          <View style={s.footer}>
            <Text style={s.tapHint}>Tape pour continuer</Text>
            <View style={s.dots}>
              {Array.from({ length: TOTAL }).map((_, i) => (
                <View key={i} style={[s.dot, i === scene && s.dotActive]} />
              ))}
            </View>
          </View>
        )}

      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#06060f' },

  skip:    { position: 'absolute', top: 56, right: 20, zIndex: 10 },
  skipTxt: { fontSize: 13, color: 'rgba(255,255,255,0.3)' },

  footer:  { alignItems: 'center', gap: 10, paddingBottom: 40 },
  tapHint: { fontSize: 12, color: 'rgba(255,255,255,0.22)' },
  dots:    { flexDirection: 'row', gap: 6 },
  dot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.15)' },
  dotActive: { backgroundColor: '#ce93d8', width: 20 },

  sceneCenter: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 28, gap: 14,
  },

  // Robot
  glowRing: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(206,147,216,0.12)',
    borderWidth: 1, borderColor: 'rgba(206,147,216,0.35)',
  },
  badgeRow: { flexDirection: 'row' },
  unitBadge: {
    borderWidth: 1, borderColor: '#ce93d8', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 4,
  },
  unitTxt: { fontSize: 13, fontWeight: '800', color: '#ce93d8', letterSpacing: 1 },

  // Textes
  largeTxt:  { fontSize: 22, fontWeight: '700', color: '#fff', textAlign: 'center', lineHeight: 30 },
  smallTxt:  { fontSize: 15, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
  accentTxt: { fontSize: 30, fontWeight: '900', color: '#ffd700', textAlign: 'center' },

  // Nom
  nameQuestion: {
    fontSize: 18, lineHeight: 26, textAlign: 'center',
    color: 'rgba(255,255,255,0.85)', fontWeight: '500',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14, padding: 16, fontSize: 18, color: '#fff',
    textAlign: 'center', fontWeight: '600',
    borderWidth: 1, borderColor: 'rgba(206,147,216,0.4)',
  },
  startBtn: {
    backgroundColor: '#ce93d8', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  startBtnTxt: { fontSize: 16, fontWeight: '800', color: '#06060f' },
});
