import { Droplets, Plus, Minus, RotateCcw } from 'lucide-react';

const QUICK_ADD = [150, 250, 350, 500];

export default function WaterTracker({ waterMl, goalMl, onUpdate }) {
  const pct = Math.min((waterMl / goalMl) * 100, 100);
  const glasses = Math.floor(waterMl / 250);
  const remaining = Math.max(0, goalMl - waterMl);

  const add = (ml) => onUpdate(Math.min(waterMl + ml, goalMl + 500));
  const remove = (ml) => onUpdate(Math.max(0, waterMl - ml));

  // Wave fill style
  const waveColor =
    pct >= 100 ? '#10b981' :
    pct >= 75  ? '#06b6d4' :
    pct >= 50  ? '#3b82f6' :
    pct >= 25  ? '#6366f1' : '#94a3b8';

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600/20 rounded-xl flex items-center justify-center">
            <Droplets size={16} className="text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Water Intake</h3>
            <p className="text-xs text-slate-400">Daily hydration tracker</p>
          </div>
        </div>
        <button
          onClick={() => onUpdate(0)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="Reset"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Visual Progress */}
      <div className="flex items-center gap-5 mb-4">
        {/* Bottle visual */}
        <div className="relative w-16 shrink-0">
          <svg viewBox="0 0 64 120" className="w-full drop-shadow-lg">
            {/* Bottle outline */}
            <path
              d="M22 10 L20 22 Q12 26 12 36 L12 104 Q12 112 20 112 L44 112 Q52 112 52 104 L52 36 Q52 26 44 22 L42 10 Z"
              fill="none"
              stroke="rgba(99,102,241,0.4)"
              strokeWidth="2"
            />
            {/* Fill (clipped to bottle) */}
            <clipPath id="bottleClip">
              <path d="M22 10 L20 22 Q12 26 12 36 L12 104 Q12 112 20 112 L44 112 Q52 112 52 104 L52 36 Q52 26 44 22 L42 10 Z" />
            </clipPath>
            {/* Background */}
            <rect x="0" y="0" width="64" height="120" fill="rgba(30,41,59,0.8)" clipPath="url(#bottleClip)" />
            {/* Water fill */}
            <rect
              x="0"
              y={120 - (120 * pct / 100)}
              width="64"
              height={120 * pct / 100}
              fill={waveColor}
              opacity="0.85"
              clipPath="url(#bottleClip)"
              style={{ transition: 'y 0.6s ease, height 0.6s ease' }}
            />
            {/* Shine */}
            <path
              d="M18 40 Q16 60 18 80"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              clipPath="url(#bottleClip)"
            />
            {/* Cap */}
            <rect x="24" y="4" width="16" height="10" rx="3" fill="rgba(99,102,241,0.6)" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ top: '30%' }}>
            <span className="text-xs font-black text-white drop-shadow">{pct.toFixed(0)}%</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-3">
          <div>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-3xl font-black" style={{ color: waveColor }}>
                {waterMl >= 1000 ? (waterMl / 1000).toFixed(1) : waterMl}
              </span>
              <span className="text-slate-400 text-sm mb-0.5">{waterMl >= 1000 ? 'L' : 'ml'}</span>
              <span className="text-slate-500 text-sm mb-0.5">/ {goalMl >= 1000 ? `${goalMl / 1000}L` : `${goalMl}ml`}</span>
            </div>
            <div className="progress-bar h-2.5">
              <div
                className="progress-fill transition-all duration-700"
                style={{ width: `${pct}%`, background: `linear-gradient(90deg, #6366f1, ${waveColor})` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-slate-700/40 rounded-lg text-center">
              <div className="text-base font-bold text-white">{glasses}</div>
              <div className="text-xs text-slate-400">glasses</div>
            </div>
            <div className="p-2 bg-slate-700/40 rounded-lg text-center">
              <div className="text-base font-bold text-amber-400">
                {remaining >= 1000 ? `${(remaining / 1000).toFixed(1)}L` : `${remaining}ml`}
              </div>
              <div className="text-xs text-slate-400">remaining</div>
            </div>
          </div>

          {pct >= 100 && (
            <div className="text-center text-xs font-bold text-emerald-400 bg-emerald-500/10 rounded-lg py-1.5 border border-emerald-500/20">
              🎉 Daily goal reached!
            </div>
          )}
        </div>
      </div>

      {/* Quick-Add Buttons */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {QUICK_ADD.map((ml) => (
          <button
            key={ml}
            onClick={() => add(ml)}
            className="py-3 rounded-xl bg-blue-600/15 active:bg-blue-600/30 hover:bg-blue-600/25 border border-blue-500/20 active:border-blue-500/60 text-blue-400 text-xs font-bold transition-all active:scale-95 touch-manipulation min-h-[44px]"
          >
            +{ml < 1000 ? `${ml}ml` : `${ml/1000}L`}
          </button>
        ))}
      </div>

      {/* Fine Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => remove(100)}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-700/50 active:bg-slate-700 text-slate-400 active:text-white text-xs font-medium transition-all touch-manipulation min-h-[44px]"
        >
          <Minus size={13} /> 100ml
        </button>
        <div className="flex-1 text-center">
          <span className="text-xs text-slate-500">
            {pct < 50 ? '💧 Keep drinking!' : pct < 75 ? '💧💧 Good progress!' : pct < 100 ? '💧💧💧 Almost there!' : '✅ Hydrated!'}
          </span>
        </div>
        <button
          onClick={() => add(100)}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-blue-600/15 active:bg-blue-600/30 border border-blue-500/20 text-blue-400 text-xs font-semibold transition-all touch-manipulation min-h-[44px]"
        >
          <Plus size={13} /> 100ml
        </button>
      </div>
    </div>
  );
}
