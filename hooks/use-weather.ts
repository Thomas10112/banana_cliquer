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

let _permissionGranted: boolean | null = null; // cache module-level, une seule demande par session
let _fetching = false;                          // empêche les appels concurrents

export function useWeather(): WeatherInfo {
  const [info, setInfo] = useState<WeatherInfo>({ multiplier: 1, emoji: '🌡️', label: '', type: 'cloudy' });
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    async function doFetch() {
      if (_fetching) return;
      _fetching = true;
      try {
        if (_permissionGranted === null) {
          const { status } = await Location.requestForegroundPermissionsAsync();
          _permissionGranted = status === 'granted';
        }
        if (!_permissionGranted) return;

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
        });

        const { latitude, longitude } = loc.coords;

        const res = await global.fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}`,
        );
        if (res.status === 429) return; // rate limit OWM, on attend le prochain cycle
        const data = await res.json();

        if (data.weather?.[0]?.id) {
          setInfo(getWeatherInfo(data.weather[0].id));
        }
      } catch {
        // erreur réseau ou localisation, on garde la dernière valeur connue
      } finally {
        _fetching = false;
      }
    }

    doFetch();
    intervalRef.current = setInterval(doFetch, FETCH_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, []);

  return info;
}
