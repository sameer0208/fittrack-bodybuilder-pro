import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import axios from 'axios';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import {
  Footprints, Flame, MapPin, Clock, TrendingUp, Trophy, Target,
  Play, Pause, RotateCcw, Plus, Minus, ChevronRight, Zap, Award,
  Calendar, BarChart3,
} from 'lucide-react';
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  AreaChart, Area, Cell,
} from 'recharts';
import ConfirmDialog from '../components/ConfirmDialog';

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });
API.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('ft_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

const today = () => dayjs().format('YYYY-MM-DD');

// ─── Animated Number ─────────────────────────────────────────────────────────
function AnimatedNumber({ value, duration = 600, className = '' }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const rafRef = useRef(null);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    if (from === to) return;
    const start = performance.now();

    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else prevRef.current = to;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return <span className={className}>{display.toLocaleString()}</span>;
}

// ─── 3D Step Ring ────────────────────────────────────────────────────────────
function StepRing({ steps, goal, isTracking }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const glowRef = useRef(0);

  const progress = Math.min(steps / Math.max(goal, 1), 1);
  const progressRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const size = 300;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const radius = 120;
    const lineWidth = 14;
    const startAngle = -Math.PI / 2;

    function draw(timestamp) {
      // Smooth progress animation
      const targetP = progress;
      progressRef.current += (targetP - progressRef.current) * 0.06;
      const p = progressRef.current;

      // Glow pulse
      glowRef.current += 0.03;
      const pulse = 0.6 + Math.sin(glowRef.current) * 0.4;

      ctx.clearRect(0, 0, size, size);

      // Outer shadow ring (3D depth)
      ctx.beginPath();
      ctx.arc(cx, cy + 3, radius + 2, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = lineWidth + 6;
      ctx.stroke();

      // Background ring
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(100,116,139,0.12)';
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Inner bevel highlight (3D effect)
      ctx.beginPath();
      ctx.arc(cx, cy - 1, radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = lineWidth - 2;
      ctx.stroke();

      if (p > 0.001) {
        const endAngle = startAngle + Math.PI * 2 * p;

        // Glow behind progress arc
        ctx.save();
        ctx.shadowColor = p >= 1 ? 'rgba(16,185,129,0.7)' : 'rgba(239,68,68,0.6)';
        ctx.shadowBlur = 20 * pulse;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, startAngle, endAngle);
        ctx.strokeStyle = 'transparent';
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();

        // Progress arc gradient
        const grad = ctx.createConicGradient(startAngle, cx, cy);
        if (p >= 1) {
          grad.addColorStop(0, '#10b981');
          grad.addColorStop(0.5, '#34d399');
          grad.addColorStop(1, '#6ee7b7');
        } else {
          grad.addColorStop(0, '#ef4444');
          grad.addColorStop(0.3, '#f97316');
          grad.addColorStop(0.6, '#eab308');
          grad.addColorStop(1, '#22c55e');
        }

        ctx.beginPath();
        ctx.arc(cx, cy, radius, startAngle, endAngle);
        ctx.strokeStyle = grad;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.stroke();

        // End cap dot (3D ball)
        const dotX = cx + radius * Math.cos(endAngle);
        const dotY = cy + radius * Math.sin(endAngle);
        const dotGrad = ctx.createRadialGradient(dotX - 2, dotY - 2, 1, dotX, dotY, 9);
        dotGrad.addColorStop(0, '#ffffff');
        dotGrad.addColorStop(0.4, p >= 1 ? '#34d399' : '#f97316');
        dotGrad.addColorStop(1, p >= 1 ? '#059669' : '#dc2626');
        ctx.beginPath();
        ctx.arc(dotX, dotY, 9, 0, Math.PI * 2);
        ctx.fillStyle = dotGrad;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(dotX, dotY, 9, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Tick marks around ring
      for (let i = 0; i < 60; i++) {
        const angle = (i / 60) * Math.PI * 2 - Math.PI / 2;
        const isMajor = i % 15 === 0;
        const len = isMajor ? 8 : 4;
        const outerR = radius + lineWidth / 2 + 8;
        const innerR = outerR + len;
        ctx.beginPath();
        ctx.moveTo(cx + outerR * Math.cos(angle), cy + outerR * Math.sin(angle));
        ctx.lineTo(cx + innerR * Math.cos(angle), cy + innerR * Math.sin(angle));
        ctx.strokeStyle = isMajor ? 'rgba(148,163,184,0.3)' : 'rgba(148,163,184,0.1)';
        ctx.lineWidth = isMajor ? 2 : 1;
        ctx.stroke();
      }

      // Tracking indicator pulse
      if (isTracking) {
        const pulseR = 4 + Math.sin(glowRef.current * 2) * 2;
        ctx.beginPath();
        ctx.arc(cx + radius + lineWidth / 2 + 20, cy - radius + 10, pulseR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(34,197,94,${0.5 + Math.sin(glowRef.current * 2) * 0.5})`;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [progress, isTracking]);

  return (
    <div className="relative flex items-center justify-center">
      <canvas ref={canvasRef} className="drop-shadow-2xl" />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="flex items-center gap-1.5 mb-1">
          <Footprints size={18} className={`${isTracking ? 'text-emerald-400 animate-bounce' : 'text-slate-500'}`} />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {isTracking ? 'Tracking' : 'Steps'}
          </span>
        </div>
        <AnimatedNumber
          value={steps}
          className="text-5xl font-black text-white tracking-tight"
        />
        <div className="text-sm text-slate-400 mt-1 font-bold">
          / {goal.toLocaleString()}
        </div>
        <div className="mt-2 text-xs font-black uppercase tracking-wider" style={{
          color: progress >= 1 ? '#34d399' : progress >= 0.7 ? '#eab308' : progress >= 0.4 ? '#f97316' : '#ef4444',
        }}>
          {Math.round(progress * 100)}%
        </div>
      </div>
    </div>
  );
}

// ─── Walking Figure Animation ────────────────────────────────────────────────
function WalkingFigure({ isActive }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(0);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = 80, h = 100;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);

    function draw() {
      ctx.clearRect(0, 0, w, h);
      if (!isActive) {
        frameRef.current = 0;
        drawFigure(ctx, w / 2, 20, 0);
      } else {
        frameRef.current += 0.06;
        drawFigure(ctx, w / 2, 20, frameRef.current);
      }
      animRef.current = requestAnimationFrame(draw);
    }

    function drawFigure(c, x, y, t) {
      const swing = Math.sin(t * 4) * 0.45;
      c.lineCap = 'round';
      c.lineJoin = 'round';
      c.strokeStyle = isActive ? '#f97316' : '#64748b';
      c.lineWidth = 3;

      // Head
      c.beginPath();
      c.arc(x, y + 8, 7, 0, Math.PI * 2);
      c.fillStyle = isActive ? '#fb923c' : '#94a3b8';
      c.fill();
      c.stroke();

      // Torso
      const torsoLen = 28;
      c.beginPath();
      c.moveTo(x, y + 15);
      c.lineTo(x, y + 15 + torsoLen);
      c.stroke();

      // Arms
      const armLen = 20;
      c.beginPath();
      c.moveTo(x, y + 22);
      c.lineTo(x + Math.sin(swing) * armLen, y + 22 + Math.cos(swing) * armLen * 0.6);
      c.stroke();
      c.beginPath();
      c.moveTo(x, y + 22);
      c.lineTo(x - Math.sin(swing) * armLen, y + 22 + Math.cos(swing) * armLen * 0.6);
      c.stroke();

      // Legs
      const legLen = 25;
      const hipY = y + 15 + torsoLen;
      c.beginPath();
      c.moveTo(x, hipY);
      c.lineTo(x + Math.sin(-swing) * legLen * 0.7, hipY + Math.cos(swing) * legLen * 0.7 + 5);
      c.stroke();
      c.beginPath();
      c.moveTo(x, hipY);
      c.lineTo(x - Math.sin(-swing) * legLen * 0.7, hipY + Math.cos(-swing) * legLen * 0.7 + 5);
      c.stroke();
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [isActive]);

  return <canvas ref={canvasRef} />;
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, unit, color, glow }) {
  return (
    <div className="card p-4 relative overflow-hidden group">
      <div className={`absolute inset-0 bg-gradient-to-br ${glow} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className="relative flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg shrink-0`}>
          <Icon size={18} className="text-white" />
        </div>
        <div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{label}</div>
          <div className="flex items-baseline gap-1">
            <AnimatedNumber value={typeof value === 'number' ? value : 0} className="text-lg font-black text-white" />
            {unit && <span className="text-xs text-slate-500">{unit}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function StepCounter() {
  const { user } = useApp();

  // State
  const [steps, setSteps] = useState(0);
  const [goal, setGoal] = useState(10000);
  const [hourly, setHourly] = useState(new Array(24).fill(0));
  const [isTracking, setIsTracking] = useState(false);
  const [history, setHistory] = useState([]);
  const [weekStats, setWeekStats] = useState(null);
  const [monthStats, setMonthStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [manualInput, setManualInput] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [activeTab, setActiveTab] = useState('today');
  const [motionSupported, setMotionSupported] = useState(true);
  const [activeMinutes, setActiveMinutes] = useState(0);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Refs for accelerometer step detection
  const accelRef = useRef({ lastMag: 0, lastTime: 0, stepBuffer: 0 });
  const stepsRef = useRef(0);
  const hourlyRef = useRef(new Array(24).fill(0));
  const saveTimerRef = useRef(null);
  const activeMinRef = useRef(0);
  const lastActiveMinute = useRef(-1);

  // Sync refs with state
  useEffect(() => { stepsRef.current = steps; }, [steps]);
  useEffect(() => { hourlyRef.current = [...hourly]; }, [hourly]);

  const distanceKm = useMemo(() => {
    const stride = ((user?.height || 170) * 0.00415);
    return parseFloat(((steps * stride) / 1000).toFixed(2));
  }, [steps, user?.height]);

  const caloriesBurned = useMemo(() => {
    return Math.round(steps * 0.04 * ((user?.currentWeight || 70) / 70));
  }, [steps, user?.currentWeight]);

  // Load today's data + stats
  useEffect(() => {
    async function load() {
      try {
        const [todayRes, histRes, statsRes] = await Promise.all([
          API.get(`/steps/today/${today()}`),
          API.get('/steps/history?limit=30'),
          API.get('/steps/stats'),
        ]);
        const d = todayRes.data;
        setSteps(d.steps || 0);
        setGoal(d.goal || 10000);
        setHourly(d.hourly?.length === 24 ? d.hourly : new Array(24).fill(0));
        setActiveMinutes(d.activeMinutes || 0);
        activeMinRef.current = d.activeMinutes || 0;
        setHistory(histRes.data);
        setWeekStats(statsRes.data.week);
        setMonthStats(statsRes.data.month);
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  // Save to server
  const saveToServer = useCallback(async () => {
    try {
      await API.post('/steps', {
        date: today(),
        steps: stepsRef.current,
        goal,
        hourly: hourlyRef.current,
        activeMinutes: activeMinRef.current,
        source: isTracking ? 'accelerometer' : 'manual',
      });
    } catch {}
  }, [goal, isTracking]);

  // Auto-save every 30 seconds while tracking
  useEffect(() => {
    if (!isTracking) return;
    saveTimerRef.current = setInterval(saveToServer, 30000);
    return () => clearInterval(saveTimerRef.current);
  }, [isTracking, saveToServer]);

  // Accelerometer step detection
  const handleMotion = useCallback((e) => {
    const acc = e.accelerationIncludingGravity;
    if (!acc) return;

    const mag = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);
    const now = Date.now();
    const ref = accelRef.current;
    const delta = mag - ref.lastMag;

    // Step detection: magnitude spike > threshold, with debounce
    if (delta > 3.2 && now - ref.lastTime > 280) {
      ref.lastTime = now;
      ref.stepBuffer++;

      if (ref.stepBuffer >= 2) {
        const newSteps = stepsRef.current + ref.stepBuffer;
        stepsRef.current = newSteps;
        setSteps(newSteps);

        const h = new Date().getHours();
        const updated = [...hourlyRef.current];
        updated[h] += ref.stepBuffer;
        hourlyRef.current = updated;
        setHourly(updated);

        const currentMin = Math.floor(now / 60000);
        if (currentMin !== lastActiveMinute.current) {
          lastActiveMinute.current = currentMin;
          activeMinRef.current++;
          setActiveMinutes(activeMinRef.current);
        }

        ref.stepBuffer = 0;
      }
    }
    ref.lastMag = mag;
  }, []);

  const startTracking = useCallback(async () => {
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const perm = await DeviceMotionEvent.requestPermission();
        if (perm !== 'granted') {
          toast.error('Motion sensor permission denied');
          setMotionSupported(false);
          return;
        }
      } catch {
        toast.error('Could not access motion sensor');
        setMotionSupported(false);
        return;
      }
    } else if (typeof DeviceMotionEvent === 'undefined') {
      setMotionSupported(false);
      toast.error('Motion sensor not available on this device');
      return;
    }

    window.addEventListener('devicemotion', handleMotion);
    setIsTracking(true);
    toast.success('Step tracking started');
  }, [handleMotion]);

  const stopTracking = useCallback(() => {
    window.removeEventListener('devicemotion', handleMotion);
    setIsTracking(false);
    saveToServer();
    toast.success(`Tracking paused — ${stepsRef.current.toLocaleString()} steps saved`);
  }, [handleMotion, saveToServer]);

  const addManualSteps = useCallback(() => {
    const val = parseInt(manualInput);
    if (!val || val < 0) return;
    const newSteps = steps + val;
    setSteps(newSteps);
    stepsRef.current = newSteps;

    const h = new Date().getHours();
    const updated = [...hourly];
    updated[h] += val;
    setHourly(updated);
    hourlyRef.current = updated;

    setManualInput('');
    setShowManual(false);

    API.post('/steps', {
      date: today(),
      steps: newSteps,
      goal,
      hourly: updated,
      activeMinutes: activeMinRef.current,
      source: 'manual',
    }).then(() => toast.success(`+${val.toLocaleString()} steps added`))
      .catch(() => toast.error('Failed to save'));
  }, [manualInput, steps, hourly, goal]);

  const adjustGoal = useCallback((delta) => {
    setGoal((g) => {
      const next = Math.max(1000, g + delta);
      API.post('/steps', {
        date: today(),
        steps: stepsRef.current,
        goal: next,
        hourly: hourlyRef.current,
        activeMinutes: activeMinRef.current,
        source: isTracking ? 'accelerometer' : 'manual',
      }).catch(() => {});
      return next;
    });
  }, [isTracking]);

  const resetToday = useCallback(() => {
    setSteps(0);
    stepsRef.current = 0;
    const fresh = new Array(24).fill(0);
    setHourly(fresh);
    hourlyRef.current = fresh;
    activeMinRef.current = 0;
    API.post('/steps', {
      date: today(), steps: 0, goal, hourly: fresh, activeMinutes: 0, source: 'manual',
    }).then(() => toast.success('Steps reset'))
      .catch(() => toast.error('Failed to reset'));
  }, [goal]);

  // Hourly chart data
  const hourlyData = useMemo(() => {
    return hourly.map((v, i) => ({
      hour: i < 12 ? (i === 0 ? '12a' : `${i}a`) : (i === 12 ? '12p' : `${i - 12}p`),
      steps: v,
    }));
  }, [hourly]);

  // History chart data
  const historyData = useMemo(() => {
    return [...history].reverse().slice(-14).map((l) => ({
      date: dayjs(l.date).format('M/D'),
      steps: l.steps,
      goal: l.goal,
    }));
  }, [history]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  const goalMet = steps >= goal;

  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-slate-700/30 px-4 pt-4 pb-3"
        style={{ background: 'linear-gradient(180deg, rgba(10,14,23,0.98) 0%, rgba(10,14,23,0.95) 100%)' }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-orange-600 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-600/15">
            <Footprints size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-black text-white text-lg leading-tight">Step Counter</h1>
            <p className="text-[10px] text-slate-500 font-medium">{dayjs().format('dddd, MMMM D')}</p>
          </div>
          <div className="ml-auto">
            <WalkingFigure isActive={isTracking} />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* Tab switcher */}
        <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl">
          {[
            { key: 'today', label: 'Today' },
            { key: 'history', label: 'History' },
            { key: 'stats', label: 'Stats' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.key
                  ? 'bg-orange-600/20 text-orange-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'today' && (
          <>
            {/* 3D Step Ring */}
            <div className="card overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-600/5 via-transparent to-amber-600/3" />
              {goalMet && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-1 rounded-full bg-emerald-400 animate-ping"
                      style={{
                        left: `${10 + Math.random() * 80}%`,
                        top: `${10 + Math.random() * 80}%`,
                        animationDelay: `${i * 0.3}s`,
                        animationDuration: `${1.5 + Math.random()}s`,
                      }}
                    />
                  ))}
                </div>
              )}
              <div className="relative flex flex-col items-center py-6">
                <StepRing steps={steps} goal={goal} isTracking={isTracking} />

                {goalMet && (
                  <div className="flex items-center gap-2 mt-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                    <Trophy size={14} className="text-emerald-400" />
                    <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">Goal Achieved!</span>
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-3">
              <button
                onClick={isTracking ? stopTracking : startTracking}
                className={`flex-1 py-3.5 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all touch-manipulation ${
                  isTracking
                    ? 'bg-red-600/20 border border-red-500/30 text-red-400 active:bg-red-600/30'
                    : 'bg-gradient-to-r from-orange-600/20 to-amber-600/20 border border-orange-500/30 text-orange-400 active:from-orange-600/30'
                }`}
              >
                {isTracking ? <><Pause size={16} /> Stop</> : <><Play size={16} /> Start Tracking</>}
              </button>
              <button
                onClick={() => setShowManual(!showManual)}
                className="px-4 py-3.5 rounded-xl bg-slate-800/50 border border-slate-700/30 text-slate-400 font-bold text-sm flex items-center gap-2 touch-manipulation active:bg-slate-700/50"
              >
                <Plus size={16} /> Add
              </button>
            </div>

            {!motionSupported && (
              <div className="card p-3 border-l-4 border-l-amber-500">
                <p className="text-xs text-amber-300">
                  <strong>Motion sensor unavailable.</strong> Use "Add" to manually log your steps, or open on a mobile device for auto-tracking.
                </p>
              </div>
            )}

            {/* Manual input */}
            {showManual && (
              <div className="card p-4 flex items-center gap-3">
                <input
                  type="number"
                  placeholder="Steps to add"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="flex-1 bg-slate-800/50 border border-slate-700/40 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-orange-500/50 focus:outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && addManualSteps()}
                />
                <button onClick={addManualSteps}
                  className="px-4 py-2.5 rounded-xl bg-orange-600/15 border border-orange-500/25 text-orange-400 text-xs font-bold touch-manipulation active:bg-orange-600/25">
                  Add
                </button>
              </div>
            )}

            {/* Goal adjuster */}
            <div className="card p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target size={16} className="text-orange-400" />
                <span className="text-xs font-bold text-slate-400">Daily Goal</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => adjustGoal(-1000)}
                  className="w-8 h-8 rounded-lg bg-slate-800/60 border border-slate-700/30 flex items-center justify-center text-slate-400 hover:text-white touch-manipulation">
                  <Minus size={14} />
                </button>
                <span className="text-sm font-black text-white min-w-[60px] text-center">{goal.toLocaleString()}</span>
                <button onClick={() => adjustGoal(1000)}
                  className="w-8 h-8 rounded-lg bg-slate-800/60 border border-slate-700/30 flex items-center justify-center text-slate-400 hover:text-white touch-manipulation">
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Metric cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="card p-4 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shrink-0">
                    <MapPin size={18} className="text-white" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Distance</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-black text-white">{distanceKm}</span>
                      <span className="text-xs text-slate-500">km</span>
                    </div>
                  </div>
                </div>
              </div>
              <StatCard icon={Flame} label="Calories" value={caloriesBurned} unit="kcal"
                color="from-red-600 to-orange-500" glow="from-red-600/5 to-transparent" />
              <StatCard icon={Clock} label="Active Time" value={activeMinutes} unit="min"
                color="from-violet-600 to-purple-500" glow="from-violet-600/5 to-transparent" />
              <StatCard icon={Zap} label="Pace" value={steps > 0 ? Math.round(steps / Math.max(activeMinutes, 1)) : 0} unit="steps/min"
                color="from-amber-600 to-yellow-500" glow="from-amber-600/5 to-transparent" />
            </div>

            {/* Hourly breakdown */}
            <div className="card p-5">
              <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
                <BarChart3 size={16} className="text-orange-400" /> Hourly Activity
              </h3>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 8 }} axisLine={false} tickLine={false} interval={2} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }}
                      formatter={(v) => [`${v} steps`]} />
                    <Bar dataKey="steps" radius={[4, 4, 0, 0]}>
                      {hourlyData.map((entry, i) => {
                        const currentHour = new Date().getHours();
                        return (
                          <Cell key={i} fill={i === currentHour ? '#f97316' : entry.steps > 0 ? 'rgba(251,146,60,0.35)' : 'rgba(30,41,59,0.35)'} />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Reset */}
            <button onClick={() => setShowResetConfirm(true)}
              className="w-full py-2.5 rounded-xl bg-slate-800/30 border border-slate-700/20 text-slate-500 text-xs font-bold flex items-center justify-center gap-2 touch-manipulation hover:text-slate-300 transition-colors">
              <RotateCcw size={13} /> Reset Today's Steps
            </button>
          </>
        )}

        {activeTab === 'history' && (
          <>
            {historyData.length > 1 && (
              <div className="card p-5">
                <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
                  <TrendingUp size={16} className="text-orange-400" /> Daily Steps Trend
                </h3>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historyData}>
                      <defs>
                        <linearGradient id="stepGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }} />
                      <Area type="monotone" dataKey="steps" stroke="#f97316" strokeWidth={2} fill="url(#stepGrad)" dot={{ r: 3, fill: '#f97316' }} />
                      <Area type="monotone" dataKey="goal" stroke="#334155" strokeWidth={1} strokeDasharray="5 5" fill="none" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* History list */}
            <div className="card p-5">
              <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
                <Calendar size={16} className="text-orange-400" /> Recent Days
              </h3>
              {history.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">No step data yet. Start tracking!</div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {history.map((l) => {
                    const pct = Math.round((l.steps / l.goal) * 100);
                    const met = l.steps >= l.goal;
                    return (
                      <div key={l.date} className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-xl">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-800/60 shrink-0">
                          {met ? <Trophy size={16} className="text-emerald-400" /> : <Footprints size={16} className="text-slate-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-white">{dayjs(l.date).format('ddd, MMM D')}</span>
                            <span className={`text-[10px] font-bold ${met ? 'text-emerald-400' : 'text-slate-500'}`}>{pct}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${met ? 'bg-emerald-500' : 'bg-orange-500'}`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500">
                            <span>{l.steps.toLocaleString()} steps</span>
                            <span>{l.distanceKm} km</span>
                            <span>{l.caloriesBurned} kcal</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'stats' && (
          <>
            {/* Weekly Stats */}
            <div className="card p-5">
              <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
                <Award size={16} className="text-orange-400" /> This Week
              </h3>
              {weekStats ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/40 rounded-xl p-3 text-center">
                    <div className="text-lg font-black text-orange-400">{weekStats.avgSteps.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Avg Steps/Day</div>
                  </div>
                  <div className="bg-slate-800/40 rounded-xl p-3 text-center">
                    <div className="text-lg font-black text-emerald-400">{weekStats.daysGoalMet}/{weekStats.totalDays}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Goals Met</div>
                  </div>
                  <div className="bg-slate-800/40 rounded-xl p-3 text-center">
                    <div className="text-lg font-black text-blue-400">{weekStats.totalDistance} km</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Total Distance</div>
                  </div>
                  <div className="bg-slate-800/40 rounded-xl p-3 text-center">
                    <div className="text-lg font-black text-red-400">{weekStats.totalCalories.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Calories Burned</div>
                  </div>
                  <div className="col-span-2 bg-slate-800/40 rounded-xl p-3 text-center">
                    <div className="text-lg font-black text-amber-400">{weekStats.bestDay.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Best Day (Steps)</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 text-sm">Track steps for a week to see stats</div>
              )}
            </div>

            {/* Monthly Stats */}
            <div className="card p-5">
              <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-violet-400" /> This Month
              </h3>
              {monthStats && monthStats.totalDays > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/40 rounded-xl p-3 text-center">
                    <div className="text-lg font-black text-orange-400">{monthStats.avgSteps.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Avg Steps/Day</div>
                  </div>
                  <div className="bg-slate-800/40 rounded-xl p-3 text-center">
                    <div className="text-lg font-black text-emerald-400">{monthStats.daysGoalMet}/{monthStats.totalDays}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Goals Met</div>
                  </div>
                  <div className="bg-slate-800/40 rounded-xl p-3 text-center">
                    <div className="text-lg font-black text-blue-400">{monthStats.totalDistance} km</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Total Distance</div>
                  </div>
                  <div className="bg-slate-800/40 rounded-xl p-3 text-center">
                    <div className="text-lg font-black text-red-400">{monthStats.totalCalories.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Calories Burned</div>
                  </div>
                  <div className="bg-slate-800/40 rounded-xl p-3 text-center">
                    <div className="text-lg font-black text-amber-400">{monthStats.totalSteps.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Total Steps</div>
                  </div>
                  <div className="bg-slate-800/40 rounded-xl p-3 text-center">
                    <div className="text-lg font-black text-violet-400">{monthStats.bestDay.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Best Day</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 text-sm">Track steps for a month to see stats</div>
              )}
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={showResetConfirm}
        variant="reset"
        title="Reset Today's Steps?"
        message="This will reset your step count, active minutes, and all hourly data for today back to zero."
        confirmText="Reset Steps"
        cancelText="Keep Data"
        onConfirm={() => { setShowResetConfirm(false); resetToday(); }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
}
