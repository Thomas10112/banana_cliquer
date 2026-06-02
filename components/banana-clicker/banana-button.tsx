import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

interface BananaButtonProps {
  onPress: () => void;
}

export function BananaButton({ onPress }: BananaButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    scale.value = withSpring(0.85, { damping: 10, stiffness: 300 });
  }

  function handlePressOut() {
    scale.value = withSpring(1, { damping: 8, stiffness: 200 });
  }

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress} style={styles.pressable}>
      <Animated.View style={animatedStyle}>
        <Text selectable={false} style={styles.banana}>🍌</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    // @ts-ignore - web only
    WebkitTapHighlightColor: 'transparent',
    userSelect: 'none',
  },
  banana: {
    fontSize: 120,
    // @ts-ignore - web only
    userSelect: 'none',
  },
});
