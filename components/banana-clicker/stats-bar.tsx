import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatBananas } from '@/utils/format-bananas';

interface StatsBarProps {
  bananas: number;
  bps: number;
}

export function StatsBar({ bananas, bps }: StatsBarProps) {
  return (
    <View style={styles.pill}>
      <Text style={styles.count}>{formatBananas(bananas)} 🍌</Text>
      {bps > 0 && <Text style={styles.bps}>{formatBananas(bps)} / sec</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  count: {
    fontSize: 30,
    fontWeight: '700',
    color: '#fff',
  },
  bps: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
  },
});
