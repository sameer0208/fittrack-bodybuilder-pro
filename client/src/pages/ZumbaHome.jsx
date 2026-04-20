import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import dayjs from 'dayjs';
import {
  Music, Flame, Clock, Trophy, Star, Zap, TrendingUp,
  ChevronRight, Play, Calendar, BarChart3, Heart, Award,
} from 'lucide-react';
import { ZUMBA_SESSIONS, ZUMBA_STYLES, DIFFICULTY_CONFIG, formatDuration } from '../data/zumbaData';

// ─── Dancing Figure Canvas ───────────────────────────────────────────────────
function DancingFigure({ size = 120 }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const t = useRef(0);

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

    function draw() {
      t.current += 0.04;
      const T = t.current;
      ctx.clearRect(0, 0, size, size);

      const swing = Math.sin(T * 3) * 0.6;
      const bounce = Math.abs(Math.sin(T * 3)) * 4;
      const hipSway = Math.sin(T * 3) * 8;
      const headY = 25 - bounce;

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Shadow
      ctx.beginPath();
      ctx.ellipse(cx + hipSway * 0.3, size - 12, 18 + bounce, 4, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fill();

      // Body glow
      ctx.save();
      ctx.shadowColor = 'rgba(249,115,22,0.3)';
      ctx.shadowBlur = 15;

      // Legs
      ctx.strokeStyle = '#fb923c';
      ctx.lineWidth = 3.5;
      const hipY = 62 - bounce;
      const hipX = cx + hipSway;

      ctx.beginPath();
      ctx.moveTo(hipX, hipY);
      ctx.lineTo(hipX + Math.sin(-swing) * 18, size - 18);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(hipX, hipY);
      ctx.lineTo(hipX - Math.sin(-swing) * 18, size - 18);
      ctx.stroke();

      // Torso
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(hipX, hipY);
      ctx.lineTo(cx + hipSway * 0.3, 38 - bounce);
      ctx.stroke();

      // Arms
      const shoulderY = 40 - bounce;
      const shoulderX = cx + hipSway * 0.3;
      ctx.strokeStyle = '#fb923c';
      ctx.lineWidth = 3;
      // Right arm — waving up
      const rArmAngle = -1.2 + Math.sin(T * 3 + 0.5) * 0.8;
      ctx.beginPath();
      ctx.moveTo(shoulderX, shoulderY);
      ctx.lineTo(shoulderX + Math.cos(rArmAngle) * 25, shoulderY + Math.sin(rArmAngle) * 25);
      ctx.stroke();
      // Left arm
      const lArmAngle = Math.PI + 1.2 - Math.sin(T * 3) * 0.8;
      ctx.beginPath();
      ctx.moveTo(shoulderX, shoulderY);
      ctx.lineTo(shoulderX + Math.cos(lArmAngle) * 25, shoulderY + Math.sin(lArmAngle) * 25);
      ctx.stroke();

      // Head
      ctx.beginPath();
      ctx.arc(cx + hipSway * 0.15, headY, 9, 0, Math.PI * 2);
      const headGrad = ctx.createRadialGradient(cx + hipSway * 0.15 - 2, headY - 2, 1, cx + hipSway * 0.15, headY, 9);
      headGrad.addColorStop(0, '#fdba74');
      headGrad.addColorStop(1, '#f97316');
      ctx.fillStyle = headGrad;
      ctx.fill();

      ctx.restore();

      // Music notes floating
      for (let i = 0; i < 3; i++) {
        const noteT = (T * 0.8 + i * 2.1) % 6.28;
        const noteX = cx + 30 + Math.sin(noteT * 1.5 + i) * 15;
        const noteY = 20 + (noteT / 6.28) * 60;
        const noteAlpha = 1 - noteT / 6.28;
        if (noteAlpha > 0) {
          ctx.font = `${10 + i * 2}px sans-serif`;
          ctx.globalAlpha = noteAlpha * 0.7;
          ctx.fillStyle = i % 2 === 0 ? '#f97316' : '#ec4899';
          ctx.fillText('♪', noteX, noteY);
          ctx.globalAlpha = 1;
        }
      }

      animRef.current = requestAnimationFrame(draw);
    }
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [size]);

  return <canvas ref={canvasRef} />;
}

// ─── Session Card ────────────────────────────────────────────────────────────
function SessionCard({ session, onStart, completed }) {
  const diff = DIFFICULTY_CONFIG[session.difficulty];
  const styleObjs = session.styles.map((s) => ZUMBA_STYLES[s]).filter(Boolean);

  return (
    <div className="card relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all touch-manipulation"
      onClick={() => onStart(session.id)}>
      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${session.color}`} />
      <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-[60px] bg-gradient-to-br ${session.color} opacity-0 group-hover:opacity-[0.08] transition-opacity duration-500`} />

      <div className="relative p-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${session.color} flex items-center justify-center text-3xl shadow-lg shrink-0 relative overflow-hidden`}>
            {session.image}
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-black text-white text-base leading-tight truncate">{session.name}</h3>
              {completed && (
                <div className="shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Trophy size={10} className="text-emerald-400" />
                </div>
              )}
            </div>

            <p className="text-xs text-slate-400 line-clamp-2 mb-3">{session.description}</p>

            <div className="flex items-center gap-3 flex-wrap">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${diff.bg} ${diff.border} border ${diff.color}`}>
                {diff.label}
              </span>
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <Clock size={10} /> {session.duration} min
              </span>
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <Flame size={10} /> ~{session.estimatedCalories} kcal
              </span>
            </div>

            <div className="flex items-center gap-1.5 mt-2">
              {styleObjs.map((s) => (
                <span key={s.id} className="text-xs" title={s.name}>{s.emoji}</span>
              ))}
            </div>
          </div>

          <div className={`shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${session.color} flex items-center justify-center shadow-lg opacity-60 group-hover:opacity-100 transition-opacity`}>
            <Play size={16} className="text-white ml-0.5" fill="white" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Stats Card ──────────────────────────────────────────────────────────────
function StatBox({ icon: Icon, value, label, color }) {
  return (
    <div className="bg-slate-800/40 rounded-xl p-3 text-center relative overflow-hidden group">
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-[0.06] transition-opacity`} />
      <Icon size={16} className="mx-auto mb-1 text-slate-500" />
      <div className="text-lg font-black text-white">{value}</div>
      <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{label}</div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ZumbaHome() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, histRes] = await Promise.all([
          API.get('/zumba/stats'),
          API.get('/zumba/history?limit=50'),
        ]);
        setStats(statsRes.data);
        setHistory(histRes.data);
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  const completedSessionIds = useMemo(() => {
    const todayStr = dayjs().format('YYYY-MM-DD');
    return new Set(history.filter((h) => h.date === todayStr).map((h) => h.sessionId));
  }, [history]);

  const filteredSessions = useMemo(() => {
    if (activeFilter === 'all') return ZUMBA_SESSIONS;
    return ZUMBA_SESSIONS.filter((s) => s.difficulty === activeFilter);
  }, [activeFilter]);

  const handleStart = useCallback((sessionId) => {
    navigate(`/zumba/${sessionId}`);
  }, [navigate]);

  const recentHistory = useMemo(() => history.slice(0, 8), [history]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-slate-700/30 px-4 pt-4 pb-3"
        style={{ background: 'linear-gradient(180deg, rgba(10,14,23,0.98) 0%, rgba(10,14,23,0.95) 100%)' }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-pink-600 to-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-pink-600/15">
            <Music size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-black text-white text-lg leading-tight">Zumba</h1>
            <p className="text-[10px] text-slate-500 font-medium">Dance your way to fitness</p>
          </div>
          <div className="ml-auto">
            <DancingFigure size={60} />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-5">

        {/* Hero Banner */}
        <div className="card relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-600/10 via-transparent to-fuchsia-600/5" />
          <div className="absolute -top-20 -right-16 w-48 h-48 rounded-full bg-pink-500/5 blur-[60px]" />
          <div className="relative p-5 flex items-center gap-4">
            <DancingFigure size={100} />
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-black text-white mb-1">
                Let's <span className="bg-gradient-to-r from-pink-400 to-fuchsia-400 bg-clip-text text-transparent">Dance!</span>
              </h2>
              <p className="text-xs text-slate-400 mb-3">
                8 curated Zumba sessions across 8 dance styles. From easy merengue to explosive soca — pick your vibe!
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">
                  {ZUMBA_SESSIONS.length} Sessions
                </span>
                <span className="text-[10px] font-bold text-fuchsia-400 bg-fuchsia-500/10 px-2 py-0.5 rounded-full border border-fuchsia-500/20">
                  8 Styles
                </span>
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  30+ Moves
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview (if user has done sessions) */}
        {stats && stats.totalSessions > 0 && (
          <div className="card p-5">
            <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
              <BarChart3 size={16} className="text-pink-400" /> Your Zumba Stats
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <StatBox icon={Flame} value={stats.totalSessions} label="Sessions" color="from-pink-600/10 to-transparent" />
              <StatBox icon={Clock} value={`${stats.totalMinutes}m`} label="Dance Time" color="from-fuchsia-600/10 to-transparent" />
              <StatBox icon={Zap} value={stats.totalCalories} label="Calories" color="from-amber-600/10 to-transparent" />
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <StatBox icon={TrendingUp} value={stats.streak} label="Day Streak" color="from-emerald-600/10 to-transparent" />
              <StatBox icon={Star} value={stats.avgRating || '—'} label="Avg Rating" color="from-yellow-600/10 to-transparent" />
              <StatBox icon={Heart} value={stats.favoriteStyle ? ZUMBA_STYLES[stats.favoriteStyle]?.emoji || '—' : '—'} label="Fav Style" color="from-rose-600/10 to-transparent" />
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {[
            { key: 'all', label: 'All Sessions' },
            { key: 'beginner', label: 'Beginner' },
            { key: 'intermediate', label: 'Intermediate' },
            { key: 'advanced', label: 'Advanced' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all touch-manipulation ${
                activeFilter === f.key
                  ? 'bg-pink-600/20 text-pink-400 border border-pink-500/30'
                  : 'bg-slate-800/40 text-slate-500 border border-slate-700/20 hover:text-slate-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Session Cards */}
        <div className="space-y-3">
          {filteredSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onStart={handleStart}
              completed={completedSessionIds.has(session.id)}
            />
          ))}
        </div>

        {/* Recent History */}
        {recentHistory.length > 0 && (
          <div className="card p-5">
            <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
              <Calendar size={16} className="text-pink-400" /> Recent Sessions
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentHistory.map((log, i) => (
                <div key={log._id || i} className="flex items-center gap-3 p-2.5 bg-slate-800/30 rounded-xl">
                  <div className="w-9 h-9 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0">
                    <Music size={14} className="text-pink-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate">{log.sessionName}</span>
                      <span className="text-[10px] text-slate-500">{dayjs(log.date).format('MMM D')}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-500">{log.duration}m</span>
                      <span className="text-[10px] text-slate-600">·</span>
                      <span className="text-[10px] text-slate-500">{log.caloriesBurned} kcal</span>
                      <span className="text-[10px] text-slate-600">·</span>
                      <span className="text-[10px] text-slate-500">{log.completionPct}%</span>
                      {log.rating && (
                        <>
                          <span className="text-[10px] text-slate-600">·</span>
                          <span className="text-[10px] text-amber-400 flex items-center gap-0.5">
                            <Star size={8} fill="currentColor" /> {log.rating}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dance Styles Preview */}
        <div className="card p-5">
          <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
            <Award size={16} className="text-fuchsia-400" /> Dance Styles
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {Object.values(ZUMBA_STYLES).map((style) => (
              <div key={style.id} className="text-center p-2 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                <div className="text-2xl mb-1">{style.emoji}</div>
                <div className="text-[9px] font-bold text-slate-400">{style.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
