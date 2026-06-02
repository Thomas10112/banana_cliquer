import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { AchievementConfig } from '@/store/achievements-config';

interface AchievementNotificationProps {
  achievement: AchievementConfig;
  onDone: () => void;
}

export function AchievementNotification({ achievement, onDone }: AchievementNotificationProps) {
  const translateY = useSharedValue(-120);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 14, stiffness: 120 });

    const timeout = setTimeout(() => {
      translateY.value = withTiming(-120, { duration: 400 }, (finished) => {
        if (finished) runOnJS(onDone)();
      });
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.container, animStyle]}>
      <Text style={styles.label}>🏆 Succès débloqué !</Text>
      <Text style={styles.title}>{achievement.title}</Text>
      <Text style={styles.description}>{achievement.description}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    zIndex: 100,
    backgroundColor: '#1a237e',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#ffd700',
    shadowColor: '#ffd700',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
    gap: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffd700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  description: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
  },
});
