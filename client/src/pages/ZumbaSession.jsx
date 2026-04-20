import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import {
  Play, Pause, SkipForward, ArrowLeft, Flame, Clock, Music,
  ChevronRight, Star, Trophy, CheckCircle2, Volume2, VolumeX,
  X, Zap, Heart,
} from 'lucide-react';
import { getSessionWithMoves, ZUMBA_STYLES, DIFFICULTY_CONFIG, formatDuration } from '../data/zumbaData';
import MoveAnimator from '../components/MoveAnimator';
import ConfirmDialog from '../components/ConfirmDialog';

// ─── Circular Timer ──────────────────────────────────────────────────────────
function CircularTimer({ elapsed, total, isRunning, size = 200 }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const pRef = useRef(0);
  const glowT = useRef(0);

  const progress = total > 0 ? Math.min(elapsed / total, 1) : 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 16;
    const lw = 10;
    const start = -Math.PI / 2;

    function draw() {
      pRef.current += (progress - pRef.current) * 0.08;
      glowT.current += 0.03;
      const p = pRef.current;
      const pulse = 0.5 + Math.sin(glowT.current) * 0.5;

      ctx.clearRect(0, 0, size, size);

      // Shadow
      ctx.beginPath();
      ctx.arc(cx, cy + 2, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = lw + 4;
      ctx.stroke();

      // BG ring
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(100,116,139,0.1)';
      ctx.lineWidth = lw;
      ctx.lineCap = 'round';
      ctx.stroke();

      if (p > 0.001) {
        const end = start + Math.PI * 2 * p;

        // Glow
        ctx.save();
        ctx.shadowColor = 'rgba(236,72,153,0.6)';
        ctx.shadowBlur = 15 * pulse;
        ctx.beginPath();
        ctx.arc(cx, cy, r, start, end);
        ctx.strokeStyle = 'transparent';
        ctx.lineWidth = lw;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();

        // Arc
        const grad = ctx.createConicGradient(start, cx, cy);
        grad.addColorStop(0, '#ec4899');
        grad.addColorStop(0.4, '#f43f5e');
        grad.addColorStop(0.7, '#f97316');
        grad.addColorStop(1, '#eab308');
        ctx.beginPath();
        ctx.arc(cx, cy, r, start, end);
        ctx.strokeStyle = grad;
        ctx.lineWidth = lw;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Dot
        const dx = cx + r * Math.cos(end);
        const dy = cy + r * Math.sin(end);
        const dg = ctx.createRadialGradient(dx - 1, dy - 1, 1, dx, dy, 7);
        dg.addColorStop(0, '#fff');
        dg.addColorStop(0.5, '#f43f5e');
        dg.addColorStop(1, '#be123c');
        ctx.beginPath();
        ctx.arc(dx, dy, 7, 0, Math.PI * 2);
        ctx.fillStyle = dg;
        ctx.fill();
      }

      // Pulse dot when running
      if (isRunning) {
        const pulseR = 3 + Math.sin(glowT.current * 2.5) * 1.5;
        ctx.beginPath();
        ctx.arc(cx + r + 12, cy - r + 6, pulseR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(34,197,94,${0.5 + Math.sin(glowT.current * 2.5) * 0.5})`;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    }
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [progress, isRunning, size]);

  return <canvas ref={canvasRef} />;
}

// ─── Beat Bars ───────────────────────────────────────────────────────────────
function BeatBars({ active }) {
  return (
    <div className="flex items-end gap-[3px] h-6">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="block w-[4px] rounded-full"
          style={{
            background: active ? `linear-gradient(to top, #ec4899, #f97316)` : '#334155',
            animation: active ? `beatBar 0.6s ease-in-out ${i * 0.1}s infinite alternate` : 'none',
            height: active ? undefined : '8px',
          }}
        />
      ))}
      <style>{`
        @keyframes beatBar {
          0% { height: 6px; }
          100% { height: 22px; }
        }
      `}</style>
    </div>
  );
}

// ─── Rating Modal ────────────────────────────────────────────────────────────
function RatingModal({ open, onSubmit, stats }) {
  const [rating, setRating] = useState(0);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700/50 rounded-3xl p-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-600/5 via-transparent to-fuchsia-600/5" />
        <div className="relative">
          {/* Confetti-like sparkles */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-4xl">🎉</div>

          <div className="mt-6 mb-2">
            <Trophy size={40} className="mx-auto text-amber-400 mb-2" />
            <h3 className="text-2xl font-black text-white mb-1">Session Complete!</h3>
            <p className="text-sm text-slate-400">You crushed it on the dance floor!</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 my-5">
            <div className="bg-slate-800/50 rounded-xl p-2.5">
              <div className="text-lg font-black text-pink-400">{stats.movesCompleted}/{stats.totalMoves}</div>
              <div className="text-[9px] text-slate-500">Moves</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-2.5">
              <div className="text-lg font-black text-amber-400">{Math.round(stats.duration / 60)}m</div>
              <div className="text-[9px] text-slate-500">Duration</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-2.5">
              <div className="text-lg font-black text-orange-400">{stats.calories}</div>
              <div className="text-[9px] text-slate-500">Calories</div>
            </div>
          </div>

          {/* Rating */}
          <p className="text-xs text-slate-400 mb-2 font-bold">How was this session?</p>
          <div className="flex justify-center gap-2 mb-5">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                onClick={() => setRating(v)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
                  rating >= v
                    ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400 scale-110'
                    : 'bg-slate-800/50 border border-slate-700/30 text-slate-600'
                }`}
              >
                <Star size={18} fill={rating >= v ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>

          <button
            onClick={() => onSubmit(rating || null)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-pink-600/20 active:scale-95 transition-transform touch-manipulation"
          >
            Save & Finish
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Session Page ───────────────────────────────────────────────────────
export default function ZumbaSession() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const session = useMemo(() => getSessionWithMoves(sessionId), [sessionId]);
  const moves = session?.movesDetailed || [];

  const [currentMoveIdx, setCurrentMoveIdx] = useState(0);
  const [moveElapsed, setMoveElapsed] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [completed, setCompleted] = useState(new Set());
  const [showComplete, setShowComplete] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const intervalRef = useRef(null);

  const currentMove = moves[currentMoveIdx];
  const moveDuration = currentMove?.sessionDuration || 45;
  const totalSessionDuration = useMemo(() => moves.reduce((s, m) => s + (m.sessionDuration || 45), 0), [moves]);
  const styleObj = currentMove?.style ? ZUMBA_STYLES[currentMove.style] : null;

  // Timer
  useEffect(() => {
    if (!isRunning) {
      clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setMoveElapsed((p) => {
        const next = p + 1;
        if (next >= moveDuration) {
          // Auto-advance to next move
          setCompleted((prev) => new Set([...prev, currentMoveIdx]));
          if (currentMoveIdx < moves.length - 1) {
            setCurrentMoveIdx((i) => i + 1);
            return 0;
          } else {
            setIsRunning(false);
            setShowComplete(true);
            return moveDuration;
          }
        }
        return next;
      });
      setTotalElapsed((p) => p + 1);
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isRunning, moveDuration, currentMoveIdx, moves.length]);

  const togglePlay = useCallback(() => setIsRunning((p) => !p), []);

  const skipMove = useCallback(() => {
    setCompleted((prev) => new Set([...prev, currentMoveIdx]));
    if (currentMoveIdx < moves.length - 1) {
      setCurrentMoveIdx((i) => i + 1);
      setMoveElapsed(0);
    } else {
      setIsRunning(false);
      setShowComplete(true);
    }
  }, [currentMoveIdx, moves.length]);

  const handleFinish = useCallback(async (rating) => {
    setSaving(true);
    const completedCount = completed.size + (currentMoveIdx === moves.length - 1 ? 1 : 0);
    const pct = Math.round((completedCount / moves.length) * 100);
    const calPerSec = (session.estimatedCalories || 200) / totalSessionDuration;
    const cal = Math.round(calPerSec * totalElapsed);

    try {
      await API.post('/zumba/log', {
        date: dayjs().format('YYYY-MM-DD'),
        sessionId: session.id,
        sessionName: session.name,
        difficulty: session.difficulty,
        duration: Math.round(totalElapsed / 60),
        caloriesBurned: cal,
        movesCompleted: completedCount,
        totalMoves: moves.length,
        completionPct: pct,
        rating,
        styles: session.styles,
      });
      toast.success('Zumba session saved!');
    } catch {
      toast.error('Failed to save session');
    }
    setSaving(false);
    navigate('/zumba');
  }, [completed, currentMoveIdx, moves, session, totalElapsed, totalSessionDuration, navigate]);

  const handleExit = useCallback(() => {
    if (totalElapsed > 30) {
      setShowExitConfirm(true);
    } else {
      navigate('/zumba');
    }
  }, [totalElapsed, navigate]);

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <Music size={48} className="text-slate-600 mb-4" />
        <h2 className="text-xl font-black text-white mb-2">Session Not Found</h2>
        <p className="text-sm text-slate-400 mb-4">This Zumba session doesn't exist.</p>
        <button onClick={() => navigate('/zumba')}
          className="px-6 py-2.5 rounded-xl bg-pink-600/15 border border-pink-500/25 text-pink-400 text-sm font-bold">
          Back to Zumba
        </button>
      </div>
    );
  }

  const progressPct = totalSessionDuration > 0 ? Math.round((totalElapsed / totalSessionDuration) * 100) : 0;
  const remaining = moveDuration - moveElapsed;
  const diff = DIFFICULTY_CONFIG[currentMove?.difficulty];

  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-slate-700/30 px-4 pt-3 pb-2.5"
        style={{ background: 'linear-gradient(180deg, rgba(10,14,23,0.98) 0%, rgba(10,14,23,0.95) 100%)' }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={handleExit}
            className="w-8 h-8 rounded-lg bg-slate-800/60 border border-slate-700/30 flex items-center justify-center text-slate-400 hover:text-white active:scale-90 transition-all">
            <ArrowLeft size={16} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-black text-white text-sm leading-tight truncate">{session.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-slate-500">Move {currentMoveIdx + 1}/{moves.length}</span>
              <span className="text-[10px] text-slate-600">·</span>
              <span className="text-[10px] text-pink-400 font-bold">{progressPct}%</span>
            </div>
          </div>
          <BeatBars active={isRunning} />
        </div>
        {/* Progress bar */}
        <div className="max-w-2xl mx-auto mt-2">
          <div className="h-1 bg-slate-800/50 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-pink-500 to-orange-400 transition-all duration-500"
              style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* Current Move Card */}
        {currentMove && (
          <div className="card relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${styleObj?.color || 'from-pink-500 to-rose-500'}`} />
            <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[60px] bg-gradient-to-br from-pink-600/5 to-fuchsia-600/5" />

            <div className="relative p-5">
              {/* Move header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${styleObj?.color || 'from-pink-500 to-rose-500'} flex items-center justify-center text-xl shadow-lg`}>
                  {styleObj?.emoji || '💃'}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-black text-white leading-tight">{currentMove.name}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-bold ${styleObj?.accent || 'text-pink-400'}`}>
                      {styleObj?.name || currentMove.style}
                    </span>
                    {diff && (
                      <>
                        <span className="text-slate-700">·</span>
                        <span className={`text-[10px] font-bold ${diff.color}`}>{diff.label}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Animated Character */}
              <div className="relative mb-3">
                <div className="flex justify-center">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-700/20"
                    style={{ background: 'linear-gradient(180deg, rgba(15,20,35,0.5) 0%, rgba(20,16,32,0.6) 100%)' }}>
                    <MoveAnimator moveId={currentMove.id} isRunning={isRunning} size={240} />
                    {/* Overlay: move name + timer in bottom bar */}
                    <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/70 to-transparent flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: isRunning ? '#22c55e' : '#64748b' }} />
                        <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
                          {isRunning ? 'Follow along' : 'Press play'}
                        </span>
                      </div>
                      <span className="text-lg font-black text-white tabular-nums">{remaining}<span className="text-[10px] text-slate-400 ml-0.5">s</span></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timer Ring */}
              <div className="flex justify-center mb-3">
                <div className="relative">
                  <CircularTimer elapsed={moveElapsed} total={moveDuration} isRunning={isRunning} size={100} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs font-black text-white/50 uppercase tracking-wider">Timer</span>
                    <span className="text-lg font-black text-white tabular-nums">{Math.round((moveElapsed / moveDuration) * 100)}%</span>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4 mb-5">
                <button
                  onClick={togglePlay}
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-90 ${
                    isRunning
                      ? 'bg-gradient-to-br from-red-600 to-rose-600 shadow-red-600/30'
                      : 'bg-gradient-to-br from-pink-600 to-rose-500 shadow-pink-600/30'
                  }`}
                >
                  {isRunning ? <Pause size={28} className="text-white" /> : <Play size={28} className="text-white ml-1" fill="white" />}
                </button>
                <button
                  onClick={skipMove}
                  className="w-12 h-12 rounded-xl bg-slate-800/60 border border-slate-700/30 flex items-center justify-center text-slate-400 hover:text-white active:scale-90 transition-all"
                  title="Skip move"
                >
                  <SkipForward size={20} />
                </button>
              </div>

              {/* Muscles */}
              {currentMove.muscles && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {currentMove.muscles.map((m) => (
                    <span key={m} className="text-[10px] font-bold text-slate-400 bg-slate-800/50 border border-slate-700/20 px-2 py-0.5 rounded-full">
                      {m}
                    </span>
                  ))}
                </div>
              )}

              {/* Step-by-step instructions */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-pink-400" /> How to do it
                </h4>
                {currentMove.steps?.map((step, i) => (
                  <div key={i} className="flex gap-2.5 items-start">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-[9px] font-black text-pink-400 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>

              {/* Tip */}
              {currentMove.tip && (
                <div className="mt-4 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                  <p className="text-xs text-amber-300">
                    <span className="font-bold">Pro Tip:</span> {currentMove.tip}
                  </p>
                </div>
              )}

              {/* BPM & Calories */}
              <div className="flex items-center gap-3 mt-4 text-[10px] text-slate-500">
                {currentMove.bpm && <span className="flex items-center gap-1"><Heart size={10} /> {currentMove.bpm} BPM</span>}
                {currentMove.calories && <span className="flex items-center gap-1"><Flame size={10} /> ~{currentMove.calories} kcal</span>}
                <span className="flex items-center gap-1"><Clock size={10} /> {currentMove.sessionDuration}s</span>
              </div>
            </div>
          </div>
        )}

        {/* Moves Timeline */}
        <div className="card p-4">
          <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider mb-3">Session Flow</h4>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {moves.map((move, i) => {
              const isActive = i === currentMoveIdx;
              const isDone = completed.has(i) || i < currentMoveIdx;
              const ms = move.style ? ZUMBA_STYLES[move.style] : null;

              return (
                <div
                  key={`${move.id}-${i}`}
                  className={`flex items-center gap-2.5 p-2 rounded-lg transition-all ${
                    isActive ? 'bg-pink-500/10 border border-pink-500/20' : isDone ? 'opacity-50' : ''
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs ${
                    isDone ? 'bg-emerald-500/20 text-emerald-400' : isActive ? 'bg-pink-500/20 text-pink-400' : 'bg-slate-800/50 text-slate-600'
                  }`}>
                    {isDone ? <CheckCircle2 size={12} /> : (i + 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs font-bold truncate block ${isActive ? 'text-white' : isDone ? 'text-slate-400' : 'text-slate-500'}`}>
                      {move.name}
                    </span>
                  </div>
                  <span className="text-[10px] shrink-0">{ms?.emoji}</span>
                  <span className="text-[10px] text-slate-600 shrink-0">{move.sessionDuration}s</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Complete early button */}
        {!showComplete && totalElapsed > 60 && (
          <button
            onClick={() => {
              setIsRunning(false);
              setShowComplete(true);
            }}
            className="w-full py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center gap-2 touch-manipulation active:bg-emerald-500/15"
          >
            <Trophy size={14} /> Finish Session Early
          </button>
        )}
      </div>

      {/* Rating Modal */}
      <RatingModal
        open={showComplete}
        onSubmit={handleFinish}
        stats={{
          movesCompleted: completed.size + (showComplete && currentMoveIdx === moves.length - 1 ? 1 : 0),
          totalMoves: moves.length,
          duration: totalElapsed,
          calories: Math.round(((session?.estimatedCalories || 200) / totalSessionDuration) * totalElapsed),
        }}
      />

      {/* Exit confirmation */}
      <ConfirmDialog
        open={showExitConfirm}
        variant="warning"
        title="Leave Session?"
        message="You've been dancing! If you leave now, your progress won't be saved. Want to finish and save first?"
        confirmText="Leave Anyway"
        cancelText="Keep Dancing"
        onConfirm={() => navigate('/zumba')}
        onCancel={() => setShowExitConfirm(false)}
      />
    </div>
  );
}
