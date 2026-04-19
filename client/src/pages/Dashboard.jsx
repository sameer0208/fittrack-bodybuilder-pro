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
import API from '../utils/api';
import {
  CheckCircle2, ChevronLeft, ChevronRight, Clock, Flame, Zap,
  TrendingUp, UtensilsCrossed, Droplets, Dumbbell,
  Trophy, Users, Share2, Ruler, Heart, BarChart3, BookOpen, CalendarDays,
} from 'lucide-react';
import Tilt3DCard from '../components/Tilt3DCard';

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

  // Week navigation: 0 = current week, -1 = last week, -2 = two weeks ago, etc.
  const [weekOffset, setWeekOffset] = useState(0);
  const [earliestDate, setEarliestDate] = useState(null);
  const [weekLoading, setWeekLoading] = useState(false);
  const [serverWeekRange, setServerWeekRange] = useState(null);
  const isCurrentWeek = weekOffset === 0;

  useEffect(() => {
    API.get('/workouts/earliest').then(({ data }) => {
      if (data?.earliestDate) setEarliestDate(dayjs(data.earliestDate));
    }).catch(() => {});
  }, []);

  const getMondayStr = useCallback((offset) => {
    const d = dayjs();
    const jsDay = d.day();
    const diffToMon = jsDay === 0 ? -6 : 1 - jsDay;
    return d.add(diffToMon, 'day').add(offset, 'week').format('YYYY-MM-DD');
  }, []);

  const weekMondayStr = useMemo(() => getMondayStr(weekOffset), [weekOffset, getMondayStr]);

  const minWeekOffset = useMemo(() => {
    if (!earliestDate) return -52;
    const d = dayjs();
    const jsDay = d.day();
    const diffToMon = jsDay === 0 ? -6 : 1 - jsDay;
    const currentMonday = d.add(diffToMon, 'day').startOf('day');
    return Math.floor(earliestDate.diff(currentMonday, 'week', true));
  }, [earliestDate]);

  const weekLabel = useMemo(() => {
    if (serverWeekRange) {
      const mon = dayjs(serverWeekRange.weekStart);
      const sun = dayjs(serverWeekRange.weekEnd).subtract(1, 'day');
      if (isCurrentWeek) return `This Week · ${mon.format('MMM D')} – ${sun.format('MMM D')}`;
      return `${mon.format('MMM D')} – ${sun.format('MMM D, YYYY')}`;
    }
    const mon = dayjs(weekMondayStr);
    const sun = mon.add(6, 'day');
    if (isCurrentWeek) return `This Week · ${mon.format('MMM D')} – ${sun.format('MMM D')}`;
    return `${mon.format('MMM D')} – ${sun.format('MMM D, YYYY')}`;
  }, [weekMondayStr, isCurrentWeek, serverWeekRange]);

  const refreshDashboardData = useCallback(() => {
    const now = Date.now();
    if (now - lastFetchRef.current < 2000) return;
    lastFetchRef.current = now;

    setWeekLoading(true);
    const weekParam = `?weekOf=${weekMondayStr}`;
    API.get(`/workouts/week-status${weekParam}`)
      .then(({ data }) => {
        setServerWorkoutLogs(data?.sessions || {});
        setServerWeekRange({ weekStart: data?.weekStart, weekEnd: data?.weekEnd, totalLogs: data?.totalLogs || 0 });
      })
      .catch((err) => {
        console.error('[week-status] fetch failed:', err?.response?.status, err?.message);
        setServerWorkoutLogs({});
        setServerWeekRange(null);
      })
      .finally(() => setWeekLoading(false));

    if (isCurrentWeek) {
      todaySessions.forEach((sessionKey) => {
        fetchWorkoutLog(sessionKey).then((log) => {
          if (log) {
            setServerWorkoutLogs((prev) => ({ ...prev, [sessionKey]: log }));
          }
        });
      });

      fetchNutritionLog(today.format('YYYY-MM-DD')).then((log) => {
        if (log) setServerNutrition(log);
      });
    }
  }, [todaySessions, today, fetchWorkoutLog, fetchNutritionLog, isCurrentWeek, weekMondayStr]);

  useEffect(() => {
    lastFetchRef.current = 0;
    setServerWorkoutLogs({});
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
          <Tilt3DCard className="flex items-center gap-3 rounded-xl px-5 py-3 border border-red-500/15 relative"
            style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(249,115,22,0.04) 100%)' }}
            maxTilt={15} scale={1.06}
          >
            <Flame size={22} className="text-red-400" />
            <div>
              <div className="text-3xl font-black text-red-400 leading-none">{user?.streak || 0}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">streak</div>
            </div>
          </Tilt3DCard>
        </div>

        {/* ── Stats Row ──────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {[
            { value: user?.totalWorkouts || 0,    label: 'Workouts',  color: 'text-red-400', border: 'border-red-500/10' },
            { value: `${user?.currentWeight || '--'}kg`, label: 'Current',   color: 'text-emerald-400', border: 'border-emerald-500/10' },
            { value: user?.bmi || '--',            label: 'BMI',       color: 'text-amber-400', border: 'border-amber-500/10' },
          ].map(({ value, label, color, border }) => (
            <Tilt3DCard key={label} className={`card p-3.5 text-center overflow-hidden relative ${border}`} maxTilt={12} scale={1.04} glareOpacity={0.15}>
              <div className={`text-xl font-black truncate ${color}`}>{value}</div>
              <div className="text-[10px] text-slate-500 mt-0.5 truncate font-bold uppercase tracking-wider">{label}</div>
            </Tilt3DCard>
          ))}
        </div>

        {/* ── Today's Sessions ───────────────────────── */}
        {isCurrentWeek && todaySessions.length > 0 && (
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
        {isCurrentWeek && (
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
        )}

        {/* ── Daily Challenges ──────────────────────── */}
        {isCurrentWeek && (
          <div className="mb-5">
            <DailyChallenges />
          </div>
        )}

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

        {/* ── Weekly Schedule with Navigation ────────── */}
        <div className="card p-4 mb-5 overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/15 to-transparent" />

          {/* Week Navigator */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="gym-accent-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: isCurrentWeek ? 'var(--gym-red)' : '#818cf8', boxShadow: `0 0 8px ${isCurrentWeek ? 'rgba(239,68,68,0.5)' : 'rgba(129,140,248,0.5)'}` }} />
              <div>
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.15em]">
                  {isCurrentWeek ? 'This Week' : 'Past Week'}
                </h2>
                <div className="text-[10px] text-slate-600 font-medium mt-0.5 flex items-center gap-1">
                  <CalendarDays size={10} />
                  {weekLabel}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setWeekOffset((w) => Math.max(w - 1, minWeekOffset))}
                disabled={weekOffset <= minWeekOffset}
                className="w-8 h-8 rounded-lg bg-slate-800/60 border border-slate-700/30 flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation active:scale-90 transition-all"
              >
                <ChevronLeft size={14} />
              </button>
              {!isCurrentWeek && (
                <button
                  onClick={() => setWeekOffset(0)}
                  className="px-2.5 h-8 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold touch-manipulation active:scale-90 transition-all"
                >
                  Today
                </button>
              )}
              <button
                onClick={() => setWeekOffset((w) => Math.min(w + 1, 0))}
                disabled={isCurrentWeek}
                className="w-8 h-8 rounded-lg bg-slate-800/60 border border-slate-700/30 flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation active:scale-90 transition-all"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Past week banner */}
          {!isCurrentWeek && !weekLoading && (
            <div className="flex items-center gap-2 px-3 py-2 mb-3 rounded-lg bg-indigo-500/8 border border-indigo-500/15">
              <CalendarDays size={12} className="text-indigo-400 shrink-0" />
              <span className="text-[10px] text-indigo-300 font-medium">
                Viewing historical data — read-only
                {serverWeekRange?.totalLogs != null && ` · ${serverWeekRange.totalLogs} session${serverWeekRange.totalLogs !== 1 ? 's' : ''} found`}
              </span>
            </div>
          )}

          {/* Loading skeleton */}
          {weekLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <div className="w-4 h-4 border-2 border-slate-600 border-t-indigo-400 rounded-full animate-spin" />
                <span className="font-medium">Loading week data...</span>
              </div>
            </div>
          ) : (
            <>
              {/* Week grid */}
              <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
                {weekSchedule.map((dayObj) => {
                  const isToday = isCurrentWeek && dayObj.key === todayDayName;
                  const sessionsDone = dayObj.sessions.filter((s) => getSessionStatus(s) === 'completed').length;
                  const totalSessions = dayObj.sessions.length;

                  return (
                    <div key={dayObj.key} className={`relative flex flex-col items-center gap-1 py-2 rounded-xl overflow-hidden ${
                      isToday ? 'bg-red-500/8 border border-red-500/20'
                      : !isCurrentWeek && sessionsDone > 0 ? 'bg-indigo-500/5 border border-indigo-500/10'
                      : 'bg-white/[0.02]'
                    }`}>
                      <span className={`text-[9px] font-black truncate w-full text-center uppercase tracking-wider ${
                        isToday ? 'text-red-400' : !isCurrentWeek && sessionsDone > 0 ? 'text-indigo-400' : 'text-slate-600'
                      }`}>
                        {dayObj.day}
                      </span>
                      <div className="flex flex-col gap-1 w-full px-1">
                        {dayObj.sessions.map((sk) => {
                          const done = getSessionStatus(sk) === 'completed';
                          const bar = (
                            <div className={`h-1.5 w-full rounded-full transition-all ${
                              done ? (isCurrentWeek ? 'bg-emerald-500' : 'bg-indigo-500') : isToday ? 'bg-red-500/40' : 'bg-slate-700/40'
                            }`} />
                          );
                          if (isCurrentWeek) {
                            return <Link key={sk} to={`/workout/${sk}`} className="block w-full">{bar}</Link>;
                          }
                          return <div key={sk} className="w-full">{bar}</div>;
                        })}
                      </div>
                      {isToday && (
                        <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                      )}
                      {!isCurrentWeek && sessionsDone > 0 && totalSessions > 0 && (
                        <span className="text-[8px] text-indigo-400 font-bold">{sessionsDone}/{totalSessions}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 mt-3 text-[9px] text-slate-600 flex-wrap font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1"><span className={`w-2 h-1.5 rounded ${isCurrentWeek ? 'bg-emerald-500' : 'bg-indigo-500'} inline-block shrink-0`} /> Done</span>
                {isCurrentWeek && <span className="flex items-center gap-1"><span className="w-2 h-1.5 rounded bg-red-500/40 inline-block shrink-0" /> Today</span>}
                <span className="flex items-center gap-1"><span className="w-2 h-1.5 rounded bg-slate-700/40 inline-block shrink-0" /> {isCurrentWeek ? 'Upcoming' : 'Missed'}</span>
              </div>

              {/* Past week summary stats */}
              {!isCurrentWeek && (() => {
                const allLogs = Object.values(serverWorkoutLogs);
                const completedLogs = allLogs.filter((l) => l.completed);
                const totalVol = completedLogs.reduce((s, l) => s + (l.totalVolume || 0), 0);
                const totalDur = completedLogs.reduce((s, l) => s + (l.duration || 0), 0);
                if (completedLogs.length === 0) return (
                  <div className="mt-4 text-center py-5 rounded-lg bg-slate-800/20 border border-slate-700/20">
                    <Dumbbell size={24} className="text-slate-700 mx-auto mb-2" />
                    <div className="text-slate-500 text-xs font-medium">No workouts recorded this week</div>
                    <div className="text-slate-600 text-[10px] mt-1">Navigate to other weeks to find your history</div>
                  </div>
                );
                return (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-indigo-500/5 rounded-lg border border-indigo-500/10">
                      <div className="text-sm font-black text-indigo-400">{completedLogs.length}</div>
                      <div className="text-[9px] text-slate-500 font-bold">Sessions</div>
                    </div>
                    <div className="text-center p-2 bg-indigo-500/5 rounded-lg border border-indigo-500/10">
                      <div className="text-sm font-black text-indigo-400">{Math.round(totalVol).toLocaleString()}kg</div>
                      <div className="text-[9px] text-slate-500 font-bold">Volume</div>
                    </div>
                    <div className="text-center p-2 bg-indigo-500/5 rounded-lg border border-indigo-500/10">
                      <div className="text-sm font-black text-indigo-400">{totalDur}m</div>
                      <div className="text-[9px] text-slate-500 font-bold">Duration</div>
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>

        {/* ── Full Weekly Program Grid ────────────────── */}
        <div className="mb-5">
          <div className="gym-section-header mb-3">
            <div className="gym-accent-dot" />
            <h2>{isCurrentWeek ? 'Full Program' : 'Program Overview'}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.values(workoutPlan).map((plan) => {
              const done = getSessionStatus(plan.sessionKey) === 'completed';
              const log = serverWorkoutLogs[plan.sessionKey];
              const inner = (
                <div className={`card-hover p-4 ${isCurrentWeek ? 'cursor-pointer' : ''} group flex items-center gap-3 ${
                  done ? (isCurrentWeek ? 'border-emerald-500/20' : 'border-indigo-500/20') : ''
                }`}>
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${plan.colorClass} flex items-center justify-center text-xl shrink-0 ${!isCurrentWeek && !done ? 'opacity-40' : ''}`}>
                    {plan.muscleEmoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">{plan.dayLabel} · {plan.time}</div>
                    <div className="font-black text-white text-sm leading-tight truncate">{plan.name}</div>
                    {!isCurrentWeek && done && log ? (
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-indigo-400 font-medium">
                        {log.totalVolume ? <span>{Math.round(log.totalVolume)}kg vol</span> : null}
                        {log.duration ? <span>{log.duration}min</span> : null}
                        {log.mood ? <span>{log.mood === 'great' ? '💪' : log.mood === 'good' ? '👍' : log.mood === 'okay' ? '😐' : '😔'}</span> : null}
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-600 mt-0.5 font-medium">{plan.exercises.length} ex · {plan.duration}</div>
                    )}
                  </div>
                  {done ? (
                    <CheckCircle2 size={17} className={isCurrentWeek ? 'text-emerald-400 shrink-0' : 'text-indigo-400 shrink-0'} />
                  ) : isCurrentWeek ? (
                    <ChevronRight size={14} className="text-slate-700 group-hover:text-red-400 transition-colors shrink-0" />
                  ) : (
                    <span className="text-[9px] text-slate-600 font-bold shrink-0">—</span>
                  )}
                </div>
              );
              if (isCurrentWeek) {
                return <Link key={plan.sessionKey} to={`/workout/${plan.sessionKey}`}>{inner}</Link>;
              }
              return <div key={plan.sessionKey}>{inner}</div>;
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
