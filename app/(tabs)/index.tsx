import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGameContext } from '@/store/game-context';
import { AGES } from '@/store/ages-config';
import { registerTutorialRef } from '@/utils/tutorial-refs';
import { ZONES, zoneBonusLabel, getZoneUpgradeCost, getZoneMaxStock, getWhaleCost } from '@/store/zones-config';
import { formatBananas } from '@/utils/format-bananas';
import type { WhaleTrip } from '@/store/types';

const { width: SW, height: SH } = Dimensions.get('window');

const MAP_W = 1400;
const MAP_H = Math.round(MAP_W / 1.75);

const FIT_SCALE = SH / MAP_H;
const MIN_SCALE = FIT_SCALE;
const MAX_SCALE = FIT_SCALE * 4;

const MAP_OFFSET_X = (SW - MAP_W) / 2;
const MAP_OFFSET_Y = (SH - MAP_H) / 2;

function clamp(v: number, min: number, max: number) {
  'worklet';
  return Math.max(min, Math.min(max, v));
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface POI {
  id: string;
  label: string;
  emoji: string;
  xPct: number;
  yPct: number;
  description: string;
}

interface IndicatorData {
  id: string;
  emoji: string;
  label: string;
  side: 'left' | 'right';
  screenY: number;
  poi: POI;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const AGE_POIS: Record<number, POI[]> = {
  0: [
    { id: 'afrique',   label: 'Berceau de l\'humanité', emoji: '🏕️', xPct: 0.57, yPct: 0.46,
      description: 'C\'est ici que tout a commencé. Tes ancêtres ont cueilli la première banane dans cette savane.' },
    { id: 'amazonie',  label: 'Forêt primordiale',       emoji: '🌴', xPct: 0.22, yPct: 0.44,
      description: 'Une jungle impénétrable. Des millions de bananes y poussent, mais les prédateurs rôdent.' },
    { id: 'europe',    label: 'Terres du Grand Froid',   emoji: '❄️', xPct: 0.52, yPct: 0.11,
      description: 'Peu de bananes ici, mais des mammouths gardent d\'anciens secrets.' },
    { id: 'asie',      label: 'Steppes de l\'Est',       emoji: '🦅', xPct: 0.75, yPct: 0.32,
      description: 'De vastes plaines battues par le vent. Des tribus nomades y vivent de la chasse.' },
    { id: 'australie', label: 'Île Mystérieuse',         emoji: '🦘', xPct: 0.84, yPct: 0.66,
      description: 'Une terre isolée, peuplée de créatures inconnues. On dit qu\'une banane dorée y pousse chaque lune.' },
    { id: 'mammouth',  label: 'Troupeau de mammouths',   emoji: '🦣', xPct: 0.29, yPct: 0.73,
      description: 'Un troupeau de mammouths laineux migre vers le sud. Attention à ne pas te retrouver sur leur chemin.' },
  ],
  1: [
    { id: 'nil',       label: 'Champs du Nil',        emoji: '🌾', xPct: 0.52, yPct: 0.43,
      description: 'Les crues du Nil fertilisent ces plaines dorées. Jamais une récolte de bananes n\'a été aussi abondante.' },
    { id: 'flandre',   label: 'Moulin de Flandre',    emoji: '⚙️', xPct: 0.48, yPct: 0.24,
      description: 'Les moulins tournent nuit et jour. Le vent du nord broie, mélange, et transforme tout ce qui passe.' },
    { id: 'andine',    label: 'Ferme Andine',          emoji: '🏡', xPct: 0.28, yPct: 0.70,
      description: 'Accrochée aux flancs des Andes, cette ferme cultive des bananes en terrasses depuis des siècles.' },
    { id: 'orient',    label: 'Grenier d\'Orient',     emoji: '🏺', xPct: 0.60, yPct: 0.33,
      description: 'D\'immenses greniers stockent les récoltes de tout le continent. La route des épices passe par ici.' },
    { id: 'pacifique', label: 'Domaine du Pacifique',  emoji: '🌿', xPct: 0.03, yPct: 0.55,
      description: 'Sur cette île fertile au milieu du Pacifique, les bananiers poussent sans effort toute l\'année.' },
    { id: 'epices',    label: 'Île des Épices',        emoji: '🌺', xPct: 0.65, yPct: 0.79,
      description: 'Une île mystérieuse surgit des eaux. Ses épices rares donnent un goût unique aux bananes locales.' },
  ],
  2: [
    { id: 'angleterre',  label: 'Forges d\'Angleterre',   emoji: '⚒️',  xPct: 0.44, yPct: 0.22,
      description: 'Les premières usines à vapeur tournent ici jour et nuit. L\'air sent le charbon et la banane grillée.' },
    { id: 'ruhr',        label: 'Bassin de la Ruhr',      emoji: '🏭',  xPct: 0.53, yPct: 0.22,
      description: 'Des cheminées à perte de vue. Le cœur industriel du continent produit des bananes en masse.' },
    { id: 'pennsylvanie', label: 'Mines de Pennsylvanie', emoji: '⛏️',  xPct: 0.13, yPct: 0.38,
      description: 'Des gisements de charbon alimentent des locomotives chargées de bananes jusqu\'aux quatre coins du pays.' },
    { id: 'detroit',     label: 'Usines de Detroit',      emoji: '🔧',  xPct: 0.19, yPct: 0.28,
      description: 'La chaîne de montage s\'emballe. Chaque minute, des centaines de caisses de bananes sortent de l\'usine.' },
    { id: 'siberien',    label: 'Rail Sibérien',           emoji: '🚂',  xPct: 0.75, yPct: 0.20,
      description: 'Le Transsibérien traverse des milliers de kilomètres de toundra pour livrer des bananes à l\'Est.' },
    { id: 'bombay',      label: 'Port de Bombay',         emoji: '⚓',  xPct: 0.72, yPct: 0.50,
      description: 'Des bateaux à vapeur chargés de bananes quittent ce port immense vers tous les continents.' },
  ],
  3: [
    { id: 'silicon_valley', label: 'Silicon Valley',    emoji: '💻', xPct: 0.18, yPct: 0.34,
      description: 'Des garages aux serveurs géants, chaque ligne de code ici peut changer la valeur mondiale de la banane.' },
    { id: 'geneve',         label: 'CERN — Genève',     emoji: '🔬', xPct: 0.50, yPct: 0.24,
      description: 'Des physiciens cherchent à comprendre l\'univers. En attendant, leurs supercalculateurs optimisent la production bananière.' },
    { id: 'seoul',          label: 'Seoul Tech Park',   emoji: '📱', xPct: 0.82, yPct: 0.27,
      description: 'Puces, écrans, robots. Cette mégapole produit les composants qui font tourner toutes les usines à bananes du monde.' },
    { id: 'bangalore',      label: 'Bangalore Digital', emoji: '🛰️', xPct: 0.71, yPct: 0.41,
      description: 'Des milliers d\'ingénieurs logiciels coordonnent depuis ici les drones de livraison de bananes en temps réel.' },
    { id: 'houston',        label: 'Centre Spatial',    emoji: '🚀', xPct: 0.08, yPct: 0.65,
      description: 'De là sont lancés les satellites qui cartographient chaque plantation bananière sur Terre depuis l\'orbite basse.' },
    { id: 'tokyo',          label: 'Tokyo Numérique',   emoji: '🖥️', xPct: 0.85, yPct: 0.33,
      description: 'La ville la plus connectée du monde. Ici, des IA ultra-perfectionnées gèrent la distribution mondiale des bananes.' },
  ],
  4: [
    { id: 'californie_2050', label: 'Californie 2050',  emoji: '🌆', xPct: 0.20, yPct: 0.35,
      description: 'Les anciennes Silicon Valley et Los Angeles ont fusionné en une mégapole entièrement automatisée. Chaque banane est cueillie par un bras robotique.' },
    { id: 'dubai_nexus',     label: 'Dubai Nexus',      emoji: '🏙️', xPct: 0.62, yPct: 0.40,
      description: 'Des tours d\'acier et de verre abritent les supercalculateurs qui gèrent la logistique bananière mondiale en temps réel.' },
    { id: 'singapour_ia',    label: 'Singapour IA',     emoji: '🧠', xPct: 0.78, yPct: 0.48,
      description: 'La première ville entièrement gérée par une intelligence artificielle. Elle a décidé que la banane est la denrée prioritaire.' },
    { id: 'cite_polaire',    label: 'Cité Polaire',     emoji: '❄️', xPct: 0.50, yPct: 0.04,
      description: 'Des datacenters enfouis sous la glace arctique calculent en permanence l\'optimum bananier mondial grâce au froid naturel.' },
    { id: 'sao_paulo_mech',  label: 'São Paulo Mech',   emoji: '⚙️', xPct: 0.30, yPct: 0.65,
      description: 'D\'immenses usines robotisées transforment l\'Amazonie en la plus grande plantation bananière automatisée de l\'histoire.' },
    { id: 'neo_tokyo',       label: 'Néo-Tokyo',        emoji: '🤖', xPct: 0.85, yPct: 0.30,
      description: 'Des robots humanoïdes de dernière génération envahissent les rues. Leur unique mission : produire et livrer des bananes.' },
  ],
};

const AGE_MAPS: Record<number, any> = {
  0: require('@/assets/images/maps/map_ere_sauvage.png'),
  1: require('@/assets/images/maps/map_ere_agricole.png'),
  2: require('@/assets/images/maps/map_ere_industrielle.png'),
  3: require('@/assets/images/maps/map_ere_moderne.png'),
  4: require('@/assets/images/maps/map_ere_robotique.png'),
};

const AGE_TRANSPORT: Record<number, { emoji: string; article: string; name: string; namePlural: string }> = {
  0: { emoji: '🐋', article: 'une', name: 'baleine porteuse',    namePlural: 'baleines actives' },
  1: { emoji: '⛵', article: 'un',  name: 'voilier marchand',    namePlural: 'voiliers actifs' },
  2: { emoji: '🚂', article: 'une', name: 'locomotive',          namePlural: 'locomotives actives' },
  3: { emoji: '✈️', article: 'un',  name: 'avion cargo',         namePlural: 'avions actifs' },
  4: { emoji: '🛸', article: 'un',  name: 'vaisseau logistique', namePlural: 'vaisseaux actifs' },
};

// ─── Whale animated marker ────────────────────────────────────────────────────

function WhaleMarker({ trip, pois, playTime, transportEmoji }: { trip: WhaleTrip; pois: POI[]; playTime: number; transportEmoji: string }) {
  const fromPOI = pois.find(p => p.id === trip.fromZoneId);
  const toPOI   = pois.find(p => p.id === trip.toZoneId);
  if (!fromPOI || !toPOI) return null;

  const fraction = Math.max(0, Math.min(1, (playTime - trip.startedAt) / trip.duration));
  const targetX  = (fromPOI.xPct + (toPOI.xPct - fromPOI.xPct) * fraction) * MAP_W;
  const targetY  = (fromPOI.yPct + (toPOI.yPct - fromPOI.yPct) * fraction) * MAP_H;

  const x = useSharedValue(targetX);
  const y = useSharedValue(targetY);

  useEffect(() => {
    x.value = withTiming(targetX, { duration: 120 });
    y.value = withTiming(targetY, { duration: 120 });
  }, [targetX, targetY]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value - 14 }, { translateY: y.value - 14 }],
  }));

  const goingRight = toPOI.xPct >= fromPOI.xPct;

  return (
    <Animated.View style={[{ position: 'absolute', left: 0, top: 0 }, style]} pointerEvents="none">
      <Text style={{ fontSize: 22, transform: [{ scaleX: goingRight ? 1 : -1 }] }}>{transportEmoji}</Text>
    </Animated.View>
  );
}

// ─── POI Marker ───────────────────────────────────────────────────────────────

function POIMarker({
  poi, level, stock, maxStock, onPress,
}: { poi: POI; level: number; stock: number; maxStock: number; onPress: (p: POI) => void }) {
  const conquered = level >= 1;
  const hasStock  = stock > 0;
  const levelDots = conquered ? '●'.repeat(level) + '○'.repeat(3 - level) : '';

  return (
    <Pressable
      style={[styles.marker, { left: poi.xPct * MAP_W - 24, top: poi.yPct * MAP_H - 44 }]}
      onPress={() => onPress(poi)}
      hitSlop={12}
    >
      {hasStock && (
        <View style={styles.stockBadge}>
          <Text style={styles.stockTxt}>🍌 {formatBananas(stock)}</Text>
        </View>
      )}
      <Text style={styles.markerEmoji}>{poi.emoji}</Text>
      <View style={[styles.markerBubble, conquered && styles.markerBubbleConquered]}>
        <Text style={styles.markerLabel} numberOfLines={1}>
          {conquered ? '' : ''}{poi.label}
        </Text>
        {conquered && <Text style={styles.levelDots}>{levelDots}</Text>}
      </View>
    </Pressable>
  );
}

// ─── Off-screen bubble ────────────────────────────────────────────────────────

function OffScreenBubble({ ind, onPress }: { ind: IndicatorData; onPress: () => void }) {
  const isLeft = ind.side === 'left';
  return (
    <Pressable
      style={[styles.bubble, isLeft ? styles.bubbleLeft : styles.bubbleRight, { top: ind.screenY - 22 }]}
      onPress={onPress}
    >
      {isLeft && <Text style={styles.bubbleArrow}>◀</Text>}
      <Text style={styles.bubbleEmoji}>{ind.emoji}</Text>
      {!isLeft && <Text style={styles.bubbleArrow}>▶</Text>}
    </Pressable>
  );
}

// ─── POI Detail sheet ─────────────────────────────────────────────────────────

interface POIDetailProps {
  poi: POI;
  bananas: number;
  zoneLevels: Record<string, number>;
  zoneStocks: Record<string, number>;
  onConquer: (id: string) => void;
  onUpgrade: (id: string) => void;
  onHarvest: (id: string) => void;
  onClose: () => void;
}

function POIDetail({ poi, bananas, zoneLevels, zoneStocks, onConquer, onUpgrade, onHarvest, onClose }: POIDetailProps) {
  const zone       = ZONES.find(z => z.id === poi.id);
  const level      = zoneLevels[poi.id] ?? 0;
  const stock      = zoneStocks[poi.id] ?? 0;
  const maxStock   = getZoneMaxStock(level);
  const isConquered = level >= 1;
  const canAfford  = zone ? bananas >= zone.cost : false;
  const upgCost    = zone && level >= 1 && level < 3 ? getZoneUpgradeCost(zone, level) : null;
  const canUpgrade = upgCost !== null && bananas >= upgCost;

  return (
    <View style={styles.detailOverlay} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={styles.detailCard}>
        <Text style={styles.detailEmoji}>{poi.emoji}</Text>
        <Text style={styles.detailTitle}>{poi.label}</Text>
        <Text style={styles.detailDesc}>{poi.description}</Text>

        {zone && !isConquered && (
          <Pressable
            style={[styles.conquerBtn, !canAfford && styles.conquerBtnDisabled]}
            onPress={() => { if (canAfford) { onConquer(poi.id); onClose(); } }}
          >
            <Text style={styles.conquerBtnTxt}>
              {canAfford ? `⚔️ Conquérir — ${formatBananas(zone.cost)} 🍌` : `🔒 ${formatBananas(zone.cost)} 🍌 requis`}
            </Text>
            <Text style={styles.bonusTxtSmall}>{zoneBonusLabel(zone.bonus)}</Text>
          </Pressable>
        )}

        {isConquered && (
          <>
            {/* Niveau + bonus */}
            <View style={styles.conqueredBadge}>
              <Text style={styles.conqueredTxt}>
                {'●'.repeat(level)}{'○'.repeat(3 - level)}  Niveau {level}
              </Text>
              <Text style={styles.bonusTxt}>{zoneBonusLabel(zone!.bonus)}</Text>
            </View>

            {/* Stock */}
            <View style={styles.stockRow}>
              <Text style={styles.stockLabel}>🍌 Stock : {formatBananas(stock)} / {formatBananas(maxStock)}</Text>
              {stock > 0 && (
                <Pressable style={styles.harvestBtn} onPress={() => { onHarvest(poi.id); onClose(); }}>
                  <Text style={styles.harvestBtnTxt}>Récolter</Text>
                </Pressable>
              )}
            </View>

            {/* Upgrade */}
            {level < 3 && upgCost !== null && (
              <Pressable
                style={[styles.upgradeBtn, !canUpgrade && styles.conquerBtnDisabled]}
                onPress={() => { if (canUpgrade) { onUpgrade(poi.id); onClose(); } }}
              >
                <Text style={styles.conquerBtnTxt}>
                  {canUpgrade
                    ? `⬆️ Améliorer niv. ${level + 1} — ${formatBananas(upgCost)} 🍌`
                    : `🔒 ${formatBananas(upgCost)} 🍌 requis`}
                </Text>
                <Text style={styles.bonusTxtSmall}>
                  Stock max : {getZoneMaxStock(level + 1)} 🍌
                </Text>
              </Pressable>
            )}
            {level >= 3 && <Text style={styles.maxLevelTxt}>⭐ Niveau maximum atteint</Text>}
          </>
        )}

        <Pressable style={styles.detailCloseBtn} onPress={onClose}>
          <Text style={styles.detailCloseTxt}>Fermer</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Territory summary panel ──────────────────────────────────────────────────

function TerritoryPanel({ pois, zoneLevels, zoneStocks, bananas, whalesOwned, transport, onClose, onSelect, onConquer, onUpgrade, onBuyWhale }: {
  pois: POI[];
  zoneLevels: Record<string, number>;
  zoneStocks: Record<string, number>;
  bananas: number;
  whalesOwned: number;
  transport: { emoji: string; article: string; name: string; namePlural: string };
  onClose: () => void;
  onSelect: (poi: POI) => void;
  onConquer: (id: string) => void;
  onUpgrade: (id: string) => void;
  onBuyWhale: () => void;
}) {
  const conqueredCount = pois.filter(p => (zoneLevels[p.id] ?? 0) >= 1).length;
  const whaleCost = getWhaleCost(whalesOwned);
  const canBuyWhale = bananas >= whaleCost && conqueredCount >= 2;

  return (
    <View style={styles.panelOverlay} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={styles.panelCard}>
        <Text style={styles.panelTitle}>🗺️ Territoires — {conqueredCount}/{pois.length}</Text>

        <Pressable
          style={[styles.whaleBtn, !canBuyWhale && styles.whaleBtnDisabled]}
          onPress={() => { if (canBuyWhale) { onBuyWhale(); onClose(); } }}
        >
          <Text style={styles.whaleBtnEmoji}>{transport.emoji}</Text>
          <View>
            <Text style={styles.whaleBtnTxt}>
              {canBuyWhale
                ? `Acheter ${transport.article} ${transport.name} — ${formatBananas(whaleCost)} 🍌`
                : conqueredCount < 2
                  ? '🔒 Conquiers 2 zones pour débloquer'
                  : `🔒 ${formatBananas(whaleCost)} 🍌 requis`}
            </Text>
            {whalesOwned > 0 && <Text style={styles.whaleBtnSub}>{whalesOwned} {transport.namePlural}</Text>}
          </View>
        </Pressable>

        <ScrollView style={styles.panelScroll} showsVerticalScrollIndicator={false}>
          {pois.map(poi => {
            const zone         = ZONES.find(z => z.id === poi.id);
            const level        = zoneLevels[poi.id] ?? 0;
            const stock        = zoneStocks[poi.id] ?? 0;
            const isConquered  = level >= 1;
            const isMaxed      = level >= 3;
            const upgradeCost  = (!isMaxed && zone) ? getZoneUpgradeCost(zone, level) : 0;

            const canConquer   = !isConquered && !!zone && bananas >= zone.cost;
            const cantConquer  = !isConquered && !!zone && bananas < zone.cost;
            const canUpgradeNow = isConquered && !isMaxed && bananas >= upgradeCost;

            const isAffordable = canConquer || canUpgradeNow;
            const isCantAfford = cantConquer || (isConquered && !isMaxed && bananas < upgradeCost);

            return (
              <Pressable
                key={poi.id}
                style={[
                  styles.panelRow,
                  isConquered   && styles.panelRowConquered,
                  isAffordable  && styles.panelRowAffordable,
                  isCantAfford  && styles.panelRowCantAfford,
                ]}
                onPress={() => { onClose(); onSelect(poi); }}
              >
                {/* Icône état */}
                <Text style={styles.panelRowStateIcon}>
                  {!isConquered ? '🔨' : isMaxed ? '✅' : '⬆️'}
                </Text>

                <Text style={styles.panelRowEmoji}>{poi.emoji}</Text>

                <View style={styles.panelRowInfo}>
                  <Text style={[styles.panelRowName, isCantAfford && styles.panelRowNameDim]}>
                    {poi.label}
                  </Text>
                  {zone && (
                    <Text style={[styles.panelRowBonus, isConquered && styles.panelRowBonusConquered]}>
                      {isConquered
                        ? `${'●'.repeat(level)}${'○'.repeat(3 - level)} ${zoneBonusLabel(zone.bonus)}${stock > 0 ? ` · 🍌 ${formatBananas(stock)}` : ''}`
                        : `${formatBananas(zone.cost)} 🍌 · ${zoneBonusLabel(zone.bonus)}`}
                    </Text>
                  )}
                  {isConquered && !isMaxed && (
                    <Text style={[styles.panelRowBonus, canUpgradeNow && { color: '#ffd700' }]}>
                      Améliorer : {formatBananas(upgradeCost)} 🍌
                    </Text>
                  )}
                </View>

                {/* Bouton action direct */}
                {canConquer && (
                  <Pressable
                    style={styles.panelActionBtn}
                    onPress={(e) => { e.stopPropagation?.(); onConquer(poi.id); }}
                  >
                    <Text style={styles.panelActionTxt}>🔨</Text>
                  </Pressable>
                )}
                {canUpgradeNow && (
                  <Pressable
                    style={[styles.panelActionBtn, styles.panelUpgradeBtn]}
                    onPress={(e) => { e.stopPropagation?.(); onUpgrade(poi.id); }}
                  >
                    <Text style={styles.panelActionTxt}>⬆️</Text>
                  </Pressable>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
        <Pressable style={styles.panelCloseBtn} onPress={onClose}>
          <Text style={styles.detailCloseTxt}>Fermer</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function WorldMapScreen() {
  const { state, conquerZone, upgradeZone, harvestZone, buyWhale } = useGameContext();
  const mapAreaRef    = useRef<View>(null);
  const mapPanelBtnRef = useRef<any>(null);
  const firstPoiRef   = useRef<View>(null);
  useEffect(() => {
    registerTutorialRef('mapArea',     mapAreaRef);
    registerTutorialRef('mapPanelBtn', mapPanelBtnRef);
    registerTutorialRef('firstPoi',    firstPoiRef);
  }, []);
  const [selectedPOI, setSelectedPOI]         = useState<POI | null>(null);
  const [showTerritories, setShowTerritories]  = useState(false);
  const [indicators, setIndicators]            = useState<IndicatorData[]>([]);
  const [mapLoaded, setMapLoaded]              = useState(false);

  const age       = AGES[state.currentAge];
  const mapSrc    = AGE_MAPS[state.currentAge];
  const pois      = AGE_POIS[state.currentAge] ?? [];
  const transport = AGE_TRANSPORT[state.currentAge] ?? AGE_TRANSPORT[0];

  useEffect(() => {
    setMapLoaded(false);
    const fallback = setTimeout(() => setMapLoaded(true), 800);
    return () => clearTimeout(fallback);
  }, [state.currentAge]);

  const scale      = useSharedValue(FIT_SCALE);
  const savedScale = useSharedValue(FIT_SCALE);
  const tx         = useSharedValue(0);
  const savedTx    = useSharedValue(0);
  const ty         = useSharedValue(0);
  const savedTy    = useSharedValue(0);

  const computeIndicators = useCallback((txv: number, tyv: number, sv: number) => {
    const result: IndicatorData[] = [];
    for (const poi of pois) {
      const sx = SW / 2 + (poi.xPct * MAP_W - MAP_W / 2) * sv + txv;
      const sy = SH / 2 + (poi.yPct * MAP_H - MAP_H / 2) * sv + tyv;
      if (sx < 30) {
        result.push({ id: poi.id, emoji: poi.emoji, label: poi.label, side: 'left',
          screenY: Math.max(120, Math.min(SH - 220, sy)), poi });
      } else if (sx > SW - 30) {
        result.push({ id: poi.id, emoji: poi.emoji, label: poi.label, side: 'right',
          screenY: Math.max(120, Math.min(SH - 220, sy)), poi });
      }
    }
    setIndicators(result);
  }, [pois]);

  useAnimatedReaction(
    () => ({ t: tx.value, y: ty.value, s: scale.value }),
    (cur) => runOnJS(computeIndicators)(cur.t, cur.y, cur.s),
  );

  function scrollToPOI(poi: POI) {
    const targetScale = Math.min(FIT_SCALE * 2.2, MAX_SCALE);
    const rawTx = MAP_W * (0.5 - poi.xPct) * targetScale;
    const rawTy = MAP_H * (0.5 - poi.yPct) * targetScale;
    const maxX  = Math.max(0, (MAP_W * targetScale - SW) / 2);
    const maxY  = Math.max(0, (MAP_H * targetScale - SH) / 2);
    const cfg   = { duration: 420, easing: Easing.out(Easing.cubic) };
    scale.value = withTiming(targetScale, cfg);
    tx.value    = withTiming(Math.max(-maxX, Math.min(maxX, rawTx)), cfg);
    ty.value    = withTiming(Math.max(-maxY, Math.min(maxY, rawTy)), cfg);
  }

  const pinch = Gesture.Pinch()
    .onBegin(() => { savedScale.value = scale.value; })
    .onUpdate(e => { scale.value = clamp(savedScale.value * e.scale, MIN_SCALE, MAX_SCALE); })
    .onEnd(() => {
      savedScale.value = scale.value;
      const maxX = Math.max(0, (MAP_W * scale.value - SW) / 2);
      const maxY = Math.max(0, (MAP_H * scale.value - SH) / 2);
      tx.value = clamp(tx.value, -maxX, maxX);
      ty.value = clamp(ty.value, -maxY, maxY);
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    });

  const pan = Gesture.Pan()
    .minDistance(6)
    .onBegin(() => { savedTx.value = tx.value; savedTy.value = ty.value; })
    .onUpdate(e => {
      const maxX = Math.max(0, (MAP_W * scale.value - SW) / 2);
      const maxY = Math.max(0, (MAP_H * scale.value - SH) / 2);
      tx.value = clamp(savedTx.value + e.translationX, -maxX, maxX);
      ty.value = clamp(savedTy.value + e.translationY, -maxY, maxY);
    });

  const gesture = Gesture.Simultaneous(pan, pinch);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  function resetView() {
    const cfg = { duration: 380, easing: Easing.out(Easing.cubic) };
    scale.value = withTiming(FIT_SCALE, cfg);
    tx.value    = withTiming(0, cfg);
    ty.value    = withTiming(0, cfg);
  }

  const conqueredCount = pois.filter(p => (state.zoneLevels[p.id] ?? 0) >= 1).length;

  return (
    <View style={styles.root}>
      <GestureDetector gesture={gesture}>
        <View ref={mapAreaRef} style={styles.viewport}>
          <Animated.View style={[styles.mapInner, animStyle]}>
            {mapSrc ? (
              <ExpoImage
                source={mapSrc}
                style={styles.mapImage}
                contentFit="cover"
                cachePolicy="memory-disk"
                onLoad={() => setMapLoaded(true)}
              />
            ) : (
              <View style={[styles.mapImage, styles.mapPlaceholder]}>
                <Text style={styles.placeholderEmoji}>🗺️</Text>
                <Text style={styles.placeholderTxt}>Carte à venir</Text>
              </View>
            )}

            {/* Transports animés */}
            {state.activeWhales.map(trip => (
              <WhaleMarker
                key={trip.id}
                trip={trip}
                pois={pois}
                playTime={state.playTimeSeconds}
                transportEmoji={transport.emoji}
              />
            ))}

            {/* Ref tutorial sur le premier POI */}
            {pois[0] && (
              <View
                ref={firstPoiRef}
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: pois[0].xPct * MAP_W - 28,
                  top:  pois[0].yPct * MAP_H - 48,
                  width: 56, height: 56,
                }}
              />
            )}

            {/* Marqueurs de zones */}
            {pois.map(poi => (
              <POIMarker
                key={poi.id}
                poi={poi}
                level={state.zoneLevels[poi.id] ?? 0}
                stock={state.zoneStocks[poi.id] ?? 0}
                maxStock={getZoneMaxStock(state.zoneLevels[poi.id] ?? 0)}
                onPress={setSelectedPOI}
              />
            ))}
          </Animated.View>
        </View>
      </GestureDetector>

      {/* Bulles hors-écran */}
      {mapLoaded && indicators.map(ind => (
        <OffScreenBubble key={ind.id} ind={ind} onPress={() => scrollToPOI(ind.poi)} />
      ))}

      {/* Overlay chargement carte */}
      {!mapLoaded && mapSrc && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingEmoji}>{age?.emoji ?? '🗺️'}</Text>
          <Text style={styles.loadingName}>{age?.name}</Text>
          <ActivityIndicator color="rgba(255,255,255,0.6)" style={{ marginTop: 16 }} />
          <Text style={styles.loadingTxt}>Chargement de la carte…</Text>
        </View>
      )}

      {/* Header */}
      <SafeAreaView style={styles.header} edges={['top']} pointerEvents="box-none">
        <View style={styles.headerRow}>
          <View style={styles.ageBadge}>
            <Text style={styles.ageEmoji}>{age?.emoji}</Text>
            <Text style={styles.ageName}>{age?.name}</Text>
          </View>
          <Pressable ref={mapPanelBtnRef} style={styles.iconBtn} onPress={() => setShowTerritories(true)}>
            <Text style={styles.iconBtnTxt}>📋</Text>
            {conqueredCount > 0 && (
              <View style={styles.conqueredPill}>
                <Text style={styles.conqueredPillTxt}>{conqueredCount}/{pois.length}</Text>
              </View>
            )}
          </Pressable>
          {state.whalesOwned > 0 && (
            <View style={styles.whaleCountBadge}>
              <Text style={styles.iconBtnTxt}>{transport.emoji}</Text>
              <Text style={styles.whaleCountTxt}>{state.whalesOwned}</Text>
            </View>
          )}
          <Pressable style={styles.iconBtn} onPress={resetView}>
            <Text style={styles.iconBtnTxt}>⌖</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      {/* POI detail */}
      {selectedPOI && !showTerritories && (
        <POIDetail
          poi={selectedPOI}
          bananas={state.bananas}
          zoneLevels={state.zoneLevels}
          zoneStocks={state.zoneStocks}
          onConquer={conquerZone}
          onUpgrade={upgradeZone}
          onHarvest={harvestZone}
          onClose={() => setSelectedPOI(null)}
        />
      )}

      {/* Territory panel */}
      {showTerritories && (
        <TerritoryPanel
          pois={pois}
          zoneLevels={state.zoneLevels}
          zoneStocks={state.zoneStocks}
          bananas={state.bananas}
          whalesOwned={state.whalesOwned}
          transport={transport}
          onClose={() => setShowTerritories(false)}
          onSelect={(poi) => { scrollToPOI(poi); setSelectedPOI(poi); }}
          onConquer={(id) => conquerZone(id)}
          onUpgrade={(id) => upgradeZone(id)}
          onBuyWhale={buyWhale}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#0a1628' },
  viewport:   { width: SW, height: SH, overflow: 'hidden' },
  mapInner:   { position: 'absolute', width: MAP_W, height: MAP_H, left: MAP_OFFSET_X, top: MAP_OFFSET_Y },
  mapImage:   { width: MAP_W, height: MAP_H },
  mapPlaceholder: { backgroundColor: '#1a3050', alignItems: 'center', justifyContent: 'center', gap: 12 },
  placeholderEmoji: { fontSize: 48 },
  placeholderTxt:   { fontSize: 18, color: '#aaa', fontWeight: '600' },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0a1628',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingEmoji: { fontSize: 64 },
  loadingName:  { fontSize: 20, fontWeight: '800', color: '#fff', marginTop: 4 },
  loadingTxt:   { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 4 },

  // Markers
  marker:     { position: 'absolute', alignItems: 'center', gap: 1 },
  stockBadge: {
    backgroundColor: 'rgba(249,168,37,0.9)', borderRadius: 8,
    paddingHorizontal: 5, paddingVertical: 1, marginBottom: 1,
  },
  stockTxt:   { fontSize: 9, fontWeight: '800', color: '#fff' },
  markerEmoji: {
    fontSize: 26,
    textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3,
  },
  markerBubble:          { backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, maxWidth: 120, alignItems: 'center' },
  markerBubbleConquered: { backgroundColor: 'rgba(180,120,0,0.85)', borderWidth: 1, borderColor: '#ffd700' },
  markerLabel:           { fontSize: 10, color: '#fff', fontWeight: '600', textAlign: 'center' },
  levelDots:             { fontSize: 8, color: '#ffd700', letterSpacing: 1 },

  // Off-screen bubbles
  bubble: {
    position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.35)', paddingHorizontal: 6, paddingVertical: 5,
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  bubbleLeft:  { left: 6 },
  bubbleRight: { right: 6 },
  bubbleArrow: { fontSize: 9, color: 'rgba(255,255,255,0.55)' },
  bubbleEmoji: { fontSize: 18 },

  // Header
  header:    { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', gap: 4, paddingBottom: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ageBadge:  {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  ageEmoji:   { fontSize: 18 },
  ageName:    { fontSize: 15, fontWeight: '700', color: '#fff' },
  iconBtn:    {
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 20, width: 38, height: 38,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  iconBtnTxt: { fontSize: 18, color: '#fff' },
  conqueredPill:    { position: 'absolute', top: -4, right: -4, backgroundColor: '#ffd700', borderRadius: 8, paddingHorizontal: 4, paddingVertical: 1 },
  conqueredPillTxt: { fontSize: 9, fontWeight: '800', color: '#000' },
  whaleCountBadge:  { backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 20, paddingHorizontal: 10, height: 38, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  whaleCountTxt:    { fontSize: 14, fontWeight: '700', color: '#fff' },
  hint:       { fontSize: 11, color: 'rgba(255,255,255,0.5)' },

  // POI detail
  detailOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end' },
  detailCard: {
    backgroundColor: '#1a1a2e', margin: 16, borderRadius: 20, padding: 24,
    alignItems: 'center', gap: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  detailEmoji:    { fontSize: 44 },
  detailTitle:    { fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center' },
  detailDesc:     { fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 20 },
  conqueredBadge: {
    backgroundColor: 'rgba(180,120,0,0.25)', borderWidth: 1, borderColor: '#ffd700',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center', gap: 4, width: '100%',
  },
  conqueredTxt:   { color: '#ffd700', fontWeight: '700', fontSize: 15 },
  bonusTxt:       { color: '#ffe082', fontSize: 13 },
  bonusTxtSmall:  { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  stockRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 10 },
  stockLabel:     { fontSize: 13, color: '#fff' },
  harvestBtn:     { backgroundColor: '#f9a825', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  harvestBtnTxt:  { color: '#fff', fontWeight: '700', fontSize: 13 },
  upgradeBtn:     { backgroundColor: '#1565c0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center', width: '100%', gap: 2 },
  maxLevelTxt:    { color: '#ffd700', fontWeight: '700', fontSize: 14 },
  conquerBtn:         { backgroundColor: '#2e7d32', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center', width: '100%', gap: 2 },
  conquerBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.08)' },
  conquerBtnTxt:      { color: '#fff', fontWeight: '700', fontSize: 14 },
  detailCloseBtn: { marginTop: 4, backgroundColor: '#f9a825', paddingHorizontal: 28, paddingVertical: 10, borderRadius: 12 },
  detailCloseTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Territory panel
  panelOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end' },
  panelCard: {
    backgroundColor: '#12122a', marginHorizontal: 12, marginBottom: 12, borderRadius: 24,
    paddingTop: 20, paddingHorizontal: 16, paddingBottom: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', maxHeight: SH * 0.82,
  },
  panelTitle: { fontSize: 18, fontWeight: '800', color: '#fff', textAlign: 'center' },
  panelSub:   { fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: 10, marginTop: 2 },
  whaleBtn:   { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(30,100,180,0.3)', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: 'rgba(100,160,255,0.4)', marginBottom: 10 },
  whaleBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' },
  whaleBtnEmoji: { fontSize: 28 },
  whaleBtnTxt:   { fontSize: 13, fontWeight: '700', color: '#fff', flexShrink: 1 },
  whaleBtnSub:   { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  panelScroll: { flexGrow: 0 },
  panelRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: 'transparent' },
  panelRowConquered:   { backgroundColor: 'rgba(180,120,0,0.15)', borderColor: 'rgba(255,215,0,0.2)' },
  panelRowAffordable:  { backgroundColor: 'rgba(249,168,37,0.15)', borderColor: 'rgba(255,215,0,0.6)' },
  panelRowCantAfford:  { opacity: 0.45 },
  panelRowStateIcon:   { fontSize: 18, width: 24, textAlign: 'center' },
  panelRowEmoji:       { fontSize: 26 },
  panelRowInfo:        { flex: 1 },
  panelRowName:        { fontSize: 14, fontWeight: '700', color: '#fff' },
  panelRowNameDim:     { color: 'rgba(255,255,255,0.5)' },
  panelRowBonus:          { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  panelRowBonusConquered: { color: '#ffd700' },
  panelActionBtn:  { backgroundColor: '#f9a825', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
  panelUpgradeBtn: { backgroundColor: '#1565c0' },
  panelActionTxt:  { fontSize: 16 },
  panelCloseBtn:          { marginTop: 8, marginBottom: 8, backgroundColor: '#f9a825', paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
});
