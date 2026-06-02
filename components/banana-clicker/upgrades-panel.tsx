import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { UPGRADES } from '@/store/upgrades-config';
import { UpgradeCard } from './upgrade-card';

interface UpgradesPanelProps {
  upgrades: Record<string, number>;
  bananas: number;
  onBuy: (id: string) => void;
  claimedQuestIds: string[];
  currentAge: number;
}

export function UpgradesPanel({ upgrades, bananas, onBuy, claimedQuestIds, currentAge }: UpgradesPanelProps) {
  const visibleUpgrades = UPGRADES.filter(
    config =>
      (config.minAge ?? 0) === currentAge &&
      (!config.unlockedBy || claimedQuestIds.includes(config.unlockedBy)),
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Améliorations</Text>
      {visibleUpgrades.map(config => (
        <UpgradeCard
          key={config.id}
          config={config}
          count={upgrades[config.id] ?? 0}
          bananas={bananas}
          onBuy={onBuy}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fffde7',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5d4037',
    marginBottom: 8,
  },
});
