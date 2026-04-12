import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { workoutPlan } from '../data/workoutPlan';
import { exercises as exerciseDb } from '../data/exercises';
import { useApp } from '../context/AppContext';
import ExerciseCard from '../components/ExerciseCard';
import toast from 'react-hot-toast';
import {
  ArrowLeft, CheckCircle2, Play, Pause, RotateCcw,
  Clock, Flame, Dumbbell, ChevronRight, Trophy
} from 'lucide-react';

export default function WorkoutDay() {
  const { sessionKey } = useParams();
  const navigate = useNavigate();
  const { saveWorkoutLog, getWorkoutLog, user } = useApp();

  const plan = workoutPlan[sessionKey];
  const [exerciseLogs, setExerciseLogs] = useState({});
  const [completed, setCompleted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [mood, setMood] = useState('good');
  const [notes, setNotes] = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    const existingLog = getWorkoutLog(sessionKey);
    if (existingLog) {
      setCompleted(existingLog.completed || false);
      setElapsed(existingLog.duration ? existingLog.duration * 60 : 0);
      setMood(existingLog.mood || 'good');
      setNotes(existingLog.notes || '');
      if (existingLog.exerciseLogs) {
        setExerciseLogs(existingLog.exerciseLogs);
      }
    }
  }, [sessionKey, getWorkoutLog]);

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

  const totalSetsCompleted = Object.values(exerciseLogs).reduce((sum, sets) => {
    return sum + (Array.isArray(sets) ? sets.filter((s) => s.completed).length : 0);
  }, 0);

  const totalSetsAll = plan?.exercises?.reduce((sum, exId) => {
    const ex = exerciseDb[exId];
    return sum + (ex?.sets || 0);
  }, 0) || 0;

  const completionPct = totalSetsAll > 0 ? (totalSetsCompleted / totalSetsAll) * 100 : 0;

  const totalVolume = Object.values(exerciseLogs).reduce((sum, sets) => {
    return sum + (Array.isArray(sets) ? sets.reduce((s, set) => {
      if (set.completed && set.weight && set.reps) {
        return s + parseFloat(set.weight) * parseInt(set.reps);
      }
      return s;
    }, 0) : 0);
  }, 0);

  const handleFinishWorkout = () => {
    setTimerRunning(false);
    const exercises = plan?.exercises?.map((exId) => ({
      exerciseId: exId,
      exerciseName: exerciseDb[exId]?.name || exId,
      sets: exerciseLogs[exId] || [],
      completed: (exerciseLogs[exId] || []).every((s) => s.completed),
    })) || [];

    saveWorkoutLog(sessionKey, {
      workoutName: plan?.name,
      exercises,
      exerciseLogs,
      duration: Math.floor(elapsed / 60),
      totalVolume,
      completed: true,
      mood,
      notes,
      bodyWeight: user?.currentWeight,
    });

    setCompleted(true);
    toast.success('Workout Complete! 🏆 Great work!');
  };

  const handleSaveDraft = () => {
    saveWorkoutLog(sessionKey, {
      workoutName: plan?.name,
      exerciseLogs,
      duration: Math.floor(elapsed / 60),
      totalVolume,
      completed: false,
      mood,
      notes,
    });
    toast.success('Progress saved!');
  };

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

  const exerciseList = plan.exercises.map((id) => exerciseDb[id]).filter(Boolean);

  return (
    <div className="min-h-screen pb-32 lg:pb-8">
      {/* ── Hero Header ────────────────────────────── */}
      <div className={`relative bg-gradient-to-br ${plan.colorClass} overflow-hidden`}>
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative max-w-3xl mx-auto px-4 pt-5 pb-8">
          {/* Back Button */}
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-white/80 active:text-white mb-5 text-sm transition-colors touch-manipulation min-h-[44px]"
          >
            <ArrowLeft size={18} />
            <span className="font-medium">Back</span>
          </button>

          {/* Title Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-1">
                <span className="text-3xl">{plan.muscleEmoji}</span>
                <div className="min-w-0">
                  <div className="text-white/60 text-xs font-medium">{plan.dayLabel} · {plan.time}</div>
                  <h1 className="text-2xl font-black text-white leading-tight truncate">{plan.name}</h1>
                </div>
              </div>
              <p className="text-white/70 text-sm ml-0.5">{plan.subtitle}</p>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {plan.focus?.map((f) => (
                  <span key={f} className="px-2.5 py-1 bg-white/15 rounded-full text-white/90 text-xs font-medium border border-white/20">
                    {f}
                  </span>
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

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-2 mt-5">
            {[
              { label: 'Exercises', value: exerciseList.length, icon: Dumbbell },
              { label: 'Duration', value: plan.duration, icon: Clock },
              { label: 'Sets', value: `${totalSetsCompleted}/${totalSetsAll}`, icon: CheckCircle2 },
              { label: 'Volume', value: `${totalVolume.toFixed(0)}kg`, icon: Flame },
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
            {/* Timer */}
            <div className="flex-1">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider leading-none mb-0.5">Timer</div>
              <div className="text-2xl font-black text-white font-mono leading-tight">{formatTime(elapsed)}</div>
            </div>

            {/* Controls */}
            <button
              onClick={() => setTimerRunning(!timerRunning)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 touch-manipulation min-h-[44px] ${
                timerRunning
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {timerRunning ? <><Pause size={15} /> Pause</> : <><Play size={15} /> Start</>}
            </button>
            <button
              onClick={() => { setElapsed(0); setTimerRunning(false); }}
              className="btn-icon bg-slate-700/60 text-slate-400 active:text-white min-w-[44px] min-h-[44px]"
            >
              <RotateCcw size={15} />
            </button>

            {/* Progress pill */}
            <div className="hidden sm:flex flex-col items-end gap-1">
              <span className="text-xs font-bold text-indigo-400">{completionPct.toFixed(0)}%</span>
              <div className="w-16 progress-bar">
                <div className="progress-fill bg-gradient-to-r from-indigo-500 to-emerald-500" style={{ width: `${completionPct}%` }} />
              </div>
            </div>
          </div>

          {/* Progress Bar (full width) */}
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-400">Workout Progress</span>
              <span className="text-xs text-indigo-400 font-bold">{totalSetsCompleted}/{totalSetsAll} sets</span>
            </div>
            <div className="progress-bar h-2.5">
              <div
                className="progress-fill bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Exercise Cards */}
        <div className="space-y-4">
          {exerciseList.map((exercise, idx) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              index={idx}
              setLogs={(id, sets) => updateExerciseSets(id, sets)}
            />
          ))}
        </div>

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
              <button
                key={m.value}
                onClick={() => setMood(m.value)}
                className={`flex-1 py-3 rounded-xl border text-center transition-all ${
                  mood === m.value
                    ? 'border-indigo-500 bg-indigo-600/20'
                    : 'border-slate-600 hover:border-slate-500'
                }`}
              >
                <div className="text-xl">{m.emoji}</div>
                <div className="text-xs text-slate-400 mt-1">{m.label}</div>
              </button>
            ))}
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes: new PRs, how you felt, what to improve next time..."
            className="input-field h-20 resize-none text-sm"
          />
        </div>

        {/* Finish Buttons */}
        <div className="mt-6 space-y-3">
          {!completed ? (
            <>
              <button
                onClick={handleFinishWorkout}
                className="w-full btn-success flex items-center justify-center gap-3 text-base py-4"
              >
                <Trophy size={20} />
                Complete Workout!
              </button>
              <button
                onClick={handleSaveDraft}
                className="w-full btn-secondary text-sm"
              >
                Save & Continue Later
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
    </div>
  );
}
