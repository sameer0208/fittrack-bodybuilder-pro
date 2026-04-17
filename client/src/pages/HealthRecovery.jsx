import {
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  ArrowLeft,
  Loader2,
  Moon,
  Pause,
  Play,
  SkipForward,
  Star,
  Trophy,
  Zap,
} from 'lucide-react';
import { routines } from '../data/stretches';

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });
API.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('ft_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

const MOOD_EMOJIS = ['😫', '😟', '😐', '😊', '😁'];
const SORENESS_DOT_CLASS = [
  'bg-emerald-400',
  'bg-lime-400',
  'bg-amber-400',
  'bg-orange-500',
  'bg-red-500',
];

function qualityBarColor(q) {
  if (q <= 2) return '#ef4444';
  if (q === 3) return '#eab308';
  return '#22c55e';
}

function computeDurationHours(bedtime, wakeTime) {
  if (!bedtime || !wakeTime) return null;
  const [bH, bM] = bedtime.split(':').map(Number);
  const [wH, wM] = wakeTime.split(':').map(Number);
  let diff = wH * 60 + wM - (bH * 60 + bM);
  if (diff < 0) diff += 24 * 60;
  return Math.round((diff / 60) * 10) / 10;
}

function playTransitionBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    osc.start(now);
    osc.stop(now + 0.2);
    ctx.resume?.();
  } catch {
    /* ignore */
  }
}

function buildLast7DaysRows(logs, keys, empty = null) {
  const byDate = Object.fromEntries(
    (logs || []).map((row) => [row.date, row])
  );
  const rows = [];
  for (let i = 6; i >= 0; i--) {
    const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
    const found = byDate[date];
    const base = { date, label: dayjs(date).format('MMM D') };
    keys.forEach((k) => {
      base[k] = found && found[k] != null ? found[k] : empty;
    });
    rows.push(base);
  }
  return rows;
}

const SleepTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  if (!p) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-2xl text-xs">
      <p className="text-slate-400 mb-1">{p.label}</p>
      <p className="text-white font-semibold">{p.hours != null ? `${p.hours} h` : 'No data'}</p>
      {p.quality != null && (
        <p className="text-slate-300 mt-1">Quality: {p.quality}/5</p>
      )}
    </div>
  );
};

const CheckinTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-2xl text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={String(p.dataKey)} className="text-white font-semibold capitalize">
          <span style={{ color: p.color }}>{p.name}</span>:{' '}
          {p.value != null ? p.value : '—'}
        </p>
      ))}
    </div>
  );
};

function stretchTimerReducer(state, action) {
  if (action.type === 'reset' && action.routine) {
    const ex = action.routine.exercises || [];
    return {
      phase: 'active',
      idx: 0,
      secondsLeft: ex[0]?.duration ?? 0,
      paused: false,
    };
  }
  if (action.type === 'pause_toggle') {
    return { ...state, paused: !state.paused };
  }

  if (action.type === 'skip') {
    if (state.phase !== 'active') return state;
    playTransitionBeep();
    const ex = action.exercises;
    if (state.idx >= ex.length - 1) {
      return { ...state, phase: 'complete', secondsLeft: 0 };
    }
    const ni = state.idx + 1;
    return { ...state, idx: ni, secondsLeft: ex[ni].duration };
  }

  if (state.phase !== 'active' || state.paused) return state;

  if (action.type === 'tick') {
    if (state.secondsLeft > 1) {
      return { ...state, secondsLeft: state.secondsLeft - 1 };
    }
    playTransitionBeep();
    const ex = action.exercises;
    if (state.idx >= ex.length - 1) {
      return { ...state, phase: 'complete', secondsLeft: 0 };
    }
    const ni = state.idx + 1;
    return { ...state, idx: ni, secondsLeft: ex[ni].duration };
  }

  return state;
}

function StretchTimer({ routine, open, onClose }) {
  const exercises = useMemo(() => routine?.exercises ?? [], [routine?.exercises]);
  const totalSeconds = useMemo(
    () => exercises.reduce((s, e) => s + (e.duration || 0), 0),
    [exercises]
  );

  const [state, dispatch] = useReducer(stretchTimerReducer, {
    phase: 'active',
    idx: 0,
    secondsLeft: 0,
    paused: false,
  });

  const tickRef = useRef(() => {});
  useEffect(() => {
    tickRef.current = () => dispatch({ type: 'tick', exercises });
  }, [exercises, dispatch]);

  useEffect(() => {
    if (!open || !routine) return;
    dispatch({ type: 'reset', routine });
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) {
        const ctx = new Ctx();
        ctx.resume?.();
      }
    } catch {
      /* ignore */
    }
  }, [open, routine]);

  useEffect(() => {
    if (!open || state.phase !== 'active' || state.paused) return;
    const id = setInterval(() => tickRef.current(), 1000);
    return () => clearInterval(id);
  }, [open, state.phase, state.paused]);

  const { idx, secondsLeft, paused, phase } = state;
  const current = exercises[idx];
  const duration = current?.duration ?? 1;
  const progressOverall =
    totalSeconds > 0
      ? (exercises.slice(0, idx).reduce((s, e) => s + e.duration, 0) +
          (duration - secondsLeft)) /
        totalSeconds
      : 0;

  const ringPct = duration > 0 ? Math.max(0, Math.min(1, secondsLeft / duration)) : 0;
  const r = 52;
  const c = 2 * Math.PI * r;
  const strokeDashoffset = c * (1 - ringPct);

  const handleSkip = () => dispatch({ type: 'skip', exercises });

  const handlePause = () => dispatch({ type: 'pause_toggle' });

  if (!open || !routine) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-950 text-white">
      {phase === 'complete' ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 24 }).map((_, i) => (
              <span
                key={i}
                className="absolute text-lg animate-bounce opacity-80"
                style={{
                  left: `${(i * 37) % 100}%`,
                  top: `${(i * 53) % 80}%`,
                  animationDelay: `${(i % 8) * 0.12}s`,
                  animationDuration: `${1.2 + (i % 5) * 0.15}s`,
                }}
              >
                {['✨', '🎉', '⭐', '💪'][i % 4]}
              </span>
            ))}
          </div>
          <Trophy className="w-20 h-20 text-amber-400 mb-4 drop-shadow-lg" strokeWidth={1.5} />
          <h2 className="text-3xl font-bold text-center mb-2">Well done!</h2>
          <p className="text-slate-400 text-center text-sm mb-8">
            You finished <span className="text-white font-semibold">{routine.name}</span>.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-sm shadow-lg shadow-indigo-500/30"
          >
            Close
          </button>
        </div>
      ) : (
        <>
          <header className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-slate-900/90 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
              aria-label="Exit"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-500 truncate">{routine.name}</p>
              <p className="text-sm font-semibold truncate">
                Exercise {idx + 1} / {exercises.length}
              </p>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col items-center">
            <div className="w-full max-w-md mb-6">
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-indigo-500 transition-all duration-300 rounded-full"
                  style={{ width: `${Math.min(100, progressOverall * 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1 text-center">
                Routine progress {Math.round(progressOverall * 100)}%
              </p>
            </div>

            <div className="relative w-44 h-44 mb-8">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r={r}
                  fill="none"
                  stroke="rgb(30 41 59)"
                  strokeWidth="8"
                />
                <circle
                  cx="60"
                  cy="60"
                  r={r}
                  fill="none"
                  stroke="rgb(99 102 241)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={c}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-[stroke-dashoffset] duration-1000 linear"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
                <span className="text-5xl font-bold tabular-nums tracking-tight">
                  {secondsLeft}
                </span>
                <span className="text-xs text-slate-500 mt-1">seconds</span>
              </div>
            </div>

            <div className="w-full max-w-lg bg-slate-800/80 border border-slate-700 rounded-2xl p-5">
              <p className="text-xs uppercase tracking-wide text-indigo-400 font-semibold mb-1">
                {current?.muscleGroup || '—'}
              </p>
              <h3 className="text-xl font-bold text-white mb-2">{current?.name}</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{current?.description}</p>
            </div>
          </div>

          <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-slate-800 bg-slate-900/95 flex gap-3 justify-center shrink-0">
            <button
              type="button"
              onClick={handleSkip}
              className="flex-1 max-w-[160px] py-3 rounded-xl border border-slate-600 text-slate-200 font-semibold text-sm hover:bg-slate-800"
            >
              <span className="inline-flex items-center justify-center gap-2">
                <SkipForward size={18} />
                Skip
              </span>
            </button>
            <button
              type="button"
              onClick={handlePause}
              className="flex-1 max-w-[160px] py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-sm shadow-lg shadow-indigo-500/25"
            >
              <span className="inline-flex items-center justify-center gap-2">
                {paused ? <Play size={18} /> : <Pause size={18} />}
                {paused ? 'Resume' : 'Pause'}
              </span>
            </button>
          </div>
        </>
      )}
    </div>,
    document.body
  );
}

export default function HealthRecovery() {
  const today = dayjs().format('YYYY-MM-DD');

  const [tab, setTab] = useState('sleep');

  const [sleepForm, setSleepForm] = useState({
    date: today,
    bedtime: '22:30',
    wakeTime: '07:00',
    quality: 4,
    notes: '',
  });
  const [sleepLogs, setSleepLogs] = useState([]);
  const [sleepLoading, setSleepLoading] = useState(true);

  const [checkForm, setCheckForm] = useState({
    date: today,
    mood: 3,
    energy: 3,
    soreness: 2,
    notes: '',
  });
  const [checkIns, setCheckIns] = useState([]);
  const [checkLoading, setCheckLoading] = useState(true);

  const [savingSleep, setSavingSleep] = useState(false);
  const [savingCheck, setSavingCheck] = useState(false);

  const [timerRoutine, setTimerRoutine] = useState(null);

  const durationPreview = useMemo(
    () => computeDurationHours(sleepForm.bedtime, sleepForm.wakeTime),
    [sleepForm.bedtime, sleepForm.wakeTime]
  );

  const loadSleep = useCallback(async () => {
    setSleepLoading(true);
    try {
      const { data } = await API.get('/health-log/sleep', { params: { days: 30 } });
      setSleepLogs(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not load sleep logs');
    } finally {
      setSleepLoading(false);
    }
  }, []);

  const loadCheckins = useCallback(async () => {
    setCheckLoading(true);
    try {
      const { data } = await API.get('/health-log/checkin', { params: { days: 30 } });
      setCheckIns(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not load check-ins');
    } finally {
      setCheckLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSleep();
    loadCheckins();
  }, [loadSleep, loadCheckins]);

  const sleepChartData = useMemo(() => {
    const rows = buildLast7DaysRows(sleepLogs, ['durationHours', 'quality'], null);
    return rows.map((row) => {
      const hours =
        row.durationHours != null
          ? Number(row.durationHours)
          : null;
      const q = row.quality != null ? Number(row.quality) : 3;
      return {
        ...row,
        hours,
        hoursDisplay: hours != null ? Number(hours.toFixed(1)) : 0,
        fill: hours != null ? qualityBarColor(q) : '#475569',
        quality: row.quality,
      };
    });
  }, [sleepLogs]);

  const sleepInsights = useMemo(() => {
    const withHours = sleepChartData.filter((r) => r.hours != null && !Number.isNaN(r.hours));
    if (!withHours.length) return { avg: null, bestQ: null };
    const avg =
      withHours.reduce((s, r) => s + r.hours, 0) / withHours.length;
    const bestQ = Math.max(
      ...withHours.map((r) => (r.quality != null ? Number(r.quality) : 0))
    );
    return { avg: Math.round(avg * 10) / 10, bestQ: bestQ > 0 ? bestQ : null };
  }, [sleepChartData]);

  const checkChartData = useMemo(() => {
    return buildLast7DaysRows(checkIns, ['mood', 'energy', 'soreness'], null);
  }, [checkIns]);

  const submitSleep = async (e) => {
    e.preventDefault();
    setSavingSleep(true);
    try {
      await API.post('/health-log/sleep', {
        date: sleepForm.date,
        bedtime: sleepForm.bedtime,
        wakeTime: sleepForm.wakeTime,
        quality: sleepForm.quality,
        notes: sleepForm.notes,
      });
      toast.success('Sleep log saved');
      await loadSleep();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save sleep log');
    } finally {
      setSavingSleep(false);
    }
  };

  const submitCheckin = async (e) => {
    e.preventDefault();
    setSavingCheck(true);
    try {
      await API.post('/health-log/checkin', {
        date: checkForm.date,
        mood: checkForm.mood,
        energy: checkForm.energy,
        soreness: checkForm.soreness,
        notes: checkForm.notes,
      });
      toast.success('Check-in saved');
      await loadCheckins();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save check-in');
    } finally {
      setSavingCheck(false);
    }
  };

  const tabs = [
    { id: 'sleep', label: 'Sleep', icon: Moon },
    { id: 'checkin', label: 'Check-in', icon: Activity },
    { id: 'stretch', label: 'Stretching', icon: Zap },
  ];

  return (
    <div className="min-h-screen pb-36 lg:pb-8">
      <div className="max-w-4xl mx-auto px-4 pt-4 lg:pt-8">
        <header className="sticky top-0 z-20 -mx-4 px-4 py-3 mb-4 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:mb-6 lg:backdrop-blur-none">
          <h1 className="text-2xl font-bold text-white tracking-tight">Health &amp; Recovery</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Sleep, daily check-ins, and guided stretching.
          </p>
          <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-thin">
            {tabs.map(({ id, label, icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                  tab === id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                    : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700/80'
                }`}
              >
                {createElement(icon, { size: 16 })}
                {label}
              </button>
            ))}
          </div>
        </header>

        {tab === 'sleep' && (
          <div className="space-y-6">
            <form
              onSubmit={submitSleep}
              className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                    Date
                  </span>
                  <input
                    type="date"
                    value={sleepForm.date}
                    onChange={(e) => setSleepForm((f) => ({ ...f, date: e.target.value }))}
                    className="mt-1 w-full bg-slate-700/60 border border-slate-600/50 rounded-xl px-3 py-2.5 text-white text-sm"
                  />
                </label>
                <div className="flex items-end">
                  <div className="w-full bg-slate-700/40 border border-slate-600/40 rounded-xl px-3 py-2.5">
                    <p className="text-[10px] uppercase text-slate-500 font-semibold">Duration</p>
                    <p className="text-lg font-bold text-white tabular-nums">
                      {durationPreview != null ? `${durationPreview} h` : '—'}
                    </p>
                  </div>
                </div>
                <label className="block">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                    Bedtime
                  </span>
                  <input
                    type="time"
                    value={sleepForm.bedtime}
                    onChange={(e) => setSleepForm((f) => ({ ...f, bedtime: e.target.value }))}
                    className="mt-1 w-full bg-slate-700/60 border border-slate-600/50 rounded-xl px-3 py-2.5 text-white text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                    Wake time
                  </span>
                  <input
                    type="time"
                    value={sleepForm.wakeTime}
                    onChange={(e) => setSleepForm((f) => ({ ...f, wakeTime: e.target.value }))}
                    className="mt-1 w-full bg-slate-700/60 border border-slate-600/50 rounded-xl px-3 py-2.5 text-white text-sm"
                  />
                </label>
              </div>

              <div>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Sleep quality
                </span>
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setSleepForm((f) => ({ ...f, quality: n }))}
                      className="p-1.5 rounded-lg hover:bg-slate-700/80 transition-colors"
                      aria-label={`Quality ${n}`}
                    >
                      <Star
                        size={28}
                        className={
                          n <= sleepForm.quality
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-600'
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Notes
                </span>
                <textarea
                  value={sleepForm.notes}
                  onChange={(e) => setSleepForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  placeholder="Dreams, disruptions, supplements…"
                  className="mt-1 w-full bg-slate-700/60 border border-slate-600/50 rounded-xl px-3 py-2.5 text-white text-sm resize-none placeholder:text-slate-500"
                />
              </label>

              <button
                type="submit"
                disabled={savingSleep}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 font-semibold text-sm shadow-lg shadow-indigo-500/20 inline-flex items-center justify-center gap-2"
              >
                {savingSleep && <Loader2 className="animate-spin" size={18} />}
                Save Sleep Log
              </button>
            </form>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
              <h2 className="text-sm font-semibold text-white mb-1">Last 7 nights</h2>
              <p className="text-xs text-slate-500 mb-4">Hours slept (bar color = quality)</p>
              {sleepLoading ? (
                <div className="h-48 flex items-center justify-center text-slate-500">
                  <Loader2 className="animate-spin" />
                </div>
              ) : (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sleepChartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} />
                      <YAxis
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        axisLine={false}
                        domain={[0, 'auto']}
                        tickFormatter={(v) => `${v}h`}
                      />
                      <Tooltip content={<SleepTooltip />} cursor={{ fill: 'rgba(148,163,184,0.08)' }} />
                      <Bar dataKey="hoursDisplay" radius={[6, 6, 0, 0]} maxBarSize={40}>
                        {sleepChartData.map((entry, i) => (
                          <Cell key={`c-${i}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <p className="text-sm text-slate-300 mt-4 text-center">
                Average:{' '}
                <span className="text-white font-semibold">
                  {sleepInsights.avg != null ? `${sleepInsights.avg} hours` : '—'}
                </span>
                {' · '}
                Best quality:{' '}
                <span className="text-white font-semibold">
                  {sleepInsights.bestQ != null ? `${sleepInsights.bestQ}/5` : '—'}
                </span>
              </p>
            </div>
          </div>
        )}

        {tab === 'checkin' && (
          <div className="space-y-6">
            <form
              onSubmit={submitCheckin}
              className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-6"
            >
              <label className="block">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Date
                </span>
                <input
                  type="date"
                  value={checkForm.date}
                  onChange={(e) => setCheckForm((f) => ({ ...f, date: e.target.value }))}
                  className="mt-1 w-full bg-slate-700/60 border border-slate-600/50 rounded-xl px-3 py-2.5 text-white text-sm"
                />
              </label>

              <div>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Mood
                </span>
                <div className="mt-2 flex justify-between gap-2 max-w-md">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setCheckForm((f) => ({ ...f, mood: n }))}
                      className={`flex-1 py-3 rounded-xl text-2xl border transition-all ${
                        checkForm.mood === n
                          ? 'border-indigo-500 bg-indigo-600/30 scale-105'
                          : 'border-slate-600/50 bg-slate-700/40 hover:bg-slate-700'
                      }`}
                    >
                      {MOOD_EMOJIS[n - 1]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                    Energy
                  </span>
                  <span className="text-sm font-bold text-amber-400">{checkForm.energy}/5</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={checkForm.energy}
                  onChange={(e) =>
                    setCheckForm((f) => ({ ...f, energy: Number(e.target.value) }))
                  }
                  className="mt-3 w-full accent-amber-400 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between mt-2 px-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Zap
                      key={n}
                      size={22}
                      className={
                        n <= checkForm.energy
                          ? 'text-amber-400 fill-amber-400/20'
                          : 'text-slate-600'
                      }
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                    Soreness
                  </span>
                  <span className="text-sm font-bold text-slate-200">{checkForm.soreness}/5</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={checkForm.soreness}
                  onChange={(e) =>
                    setCheckForm((f) => ({ ...f, soreness: Number(e.target.value) }))
                  }
                  className="mt-3 w-full accent-rose-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between mt-3 px-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setCheckForm((f) => ({ ...f, soreness: n }))}
                      className={`w-8 h-8 rounded-full border-2 border-slate-800 ${SORENESS_DOT_CLASS[n - 1]} ${
                        checkForm.soreness === n ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'opacity-70'
                      }`}
                      aria-label={`Soreness ${n}`}
                    />
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Notes
                </span>
                <textarea
                  value={checkForm.notes}
                  onChange={(e) => setCheckForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  placeholder="How training felt, stress, hydration…"
                  className="mt-1 w-full bg-slate-700/60 border border-slate-600/50 rounded-xl px-3 py-2.5 text-white text-sm resize-none placeholder:text-slate-500"
                />
              </label>

              <button
                type="submit"
                disabled={savingCheck}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 font-semibold text-sm shadow-lg shadow-indigo-500/20 inline-flex items-center justify-center gap-2"
              >
                {savingCheck && <Loader2 className="animate-spin" size={18} />}
                Save Check-in
              </button>
            </form>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
              <h2 className="text-sm font-semibold text-white mb-1">7-day trends</h2>
              <p className="text-xs text-slate-500 mb-4">Mood, energy, and soreness</p>
              {checkLoading ? (
                <div className="h-52 flex items-center justify-center text-slate-500">
                  <Loader2 className="animate-spin" />
                </div>
              ) : (
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={checkChartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} />
                      <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} />
                      <Tooltip content={<CheckinTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line
                        type="monotone"
                        dataKey="mood"
                        name="Mood"
                        stroke="#a855f7"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        connectNulls
                      />
                      <Line
                        type="monotone"
                        dataKey="energy"
                        name="Energy"
                        stroke="#fbbf24"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        connectNulls
                      />
                      <Line
                        type="monotone"
                        dataKey="soreness"
                        name="Soreness"
                        stroke="#f43f5e"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'stretch' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {routines.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setTimerRoutine(r)}
                className="text-left bg-slate-800 border border-slate-700 rounded-2xl p-4 hover:border-indigo-500/50 hover:bg-slate-800/90 transition-colors"
              >
                <h3 className="text-lg font-bold text-white mb-2">{r.name}</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-4">{r.description}</p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>{r.totalMinutes} min</span>
                  <span>·</span>
                  <span>{r.exercises.length} exercises</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <StretchTimer
        key={timerRoutine?.key ?? 'closed'}
        routine={timerRoutine}
        open={!!timerRoutine}
        onClose={() => setTimerRoutine(null)}
      />
    </div>
  );
}
