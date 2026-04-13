import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Trophy, Medal } from 'lucide-react';

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });
API.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('ft_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

const TABS = [
  { id: 'streak', label: 'Streak' },
  { id: 'volume', label: 'Volume' },
  { id: 'consistency', label: 'Consistency' },
];

const MAX_ROWS = 20;

function formatVolume(n) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(Number(n));
}

function statForTab(type, entry) {
  switch (type) {
    case 'streak':
      return {
        primary: entry.streak ?? 0,
        suffix: Number(entry.streak) === 1 ? 'day' : 'days',
        sub: 'streak',
      };
    case 'volume':
      return {
        primary: formatVolume(entry.totalVolume),
        suffix: 'lb',
        sub: 'total volume',
      };
    case 'consistency':
    default:
      return {
        primary: entry.totalWorkouts ?? 0,
        suffix: Number(entry.totalWorkouts) === 1 ? 'workout' : 'workouts',
        sub: 'total workouts',
      };
  }
}

function RankMedal({ rank }) {
  if (rank === 1) {
    return <Medal className="shrink-0 text-amber-400" size={22} strokeWidth={2} aria-hidden />;
  }
  if (rank === 2) {
    return <Medal className="shrink-0 text-slate-300" size={22} strokeWidth={2} aria-hidden />;
  }
  if (rank === 3) {
    return <Medal className="shrink-0 text-amber-600" size={22} strokeWidth={2} aria-hidden />;
  }
  return null;
}

function rankTextClass(rank) {
  if (rank === 1) return 'text-amber-400';
  if (rank === 2) return 'text-slate-300';
  if (rank === 3) return 'text-amber-600';
  return 'text-slate-400';
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-800/80 p-3 animate-pulse"
        >
          <div className="h-9 w-9 rounded-xl bg-slate-700/80" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3.5 w-32 rounded bg-slate-700/80" />
            <div className="h-3 w-20 rounded bg-slate-700/60" />
          </div>
          <div className="h-8 w-16 rounded-lg bg-slate-700/80" />
        </div>
      ))}
    </div>
  );
}

export default function Leaderboard() {
  const [tab, setTab] = useState('streak');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (type, signal) => {
    setLoading(true);
    try {
      const { data } = await API.get('/social/leaderboard', {
        params: { type },
        signal,
      });
      const list = Array.isArray(data) ? data : [];
      setRows(list.slice(0, MAX_ROWS));
    } catch (err) {
      if (axios.isCancel(err) || err.code === 'ERR_CANCELED') return;
      const msg = err.response?.data?.message || err.message || 'Failed to load leaderboard';
      toast.error(msg);
      setRows([]);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    load(tab, ac.signal);
    return () => ac.abort();
  }, [tab, load]);

  return (
    <div className="page-container">
      {/* Mobile sticky header */}
      <div className="sticky top-0 z-30 lg:hidden bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/40 px-4 py-3 overflow-hidden w-full">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shrink-0">
            <Trophy size={16} className="text-white" aria-hidden />
          </div>
          <div className="leading-tight min-w-0">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">FitTrack</div>
            <div className="text-sm font-bold text-white truncate">Leaderboard</div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-4 lg:pt-8 pb-24 lg:pb-10">
        {/* Desktop header */}
        <div className="hidden lg:flex items-start gap-4 mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/25">
            <Trophy size={28} className="text-white" aria-hidden />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Leaderboard</h1>
            <p className="text-slate-400 text-sm mt-1">
              Anonymous rankings — compare your streak, training volume, and consistency with the community.
            </p>
          </div>
        </div>

        {/* Tabs + list card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 sm:p-5">
          <div className="flex flex-wrap gap-2 mb-5">
            {TABS.map(({ id, label }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-all border ${
                    active
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/25'
                      : 'bg-slate-900/60 text-slate-400 border-slate-600 hover:border-slate-500 hover:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {loading ? (
            <LeaderboardSkeleton />
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-700/80 border border-slate-600 flex items-center justify-center mb-4">
                <Trophy className="text-slate-500" size={28} />
              </div>
              <p className="text-white font-semibold">No rankings yet</p>
              <p className="text-slate-500 text-sm mt-1 max-w-sm">
                Check back later — leaderboards fill in as more athletes train and sync their data.
              </p>
            </div>
          ) : (
            <ul className="space-y-2" role="list">
              {rows.map((entry, index) => {
                const rank = entry.rank ?? 0;
                const stat = statForTab(tab, entry);
                const you = !!entry.isYou;
                return (
                  <li key={`${tab}-${rank}-${index}`}>
                    <div
                      className={`flex items-center gap-3 rounded-2xl border p-3 transition-colors ${
                        you
                          ? 'border-indigo-500 bg-indigo-950/40 shadow-[0_0_24px_rgba(99,102,241,0.18)] ring-1 ring-indigo-400/40'
                          : 'border-slate-700 bg-slate-900/40 hover:bg-slate-900/70'
                      }`}
                    >
                      <div
                        className={`flex items-center justify-center gap-1.5 w-11 shrink-0 tabular-nums font-black text-lg ${rankTextClass(rank)}`}
                      >
                        <RankMedal rank={rank} />
                        <span>{rank}</span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-white truncate">
                          {entry.displayName || 'Anonymous'}
                          {you && (
                            <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-indigo-300">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 capitalize">{stat.sub}</div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-lg font-bold text-white tabular-nums leading-tight">
                          {tab === 'volume' ? (
                            <>
                              {stat.primary}
                              <span className="text-sm font-semibold text-slate-400 ml-1">{stat.suffix}</span>
                            </>
                          ) : (
                            stat.primary
                          )}
                        </div>
                        {tab !== 'volume' && (
                          <div className="text-[11px] text-slate-400">{stat.suffix}</div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
