import { useState, useCallback, useRef } from 'react';
import { useMusic } from '../context/MusicContext';
import { searchSongs, WORKOUT_CATEGORIES, formatDuration } from '../services/musicApi';
import {
  Search, X, Play, Pause, Music, Loader2, Plus, Heart,
  Headphones, TrendingUp, Clock, Sparkles, ArrowLeft, ListMusic,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Song Row ─────────────────────────────────────────────────────────────────
function SongRow({ track, isActive, isPlaying, onPlay, onQueue, liked, onLike }) {
  return (
    <div className={`group flex items-center gap-3 p-2.5 rounded-xl transition-all ${
      isActive ? 'bg-red-500/10 border border-red-500/15' : 'hover:bg-white/[0.03]'
    }`}>
      <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 shadow-md cursor-pointer" onClick={onPlay}>
        {track.imageSmall ? (
          <img src={track.imageSmall} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center"><Music size={16} className="text-slate-500" /></div>
        )}
        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          {isActive && isPlaying ? (
            <div className="flex items-center gap-[2px]">
              {[0, 1, 2].map((i) => <div key={i} className="w-[2px] bg-red-400 rounded-full animate-pulse" style={{ height: `${6 + i * 3}px`, animationDelay: `${i * 120}ms` }} />)}
            </div>
          ) : (
            <Play size={16} className="text-white ml-0.5" />
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0 cursor-pointer" onClick={onPlay}>
        <div className={`text-xs font-bold truncate ${isActive ? 'text-red-400' : 'text-white'}`}>{track.name}</div>
        <div className="text-[10px] text-slate-500 truncate mt-0.5">{track.artist}</div>
      </div>

      <span className="text-[10px] text-slate-700 font-mono shrink-0">{formatDuration(track.duration)}</span>

      <button
        onClick={(e) => { e.stopPropagation(); onLike(); }}
        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90 ${
          liked ? 'text-red-400' : 'text-slate-700 opacity-0 group-hover:opacity-100 hover:text-red-400'
        }`}
      >
        <Heart size={13} fill={liked ? 'currentColor' : 'none'} />
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); onQueue(); }}
        className="w-7 h-7 rounded-lg bg-white/[0.03] hover:bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all active:scale-90"
        title="Add to queue"
      >
        <Plus size={14} className="text-slate-500" />
      </button>
    </div>
  );
}

// ── Category Card ────────────────────────────────────────────────────────────
function CategoryCard({ cat, onClick }) {
  return (
    <button
      onClick={onClick}
      className="relative overflow-hidden rounded-2xl p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98] touch-manipulation group min-h-[88px]"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-80 group-hover:opacity-100 transition-opacity`} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15)_0%,transparent_60%)]" />
      <div className="relative">
        <span className="text-2xl block mb-1">{cat.emoji}</span>
        <div className="text-sm font-black text-white leading-tight">{cat.label}</div>
      </div>
    </button>
  );
}

// ── Horizontal Scroll Track List ─────────────────────────────────────────────
function HScrollTracks({ tracks, onPlay, title, icon: Icon, iconClass }) {
  if (!tracks.length) return null;
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3 px-1">
        <Icon size={14} className={iconClass || 'text-slate-500'} />
        <span className="text-xs font-black text-slate-400 uppercase tracking-wider">{title}</span>
        <span className="text-[10px] text-slate-700">{tracks.length}</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        {tracks.map((track, i) => (
          <button key={`${track.id}-${i}`} onClick={() => onPlay(track, i)} className="shrink-0 w-28 group text-left">
            <div className="relative w-28 h-28 rounded-xl overflow-hidden shadow-lg mb-2">
              {track.imageSmall ? (
                <img src={track.imageSmall} alt="" className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center"><Music size={24} className="text-slate-600" /></div>
              )}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-red-500/90 flex items-center justify-center shadow-lg">
                  <Play size={16} className="text-white ml-0.5" />
                </div>
              </div>
            </div>
            <div className="text-[11px] font-bold text-white truncate">{track.name}</div>
            <div className="text-[10px] text-slate-600 truncate">{track.artist}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
const RECENT_KEY = 'ft_music_recent';

export default function MusicHome() {
  const {
    currentTrack, isPlaying, likedSongs,
    playQueue, playTrack, addToQueue,
    isLiked, toggleLike,
  } = useMusic();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [catResults, setCatResults] = useState([]);
  const [catLoading, setCatLoading] = useState(false);
  const [showLiked, setShowLiked] = useState(false);
  const [recentTracks, setRecentTracks] = useState(() => {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch { return []; }
  });
  const searchTimeout = useRef(null);
  const inputRef = useRef(null);

  const saveRecent = useCallback((track) => {
    setRecentTracks((prev) => {
      const next = [track, ...prev.filter((t) => t.id !== track.id)].slice(0, 20);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const handleSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const songs = await searchSongs(q, 25);
      setResults(songs);
      setActiveCategory(null);
      setShowLiked(false);
    } catch { toast.error('Search failed'); }
    finally { setSearching(false); }
  }, []);

  const handleInputChange = useCallback((e) => {
    const val = e.target.value;
    setQuery(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => handleSearch(val), 400);
  }, [handleSearch]);

  const handleCategoryClick = useCallback(async (cat) => {
    setActiveCategory(cat);
    setShowLiked(false);
    setQuery('');
    setResults([]);
    setCatLoading(true);
    try {
      const songs = await searchSongs(cat.query, 30);
      setCatResults(songs);
    } catch { toast.error('Failed to load category'); setCatResults([]); }
    finally { setCatLoading(false); }
  }, []);

  const goBack = useCallback(() => {
    setActiveCategory(null);
    setShowLiked(false);
    setCatResults([]);
    setQuery('');
    setResults([]);
  }, []);

  const handlePlaySong = useCallback((tracks, idx) => {
    playQueue(tracks, idx);
    saveRecent(tracks[idx]);
  }, [playQueue, saveRecent]);

  const handlePlaySingle = useCallback((track, idx) => {
    if (recentTracks.length > 0) {
      playQueue(recentTracks, recentTracks.findIndex((t) => t.id === track.id));
    } else {
      playTrack(track);
    }
    saveRecent(track);
  }, [playTrack, playQueue, saveRecent, recentTracks]);

  const handlePlayLikedSingle = useCallback((track, idx) => {
    playQueue(likedSongs, likedSongs.findIndex((t) => t.id === track.id));
  }, [playQueue, likedSongs]);

  const handleAddToQueue = useCallback((track) => {
    addToQueue(track);
    toast.success('Added to queue', { duration: 1500, style: { fontSize: '12px' } });
  }, [addToQueue]);

  const displayedSongs = activeCategory ? catResults : results;
  const showHome = !activeCategory && !showLiked && results.length === 0;
  const isInSubView = activeCategory || showLiked;

  return (
    <div className="page-container">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-6">
          {isInSubView && (
            <button onClick={goBack} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all active:scale-90 shrink-0">
              <ArrowLeft size={18} className="text-white" />
            </button>
          )}
          {!isInSubView && (
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center shadow-lg shadow-red-600/20 shrink-0">
              <Headphones size={22} className="text-white" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-white leading-tight truncate">
              {showLiked ? 'Liked Songs' : activeCategory ? activeCategory.label : 'Music'}
            </h1>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              {showLiked
                ? `${likedSongs.length} songs · ${formatDuration(likedSongs.reduce((s, t) => s + (t.duration || 0), 0))}`
                : activeCategory
                  ? `${catResults.length} tracks`
                  : 'Fuel your workout with the perfect beats'}
            </p>
          </div>
          {/* Play All button for sub-views */}
          {isInSubView && (showLiked ? likedSongs : catResults).length > 0 && (
            <button
              onClick={() => playQueue(showLiked ? likedSongs : catResults, 0)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold shadow-lg shadow-red-500/20 hover:shadow-red-500/40 transition-all active:scale-95 shrink-0"
            >
              <Play size={14} className="ml-0.5" /> Play All
            </button>
          )}
        </div>

        {/* ── Search Bar ── */}
        <div className="relative mb-6">
          <div className="relative flex items-center">
            <Search size={16} className="absolute left-3.5 text-slate-500 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              placeholder="Search songs, artists, albums..."
              className="w-full pl-10 pr-10 py-3 bg-slate-800/50 border border-slate-700/40 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-500/30 focus:ring-1 focus:ring-red-500/20 transition-all"
            />
            {(query || isInSubView) && (
              <button
                onClick={() => { setQuery(''); setResults([]); if (!isInSubView) inputRef.current?.focus(); }}
                className="absolute right-3 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
              >
                <X size={12} className="text-slate-400" />
              </button>
            )}
          </div>
          {searching && <div className="absolute right-12 top-1/2 -translate-y-1/2"><Loader2 size={16} className="text-red-400 animate-spin" /></div>}
        </div>

        {/* ── Liked Songs View ── */}
        {showLiked && !catLoading && (
          <div className="space-y-1">
            {likedSongs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-3">
                  <Heart size={28} className="text-red-400/40" />
                </div>
                <div className="text-sm font-bold text-slate-400">No liked songs yet</div>
                <div className="text-xs text-slate-600 mt-1">Tap the heart on any song to add it here</div>
              </div>
            ) : likedSongs.map((track, idx) => (
              <SongRow
                key={track.id}
                track={track}
                idx={idx}
                isActive={currentTrack?.id === track.id}
                isPlaying={currentTrack?.id === track.id && isPlaying}
                onPlay={() => handlePlayLikedSingle(track, idx)}
                onQueue={() => handleAddToQueue(track)}
                liked={true}
                onLike={() => toggleLike(track)}
              />
            ))}
          </div>
        )}

        {/* ── Category Results ── */}
        {activeCategory && catLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={28} className="text-red-400 animate-spin" />
              <span className="text-xs text-slate-500 font-medium">Loading tracks...</span>
            </div>
          </div>
        )}

        {activeCategory && !catLoading && catResults.length > 0 && (
          <div className="space-y-1">
            {catResults.map((track, idx) => (
              <SongRow
                key={`${track.id}-${idx}`}
                track={track}
                idx={idx}
                isActive={currentTrack?.id === track.id}
                isPlaying={currentTrack?.id === track.id && isPlaying}
                onPlay={() => handlePlaySong(catResults, idx)}
                onQueue={() => handleAddToQueue(track)}
                liked={isLiked(track.id)}
                onLike={() => toggleLike(track)}
              />
            ))}
          </div>
        )}

        {/* ── Search Results ── */}
        {!isInSubView && results.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-slate-500" />
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Results</span>
              </div>
              <button
                onClick={() => playQueue(results, 0)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/20 text-red-400 text-[10px] font-bold hover:bg-red-500/30 transition-all active:scale-95"
              >
                <Play size={10} /> Play All
              </button>
            </div>
            {results.map((track, idx) => (
              <SongRow
                key={`${track.id}-${idx}`}
                track={track}
                idx={idx}
                isActive={currentTrack?.id === track.id}
                isPlaying={currentTrack?.id === track.id && isPlaying}
                onPlay={() => handlePlaySong(results, idx)}
                onQueue={() => handleAddToQueue(track)}
                liked={isLiked(track.id)}
                onLike={() => toggleLike(track)}
              />
            ))}
          </div>
        )}

        {/* ── Home View ── */}
        {showHome && (
          <>
            {/* Liked Songs Quick Access */}
            {likedSongs.length > 0 && (
              <div className="mb-6">
                <button
                  onClick={() => setShowLiked(true)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-red-500/15 transition-all hover:border-red-500/30 active:scale-[0.99] touch-manipulation"
                  style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(249,115,22,0.04) 100%)' }}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center shadow-lg shadow-red-500/20 shrink-0">
                    <Heart size={20} className="text-white" fill="currentColor" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-sm font-black text-white">Liked Songs</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{likedSongs.length} songs · {formatDuration(likedSongs.reduce((s, t) => s + (t.duration || 0), 0))}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); playQueue(likedSongs, 0); }}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20 transition-all active:scale-90"
                    >
                      <Play size={16} className="text-white ml-0.5" />
                    </button>
                  </div>
                </button>
              </div>
            )}

            {/* Recently Played */}
            <HScrollTracks tracks={recentTracks} onPlay={handlePlaySingle} title="Recently Played" icon={Clock} iconClass="text-slate-500" />

            {/* Now Playing Queue Preview */}
            {currentTrack && (
              <div className="mb-6 p-3 rounded-2xl border border-slate-700/30 bg-white/[0.02]" onClick={() => { /* could open queue */ }}>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <ListMusic size={14} className="text-red-400" />
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Now Playing</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden shadow-md shrink-0">
                    {currentTrack.imageSmall ? <img src={currentTrack.imageSmall} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-800" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white truncate">{currentTrack.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{currentTrack.artist}</div>
                  </div>
                  {isPlaying && (
                    <div className="flex items-center gap-[2px] shrink-0 mr-1">
                      {[0, 1, 2].map((i) => <div key={i} className="w-[2px] bg-red-400 rounded-full animate-pulse" style={{ height: `${6 + i * 3}px`, animationDelay: `${i * 120}ms` }} />)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Categories Grid */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3 px-1">
                <Sparkles size={14} className="text-amber-400" />
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Workout Vibes</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {WORKOUT_CATEGORIES.map((cat) => (
                  <CategoryCard key={cat.id} cat={cat} onClick={() => handleCategoryClick(cat)} />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Empty search state */}
        {query && !searching && results.length === 0 && !isInSubView && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-3">
              <Search size={28} className="text-slate-600" />
            </div>
            <div className="text-sm font-bold text-slate-400">No results found</div>
            <div className="text-xs text-slate-600 mt-1">Try different keywords</div>
          </div>
        )}

        {/* Bottom spacer for mini player */}
        {currentTrack && <div className="h-24" />}
      </div>
    </div>
  );
}
