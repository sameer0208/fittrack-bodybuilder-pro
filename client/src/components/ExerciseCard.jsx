import { useState } from 'react';
import { Play, ChevronDown, ChevronUp, Info, CheckCircle2, Circle } from 'lucide-react';
import VideoModal from './VideoModal';

const difficultyColors = {
  beginner:     'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  intermediate: 'bg-amber-500/20  text-amber-400  border-amber-500/30',
  advanced:     'bg-red-500/20    text-red-400    border-red-500/30',
};

const categoryColors = {
  compound:  'bg-purple-500/20 text-purple-400 border-purple-500/30',
  isolation: 'bg-blue-500/20   text-blue-400   border-blue-500/30',
  mobility:  'bg-teal-500/20   text-teal-400   border-teal-500/30',
  cardio:    'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

// ── Stepper ─────────────────────────────────────────────────────────────────
// Clean +/− stepper without an inline suffix label — the parent adds the label
// above the stepper instead so there's maximum room for the value display.
function Stepper({ value, onChange, step = 1, min = 0, highlight = false }) {
  const numVal = parseFloat(value) || 0;
  return (
    <div className="flex items-center gap-1.5">
      {/* Minus */}
      <button
        onPointerDown={(e) => {
          e.preventDefault();
          onChange(String(Math.max(min, numVal - step)));
        }}
        className="w-10 h-11 bg-slate-700 border border-slate-600/60 rounded-xl text-slate-200 active:bg-indigo-600 active:border-indigo-500 active:text-white flex items-center justify-center text-xl font-bold touch-manipulation shrink-0 select-none transition-colors"
      >
        −
      </button>

      {/* Value input */}
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className={`flex-1 min-w-0 h-11 rounded-xl text-center text-base font-bold text-white focus:outline-none transition-colors bg-slate-800 border ${
          highlight
            ? 'border-amber-400/60 focus:border-amber-400'
            : 'border-slate-600/60 focus:border-indigo-500'
        }`}
      />

      {/* Plus */}
      <button
        onPointerDown={(e) => {
          e.preventDefault();
          onChange(String(numVal + step));
        }}
        className="w-10 h-11 bg-slate-700 border border-slate-600/60 rounded-xl text-slate-200 active:bg-indigo-600 active:border-indigo-500 active:text-white flex items-center justify-center text-xl font-bold touch-manipulation shrink-0 select-none transition-colors"
      >
        +
      </button>
    </div>
  );
}

// ── ExerciseCard ─────────────────────────────────────────────────────────────
export default function ExerciseCard({ exercise, index, setLogs }) {
  const [showVideo,      setShowVideo]      = useState(false);
  const [expanded,       setExpanded]       = useState(false);
  const [activeSection,  setActiveSection]  = useState('log');
  const [warnIdx,        setWarnIdx]        = useState(null); // set index that failed validation

  const [localSets, setLocalSets] = useState(
    Array.from({ length: exercise.sets }, (_, i) => ({
      setNumber: i + 1,
      weight: '',
      reps: '',
      completed: false,
    }))
  );

  const allCompleted   = localSets.every((s) => s.completed);
  const completedCount = localSets.filter((s) => s.completed).length;

  const updateSet = (idx, field, value) => {
    const updated = localSets.map((s, i) => (i === idx ? { ...s, [field]: value } : s));
    setLocalSets(updated);
    setLogs?.(exercise.id, updated);
  };

  const toggleSetComplete = (idx) => {
    const set = localSets[idx];

    // Block completion if reps is 0 or empty
    if (!set.completed && (parseInt(set.reps, 10) || 0) === 0) {
      setWarnIdx(idx);
      setTimeout(() => setWarnIdx(null), 2000);
      return;
    }

    const updated = localSets.map((s, i) =>
      i === idx ? { ...s, completed: !s.completed } : s
    );
    setLocalSets(updated);
    setLogs?.(exercise.id, updated);
    if (warnIdx === idx) setWarnIdx(null);
  };

  return (
    <>
      <div
        className={`card overflow-hidden transition-all duration-300 ${
          allCompleted ? 'border-emerald-500/50 bg-emerald-950/20' : ''
        }`}
      >
        {/* ── Card Header ───────────────────────────────────── */}
        <div className="flex gap-3 p-4">
          {/* Exercise number badge */}
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 mt-0.5 ${
              allCompleted ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'
            }`}
          >
            {allCompleted ? <CheckCircle2 size={16} /> : index + 1}
          </div>

          {/* Name + badges + image */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3
                  className={`font-bold text-base leading-tight ${
                    allCompleted ? 'text-emerald-400' : 'text-white'
                  }`}
                >
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

              {/* Thumbnail */}
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

            {/* Progress bar */}
            <div className="mt-2">
              <span className="text-[10px] text-slate-500">{completedCount}/{exercise.sets} sets done</span>
              <div className="progress-bar h-1.5 mt-1">
                <div
                  className="progress-fill bg-gradient-to-r from-indigo-500 to-emerald-500"
                  style={{ width: `${(completedCount / exercise.sets) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Action Buttons ─────────────────────────────────── */}
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
            onClick={() => {
              setExpanded(!expanded || activeSection !== 'log');
              setActiveSection('log');
            }}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-indigo-600/20 active:bg-indigo-600/40 text-indigo-400 rounded-xl text-xs font-semibold transition-colors border border-indigo-500/30 ml-auto min-h-[40px] touch-manipulation"
          >
            Log Sets
            {expanded && activeSection === 'log' ? (
              <ChevronUp size={12} />
            ) : (
              <ChevronDown size={12} />
            )}
          </button>
        </div>

        {/* ── Expanded Section ───────────────────────────────── */}
        {expanded && (
          <div className="border-t border-slate-700/50 animate-fade-in">

            {/* Instructions tab */}
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

            {/* Set logging tab */}
            {activeSection === 'log' && (
              <div className="p-4 space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Log Your Sets
                </h4>

                {localSets.map((set, idx) => {
                  const hasReps     = (parseInt(set.reps, 10) || 0) > 0;
                  const isWarn      = warnIdx === idx;
                  const canComplete = set.completed || hasReps;

                  return (
                    <div
                      key={idx}
                      className={`rounded-2xl border overflow-hidden transition-all duration-200 ${
                        set.completed
                          ? 'border-emerald-500/50 bg-emerald-950/30'
                          : isWarn
                          ? 'border-amber-400/50 bg-amber-950/20'
                          : 'border-slate-600/40 bg-slate-700/20'
                      }`}
                    >
                      {/* ── Set header row ── */}
                      <div
                        className={`flex items-center justify-between px-4 py-2.5 ${
                          set.completed ? 'bg-emerald-900/30' : 'bg-slate-700/30'
                        }`}
                      >
                        <span
                          className={`text-sm font-bold ${
                            set.completed ? 'text-emerald-300' : 'text-slate-300'
                          }`}
                        >
                          Set {idx + 1}
                          {set.completed && set.weight && set.reps && (
                            <span className="ml-2 text-[11px] font-normal text-emerald-500">
                              {set.weight} kg × {set.reps} reps
                            </span>
                          )}
                        </span>

                        {/* Mark Done / Done button */}
                        <button
                          onPointerDown={(e) => { e.preventDefault(); toggleSetComplete(idx); }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all touch-manipulation border ${
                            set.completed
                              ? 'bg-emerald-600 border-emerald-500 text-white active:bg-emerald-700'
                              : canComplete
                              ? 'bg-slate-700 border-slate-500 text-slate-200 active:bg-emerald-700 active:border-emerald-500 active:text-white'
                              : 'bg-slate-800/60 border-slate-700 text-slate-600 cursor-not-allowed'
                          }`}
                        >
                          {set.completed ? (
                            <><CheckCircle2 size={12} /> Done</>
                          ) : (
                            <><Circle size={12} /> Mark Done</>
                          )}
                        </button>
                      </div>

                      {/* ── Weight + Reps inputs ── */}
                      <div className="grid grid-cols-2 gap-3 px-4 py-3">
                        {/* Weight */}
                        <div>
                          <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5">
                            Weight (kg)
                          </div>
                          <Stepper
                            value={set.weight}
                            onChange={(v) => updateSet(idx, 'weight', v)}
                            step={2.5}
                            min={0}
                          />
                        </div>

                        {/* Reps */}
                        <div>
                          <div className={`text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${isWarn ? 'text-amber-400' : 'text-slate-500'}`}>
                            Reps {isWarn && '⚠ required'}
                          </div>
                          <Stepper
                            value={set.reps}
                            onChange={(v) => {
                              updateSet(idx, 'reps', v);
                              if (warnIdx === idx) setWarnIdx(null);
                            }}
                            step={1}
                            min={0}
                            highlight={isWarn}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Volume summary */}
                {completedCount > 0 && (
                  <div className="p-3 bg-slate-700/20 rounded-xl flex items-center justify-between text-xs border border-slate-600/30">
                    <span className="text-slate-400">Volume this exercise</span>
                    <span className="font-bold text-indigo-400">
                      {localSets
                        .reduce((sum, s) => {
                          if (s.completed && s.weight && s.reps)
                            return sum + parseFloat(s.weight) * parseInt(s.reps, 10);
                          return sum;
                        }, 0)
                        .toFixed(0)}{' '}
                      kg
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
