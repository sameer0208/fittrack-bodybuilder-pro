import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import useWorkoutPlan from '../hooks/useWorkoutPlan';
import BMICard from '../components/BMICard';
import ShareCard from '../components/ShareCard';
import DailyChallenges from '../components/DailyChallenges';
import WorkoutCalendar from '../components/WorkoutCalendar';
import BuddyWidget from '../components/BuddyWidget';
import dayjs from 'dayjs';
import axios from 'axios';
import {
  CheckCircle2, ChevronRight, Clock, Flame, Zap,
  TrendingUp, UtensilsCrossed, Droplets, Dumbbell,
  Trophy, Users, Share2, Ruler, Heart, BarChart3, BookOpen,
} from 'lucide-react';

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });
API.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('ft_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export default function Dashboard() {
  const { user, fetchWorkoutLog, fetchNutritionLog } = useApp();
  const { workoutPlan, weekSchedule } = useWorkoutPlan();
  const ALL_WEEK_SESSIONS = weekSchedule.flatMap((d) => d.sessions);
  const todayStr = useMemo(() => dayjs().format('YYYY-MM-DD'), []);
  const today = useMemo(() => dayjs(todayStr), [todayStr]);
  const todayDayName = DAY_NAMES[today.day()];

  const todaySessions = useMemo(
    () => weekSchedule.find((d) => d.key === todayDayName)?.sessions || [],
    [weekSchedule, todayDayName]
  );

  const [serverWorkoutLogs, setServerWorkoutLogs] = useState({});
  const [serverNutrition, setServerNutrition] = useState(null);
  const lastFetchRef = useRef(0);

  const refreshDashboardData = useCallback(() => {
    const now = Date.now();
    if (now - lastFetchRef.current < 5000) return;
    lastFetchRef.current = now;

    API.get('/workouts/week-status')
      .then(({ data }) => {
        setServerWorkoutLogs((prev) => {
          const updated = { ...prev };
          for (const [sessionKey, status] of Object.entries(data)) {
            updated[sessionKey] = { ...updated[sessionKey], ...status };
          }
          return updated;
        });
      })
      .catch(() => {});

    todaySessions.forEach((sessionKey) => {
      fetchWorkoutLog(sessionKey).then((log) => {
        if (log) setServerWorkoutLogs((prev) => ({ ...prev, [sessionKey]: log }));
      });
    });

    fetchNutritionLog(today.format('YYYY-MM-DD')).then((log) => {
      if (log) setServerNutrition(log);
    });
  }, [todaySessions, today, fetchWorkoutLog, fetchNutritionLog]);

  useEffect(() => {
    refreshDashboardData();
  }, [refreshDashboardData]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshDashboardData();
    };
    const onFocus = () => refreshDashboardData();

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);
    window.addEventListener('pageshow', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('pageshow', onFocus);
    };
  }, [refreshDashboardData]);

  const [badgeCount, setBadgeCount] = useState(0);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    API.get('/achievements').then(({ data }) => setBadgeCount(data?.length || 0)).catch(() => {});
    API.post('/achievements/check').catch(() => {});
  }, []);

  const completedToday = todaySessions.filter((s) => serverWorkoutLogs[s]?.completed).length;

  const getSessionStatus = (sessionKey) =>
    serverWorkoutLogs[sessionKey]?.completed ? 'completed' : null;

  const programDays = user?.programStartDate
    ? dayjs().diff(dayjs(user.programStartDate), 'day') + 1
    : 1;

  const startWeight = user?.weightHistory?.[0]?.weight || user?.currentWeight;
  const gained = (user?.currentWeight || 0) - (startWeight || 0);
  const toGain = (user?.targetWeight || 0) - (startWeight || 0);
  const progressPct = toGain > 0 ? Math.min((gained / toGain) * 100, 100) : 0;

  const todayNutrition = serverNutrition;
  const totalCals = todayNutrition?.meals?.reduce(
    (a, m) => a + m.foods.reduce((s, f) => s + (f.calories || 0), 0), 0
  ) || 0;
  const waterMl = todayNutrition?.waterMl || 0;
  const waterGoal = todayNutrition?.waterGoalMl || (user?.currentWeight ? Math.round(user.currentWeight * 33) : 3000);
  const calGoal = user?.dailyCalories || 2500;
  const calPct = Math.min((totalCals / calGoal) * 100, 100);
  const waterPct = Math.min((waterMl / waterGoal) * 100, 100);

  return (
    <div className="page-container relative">

      {/* ── Mobile Top Header ───────────────────────── */}
      <div className="sticky top-0 z-30 lg:hidden border-b border-slate-700/30 px-4 py-3 overflow-hidden"
        style={{ background: '#0a0e17' }}
      >
        {/* Red energy line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/25 to-transparent" />
        <div className="flex items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-orange-500 rounded-lg flex items-center justify-center shadow-lg shadow-red-600/15">
              <Dumbbell size={15} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="leading-tight min-w-0">
              <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest truncate">{today.format('ddd, MMM D')}</div>
              <div className="text-sm font-black text-white truncate">
                Hey, {user?.name?.split(' ')[0] || 'Athlete'}!
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 shrink-0 border border-red-500/20"
            style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(249,115,22,0.06) 100%)' }}
          >
            <Flame size={13} className="text-red-400 shrink-0" />
            <span className="text-sm font-black text-red-400 leading-none">{user?.streak || 0}</span>
            <span className="text-[9px] text-slate-500 leading-none font-bold">d</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-4 lg:pt-8 relative z-10">

        {/* ── Desktop Header ────────────────────────── */}
        <div className="hidden lg:flex items-start justify-between mb-6">
          <div>
            <div className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em]">{today.format('dddd, MMMM D')}</div>
            <h1 className="text-3xl font-black text-white mt-1 tracking-tight">
              Hey, {user?.name?.split(' ')[0] || 'Athlete'}!
            </h1>
            <p className="text-slate-500 text-sm mt-1 font-medium">Day {programDays} of your transformation</p>
          </div>
          <div className="flex items-center gap-3 rounded-xl px-5 py-3 border border-red-500/15"
            style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(249,115,22,0.04) 100%)' }}
          >
            <Flame size={22} className="text-red-400" />
            <div>
              <div className="text-3xl font-black text-red-400 leading-none">{user?.streak || 0}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">streak</div>
            </div>
          </div>
        </div>

        {/* ── Stats Row ──────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {[
            { value: user?.totalWorkouts || 0,    label: 'Workouts',  color: 'text-red-400', border: 'border-red-500/10' },
            { value: `${user?.currentWeight || '--'}kg`, label: 'Current',   color: 'text-emerald-400', border: 'border-emerald-500/10' },
            { value: user?.bmi || '--',            label: 'BMI',       color: 'text-amber-400', border: 'border-amber-500/10' },
          ].map(({ value, label, color, border }) => (
            <div key={label} className={`card p-3.5 text-center active:scale-95 transition-transform overflow-hidden ${border}`}>
              <div className={`text-xl font-black truncate ${color}`}>{value}</div>
              <div className="text-[10px] text-slate-500 mt-0.5 truncate font-bold uppercase tracking-wider">{label}</div>
            </div>
          ))}
        </div>

        {/* ── Today's Sessions ───────────────────────── */}
        {todaySessions.length > 0 && (
          <div className="mb-5">
            <div className="gym-section-header">
              <div className="gym-accent-dot" />
              <h2>Today&apos;s Session{todaySessions.length > 1 ? 's' : ''}</h2>
              {completedToday > 0 && (
                <span className="ml-auto text-[10px] text-emerald-400 font-black uppercase tracking-wider">
                  {completedToday}/{todaySessions.length} crushed
                </span>
              )}
            </div>
            <div className="space-y-3">
              {todaySessions.map((sessionKey) => {
                const plan = workoutPlan[sessionKey];
                if (!plan) return null;
                const done = serverWorkoutLogs[sessionKey]?.completed;
                return (
                  <Link key={sessionKey} to={`/workout/${sessionKey}`}>
                    <div className={`relative overflow-hidden rounded-2xl p-4 border transition-all duration-300 active:scale-[0.98] group ${
                      done
                        ? 'border-emerald-500/30 bg-emerald-950/20'
                        : 'border-slate-700/30 bg-slate-800/30'
                    }`}>
                      {/* Subtle accent line */}
                      {!done && <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${plan.colorClass} opacity-30`} />}
                      <div className={`absolute inset-0 bg-gradient-to-br opacity-5 ${plan.colorClass}`} />
                      <div className="relative flex items-center gap-4">
                        <div className={`w-14 h-14 bg-gradient-to-br ${plan.colorClass} rounded-2xl flex items-center justify-center text-2xl shadow-lg shrink-0`}>
                          {plan.muscleEmoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            {done && <CheckCircle2 size={11} className="text-emerald-400 shrink-0" />}
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{plan.time}</span>
                          </div>
                          <h3 className="font-black text-white text-base leading-tight truncate">{plan.name}</h3>
                          <p className="text-xs text-slate-500 truncate">{plan.subtitle}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="flex items-center gap-1 text-[10px] text-slate-600 font-medium">
                              <Clock size={9} /> {plan.duration}
                            </span>
                            <span className="text-[10px] text-slate-600 font-medium">{plan.exercises.length} exercises</span>
                          </div>
                        </div>
                        <div className="shrink-0">
                          {done ? (
                            <div className="flex flex-col items-center gap-1 px-2.5 py-2 bg-emerald-500/10 border border-emerald-500/25 rounded-xl">
                              <CheckCircle2 size={20} className="text-emerald-400" />
                              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider">Done</span>
                            </div>
                          ) : (
                            <div className="w-9 h-9 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20 group-hover:bg-red-500/15 transition-colors">
                              <ChevronRight size={16} className="text-red-400" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Nutrition + Water Quick-View ───────────── */}
        <Link to="/nutrition">
          <div className="card-hover p-4 mb-5 cursor-pointer overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/15">
                  <UtensilsCrossed size={13} className="text-emerald-400" />
                </div>
                <span className="text-sm font-black text-white">Today&apos;s Fuel</span>
              </div>
              <ChevronRight size={14} className="text-slate-600" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1.5 text-xs">
                  <span className="text-slate-500 flex items-center gap-1 font-medium">
                    <Flame size={9} className="text-amber-400" /> Calories
                  </span>
                  <span className="text-amber-400 font-black text-[11px]">{Math.round(totalCals)}/{calGoal}</span>
                </div>
                <div className="progress-bar h-2">
                  <div className="progress-fill bg-gradient-to-r from-amber-500 to-orange-500" style={{ width: `${calPct}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5 text-xs">
                  <span className="text-slate-500 flex items-center gap-1 font-medium">
                    <Droplets size={9} className="text-cyan-400" /> Water
                  </span>
                  <span className="text-cyan-400 font-black text-[11px]">{waterMl}ml</span>
                </div>
                <div className="progress-bar h-2">
                  <div className="progress-fill bg-gradient-to-r from-cyan-500 to-blue-500" style={{ width: `${waterPct}%` }} />
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* ── Daily Challenges ──────────────────────── */}
        <div className="mb-5">
          <DailyChallenges />
        </div>

        {/* ── Goal Progress ──────────────────────────── */}
        <div className="card p-4 mb-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/15">
              <TrendingUp size={15} className="text-emerald-400" />
            </div>
            <div>
              <div className="font-black text-white text-sm">Goal Progress</div>
              <div className="text-[10px] text-slate-500 font-medium">Journey to {user?.targetWeight}kg</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-xl font-black text-gradient">{progressPct.toFixed(0)}%</div>
              <div className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">achieved</div>
            </div>
          </div>
          <div className="progress-bar h-3 mb-3">
            <div
              className="progress-fill bg-gradient-to-r from-red-500 via-orange-500 to-amber-400"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Start', value: `${startWeight || '--'}kg`, color: 'text-slate-300' },
              { label: `${gained >= 0 ? '+' : ''}${Math.abs(gained).toFixed(1)}kg`, value: gained >= 0 ? 'gained' : 'lost', color: gained >= 0 ? 'text-emerald-400' : 'text-red-400' },
              { label: 'Goal', value: `${user?.targetWeight || '--'}kg`, color: 'text-amber-400' },
            ].map((s) => (
              <div key={s.label} className="p-2 bg-white/[0.02] rounded-lg border border-slate-700/30">
                <div className={`text-sm font-black ${s.color}`}>{s.label}</div>
                <div className="text-[10px] text-slate-600 font-medium">{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── BMI Card ───────────────────────────────── */}
        <div className="mb-5">
          <BMICard user={user} />
        </div>

        {/* ── Weekly Schedule ────────────────────────── */}
        <div className="card p-4 mb-5 overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/15 to-transparent" />
          <div className="gym-section-header mb-3">
            <div className="gym-accent-dot" />
            <h2>This Week</h2>
          </div>
          <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
            {weekSchedule.map((dayObj) => {
              const isToday = dayObj.key === todayDayName;
              const sessionsDone = dayObj.sessions.filter((s) => getSessionStatus(s) === 'completed').length;

              return (
                <div key={dayObj.key} className={`relative flex flex-col items-center gap-1 py-2 rounded-xl overflow-hidden ${
                  isToday ? 'bg-red-500/8 border border-red-500/20' : 'bg-white/[0.02]'
                }`}>
                  <span className={`text-[9px] font-black truncate w-full text-center uppercase tracking-wider ${isToday ? 'text-red-400' : 'text-slate-600'}`}>
                    {dayObj.day}
                  </span>
                  <div className="flex flex-col gap-1 w-full px-1">
                    {dayObj.sessions.map((sk) => {
                      const done = getSessionStatus(sk) === 'completed';
                      return (
                        <Link key={sk} to={`/workout/${sk}`} className="block w-full">
                          <div className={`h-1.5 w-full rounded-full transition-all ${
                            done ? 'bg-emerald-500' : isToday ? 'bg-red-500/40' : 'bg-slate-700/40'
                          }`} />
                        </Link>
                      );
                    })}
                  </div>
                  {isToday && (
                    <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-3 mt-3 text-[9px] text-slate-600 flex-wrap font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1"><span className="w-2 h-1.5 rounded bg-emerald-500 inline-block shrink-0" /> Done</span>
            <span className="flex items-center gap-1"><span className="w-2 h-1.5 rounded bg-red-500/40 inline-block shrink-0" /> Today</span>
            <span className="flex items-center gap-1"><span className="w-2 h-1.5 rounded bg-slate-700/40 inline-block shrink-0" /> Upcoming</span>
          </div>
        </div>

        {/* ── Full Weekly Program Grid ────────────────── */}
        <div className="mb-5">
          <div className="gym-section-header mb-3">
            <div className="gym-accent-dot" />
            <h2>Full Program</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.values(workoutPlan).map((plan) => {
              const done = getSessionStatus(plan.sessionKey) === 'completed';
              return (
                <Link key={plan.sessionKey} to={`/workout/${plan.sessionKey}`}>
                  <div className={`card-hover p-4 cursor-pointer group flex items-center gap-3 ${done ? 'border-emerald-500/20' : ''}`}>
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${plan.colorClass} flex items-center justify-center text-xl shrink-0`}>
                      {plan.muscleEmoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">{plan.dayLabel} · {plan.time}</div>
                      <div className="font-black text-white text-sm leading-tight truncate">{plan.name}</div>
                      <div className="text-[10px] text-slate-600 mt-0.5 font-medium">{plan.exercises.length} ex · {plan.duration}</div>
                    </div>
                    {done ? (
                      <CheckCircle2 size={17} className="text-emerald-400 shrink-0" />
                    ) : (
                      <ChevronRight size={14} className="text-slate-700 group-hover:text-red-400 transition-colors shrink-0" />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── Workout Calendar ────────────────────────── */}
        <div className="mb-5">
          <WorkoutCalendar />
        </div>

        {/* ── Quick Access Cards ──────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
          {[
            { to: '/body-tracker',    icon: Ruler,     label: 'Body Tracker',  color: 'from-cyan-500/10 to-teal-500/10 border-cyan-500/15', iconColor: 'text-cyan-400' },
            { to: '/health-recovery', icon: Heart,     label: 'Health',        color: 'from-rose-500/10 to-pink-500/10 border-rose-500/15', iconColor: 'text-rose-400' },
            { to: '/analytics',       icon: BarChart3, label: 'Analytics',     color: 'from-violet-500/10 to-purple-500/10 border-violet-500/15', iconColor: 'text-violet-400' },
            { to: '/achievements',    icon: Trophy,    label: `Badges (${badgeCount})`, color: 'from-amber-500/10 to-yellow-500/10 border-amber-500/15', iconColor: 'text-amber-400' },
            { to: '/leaderboard',     icon: Users,     label: 'Leaderboard',   color: 'from-indigo-500/10 to-blue-500/10 border-indigo-500/15', iconColor: 'text-indigo-400' },
            { to: '/guide',            icon: BookOpen,  label: 'Feature Guide', color: 'from-red-500/10 to-orange-500/10 border-red-500/15', iconColor: 'text-red-400' },
          ].map(({ to, icon: Icon, label, color, iconColor }) => (
            <Link key={to} to={to} className={`card-hover p-3 flex items-center gap-3 bg-gradient-to-br ${color} border`}>
              <Icon size={17} className={iconColor} />
              <span className="text-sm font-bold text-white truncate">{label}</span>
            </Link>
          ))}
          <button
            onClick={() => setShowShare(true)}
            className="card-hover p-3 flex items-center gap-3 bg-gradient-to-br from-fuchsia-500/10 to-pink-500/10 border border-fuchsia-500/15"
          >
            <Share2 size={17} className="text-fuchsia-400" />
            <span className="text-sm font-bold text-white">Share</span>
          </button>
        </div>

        {/* ── Buddy Widget ────────────────────────────── */}
        <BuddyWidget />

        {showShare && (
          <ShareCard
            stats={{
              name: user?.name,
              streak: user?.streak || 0,
              totalWorkouts: user?.totalWorkouts || 0,
              todayWorkout: todaySessions[0]?.replace(/_/g, ' ') || 'Rest Day',
              currentWeight: user?.currentWeight,
              targetWeight: user?.targetWeight,
            }}
            onClose={() => setShowShare(false)}
          />
        )}
      </div>
    </div>
  );
}
