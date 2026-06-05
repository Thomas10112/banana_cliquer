import { useGameContext } from '@/store/game-context';
import { AGE_THEMES, DEFAULT_THEME } from '@/constants/age-themes';

export function useAgeTheme() {
  const { state } = useGameContext();
  return AGE_THEMES[state.currentAge] ?? DEFAULT_THEME;
}
