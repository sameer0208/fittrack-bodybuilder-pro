import { Activity } from 'lucide-react';

const bmiCategories = [
  { label: 'Underweight', range: [0, 18.5], color: 'text-blue-400' },
  { label: 'Normal', range: [18.5, 25], color: 'text-emerald-400' },
  { label: 'Overweight', range: [25, 30], color: 'text-amber-400' },
  { label: 'Obese', range: [30, 100], color: 'text-red-400' },
];

export default function BMICard({ user }) {
  const bmi = parseFloat(user?.bmi || 0);
  const category = bmiCategories.find((c) => bmi >= c.range[0] && bmi < c.range[1]);
  const bmiPercent = Math.min(Math.max(((bmi - 15) / (40 - 15)) * 100, 0), 100);

  const weightToGo = user?.targetWeight && user?.currentWeight
    ? Math.abs(user.targetWeight - user.currentWeight).toFixed(1)
    : null;

  const isGaining = user?.targetWeight > user?.currentWeight;

  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 bg-indigo-600/20 rounded-xl flex items-center justify-center">
          <Activity size={18} className="text-indigo-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white text-sm">Body Stats</h3>
          <p className="text-xs text-slate-400">BMI & Progress Overview</p>
        </div>
      </div>

      {/* BMI Display */}
      <div className="flex items-end gap-2 mb-3">
        <span className="text-4xl font-black text-white">{bmi || '--'}</span>
        <span className="text-sm text-slate-400 mb-1">BMI</span>
        {category && (
          <span className={`text-sm font-semibold mb-1 ${category.color}`}>· {category.label}</span>
        )}
      </div>

      {/* BMI Scale */}
      <div className="relative mb-4">
        <div className="h-2 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 via-emerald-500 via-amber-500 to-red-500">
        </div>
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-slate-800 shadow-lg transition-all duration-700"
          style={{ left: `calc(${bmiPercent}% - 6px)` }}
        />
        <div className="flex justify-between mt-1 text-xs text-slate-500">
          <span>15</span>
          <span>18.5</span>
          <span>25</span>
          <span>30</span>
          <span>40+</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="text-center p-2.5 bg-slate-700/40 rounded-xl">
          <div className="text-lg font-bold text-white">{user?.currentWeight || '--'}</div>
          <div className="text-xs text-slate-400 mt-0.5">Current (kg)</div>
        </div>
        <div className="text-center p-2.5 bg-slate-700/40 rounded-xl">
          <div className="text-lg font-bold text-indigo-400">{user?.targetWeight || '--'}</div>
          <div className="text-xs text-slate-400 mt-0.5">Target (kg)</div>
        </div>
        <div className="text-center p-2.5 bg-slate-700/40 rounded-xl">
          <div className="text-lg font-bold text-emerald-400">{weightToGo ? `+${weightToGo}` : '--'}</div>
          <div className="text-xs text-slate-400 mt-0.5">{isGaining ? 'To Gain' : 'To Lose'}</div>
        </div>
      </div>

      {/* Nutrition Targets */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="p-3 bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-xl">
          <div className="text-xl font-bold text-orange-400">{user?.dailyCalories || '--'}</div>
          <div className="text-xs text-slate-400 mt-0.5">🔥 Daily Calories</div>
          <div className="text-xs text-orange-300/60 mt-1">Bulk surplus +500</div>
        </div>
        <div className="p-3 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-xl">
          <div className="text-xl font-bold text-blue-400">{user?.proteinTarget || '--'}g</div>
          <div className="text-xs text-slate-400 mt-0.5">💪 Daily Protein</div>
          <div className="text-xs text-blue-300/60 mt-1">2.2g per kg bodyweight</div>
        </div>
      </div>
    </div>
  );
}
