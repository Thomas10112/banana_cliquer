import React, { forwardRef, useImperativeHandle } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

export interface BananaButtonHandle {
  press: () => void;
}

interface BananaButtonProps {
  onPress: () => void;
}

export const BananaButton = forwardRef<BananaButtonHandle, BananaButtonProps>(
  function BananaButton({ onPress }, ref) {
    const scale = useSharedValue(1);

    function triggerAnim() {
      scale.value = withSequence(
        withSpring(0.72, { damping: 12, stiffness: 500 }),
        withSpring(1.18, { damping: 7,  stiffness: 220 }),
        withSpring(1,    { damping: 14, stiffness: 300 }),
      );
    }

    useImperativeHandle(ref, () => ({ press: triggerAnim }));

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    return (
      <Pressable
        onPressIn={triggerAnim}
        onPress={onPress}
        style={styles.pressable}
      >
        <Animated.View style={animatedStyle}>
          <Text selectable={false} style={styles.banana}>🍌</Text>
        </Animated.View>
      </Pressable>
    );
  },
);

const styles = StyleSheet.create({
  pressable: {
    // @ts-ignore
    WebkitTapHighlightColor: 'transparent',
    userSelect: 'none',
  },
  banana: {
    fontSize: 120,
    // @ts-ignore
    userSelect: 'none',
  },
});
