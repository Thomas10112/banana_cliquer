import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatRate } from '@/utils/format-bananas';
import { AnimatedBananaCount } from './animated-banana-count';

interface StatsBarProps {
  bananas: number;
  bps: number;
  bpc: number;
  comboMultiplier?: number;
  active?: boolean;
  onPressBps?: () => void;
  onPressBpc?: () => void;
}

export function StatsBar({ bananas, bps, bpc, comboMultiplier = 1, active = true, onPressBps, onPressBpc }: StatsBarProps) {
  const effectiveBpc = bpc * comboMultiplier;
  return (
    <View style={styles.pill}>
      <AnimatedBananaCount bananas={bananas} bps={bps} active={active} style={styles.count} />
      <View style={styles.row}>
        {bps > 0 && (
          <Pressable onPress={onPressBps} hitSlop={8}>
            <Text style={styles.bps}>{formatRate(bps)} / sec ⓘ</Text>
          </Pressable>
        )}
        {bps > 0 && <Text style={styles.sep}>·</Text>}
        <Pressable onPress={onPressBpc} hitSlop={8}>
          <Text style={styles.bpc}>{formatRate(effectiveBpc)} / clic ⓘ</Text>
        </Pressable>
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
