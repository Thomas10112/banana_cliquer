import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { formatBananas } from '@/utils/format-bananas';

interface QuestNotificationProps {
  title:   string;
  reward:  number;
  onClaim: () => void;
  onDone:  () => void;
}

export function QuestNotification({ title, reward, onClaim, onDone }: QuestNotificationProps) {
  const translateY = useSharedValue(-140);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 14, stiffness: 120 });

    const timeout = setTimeout(() => {
      translateY.value = withTiming(-140, { duration: 400 }, (finished) => {
        if (finished) runOnJS(onDone)();
      });
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  function handleClaim() {
    translateY.value = withTiming(-140, { duration: 300 }, (finished) => {
      if (finished) runOnJS(onClaim)();
    });
  }

  function handleDismiss() {
    translateY.value = withTiming(-140, { duration: 300 }, (finished) => {
      if (finished) runOnJS(onDone)();
    });
  }

  return (
    <Animated.View style={[styles.container, animStyle]} pointerEvents="box-none">
      <Pressable style={styles.inner} onPress={handleClaim}>
        <View style={styles.left}>
          <Text style={styles.label}>📜 Quête accomplie !</Text>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.reward}>+{formatBananas(reward)} 🍌 — Tap pour réclamer</Text>
        </View>
        <Pressable style={styles.closeBtn} onPress={handleDismiss} hitSlop={12}>
          <Text style={styles.closeTxt}>✕</Text>
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0, left: 12, right: 12,
    zIndex: 200,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a2e00',
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    borderColor: '#f9a825',
    shadowColor: '#f9a825',
    shadowOpacity: 0.7,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 14,
    gap: 12,
  },
  left: { flex: 1, gap: 2 },
  label: {
    fontSize: 11, fontWeight: '800',
    color: '#f9a825', textTransform: 'uppercase', letterSpacing: 1,
  },
  title:  { fontSize: 15, fontWeight: '700', color: '#fff' },
  reward: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  closeBtn: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeTxt: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '700' },
});
