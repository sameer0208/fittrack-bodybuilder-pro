import { useRef, useEffect, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSteps } from '../context/StepContext';
import { useMusic } from '../context/MusicContext';
import { Pause, Footprints, ChevronRight } from 'lucide-react';

function MiniRing({ progress, size = 44, stroke = 3.5 }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const pRef = useRef(0);
  const glowT = useRef(0);

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
    const r = (size - stroke * 2) / 2 - 1;
    const start = -Math.PI / 2;

    function draw() {
      pRef.current += (progress - pRef.current) * 0.08;
      glowT.current += 0.04;
      const p = pRef.current;
      const pulse = 0.5 + Math.sin(glowT.current) * 0.5;

      ctx.clearRect(0, 0, size, size);

      // bg ring
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(100,116,139,0.15)';
      ctx.lineWidth = stroke;
      ctx.stroke();

      if (p > 0.001) {
        const end = start + Math.PI * 2 * Math.min(p, 1);

        // glow
        ctx.save();
        ctx.shadowColor = p >= 1 ? 'rgba(16,185,129,0.8)' : 'rgba(249,115,22,0.7)';
        ctx.shadowBlur = 8 * pulse;
        ctx.beginPath();
        ctx.arc(cx, cy, r, start, end);
        ctx.strokeStyle = 'transparent';
        ctx.lineWidth = stroke;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();

        // arc
        const grad = ctx.createConicGradient(start, cx, cy);
        if (p >= 1) {
          grad.addColorStop(0, '#10b981');
          grad.addColorStop(0.5, '#34d399');
          grad.addColorStop(1, '#6ee7b7');
        } else {
          grad.addColorStop(0, '#f97316');
          grad.addColorStop(0.5, '#eab308');
          grad.addColorStop(1, '#22c55e');
        }
        ctx.beginPath();
        ctx.arc(cx, cy, r, start, end);
        ctx.strokeStyle = grad;
        ctx.lineWidth = stroke;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [progress, size, stroke]);

  return <canvas ref={canvasRef} className="shrink-0" />;
}

function WalkDots() {
  return (
    <div className="flex gap-[3px] items-end h-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block w-[3px] rounded-full bg-orange-400"
          style={{
            animation: `miniWalk 0.8s ease-in-out ${i * 0.15}s infinite alternate`,
          }}
        />
      ))}
      <style>{`
        @keyframes miniWalk {
          0% { height: 4px; opacity: 0.4; }
          100% { height: 10px; opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default function MiniStepWidget() {
  const ctx = useSteps();
  const { currentTrack: musicPlaying } = useMusic();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [expanded, setExpanded] = useState(false);
  const collapseTimer = useRef(null);

  const onStepsPage = pathname === '/steps';
  const visible = ctx?.isTracking && !onStepsPage;

  const handleExpand = useCallback(() => {
    setExpanded(true);
    clearTimeout(collapseTimer.current);
    collapseTimer.current = setTimeout(() => setExpanded(false), 4000);
  }, []);

  const handleNavigate = useCallback(() => {
    navigate('/steps');
  }, [navigate]);

  useEffect(() => () => clearTimeout(collapseTimer.current), []);

  if (!visible) return null;

  const { steps, goal, progress, stopTracking, distanceKm, caloriesBurned } = ctx;
  const pct = Math.round(progress * 100);
  const goalMet = steps >= goal;

  // Position: left side, above bottom nav on mobile, lower-left on desktop
  // Account for music mini-player
  const bottomMobile = musicPlaying ? 'bottom-[8.5rem]' : 'bottom-[4.5rem]';

  const widget = (
    <div
      className={`fixed left-3 ${bottomMobile} lg:left-6 lg:bottom-6 z-[9996] select-none`}
      style={{ pointerEvents: 'auto' }}
    >
      {/* Outer glow pulse */}
      <div
        className="absolute inset-0 rounded-2xl opacity-60"
        style={{
          background: goalMet
            ? 'radial-gradient(circle, rgba(16,185,129,0.25) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(249,115,22,0.2) 0%, transparent 70%)',
          animation: 'stepWidgetPulse 2s ease-in-out infinite',
          transform: 'scale(1.4)',
        }}
      />

      <div
        onClick={handleExpand}
        className={`relative flex items-center gap-2.5 rounded-2xl border backdrop-blur-xl cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-95 touch-manipulation overflow-hidden ${
          expanded ? 'pr-3 pl-2 py-2' : 'p-2'
        } ${
          goalMet
            ? 'bg-emerald-950/80 border-emerald-500/30 shadow-lg shadow-emerald-500/20'
            : 'bg-slate-950/85 border-orange-500/25 shadow-lg shadow-orange-500/15'
        }`}
      >
        {/* Shimmer sweep */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.04) 50%, transparent 60%)',
            animation: 'stepShimmer 3s ease-in-out infinite',
          }}
        />

        {/* Ring + icon */}
        <div className="relative shrink-0">
          <MiniRing progress={progress} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Footprints
              size={16}
              className={`${goalMet ? 'text-emerald-400' : 'text-orange-400'}`}
              style={{ animation: 'stepBounce 1s ease-in-out infinite' }}
            />
          </div>
        </div>

        {/* Compact: just step count */}
        {!expanded && (
          <div className="flex flex-col items-start mr-1">
            <span className="text-[11px] font-black text-white leading-tight tracking-tight">
              {steps.toLocaleString()}
            </span>
            <span className={`text-[8px] font-bold leading-tight ${goalMet ? 'text-emerald-400' : 'text-orange-400/70'}`}>
              {pct}%
            </span>
          </div>
        )}

        {/* Expanded details */}
        {expanded && (
          <div className="flex items-center gap-3 animate-[fadeSlideIn_0.3s_ease-out]">
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-white leading-tight tracking-tight">
                  {steps.toLocaleString()}
                </span>
                <WalkDots />
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] text-slate-400 font-bold">{distanceKm} km</span>
                <span className="text-[9px] text-slate-600">·</span>
                <span className="text-[9px] text-slate-400 font-bold">{caloriesBurned} kcal</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 ml-1">
              <button
                onClick={(e) => { e.stopPropagation(); stopTracking(); }}
                className="w-7 h-7 rounded-lg bg-red-500/15 border border-red-500/25 flex items-center justify-center text-red-400 hover:bg-red-500/25 active:scale-90 transition-all"
                title="Pause tracking"
              >
                <Pause size={12} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleNavigate(); }}
                className={`w-7 h-7 rounded-lg flex items-center justify-center active:scale-90 transition-all ${
                  goalMet
                    ? 'bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/25'
                    : 'bg-orange-500/15 border border-orange-500/25 text-orange-400 hover:bg-orange-500/25'
                }`}
                title="Open Step Counter"
              >
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes stepWidgetPulse {
          0%, 100% { opacity: 0.4; transform: scale(1.3); }
          50% { opacity: 0.7; transform: scale(1.5); }
        }
        @keyframes stepShimmer {
          0% { transform: translateX(-100%); }
          50%, 100% { transform: translateX(200%); }
        }
        @keyframes stepBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-1.5px); }
        }
        @keyframes fadeSlideIn {
          0% { opacity: 0; transform: translateX(-8px); }
          100% { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );

  return createPortal(widget, document.body);
}
