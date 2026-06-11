import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

// ─── Pluie de bananes ─────────────────────────────────────────────────────────

function FallingBanana({ delay, xPct, sh, size }: { delay: number; xPct: number; sh: number; size: number }) {
  const ty  = useSharedValue(-80);
  const rot = useSharedValue(0);

  useEffect(() => {
    const fallMs = 2200 + Math.random() * 1600;
    ty.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(sh + 80, { duration: fallMs, easing: Easing.in(Easing.quad) }),
        withTiming(-80, { duration: 0 }),
      ),
      -1,
    ));
    rot.value = withRepeat(withTiming(360, { duration: 900 + Math.random() * 800, easing: Easing.linear }), -1);
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }, { rotate: `${rot.value}deg` }],
  }));

  return (
    <Animated.Text style={[{ position: 'absolute', top: 0, left: `${xPct}%`, fontSize: size }, style]}>
      🍌
    </Animated.Text>
  );
}

// ─── Arbre qui tremble ────────────────────────────────────────────────────────

function ShakingTree({ xPct, bottom, size, delay }: { xPct: number; bottom: number; size: number; delay: number }) {
  const rot = useSharedValue(0);

  useEffect(() => {
    rot.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(-9, { duration: 130 }),
        withTiming(9,  { duration: 130 }),
      ),
      -1, true,
    ));
  }, []);

  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));

  return (
    <Animated.Text style={[{ position: 'absolute', bottom, left: `${xPct}%`, fontSize: size }, style]}>
      🌴
    </Animated.Text>
  );
}

// ─── Célébration de fin de jeu ────────────────────────────────────────────────

export function EndGameCelebration({ playerName, onClose }: { playerName: string; onClose: () => void }) {
  const { height: sh } = useWindowDimensions();

  // Banane mesurée une seule fois : entre 2 et 20 cm
  const [bananaCm] = useState(() => 2 + Math.floor(Math.random() * 19));
  const bananas = useMemo(
    () => Array.from({ length: 14 }, (_, i) => ({
      delay: i * 220,
      xPct: Math.random() * 92,
      size: 22 + Math.random() * 18,
    })),
    [],
  );

  const bgOp        = useSharedValue(0);
  const gorillaSc   = useSharedValue(0);
  const chestBeat   = useSharedValue(1);
  const gorillaRot  = useSharedValue(0);
  const screenShake = useSharedValue(0);
  const bubbleOp    = useSharedValue(0);
  const bubbleSc    = useSharedValue(0.5);
  const cardOp      = useSharedValue(0);
  const cardTy      = useSharedValue(40);
  const btnOp       = useSharedValue(0);

  useEffect(() => {
    bgOp.value = withTiming(1, { duration: 350 });

    // Le gorille débarque
    gorillaSc.value = withDelay(300, withSpring(1, { damping: 9, stiffness: 140 }));

    // Tape sur son torse en boucle
    chestBeat.value = withDelay(800, withRepeat(
      withSequence(
        withTiming(1.18, { duration: 150, easing: Easing.out(Easing.quad) }),
        withTiming(1,    { duration: 150, easing: Easing.in(Easing.quad) }),
      ),
      -1,
    ));
    gorillaRot.value = withDelay(800, withRepeat(
      withSequence(
        withTiming(-6, { duration: 150 }),
        withTiming(6,  { duration: 150 }),
      ),
      -1, true,
    ));

    // Tout l'écran tremble sous les coups
    screenShake.value = withDelay(800, withRepeat(
      withSequence(
        withTiming(-4, { duration: 70 }),
        withTiming(4,  { duration: 70 }),
        withTiming(0,  { duration: 70 }),
      ),
      14,
    ));

    // La bulle de dialogue
    bubbleOp.value = withDelay(1300, withTiming(1, { duration: 250 }));
    bubbleSc.value = withDelay(1300, withSpring(1, { damping: 11, stiffness: 200 }));

    // La carte de mesure de banane
    cardOp.value = withDelay(2400, withTiming(1, { duration: 350 }));
    cardTy.value = withDelay(2400, withSpring(0, { damping: 13, stiffness: 160 }));

    // Le bouton quitter
    btnOp.value = withDelay(3000, withTiming(1, { duration: 300 }));
  }, []);

  const bgStyle      = useAnimatedStyle(() => ({ opacity: bgOp.value }));
  const shakeStyle   = useAnimatedStyle(() => ({ transform: [{ translateX: screenShake.value }] }));
  const gorillaStyle = useAnimatedStyle(() => ({
    transform: [{ scale: gorillaSc.value * chestBeat.value }, { rotate: `${gorillaRot.value}deg` }],
  }));
  const bubbleStyle  = useAnimatedStyle(() => ({ opacity: bubbleOp.value, transform: [{ scale: bubbleSc.value }] }));
  const cardStyle    = useAnimatedStyle(() => ({ opacity: cardOp.value, transform: [{ translateY: cardTy.value }] }));
  const btnStyle     = useAnimatedStyle(() => ({ opacity: btnOp.value }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, endStyles.overlay, bgStyle]}>
      <Animated.View style={[StyleSheet.absoluteFill, shakeStyle]}>
        {/* Arbres secoués par le gorille */}
        <ShakingTree xPct={2}  bottom={14} size={64} delay={800} />
        <ShakingTree xPct={20} bottom={4}  size={48} delay={950} />
        <ShakingTree xPct={68} bottom={6}  size={52} delay={880} />
        <ShakingTree xPct={84} bottom={16} size={66} delay={1020} />

        {/* Pluie de bananes */}
        {bananas.map((b, i) => (
          <FallingBanana key={i} delay={b.delay} xPct={b.xPct} sh={sh} size={b.size} />
        ))}

        <View style={endStyles.content}>
          {/* Bulle de dialogue */}
          <Animated.View style={[endStyles.bubble, bubbleStyle]}>
            <Text style={endStyles.bubbleText}>
              Bravo {playerName}, vous avez fini le jeu ! 🎉
            </Text>
            <View style={endStyles.bubbleTail} />
          </Animated.View>

          {/* Gorille qui tape sur son torse */}
          <Animated.Text style={[endStyles.gorilla, gorillaStyle]}>🦍</Animated.Text>

          {/* Mesure de la banane */}
          <Animated.View style={[endStyles.bananaCard, cardStyle]}>
            <View style={endStyles.bananaStretchBox}>
              <Text style={[endStyles.bananaStretch, { transform: [{ scaleX: bananaCm / 2 }] }]}>🍌</Text>
            </View>
            <Text style={endStyles.bananaCardText}>
              Votre banane est de {bananaCm} cm !
            </Text>
          </Animated.View>

          <Animated.View style={btnStyle}>
            <Pressable style={endStyles.quitBtn} onPress={onClose}>
              <Text style={endStyles.quitTxt}>Quitter</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const endStyles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(8, 30, 12, 0.96)',
    zIndex: 1000,
    elevation: 1000,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    paddingHorizontal: 24,
  },
  gorilla: { fontSize: 110 },
  bubble: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 12,
    maxWidth: 300,
  },
  bubbleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a1a2e',
    textAlign: 'center',
  },
  bubbleTail: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    marginLeft: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#fff',
  },
  bananaCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.45)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  bananaStretchBox: {
    width: '100%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bananaStretch: { fontSize: 34 },
  bananaCardText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffd700',
    textAlign: 'center',
  },
  quitBtn: {
    backgroundColor: '#f9a825',
    borderRadius: 14,
    paddingHorizontal: 44,
    paddingVertical: 13,
  },
  quitTxt: { fontSize: 16, fontWeight: '800', color: '#0a0a0a' },
});
