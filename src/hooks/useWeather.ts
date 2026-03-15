import { useState, useEffect, useCallback, useRef } from "react";

export interface WeatherData {
  current: { temp: number; weatherCode: number };
  daily: {
    dates: string[];
    tempMax: number[];
    tempMin: number[];
    precip: number[];
  };
}

interface UseWeatherResult {
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const CACHE_KEY = "garden-weather-cache";
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

interface CachedWeather {
  data: WeatherData;
  zipCode: string;
  timestamp: number;
}

function getCached(zipCode: string): WeatherData | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedWeather = JSON.parse(raw);
    if (
      cached.zipCode === zipCode &&
      Date.now() - cached.timestamp < CACHE_TTL
    ) {
      return cached.data;
    }
  } catch {
    // ignore
  }
  return null;
}

function setCache(zipCode: string, data: WeatherData): void {
  const entry: CachedWeather = { data, zipCode, timestamp: Date.now() };
  sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry));
}

// Convert Celsius to Fahrenheit
function cToF(c: number): number {
  return Math.round(c * 9 / 5 + 32);
}

async function fetchWeather(zipCode: string): Promise<WeatherData> {
  // Step 1: geocode zip to lat/lon
  const geoRes = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(zipCode)}&count=1&language=en&format=json`
  );
  if (!geoRes.ok) throw new Error("Geocoding request failed");
  const geoData = await geoRes.json();
  if (!geoData.results || geoData.results.length === 0) {
    throw new Error("Location not found for zip code");
  }
  const { latitude, longitude } = geoData.results[0];

  // Step 2: fetch weather
  const weatherRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&current=temperature_2m,weather_code&timezone=auto&forecast_days=7`
  );
  if (!weatherRes.ok) throw new Error("Weather request failed");
  const w = await weatherRes.json();

  return {
    current: {
      temp: cToF(w.current.temperature_2m),
      weatherCode: w.current.weather_code,
    },
    daily: {
      dates: w.daily.time,
      tempMax: (w.daily.temperature_2m_max as number[]).map(cToF),
      tempMin: (w.daily.temperature_2m_min as number[]).map(cToF),
      precip: w.daily.precipitation_sum,
    },
  };
}

export function useWeather(zipCode: string): UseWeatherResult {
  const [weather, setWeather] = useState<WeatherData | null>(
    () => (zipCode ? getCached(zipCode) : null)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  useEffect(() => {
    if (!zipCode) return;
    // On initial mount, skip if cache was loaded via useState initializer
    if (fetchTrigger === 0 && getCached(zipCode)) return;

    // Data-fetching effects legitimately need to set loading/error state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    fetchWeather(zipCode)
      .then((data) => {
        if (controller.signal.aborted) return;
        setCache(zipCode, data);
        setWeather(data);
        setError(null);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to fetch weather");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [zipCode, fetchTrigger]);

  const refresh = useCallback(() => {
    setFetchTrigger((n) => n + 1);
  }, []);

  return { weather, loading, error, refresh };
}
