import { useRef, useEffect, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMusic } from '../context/MusicContext';
import { formatDuration } from '../services/musicApi';
import {
  ChevronDown, Play, Pause, SkipForward, SkipBack,
  Shuffle, Repeat, Repeat1, Volume2, VolumeX,
  ListMusic, Loader2, Music, Heart, X, Trash2,
  RotateCcw, RotateCw, Timer, Gauge, Moon,
} from 'lucide-react';

// ── Audio Visualizer ─────────────────────────────────────────────────────────
function AudioVisualizer({ data, isPlaying }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      if (!data || !isPlaying) {
        for (let i = 0; i < 64; i++) {
          ctx.fillStyle = 'rgba(239,68,68,0.15)';
          ctx.fillRect((i / 64) * w, h - 2 - Math.random() * 3, w / 64 - 2, 2 + Math.random() * 3);
        }
        animRef.current = requestAnimationFrame(draw);
        return;
      }
      const len = Math.min(data.length, 64);
      const barW = w / len;
      for (let i = 0; i < len; i++) {
        const val = data[i] / 255;
        const barH = Math.max(2, val * h * 0.8);
        const x = i * barW;
        const grad = ctx.createLinearGradient(x, h, x, h - barH);
        grad.addColorStop(0, `rgba(239,68,68,${0.4 + val * 0.6})`);
        grad.addColorStop(0.5, `rgba(249,115,22,${0.3 + val * 0.5})`);
        grad.addColorStop(1, `rgba(251,146,60,${0.1 + val * 0.3})`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x + 1, h - barH, barW - 2, barH, 2);
        else ctx.rect(x + 1, h - barH, barW - 2, barH);
        ctx.fill();
        ctx.shadowColor = `rgba(239,68,68,${val * 0.4})`;
        ctx.shadowBlur = val * 12;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [data, isPlaying]);

  return <canvas ref={canvasRef} className="w-full h-full" style={{ display: 'block' }} />;
}

// ── Queue Panel ──────────────────────────────────────────────────────────────
function QueuePanel({ queue, queueIndex, onPlay, onRemove, onClear }) {
  const listRef = useRef(null);
  const totalDur = queue.reduce((s, t) => s + (t.duration || 0), 0);

  useEffect(() => {
    if (listRef.current && queueIndex >= 0) {
      const el = listRef.current.children[queueIndex];
      if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [queueIndex]);

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="px-4 pt-2 pb-2 flex items-center justify-between">
        <div>
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Queue</span>
          <span className="text-[10px] text-slate-600 ml-2">{queue.length} tracks · {formatDuration(totalDur)}</span>
        </div>
        {queue.length > 0 && (
          <button onClick={onClear} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <Trash2 size={10} /> Clear
          </button>
        )}
      </div>
      <div ref={listRef} className="flex-1 overflow-y-auto px-2 pb-4 space-y-1 scrollbar-hide">
        {queue.map((track, i) => (
          <div
            key={`${track.id}-${i}`}
            className={`group flex items-center gap-3 p-2 rounded-xl transition-all ${
              i === queueIndex ? 'bg-red-500/10 border border-red-500/20' : 'hover:bg-white/[0.03]'
            }`}
          >
            <button onClick={() => onPlay(i)} className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0">
              {track.imageSmall ? <img src={track.imageSmall} alt="" className="w-full h-full object-cover" /> : (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center text-xs">🎵</div>
              )}
              {i === queueIndex && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Music size={12} className="text-red-400" />
                </div>
              )}
            </button>
            <button onClick={() => onPlay(i)} className="flex-1 min-w-0 text-left">
              <div className={`text-[11px] font-bold truncate ${i === queueIndex ? 'text-red-400' : 'text-white'}`}>{track.name}</div>
              <div className="text-[10px] text-slate-600 truncate">{track.artist}</div>
            </button>
            <span className="text-[10px] text-slate-700 font-mono shrink-0">{formatDuration(track.duration)}</span>
            <button
              onClick={() => onRemove(i)}
              className="w-6 h-6 rounded-md hover:bg-red-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
            >
              <X size={12} className="text-slate-600 hover:text-red-400" />
            </button>
          </div>
        ))}
        {queue.length === 0 && (
          <div className="text-center py-12 text-slate-600 text-xs">Queue is empty</div>
        )}
      </div>
    </div>
  );
}

// ── Sleep Timer Picker ───────────────────────────────────────────────────────
const SLEEP_OPTIONS = [
  { label: 'Off', min: 0 },
  { label: '15 min', min: 15 },
  { label: '30 min', min: 30 },
  { label: '45 min', min: 45 },
  { label: '60 min', min: 60 },
  { label: '90 min', min: 90 },
];

function SleepTimerPicker({ active, remaining, onSet, onClose }) {
  return (
    <div className="absolute bottom-full right-0 mb-2 w-44 rounded-xl border border-slate-700/40 shadow-2xl shadow-black/50 overflow-hidden" style={{ background: 'rgba(15,20,35,0.98)', backdropFilter: 'blur(20px)' }}>
      <div className="px-3 pt-3 pb-1 flex items-center justify-between">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Sleep Timer</span>
        <button onClick={onClose} className="text-slate-600 hover:text-white"><X size={12} /></button>
      </div>
      {active && (
        <div className="px-3 py-1.5 text-[11px] text-amber-400 font-bold flex items-center gap-1.5">
          <Moon size={11} /> {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')} left
        </div>
      )}
      <div className="p-1.5 space-y-0.5">
        {SLEEP_OPTIONS.map((opt) => (
          <button
            key={opt.min}
            onClick={() => { onSet(opt.min); onClose(); }}
            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              active && opt.min === 0 ? 'text-red-400 hover:bg-red-500/10' :
              !active && opt.min === 0 ? 'text-slate-600' :
              'text-slate-300 hover:bg-white/5'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Speed Picker ─────────────────────────────────────────────────────────────
const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

function SpeedPicker({ current, onSet, onClose }) {
  return (
    <div className="absolute bottom-full left-0 mb-2 w-36 rounded-xl border border-slate-700/40 shadow-2xl shadow-black/50 overflow-hidden" style={{ background: 'rgba(15,20,35,0.98)', backdropFilter: 'blur(20px)' }}>
      <div className="px-3 pt-3 pb-1 flex items-center justify-between">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Speed</span>
        <button onClick={onClose} className="text-slate-600 hover:text-white"><X size={12} /></button>
      </div>
      <div className="p-1.5 space-y-0.5">
        {SPEED_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => { onSet(s); onClose(); }}
            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              s === current ? 'text-red-400 bg-red-500/10' : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Full Player ──────────────────────────────────────────────────────────────
export default function FullPlayer() {
  const {
    currentTrack, queue, queueIndex, isPlaying, progress, elapsed, duration,
    volume, shuffle, repeat, speed, loading, fullPlayerOpen, analyserData,
    sleepTimer, sleepRemaining,
    togglePlay, playNext, playPrev, seekTo, skipForward, skipBackward,
    setVolume, setSpeed, toggleShuffle, cycleRepeat,
    setFullPlayerOpen, playTrack, removeFromQueue, clearQueue,
    isLiked, toggleLike, setSleepTimer,
  } = useMusic();

  const [showQueue, setShowQueue] = useState(false);
  const [showSleep, setShowSleep] = useState(false);
  const [showSpeed, setShowSpeed] = useState(false);
  const progressBarRef = useRef(null);
  const volumeBarRef = useRef(null);

  const remaining = duration ? duration - elapsed : 0;
  const liked = currentTrack ? isLiked(currentTrack.id) : false;

  const handleProgressClick = useCallback((e) => {
    const bar = progressBarRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    seekTo(Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)));
  }, [seekTo]);

  const handleVolumeClick = useCallback((e) => {
    const bar = volumeBarRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    setVolume(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
  }, [setVolume]);

  const handleQueuePlay = useCallback((idx) => {
    if (queue[idx]) playTrack(queue[idx]);
  }, [queue, playTrack]);

  useEffect(() => {
    if (fullPlayerOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [fullPlayerOpen]);

  if (!fullPlayerOpen || !currentTrack) return null;

  const repeatIcon = repeat === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex flex-col" style={{ background: '#0a0e17' }}>
      {/* Blurred album art background */}
      {currentTrack.image && (
        <div className="absolute inset-0 overflow-hidden">
          <img src={currentTrack.image} alt="" className="w-full h-full object-cover scale-110 blur-3xl opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-[#0a0e17]/80 to-[#0a0e17]" />
        </div>
      )}

      {/* ── Top Bar ── */}
      <div className="relative flex items-center justify-between px-4 py-3 pt-safe">
        <button onClick={() => setFullPlayerOpen(false)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all active:scale-90">
          <ChevronDown size={20} className="text-white" />
        </button>
        <div className="text-center">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Now Playing</div>
          {sleepTimer && (
            <div className="text-[9px] text-amber-400/70 mt-0.5 flex items-center justify-center gap-1">
              <Moon size={8} /> Sleep in {Math.ceil(sleepRemaining / 60)}m
            </div>
          )}
        </div>
        <button onClick={() => setShowQueue((v) => !v)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 ${showQueue ? 'bg-red-500/15 text-red-400' : 'bg-white/5 text-white hover:bg-white/10'}`}>
          <ListMusic size={18} />
        </button>
      </div>

      {showQueue ? (
        <QueuePanel queue={queue} queueIndex={queueIndex} onPlay={handleQueuePlay} onRemove={removeFromQueue} onClear={clearQueue} />
      ) : (
        <div className="relative flex-1 flex flex-col items-center justify-center px-6 gap-3 overflow-hidden">
          {/* Album Art */}
          <div className={`relative w-60 h-60 sm:w-68 sm:h-68 md:w-76 md:h-76 rounded-3xl overflow-hidden shadow-2xl shadow-black/60 transition-transform duration-700 ${isPlaying ? 'scale-100' : 'scale-95'}`}>
            {currentTrack.image ? (
              <img src={currentTrack.image} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-red-600/30 to-orange-500/20 flex items-center justify-center">
                <Music size={56} className="text-white/30" />
              </div>
            )}
            {isPlaying && (
              <div className="absolute inset-0 pointer-events-none rounded-3xl" style={{ boxShadow: 'inset 0 0 60px rgba(239,68,68,0.08), 0 0 40px rgba(239,68,68,0.1)' }} />
            )}
          </div>

          {/* Track Info + Like */}
          <div className="text-center w-full max-w-sm mt-1">
            <div className="flex items-center justify-center gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-black text-white truncate">{currentTrack.name}</h2>
                <p className="text-sm text-slate-400 truncate mt-0.5">{currentTrack.artist}</p>
              </div>
              <button
                onClick={() => toggleLike(currentTrack)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 ${liked ? 'text-red-400 bg-red-500/10' : 'text-slate-600 hover:text-slate-400'}`}
              >
                <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
              </button>
            </div>
            {currentTrack.album && (
              <p className="text-[10px] text-slate-600 mt-1 truncate">{currentTrack.album} {currentTrack.year ? `· ${currentTrack.year}` : ''}</p>
            )}
          </div>
        </div>
      )}

      {/* ── Bottom Controls ── */}
      <div className="relative px-6 pb-6 pb-safe">
        {/* Visualizer */}
        <div className="h-10 mb-2 rounded-xl overflow-hidden">
          <AudioVisualizer data={analyserData} isPlaying={isPlaying} />
        </div>

        {/* Progress Bar */}
        <div className="mb-2">
          <div ref={progressBarRef} className="h-2 bg-slate-800/60 rounded-full cursor-pointer group relative" onClick={handleProgressClick}>
            <div className="h-full bg-gradient-to-r from-red-500 to-orange-400 rounded-full transition-all relative" style={{ width: `${progress}%` }}>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-lg shadow-red-500/30 opacity-0 group-hover:opacity-100 transition-opacity" style={{ transform: 'translate(50%, -50%)' }} />
            </div>
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-slate-600 font-mono">{formatDuration(elapsed)}</span>
            <span className="text-[10px] text-slate-600 font-mono">-{formatDuration(remaining)}</span>
          </div>
        </div>

        {/* Main Controls Row */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <button onClick={toggleShuffle} className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 ${shuffle ? 'text-red-400 bg-red-500/10' : 'text-slate-500 hover:text-white'}`}>
            <Shuffle size={16} />
          </button>

          <button onClick={playPrev} className="w-11 h-11 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all active:scale-90">
            <SkipBack size={18} className="text-white" />
          </button>

          <button onClick={() => skipBackward(10)} className="w-9 h-9 rounded-full hover:bg-white/5 flex items-center justify-center transition-all active:scale-90 relative">
            <RotateCcw size={16} className="text-slate-400" />
            <span className="absolute text-[7px] font-black text-slate-400">10</span>
          </button>

          <button onClick={togglePlay} className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all active:scale-90">
            {loading ? <Loader2 size={28} className="text-white animate-spin" /> : isPlaying ? <Pause size={28} className="text-white" /> : <Play size={28} className="text-white ml-1" />}
          </button>

          <button onClick={() => skipForward(10)} className="w-9 h-9 rounded-full hover:bg-white/5 flex items-center justify-center transition-all active:scale-90 relative">
            <RotateCw size={16} className="text-slate-400" />
            <span className="absolute text-[7px] font-black text-slate-400">10</span>
          </button>

          <button onClick={playNext} className="w-11 h-11 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all active:scale-90">
            <SkipForward size={18} className="text-white" />
          </button>

          <button onClick={cycleRepeat} className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 ${repeat !== 'off' ? 'text-red-400 bg-red-500/10' : 'text-slate-500 hover:text-white'}`}>
            {repeatIcon}
          </button>
        </div>

        {/* Extras Row: Speed · Volume · Sleep */}
        <div className="flex items-center justify-between">
          {/* Speed */}
          <div className="relative">
            <button
              onClick={() => { setShowSpeed((v) => !v); setShowSleep(false); }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all active:scale-95 ${
                speed !== 1 ? 'text-red-400 bg-red-500/10' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              <Gauge size={12} /> {speed}x
            </button>
            {showSpeed && <SpeedPicker current={speed} onSet={setSpeed} onClose={() => setShowSpeed(false)} />}
          </div>

          {/* Volume (desktop) */}
          <div className="hidden lg:flex items-center gap-2 flex-1 max-w-[180px] mx-4">
            <button onClick={() => setVolume(volume > 0 ? 0 : 0.8)} className="text-slate-500 hover:text-white transition-colors">
              {volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <div ref={volumeBarRef} className="flex-1 h-1.5 bg-slate-800 rounded-full cursor-pointer group" onClick={handleVolumeClick}>
              <div className="h-full bg-white/40 rounded-full transition-all relative" style={{ width: `${volume * 100}%` }}>
                <div className="absolute right-0 top-1/2 w-3 h-3 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity" style={{ transform: 'translate(50%, -50%)' }} />
              </div>
            </div>
            <span className="text-[9px] text-slate-600 font-mono w-7 text-right">{Math.round(volume * 100)}</span>
          </div>

          {/* Sleep Timer */}
          <div className="relative">
            <button
              onClick={() => { setShowSleep((v) => !v); setShowSpeed(false); }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all active:scale-95 ${
                sleepTimer ? 'text-amber-400 bg-amber-500/10' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              <Timer size={12} /> {sleepTimer ? `${Math.ceil(sleepRemaining / 60)}m` : 'Sleep'}
            </button>
            {showSleep && <SleepTimerPicker active={!!sleepTimer} remaining={sleepRemaining} onSet={setSleepTimer} onClose={() => setShowSleep(false)} />}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
