import type { WeatherData } from "../hooks/useWeather";

interface WeatherPanelProps {
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  hasZipCode: boolean;
}

function weatherDescription(code: number): { label: string; emoji: string } {
  if (code === 0) return { label: "Clear", emoji: "\u2600\uFE0F" };
  if (code >= 1 && code <= 3) return { label: "Cloudy", emoji: "\u26C5" };
  if (code >= 45 && code <= 48) return { label: "Fog", emoji: "\uD83C\uDF2B\uFE0F" };
  if (code >= 51 && code <= 57) return { label: "Drizzle", emoji: "\uD83C\uDF27\uFE0F" };
  if (code >= 61 && code <= 67) return { label: "Rain", emoji: "\uD83C\uDF27\uFE0F" };
  if (code >= 71 && code <= 77) return { label: "Snow", emoji: "\u2744\uFE0F" };
  if (code >= 80 && code <= 82) return { label: "Showers", emoji: "\uD83C\uDF26\uFE0F" };
  if (code >= 95 && code <= 99) return { label: "Thunderstorm", emoji: "\u26C8\uFE0F" };
  return { label: "Unknown", emoji: "\uD83C\uDF24\uFE0F" };
}

function formatDay(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function WeatherPanel({
  weather,
  loading,
  error,
  onRefresh,
  hasZipCode,
}: WeatherPanelProps) {
  if (!hasZipCode) {
    return (
      <div className="p-3 bg-panel rounded-sm border border-text-secondary/20">
        <h2 className="text-[10px] text-accent uppercase tracking-wider mb-2">
          Weather
        </h2>
        <p className="text-[8px] text-text-secondary">
          Enter zip code in Settings to see weather.
        </p>
      </div>
    );
  }

  if (loading && !weather) {
    return (
      <div className="p-3 bg-panel rounded-sm border border-text-secondary/20">
        <h2 className="text-[10px] text-accent uppercase tracking-wider mb-2">
          Weather
        </h2>
        <p className="text-[8px] text-text-secondary">Loading forecast...</p>
      </div>
    );
  }

  if (error && !weather) {
    return (
      <div className="p-3 bg-panel rounded-sm border border-text-secondary/20">
        <h2 className="text-[10px] text-accent uppercase tracking-wider mb-2">
          Weather
        </h2>
        <p className="text-[8px] text-danger">{error}</p>
        <button
          onClick={onRefresh}
          className="mt-1 text-[7px] text-accent hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!weather) return null;

  const { label, emoji } = weatherDescription(weather.current.weatherCode);
  const hasFrost = weather.daily.tempMin.some((t) => t <= 32);

  return (
    <div className="p-3 bg-panel rounded-sm border border-text-secondary/20">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[10px] text-accent uppercase tracking-wider">
          Weather
        </h2>
        <button
          onClick={onRefresh}
          className="text-[7px] text-text-secondary hover:text-accent transition-colors"
          title="Refresh weather"
        >
          {loading ? "..." : "\u21BB"}
        </button>
      </div>

      {/* Current conditions */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{emoji}</span>
        <div>
          <div className="text-[10px] text-text-primary font-bold">
            {weather.current.temp}\u00B0F
          </div>
          <div className="text-[7px] text-text-secondary">{label}</div>
        </div>
      </div>

      {/* Frost warning */}
      {hasFrost && (
        <div className="mb-2 p-1.5 border-l-2 border-l-danger bg-danger/10 rounded-r-sm">
          <div className="text-[8px] text-danger font-bold">
            \u26A0 FROST WARNING
          </div>
          <div className="text-[7px] text-text-secondary">
            Temps at or below 32\u00B0F in the next 7 days
          </div>
        </div>
      )}

      {/* 7-day forecast */}
      <div className="flex flex-col gap-0.5">
        {weather.daily.dates.map((date, i) => (
          <div
            key={date}
            className={`flex items-center justify-between text-[7px] px-1 py-0.5 rounded-sm ${
              weather.daily.tempMin[i] <= 32
                ? "bg-danger/10 text-text-primary"
                : "text-text-secondary"
            }`}
          >
            <span className="w-[60px] truncate">{formatDay(date)}</span>
            <span className="text-text-primary">
              {weather.daily.tempMax[i]}\u00B0/{weather.daily.tempMin[i]}\u00B0
            </span>
            <span className="w-[28px] text-right">
              {weather.daily.precip[i] > 0
                ? `${weather.daily.precip[i].toFixed(1)}mm`
                : "\u2014"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
