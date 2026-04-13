import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import {
  Dumbbell,
  Flame,
  Trophy,
  Target,
  Zap,
  Star,
  Medal,
  Crown,
  Camera,
  Users,
  Droplets,
  Apple,
  Scale,
  TrendingUp,
  Award,
  Heart,
  Lock,
} from 'lucide-react';
import { BADGE_DEFS, TIER_COLORS } from '../data/achievements';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

API.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('ft_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

const ICON_MAP = {
  Dumbbell,
  Flame,
  Trophy,
  Target,
  Zap,
  Star,
  Medal,
  Crown,
  Camera,
  Users,
  Droplets,
  Apple,
  Scale,
  TrendingUp,
  Award,
  Heart,
};

const TIER_ORDER = ['bronze', 'silver', 'gold', 'platinum'];

const TIER_LABELS = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
};

function TierTabButton({ tier, label, active, count, onClick }) {
  const colors = tier ? TIER_COLORS[tier] : null;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition-all border ${
        active
          ? tier
            ? `${colors.bg} ${colors.text} ${colors.border}`
            : 'bg-indigo-600 text-white border-indigo-500'
          : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:border-slate-600 hover:text-slate-200'
      }`}
    >
      {label}
      <span className="ml-1.5 opacity-70 tabular-nums">{count}</span>
    </button>
  );
}

export default function Achievements() {
  const [unlockedByKey, setUnlockedByKey] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tierFilter, setTierFilter] = useState(null);

  const loadAchievements = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const checkRes = await API.post('/achievements/check');
      const listRes = await API.get('/achievements');

      const rows = Array.isArray(listRes.data) ? listRes.data : [];
      const map = {};
      rows.forEach((row) => {
        if (row?.key) map[row.key] = row;
      });

      setUnlockedByKey(map);

      const newly = checkRes.data?.newlyUnlocked;
      if (Array.isArray(newly) && newly.length > 0) {
        newly.forEach((n) => {
          toast.success(`Unlocked: ${n.name}`);
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load achievements';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  const stats = useMemo(() => {
    const totalPossible = BADGE_DEFS.length;
    const unlockedKeys = BADGE_DEFS.filter((b) => unlockedByKey[b.key]).map((b) => b.key);
    const totalUnlocked = unlockedKeys.length;

    const byTier = { bronze: 0, silver: 0, gold: 0, platinum: 0 };
    BADGE_DEFS.forEach((b) => {
      if (unlockedByKey[b.key] && byTier[b.tier] !== undefined) {
        byTier[b.tier] += 1;
      }
    });

    return { totalPossible, totalUnlocked, byTier };
  }, [unlockedByKey]);

  const filteredBadges = useMemo(() => {
    if (!tierFilter) return BADGE_DEFS;
    return BADGE_DEFS.filter((b) => b.tier === tierFilter);
  }, [tierFilter]);

  const DefaultIcon = Award;

  return (
    <div className="page-container">
      {/* Mobile sticky header */}
      <div className="sticky top-0 z-30 lg:hidden bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/40 px-4 py-3 overflow-hidden w-full">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center shrink-0">
            <Award size={16} className="text-white" />
          </div>
          <div className="leading-tight min-w-0">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">FitTrack</div>
            <div className="text-sm font-bold text-white truncate">Achievements</div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-4 lg:pt-8 pb-24 lg:pb-10">
        {/* Desktop header */}
        <div className="hidden lg:flex items-start justify-between mb-6 gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
              <Award size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">Achievements</h1>
              <p className="text-slate-400 text-sm mt-1">
                Unlock badges as you train, eat, and track your progress.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 mb-5">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wide font-medium">Progress</div>
              <div className="text-2xl font-black text-white tabular-nums">
                {stats.totalUnlocked}
                <span className="text-slate-500 font-semibold text-lg"> / {stats.totalPossible}</span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">badges unlocked</div>
            </div>
            <button
              type="button"
              onClick={() => loadAchievements()}
              disabled={loading}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TIER_ORDER.map((tier) => {
              const tc = TIER_COLORS[tier];
              return (
                <div
                  key={tier}
                  className={`rounded-xl border px-3 py-2.5 ${tc.bg} ${tc.border}`}
                >
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${tc.text}`}>
                    {TIER_LABELS[tier]}
                  </div>
                  <div className={`text-xl font-black tabular-nums ${tc.text}`}>
                    {stats.byTier[tier]}
                  </div>
                </div>
              );
            })}
          </div>

          {error && (
            <p className="text-red-400 text-sm mt-3">{error}</p>
          )}
        </div>

        {/* Tier filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1 scrollbar-thin">
          <TierTabButton
            tier={null}
            label="All"
            active={tierFilter === null}
            count={stats.totalUnlocked}
            onClick={() => setTierFilter(null)}
          />
          {TIER_ORDER.map((tier) => (
            <TierTabButton
              key={tier}
              tier={tier}
              label={TIER_LABELS[tier]}
              active={tierFilter === tier}
              count={stats.byTier[tier]}
              onClick={() => setTierFilter(tier)}
            />
          ))}
        </div>

        {/* Badge grid */}
        {loading && Object.keys(unlockedByKey).length === 0 && !error ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-slate-800 border border-slate-700 rounded-2xl h-40 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredBadges.map((def) => {
              const unlocked = !!unlockedByKey[def.key];
              const row = unlockedByKey[def.key];
              const unlockedAt = row?.unlockedAt;
              const tierStyle = TIER_COLORS[def.tier] || TIER_COLORS.bronze;
              const IconComponent = ICON_MAP[def.icon] || DefaultIcon;

              return (
                <div
                  key={def.key}
                  className={`relative overflow-hidden flex flex-col bg-slate-800 border rounded-2xl p-4 min-h-[148px] transition-all ${
                    unlocked
                      ? `${tierStyle.border} ${tierStyle.bg} shadow-sm`
                      : 'border-slate-700 opacity-40'
                  }`}
                >
                  {!unlocked && (
                    <div
                      className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-slate-900/55 backdrop-blur-[1px]"
                      aria-hidden
                    >
                      <div className="rounded-full bg-slate-950/80 p-2.5 border border-slate-600/80 shadow-lg">
                        <Lock className="w-6 h-6 text-slate-300" strokeWidth={2.2} />
                      </div>
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                        unlocked
                          ? 'bg-slate-900/50 border border-white/10'
                          : 'bg-slate-900/40 border border-slate-600/50'
                      }`}
                    >
                      <IconComponent
                        className={unlocked ? tierStyle.text : 'text-slate-500'}
                        size={22}
                        strokeWidth={2}
                      />
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md border shrink-0 ${
                        unlocked
                          ? `${tierStyle.text} ${tierStyle.bg} ${tierStyle.border}`
                          : 'text-slate-500 bg-slate-900/50 border-slate-600'
                      }`}
                    >
                      {TIER_LABELS[def.tier]}
                    </span>
                  </div>

                  <div className={`font-bold text-sm leading-snug ${unlocked ? 'text-white' : 'text-slate-400'}`}>
                    {def.name}
                  </div>
                  <p className={`text-xs mt-1.5 leading-relaxed flex-1 ${unlocked ? 'text-slate-400' : 'text-slate-500'}`}>
                    {def.description}
                  </p>
                  {unlocked && unlockedAt && (
                    <div className={`text-[10px] mt-2 pt-2 border-t ${tierStyle.border} ${tierStyle.text} opacity-90`}>
                      Unlocked {dayjs(unlockedAt).format('MMM D, YYYY')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {filteredBadges.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-8">No badges in this tier.</p>
        )}
      </div>
    </div>
  );
}
