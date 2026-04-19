import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import FoodSearchModal from '../components/FoodSearchModal';
import WaterTracker from '../components/WaterTracker';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Trash2, ChevronLeft, ChevronRight, UtensilsCrossed, Flame, Beef, Wheat, Droplets, TrendingUp } from 'lucide-react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import ConfirmDialog from '../components/ConfirmDialog';

const MEALS = [
  { key: 'breakfast',    label: 'Breakfast',    icon: '🌅', color: '#f59e0b' },
  { key: 'lunch',        label: 'Lunch',        icon: '☀️', color: '#10b981' },
  { key: 'dinner',       label: 'Dinner',       icon: '🌙', color: '#6366f1' },
  { key: 'snacks',       label: 'Snacks',       icon: '🍎', color: '#ec4899' },
  { key: 'pre_workout',  label: 'Pre-Workout',  icon: '⚡', color: '#f97316' },
  { key: 'post_workout', label: 'Post-Workout', icon: '💪', color: '#06b6d4' },
];

const MACRO_COLORS = ['#f59e0b', '#3b82f6', '#f97316', '#10b981'];

function MacroBar({ label, value, goal, color, unit = 'g' }) {
  const pct = goal ? Math.min((value / goal) * 100, 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1 text-xs">
        <span className="text-slate-400 font-medium">{label}</span>
        <span className="font-bold" style={{ color }}>
          {value}{unit} {goal ? <span className="text-slate-500 font-normal">/ {goal}{unit}</span> : ''}
        </span>
      </div>
      <div className="progress-bar h-2">
        <div className="progress-fill rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

const emptyLog = () => ({
  meals: MEALS.map((m) => ({ type: m.key, foods: [] })),
  waterMl: 0,
  waterGoalMl: 3000,
  notes: '',
});

export default function Nutrition() {
  const { user, getNutritionLog, fetchNutritionLog, saveNutritionLog } = useApp();
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [log, setLog] = useState(emptyLog());
  const [addingTo, setAddingTo] = useState(null); // meal key
  const [activeTab, setActiveTab] = useState('today');
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const saveTimer = useRef(null); // debounce timer for auto-save
  const [foodToRemove, setFoodToRemove] = useState(null);

  const isToday = date === dayjs().format('YYYY-MM-DD');

  // Pre-fetch last 7 days so history tab and chart have real data
  const historyFetched = useRef(false);
  useEffect(() => {
    if (historyFetched.current) return;
    historyFetched.current = true;
    for (let i = 1; i <= 6; i++) {
      const d = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
      fetchNutritionLog(d);
    }
  }, [fetchNutritionLog]);

  // Load log for selected date — fetch from server first so all devices stay in sync
  useEffect(() => {
    let cancelled = false;

    // Show cached data instantly while async fetch runs
    const cached = getNutritionLog(date);
    if (cached) {
      const mergedMeals = MEALS.map((m) => {
        const existing = cached.meals?.find((sm) => sm.type === m.key);
        return existing || { type: m.key, foods: [] };
      });
      setLog({ ...emptyLog(), ...cached, meals: mergedMeals });
    } else {
      const waterGoal = user?.currentWeight ? Math.round(user.currentWeight * 33) : 3000;
      setLog({ ...emptyLog(), waterGoalMl: waterGoal });
    }

    // Then fetch fresh data from server (handles cross-device sync)
    fetchNutritionLog(date).then((saved) => {
      if (cancelled || !saved) return;
      const mergedMeals = MEALS.map((m) => {
        const existing = saved.meals?.find((sm) => sm.type === m.key);
        return existing || { type: m.key, foods: [] };
      });
      setLog({ ...emptyLog(), ...saved, meals: mergedMeals });
    });

    return () => { cancelled = true; };
  }, [date]);

  // Debounced auto-save: waits 800ms after last change, then saves to MongoDB
  const persistLog = useCallback((updatedLog) => {
    clearTimeout(saveTimer.current);
    setSyncStatus('saving');
    saveTimer.current = setTimeout(async () => {
      try {
        await saveNutritionLog(date, updatedLog);
        setSyncStatus('saved');
        setTimeout(() => setSyncStatus('idle'), 2000);
      } catch {
        setSyncStatus('error');
      }
    }, 800);
  }, [date, saveNutritionLog]);

  const addFood = (mealKey, foodEntry) => {
    setLog((prev) => {
      const updated = {
        ...prev,
        meals: prev.meals.map((m) =>
          m.type === mealKey ? { ...m, foods: [...m.foods, { ...foodEntry, id: Date.now().toString() }] } : m
        ),
      };
      persistLog(updated);
      return updated;
    });
    toast.success(`${foodEntry.name} added to ${MEALS.find((m) => m.key === mealKey)?.label}!`);
  };

  const removeFood = (mealKey, foodIdx) => {
    setLog((prev) => {
      const updated = {
        ...prev,
        meals: prev.meals.map((m) =>
          m.type === mealKey ? { ...m, foods: m.foods.filter((_, i) => i !== foodIdx) } : m
        ),
      };
      persistLog(updated);
      return updated;
    });
  };

  const updateWater = (ml) => {
    setLog((prev) => {
      const updated = { ...prev, waterMl: ml };
      persistLog(updated);
      return updated;
    });
  };

  // Compute totals
  const totals = log.meals.reduce(
    (acc, meal) => {
      meal.foods.forEach((f) => {
        const qty = f.servingQty || 1;
        acc.calories += (f.calories || 0);
        acc.protein  += (f.protein  || 0);
        acc.carbs    += (f.carbs    || 0);
        acc.fat      += (f.fat      || 0);
        acc.fiber    += (f.fiber    || 0);
      });
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );

  const calorieGoal = user?.dailyCalories || 2500;
  const proteinGoal = user?.proteinTarget || 150;
  const goal = user?.fitnessGoal || 'bulk';
  const carbPct = goal === 'cut' ? 0.35 : goal === 'endurance' ? 0.55 : 0.45;
  const fatPct = goal === 'cut' ? 0.30 : goal === 'endurance' ? 0.20 : 0.25;
  const carbGoal = Math.round((calorieGoal * carbPct) / 4);
  const fatGoal = Math.round((calorieGoal * fatPct) / 9);

  const calLeft = Math.max(0, calorieGoal - totals.calories);
  const calPct = Math.min((totals.calories / calorieGoal) * 100, 100);

  const macroChartData = [
    { name: 'Protein', value: Math.round(totals.protein * 4), color: '#3b82f6' },
    { name: 'Carbs',   value: Math.round(totals.carbs * 4),   color: '#f59e0b' },
    { name: 'Fat',     value: Math.round(totals.fat * 9),     color: '#f97316' },
  ].filter((d) => d.value > 0);

  const changeDate = (delta) => {
    setDate(dayjs(date).add(delta, 'day').format('YYYY-MM-DD'));
  };

  // Build last 7 days for history tab
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = dayjs().subtract(6 - i, 'day').format('YYYY-MM-DD');
    const saved = getNutritionLog(d);
    const cal = saved?.meals?.reduce((a, m) => a + m.foods.reduce((s, f) => s + (f.calories || 0), 0), 0) || 0;
    return { date: d, calories: cal, label: dayjs(d).format('ddd') };
  });

  return (
    <div className="page-container relative">
      {/* ── Mobile Sticky Header ───────────────────── */}
      <div className="sticky top-0 z-30 lg:hidden border-b border-slate-700/30 px-4 py-3 overflow-hidden w-full"
        style={{ background: '#0a0e17' }}
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/15">
              <UtensilsCrossed size={15} className="text-emerald-400" />
            </div>
            <div>
              <div className="text-[9px] text-slate-600 uppercase tracking-[0.2em] font-black">Daily Log</div>
              <div className="text-sm font-black text-white leading-tight">Nutrition Tracker</div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            {/* Cloud sync status indicator */}
            {syncStatus === 'saving' && (
              <div className="flex items-center gap-1 text-slate-400">
                <div className="w-3 h-3 border border-slate-500 border-t-indigo-400 rounded-full animate-spin" />
                <span>Saving…</span>
              </div>
            )}
            {syncStatus === 'saved' && (
              <span className="text-emerald-400 font-semibold">☁️ Saved</span>
            )}
            {syncStatus === 'error' && (
              <span className="text-red-400 font-semibold">⚠️ Sync failed</span>
            )}
            {activeTab === 'today' && (
              <div className="flex items-center gap-1">
                <span className="text-amber-400 font-black">{Math.round(totals.calories)}</span>
                <span className="text-slate-500">/ {calorieGoal} kcal</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 lg:pt-8">
        {/* Desktop Header */}
        <div className="hidden lg:flex items-start justify-between mb-6">
          <div>
            <h1 className="section-title flex items-center gap-2">
              <UtensilsCrossed size={22} className="text-emerald-400" />
              Nutrition
            </h1>
            <p className="section-subtitle">Track meals, macros & hydration</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-slate-800 rounded-xl mb-5 border border-slate-700">
          {['today', 'history'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-semibold rounded-lg capitalize transition-all touch-manipulation ${
                activeTab === tab ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'today' ? '📋 Daily Log' : '📊 History'}
            </button>
          ))}
        </div>

        {activeTab === 'today' && (
          <>
            {/* Date Selector */}
            <div className="flex items-center justify-between mb-5 card px-4 py-3">
              <button onClick={() => changeDate(-1)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                <ChevronLeft size={18} />
              </button>
              <div className="text-center">
                <div className="font-bold text-white">{isToday ? 'Today' : dayjs(date).format('dddd')}</div>
                <div className="text-xs text-slate-400">{dayjs(date).format('MMMM D, YYYY')}</div>
              </div>
              <button
                onClick={() => changeDate(1)}
                disabled={isToday}
                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Calorie Summary Ring */}
            <div className="card p-5 mb-5">
              <div className="flex items-center gap-4">
                {/* Donut chart */}
                <div className="relative w-28 h-28 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={macroChartData.length ? macroChartData : [{ name: 'Empty', value: 1, color: '#334155' }]}
                        cx="50%" cy="50%"
                        innerRadius={36} outerRadius={52}
                        startAngle={90} endAngle={-270}
                        paddingAngle={macroChartData.length > 1 ? 3 : 0}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {(macroChartData.length ? macroChartData : [{ color: '#334155' }]).map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-black text-white leading-tight">{Math.round(totals.calories)}</span>
                    <span className="text-xs text-slate-400">kcal</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Goal</span>
                    <span className="font-bold text-white">{calorieGoal} kcal</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Eaten</span>
                    <span className="font-bold text-amber-400">{Math.round(totals.calories)} kcal</span>
                  </div>
                  <div className="progress-bar h-2">
                    <div
                      className="progress-fill transition-all duration-700"
                      style={{
                        width: `${calPct}%`,
                        background: calPct > 100 ? '#ef4444' : 'linear-gradient(90deg,#f59e0b,#ef4444)',
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">{calPct > 100 ? 'Over by' : 'Remaining'}</span>
                    <span className={`font-bold ${calPct > 100 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {calPct > 100 ? Math.round(totals.calories - calorieGoal) : calLeft} kcal
                    </span>
                  </div>
                </div>
              </div>

              {/* Macro Bars */}
              <div className="mt-4 pt-4 border-t border-slate-700 space-y-2.5">
                <MacroBar label="🥩 Protein"  value={Math.round(totals.protein)} goal={proteinGoal} color="#3b82f6" />
                <MacroBar label="🍚 Carbs"    value={Math.round(totals.carbs)}   goal={carbGoal}    color="#f59e0b" />
                <MacroBar label="🥑 Fat"      value={Math.round(totals.fat)}     goal={fatGoal}     color="#f97316" />
                <MacroBar label="🌿 Fiber"    value={Math.round(totals.fiber)}   goal={25}          color="#10b981" />
              </div>

              {/* Macro Legend */}
              {macroChartData.length > 0 && (
                <div className="flex gap-4 mt-3">
                  {macroChartData.map((m) => (
                    <div key={m.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                      {m.name}: {m.value} kcal
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Water Tracker */}
            <div className="mb-5">
              <WaterTracker
                waterMl={log.waterMl}
                goalMl={log.waterGoalMl}
                onUpdate={updateWater}
              />
            </div>

            {/* Meal Sections */}
            <div className="space-y-4">
              {MEALS.map((meal) => {
                const mealData = log.meals.find((m) => m.type === meal.key) || { type: meal.key, foods: [] };
                const mealCals = mealData.foods.reduce((s, f) => s + (f.calories || 0), 0);

                return (
                  <div key={meal.key} className="card overflow-hidden">
                    {/* Meal Header */}
                    <div
                      className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50"
                      style={{ borderLeftColor: meal.color, borderLeftWidth: 3 }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{meal.icon}</span>
                        <div>
                          <div className="font-bold text-white text-sm">{meal.label}</div>
                          {mealCals > 0 && (
                            <div className="text-xs" style={{ color: meal.color }}>
                              {Math.round(mealCals)} kcal · {mealData.foods.length} item{mealData.foods.length !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setAddingTo(meal.key)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border active:scale-95 touch-manipulation min-h-[36px]"
                        style={{
                          backgroundColor: `${meal.color}15`,
                          borderColor: `${meal.color}40`,
                          color: meal.color,
                        }}
                      >
                        <Plus size={13} /> Add Food
                      </button>
                    </div>

                    {/* Food Items */}
                    {mealData.foods.length === 0 ? (
                      <div className="px-4 py-4 text-xs text-slate-500 text-center">
                        No foods logged yet — tap Add Food
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-700/30">
                        {mealData.foods.map((food, idx) => (
                          <div key={food.id || idx} className="flex items-center gap-3 px-4 py-3 active:bg-slate-700/30 transition-colors">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-white truncate">{food.name}</div>
                              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-0.5 text-xs text-slate-400">
                                <span className="text-slate-500">{food.servingLabel}{food.servingQty !== 1 ? ` ×${food.servingQty}` : ''}</span>
                                <span className="text-amber-400 font-semibold">{food.calories} kcal</span>
                                <span className="text-blue-400">P:{food.protein}g</span>
                                <span className="text-orange-400">C:{food.carbs}g</span>
                              </div>
                            </div>
                            {/* Always-visible delete on mobile */}
                            <button
                              onClick={() => setFoodToRemove({ mealKey: meal.key, idx, name: food.name })}
                              className="p-2 rounded-xl text-slate-600 active:text-red-400 active:bg-red-500/10 hover:text-red-400 hover:bg-red-500/10 transition-all min-w-[36px] min-h-[36px] flex items-center justify-center shrink-0"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Meal Total */}
                    {mealData.foods.length > 0 && (
                      <div className="px-4 py-2 border-t border-slate-700/50 bg-slate-800/30 flex items-center justify-between text-xs">
                        <span className="text-slate-400">Meal total</span>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-amber-400">{Math.round(mealCals)} kcal</span>
                          <span className="text-blue-400">P:{Math.round(mealData.foods.reduce((s, f) => s + (f.protein || 0), 0))}g</span>
                          <span className="text-orange-400">C:{Math.round(mealData.foods.reduce((s, f) => s + (f.carbs || 0), 0))}g</span>
                          <span className="text-yellow-400">F:{Math.round(mealData.foods.reduce((s, f) => s + (f.fat || 0), 0))}g</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Daily Notes */}
            <div className="card p-4 mt-5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Daily Notes</label>
              <textarea
                value={log.notes}
                onChange={(e) => {
                  const updated = { ...log, notes: e.target.value };
                  setLog(updated);
                  persistLog(updated);
                }}
                placeholder="How was your diet today? Any cravings, energy levels..."
                className="input-field text-sm h-16 resize-none"
              />
            </div>
          </>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4 animate-fade-in">
            {/* 7-Day Bar Chart */}
            <div className="card p-5">
              <h3 className="font-bold text-white mb-1">7-Day Calorie History</h3>
              <p className="text-xs text-slate-400 mb-4">Goal: {calorieGoal} kcal/day</p>
              <div className="flex items-end gap-2 h-32">
                {last7Days.map((d) => {
                  const h = calorieGoal ? Math.min((d.calories / calorieGoal) * 100, 100) : 0;
                  const isToday = d.date === dayjs().format('YYYY-MM-DD');
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                      <div className="text-xs font-bold text-slate-400">{d.calories > 0 ? Math.round(d.calories) : ''}</div>
                      <div className="w-full relative flex-1">
                        <div className="absolute bottom-0 left-0 right-0 bg-slate-700/50 rounded-t-md h-full" />
                        <div
                          className="absolute bottom-0 left-0 right-0 rounded-t-md transition-all duration-700"
                          style={{
                            height: `${h}%`,
                            background: isToday
                              ? 'linear-gradient(180deg, #10b981, #059669)'
                              : h > 100 ? '#ef4444' : 'linear-gradient(180deg,#6366f1,#4f46e5)',
                          }}
                        />
                        {/* Goal line */}
                        <div className="absolute left-0 right-0 border-t border-dashed border-amber-500/40" style={{ bottom: '100%', transform: 'translateY(100%)' }} />
                      </div>
                      <div className={`text-xs font-semibold ${isToday ? 'text-emerald-400' : 'text-slate-500'}`}>{d.label}</div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded bg-indigo-500" />Past days</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded bg-emerald-500" />Today</div>
                <div className="flex items-center gap-1.5"><div className="w-6 border-t border-dashed border-amber-500/60" />Goal</div>
              </div>
            </div>

            {/* Weekly avg */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Avg Daily Calories', value: Math.round(last7Days.reduce((s, d) => s + d.calories, 0) / 7), unit: 'kcal', color: 'text-amber-400', icon: Flame },
                { label: 'Days Logged', value: last7Days.filter((d) => d.calories > 0).length, unit: '/ 7 days', color: 'text-indigo-400', icon: TrendingUp },
              ].map(({ label, value, unit, color, icon: Icon }) => (
                <div key={label} className="card p-4">
                  <Icon size={16} className={`${color} mb-2`} />
                  <div className={`text-2xl font-black ${color}`}>{value}</div>
                  <div className="text-xs text-slate-400">{unit}</div>
                  <div className="text-xs text-slate-500 mt-1">{label}</div>
                </div>
              ))}
            </div>

            {/* Past logs list */}
            <div className="card p-5">
              <h3 className="font-bold text-white mb-4">Recent Days</h3>
              <div className="space-y-2">
                {[...last7Days].reverse().map((d) => {
                  const pct = Math.min((d.calories / calorieGoal) * 100, 100);
                  return (
                    <button
                      key={d.date}
                      onClick={() => { setDate(d.date); setActiveTab('today'); }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-700/40 transition-colors text-left"
                    >
                      <div className="w-10 text-center">
                        <div className="text-xs font-bold text-slate-400">{d.label}</div>
                        <div className="text-xs text-slate-500">{dayjs(d.date).format('D MMM')}</div>
                      </div>
                      <div className="flex-1">
                        <div className="progress-bar h-2 mb-1">
                          <div
                            className="progress-fill"
                            style={{ width: `${pct}%`, background: d.calories > 0 ? 'linear-gradient(90deg,#6366f1,#10b981)' : '#334155' }}
                          />
                        </div>
                        <div className="text-xs text-slate-400">
                          {d.calories > 0 ? `${Math.round(d.calories)} kcal` : 'Not logged'}
                        </div>
                      </div>
                      <div className={`text-sm font-bold ${
                        d.calories === 0 ? 'text-slate-600' :
                        d.calories >= calorieGoal * 0.9 ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {pct > 0 ? `${Math.round(pct)}%` : '—'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Food Search Modal */}
      {addingTo && (
        <FoodSearchModal
          meal={addingTo}
          onAdd={(food) => addFood(addingTo, food)}
          onClose={() => setAddingTo(null)}
        />
      )}

      <ConfirmDialog
        open={!!foodToRemove}
        variant="danger"
        title="Remove Food?"
        message={foodToRemove ? `Remove "${foodToRemove.name}" from this meal?` : ''}
        confirmText="Remove"
        cancelText="Keep It"
        onConfirm={() => { const { mealKey, idx } = foodToRemove; setFoodToRemove(null); removeFood(mealKey, idx); }}
        onCancel={() => setFoodToRemove(null)}
      />
    </div>
  );
}
