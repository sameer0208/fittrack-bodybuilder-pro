import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { WeightChart, VolumeChart } from '../components/ProgressChart';
import { TrendingUp, Scale, Award, Activity, Plus, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { workoutPlan } from '../data/workoutPlan';
import dayjs from 'dayjs';

export default function Progress() {
  const { user, updateUser, stats, fetchStats } = useApp();
  const [newWeight, setNewWeight] = useState('');
  const [logDate, setLogDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [activeTab, setActiveTab] = useState('weight');

  useEffect(() => {
    fetchStats();
  }, []);

  const handleLogWeight = async () => {
    const w = parseFloat(newWeight);
    if (!w || w < 30 || w > 300) {
      toast.error('Please enter a valid weight (30–300 kg)');
      return;
    }
    try {
      await updateUser({ currentWeight: w });
      toast.success(`Weight logged: ${w}kg! 💪`);
      setNewWeight('');
    } catch {
      toast.error('Failed to log weight');
    }
  };

  // Workout history from server stats (recentLogs) — no localStorage
  const recentWorkouts = (stats?.recentLogs || []).slice().reverse();

  const totalVolume = recentWorkouts
    .filter((w) => w.completed)
    .reduce((sum, w) => sum + (w.totalVolume || 0), 0);

  const muscleHitsThisWeek = {};
  const startOfWeek = dayjs().startOf('week');
  for (const log of recentWorkouts) {
    if (!log.completed || !log.date) continue;
    if (!dayjs(log.date).isAfter(startOfWeek)) continue;
    const plan = log.workoutDay ? workoutPlan[log.workoutDay] : null;
    if (plan) {
      plan.focus?.forEach((f) => {
        muscleHitsThisWeek[f] = (muscleHitsThisWeek[f] || 0) + 1;
      });
    }
  }

  const tabs = ['weight', 'workouts', 'muscles'];

  return (
    <div className="page-container">
      {/* Mobile Sticky Header */}
      <div className="sticky top-0 z-30 lg:hidden bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/40 px-4 py-3 overflow-hidden w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600/20 rounded-lg flex items-center justify-center">
            <TrendingUp size={15} className="text-indigo-400" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Analytics</div>
            <div className="text-sm font-bold text-white leading-tight">Progress</div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-4 lg:pt-8">
        {/* Desktop Header */}
        <div className="hidden lg:block mb-6">
          <h1 className="section-title flex items-center gap-2">
            <TrendingUp size={24} className="text-indigo-400" />
            Progress
          </h1>
          <p className="section-subtitle">Track your transformation journey</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
          {[
            {
              label: 'Total Workouts',
              value: user?.totalWorkouts || 0,
              icon: Award,
              color: 'text-indigo-400',
              bg: 'bg-indigo-600/20',
            },
            {
              label: 'Day Streak',
              value: `${user?.streak || 0}🔥`,
              icon: Activity,
              color: 'text-orange-400',
              bg: 'bg-orange-600/20',
            },
            {
              label: 'Total Volume',
              value: `${(totalVolume / 1000).toFixed(1)}t`,
              icon: Scale,
              color: 'text-emerald-400',
              bg: 'bg-emerald-600/20',
            },
            {
              label: 'Program Days',
              value: user?.programStartDate
                ? dayjs().diff(dayjs(user.programStartDate), 'day') + 1
                : 1,
              icon: Calendar,
              color: 'text-purple-400',
              bg: 'bg-purple-600/20',
            },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="card p-4">
              <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mb-2`}>
                <Icon size={16} className={color} />
              </div>
              <div className={`text-2xl font-black ${color}`}>{value}</div>
              <div className="text-xs text-slate-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-slate-800 rounded-xl mb-5 border border-slate-700">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-semibold rounded-lg capitalize transition-all touch-manipulation min-h-[44px] ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'weight' ? '⚖️ Weight' : tab === 'workouts' ? '🏋️ Workouts' : '💪 Muscles'}
            </button>
          ))}
        </div>

        {/* Weight Tab */}
        {activeTab === 'weight' && (
          <div className="space-y-6 animate-fade-in">
            {/* Log Weight */}
            <div className="card p-5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Plus size={16} className="text-indigo-400" />
                Log Today's Weight
              </h3>
              <div className="flex gap-2.5">
                <div className="relative flex-1">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min="30"
                    max="300"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    placeholder={`${user?.currentWeight || 75}`}
                    className="input-field pr-12 text-center text-xl font-black"
                    onKeyDown={(e) => e.key === 'Enter' && handleLogWeight()}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">kg</span>
                </div>
                <button onClick={handleLogWeight} className="btn-primary px-5 text-sm">
                  Log
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2 text-center">
                Tip: Log your weight first thing in the morning for consistency
              </p>
            </div>

            {/* Weight Chart */}
            <div className="card p-5">
              <h3 className="font-semibold text-white mb-1">Weight History</h3>
              <p className="text-xs text-slate-400 mb-4">
                {user?.currentWeight}kg now → {user?.targetWeight}kg target
              </p>
              <WeightChart
                weightHistory={user?.weightHistory}
                targetWeight={user?.targetWeight}
              />
            </div>

            {/* Weight History List */}
            {user?.weightHistory && user.weightHistory.length > 0 && (
              <div className="card p-5">
                <h3 className="font-semibold text-white mb-4">Recent Logs</h3>
                <div className="space-y-2">
                  {[...user.weightHistory].reverse().slice(0, 8).map((entry, i) => {
                    const prev = user.weightHistory[user.weightHistory.length - 2 - i];
                    const diff = prev ? (entry.weight - prev.weight).toFixed(1) : null;
                    return (
                      <div key={i} className="flex items-center justify-between py-2.5 border-b border-slate-700/50 last:border-0">
                        <span className="text-sm text-slate-400">
                          {dayjs(entry.date).format('MMM D, YYYY')}
                        </span>
                        <div className="flex items-center gap-3">
                          {diff !== null && (
                            <span className={`text-xs font-medium ${
                              parseFloat(diff) > 0 ? 'text-emerald-400' : parseFloat(diff) < 0 ? 'text-red-400' : 'text-slate-500'
                            }`}>
                              {parseFloat(diff) > 0 ? '+' : ''}{diff}kg
                            </span>
                          )}
                          <span className="font-bold text-white">{entry.weight} kg</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Workouts Tab */}
        {activeTab === 'workouts' && (
          <div className="space-y-6 animate-fade-in">
            <div className="card p-5">
              <h3 className="font-semibold text-white mb-4">Weekly Volume</h3>
              <VolumeChart weeklyData={stats?.weeklyVolume || []} />
            </div>

            <div className="card p-5">
              <h3 className="font-semibold text-white mb-4">Recent Sessions</h3>
              {recentWorkouts.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <p className="text-4xl mb-2">🏋️</p>
                  <p className="text-sm">No workouts logged yet.</p>
                  <p className="text-xs mt-1">Start your first session from the Dashboard!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentWorkouts.map((log, i) => {
                    const plan = log.workoutDay ? workoutPlan[log.workoutDay] : null;
                    const dateStr = log.date
                      ? dayjs(log.date).format('MMM D')
                      : 'Unknown';
                    return (
                      <div key={i} className={`p-3 rounded-xl border flex items-center gap-3 ${
                        log.completed
                          ? 'border-emerald-500/20 bg-emerald-950/20'
                          : 'border-slate-700/50 bg-slate-800/30'
                      }`}>
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan?.colorClass || 'from-slate-600 to-slate-700'} flex items-center justify-center text-lg shrink-0`}>
                          {plan?.muscleEmoji || '🏋️'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-white">{log.workoutName || plan?.name || 'Workout'}</div>
                          <div className="text-xs text-slate-400">
                            {dateStr} · {log.duration ? `${log.duration} min` : '–'} · {log.totalVolume ? `${Math.round(log.totalVolume)}kg` : '–'}
                          </div>
                        </div>
                        <div className={`text-xs font-bold ${log.completed ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {log.completed ? '✅ Done' : '📝 Draft'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Muscles Tab */}
        {activeTab === 'muscles' && (
          <div className="space-y-6 animate-fade-in">
            <div className="card p-5">
              <h3 className="font-semibold text-white mb-2">This Week's Muscle Hits</h3>
              <p className="text-xs text-slate-400 mb-4">Based on completed workouts</p>
              {Object.keys(muscleHitsThisWeek).length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <p className="text-4xl mb-2">💪</p>
                  <p className="text-sm">Complete workouts to see muscle frequency!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(muscleHitsThisWeek)
                    .sort((a, b) => b[1] - a[1])
                    .map(([muscle, hits]) => (
                      <div key={muscle}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-slate-300">{muscle}</span>
                          <span className={`text-xs font-bold ${hits >= 2 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {hits}x {hits >= 2 ? '✅' : '⚡'}
                          </span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className={`progress-fill ${hits >= 2 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            style={{ width: `${Math.min(hits * 50, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Program Frequency Reference */}
            <div className="card p-5">
              <h3 className="font-semibold text-white mb-2">Program Muscle Frequency</h3>
              <p className="text-xs text-slate-400 mb-4">Every muscle hit at least 2x per week when following the full program</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { muscle: 'Chest', times: 3, days: 'Mon, Thu, Sun' },
                  { muscle: 'Back/Lats', times: 3, days: 'Tue, Fri, Sun' },
                  { muscle: 'Shoulders', times: 3, days: 'Mon, Thu, Sun' },
                  { muscle: 'Biceps', times: 3, days: 'Tue, Fri, Sat PM' },
                  { muscle: 'Triceps', times: 3, days: 'Mon, Thu, Sat PM' },
                  { muscle: 'Quads', times: 3, days: 'Wed, Sat, Sun' },
                  { muscle: 'Hamstrings', times: 2, days: 'Wed, Sat' },
                  { muscle: 'Glutes', times: 2, days: 'Wed, Sat' },
                  { muscle: 'Calves', times: 2, days: 'Wed, Sat' },
                  { muscle: 'Core/Abs', times: 2, days: 'Sat PM, Sun' },
                ].map(({ muscle, times, days }) => (
                  <div key={muscle} className="p-3 bg-slate-700/30 rounded-xl border border-slate-600/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-white">{muscle}</span>
                      <span className="text-xs font-bold text-indigo-400">{times}x/wk</span>
                    </div>
                    <div className="text-xs text-slate-500">{days}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
