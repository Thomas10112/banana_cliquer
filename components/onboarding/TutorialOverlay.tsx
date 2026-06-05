import React, { useEffect, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useProfile } from '@/hooks/use-profile';
import { useGameContext } from '@/store/game-context';
import { measureTutorialElement, onTutorialEvent, offTutorialEvent, TutorialKey } from '@/utils/tutorial-refs';
import type { ElementRect, TutorialEvent } from '@/utils/tutorial-refs';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Définition des steps ─────────────────────────────────────────────────────

interface TutStep {
  text:         string;
  bubble:       'top' | 'bottom' | 'center';
  elementKey?:  TutorialKey;   // mesure la vraie position de l'élément
  arrowDir?:    'up' | 'down';
  tab?:         '/(tabs)/BananaClicker' | '/(tabs)/map';
  btnLabel?:    string;
  isLast?:      boolean;
  accentColor?: string;
  requireTap?:  boolean;
  spotlight?:   boolean;
  autoAdvance?: 'bananaClick' | 'firstUpgradeBought' | TutorialEvent;
  dimOpacity?:  number; // opacité du fond sombre (défaut 0.78)
}

const STEPS: TutStep[] = [
  // ── BananaClicker ────────────────────────────────────────────────────────────
  {
    text: "Voilà ta banane.\nTape dessus pour collecter tes premières 🍌 !",
    bubble: 'bottom', arrowDir: 'up',
    elementKey: 'banana',
    tab: '/(tabs)/BananaClicker',
    spotlight: true,
    autoAdvance: 'bananaClick',
  },
  {
    text: "Tes bananes s'accumulent ici en haut.\nEn dessous : ta production automatique par seconde.\nCette valeur augmentera à chaque amélioration achetée.",
    bubble: 'bottom', arrowDir: 'up',
    elementKey: 'statsBar',
    spotlight: true,
  },
  {
    text: "Voici l'onglet Améliorations.\n👆 Tape-le pour l'ouvrir.",
    bubble: 'top', arrowDir: 'down',
    elementKey: 'upgradesTab',
    autoAdvance: 'upgradesTabOpened',
  },
  {
    text: "Voici ta première amélioration : le Singe 🐒\nJe te transfère 50 🍌 depuis 2157.\n👆 Achètes-en un pour voir !",
    bubble: 'top', arrowDir: 'down',
    elementKey: 'firstUpgrade',
    spotlight: true,
    autoAdvance: 'firstUpgradeBought',
  },
  {
    text: "Tu vois ? Ta production par seconde a augmenté !\nPlus tu achètes d'améliorations,\nplus les 🍌 s'accumulent vite.",
    bubble: 'bottom', arrowDir: 'up',
    elementKey: 'statsBar',
    spotlight: true,
  },
  {
    text: "Maintenant l'onglet Quêtes.\n👆 Tape-le pour l'ouvrir.",
    bubble: 'top', arrowDir: 'down',
    elementKey: 'questsTab',
    accentColor: '#ffd700',
    autoAdvance: 'questsTabOpened',
  },
  {
    text: "Les quêtes débloquent tes améliorations une par une.\nSans quête complétée → pas de migration.\nSans migration → tu restes bloqué à cet âge.",
    bubble: 'top',
    elementKey: 'questsPanel',
    accentColor: '#ffd700',
  },
  {
    text: "⚠️ RETIENS ÇA :\n\nSans quête complétée → pas de migration.\nSans migration → tu restes bloqué au même âge.\n\nLes quêtes sont ta priorité absolue.",
    bubble: 'center',
    accentColor: '#ffd700',
  },
  {
    text: "Tu peux aussi migrer vers un âge supérieur.\nChaque migration te fait recommencer de zéro,\nmais avec des bonus permanents qui s'accumulent.",
    bubble: 'center',
  },
  {
    text: "Maintenant, explorons la Carte du monde.\nC'est là que tu conquiers des territoires\npour des bonus permanents.",
    bubble: 'center', btnLabel: 'Explorer la Carte →',
    tab: '/(tabs)/map',
  },

  // ── Carte du monde ────────────────────────────────────────────────────────────
  {
    text: "Bienvenue sur la Carte du monde.\nPince pour zoomer, glisse pour explorer.",
    bubble: 'bottom',
    elementKey: 'mapArea',
    spotlight: true, dimOpacity: 0.45,
    tab: '/(tabs)/map',
  },
  {
    text: "Ces marqueurs sont des territoires à conquérir.\nTape-en un pour voir son coût et ses bonus.",
    bubble: 'bottom', arrowDir: 'up',
    elementKey: 'firstPoi',
    spotlight: true, dimOpacity: 0.50,
  },
  {
    text: "Une fois conquis, il te donne un bonus PERMANENT.\nBPS ou 🍌 par clic — les deux se cumulent.\nTu peux l'améliorer jusqu'à 3 fois.",
    bubble: 'center',
  },
  {
    text: "Ce bouton 📋 liste tous tes territoires\net te permet d'acheter des transports.",
    bubble: 'bottom', arrowDir: 'up',
    elementKey: 'mapPanelBtn',
    spotlight: true, dimOpacity: 0.55,
  },
  {
    text: "Les transports (🐋 ⛵ 🚂 ✈️ 🛸) changent selon ton âge.\nIls voyagent entre tes zones conquises\net y déposent des 🍌. Reviens les récolter !",
    bubble: 'center',
  },
  {
    text: "Les bulles aux bords de l'écran ← →\nindiquent les zones hors-champ.\nTape-les pour y aller directement.",
    bubble: 'bottom',
  },
  {
    text: "Tu es prêt.\nL'aventure de l'humanité commence maintenant.",
    bubble: 'center', isLast: true, btnLabel: "C'est parti ! 🍌",
    accentColor: '#f9a825',
  },
];

// ─── Flèche animée ────────────────────────────────────────────────────────────

function Arrow({ dir, color }: { dir: 'up' | 'down'; color: string }) {
  const ty = useSharedValue(0);
  useEffect(() => {
    ty.value = withRepeat(
      withSequence(
        withTiming(dir === 'up' ? -10 : 10, { duration: 500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 500, easing: Easing.inOut(Easing.sin) }),
      ), -1,
    );
  }, [dir]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: ty.value }] }));
  return (
    <Animated.Text style={[{ fontSize: 32, color, textAlign: 'center' }, style]}>
      {dir === 'up' ? '👆' : '👇'}
    </Animated.Text>
  );
}

// ─── Cadre lumineux ───────────────────────────────────────────────────────────

function HighlightFrame({ r, color }: { r: ElementRect; color: string }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left:   r.x,
        top:    r.y,
        width:  r.width,
        height: r.height,
        borderWidth: 2,
        borderColor: color,
        borderRadius: 14,
        backgroundColor: `${color}18`,
      }}
    />
  );
}

// ─── Spotlight (4 bandes noires autour d'un trou visible) ────────────────────

function SpotlightOverlay({ r, color, dimOpacity = 0.78 }: { r: ElementRect; color: string; dimOpacity?: number }) {
  const lx = r.x;
  const ty = r.y;
  const rw = r.width;
  const rh = r.height;
  const bg = `rgba(0,0,0,${dimOpacity})`;

  // Animation de pulsation sur la bordure
  const glow = useSharedValue(0.6);
  useEffect(() => {
    glow.value = withRepeat(withSequence(
      withTiming(1,   { duration: 800 }),
      withTiming(0.6, { duration: 800 }),
    ), -1);
  }, []);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  return (
    <>
      <View pointerEvents="none" style={{ position: 'absolute', left: 0,    top: 0,     width: SW,        height: ty,           backgroundColor: bg }} />
      <View pointerEvents="none" style={{ position: 'absolute', left: 0,    top: ty+rh, width: SW,        height: SH - ty - rh, backgroundColor: bg }} />
      <View pointerEvents="none" style={{ position: 'absolute', left: 0,    top: ty,    width: lx,        height: rh,           backgroundColor: bg }} />
      <View pointerEvents="none" style={{ position: 'absolute', left: lx+rw, top: ty,   width: SW-lx-rw,  height: rh,           backgroundColor: bg }} />
      {/* Fill teinté à l'intérieur du trou */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute', left: lx, top: ty, width: rw, height: rh,
          backgroundColor: `${color}18`, borderRadius: 14,
        }}
      />
      {/* Bordure lumineuse pulsée */}
      <Animated.View
        pointerEvents="none"
        style={[{
          position: 'absolute', left: lx, top: ty, width: rw, height: rh,
          borderWidth: 3, borderColor: color, borderRadius: 14,
          shadowColor: color, shadowRadius: 12, shadowOpacity: 1,
          shadowOffset: { width: 0, height: 0 }, elevation: 10,
        }, glowStyle]}
      />
    </>
  );
}

// ─── Bulle du robot ───────────────────────────────────────────────────────────

function RobotBubble({ step, onNext, onSkip, pseudo, bottomOffset = 80 }: {
  step:         TutStep;
  onNext:       () => void;
  onSkip:       () => void;
  pseudo:       string;
  bottomOffset?: number;
}) {
  const accent = step.accentColor ?? '#ce93d8';
  const isCenter = step.bubble === 'center';
  const isBottom = step.bubble === 'bottom';

  const bubbleStyle = isCenter
    ? [s.bubble, s.bubbleCenter]
    : isBottom
      ? [s.bubble, { bottom: bottomOffset }]
      : [s.bubble, s.bubbleTop];

  const text = step.isLast
    ? `${step.text}\n\nBonne chance, ${pseudo}. 🍌`
    : step.text;

  return (
    <View style={bubbleStyle} pointerEvents="box-none">
      {/* Arrow above bubble (when bubble is at bottom, arrow points up above it) */}
      {step.arrowDir && step.bubble === 'bottom' && (
        <Arrow dir="up" color={accent} />
      )}

      <View style={[s.card, { borderColor: accent }]}>
        <View style={s.cardHeader}>
          <Text style={s.robotEmoji}>🤖</Text>
          <View style={[s.badge, { borderColor: accent }]}>
            <Text style={[s.badgeTxt, { color: accent }]}>UNIT-2157</Text>
          </View>
        </View>
        <Text style={s.cardText}>{text}</Text>
        <View style={s.cardFooter}>
          <Pressable style={s.skipBtn} onPress={onSkip}>
            <Text style={s.skipTxt}>Passer</Text>
          </Pressable>
          {(!step.autoAdvance || step.autoAdvance === 'bananaClick') && (
            <Pressable style={[s.nextBtn, { backgroundColor: accent }]} onPress={onNext}>
              <Text style={s.nextTxt}>{step.btnLabel ?? 'Continuer →'}</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Arrow below bubble (when bubble is at top, arrow points down below it) */}
      {step.arrowDir && step.bubble === 'top' && (
        <Arrow dir="down" color={accent} />
      )}
    </View>
  );
}

// ─── TutorialOverlay ─────────────────────────────────────────────────────────

interface Props {
  step:   number;
  onNext: () => void;
  onEnd:  () => void;
}

const TAB_BAR_H = 60; // hauteur approximative de la tab bar

export function TutorialOverlay({ step, onNext, onEnd }: Props) {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { pseudo } = useProfile();
  const { state, giftBananas } = useGameContext();
  const bubbleBottomOffset = insets.bottom + TAB_BAR_H + 8;
  const tutStep    = STEPS[step];
  const [rect, setRect] = useState<ElementRect | null>(null);

  const accent = tutStep?.accentColor ?? '#ce93d8';

  // Mesure l'élément réel + cadeaux tutorial à chaque changement de step
  useEffect(() => {
    setRect(null);
    // Donner des bananes gratuites au step firstUpgrade
    if (tutStep?.autoAdvance === 'firstUpgradeBought') {
      giftBananas(50);
    }
    if (!tutStep?.elementKey) return;
    const timer = setTimeout(async () => {
      const measured = await measureTutorialElement(tutStep.elementKey!, 12);
      if (measured) setRect(measured);
    }, 200);
    return () => clearTimeout(timer);
  }, [step]);

  function doEnd() {
    router.navigate('/(tabs)/BananaClicker' as any);
    onEnd();
  }

  function handleNext() {
    if (!tutStep) return;
    if (tutStep.isLast) { doEnd(); return; }
    const nextStep = STEPS[step + 1];
    if (nextStep?.tab && nextStep.tab !== tutStep.tab) {
      router.navigate(nextStep.tab as any);
    }
    onNext();
  }

  // Auto-avance sur événement banane
  useEffect(() => {
    if (tutStep?.autoAdvance === 'bananaClick' && state.totalBananas > 0) {
      handleNext();
    }
  }, [state.totalBananas]);

  // Auto-avance quand le premier upgrade est acheté
  const totalUpgrades = Object.values(state.upgrades).reduce((a, b) => a + b, 0);
  useEffect(() => {
    if (tutStep?.autoAdvance === 'firstUpgradeBought' && totalUpgrades > 0) {
      handleNext();
    }
  }, [totalUpgrades]);

  // Auto-avance sur événements tutorial (onglets)
  useEffect(() => {
    const ev = tutStep?.autoAdvance;
    if (!ev || ev === 'bananaClick') return;
    onTutorialEvent(ev as TutorialEvent, handleNext);
    return () => offTutorialEvent(ev as TutorialEvent);
  }, [step]);

  if (!tutStep) return null;

  const hasRect = !!rect;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">

      {/* Overlay : spotlight ou fond plein */}
      {tutStep.spotlight && hasRect
        ? <SpotlightOverlay r={rect!} color={accent} dimOpacity={tutStep.dimOpacity} />
        : <View style={s.overlay} pointerEvents="none" />
      }

      {/* Cadre lumineux (non-spotlight avec rect mesuré) */}
      {hasRect && !tutStep.spotlight && (
        <HighlightFrame r={rect!} color={accent} />
      )}

      {/* Bulle robot — pour tous les steps sauf bananaClick (qui n'a que "Passer") */}
      {tutStep.autoAdvance !== 'bananaClick' && (
        <RobotBubble step={tutStep} onNext={handleNext} onSkip={doEnd} pseudo={pseudo} bottomOffset={bubbleBottomOffset} />
      )}

      {/* Hint minimal pour le step banane (spotlight sans bulle) */}
      {tutStep.autoAdvance === 'bananaClick' && (
        <View style={[s.spotlightBubble, { bottom: bubbleBottomOffset }]} pointerEvents="box-none">
          <View style={[s.card, { borderColor: accent }]}>
            <View style={s.cardHeader}>
              <Text style={s.robotEmoji}>🤖</Text>
              <View style={[s.badge, { borderColor: accent }]}>
                <Text style={[s.badgeTxt, { color: accent }]}>UNIT-2157</Text>
              </View>
            </View>
            <Text style={s.cardText}>{tutStep.text}</Text>
            <View style={{ alignItems: 'flex-end' }}>
              <Pressable style={s.skipBtn} onPress={doEnd}>
                <Text style={s.skipTxt}>Passer</Text>
              </Pressable>
            </View>
          </View>
          {hasRect && <Arrow dir="up" color={accent} />}
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const BUBBLE_H = SH * 0.34;

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.78)',
  },

  spotlightBubble: { position: 'absolute', left: 12, right: 12, gap: 6 },
  bubble:          { position: 'absolute', left: 12, right: 12, gap: 6 },
  bubbleTop:    { top: 56 },
  bubbleCenter: { top: SH / 2 - BUBBLE_H / 2 },

  card: {
    backgroundColor: '#0f0f2a',
    borderRadius: 20, borderWidth: 1.5,
    padding: 18, gap: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  robotEmoji: { fontSize: 30 },
  badge:      { borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  badgeTxt:   { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  cardText:   { fontSize: 15, lineHeight: 23, color: 'rgba(255,255,255,0.88)', fontWeight: '500' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 12 },
  skipBtn:    { paddingVertical: 6, paddingHorizontal: 10 },
  skipTxt:    { fontSize: 13, color: 'rgba(255,255,255,0.3)' },
  nextBtn:    { borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  nextTxt:    { fontSize: 14, fontWeight: '800', color: '#0a0a1a' },
});
