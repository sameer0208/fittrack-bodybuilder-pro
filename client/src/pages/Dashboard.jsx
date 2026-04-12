import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { weekSchedule, workoutPlan } from '../data/workoutPlan';
import BMICard from '../components/BMICard';
import dayjs from 'dayjs';
import {
  CheckCircle2, ChevronRight, Clock, Flame, Zap,
  TrendingUp, UtensilsCrossed, Droplets, Dumbbell,
} from 'lucide-react';

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export default function Dashboard() {
  const { user, getWorkoutLog, getNutritionLog } = useApp();
  const today = dayjs();
  const todayDayName = DAY_NAMES[today.day()];

  const todaySessions = weekSchedule.find((d) => d.key === todayDayName)?.sessions || [];
  const completedToday = todaySessions.filter((s) => getWorkoutLog(s)?.completed).length;

  const getSessionStatus = (sessionKey) =>
    getWorkoutLog(sessionKey)?.completed ? 'completed' : null;

  const programDays = user?.programStartDate
    ? dayjs().diff(dayjs(user.programStartDate), 'day') + 1
    : 1;

  const startWeight = user?.weightHistory?.[0]?.weight || user?.currentWeight;
  const gained = (user?.currentWeight || 0) - (startWeight || 0);
  const toGain = (user?.targetWeight || 0) - (startWeight || 0);
  const progressPct = toGain > 0 ? Math.min((gained / toGain) * 100, 100) : 0;

  // Nutrition quick-view
  const todayNutrition = getNutritionLog(today.format('YYYY-MM-DD'));
  const totalCals = todayNutrition?.meals?.reduce(
    (a, m) => a + m.foods.reduce((s, f) => s + (f.calories || 0), 0), 0
  ) || 0;
  const waterMl = todayNutrition?.waterMl || 0;
  const waterGoal = todayNutrition?.waterGoalMl || (user?.currentWeight ? Math.round(user.currentWeight * 33) : 3000);
  const calGoal = user?.dailyCalories || 2500;
  const calPct = Math.min((totalCals / calGoal) * 100, 100);
  const waterPct = Math.min((waterMl / waterGoal) * 100, 100);

  return (
    <div className="page-container">
      {/* ── Mobile Top Header ───────────────────────── */}
      <div className="sticky top-0 z-30 lg:hidden bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/40 px-4 py-3 overflow-hidden">
        <div className="flex items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shrink-0">
              <Zap size={16} className="text-white" />
            </div>
            <div className="leading-tight min-w-0">
              <div className="text-xs text-slate-500 truncate">{today.format('ddd, MMM D')}</div>
              <div className="text-sm font-bold text-white truncate">
                Hey, {user?.name?.split(' ')[0] || 'Athlete'}! 👋
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-orange-500/15 border border-orange-500/30 rounded-xl px-2.5 py-1.5 shrink-0">
            <Flame size={13} className="text-orange-400 shrink-0" />
            <span className="text-sm font-black text-orange-400 leading-none">{user?.streak || 0}</span>
            <span className="text-[10px] text-slate-400 leading-none">d</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-4 lg:pt-8">

        {/* ── Desktop Header (hidden on mobile) ──────── */}
        <div className="hidden lg:flex items-start justify-between mb-6">
          <div>
            <div className="text-slate-400 text-sm">{today.format('dddd, MMMM D')}</div>
            <h1 className="text-3xl font-black text-white mt-0.5">
              Hey, {user?.name?.split(' ')[0] || 'Athlete'}! 👋
            </h1>
            <p className="text-slate-400 text-sm mt-1">Day {programDays} of your transformation</p>
          </div>
          <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 rounded-xl px-4 py-2.5">
            <Flame size={20} className="text-orange-400" />
            <div>
              <div className="text-2xl font-black text-orange-400 leading-none">{user?.streak || 0}</div>
              <div className="text-xs text-slate-400">streak</div>
            </div>
          </div>
        </div>

        {/* ── Stats Row ──────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {[
            { value: user?.totalWorkouts || 0,    label: 'Workouts',  color: 'text-indigo-400'  },
            { value: `${user?.currentWeight || '--'}kg`, label: 'Current',   color: 'text-emerald-400' },
            { value: user?.bmi || '--',            label: 'BMI',       color: 'text-amber-400'   },
          ].map(({ value, label, color }) => (
            <div key={label} className="card p-3.5 text-center active:scale-95 transition-transform overflow-hidden">
              <div className={`text-xl font-black truncate ${color}`}>{value}</div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate">{label}</div>
            </div>
          ))}
        </div>

        {/* ── Today's Sessions ───────────────────────── */}
        {todaySessions.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Zap size={11} className="text-indigo-400" />
                Today's Session{todaySessions.length > 1 ? 's' : ''}
              </h2>
              {completedToday > 0 && (
                <span className="text-xs text-emerald-400 font-semibold">
                  {completedToday}/{todaySessions.length} done ✓
                </span>
              )}
            </div>
            <div className="space-y-3">
              {todaySessions.map((sessionKey) => {
                const plan = workoutPlan[sessionKey];
                if (!plan) return null;
                const done = getWorkoutLog(sessionKey)?.completed;
                return (
                  <Link key={sessionKey} to={`/workout/${sessionKey}`}>
                    <div className={`relative overflow-hidden rounded-2xl p-4 border transition-all duration-200 active:scale-[0.98] group ${
                      done
                        ? 'border-emerald-500/40 bg-emerald-950/30'
                        : 'border-slate-700/50 bg-gradient-to-br from-slate-800/80 to-slate-800/40'
                    }`}>
                      <div className={`absolute inset-0 bg-gradient-to-br opacity-10 ${plan.colorClass}`} />
                      <div className="relative flex items-center gap-4">
                        <div className={`w-14 h-14 bg-gradient-to-br ${plan.colorClass} rounded-2xl flex items-center justify-center text-2xl shadow-lg shrink-0`}>
                          {plan.muscleEmoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            {done && <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />}
                            <span className="text-[11px] text-slate-400 font-medium">{plan.time}</span>
                          </div>
                          <h3 className="font-black text-white text-base leading-tight truncate">{plan.name}</h3>
                          <p className="text-xs text-slate-400 truncate">{plan.subtitle}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <Clock size={10} /> {plan.duration}
                            </span>
                            <span className="text-xs text-slate-500">{plan.exercises.length} exercises</span>
                          </div>
                        </div>
                        <div className={`shrink-0 transition-colors ${done ? 'text-emerald-400' : 'text-slate-600 group-active:text-white'}`}>
                          {done ? (
                            <CheckCircle2 size={26} />
                          ) : (
                            <div className="w-9 h-9 bg-indigo-600/20 rounded-xl flex items-center justify-center border border-indigo-500/30">
                              <ChevronRight size={18} className="text-indigo-400" />
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
                <div className="w-7 h-7 bg-emerald-600/20 rounded-lg flex items-center justify-center">
                  <UtensilsCrossed size={14} className="text-emerald-400" />
                </div>
                <span className="text-sm font-bold text-white">Today's Nutrition</span>
              </div>
              <ChevronRight size={15} className="text-slate-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1.5 text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Flame size={10} className="text-amber-400" /> Calories
                  </span>
                  <span className="text-amber-400 font-bold">{Math.round(totalCals)}/{calGoal}</span>
                </div>
                <div className="progress-bar h-2">
                  <div className="progress-fill bg-gradient-to-r from-amber-500 to-orange-500" style={{ width: `${calPct}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5 text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Droplets size={10} className="text-blue-400" /> Water
                  </span>
                  <span className="text-blue-400 font-bold">{waterMl}ml</span>
                </div>
                <div className="progress-bar h-2">
                  <div className="progress-fill bg-gradient-to-r from-blue-500 to-cyan-500" style={{ width: `${waterPct}%` }} />
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* ── Bulk Progress ──────────────────────────── */}
        <div className="card p-4 mb-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-emerald-600/20 rounded-xl flex items-center justify-center">
              <TrendingUp size={16} className="text-emerald-400" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">Bulk Progress</div>
              <div className="text-xs text-slate-400">Journey to {user?.targetWeight}kg</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-xl font-black text-indigo-400">{progressPct.toFixed(0)}%</div>
              <div className="text-xs text-slate-500">achieved</div>
            </div>
          </div>
          <div className="progress-bar h-3 mb-3">
            <div
              className="progress-fill bg-gradient-to-r from-indigo-500 to-emerald-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Start', value: `${startWeight || '--'}kg`, color: 'text-slate-300' },
              { label: `+${Math.abs(gained).toFixed(1)}kg`, value: gained >= 0 ? 'gained' : 'lost', color: gained >= 0 ? 'text-emerald-400' : 'text-red-400' },
              { label: 'Goal', value: `${user?.targetWeight || '--'}kg`, color: 'text-amber-400' },
            ].map((s) => (
              <div key={s.label} className="p-2 bg-slate-700/20 rounded-lg">
                <div className={`text-sm font-black ${s.color}`}>{s.label}</div>
                <div className="text-xs text-slate-500">{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── BMI Card ───────────────────────────────── */}
        <div className="mb-5">
          <BMICard user={user} />
        </div>

        {/* ── Weekly Schedule ────────────────────────── */}
        <div className="card p-4 mb-5 overflow-hidden">
          <h2 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
            <Dumbbell size={14} className="text-indigo-400" />
            This Week
          </h2>
          {/* Use auto-fit columns so they shrink proportionally on any screen width */}
          <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
            {weekSchedule.map((dayObj) => {
              const isToday = dayObj.key === todayDayName;
              const sessionsDone = dayObj.sessions.filter((s) => getSessionStatus(s) === 'completed').length;

              return (
                <div key={dayObj.key} className={`relative flex flex-col items-center gap-1 py-2 rounded-xl overflow-hidden ${
                  isToday ? 'bg-indigo-600/20 border border-indigo-500/40' : 'bg-slate-700/20'
                }`}>
                  <span className={`text-[9px] font-bold truncate w-full text-center ${isToday ? 'text-indigo-400' : 'text-slate-500'}`}>
                    {dayObj.day}
                  </span>
                  <div className="flex flex-col gap-1 w-full px-1">
                    {dayObj.sessions.map((sk) => {
                      const done = getSessionStatus(sk) === 'completed';
                      return (
                        <Link key={sk} to={`/workout/${sk}`} className="block w-full">
                          <div className={`h-1.5 w-full rounded-full transition-all ${
                            done ? 'bg-emerald-500' : isToday ? 'bg-indigo-500/60' : 'bg-slate-600/50'
                          }`} />
                        </Link>
                      );
                    })}
                  </div>
                  {isToday && (
                    <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-3 mt-3 text-[10px] text-slate-500 flex-wrap">
            <span className="flex items-center gap-1"><span className="w-2 h-1.5 rounded bg-emerald-500 inline-block shrink-0" /> Done</span>
            <span className="flex items-center gap-1"><span className="w-2 h-1.5 rounded bg-indigo-500/60 inline-block shrink-0" /> Today</span>
            <span className="flex items-center gap-1"><span className="w-2 h-1.5 rounded bg-slate-600/50 inline-block shrink-0" /> Upcoming</span>
          </div>
        </div>

        {/* ── Full Weekly Program Grid ────────────────── */}
        <div className="mb-6">
          <h2 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
            <Zap size={13} className="text-indigo-400" />
            Full Program
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.values(workoutPlan).map((plan) => {
              const done = getSessionStatus(plan.sessionKey) === 'completed';
              return (
                <Link key={plan.sessionKey} to={`/workout/${plan.sessionKey}`}>
                  <div className={`card-hover p-4 cursor-pointer group flex items-center gap-3 ${done ? 'border-emerald-500/25' : ''}`}>
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${plan.colorClass} flex items-center justify-center text-xl shrink-0`}>
                      {plan.muscleEmoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-slate-500 font-medium">{plan.dayLabel} · {plan.time}</div>
                      <div className="font-bold text-white text-sm leading-tight truncate">{plan.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{plan.exercises.length} ex · {plan.duration}</div>
                    </div>
                    {done ? (
                      <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                    ) : (
                      <ChevronRight size={16} className="text-slate-600 group-active:text-white transition-colors shrink-0" />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
