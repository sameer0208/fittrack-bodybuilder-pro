import { useState } from 'react';
import { Play, ChevronDown, ChevronUp, Info, CheckCircle2, Circle } from 'lucide-react';
import VideoModal from './VideoModal';

const difficultyColors = {
  beginner:     'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  intermediate: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  advanced:     'bg-red-500/20 text-red-400 border-red-500/30',
};

const categoryColors = {
  compound:  'bg-purple-500/20 text-purple-400 border-purple-500/30',
  isolation: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  mobility:  'bg-teal-500/20 text-teal-400 border-teal-500/30',
  cardio:    'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

// Stepper component for weight/reps on mobile
function Stepper({ value, onChange, step = 1, min = 0, suffix = '', placeholder = '0' }) {
  const numVal = parseFloat(value) || 0;
  return (
    <div className="flex items-center gap-1.5">
      <button
        onPointerDown={(e) => { e.preventDefault(); onChange(String(Math.max(min, numVal - step))); }}
        className="w-8 h-9 bg-slate-700/80 rounded-lg text-slate-300 active:bg-slate-600 active:text-white flex items-center justify-center text-lg font-bold touch-manipulation shrink-0 select-none"
      >
        −
      </button>
      <div className="relative flex-1">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-slate-800 border border-slate-600/60 rounded-lg h-9 text-white text-center text-sm font-bold focus:outline-none focus:border-indigo-500 transition-colors pr-5"
        />
        {suffix && (
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 pointer-events-none font-medium">
            {suffix}
          </span>
        )}
      </div>
      <button
        onPointerDown={(e) => { e.preventDefault(); onChange(String(numVal + step)); }}
        className="w-8 h-9 bg-slate-700/80 rounded-lg text-slate-300 active:bg-slate-600 active:text-white flex items-center justify-center text-lg font-bold touch-manipulation shrink-0 select-none"
      >
        +
      </button>
    </div>
  );
}

export default function ExerciseCard({ exercise, index, setLogs }) {
  const [showVideo, setShowVideo] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState('log'); // 'log' | 'instructions'
  const [localSets, setLocalSets] = useState(
    Array.from({ length: exercise.sets }, (_, i) => ({
      setNumber: i + 1,
      weight: '',
      reps: '',
      completed: false,
    }))
  );

  const allCompleted = localSets.every((s) => s.completed);
  const completedCount = localSets.filter((s) => s.completed).length;

  const updateSet = (idx, field, value) => {
    const updated = localSets.map((s, i) =>
      i === idx ? { ...s, [field]: value } : s
    );
    setLocalSets(updated);
    if (setLogs) setLogs(exercise.id, updated);
  };

  const toggleSetComplete = (idx) => {
    const updated = localSets.map((s, i) =>
      i === idx ? { ...s, completed: !s.completed } : s
    );
    setLocalSets(updated);
    if (setLogs) setLogs(exercise.id, updated);
  };

  return (
    <>
      <div className={`card overflow-hidden transition-all duration-300 ${
        allCompleted ? 'border-emerald-500/50 bg-emerald-950/20' : ''
      }`}>
        {/* ── Card Header ───────────────────────────── */}
        <div className="flex gap-3 p-4">
          {/* Exercise Number */}
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 mt-0.5 ${
            allCompleted ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'
          }`}>
            {allCompleted ? <CheckCircle2 size={16} /> : index + 1}
          </div>

          {/* Exercise Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className={`font-bold text-base leading-tight ${allCompleted ? 'text-emerald-400' : 'text-white'}`}>
                  {exercise.name}
                </h3>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  <span className={`badge border text-[10px] py-0.5 ${difficultyColors[exercise.difficulty]}`}>
                    {exercise.difficulty}
                  </span>
                  <span className={`badge border text-[10px] py-0.5 ${categoryColors[exercise.category]}`}>
                    {exercise.category}
                  </span>
                  {exercise.primaryMuscles?.slice(0, 1).map((m) => (
                    <span key={m} className="muscle-tag text-[10px] py-0.5">{m}</span>
                  ))}
                </div>
              </div>

              {/* Thumb Image */}
              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-slate-700 border border-slate-600/50">
                <img
                  src={exercise.image}
                  alt={exercise.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = `https://placehold.co/56x56/1e293b/6366f1?text=${exercise.id.slice(0, 2).toUpperCase()}`;
                  }}
                />
              </div>
            </div>

            {/* Sets / Reps / Rest */}
            <div className="flex items-center gap-3 mt-2.5 text-sm">
              <span className="text-white font-bold">{exercise.sets}</span>
              <span className="text-slate-400 text-xs">sets</span>
              <span className="text-slate-600">·</span>
              <span className="text-white font-bold">{exercise.reps}</span>
              <span className="text-slate-400 text-xs">reps</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400 text-xs">Rest {exercise.rest}</span>
            </div>

            {/* Progress */}
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-slate-500">{completedCount}/{exercise.sets} sets</span>
              </div>
              <div className="progress-bar h-1.5">
                <div
                  className="progress-fill bg-gradient-to-r from-indigo-500 to-emerald-500"
                  style={{ width: `${(completedCount / exercise.sets) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Action Buttons ───────────────────────── */}
        <div className="px-4 pb-3 flex items-center gap-2">
          <button
            onClick={() => setShowVideo(true)}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-red-600/20 active:bg-red-600/40 text-red-400 rounded-xl text-xs font-semibold transition-colors border border-red-500/30 min-h-[40px] touch-manipulation"
          >
            <Play size={11} fill="currentColor" />
            Demo
          </button>
          <button
            onClick={() => { setExpanded(!expanded); setActiveSection('instructions'); }}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-700/50 active:bg-slate-700 text-slate-400 active:text-white rounded-xl text-xs font-medium transition-colors min-h-[40px] touch-manipulation"
          >
            <Info size={11} />
            Form
          </button>
          <button
            onClick={() => { setExpanded(!expanded || activeSection !== 'log'); setActiveSection('log'); }}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-indigo-600/20 active:bg-indigo-600/40 text-indigo-400 rounded-xl text-xs font-semibold transition-colors border border-indigo-500/30 ml-auto min-h-[40px] touch-manipulation"
          >
            Log Sets
            {expanded && activeSection === 'log' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>

        {/* ── Expanded Section ─────────────────────── */}
        {expanded && (
          <div className="border-t border-slate-700/50 animate-fade-in">
            {/* Instructions */}
            {activeSection === 'instructions' && (
              <div className="p-4 bg-slate-900/40">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Info size={12} /> Proper Form
                </h4>
                <ol className="space-y-2.5">
                  {exercise.instructions?.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="w-5 h-5 bg-indigo-600/30 text-indigo-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-slate-300 leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
                {exercise.tips && (
                  <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <span className="text-xs font-bold text-amber-400">💡 Pro Tip: </span>
                    <span className="text-xs text-amber-200/80">{exercise.tips}</span>
                  </div>
                )}
                <button
                  onClick={() => setActiveSection('log')}
                  className="mt-4 w-full py-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 text-xs font-semibold touch-manipulation"
                >
                  → Log Sets
                </button>
              </div>
            )}

            {/* Set Logging — mobile-optimised stepper UI */}
            {activeSection === 'log' && (
              <div className="p-4">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Log Your Sets
                </h4>

                {/* Column headers */}
                <div className="flex items-center gap-2 mb-2 px-0.5">
                  <div className="w-14 shrink-0" />
                  <div className="flex-1 text-center text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Weight</div>
                  <div className="w-5 shrink-0" />
                  <div className="flex-1 text-center text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Reps</div>
                  <div className="w-11 shrink-0" />
                </div>

                <div className="space-y-2.5">
                  {localSets.map((set, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all duration-200 ${
                        set.completed
                          ? 'bg-emerald-950/40 border-emerald-500/40'
                          : 'bg-slate-700/25 border-slate-600/30'
                      }`}
                    >
                      {/* Set label */}
                      <span className={`text-xs font-bold w-12 shrink-0 ${set.completed ? 'text-emerald-400' : 'text-slate-500'}`}>
                        Set {idx + 1}
                      </span>

                      {/* Weight stepper */}
                      <div className="flex-1">
                        <Stepper
                          value={set.weight}
                          onChange={(v) => updateSet(idx, 'weight', v)}
                          step={2.5}
                          min={0}
                          suffix="kg"
                        />
                      </div>

                      <span className="text-slate-600 text-sm font-bold shrink-0">×</span>

                      {/* Reps stepper */}
                      <div className="flex-1">
                        <Stepper
                          value={set.reps}
                          onChange={(v) => updateSet(idx, 'reps', v)}
                          step={1}
                          min={0}
                          suffix="rp"
                        />
                      </div>

                      {/* Complete button */}
                      <button
                        onPointerDown={(e) => { e.preventDefault(); toggleSetComplete(idx); }}
                        className={`w-11 h-9 rounded-xl flex items-center justify-center transition-all duration-200 touch-manipulation shrink-0 border ${
                          set.completed
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : 'bg-slate-700 border-slate-600 text-slate-400 active:bg-slate-600'
                        }`}
                      >
                        {set.completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                      </button>
                    </div>
                  ))}
                </div>

                {completedCount > 0 && (
                  <div className="mt-3 p-2.5 bg-slate-700/20 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-slate-400">Total volume this exercise</span>
                    <span className="font-bold text-indigo-400">
                      {localSets.reduce((sum, s) => {
                        if (s.completed && s.weight && s.reps) return sum + parseFloat(s.weight) * parseInt(s.reps);
                        return sum;
                      }, 0).toFixed(0)} kg
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showVideo && <VideoModal exercise={exercise} onClose={() => setShowVideo(false)} />}
    </>
  );
}
