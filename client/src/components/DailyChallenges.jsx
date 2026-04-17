import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { getTodayChallenges, getLevelFromXP, CATEGORY_COLORS, CATEGORY_ICONS } from '../data/dailyChallenges';
import useWorkoutPlan from '../hooks/useWorkoutPlan';
import { exercises as exerciseDb } from '../data/exercises';
import axios from 'axios';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { Zap, CheckCircle2, Circle, Star, ChevronDown, ChevronUp, Sparkles, Undo2 } from 'lucide-react';

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });
API.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('ft_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export default function DailyChallenges() {
  const { user, getWorkoutLog, getNutritionLog, fetchWorkoutLog, fetchNutritionLog } = useApp();
  const { workoutPlan, weekSchedule } = useWorkoutPlan();
  const [challenges, setChallenges] = useState([]);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [totalXP, setTotalXP] = useState(0);
  const [xpAnim, setXpAnim] = useState(null);
  const [checking, setChecking] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [pendingCh, setPendingCh] = useState(null);
  const [undoableId, setUndoableId] = useState(null);
  const undoTimer = useRef(null);

  useEffect(() => {
    const today = getTodayChallenges();
    setChallenges(today);

    API.get('/challenges').then(({ data }) => {
      const doneIds = new Set(data.challenges.filter((c) => c.completed).map((c) => c.challengeId));
      setCompletedIds(doneIds);
      setTotalXP(data.xp || 0);
    }).catch(() => {});
  }, []);

  const buildContext = useCallback(async () => {
    const todayKey = dayjs().format('YYYY-MM-DD');
    const todayDayName = DAY_NAMES[dayjs().day()];
    const sessions = weekSchedule.find((d) => d.key === todayDayName)?.sessions || [];

    // Fetch fresh data from server instead of reading stale cache
    const [nutrition, ...workoutLogs] = await Promise.all([
      fetchNutritionLog(todayKey).catch(() => getNutritionLog(todayKey)),
      ...sessions.map((sk) => fetchWorkoutLog(sk).catch(() => getWorkoutLog(sk))),
    ]);

    let totalCalories = 0, totalProtein = 0, totalFoodItems = 0, mealsLogged = 0;
    const meals = {};
    if (Array.isArray(nutrition?.meals)) {
      for (const meal of nutrition.meals) {
        const foods = meal.foods || [];
        meals[meal.type] = foods;
        if (foods.length > 0) mealsLogged++;
        for (const item of foods) {
          totalCalories += item.calories || 0;
          totalProtein += item.protein || 0;
          totalFoodItems++;
        }
      }
    }

    let workoutCompleted = false;
    let totalVolume = 0;
    let allSetsCompleted = true;
    sessions.forEach((sessionKey, i) => {
      const log = workoutLogs[i];
      if (log?.completed) workoutCompleted = true;
      if (log?.totalVolume) totalVolume += log.totalVolume;
      const plan = workoutPlan[sessionKey];
      if (plan && log?.exerciseLogs) {
        for (const exId of plan.exercises) {
          const ex = exerciseDb[exId];
          const sets = log.exerciseLogs[exId];
          if (ex && sets) {
            const allDone = sets.length >= ex.sets && sets.every((s) => s.completed);
            if (!allDone) allSetsCompleted = false;
          } else {
            allSetsCompleted = false;
          }
        }
      } else if (plan) {
        allSetsCompleted = false;
      }
    });

    const proteinGoal = user?.proteinTarget || Math.round((user?.currentWeight || 70) * 2.2);
    const calorieGoal = user?.dailyCalories || 3000;
    const waterGoal = Math.round((user?.currentWeight || 70) * 35);

    return {
      totalCalories, totalProtein, totalFoodItems, mealsLogged, meals,
      workoutCompleted, totalVolume, allSetsCompleted,
      proteinGoal, calorieGoal, waterGoal,
      waterMl: nutrition?.waterMl || 0,
    };
  }, [user, getWorkoutLog, getNutritionLog, fetchWorkoutLog, fetchNutritionLog, weekSchedule, workoutPlan]);

  const checkChallenges = useCallback(async () => {
    setChecking(true);
    const ctx = await buildContext();
    let newCompletions = 0;

    for (const ch of challenges) {
      if (completedIds.has(ch.id)) continue;
      if (ch.check(ctx)) {
        try {
          const { data } = await API.post('/challenges/complete', { challengeId: ch.id, xp: ch.xp });
          if (data.completed && !data.alreadyCompleted) {
            setCompletedIds((prev) => new Set([...prev, ch.id]));
            setTotalXP(data.totalXP);
            setXpAnim({ id: ch.id, xp: ch.xp });
            setTimeout(() => setXpAnim(null), 1500);
            newCompletions++;
          }
        } catch {}
      }
    }

    if (newCompletions > 0) {
      toast.success(`${newCompletions} challenge${newCompletions > 1 ? 's' : ''} completed!`, { icon: '🏆' });
    } else {
      toast('No new challenges detected yet', { icon: '🔍' });
    }
    setChecking(false);
  }, [challenges, completedIds, buildContext]);

  // Auto-check once on mount — fetch fresh server data before evaluating
  const autoCheckedRef = useRef(false);
  useEffect(() => {
    if (challenges.length > 0 && !autoCheckedRef.current) {
      autoCheckedRef.current = true;
      const timer = setTimeout(async () => {
        try {
          const ctx = await buildContext();
          let found = false;
          for (const ch of challenges) {
            if (!completedIds.has(ch.id) && ch.check(ctx)) { found = true; break; }
          }
          if (found) checkChallenges();
        } catch {}
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [challenges, completedIds, buildContext, checkChallenges]);

  // Mark any challenge as done via confirmation dialog
  const markDone = async () => {
    if (!pendingCh) return;
    const ch = pendingCh;
    setPendingCh(null);
    try {
      const { data } = await API.post('/challenges/self-report', { challengeId: ch.id, xp: ch.xp });
      if (data.completed && !data.alreadyCompleted) {
        setCompletedIds((prev) => new Set([...prev, ch.id]));
        setTotalXP(data.totalXP);
        setXpAnim({ id: ch.id, xp: ch.xp });
        setTimeout(() => setXpAnim(null), 1500);
        toast.success(`+${ch.xp} XP!`, { icon: '⭐' });
        startUndoWindow(ch.id);
      } else if (data.alreadyCompleted) {
        toast('Already completed!', { icon: '✅' });
      }
    } catch {
      toast.error('Failed to save');
    }
  };

  const startUndoWindow = (challengeId) => {
    clearTimeout(undoTimer.current);
    setUndoableId(challengeId);
    undoTimer.current = setTimeout(() => setUndoableId(null), 10000);
  };

  const undoChallenge = async (ch) => {
    try {
      const { data } = await API.post('/challenges/undo', { challengeId: ch.id });
      if (data.undone) {
        setCompletedIds((prev) => {
          const next = new Set(prev);
          next.delete(ch.id);
          return next;
        });
        setTotalXP(data.totalXP);
        setUndoableId(null);
        clearTimeout(undoTimer.current);
        toast('Challenge undone', { icon: '↩️' });
      }
    } catch {
      toast.error('Failed to undo');
    }
  };

  useEffect(() => {
    return () => clearTimeout(undoTimer.current);
  }, []);

  const completedCount = challenges.filter((c) => completedIds.has(c.id)).length;
  const { level, currentXP, nextLevelXP } = getLevelFromXP(totalXP);
  const levelPct = nextLevelXP > 0 ? (currentXP / nextLevelXP) * 100 : 0;
  const allDone = completedCount === challenges.length && challenges.length > 0;

  return (
    <div className="card overflow-hidden relative">

      {/* ── Confirmation Dialog ── */}
      {pendingCh && (
        <div className="absolute inset-0 z-10 bg-slate-900/85 backdrop-blur-sm flex items-center justify-center p-4 rounded-2xl">
          <div className="bg-slate-800 border border-slate-600/60 rounded-2xl p-5 w-full max-w-xs shadow-2xl shadow-black/50 text-center">
            <div className="text-3xl mb-2">{CATEGORY_ICONS[pendingCh.category]}</div>
            <h4 className="text-white font-bold text-sm mb-1">Mark as complete?</h4>
            <p className="text-slate-400 text-xs mb-4 leading-relaxed">
              {pendingCh.text}
              <span className="block mt-1 text-amber-400 font-semibold">+{pendingCh.xp} XP</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPendingCh(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-700 border border-slate-600 text-slate-300 text-sm font-semibold active:bg-slate-600 touch-manipulation"
              >
                Cancel
              </button>
              <button
                onClick={markDone}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 border border-emerald-500 text-white text-sm font-bold active:bg-emerald-700 touch-manipulation"
              >
                Yes, Done!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header (always visible) ── */}
      <div className="bg-gradient-to-r from-amber-600/20 via-amber-500/10 to-transparent p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-amber-400" />
            <h3 className="font-bold text-white text-sm">Daily Challenges</h3>
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${
              allDone ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/60 text-slate-400'
            }`}>
              {completedCount}/{challenges.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/15 rounded-lg border border-amber-500/30">
              <Star size={12} className="text-amber-400" />
              <span className="text-xs font-bold text-amber-400">Lv.{level}</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-indigo-500/15 rounded-lg border border-indigo-500/30">
              <Zap size={12} className="text-indigo-400" />
              <span className="text-xs font-bold text-indigo-400">{totalXP} XP</span>
            </div>
          </div>
        </div>

        {/* Level progress bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${levelPct}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500">{currentXP}/{nextLevelXP}</span>
        </div>

        {/* Always-visible action row: Check Progress + Expand toggle */}
        <div className="flex items-center gap-2 mt-3">
          {!allDone && (
            <button
              onClick={checkChallenges}
              disabled={checking}
              className="flex-1 py-2 rounded-xl bg-indigo-600/15 border border-indigo-500/25 text-indigo-400 text-xs font-semibold active:bg-indigo-600/30 touch-manipulation flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {checking ? (
                <div className="w-3.5 h-3.5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
              ) : (
                <CheckCircle2 size={13} />
              )}
              {checking ? 'Checking…' : 'Check Progress'}
            </button>
          )}
          {allDone && (
            <div className="flex-1 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5">
              🏆 All Done! +{challenges.reduce((s, c) => s + c.xp, 0)} XP
            </div>
          )}
          <button
            onClick={() => setExpanded((e) => !e)}
            className="px-3 py-2 rounded-xl bg-slate-700/40 border border-slate-600/30 text-slate-400 text-xs font-semibold active:bg-slate-700/70 touch-manipulation flex items-center gap-1.5"
          >
            {expanded ? <><ChevronUp size={13} /> Hide</> : <><ChevronDown size={13} /> View</>}
          </button>
        </div>
      </div>

      {/* ── Expandable Challenge List ── */}
      {expanded && (
        <div className="animate-fade-in">
          <div className="p-3 space-y-2">
            {challenges.map((ch) => {
              const done = completedIds.has(ch.id);
              const isAnimating = xpAnim?.id === ch.id;
              const canUndo = undoableId === ch.id && done;

              return (
                <div
                  key={ch.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    done
                      ? 'bg-emerald-950/30 border-emerald-500/30'
                      : 'bg-slate-800/40 border-slate-700/40'
                  } ${isAnimating ? 'ring-2 ring-amber-400/50 scale-[1.02]' : ''}`}
                >
                  {/* Tappable status icon */}
                  <button
                    onClick={() => { if (!done) setPendingCh(ch); }}
                    disabled={done}
                    className="shrink-0 touch-manipulation"
                  >
                    {done ? (
                      <CheckCircle2 size={22} className="text-emerald-400" />
                    ) : (
                      <Circle size={22} className="text-slate-500 active:text-indigo-400 transition-colors" />
                    )}
                  </button>

                  {/* Challenge info — also tappable to mark done */}
                  <button
                    onClick={() => { if (!done) setPendingCh(ch); }}
                    disabled={done}
                    className="flex-1 min-w-0 text-left touch-manipulation"
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm">{CATEGORY_ICONS[ch.category]}</span>
                      <span className={`text-sm font-medium leading-tight ${done ? 'text-emerald-300 line-through' : 'text-white'}`}>
                        {ch.text}
                      </span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${CATEGORY_COLORS[ch.category]}`}>
                      {ch.category}
                    </span>
                  </button>

                  {/* Right side: XP + undo */}
                  <div className="shrink-0 flex items-center gap-1.5">
                    {isAnimating && (
                      <span className="text-amber-400 font-bold text-sm animate-bounce">+{ch.xp}</span>
                    )}

                    {canUndo && (
                      <button
                        onClick={() => undoChallenge(ch)}
                        className="px-2 py-1.5 bg-slate-700/60 border border-slate-500/40 rounded-lg text-slate-300 text-[10px] font-bold active:bg-red-500/20 active:text-red-400 touch-manipulation flex items-center gap-1"
                      >
                        <Undo2 size={10} /> Undo
                      </button>
                    )}

                    <div className={`flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-bold ${
                      done ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-700/60 text-slate-400'
                    }`}>
                      <Zap size={10} />
                      {ch.xp}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
