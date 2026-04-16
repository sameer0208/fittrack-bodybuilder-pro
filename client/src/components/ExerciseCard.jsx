import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, ChevronDown, ChevronUp, Info, CheckCircle2, Circle, Timer, X, Plus, Minus, Dumbbell } from 'lucide-react';
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

function Stepper({ value, onChange, step = 1, min = 0, highlight = false }) {
  const numVal = parseFloat(value) || 0;
  return (
    <div className="flex items-center gap-1.5">
      <button
        onPointerDown={(e) => {
          e.preventDefault();
          onChange(String(Math.max(min, numVal - step)));
        }}
        className="w-10 h-11 bg-slate-700 border border-slate-600/60 rounded-xl text-slate-200 active:bg-indigo-600 active:border-indigo-500 active:text-white flex items-center justify-center text-xl font-bold touch-manipulation shrink-0 select-none transition-colors"
      >
        −
      </button>
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

// ── Rest Timer ──────────────────────────────────────────────────────────────
const REST_OPTIONS = [30, 60, 90, 120, 180];

let _audioCtx = null;
function getAudioCtx() {
  if (!_audioCtx || _audioCtx.state === 'closed') {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}

function playBeep() {
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    const notes = [
      { freq: 880,  start: 0,    end: 0.15 },
      { freq: 1100, start: 0.25, end: 0.40 },
      { freq: 880,  start: 0.55, end: 0.70 },
      { freq: 1100, start: 0.85, end: 1.00 },
      { freq: 1320, start: 1.15, end: 1.35 },
      { freq: 880,  start: 1.55, end: 1.70 },
      { freq: 1100, start: 1.85, end: 2.00 },
      { freq: 1320, start: 2.15, end: 2.35 },
      { freq: 1760, start: 2.50, end: 3.00 },
    ];
    for (const n of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = n.freq;
      gain.gain.setValueAtTime(0.25, now + n.start);
      gain.gain.linearRampToValueAtTime(0, now + n.end);
      osc.start(now + n.start);
      osc.stop(now + n.end + 0.05);
    }
  } catch {}
}

function RestTimer({ defaultSeconds, onDismiss }) {
  const [duration, setDuration] = useState(defaultSeconds || 90);
  const [remaining, setRemaining] = useState(defaultSeconds || 90);
  const [running, setRunning] = useState(true);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!running || finished) return;
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setFinished(true);
          setRunning(false);
          playBeep();
          try { navigator.vibrate?.([200, 100, 200, 100, 300]); } catch {}
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, finished]);

  const pct = duration > 0 ? ((duration - remaining) / duration) * 100 : 100;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  const changeDuration = useCallback((newDur) => {
    setDuration(newDur);
    setRemaining(newDur);
    setRunning(true);
    setFinished(false);
  }, []);

  const reset = () => { setRemaining(duration); setRunning(true); setFinished(false); };

  return (
    <div className={`rounded-xl border p-3 transition-all ${
      finished
        ? 'bg-emerald-950/40 border-emerald-500/50 animate-pulse'
        : 'bg-indigo-950/30 border-indigo-500/30'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Timer size={14} className={finished ? 'text-emerald-400' : 'text-indigo-400'} />
          <span className={`text-xs font-bold uppercase tracking-wider ${finished ? 'text-emerald-400' : 'text-indigo-400'}`}>
            {finished ? 'Rest Complete — Go!' : 'Rest Timer'}
          </span>
        </div>
        <button onClick={onDismiss} className="text-slate-500 hover:text-white p-1 touch-manipulation">
          <X size={14} />
        </button>
      </div>

      <div className="flex items-center gap-3 mb-2">
        <div className={`text-3xl font-black font-mono ${finished ? 'text-emerald-400' : 'text-white'}`}>
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </div>
        <div className="flex-1">
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${finished ? 'bg-emerald-500' : 'bg-indigo-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <button
          onClick={() => { if (finished) reset(); else setRunning((r) => !r); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold touch-manipulation border ${
            finished
              ? 'bg-emerald-600 border-emerald-500 text-white active:bg-emerald-700'
              : running
              ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
              : 'bg-indigo-600/20 border-indigo-500/30 text-indigo-400'
          }`}
        >
          {finished ? 'Restart' : running ? 'Pause' : 'Resume'}
        </button>
      </div>

      <div className="flex gap-1.5">
        {REST_OPTIONS.map((sec) => (
          <button
            key={sec}
            onClick={() => changeDuration(sec)}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all touch-manipulation ${
              duration === sec
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-700/60 text-slate-400 active:bg-slate-600'
            }`}
          >
            {sec >= 60 ? `${sec / 60}m` : `${sec}s`}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── ExerciseCard ─────────────────────────────────────────────────────────────
export default function ExerciseCard({ exercise, index, setLogs, savedSets }) {
  const [showVideo,      setShowVideo]      = useState(false);
  const [expanded,       setExpanded]       = useState(false);
  const [activeSection,  setActiveSection]  = useState('log');
  const [warnIdx,        setWarnIdx]        = useState(null);
  const [showRest,       setShowRest]       = useState(false);
  const [imgError,       setImgError]       = useState(false);

  const defaultRestSec = (() => {
    const raw = exercise.rest || '';
    const nums = raw.match(/\d+/g)?.map(Number) || [];
    if (nums.length === 0) return 90;
    const isMin = /min/i.test(raw);
    const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
    return Math.round(isMin ? avg * 60 : avg);
  })();

  const buildDefaultSets = () =>
    Array.from({ length: exercise.sets || 3 }, (_, i) => ({
      setNumber: i + 1,
      weight: '',
      reps: '',
      completed: false,
    }));

  const normalizeSaved = (sets) =>
    sets.map((s, i) => ({
      setNumber: s.setNumber ?? i + 1,
      weight: s.weight != null && s.weight !== 0 ? String(s.weight) : '',
      reps: s.reps != null && s.reps !== 0 ? String(s.reps) : '',
      completed: Boolean(s.completed),
    }));

  const [localSets, setLocalSets] = useState(() => {
    if (Array.isArray(savedSets) && savedSets.length > 0) return normalizeSaved(savedSets);
    return buildDefaultSets();
  });

  // Keep track of whether we've already applied saved data
  const appliedSavedRef = useRef(false);

  // Sync initial sets to parent on mount so buildExercises() always has data
  const didSyncInit = useRef(false);
  useEffect(() => {
    if (didSyncInit.current) return;
    didSyncInit.current = true;
    setLogs?.(exercise.id, localSets);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When savedSets arrives asynchronously (after API fetch), update local state
  useEffect(() => {
    if (!Array.isArray(savedSets) || savedSets.length === 0) return;
    if (appliedSavedRef.current) return;
    const hasSavedData = savedSets.some((s) => s.weight || s.reps || s.completed);
    if (!hasSavedData) return;
    appliedSavedRef.current = true;
    const normalized = normalizeSaved(savedSets);
    setLocalSets(normalized);
    setLogs?.(exercise.id, normalized);
  }, [savedSets]); // eslint-disable-line react-hooks/exhaustive-deps

  const allCompleted   = localSets.every((s) => s.completed);
  const completedCount = localSets.filter((s) => s.completed).length;
  const totalSetCount  = localSets.length;

  const updateSet = (idx, field, value) => {
    const updated = localSets.map((s, i) => (i === idx ? { ...s, [field]: value } : s));
    setLocalSets(updated);
    setLogs?.(exercise.id, updated);
  };

  const toggleSetComplete = (idx) => {
    const set = localSets[idx];

    if (!set.completed && (parseInt(set.reps, 10) || 0) === 0) {
      setWarnIdx(idx);
      setTimeout(() => setWarnIdx(null), 2000);
      return;
    }

    const nowCompleting = !set.completed;
    const updated = localSets.map((s, i) =>
      i === idx ? { ...s, completed: !s.completed } : s
    );
    setLocalSets(updated);
    setLogs?.(exercise.id, updated);
    if (warnIdx === idx) setWarnIdx(null);

    if (nowCompleting) {
      const remaining = updated.filter((s) => !s.completed).length;
      if (remaining > 0) setShowRest(true);
    }
  };

  // ── Add / Remove extra sets ──────────────────────────────────────────────
  const addSet = () => {
    const newSet = {
      setNumber: localSets.length + 1,
      weight: localSets.length > 0 ? localSets[localSets.length - 1].weight : '',
      reps: '',
      completed: false,
    };
    const updated = [...localSets, newSet];
    setLocalSets(updated);
    setLogs?.(exercise.id, updated);
  };

  const removeLastSet = () => {
    if (localSets.length <= 1) return;
    const last = localSets[localSets.length - 1];
    if (last.completed) return;
    const updated = localSets.slice(0, -1);
    setLocalSets(updated);
    setLogs?.(exercise.id, updated);
  };

  const canRemoveSet = localSets.length > 1 && !localSets[localSets.length - 1].completed;

  return (
    <>
      <div
        className={`card overflow-hidden transition-all duration-300 ${
          allCompleted ? 'border-emerald-500/50 bg-emerald-950/20' : ''
        }`}
      >
        {/* ── Card Header ───────────────────────────────────── */}
        <div className="flex gap-3 p-4">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 mt-0.5 ${
              allCompleted ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'
            }`}
          >
            {allCompleted ? <CheckCircle2 size={16} /> : index + 1}
          </div>

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

              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-slate-700 border border-slate-600/50">
                {!imgError ? (
                  <img
                    src={exercise.image}
                    alt={exercise.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900/40 to-slate-800">
                    <Dumbbell size={20} className="text-indigo-400/60" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 mt-2.5 text-sm">
              <span className="text-white font-bold">{totalSetCount}</span>
              <span className="text-slate-400 text-xs">sets</span>
              <span className="text-slate-600">·</span>
              <span className="text-white font-bold">{exercise.reps}</span>
              <span className="text-slate-400 text-xs">reps</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400 text-xs">Rest {exercise.rest}</span>
              {totalSetCount !== exercise.sets && (
                <span className="text-amber-400/70 text-[10px] font-semibold ml-auto">
                  ({exercise.sets} default)
                </span>
              )}
            </div>

            <div className="mt-2">
              <span className="text-[10px] text-slate-500">{completedCount}/{totalSetCount} sets done</span>
              <div className="progress-bar h-1.5 mt-1">
                <div
                  className="progress-fill bg-gradient-to-r from-indigo-500 to-emerald-500"
                  style={{ width: `${totalSetCount > 0 ? (completedCount / totalSetCount) * 100 : 0}%` }}
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
                    <span className="text-xs font-bold text-amber-400">Pro Tip: </span>
                    <span className="text-xs text-amber-200/80">{exercise.tips}</span>
                  </div>
                )}
                <button
                  onClick={() => setActiveSection('log')}
                  className="mt-4 w-full py-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 text-xs font-semibold touch-manipulation"
                >
                  Log Sets
                </button>
              </div>
            )}

            {activeSection === 'log' && (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Log Your Sets
                  </h4>
                  <div className="flex items-center gap-1.5">
                    {canRemoveSet && (
                      <button
                        type="button"
                        onClick={removeLastSet}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-slate-700/60 text-slate-400 hover:text-red-400 border border-slate-600/40 hover:border-red-500/30 transition-all touch-manipulation active:scale-95"
                      >
                        <Minus size={10} /> Remove
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={addSet}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-indigo-600/15 text-indigo-400 border border-indigo-500/25 hover:bg-indigo-600/25 transition-all touch-manipulation active:scale-95"
                    >
                      <Plus size={10} /> Add Set
                    </button>
                  </div>
                </div>

                {localSets.map((set, idx) => {
                  const hasReps     = (parseInt(set.reps, 10) || 0) > 0;
                  const isWarn      = warnIdx === idx;
                  const canComplete = set.completed || hasReps;
                  const isExtra     = idx >= exercise.sets;

                  return (
                    <div
                      key={idx}
                      className={`rounded-2xl border overflow-hidden transition-all duration-200 ${
                        set.completed
                          ? 'border-emerald-500/50 bg-emerald-950/30'
                          : isWarn
                          ? 'border-amber-400/50 bg-amber-950/20'
                          : isExtra
                          ? 'border-indigo-500/30 bg-indigo-950/10'
                          : 'border-slate-600/40 bg-slate-700/20'
                      }`}
                    >
                      <div
                        className={`flex items-center justify-between px-4 py-2.5 ${
                          set.completed ? 'bg-emerald-900/30' : isExtra ? 'bg-indigo-900/20' : 'bg-slate-700/30'
                        }`}
                      >
                        <span
                          className={`text-sm font-bold ${
                            set.completed ? 'text-emerald-300' : 'text-slate-300'
                          }`}
                        >
                          Set {idx + 1}
                          {isExtra && !set.completed && (
                            <span className="ml-1.5 text-[9px] font-semibold text-indigo-400/80 uppercase">extra</span>
                          )}
                          {set.completed && set.weight && set.reps && (
                            <span className="ml-2 text-[11px] font-normal text-emerald-500">
                              {set.weight} kg × {set.reps} reps
                            </span>
                          )}
                        </span>

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

                      <div className="grid grid-cols-2 gap-3 px-4 py-3">
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
                        <div>
                          <div className={`text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${isWarn ? 'text-amber-400' : 'text-slate-500'}`}>
                            Reps {isWarn && ' required'}
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

                {showRest && (
                  <RestTimer
                    defaultSeconds={defaultRestSec}
                    onDismiss={() => setShowRest(false)}
                  />
                )}

                {!showRest && completedCount > 0 && !allCompleted && (
                  <button
                    onClick={() => setShowRest(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold active:bg-indigo-600/20 touch-manipulation"
                  >
                    <Timer size={13} /> Start Rest Timer
                  </button>
                )}

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
