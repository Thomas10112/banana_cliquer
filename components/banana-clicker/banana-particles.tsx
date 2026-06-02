import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface Particle {
  id: number;
  tx: number;
  ty: number;
}

function ParticleItem({ particle, onDone }: { particle: Particle; onDone: () => void }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    const cfg = { duration: 650 };
    translateX.value = withTiming(particle.tx, cfg);
    translateY.value = withTiming(particle.ty, cfg);
    scale.value = withTiming(0.3, cfg);
    opacity.value = withTiming(0, cfg, (finished) => {
      if (finished) runOnJS(onDone)();
    });
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return <Animated.Text style={[styles.particle, style]}>🍌</Animated.Text>;
}

interface BananaParticlesProps {
  clickCount: number;
}

export function BananaParticles({ clickCount }: BananaParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    if (clickCount === 0) return;
    const batch: Particle[] = Array.from({ length: 5 }, () => ({
      id: nextId.current++,
      tx: (Math.random() - 0.5) * 150,
      ty: -(Math.random() * 100 + 50),
    }));
    setParticles(prev => [...prev, ...batch]);
  }, [clickCount]);

  const remove = useCallback((id: number) => {
    setParticles(prev => prev.filter(p => p.id !== id));
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map(p => (
        <ParticleItem key={p.id} particle={p} onDone={() => remove(p.id)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    fontSize: 26,
    left: '50%',
    top: '50%',
    marginLeft: -13,
    marginTop: -13,
  },
});
