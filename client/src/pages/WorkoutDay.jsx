import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { exercises as exerciseDb } from '../data/exercises';
import { buildFullExerciseDb } from '../data/exerciseLibrary';
import { useApp } from '../context/AppContext';
import useWorkoutPlan from '../hooks/useWorkoutPlan';
import ExerciseCard from '../components/ExerciseCard';
import ExercisePickerModal from '../components/ExercisePickerModal';
import toast from 'react-hot-toast';
import axios from 'axios';
import {
  ArrowLeft, CheckCircle2, Play, Pause, RotateCcw,
  Clock, Flame, Dumbbell, ChevronRight, Trophy,
  Pencil, Plus, X, RotateCcw as ResetIcon, Check, Type,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const API = axios.create({ baseURL: API_BASE });
API.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('ft_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

const fullDb = buildFullExerciseDb(exerciseDb);

export default function WorkoutDay() {
  const { sessionKey } = useParams();
  const navigate = useNavigate();
  const { saveWorkoutLog, getWorkoutLog, fetchWorkoutLog, user } = useApp();
  const { workoutPlan } = useWorkoutPlan();

  const plan = workoutPlan[sessionKey];
  const [exerciseLogs, setExerciseLogs] = useState({});
  const [completed, setCompleted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [mood, setMood] = useState('good');
  const [notes, setNotes] = useState('');
  const timerRef = useRef(null);
  const [saving, setSaving] = useState(false);

  // ── Customization state ────────────────────────────────────────────────────
  const [customAdded, setCustomAdded] = useState([]);
  const [customRemoved, setCustomRemoved] = useState([]);
  const [customName, setCustomName] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const nameInputRef = useRef(null);

  const originalIds = useMemo(() => plan?.exercises || [], [plan]);

  const displayName = customName || plan?.name || '';

  // Load customization from backend only
  useEffect(() => {
    if (!sessionKey) return;
    API.get(`/custom-workout/${sessionKey}`).then(({ data }) => {
      setCustomAdded(data.added || []);
      setCustomRemoved(data.removed || []);
      setCustomName(data.customName || '');
    }).catch(() => { /* server unreachable — use defaults */ });
  }, [sessionKey]);

  // Persist customization to server
  const saveCustomization = useCallback(async (added, removed, cName) => {
    const payload = { added, removed, customName: cName ?? customName };
    try { await API.put(`/custom-workout/${sessionKey}`, payload); } catch { /* server unreachable */ }
  }, [sessionKey, customName]);

  // Merged exercise list = (original − removed) + added
  const mergedIds = useMemo(() => {
    const removedSet = new Set(customRemoved);
    const kept = originalIds.filter((id) => !removedSet.has(id));
    return [...kept, ...customAdded];
  }, [originalIds, customRemoved, customAdded]);

  const exerciseList = useMemo(
    () => mergedIds.map((id) => fullDb[id]).filter(Boolean),
    [mergedIds]
  );

  // ── Existing workout log loading ───────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    fetchWorkoutLog(sessionKey).then((existingLog) => {
      if (cancelled || !existingLog) return;
      setCompleted(existingLog.completed || false);
      setElapsed(existingLog.duration ? existingLog.duration * 60 : 0);
      setMood(existingLog.mood || 'good');
      setNotes(existingLog.notes || '');

      // Restore exercise set data — prefer the UI-format map (localStorage),
      // fall back to converting the server-format exercises array.
      if (existingLog.exerciseLogs && Object.keys(existingLog.exerciseLogs).length > 0) {
        setExerciseLogs(existingLog.exerciseLogs);
      } else if (Array.isArray(existingLog.exercises) && existingLog.exercises.length > 0) {
        const logsMap = {};
        existingLog.exercises.forEach((ex) => {
          if (ex.exerciseId && Array.isArray(ex.sets)) {
            logsMap[ex.exerciseId] = ex.sets.map((s, i) => ({
              setNumber: s.setNumber ?? i + 1,
              weight: s.weight ? String(s.weight) : '',
              reps: s.reps ? String(s.reps) : '',
              completed: Boolean(s.completed),
            }));
          }
        });
        if (Object.keys(logsMap).length > 0) setExerciseLogs(logsMap);
      }
    });
    return () => { cancelled = true; };
  }, [sessionKey, fetchWorkoutLog]);

  // Timer
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const updateExerciseSets = (exerciseId, sets) => {
    setExerciseLogs((prev) => ({ ...prev, [exerciseId]: sets }));
  };

  // Compute totals from actual logged sets (accounts for extra sets added by user)
  const totalSetsCompleted = Object.values(exerciseLogs).reduce((sum, sets) => {
    return sum + (Array.isArray(sets) ? sets.filter((s) => s.completed).length : 0);
  }, 0);

  const totalSetsAll = useMemo(() => {
    return exerciseList.reduce((sum, ex) => {
      const logged = exerciseLogs[ex.id];
      return sum + (Array.isArray(logged) ? logged.length : ex.sets || 0);
    }, 0);
  }, [exerciseList, exerciseLogs]);

  const completionPct = totalSetsAll > 0 ? (totalSetsCompleted / totalSetsAll) * 100 : 0;

  const totalVolume = Object.values(exerciseLogs).reduce((sum, sets) => {
    return sum + (Array.isArray(sets) ? sets.reduce((s, set) => {
      if (set.completed && set.weight && set.reps) return s + parseFloat(set.weight) * parseInt(set.reps);
      return s;
    }, 0) : 0);
  }, 0);

  const sanitiseSets = (rawSets) =>
    (rawSets || []).map((s, i) => ({
      setNumber: s.setNumber ?? i + 1,
      weight: parseFloat(s.weight) || 0,
      reps: parseInt(s.reps, 10) || 0,
      completed: s.completed ?? false,
    }));

  const buildExercises = () =>
    mergedIds.map((exId) => ({
      exerciseId: exId,
      exerciseName: fullDb[exId]?.name || exId,
      sets: sanitiseSets(exerciseLogs[exId]),
      completed: (exerciseLogs[exId] || []).every((s) => s.completed),
    }));

  const handleFinishWorkout = async () => {
    if (saving) return;
    setTimerRunning(false);
    setSaving(true);
    try {
      await saveWorkoutLog(sessionKey, {
        workoutName: displayName,
        exercises: buildExercises(),
        exerciseLogs,
        duration: Math.floor(elapsed / 60),
        totalVolume,
        completed: true,
        mood, notes,
        bodyWeight: user?.currentWeight,
      });
      setCompleted(true);
      toast.success('Workout Complete! Saved to cloud!');
    } catch (err) {
      setCompleted(true);
      toast.error(`Saved locally — cloud sync failed.\n(${err?.response?.data?.message || err.message || 'Network error'})`, { duration: 6000 });
    } finally { setSaving(false); }
  };

  const handleSaveDraft = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await saveWorkoutLog(sessionKey, {
        workoutName: displayName,
        exercises: buildExercises(),
        exerciseLogs,
        duration: Math.floor(elapsed / 60),
        totalVolume,
        completed: false,
        mood, notes,
      });
      toast.success('Progress saved!');
    } catch (err) {
      toast.error(`Saved locally — cloud sync failed.\n(${err?.response?.data?.message || err.message || 'Network error'})`, { duration: 6000 });
    } finally { setSaving(false); }
  };

  // ── Customization actions ──────────────────────────────────────────────────

  const handleAddExercise = (ex) => {
    if (mergedIds.includes(ex.id)) return;
    const newAdded = [...customAdded, ex.id];
    setCustomAdded(newAdded);
    saveCustomization(newAdded, customRemoved);
    toast.success(`Added: ${ex.name}`);
  };

  const handleRemoveExercise = (exId) => {
    if (originalIds.includes(exId)) {
      const newRemoved = [...customRemoved, exId];
      setCustomRemoved(newRemoved);
      const newAdded = customAdded.filter((id) => id !== exId);
      setCustomAdded(newAdded);
      saveCustomization(newAdded, newRemoved);
    } else {
      const newAdded = customAdded.filter((id) => id !== exId);
      setCustomAdded(newAdded);
      saveCustomization(newAdded, customRemoved);
    }
    toast('Exercise removed', { icon: '🗑️' });
  };

  const handleResetToDefault = () => {
    setCustomAdded([]);
    setCustomRemoved([]);
    setCustomName('');
    saveCustomization([], [], '');
    setEditMode(false);
    toast.success('Reset to default plan');
  };

  const startEditName = () => {
    setNameInput(customName || plan?.name || '');
    setEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  };

  const saveNameEdit = () => {
    const trimmed = nameInput.trim();
    const newName = trimmed === plan?.name ? '' : trimmed;
    setCustomName(newName);
    setEditingName(false);
    saveCustomization(customAdded, customRemoved, newName);
    if (newName) toast.success('Session renamed!');
    else toast('Reverted to default name', { icon: '↩️' });
  };

  const cancelNameEdit = () => {
    setEditingName(false);
  };

  const hasCustomizations = customAdded.length > 0 || customRemoved.length > 0 || !!customName;

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Workout not found.</p>
          <Link to="/dashboard" className="btn-primary">Go to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-40 lg:pb-8">
      {/* ── Hero Header ────────────────────────────── */}
      <div className={`relative bg-gradient-to-br ${plan.colorClass} overflow-hidden`}>
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative max-w-3xl mx-auto px-4 pt-5 pb-8">
          <button onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-white/80 active:text-white mb-5 text-sm transition-colors touch-manipulation min-h-[44px]">
            <ArrowLeft size={18} />
            <span className="font-medium">Back</span>
          </button>

          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-1">
                <span className="text-3xl">{plan.muscleEmoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-white/60 text-xs font-medium">{plan.dayLabel} · {plan.time}</div>

                  {/* ── Editable Session Name ── */}
                  {editingName ? (
                    <div className="flex items-center gap-2 mt-0.5">
                      <input
                        ref={nameInputRef}
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveNameEdit(); if (e.key === 'Escape') cancelNameEdit(); }}
                        maxLength={50}
                        className="flex-1 min-w-0 bg-white/10 border border-white/30 rounded-lg px-2.5 py-1 text-lg font-black text-white placeholder-white/40 focus:outline-none focus:border-white/60"
                        placeholder="Enter session name..."
                      />
                      <button onClick={saveNameEdit}
                        className="w-8 h-8 rounded-lg bg-emerald-500/30 text-emerald-300 flex items-center justify-center active:scale-90 transition-all">
                        <Check size={16} />
                      </button>
                      <button onClick={cancelNameEdit}
                        className="w-8 h-8 rounded-lg bg-white/10 text-white/60 flex items-center justify-center active:scale-90 transition-all">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <h1 className="text-2xl font-black text-white leading-tight truncate">{displayName}</h1>
                      {editMode && (
                        <button onClick={startEditName}
                          className="w-7 h-7 rounded-lg bg-white/10 text-white/60 hover:text-white hover:bg-white/20 flex items-center justify-center shrink-0 transition-all active:scale-90"
                          title="Rename session">
                          <Type size={13} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <p className="text-white/70 text-sm ml-0.5">{plan.subtitle}</p>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {plan.focus?.map((f) => (
                  <span key={f} className="px-2.5 py-1 bg-white/15 rounded-full text-white/90 text-xs font-medium border border-white/20">{f}</span>
                ))}
              </div>
            </div>
            {completed && (
              <div className="flex flex-col items-center gap-1 bg-emerald-500/25 border border-emerald-400/50 rounded-2xl px-3 py-2.5 shrink-0">
                <CheckCircle2 size={24} className="text-emerald-400" />
                <span className="text-xs text-emerald-300 font-bold">Done!</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2 mt-5">
            {[
              { label: 'Exercises', value: exerciseList.length },
              { label: 'Duration', value: plan.duration },
              { label: 'Sets', value: `${totalSetsCompleted}/${totalSetsAll}` },
              { label: 'Volume', value: `${totalVolume.toFixed(0)}kg` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/10 backdrop-blur-sm rounded-xl py-2.5 px-1 text-center border border-white/10">
                <div className="text-white font-black text-sm leading-tight">{value}</div>
                <div className="text-white/50 text-[10px] mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-3 relative z-10">
        {/* ── Sticky Timer Bar ───────────────────────── */}
        <div className="sticky top-0 z-20 mb-4">
          <div className="card p-3 flex items-center gap-3 shadow-xl shadow-black/40">
            <div className="flex-1">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider leading-none mb-0.5">Timer</div>
              <div className="text-2xl font-black text-white font-mono leading-tight">{formatTime(elapsed)}</div>
            </div>
            <button onClick={() => setTimerRunning(!timerRunning)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 touch-manipulation min-h-[44px] ${
                timerRunning ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
              {timerRunning ? <><Pause size={15} /> Pause</> : <><Play size={15} /> Start</>}
            </button>
            <button onClick={() => { setElapsed(0); setTimerRunning(false); }}
              className="btn-icon bg-slate-700/60 text-slate-400 active:text-white min-w-[44px] min-h-[44px]">
              <RotateCcw size={15} />
            </button>
            <div className="hidden sm:flex flex-col items-end gap-1">
              <span className="text-xs font-bold text-indigo-400">{completionPct.toFixed(0)}%</span>
              <div className="w-16 progress-bar">
                <div className="progress-fill bg-gradient-to-r from-indigo-500 to-emerald-500" style={{ width: `${completionPct}%` }} />
              </div>
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-400">Workout Progress</span>
              <span className="text-xs text-indigo-400 font-bold">{totalSetsCompleted}/{totalSetsAll} sets</span>
            </div>
            <div className="progress-bar h-2.5">
              <div className="progress-fill bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" style={{ width: `${completionPct}%` }} />
            </div>
          </div>
        </div>

        {/* ── Customize Workout Bar ── */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <button
            type="button"
            onClick={() => setEditMode((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
              editMode
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 ring-1 ring-amber-400/20'
                : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
            }`}
          >
            <Pencil size={13} />
            {editMode ? 'Editing' : 'Customize'}
          </button>

          {editMode && (
            <>
              <button type="button" onClick={() => setShowPicker(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/30 transition-all active:scale-95">
                <Plus size={13} /> Add Exercise
              </button>
              <button type="button" onClick={startEditName}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all active:scale-95">
                <Type size={13} /> Rename
              </button>
              {hasCustomizations && (
                <button type="button" onClick={handleResetToDefault}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all active:scale-95">
                  <ResetIcon size={13} /> Reset All
                </button>
              )}
            </>
          )}

          <div className="flex-1" />
          {hasCustomizations && !editMode && (
            <span className="text-[10px] text-amber-400/70 font-medium">Customized</span>
          )}
        </div>

        {/* ── Exercise Cards ── */}
        <div className="space-y-4">
          {exerciseList.map((exercise, idx) => (
            <div key={exercise.id} className="relative group">
              {editMode && (
                <div className="absolute -top-2 -right-2 z-10 flex gap-1">
                  <button type="button" onClick={() => handleRemoveExercise(exercise.id)}
                    className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg hover:bg-red-500 active:scale-90 transition-all">
                    <X size={14} />
                  </button>
                </div>
              )}
              {editMode && customAdded.includes(exercise.id) && (
                <div className="absolute -top-2 left-3 z-10">
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-indigo-600 text-white px-2 py-0.5 rounded-md shadow-lg">
                    Added
                  </span>
                </div>
              )}
              <ExerciseCard
                exercise={exercise}
                index={idx}
                savedSets={exerciseLogs[exercise.id]}
                setLogs={(id, sets) => updateExerciseSets(id, sets)}
              />
            </div>
          ))}
        </div>

        {editMode && (
          <button type="button" onClick={() => setShowPicker(true)}
            className="w-full mt-4 py-4 rounded-2xl border-2 border-dashed border-slate-700 hover:border-indigo-500/50 text-slate-500 hover:text-indigo-400 flex items-center justify-center gap-2 text-sm font-semibold transition-all active:scale-[0.98]">
            <Plus size={18} /> Add More Exercises
          </button>
        )}

        {/* Mood & Notes */}
        <div className="card p-5 mt-6">
          <h3 className="font-semibold text-white mb-4">How was this workout?</h3>
          <div className="flex gap-3 mb-4">
            {[
              { value: 'great', emoji: '🔥', label: 'Great' },
              { value: 'good', emoji: '💪', label: 'Good' },
              { value: 'okay', emoji: '😐', label: 'Okay' },
              { value: 'bad', emoji: '😓', label: 'Tough' },
            ].map((m) => (
              <button key={m.value} onClick={() => setMood(m.value)}
                className={`flex-1 py-3 rounded-xl border text-center transition-all ${
                  mood === m.value ? 'border-indigo-500 bg-indigo-600/20' : 'border-slate-600 hover:border-slate-500'
                }`}>
                <div className="text-xl">{m.emoji}</div>
                <div className="text-xs text-slate-400 mt-1">{m.label}</div>
              </button>
            ))}
          </div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes: new PRs, how you felt, what to improve next time..."
            className="input-field h-20 resize-none text-sm" />
        </div>

        {/* Finish Buttons */}
        <div className="mt-6 space-y-3">
          {!completed ? (
            <>
              <button onClick={handleFinishWorkout} disabled={saving}
                className="w-full btn-success flex items-center justify-center gap-3 text-base py-4 disabled:opacity-60 disabled:cursor-not-allowed">
                {saving ? (
                  <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving to Cloud…</>
                ) : (
                  <><Trophy size={20} /> Complete Workout!</>
                )}
              </button>
              <button onClick={handleSaveDraft} disabled={saving}
                className="w-full btn-secondary text-sm disabled:opacity-60 disabled:cursor-not-allowed">
                {saving ? 'Saving…' : 'Save & Continue Later'}
              </button>
            </>
          ) : (
            <div className="card p-6 text-center border-emerald-500/40">
              <div className="text-4xl mb-3">🏆</div>
              <h3 className="text-xl font-black text-white mb-2">Workout Complete!</h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-slate-700/40 rounded-xl p-3">
                  <div className="text-lg font-bold text-white">{formatTime(elapsed)}</div>
                  <div className="text-xs text-slate-400">Duration</div>
                </div>
                <div className="bg-slate-700/40 rounded-xl p-3">
                  <div className="text-lg font-bold text-emerald-400">{totalSetsCompleted}</div>
                  <div className="text-xs text-slate-400">Sets Done</div>
                </div>
                <div className="bg-slate-700/40 rounded-xl p-3">
                  <div className="text-lg font-bold text-indigo-400">{totalVolume.toFixed(0)}kg</div>
                  <div className="text-xs text-slate-400">Volume</div>
                </div>
              </div>
              <Link to="/dashboard" className="btn-primary w-full flex items-center justify-center gap-2">
                Back to Dashboard <ChevronRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Exercise Picker Modal ── */}
      {showPicker && (
        <ExercisePickerModal
          allExercises={fullDb}
          currentIds={mergedIds}
          onAdd={handleAddExercise}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
