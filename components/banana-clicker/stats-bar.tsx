import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatBananas, formatRate } from '@/utils/format-bananas';

interface StatsBarProps {
  bananas: number;
  bps: number;
  bpc: number;
  comboMultiplier?: number;
}

export function StatsBar({ bananas, bps, bpc, comboMultiplier = 1 }: StatsBarProps) {
  const effectiveBpc = bpc * comboMultiplier;
  return (
    <View style={styles.pill}>
      <Text style={styles.count}>{formatBananas(bananas)} 🍌</Text>
      <View style={styles.row}>
        {bps > 0 && <Text style={styles.bps}>{formatRate(bps)} / sec</Text>}
        {bps > 0 && <Text style={styles.sep}>·</Text>}
        <Text style={styles.bpc}>{formatRate(effectiveBpc)} / clic</Text>
      </View>
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
  count: { fontSize: 30, fontWeight: '700', color: '#fff' },
  row:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bps:   { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  sep:   { fontSize: 13, color: 'rgba(255,255,255,0.35)' },
  bpc:   { fontSize: 13, color: 'rgba(255,215,0,0.9)' },
});
