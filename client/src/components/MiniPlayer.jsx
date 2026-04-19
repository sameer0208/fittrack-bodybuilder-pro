import { useMusic } from '../context/MusicContext';
import { formatDuration } from '../services/musicApi';
import { Play, Pause, SkipForward, Loader2, Heart } from 'lucide-react';

export default function MiniPlayer() {
  const {
    currentTrack, isPlaying, progress, elapsed, duration, loading,
    togglePlay, playNext, setFullPlayerOpen,
    isLiked, toggleLike,
  } = useMusic();

  if (!currentTrack) return null;

  const liked = isLiked(currentTrack.id);
  const remaining = duration ? duration - elapsed : 0;

  return (
    <>
      {/* ── Desktop mini-player — bottom-right floating ── */}
      <div
        className="hidden lg:flex fixed bottom-4 right-4 z-[9996] w-[360px] items-center gap-3 p-2 pr-3 rounded-2xl border border-slate-700/40 shadow-2xl shadow-black/50 cursor-pointer group"
        style={{ background: 'linear-gradient(135deg, rgba(15,20,35,0.96) 0%, rgba(20,25,40,0.98) 100%)', backdropFilter: 'blur(20px)' }}
        onClick={() => setFullPlayerOpen(true)}
      >
        <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-lg">
          {currentTrack.imageSmall ? (
            <img src={currentTrack.imageSmall} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center text-lg">🎵</div>
          )}
          {isPlaying && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center gap-[2px]">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-[3px] bg-white rounded-full animate-pulse" style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-white truncate">{currentTrack.name}</div>
          <div className="text-[10px] text-slate-500 truncate mt-0.5">{currentTrack.artist}</div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-red-500 to-orange-400 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-[9px] text-slate-600 font-mono">{formatDuration(elapsed)}</span>
          </div>
        </div>

        <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => toggleLike(currentTrack)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 ${liked ? 'text-red-400' : 'text-slate-600 hover:text-slate-400'}`}>
            <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
          </button>
          <button onClick={togglePlay} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center transition-all active:scale-90">
            {loading ? <Loader2 size={16} className="text-white animate-spin" /> : isPlaying ? <Pause size={16} className="text-white" /> : <Play size={16} className="text-white ml-0.5" />}
          </button>
          <button onClick={playNext} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-all active:scale-90">
            <SkipForward size={14} className="text-slate-400" />
          </button>
        </div>
      </div>

      {/* ── Mobile mini-player — above bottom nav ── */}
      <div
        className="lg:hidden fixed left-0 right-0 z-[9998] shadow-[0_-8px_30px_rgba(0,0,0,0.6)]"
        style={{ bottom: '64px' }}
      >
        <div className="h-[2px] bg-slate-800/80">
          <div className="h-full bg-gradient-to-r from-red-500 to-orange-400 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <div
          className="flex items-center gap-3 px-3 py-2"
          style={{ background: 'linear-gradient(180deg, rgba(15,20,35,0.97) 0%, rgba(12,16,28,0.99) 100%)', backdropFilter: 'blur(20px)' }}
          onClick={() => setFullPlayerOpen(true)}
        >
          <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 shadow-lg">
            {currentTrack.imageSmall ? (
              <img src={currentTrack.imageSmall} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center text-sm">🎵</div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold text-white truncate">{currentTrack.name}</div>
            <div className="text-[10px] text-slate-500 truncate">{currentTrack.artist}</div>
          </div>

          <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => toggleLike(currentTrack)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 ${liked ? 'text-red-400' : 'text-slate-600'}`}>
              <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
            </button>
            <button onClick={togglePlay} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center transition-all active:scale-90">
              {loading ? <Loader2 size={16} className="text-white animate-spin" /> : isPlaying ? <Pause size={16} className="text-white" /> : <Play size={16} className="text-white ml-0.5" />}
            </button>
            <button onClick={playNext} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-all active:scale-90">
              <SkipForward size={14} className="text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
