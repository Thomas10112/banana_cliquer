import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface GoldenBananaProps {
  x: number;
  y: number;
  onCollect: () => void;
  onExpire: () => void;
}

export function GoldenBanana({ x, y, onCollect, onExpire }: GoldenBananaProps) {
  const scale = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 6, stiffness: 120 });
    rotate.value = withRepeat(
      withSequence(
        withTiming(20, { duration: 350 }),
        withTiming(-20, { duration: 350 }),
      ),
      -1,
    );

    const timeout = setTimeout(() => {
      cancelAnimation(rotate);
      scale.value = withTiming(0, { duration: 300 }, (finished) => {
        if (finished) runOnJS(onExpire)();
      });
    }, 4700);

    return () => clearTimeout(timeout);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));

  function handlePress() {
    cancelAnimation(rotate);
    scale.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished) runOnJS(onCollect)();
    });
  }

  return (
    <Pressable
      style={[styles.container, { left: `${x}%`, top: `${y}%` }]}
      onPress={handlePress}
    >
      <Animated.View style={[styles.glow, animStyle]}>
        <Text style={styles.emoji}>🍌</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    // @ts-ignore
    userSelect: 'none',
  },
  glow: {
    backgroundColor: 'rgba(255, 215, 0, 0.45)',
    borderRadius: 50,
    padding: 10,
    borderWidth: 3,
    borderColor: '#fff176',
    shadowColor: '#ffd700',
    shadowOpacity: 1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 16,
  },
  emoji: {
    fontSize: 48,
    textShadowColor: '#ff6f00',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
});
