import React, { useEffect, useRef, useState } from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';
import { formatBananas } from '@/utils/format-bananas';

/**
 * Compteur de bananes découplé du re-render global.
 *
 * Le tick du jeu ne tourne plus qu'à 1 Hz (cf. use-game.ts) pour économiser
 * CPU/batterie. Pour garder un compteur fluide, ce composant feuille interpole
 * la production entre deux ticks dans sa propre boucle isolée : seul ce petit
 * `Text` se re-render (~10 fps), jamais l'arbre complet de l'écran.
 *
 * `active=false` (écran non focus) coupe la boucle : rien à animer hors-écran.
 */
export function AnimatedBananaCount({
  bananas,
  bps,
  style,
  active = true,
}: {
  bananas: number;
  bps: number;
  style?: StyleProp<TextStyle>;
  active?: boolean;
}) {
  const [display, setDisplay] = useState(bananas);
  const baseRef     = useRef(bananas);
  const baseTimeRef = useRef(Date.now());
  const bpsRef      = useRef(bps);

  // Recale la base à chaque changement réel de l'état (clic, tick, achat, récolte…)
  useEffect(() => {
    baseRef.current     = bananas;
    bpsRef.current      = bps;
    baseTimeRef.current = Date.now();
    setDisplay(bananas);
  }, [bananas, bps]);

  // Boucle d'interpolation isolée (~10 fps), uniquement quand l'écran est visible
  // et qu'il y a de la production à afficher.
  useEffect(() => {
    if (!active || bps <= 0) return;
    const id = setInterval(() => {
      const elapsed = (Date.now() - baseTimeRef.current) / 1000;
      // plafond à 1.2 s : si un tick est en retard, on n'extrapole pas trop loin
      setDisplay(baseRef.current + bpsRef.current * Math.min(elapsed, 1.2));
    }, 100);
    return () => clearInterval(id);
  }, [active, bps]);

  return <Text style={style}>{formatBananas(display)} 🍌</Text>;
}
