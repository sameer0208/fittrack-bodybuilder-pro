import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Flame,
  Droplets,
  Moon,
  Dumbbell,
  Apple,
  Scale,
} from 'lucide-react';
import { workoutPlan } from '../data/workoutPlan';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

API.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('ft_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

const DEFAULT_EXERCISES = [
  'bench_press',
  'squat',
  'deadlift',
  'overhead_press',
  'barbell_row',
  'lat_pulldown',
];

const MUSCLE_GROUPS_ORDER = ['Chest', 'Back', 'Legs', 'Shoulders', 'Biceps', 'Triceps', 'Core'];

/** Map backend exercise keys/names to one of the radar muscle groups */
function mapExerciseToMuscleGroup(exerciseName) {
  const n = String(exerciseName || '').toLowerCase().replace(/_/g, ' ');
  if (/(crunch|plank|\bab\b|abs?)/.test(n)) return 'Core';
  if (/(tricep|dip|skull)/.test(n)) return 'Triceps';
  if (/(curl|bicep)/.test(n)) return 'Biceps';
  if (/(bench|chest|pec|fly)/.test(n)) return 'Chest';
  if (/(squat|leg|lunge|calf|romanian|glute|quad|hamstring)/.test(n)) return 'Legs';
  if (/(deadlift|\brow\b|pull|lat|face)/.test(n)) return 'Back';
  if (/(shoulder|lateral|delt|overhead|\bohp\b)/.test(n)) return 'Shoulders';
  if (/\bpush\b/.test(n) && !/tricep|down/.test(n)) return 'Chest';
  if (/\bpress\b/.test(n)) {
    if (/(bench|incline|decline|chest|db)/.test(n)) return 'Chest';
    if (/(overhead|shoulder|military|arnold)/.test(n)) return 'Shoulders';
    return 'Shoulders';
  }
  return null;
}

function aggregateMuscleBalance(raw) {
  const totals = Object.fromEntries(MUSCLE_GROUPS_ORDER.map((g) => [g, 0]));
  if (!raw || typeof raw !== 'object') return totals;
  for (const [exercise, count] of Object.entries(raw)) {
    const group = mapExerciseToMuscleGroup(exercise);
    if (group && totals[group] !== undefined) {
      totals[group] += Number(count) || 0;
    }
  }
  return totals;
}

function buildRadarData(totals) {
  return MUSCLE_GROUPS_ORDER.map((subject) => ({
    subject,
    hits: totals[subject] ?? 0,
    target: 2,
  }));
}

function collectExercisesFromPlan() {
  const set = new Set(DEFAULT_EXERCISES);
  Object.values(workoutPlan).forEach((day) => {
    day.exercises?.forEach((e) => set.add(e));
  });
  return Array.from(set).sort();
}

function ComparisonArrow({ current, previous, higherIsBetter = true }) {
  const c = Number(current) || 0;
  const p = Number(previous) || 0;
  if (p === 0 && c === 0) {
    return <Minus className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden />;
  }
  const delta = c - p;
  if (delta === 0) {
    return <Minus className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden />;
  }
  const improved = higherIsBetter ? delta > 0 : delta < 0;
  if (delta > 0) {
    return improved ? (
      <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden />
    ) : (
      <TrendingUp className="w-3.5 h-3.5 text-red-400 shrink-0" aria-hidden />
    );
  }
  return improved ? (
    <TrendingDown className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden />
  ) : (
    <TrendingDown className="w-3.5 h-3.5 text-red-400 shrink-0" aria-hidden />
  );
}

const chartTooltipStyle = {
  contentStyle: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '12px',
    fontSize: '12px',
  },
  labelStyle: { color: '#94a3b8' },
  itemStyle: { color: '#f8fafc' },
};

export default function Analytics() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [weekly, setWeekly] = useState(null);
  const [muscleRaw, setMuscleRaw] = useState(null);
  const [volumeExercise, setVolumeExercise] = useState('bench_press');
  const [volumeSeries, setVolumeSeries] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [loadingWeekly, setLoadingWeekly] = useState(true);
  const [loadingMuscle, setLoadingMuscle] = useState(true);
  const [loadingVolume, setLoadingVolume] = useState(false);
  const [loadingForecast, setLoadingForecast] = useState(true);

  const exerciseOptions = useMemo(() => collectExercisesFromPlan(), []);

  const fetchWeekly = useCallback(async () => {
    setLoadingWeekly(true);
    try {
      const { data } = await API.get('/analytics/weekly-report', { params: { weekOffset } });
      setWeekly(data);
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || 'Could not load weekly report');
      setWeekly(null);
    } finally {
      setLoadingWeekly(false);
    }
  }, [weekOffset]);

  const fetchMuscle = useCallback(async () => {
    setLoadingMuscle(true);
    try {
      const { data } = await API.get('/analytics/muscle-balance');
      setMuscleRaw(data);
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || 'Could not load muscle balance');
      setMuscleRaw(null);
    } finally {
      setLoadingMuscle(false);
    }
  }, []);

  const fetchVolume = useCallback(async () => {
    if (!volumeExercise) return;
    setLoadingVolume(true);
    try {
      const { data } = await API.get('/analytics/volume-progression', {
        params: { exerciseId: volumeExercise },
      });
      setVolumeSeries(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || 'Could not load volume data');
      setVolumeSeries([]);
    } finally {
      setLoadingVolume(false);
    }
  }, [volumeExercise]);

  const fetchForecastData = useCallback(async () => {
    setLoadingForecast(true);
    try {
      const { data } = await API.get('/analytics/forecast');
      setForecast(data);
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || 'Could not load weight forecast');
      setForecast(null);
    } finally {
      setLoadingForecast(false);
    }
  }, []);

  useEffect(() => {
    fetchWeekly();
  }, [fetchWeekly]);

  useEffect(() => {
    fetchMuscle();
  }, [fetchMuscle]);

  useEffect(() => {
    fetchVolume();
  }, [fetchVolume]);

  useEffect(() => {
    fetchForecastData();
  }, [fetchForecastData]);

  const radarData = useMemo(() => {
    const totals = aggregateMuscleBalance(muscleRaw);
    return buildRadarData(totals);
  }, [muscleRaw]);

  const volumeChartData = useMemo(() => {
    return (volumeSeries || []).map((row) => ({
      ...row,
      label: row.date || (row.fullDate ? dayjs(row.fullDate).format('MMM D') : ''),
      volume: Number(row.volume) || 0,
    }));
  }, [volumeSeries]);

  const maxVolume = useMemo(() => {
    if (!volumeChartData.length) return 0;
    return Math.max(...volumeChartData.map((d) => d.volume));
  }, [volumeChartData]);

  const forecastChart = useMemo(() => {
    if (!forecast?.weightHistory?.length) {
      return { historyLine: [], forecastLine: [], domain: [0, 1] };
    }
    const sorted = [...forecast.weightHistory].sort(
      (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf()
    );
    const rate = Number(forecast.ratePerWeek);
    const target = Number(forecast.targetWeight);
    const projectedDate = forecast.projectedDate;

    const historyLine = sorted.map((w) => ({
      ts: dayjs(w.date).valueOf(),
      weight: Number(w.weight),
    }));

    let forecastLine = [];
    if (rate > 0 && projectedDate && sorted.length) {
      const last = sorted[sorted.length - 1];
      forecastLine = [
        { ts: dayjs(last.date).valueOf(), weight: Number(last.weight) },
        { ts: dayjs(projectedDate).valueOf(), weight: target },
      ];
    }

    const allTs = [...historyLine, ...forecastLine].map((p) => p.ts);
    const domain = [Math.min(...allTs), Math.max(...allTs)];

    return { historyLine, forecastLine, domain };
  }, [forecast]);

  const waterPct = weekly
    ? Math.round(
        ((Number(weekly.waterAdherenceDays) || 0) / Math.max(Number(weekly.totalDays) || 1, 1)) * 100
      )
    : 0;

  const projectionText = useMemo(() => {
    if (!forecast) return null;
    const rate = Number(forecast.ratePerWeek);
    if (!rate || rate <= 0) {
      return 'Insufficient data for projection';
    }
    const target = Number(forecast.targetWeight);
    const proj = forecast.projectedDate
      ? dayjs(forecast.projectedDate).format('MMM D, YYYY')
      : '—';
    const sign = rate > 0 ? '+' : '';
    return `At your current rate (${sign}${rate.toFixed(1)}kg/week), you'll reach ${target}kg by ${proj}`;
  }, [forecast]);

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Mobile sticky header */}
      <div className="sticky top-0 z-30 lg:hidden bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600/20 rounded-lg flex items-center justify-center">
            <BarChart3 size={18} className="text-indigo-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-white leading-tight">Analytics</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Advanced</div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-4 lg:pt-8 pb-24">
        <div className="hidden lg:block mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="text-indigo-400" size={28} />
            Analytics
          </h1>
          <p className="text-slate-400 text-sm mt-1">Weekly insights, balance, volume, and goals</p>
        </div>

        {/* 1. Weekly Report */}
        <section className="bg-slate-800 border border-slate-700 rounded-2xl p-4 lg:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="text-lg font-bold text-white">Weekly report</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setWeekOffset((w) => w + 1)}
                className="p-2 rounded-xl bg-slate-700/80 border border-slate-600 text-slate-200 hover:bg-slate-600 transition-colors"
                aria-label="Previous week"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm text-slate-300 tabular-nums min-w-[10rem] text-center">
                {weekly?.weekStart && weekly?.weekEnd
                  ? `${dayjs(weekly.weekStart).format('MMM D')} – ${dayjs(weekly.weekEnd).format('MMM D')}`
                  : loadingWeekly
                    ? 'Loading…'
                    : '—'}
              </span>
              <button
                type="button"
                disabled={weekOffset <= 0}
                onClick={() => setWeekOffset((w) => Math.max(0, w - 1))}
                className="p-2 rounded-xl bg-slate-700/80 border border-slate-600 text-slate-200 hover:bg-slate-600 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                aria-label="Next week"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {loadingWeekly && !weekly ? (
            <div className="text-slate-500 text-sm py-8 text-center">Loading weekly stats…</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="rounded-xl bg-slate-900/50 border border-slate-700/80 p-3">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                  <Dumbbell size={14} />
                  Workouts
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-white tabular-nums">
                    {weekly?.workoutsCompleted ?? '—'}
                  </span>
                  <ComparisonArrow
                    current={weekly?.workoutsCompleted}
                    previous={weekly?.prevWorkoutsCompleted}
                  />
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  vs {weekly?.prevWorkoutsCompleted ?? '—'} prior week
                </div>
              </div>

              <div className="rounded-xl bg-slate-900/50 border border-slate-700/80 p-3">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                  <Apple size={14} />
                  Avg calories
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-white tabular-nums">
                    {weekly?.avgCalories != null ? Math.round(weekly.avgCalories) : '—'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">daily average</div>
              </div>

              <div className="rounded-xl bg-slate-900/50 border border-slate-700/80 p-3">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                  <Droplets size={14} />
                  Water
                </div>
                <div className="text-xl font-bold text-indigo-400 tabular-nums">{waterPct}%</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {weekly?.waterAdherenceDays ?? 0}/{weekly?.totalDays ?? 7} days
                </div>
              </div>

              <div className="rounded-xl bg-slate-900/50 border border-slate-700/80 p-3">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                  <Scale size={14} />
                  Volume
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-white tabular-nums">
                    {weekly?.totalVolume != null
                      ? `${(Number(weekly.totalVolume) / 1000).toFixed(1)}t`
                      : '—'}
                  </span>
                  <ComparisonArrow current={weekly?.totalVolume} previous={weekly?.prevVolume} />
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">vs prior week</div>
              </div>

              <div className="rounded-xl bg-slate-900/50 border border-slate-700/80 p-3">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                  <Moon size={14} />
                  Avg sleep
                </div>
                <div className="text-xl font-bold text-white tabular-nums">
                  {weekly?.avgSleepHours != null ? `${Number(weekly.avgSleepHours).toFixed(1)}h` : '—'}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">nightly</div>
              </div>

              <div className="rounded-xl bg-slate-900/50 border border-slate-700/80 p-3">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                  <Flame size={14} />
                  Streak
                </div>
                <div className="text-xl font-bold text-orange-400 tabular-nums">
                  {weekly?.streak ?? '—'}
                  <span className="text-sm font-semibold text-slate-400 ml-1">days</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">keep it going</div>
              </div>
            </div>
          )}
        </section>

        {/* 2. Muscle balance */}
        <section className="bg-slate-800 border border-slate-700 rounded-2xl p-4 lg:p-6 mb-6">
          <h2 className="text-lg font-bold text-white mb-4">Muscle balance</h2>
          <p className="text-slate-400 text-sm mb-4">
            Hit frequency by muscle group (target line: 2×/week).
          </p>
          {loadingMuscle && !muscleRaw ? (
            <div className="h-[280px] flex items-center justify-center text-slate-500 text-sm">
              Loading chart…
            </div>
          ) : (
            <div className="w-full h-[300px] sm:h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 'auto']}
                    tick={{ fill: '#64748b', fontSize: 10 }}
                  />
                  <Radar
                    name="Hits"
                    dataKey="hits"
                    stroke="#6366f1"
                    fill="#6366f1"
                    fillOpacity={0.35}
                    strokeWidth={2}
                  />
                  <Radar
                    name="Target (2/wk)"
                    dataKey="target"
                    stroke="#10b981"
                    fill="none"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                  <Tooltip {...chartTooltipStyle} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* 3. Volume progression */}
        <section className="bg-slate-800 border border-slate-700 rounded-2xl p-4 lg:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4">
            <h2 className="text-lg font-bold text-white">Volume progression</h2>
            <label className="flex flex-col gap-1 text-xs text-slate-400">
              Exercise
              <select
                value={volumeExercise}
                onChange={(e) => setVolumeExercise(e.target.value)}
                className="bg-slate-900 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-w-[200px]"
              >
                {exerciseOptions.map((id) => (
                  <option key={id} value={id}>
                    {id.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {loadingVolume ? (
            <div className="h-[260px] flex items-center justify-center text-slate-500 text-sm">
              Loading volume…
            </div>
          ) : !volumeChartData.length ? (
            <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm">
              No volume data for this exercise yet.
            </div>
          ) : (
            <div className="w-full h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={volumeChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.6)" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                  />
                  <Tooltip {...chartTooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="volume"
                    name="Volume"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={(props) => {
                      const { cx, cy, payload } = props;
                      const isPr = payload.volume > 0 && payload.volume === maxVolume;
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isPr ? 6 : 3}
                          fill={isPr ? '#fbbf24' : '#6366f1'}
                          stroke={isPr ? '#f59e0b' : '#6366f1'}
                          strokeWidth={isPr ? 2 : 0}
                        />
                      );
                    }}
                    activeDot={{ r: 7, fill: '#818cf8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* 4. Goal forecasting */}
        <section className="bg-slate-800 border border-slate-700 rounded-2xl p-4 lg:p-6 mb-6">
          <h2 className="text-lg font-bold text-white mb-2">Goal forecasting</h2>
          {loadingForecast && !forecast ? (
            <p className="text-slate-500 text-sm mb-4">Loading forecast…</p>
          ) : (
            <p className="text-slate-300 text-sm mb-4">
              {projectionText || 'Insufficient data for projection'}
            </p>
          )}

          {loadingForecast && !forecast?.weightHistory?.length ? (
            <div className="h-[260px] flex items-center justify-center text-slate-500 text-sm">
              Loading chart…
            </div>
          ) : !forecast?.weightHistory?.length ? (
            <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">
              Log weight entries to see your trend and projection.
            </div>
          ) : (
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.6)" />
                  <XAxis
                    type="number"
                    dataKey="ts"
                    domain={forecastChart.domain}
                    tickFormatter={(ts) => dayjs(ts).format('MMM D')}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    domain={['auto', 'auto']}
                    width={44}
                  />
                  <Tooltip
                    {...chartTooltipStyle}
                    labelFormatter={(ts) => dayjs(ts).format('MMM D, YYYY')}
                    formatter={(value) => [`${Number(value).toFixed(1)} kg`, 'Weight']}
                  />
                  <Line
                    data={forecastChart.historyLine}
                    type="monotone"
                    dataKey="weight"
                    name="Logged"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={{ fill: '#6366f1', r: 3 }}
                    activeDot={{ r: 5 }}
                    isAnimationActive={false}
                  />
                  {forecastChart.forecastLine.length === 2 && (
                    <Line
                      data={forecastChart.forecastLine}
                      type="linear"
                      dataKey="weight"
                      name="Projected"
                      stroke="#10b981"
                      strokeWidth={2}
                      strokeDasharray="6 5"
                      dot={false}
                      isAnimationActive={false}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
