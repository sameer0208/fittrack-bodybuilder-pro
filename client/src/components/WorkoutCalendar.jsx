import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Dumbbell, Clock, Flame, Calendar } from 'lucide-react';
import axios from 'axios';

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });
API.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('ft_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_HEADERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function getDaysInMonth(y, m) { return new Date(y, m, 0).getDate(); }

function getFirstDayOffset(y, m) {
  const d = new Date(y, m - 1, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

export default function WorkoutCalendar() {
  const [now, setNow] = useState(() => new Date());
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [completedDays, setCompletedDays] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') setNow(new Date());
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const todayDate = now.getDate();

  const fetchCalendar = useCallback(async (y, m) => {
    setLoading(true);
    setError(false);
    try {
      const { data } = await API.get(`/workouts/calendar/${y}/${m}`);
      setCompletedDays(data.days || {});
    } catch (err) {
      console.error('[Calendar] fetch failed:', err?.response?.status, err?.message);
      setCompletedDays({});
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCalendar(year, month); }, [year, month, fetchCalendar]);

  const goToPrev = () => {
    if (month === 1) { setYear(year - 1); setMonth(12); }
    else setMonth(month - 1);
    setSelectedDay(null);
  };

  const goToNext = () => {
    if (year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1)) return;
    if (month === 12) { setYear(year + 1); setMonth(1); }
    else setMonth(month + 1);
    setSelectedDay(null);
  };

  const goToToday = () => {
    setYear(now.getFullYear());
    setMonth(now.getMonth() + 1);
    setSelectedDay(null);
  };

  const canGoNext = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1);

  const daysInMonth = getDaysInMonth(year, month);
  const firstOffset = getFirstDayOffset(year, month);

  const totalSessions = Object.values(completedDays).reduce((s, arr) => s + arr.length, 0);
  const daysWorkedOut = Object.keys(completedDays).length;
  const selectedDayWorkouts = selectedDay ? (completedDays[selectedDay] || []) : [];

  return (
    <div className="card overflow-hidden">
      {/* ── Header: title + nav ── */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-700/40">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-indigo-400" />
          <span className="text-sm font-bold text-white">Workout Calendar</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={goToPrev}
            className="w-7 h-7 rounded-lg hover:bg-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white active:scale-90 transition-all touch-manipulation">
            <ChevronLeft size={15} />
          </button>
          <button onClick={goToToday}
            className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all touch-manipulation min-w-[80px] text-center">
            {MONTH_SHORT[month - 1]} {year}
          </button>
          <button onClick={goToNext} disabled={!canGoNext}
            className={`w-7 h-7 rounded-lg flex items-center justify-center active:scale-90 transition-all touch-manipulation ${
              canGoNext ? 'hover:bg-slate-700/50 text-slate-400 hover:text-white' : 'text-slate-700 cursor-not-allowed'
            }`}>
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* ── Day headers ── */}
      <div className="grid grid-cols-7 px-2 pt-2 pb-1">
        {DAY_HEADERS.map((d, i) => (
          <div key={i} className={`text-center text-[10px] font-semibold ${
            i >= 5 ? 'text-red-400/60' : 'text-slate-500'
          }`}>
            {d}
          </div>
        ))}
      </div>

      {/* ── Date grid ── */}
      <div className="grid grid-cols-7 px-2 pb-2 relative">
        {loading && (
          <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center z-10 rounded-lg">
            <div className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
          </div>
        )}

        {/* Previous month trailing */}
        {Array.from({ length: firstOffset }).map((_, i) => (
          <div key={`p-${i}`} className="h-8 flex items-center justify-center">
            <span className="text-[11px] text-slate-700/50">&nbsp;</span>
          </div>
        ))}

        {/* Current month */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const isToday = isCurrentMonth && day === todayDate;
          const workouts = completedDays[day];
          const hasWorkout = workouts && workouts.length > 0;
          const isFuture = isCurrentMonth && day > todayDate;
          const isSelected = selectedDay === day;
          const multi = hasWorkout && workouts.length > 1;

          return (
            <button
              key={day}
              type="button"
              onClick={() => hasWorkout && setSelectedDay(isSelected ? null : day)}
              className={`h-8 relative flex items-center justify-center rounded-md transition-all ${
                isSelected
                  ? 'bg-indigo-500/20 ring-1 ring-indigo-500/50'
                  : isToday
                  ? 'bg-indigo-500/10'
                  : hasWorkout
                  ? 'hover:bg-slate-700/30'
                  : ''
              } ${hasWorkout ? 'cursor-pointer active:scale-90' : 'cursor-default'}`}
            >
              {/* Today dot indicator */}
              {isToday && (
                <span className="absolute top-0.5 right-1 w-1 h-1 rounded-full bg-indigo-400" />
              )}

              {/* Date number */}
              <span className={`text-[11px] font-semibold relative z-[1] leading-none ${
                isFuture ? 'text-slate-600'
                : hasWorkout ? 'text-emerald-400 font-bold'
                : isToday ? 'text-indigo-300'
                : 'text-slate-400'
              }`}>
                {day}
              </span>

              {/* Workout cross */}
              {hasWorkout && (
                <X size={20} strokeWidth={2.5}
                  className="absolute inset-0 m-auto text-red-500/50 pointer-events-none" />
              )}

              {/* Multi-session badge */}
              {multi && (
                <span className="absolute -bottom-0.5 right-0 text-[7px] font-black text-amber-400 leading-none">
                  {workouts.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Selected day detail ── */}
      {selectedDay && selectedDayWorkouts.length > 0 && (
        <div className="border-t border-slate-700/40 bg-slate-800/30 px-3.5 py-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-400">
              {MONTH_SHORT[month - 1]} {selectedDay} — {selectedDayWorkouts.length} session{selectedDayWorkouts.length > 1 ? 's' : ''}
            </span>
            <button onClick={() => setSelectedDay(null)} className="text-slate-500 hover:text-white p-0.5">
              <X size={11} />
            </button>
          </div>
          <div className="space-y-1">
            {selectedDayWorkouts.map((w, i) => (
              <div key={i} className="flex items-center gap-2.5 bg-slate-700/20 rounded-lg px-2.5 py-1.5">
                <Dumbbell size={11} className="text-indigo-400 shrink-0" />
                <span className="text-[11px] font-semibold text-white truncate flex-1">
                  {w.workoutName || w.workoutDay?.replace(/_/g, ' ')}
                </span>
                {w.duration > 0 && (
                  <span className="flex items-center gap-0.5 text-[9px] text-slate-400 shrink-0">
                    <Clock size={8} /> {w.duration}m
                  </span>
                )}
                {w.totalVolume > 0 && (
                  <span className="flex items-center gap-0.5 text-[9px] text-amber-400 shrink-0">
                    <Flame size={8} /> {Math.round(w.totalVolume)}kg
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Footer stats ── */}
      <div className="border-t border-slate-700/30 px-3.5 py-2 flex items-center justify-between">
        {error ? (
          <button onClick={() => fetchCalendar(year, month)}
            className="text-[10px] text-amber-400 font-semibold hover:text-amber-300 transition-colors">
            Failed to load — tap to retry
          </button>
        ) : (
          <>
            <div className="flex items-center gap-1.5">
              <X size={10} strokeWidth={2.5} className="text-red-500/60" />
              <span className="text-[9px] text-slate-500">= done</span>
            </div>
            <div className="flex items-center gap-2.5 text-[10px]">
              <span className="text-slate-500">
                <span className="font-bold text-emerald-400">{daysWorkedOut}</span> days
              </span>
              <span className="text-slate-700">·</span>
              <span className="text-slate-500">
                <span className="font-bold text-indigo-400">{totalSessions}</span> sessions
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
