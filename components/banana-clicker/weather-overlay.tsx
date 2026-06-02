import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type { WeatherType } from '@/hooks/use-weather';

const TINT: Record<WeatherType, string> = {
  storm:   'rgba(10,  10,  40,  0.40)',
  rain:    'rgba(20,  60,  120, 0.22)',
  drizzle: 'rgba(60,  100, 160, 0.14)',
  snow:    'rgba(200, 230, 255, 0.12)',
  fog:     'rgba(180, 180, 180, 0.38)',
  sun:     'rgba(255, 190, 30,  0.10)',
  cloudy:  'rgba(80,  90,  110, 0.18)',
};

// ─── Rain drop ───────────────────────────────────────────────────────────────

interface DropProps {
  containerWidth: number;
  containerHeight: number;
  delay: number;
  duration: number;
  opacity: number;
}

function RainDrop({ containerWidth, containerHeight, delay, duration, opacity }: DropProps) {
  const x    = useRef(Math.random() * containerWidth).current;
  const y    = useSharedValue(-15);

  useEffect(() => {
    y.value = withDelay(
      delay,
      withRepeat(withTiming(containerHeight + 15, { duration, easing: Easing.linear }), -1),
    );
  }, []);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <Animated.View
      style={[
        { position: 'absolute', left: x, top: 0, width: 1.5, height: 13,
          backgroundColor: 'rgba(160,210,255,0.85)', borderRadius: 2, opacity },
        style,
      ]}
    />
  );
}

// ─── Snowflake ────────────────────────────────────────────────────────────────

interface FlakeProps { containerWidth: number; containerHeight: number; delay: number }

function Snowflake({ containerWidth, containerHeight, delay }: FlakeProps) {
  const x       = useRef(Math.random() * containerWidth).current;
  const size    = useRef(Math.random() * 4 + 3).current;
  const dur     = useRef(Math.random() * 3000 + 4000).current;
  const y       = useSharedValue(-10);
  const sway    = useSharedValue(0);

  useEffect(() => {
    y.value = withDelay(
      delay,
      withRepeat(withTiming(containerHeight + 10, { duration: dur, easing: Easing.linear }), -1),
    );
    sway.value = withRepeat(
      withSequence(withTiming(9, { duration: 1300 }), withTiming(-9, { duration: 1300 })),
      -1,
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }, { translateX: sway.value }],
  }));
  return (
    <Animated.View
      style={[
        { position: 'absolute', left: x, top: 0, width: size, height: size,
          borderRadius: size / 2, backgroundColor: 'rgba(255,255,255,0.88)' },
        style,
      ]}
    />
  );
}

// ─── Lightning flash ──────────────────────────────────────────────────────────

function LightningFlash() {
  const opacity   = useSharedValue(0);
  const timeout   = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    function schedule() {
      timeout.current = setTimeout(() => {
        opacity.value = withSequence(
          withTiming(0.55, { duration: 55 }),
          withTiming(0,    { duration: 60 }),
          withTiming(0.40, { duration: 45 }),
          withTiming(0,    { duration: 90 }),
        );
        schedule();
      }, Math.random() * 5000 + 2000);
    }
    schedule();
    return () => clearTimeout(timeout.current);
  }, []);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(220,235,255,1)' }, style]}
    />
  );
}

// ─── Cloud shadow ─────────────────────────────────────────────────────────────

function CloudShadow({ containerWidth, containerHeight, delay }: { containerWidth: number; containerHeight: number; delay: number }) {
  const x    = useSharedValue(-containerWidth * 0.6);
  const size = useRef(Math.random() * containerWidth * 0.5 + containerWidth * 0.3).current;
  const top  = useRef(Math.random() * containerHeight * 0.6).current;

  useEffect(() => {
    x.value = withDelay(delay, withRepeat(
      withTiming(containerWidth * 1.2, { duration: Math.random() * 14000 + 12000, easing: Easing.linear }),
      -1,
    ));
  }, []);

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <Animated.View
      style={[{
        position: 'absolute', top, left: 0,
        width: size, height: size * 0.5, borderRadius: size * 0.25,
        backgroundColor: 'rgba(60,70,90,0.12)',
      }, style]}
    />
  );
}

// ─── Sun glow ─────────────────────────────────────────────────────────────────

function SunGlow({ containerWidth }: { containerWidth: number }) {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0.85, { duration: 2500 }), withTiming(0.5, { duration: 2500 })),
      -1,
    );
  }, []);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[{
        position: 'absolute', top: -70,
        left: containerWidth / 2 - 130,
        width: 260, height: 260, borderRadius: 130,
        backgroundColor: 'rgba(255,225,50,0.28)',
      }, style]}
    />
  );
}

// ─── Main overlay ─────────────────────────────────────────────────────────────

interface Props { type: WeatherType; height: number }

export function WeatherOverlay({ type, height }: Props) {
  const { width } = useWindowDimensions();

  const drops = useMemo(() => {
    if (type !== 'rain' && type !== 'storm' && type !== 'drizzle') return [];
    const count    = type === 'drizzle' ? 15 : type === 'storm' ? 38 : 26;
    const isStorm  = type === 'storm';
    const isDrizzle = type === 'drizzle';
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      delay:    Math.random() * 1200,
      duration: isStorm  ? Math.random() * 200 + 480
               : isDrizzle ? Math.random() * 600 + 900
               : Math.random() * 400 + 700,
      opacity: isDrizzle ? 0.45 : 0.75,
    }));
  }, [type]);

  const flakes = useMemo(() => {
    if (type !== 'snow') return [];
    return Array.from({ length: 22 }, (_, i) => ({ id: i, delay: Math.random() * 4500 }));
  }, [type]);

  return (
    <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: TINT[type] }]} />

      {type === 'sun'    && <SunGlow containerWidth={width} />}
      {type === 'cloudy' && (
        <>
          <CloudShadow containerWidth={width} containerHeight={height} delay={0} />
          <CloudShadow containerWidth={width} containerHeight={height} delay={5000} />
          <CloudShadow containerWidth={width} containerHeight={height} delay={10000} />
        </>
      )}

      {drops.map(d => (
        <RainDrop
          key={d.id}
          containerWidth={width}
          containerHeight={height}
          delay={d.delay}
          duration={d.duration}
          opacity={d.opacity}
        />
      ))}

      {flakes.map(f => (
        <Snowflake
          key={f.id}
          containerWidth={width}
          containerHeight={height}
          delay={f.delay}
        />
      ))}

      {type === 'storm' && <LightningFlash />}
    </View>
  );
}
