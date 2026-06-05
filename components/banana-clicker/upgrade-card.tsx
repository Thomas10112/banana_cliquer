import React, { useRef } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { UpgradeConfig } from '@/store/types';
import { getUpgradeCost } from '@/store/game-reducer';
import { formatBananas } from '@/utils/format-bananas';

interface UpgradeCardProps {
  config: UpgradeConfig;
  count: number;
  bananas: number;
  quantity: 1 | 10;
  onBuy: (id: string) => void;
  onBuyBulk: (id: string, qty: number) => void;
}

function getBulkCost(id: string, count: number, qty: number): number {
  let total = 0;
  for (let i = 0; i < qty; i++) total += getUpgradeCost(id, count + i);
  return total;
}

export function UpgradeCard({ config, count, bananas, quantity, onBuy, onBuyBulk }: UpgradeCardProps) {
  const isMaxed   = config.maxCount !== undefined && count >= config.maxCount;
  const cost      = quantity === 1
    ? getUpgradeCost(config.id, count)
    : getBulkCost(config.id, count, Math.min(quantity, (config.maxCount ?? Infinity) - count));
  const canAfford = !isMaxed && bananas >= cost;

  const holdInterval = useRef<ReturnType<typeof setInterval>>(undefined);

  function handlePress() {
    if (!canAfford) return;
    if (quantity === 1) onBuy(config.id);
    else onBuyBulk(config.id, quantity);
  }

  function startContinuous() {
    if (isMaxed) return;
    holdInterval.current = setInterval(() => {
      if (quantity === 1) onBuy(config.id);
      else onBuyBulk(config.id, quantity);
    }, 180);
  }

  function stopContinuous() {
    clearInterval(holdInterval.current);
  }

  return (
    <Pressable
      style={[styles.card, isMaxed && styles.maxed, !canAfford && !isMaxed && styles.disabled]}
      onPress={handlePress}
      onLongPress={startContinuous}
      onPressOut={stopContinuous}
      delayLongPress={3000}
    >
      {config.image ? (
        <Image source={config.image} style={styles.image} />
      ) : (
        <Text style={styles.emoji}>{config.emoji}</Text>
      )}
      <View style={styles.info}>
        <Text style={styles.name}>{config.name}</Text>
        <Text style={styles.description}>{config.description}</Text>
        <Text style={styles.bps}>+{config.baseBps} 🍌/sec</Text>
      </View>
      <View style={styles.right}>
        {isMaxed ? (
          <View style={styles.maxBadge}>
            <Text style={styles.maxText}>MAX</Text>
          </View>
        ) : (
          <Text style={[styles.cost, !canAfford && styles.costDisabled]}>
            {formatBananas(cost)} 🍌
          </Text>
        )}
        {count > 0 && (
          <Text style={styles.count}>
            ×{count}{config.maxCount ? `/${config.maxCount}` : ''}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff8e1',
    borderRadius: 12,
    padding: 12,
    marginVertical: 4,
    gap: 12,
    borderWidth: 1,
    borderColor: '#ffe082',
  },
  disabled: { opacity: 0.45 },
  maxed:    { borderColor: '#4caf50', backgroundColor: '#f1f8e9' },
  emoji:    { fontSize: 36 },
  image:    { width: 48, height: 48, borderRadius: 8 },
  info:     { flex: 1, gap: 2 },
  name:        { fontSize: 16, fontWeight: '600', color: '#3e2723' },
  description: { fontSize: 12, color: '#8d6e63' },
  bps:         { fontSize: 12, color: '#f9a825', fontWeight: '500' },
  right:       { alignItems: 'flex-end', gap: 4 },
  cost:        { fontSize: 14, fontWeight: '700', color: '#e65100' },
  costDisabled: { color: '#bbb' },
  count:       { fontSize: 12, color: '#8d6e63' },
  maxBadge:    { backgroundColor: '#4caf50', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  maxText:     { fontSize: 12, fontWeight: '800', color: '#fff' },
});
