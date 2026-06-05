import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { UPGRADES } from '@/store/upgrades-config';
import { useGameContext } from '@/store/game-context';
import { UpgradeCard } from './upgrade-card';
import { registerTutorialRef } from '@/utils/tutorial-refs';

interface UpgradesPanelProps {
  upgrades: Record<string, number>;
  bananas: number;
  onBuy: (id: string) => void;
  onBuyBulk: (id: string, qty: number) => void;
  claimedQuestIds: string[];
  currentAge: number;
}

export function UpgradesPanel({ upgrades, bananas, onBuy, onBuyBulk, claimedQuestIds, currentAge }: UpgradesPanelProps) {
  const { state } = useGameContext();
  const [quantity, setQuantity] = useState<1 | 10>(1);
  const firstCardRef = useRef<View>(null);
  useEffect(() => { registerTutorialRef('firstUpgrade', firstCardRef); }, []);

  const migrationInAge = state.totalMigrations % 3;
  const x10Unlocked   = migrationInAge >= 1;

  const visibleUpgrades = UPGRADES.filter(
    config =>
      (config.minAge ?? 0) === currentAge &&
      (!config.unlockedBy || claimedQuestIds.includes(config.unlockedBy)),
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Améliorations</Text>
        {x10Unlocked && (
          <View style={styles.toggle}>
            <Pressable
              style={[styles.toggleBtn, quantity === 1 && styles.toggleBtnActive]}
              onPress={() => setQuantity(1)}
            >
              <Text style={[styles.toggleTxt, quantity === 1 && styles.toggleTxtActive]}>×1</Text>
            </Pressable>
            <Pressable
              style={[styles.toggleBtn, quantity === 10 && styles.toggleBtnActive]}
              onPress={() => setQuantity(10)}
            >
              <Text style={[styles.toggleTxt, quantity === 10 && styles.toggleTxtActive]}>×10</Text>
            </Pressable>
          </View>
        )}
      </View>

      {visibleUpgrades.map((config, idx) => (
        <View key={config.id} ref={idx === 0 ? firstCardRef : undefined}>
          <UpgradeCard
            config={config}
            count={upgrades[config.id] ?? 0}
            bananas={bananas}
            quantity={quantity}
            onBuy={onBuy}
            onBuyBulk={onBuyBulk}
          />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fffde7' },
  content:   { padding: 16, paddingBottom: 32 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#5d4037' },

  toggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 10,
    padding: 2,
    gap: 2,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: '#f9a825',
  },
  toggleTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8d6e63',
  },
  toggleTxtActive: {
    color: '#fff',
  },
});
