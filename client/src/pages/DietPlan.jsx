import { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Flame, Beef, Wheat, Droplets, Clock, Zap, Moon, Sun,
  Dumbbell, Heart, Brain, Shield, TrendingUp, ChevronDown,
  ChevronUp, Star, Target, Check, Info
} from 'lucide-react';

// ── Meal Plan Generator ───────────────────────────────────────────────────────
function generateMealPlan(calorieGoal, proteinGoal) {
  const carbGoal = Math.round((calorieGoal * 0.45) / 4);
  const fatGoal = Math.round((calorieGoal * 0.28) / 9);

  return {
    breakfast: {
      label: '🌅 Breakfast', time: '7:00 – 8:00 AM',
      goal: `~${Math.round(calorieGoal * 0.25)} kcal`,
      items: [
        { name: '4 Boiled Eggs (2 whole + 2 whites)', cal: 215, p: 24, c: 1, f: 12 },
        { name: '2 Whole Wheat Roti / 2 slices Multigrain Bread', cal: 240, p: 7, c: 44, f: 5 },
        { name: '1 Glass Full Fat Milk (300ml)', cal: 195, p: 10, c: 14, f: 10 },
        { name: '1 Banana', cal: 105, p: 1.3, c: 27, f: 0.4 },
      ],
      alts: ['Masala Omelette (3 eggs) + 2 Roti + Milk', 'Daliya Khichdi + Greek Yogurt + Fruit', 'Besan Cheela (4 pieces) + Curd + Banana'],
      tip: 'Eat within 30–60 min of waking up. Breakfast sets your metabolic tone for the day. High protein + complex carbs = sustained energy.',
    },
    mid_morning: {
      label: '🍎 Mid-Morning Snack', time: '10:00 – 10:30 AM',
      goal: `~${Math.round(calorieGoal * 0.1)} kcal`,
      items: [
        { name: 'Greek Yogurt (full fat, 170g)', cal: 170, p: 17, c: 6, f: 9 },
        { name: 'Mixed Nuts (30g almonds + walnuts)', cal: 185, p: 5, c: 5, f: 17 },
        { name: '1 Handful Roasted Chana', cal: 180, p: 10, c: 28, f: 3 },
      ],
      alts: ['1 Banana + Peanut Butter (1 tbsp)', 'Makhana (1 cup) + Black Coffee', '1 cup Sprouts Salad'],
      tip: 'Keep this snack protein-rich to maintain anabolism between main meals. Nuts + yogurt is a perfect combo.',
    },
    lunch: {
      label: '☀️ Lunch', time: '1:00 – 2:00 PM',
      goal: `~${Math.round(calorieGoal * 0.3)} kcal`,
      items: [
        { name: '150–200g Grilled Chicken Breast', cal: 280, p: 47, c: 0, f: 6 },
        { name: '1.5 cups Basmati / Brown Rice', cal: 357, p: 7.4, c: 78, f: 1 },
        { name: '1 cup Dal Tadka', cal: 198, p: 11, c: 33, f: 7 },
        { name: 'Mixed Vegetable Salad', cal: 60, p: 2.5, c: 12, f: 4 },
      ],
      alts: ['Chicken Biryani (full plate) + Raita + Salad', 'Rajma Chawal + Curd + Onion Salad', 'Egg Curry (3 eggs) + 3 Roti + Dal'],
      tip: 'Largest meal of the day. Load up on complex carbs and lean protein. Eat slowly — takes 20 min to feel full.',
    },
    pre_workout: {
      label: '⚡ Pre-Workout', time: '45–60 min before gym',
      goal: `~${Math.round(calorieGoal * 0.1)} kcal`,
      items: [
        { name: '1 Large Banana', cal: 121, p: 1.5, c: 31, f: 0.5 },
        { name: '2 Dates (Medjool)', cal: 133, p: 0.8, c: 36, f: 0.1 },
        { name: 'Black Coffee (optional, 30 min before)', cal: 2, p: 0, c: 0, f: 0 },
      ],
      alts: ['Rice Cakes + Peanut Butter (2 tbsp)', '1 cup Oats + Honey + Milk', 'Banana Mango Shake', 'Poha (light, 1 bowl)'],
      tip: 'Fast-digesting carbs = instant fuel. Avoid heavy fats/fiber right before training as they slow digestion. Caffeine 30 min before = 10–15% strength boost.',
    },
    post_workout: {
      label: '💪 Post-Workout', time: 'Within 30–45 min after gym',
      goal: `~${Math.round(calorieGoal * 0.15)} kcal`,
      items: [
        { name: 'Whey Protein Shake (1 scoop + milk)', cal: 315, p: 34, c: 17, f: 12 },
        { name: '1 Banana', cal: 105, p: 1.3, c: 27, f: 0.4 },
        { name: '3 Rice Cakes', cal: 105, p: 2.1, c: 21.9, f: 0.8 },
      ],
      alts: ['150g Chicken + 1 cup Rice + Vegetables', '3 Boiled Eggs + 2 Toast + Fruit', 'Paneer (100g) + 2 Roti + Banana', 'Sattu Shake + Banana'],
      tip: 'The "anabolic window" is 30–45 min post-workout. Fast protein (whey) + fast carbs (banana) = maximum muscle recovery. Don\'t skip this!',
    },
    dinner: {
      label: '🌙 Dinner', time: '7:30 – 8:30 PM',
      goal: `~${Math.round(calorieGoal * 0.25)} kcal`,
      items: [
        { name: '150g Grilled Chicken / Paneer (100g)', cal: 265, p: 32, c: 3, f: 14 },
        { name: '2 Whole Wheat Roti', cal: 240, p: 7, c: 44, f: 5 },
        { name: '1 cup Dal / Rajma / Chole', cal: 220, p: 12, c: 36, f: 9 },
        { name: 'Steamed Vegetables (broccoli, peas)', cal: 80, p: 5, c: 14, f: 6 },
        { name: '1 cup Dahi / Curd', cal: 118, p: 8, c: 9, f: 5 },
      ],
      alts: ['Palak Paneer + 3 Roti', 'Fish Curry + Rice + Salad', 'Dal Khichdi + Curd + Salad'],
      tip: 'Slightly lighter than lunch. Reduce carbs post 7PM if cutting, but keep high protein for overnight muscle recovery.',
    },
    before_bed: {
      label: '🌃 Before Bed', time: '9:30 – 10:00 PM',
      goal: `~${Math.round(calorieGoal * 0.1)} kcal`,
      items: [
        { name: 'Casein Protein Shake OR', cal: 120, p: 24, c: 4, f: 1 },
        { name: '200g Cottage Cheese (Paneer/Chhena)', cal: 196, p: 22, c: 6.8, f: 8.6 },
        { name: '10 Almonds', cal: 70, p: 2.6, c: 2.6, f: 6 },
      ],
      alts: ['1 Glass Warm Milk + 10 Almonds', 'Greek Yogurt (non-fat) + Chia Seeds', '2 Boiled Eggs (whites only)'],
      tip: 'Casein and cottage cheese digest slowly for 6–8 hours. This prevents muscle catabolism during your sleep — critical for bulking.',
    },
  };
}

// ── Tips Data ─────────────────────────────────────────────────────────────────
const tipsData = {
  nutrition: [
    { title: 'Caloric Surplus is Non-Negotiable', icon: '🔥', color: 'amber',
      content: 'To bulk, you MUST eat MORE calories than you burn. Aim for 300–500 kcal surplus daily. Undereating is the #1 reason people don\'t gain muscle despite training hard. Track your food for at least the first 4 weeks.' },
    { title: 'Hit Your Protein Every Single Day', icon: '🥩', color: 'blue',
      content: 'Protein is the raw material for muscle. Target 2.0–2.2g per kg of bodyweight. Space it across 4–6 meals (30–40g each). Your body can only use ~40g per sitting effectively. Good Indian sources: chicken, eggs, dal, rajma, paneer, soya chunks.' },
    { title: 'Time Your Carbs Around Workouts', icon: '⚡', color: 'orange',
      content: 'Eat your highest carb meals at breakfast, pre-workout, and post-workout. Carbs refuel glycogen (your gym fuel) and spike insulin which drives amino acids into muscle cells. Rice, roti, banana, oats are your best friends.' },
    { title: 'Don\'t Fear Fats', icon: '🥑', color: 'emerald',
      content: 'Dietary fat supports testosterone production (critical for muscle growth). Aim for 20–30% of calories from healthy fats. Sources: ghee, nuts, eggs, paneer, avocado, fatty fish. Cut only trans fats (fried food, maida snacks).' },
    { title: 'Meal Frequency for Bulking', icon: '🕐', color: 'purple',
      content: 'Eat every 3–4 hours — aim for 5–6 meals/day when bulking. This keeps blood amino acids elevated (anabolic state) and spreads your calorie load for better absorption and less bloating.' },
    { title: 'Micronutrients for Performance', icon: '💊', color: 'teal',
      content: 'Iron (spinach, dal) prevents fatigue. Zinc (pumpkin seeds, meat) supports testosterone. Magnesium (nuts, dark chocolate) aids sleep and recovery. Vitamin D (sunlight + eggs) boosts muscle protein synthesis. Eat colourful vegetables daily.' },
  ],
  training: [
    { title: 'Progressive Overload is the Law', icon: '📈', color: 'indigo',
      content: 'Your muscles only grow when forced to do more. Every week, aim to either add weight (2.5–5kg), add 1 rep, or do an extra set. If you\'re lifting the same weight for months — you\'re not growing. Track every session.' },
    { title: 'Train Hard, But Not Always Heavy', icon: '💪', color: 'blue',
      content: 'Optimal hypertrophy range: 6–20 reps. Don\'t just go heavy for 3 reps every time — vary your rep ranges. Heavy compounds (4–8 reps) build strength-size. Moderate weight isolation (12–20 reps) maximizes muscle damage and pump.' },
    { title: 'Compound Lifts First, Isolation Second', icon: '🏋️', color: 'amber',
      content: 'Start every session with the big compounds: Squat, Deadlift, Bench Press, Overhead Press, Row. These recruit the most muscle fibres, release the most testosterone, and build the most mass. Isolations are the finishing touch.' },
    { title: 'Mind-Muscle Connection', icon: '🧠', color: 'purple',
      content: 'Studies show THINKING about the muscle you\'re working increases activation by 20–40%. Slow down, squeeze at peak contraction, and visualise the muscle working. This separates mediocre gains from elite gains.' },
    { title: 'Rest Between Sets is Crucial', icon: '⏱️', color: 'teal',
      content: 'For compound lifts: rest 2–4 minutes. For isolation exercises: rest 60–90 seconds. Too little rest = incomplete recovery = less weight = less growth stimulus. Don\'t rush your rest periods during heavy lifts.' },
    { title: 'Form Before Weight, Always', icon: '✅', color: 'emerald',
      content: 'A torn muscle from bad form = zero gym for 3–6 months. Learn perfect form with lighter weights first. Record yourself. One quality rep with good form beats five sloppy reps. Injuries are the biggest obstacle to gains.' },
  ],
  recovery: [
    { title: '8 Hours Sleep = Anabolic Gold', icon: '😴', color: 'indigo',
      content: 'Growth Hormone is released primarily during deep sleep. If you sleep 6 hours, you lose 20–30% of potential muscle gains. Make 8 hours non-negotiable. Sleep is when your muscles actually GROW — training just creates the stimulus.' },
    { title: 'Manage Cortisol (Stress Kills Gains)', icon: '🧘', color: 'teal',
      content: 'High cortisol (stress hormone) breaks down muscle tissue. Practice 10 minutes of deep breathing or meditation daily. Limit alcohol completely — it crashes testosterone and spikes cortisol. Manage work stress actively.' },
    { title: 'Active Recovery Days', icon: '🚶', color: 'emerald',
      content: 'Light 20-30 min walks on rest days increases blood flow to muscles, speeds recovery, and prevents soreness without fatiguing your CNS. It\'s also great for mental health and appetite regulation during a bulk.' },
    { title: 'Foam Roll & Stretch Daily', icon: '🔄', color: 'orange',
      content: 'Daily foam rolling reduces DOMS (muscle soreness), improves range of motion, and prevents injury. Focus on IT band, quads, lats, chest. 5–10 minutes post-workout or before bed. Flexible muscles perform and grow better.' },
    { title: 'Hydration = Performance', icon: '💧', color: 'blue',
      content: 'A 2% drop in hydration reduces strength by 10–15% and cognitive performance by 20%. Drink 35–40ml per kg bodyweight daily. Add more on training days. Coconut water and sports drinks during long sessions replenish electrolytes.' },
    { title: 'Deload Every 4–6 Weeks', icon: '📉', color: 'purple',
      content: 'Every 4–6 weeks, take a deload week (50–60% weight, same exercises). This allows complete CNS recovery, joint healing, and often leads to new PRs the following week. Skipping deloads leads to overtraining syndrome.' },
  ],
  supplements: [
    { title: 'Whey Protein (Top Priority)', icon: '🥛', color: 'blue', tier: 'Essential',
      content: 'Best investment for bulking. Take 1–2 scoops/day to hit protein targets. Best times: post-workout (fast whey) and morning. India options: MuscleBlaze, AS-IT-IS, MyFitnessPal, Dymatize. Cost-effective: AS-IT-IS Whey (best value).' },
    { title: 'Creatine Monohydrate (Proven #1)', icon: '⚡', color: 'amber', tier: 'Essential',
      content: '5g daily — the most researched supplement with zero proven side effects. Increases strength by 10–15%, muscle fullness, and recovery speed. Take it daily (no loading needed). Flavourless — mix with anything. AS-IT-IS Creatine is excellent.' },
    { title: 'Mass Gainer (If Eating is Hard)', icon: '📈', color: 'indigo', tier: 'Useful',
      content: 'Only use if you genuinely struggle to eat enough calories. Mass gainers can add 500–1000 kcal easily. BUT whole food calories are always better. If you can eat, eat. If not, one serving of mass gainer post-workout is fine.' },
    { title: 'BCAA (Optional)', icon: '💊', color: 'purple', tier: 'Optional',
      content: 'Beneficial if training fasted or doing 2-a-days. Otherwise, if you\'re hitting protein goals, BCAAs add minimal value. Save money — buy more food instead. Use during long training sessions (90+ min) or intra-workout.' },
    { title: 'Vitamin D3 + K2', icon: '☀️', color: 'orange', tier: 'Essential',
      content: 'Most Indian gymgoers are deficient (we work out indoors). Vitamin D3 supports testosterone production, bone health, and immune function. Take 2000–5000 IU D3 + 100mcg K2 daily with a fat-containing meal.' },
    { title: 'Omega-3 Fish Oil', icon: '🐟', color: 'teal', tier: 'Recommended',
      content: '2–3g EPA/DHA daily reduces inflammation, joint pain, and speeds recovery. If you don\'t eat fatty fish 3x/week, supplement. Takes 2–3 weeks to feel effects. Also improves mood and cognitive function — gym + brain benefits.' },
    { title: 'Zinc + Magnesium (ZMA)', icon: '🌙', color: 'emerald', tier: 'Recommended',
      content: 'Take before bed. Zinc supports testosterone. Magnesium improves sleep quality and reduces cortisol. Studies show ZMA can increase testosterone by 25% in deficient individuals. Cheap and effective — often overlooked.' },
    { title: 'Caffeine (Natural Pre-Workout)', icon: '☕', color: 'amber', tier: 'Useful',
      content: '100–200mg caffeine (1–2 coffees) 30–45 min pre-workout = 10–15% strength increase, better focus, delayed fatigue. No need for expensive pre-workouts. Black coffee is free, effective, and clean. Cycle off for 2 weeks monthly.' },
  ],
  timing: [
    { time: '7:00 AM', meal: 'Breakfast', foods: 'Eggs + Roti/Toast + Milk + Fruit', note: 'Break overnight fast with protein + carbs' },
    { time: '10:00 AM', meal: 'Snack', foods: 'Greek Yogurt / Nuts / Fruits / Roasted Chana', note: 'Keep anabolism going' },
    { time: '1:00 PM', meal: 'Lunch', foods: 'Chicken/Dal/Paneer + Rice/Roti + Vegetables', note: 'Biggest meal of the day' },
    { time: '4:00 PM', meal: 'Pre-Workout', foods: 'Banana + Dates / Toast + PB / Light carbs', note: '45–60 min before gym' },
    { time: '5:00–6:30 PM', meal: '🏋️ GYM', foods: 'Sip BCAA or water during session', note: 'Train hard!' },
    { time: '7:00 PM', meal: 'Post-Workout', foods: 'Whey Shake + Banana / Chicken + Rice', note: 'Within 30–45 min post-gym' },
    { time: '8:00 PM', meal: 'Dinner', foods: 'Protein + Roti/Rice + Dal + Vegetables + Curd', note: 'Complete macro balance' },
    { time: '10:00 PM', meal: 'Before Bed', foods: 'Casein Shake / Paneer / Warm Milk + Almonds', note: 'Overnight muscle feeding' },
  ],
};

const tierColors = {
  Essential: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Useful: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Recommended: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  Optional: 'bg-slate-500/20 text-slate-400 border-slate-600',
};

const colorMap = {
  amber: 'from-amber-600/20 to-orange-600/10 border-amber-500/30 text-amber-400',
  blue: 'from-blue-600/20 to-cyan-600/10 border-blue-500/30 text-blue-400',
  orange: 'from-orange-600/20 to-red-600/10 border-orange-500/30 text-orange-400',
  emerald: 'from-emerald-600/20 to-teal-600/10 border-emerald-500/30 text-emerald-400',
  purple: 'from-purple-600/20 to-violet-600/10 border-purple-500/30 text-purple-400',
  teal: 'from-teal-600/20 to-cyan-600/10 border-teal-500/30 text-teal-400',
  indigo: 'from-indigo-600/20 to-purple-600/10 border-indigo-500/30 text-indigo-400',
};

function TipCard({ tip }) {
  const [open, setOpen] = useState(false);
  const col = colorMap[tip.color] || colorMap.indigo;
  return (
    <div className={`bg-gradient-to-br ${col} border rounded-xl overflow-hidden transition-all duration-200`}>
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-3 p-4 text-left">
        <span className="text-2xl shrink-0">{tip.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-white text-sm leading-tight">{tip.title}</div>
          {tip.tier && (
            <span className={`badge border text-xs mt-1 ${tierColors[tip.tier]}`}>{tip.tier}</span>
          )}
        </div>
        {open ? <ChevronUp size={16} className="shrink-0 text-slate-400" /> : <ChevronDown size={16} className="shrink-0 text-slate-400" />}
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-slate-300 leading-relaxed border-t border-white/10 pt-3 animate-fade-in">
          {tip.content}
        </div>
      )}
    </div>
  );
}

function MealSection({ meal }) {
  const [open, setOpen] = useState(false);
  const total = meal.items.reduce((a, f) => ({ cal: a.cal + f.cal, p: a.p + f.p, c: a.c + f.c, f: a.f + f.f }), { cal: 0, p: 0, c: 0, f: 0 });

  return (
    <div className="card overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{meal.label.split(' ')[0]}</div>
          <div className="text-left">
            <div className="font-bold text-white text-sm">{meal.label.replace(/^[^ ]+ /, '')}</div>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <Clock size={11} />{meal.time}
              <span className="text-amber-400 font-semibold ml-1">{meal.goal}</span>
            </div>
          </div>
        </div>
        {open ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-slate-700/50 animate-fade-in">
          {/* Food items */}
          <div className="p-4 space-y-2">
            {meal.items.map((item, i) => (
              <div key={i} className="flex items-start justify-between gap-3 py-2 border-b border-slate-700/30 last:border-0">
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{item.name}</div>
                  <div className="flex gap-3 mt-1 text-xs">
                    <span className="text-blue-400">P: {item.p}g</span>
                    <span className="text-orange-400">C: {item.c}g</span>
                    <span className="text-yellow-400">F: {item.f}g</span>
                  </div>
                </div>
                <span className="text-amber-400 font-bold text-sm shrink-0">{item.cal} kcal</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mx-4 mb-3 p-3 bg-slate-900/40 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-400">Meal Total</span>
            <div className="flex gap-4">
              <span className="text-amber-400 font-bold">{total.cal} kcal</span>
              <span className="text-blue-400">P: {Math.round(total.p)}g</span>
              <span className="text-orange-400">C: {Math.round(total.c)}g</span>
              <span className="text-yellow-400">F: {Math.round(total.f)}g</span>
            </div>
          </div>

          {/* Alternatives */}
          <div className="px-4 pb-4">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Alternatives:</div>
            <div className="space-y-1.5">
              {meal.alts.map((alt, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                  <Check size={11} className="text-emerald-400 shrink-0 mt-0.5" />
                  {alt}
                </div>
              ))}
            </div>
            <div className="mt-3 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <span className="text-xs font-bold text-indigo-400">💡 </span>
              <span className="text-xs text-slate-300">{meal.tip}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DietPlan() {
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState('plan');

  const goal = user?.fitnessGoal || 'bulk';
  const calorieGoal = user?.dailyCalories || 2800;
  const proteinGoal = user?.proteinTarget || 160;
  const carbPct = goal === 'cut' ? 0.35 : goal === 'endurance' ? 0.55 : 0.45;
  const fatPct = goal === 'cut' ? 0.30 : goal === 'endurance' ? 0.20 : 0.28;
  const carbGoal = Math.round((calorieGoal * carbPct) / 4);
  const fatGoal = Math.round((calorieGoal * fatPct) / 9);

  const mealPlan = generateMealPlan(calorieGoal, proteinGoal);

  const bmi = parseFloat(user?.bmi || 22);
  const bodyType = bmi < 18.5 ? 'Ectomorph (Hardgainer)' : bmi < 25 ? 'Mesomorph' : 'Endomorph';

  const GOAL_ADVICE = {
    bulk: bmi < 18.5
      ? 'You are underweight. Aggressive bulk (+600 kcal surplus). Prioritise calorie-dense foods like rice, roti, full fat dairy, peanut butter, and mass gainer.'
      : bmi < 25
      ? 'Great starting point. Lean bulk (+400 kcal surplus). Focus on quality calories from whole foods. Limit junk food even in a surplus.'
      : 'Begin with body recomposition (minimal surplus). Prioritise high protein, moderate carbs. Fat will reduce while muscle builds.',
    cut: 'You are in a calorie deficit to lose fat. Prioritise high-protein meals to preserve muscle. Eat plenty of vegetables for volume and satiety. Avoid processed foods and sugar.',
    maintain: 'Eat at maintenance calories to sustain your physique. Focus on balanced macros, whole foods, and consistent meal timing.',
    strength: 'Moderate surplus to fuel strength gains. Prioritise protein and carbs around training. Recovery meals are critical for nervous system repair.',
    endurance: 'Higher carb intake to fuel endurance work. Eat complex carbs before training and fast-digesting carbs during long sessions. Stay hydrated.',
  };
  const goalAdvice = GOAL_ADVICE[goal] || GOAL_ADVICE.bulk;
  const GOAL_STRATEGY_LABEL = { bulk: 'Your Bulk Strategy', cut: 'Your Cut Strategy', maintain: 'Your Maintenance Plan', strength: 'Your Strength Strategy', endurance: 'Your Endurance Fuel Plan' };

  const tabs = [
    { key: 'plan', label: '📋 Meal Plan', icon: Target },
    { key: 'timing', label: '⏱ Timing', icon: Clock },
    { key: 'nutrition', label: '🥗 Nutrition', icon: Flame },
    { key: 'training', label: '🏋️ Training', icon: Dumbbell },
    { key: 'recovery', label: '😴 Recovery', icon: Moon },
    { key: 'supplements', label: '💊 Supplements', icon: Shield },
  ];

  return (
    <div className="page-container">
      {/* Mobile Sticky Header */}
      <div className="sticky top-0 z-30 lg:hidden bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/40 px-4 py-3 overflow-hidden w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-amber-500/15 rounded-lg flex items-center justify-center">
            <Star size={14} className="text-amber-400" fill="currentColor" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Personalised</div>
            <div className="text-sm font-bold text-white leading-tight">Your Diet Plan</div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 lg:pt-8">

        {/* Desktop Header */}
        <div className="hidden lg:block mb-6">
          <h1 className="section-title flex items-center gap-2">
            <Star size={22} className="text-amber-400" />
            Your Diet Plan
          </h1>
          <p className="section-subtitle">Personalised for your {goal === 'cut' ? 'fat loss' : goal === 'maintain' ? 'maintenance' : goal === 'strength' ? 'strength' : goal === 'endurance' ? 'endurance' : 'muscle building'} journey</p>
        </div>

        {/* Personal Summary Card */}
        <div className="card p-5 mb-6 bg-gradient-to-br from-indigo-900/40 to-purple-900/30 border-indigo-500/30">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-sm text-slate-400">Plan for</div>
              <div className="text-xl font-black text-white">{user?.name || 'Athlete'}</div>
              <div className="text-xs text-indigo-400 mt-0.5">
                {user?.currentWeight}kg → {user?.targetWeight}kg | {user?.height}cm | BMI {user?.bmi}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Body Type</div>
              <div className="text-sm font-bold text-indigo-300">{bodyType}</div>
            </div>
          </div>

          {/* Macro Grid */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { label: 'Calories', value: calorieGoal, unit: 'kcal', color: 'text-amber-400', bg: 'bg-amber-500/10' },
              { label: 'Protein', value: `${proteinGoal}g`, unit: '/day', color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { label: 'Carbs', value: `${carbGoal}g`, unit: '/day', color: 'text-orange-400', bg: 'bg-orange-500/10' },
              { label: 'Fat', value: `${fatGoal}g`, unit: '/day', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
            ].map((m) => (
              <div key={m.label} className={`${m.bg} rounded-xl p-2.5 text-center`}>
                <div className={`text-lg font-black ${m.color}`}>{m.value}</div>
                <div className="text-xs text-slate-400 leading-tight">{m.unit}</div>
                <div className="text-xs text-slate-500 mt-0.5">{m.label}</div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <div className="text-xs font-bold text-amber-400 mb-1">📊 {GOAL_STRATEGY_LABEL[goal] || 'Your Strategy'}:</div>
            <p className="text-xs text-slate-300 leading-relaxed">{goalAdvice}</p>
          </div>
        </div>

        {/* Tabs */}
        {/* Scrollable tab row — no negative margin that could cause overflow */}
        <div className="mb-5 overflow-hidden">
          <div className="overflow-x-auto scrollbar-none">
            <div className="flex gap-1 p-1 bg-slate-800 rounded-xl border border-slate-700 w-max min-w-full">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all touch-manipulation ${
                    activeTab === tab.key
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── MEAL PLAN TAB ── */}
        {activeTab === 'plan' && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <Info size={12} />
              Tap each meal to expand food items, macros, and alternatives
            </div>
            {Object.values(mealPlan).map((meal) => (
              <MealSection key={meal.label} meal={meal} />
            ))}

            {/* Shopping list suggestion */}
            <div className="card p-5 mt-2">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-400" />
                Weekly Grocery Essentials
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { cat: '🥩 Proteins', items: ['Chicken breast (1–1.5kg)', 'Eggs (2 dozen)', 'Tuna cans (4–6)', 'Paneer (500g)', 'Soya chunks (500g)'] },
                  { cat: '🍚 Carbs', items: ['Basmati/Brown rice (2kg)', 'Whole wheat atta (2kg)', 'Oats (1kg)', 'Sweet potatoes (1kg)', 'Banana (1 dozen)'] },
                  { cat: '🥛 Dairy', items: ['Full fat milk (3–4L)', 'Dahi/Curd (500g)', 'Greek yogurt (4 packs)', 'Ghee (200g)'] },
                  { cat: '🥗 Produce', items: ['Broccoli / Spinach', 'Tomatoes, cucumbers', 'Mixed vegetables', 'Dates (500g)', 'Almonds + Walnuts (500g each)'] },
                ].map((g) => (
                  <div key={g.cat} className="p-3 bg-slate-700/30 rounded-xl">
                    <div className="font-semibold text-sm text-white mb-2">{g.cat}</div>
                    {g.items.map((item, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-slate-300 mb-1">
                        <Check size={11} className="text-emerald-400 shrink-0 mt-0.5" />
                        {item}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TIMING TAB ── */}
        {activeTab === 'timing' && (
          <div className="animate-fade-in space-y-3">
            <div className="card p-4">
              <h3 className="font-bold text-white mb-1">Optimal Meal Timing for Muscle Growth</h3>
              <p className="text-xs text-slate-400 mb-4">Based on your gym schedule (evening workout assumed)</p>
              <div className="space-y-3">
                {tipsData.timing.map((t, i) => (
                  <div key={i} className={`flex gap-4 p-3 rounded-xl border ${t.meal === '🏋️ GYM' ? 'bg-indigo-600/15 border-indigo-500/40' : 'bg-slate-700/20 border-slate-700/30'}`}>
                    <div className="w-20 shrink-0">
                      <div className={`text-xs font-black ${t.meal === '🏋️ GYM' ? 'text-indigo-400' : 'text-amber-400'}`}>{t.time}</div>
                    </div>
                    <div className="flex-1">
                      <div className={`text-sm font-bold ${t.meal === '🏋️ GYM' ? 'text-indigo-300' : 'text-white'}`}>{t.meal}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{t.foods}</div>
                      <div className="text-xs text-slate-500 mt-1 italic">{t.note}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key timing rules */}
            <div className="card p-4">
              <h3 className="font-bold text-white mb-3">⚡ Non-Negotiable Timing Rules</h3>
              <div className="space-y-2.5">
                {[
                  { rule: 'Eat within 60 min of waking up', reason: 'Ends overnight fast, kickstarts metabolism' },
                  { rule: 'Pre-workout meal 45–90 min before training', reason: 'Ensures energy availability during session' },
                  { rule: 'Post-workout nutrition within 30 min', reason: 'Maximises muscle protein synthesis window' },
                  { rule: 'Protein every 3–4 hours', reason: 'Keeps amino acid levels elevated (anabolic)' },
                  { rule: 'Slow-digesting protein before bed', reason: 'Casein/paneer feeds muscles for 6–8 hours' },
                  { rule: 'Avoid large meals within 2 hours of sleep', reason: 'Poor sleep quality disrupts GH release' },
                ].map((r, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-5 h-5 bg-emerald-600/30 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={11} className="text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{r.rule}</div>
                      <div className="text-xs text-slate-400">{r.reason}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TIPS TABS ── */}
        {['nutrition', 'training', 'recovery'].includes(activeTab) && (
          <div className="space-y-3 animate-fade-in">
            {tipsData[activeTab].map((tip, i) => (
              <TipCard key={i} tip={tip} />
            ))}
          </div>
        )}

        {/* ── SUPPLEMENTS TAB ── */}
        {activeTab === 'supplements' && (
          <div className="animate-fade-in space-y-3">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 mb-2">
              ⚠️ Food first, supplements second. No supplement replaces a proper diet and consistent training.
            </div>
            {tipsData.supplements.map((tip, i) => (
              <TipCard key={i} tip={tip} />
            ))}

            {/* Priority order */}
            <div className="card p-4">
              <h3 className="font-bold text-white mb-3">Priority Order (Budget Guide)</h3>
              <div className="space-y-2">
                {[
                  { rank: 1, name: 'Creatine Monohydrate', cost: '₹400–800/month', note: 'Best ROI in bodybuilding' },
                  { rank: 2, name: 'Whey Protein', cost: '₹1500–3000/month', note: 'Convenient protein source' },
                  { rank: 3, name: 'Vitamin D3 + K2', cost: '₹200–400/month', note: 'Most Indians are deficient' },
                  { rank: 4, name: 'Omega-3 Fish Oil', cost: '₹400–800/month', note: 'Recovery + brain health' },
                  { rank: 5, name: 'Zinc + Magnesium (ZMA)', cost: '₹300–500/month', note: 'Testosterone + sleep' },
                  { rank: 6, name: 'BCAA (optional)', cost: '₹500–1000/month', note: 'Only if training fasted' },
                ].map((s) => (
                  <div key={s.rank} className="flex items-center gap-3 p-2.5 bg-slate-700/20 rounded-lg">
                    <div className="w-7 h-7 bg-indigo-600/30 rounded-full flex items-center justify-center text-xs font-black text-indigo-300 shrink-0">
                      {s.rank}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-white">{s.name}</div>
                      <div className="text-xs text-slate-400">{s.note}</div>
                    </div>
                    <div className="text-xs font-bold text-emerald-400">{s.cost}</div>
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
