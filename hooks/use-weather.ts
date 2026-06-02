import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { OPENWEATHER_API_KEY } from '@/constants/config';

export type WeatherType = 'sun' | 'cloudy' | 'rain' | 'drizzle' | 'storm' | 'snow' | 'fog';

export interface WeatherInfo {
  multiplier: number;
  emoji: string;
  label: string;
  type: WeatherType;
}

function getWeatherInfo(id: number): WeatherInfo {
  if (id >= 200 && id < 300) return { multiplier: 0.5,  emoji: '⛈️', label: 'Orage',       type: 'storm'   };
  if (id >= 300 && id < 400) return { multiplier: 0.85, emoji: '🌦️', label: 'Bruine',      type: 'drizzle' };
  if (id >= 500 && id < 600) return { multiplier: 0.8,  emoji: '🌧️', label: 'Pluie',       type: 'rain'    };
  if (id >= 600 && id < 700) return { multiplier: 0.7,  emoji: '❄️', label: 'Neige',       type: 'snow'    };
  if (id >= 700 && id < 800) return { multiplier: 0.9,  emoji: '🌫️', label: 'Brouillard',  type: 'fog'     };
  if (id === 800)             return { multiplier: 1.2,  emoji: '☀️', label: 'Ensoleillé',  type: 'sun'     };
  return                             { multiplier: 1.0,  emoji: '☁️', label: 'Nuageux',    type: 'cloudy'  };
}

const FETCH_INTERVAL = 10 * 60 * 1000; // 10 minutes

export function useWeather(): WeatherInfo {
  const [info, setInfo] = useState<WeatherInfo>({ multiplier: 1, emoji: '🌡️', label: '', type: 'cloudy' });
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    async function fetch() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('[weather] Permission de localisation refusée');
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
        });

        const { latitude, longitude } = loc.coords;
        console.log(`[weather] Position: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);

        const res = await global.fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}`,
        );
        const data = await res.json();
        console.log('[weather] Réponse API:', JSON.stringify(data).slice(0, 200));

        if (data.weather?.[0]?.id) {
          const info = getWeatherInfo(data.weather[0].id);
          console.log(`[weather] Condition: id=${data.weather[0].id} → type=${info.type}`);
          setInfo(info);
        } else if (data.cod) {
          console.error('[weather] Erreur API:', data.message ?? data.cod);
        }
      } catch (e) {
        console.error('[weather] Erreur:', e);
      }
    }

    fetch();
    intervalRef.current = setInterval(fetch, FETCH_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, []);

  return info;
}
