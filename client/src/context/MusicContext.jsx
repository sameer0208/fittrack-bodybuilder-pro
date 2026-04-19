import { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';

const MusicContext = createContext(null);

const STORAGE_KEY = 'ft_music_state';
const LIKES_KEY = 'ft_music_likes';

function loadPersistedState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
}
function loadLikes() {
  try { return JSON.parse(localStorage.getItem(LIKES_KEY)) || []; } catch { return []; }
}

export function MusicProvider({ children }) {
  const saved = useRef(loadPersistedState()).current;

  const [currentTrack, setCurrentTrack] = useState(null);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(saved.volume ?? 0.8);
  const [shuffle, setShuffle] = useState(saved.shuffle ?? false);
  const [repeat, setRepeat] = useState(saved.repeat ?? 'off');
  const [speed, setSpeedState] = useState(saved.speed ?? 1);
  const [loading, setLoading] = useState(false);
  const [fullPlayerOpen, setFullPlayerOpen] = useState(false);
  const [analyserData, setAnalyserData] = useState(null);
  const [likedSongs, setLikedSongs] = useState(loadLikes);
  const [sleepTimer, setSleepTimerState] = useState(null);
  const [sleepRemaining, setSleepRemaining] = useState(0);

  const audioRef = useRef(null);
  const analyserRef = useRef(null);
  const audioCtxRef = useRef(null);
  const sourceRef = useRef(null);
  const animFrameRef = useRef(null);
  const historyStack = useRef([]);
  const sleepIntervalRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ volume, shuffle, repeat, speed }));
    } catch { /* ignore */ }
  }, [volume, shuffle, repeat, speed]);

  useEffect(() => {
    try { localStorage.setItem(LIKES_KEY, JSON.stringify(likedSongs)); } catch { /* ignore */ }
  }, [likedSongs]);

  // ── Audio element ──────────────────────────────────────────────────────────
  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.crossOrigin = 'anonymous';
      audioRef.current.preload = 'auto';
      audioRef.current.volume = volume;
      audioRef.current.playbackRate = speed;
    }
    return audioRef.current;
  }, []);

  // ── Analyser ───────────────────────────────────────────────────────────────
  const setupAnalyser = useCallback(() => {
    const audio = getAudio();
    if (audioCtxRef.current) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      const source = ctx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(ctx.destination);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      sourceRef.current = source;
    } catch { /* Safari may block */ }
  }, [getAudio]);

  const tickAnalyser = useCallback(() => {
    if (!analyserRef.current) { animFrameRef.current = requestAnimationFrame(tickAnalyser); return; }
    const buf = analyserRef.current.frequencyBinCount;
    const arr = new Uint8Array(buf);
    analyserRef.current.getByteFrequencyData(arr);
    setAnalyserData(arr);
    animFrameRef.current = requestAnimationFrame(tickAnalyser);
  }, []);

  const startViz = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(tickAnalyser);
  }, [tickAnalyser]);

  const stopViz = useCallback(() => {
    if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
  }, []);

  // ── Core playback ──────────────────────────────────────────────────────────
  const playTrack = useCallback(async (track) => {
    if (!track?.url) return;
    const audio = getAudio();
    setLoading(true);
    setCurrentTrack(track);
    audio.pause();
    audio.src = track.url;
    audio.playbackRate = speed;
    try {
      setupAnalyser();
      if (audioCtxRef.current?.state === 'suspended') await audioCtxRef.current.resume();
      await audio.play();
      setIsPlaying(true);
      setDuration(track.duration || 0);
      startViz();
    } catch (e) { console.warn('[Music] play failed:', e.message); }
    finally { setLoading(false); }
  }, [getAudio, setupAnalyser, startViz, speed]);

  const playQueue = useCallback((tracks, startIdx = 0) => {
    if (!tracks?.length) return;
    setQueue(tracks);
    setQueueIndex(startIdx);
    historyStack.current = [];
    playTrack(tracks[startIdx]);
  }, [playTrack]);

  const addToQueue = useCallback((track) => {
    setQueue((prev) => [...prev, track]);
  }, []);

  const removeFromQueue = useCallback((idx) => {
    setQueue((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next;
    });
    setQueueIndex((prev) => {
      if (idx < prev) return prev - 1;
      return prev;
    });
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setQueueIndex(-1);
  }, []);

  const togglePlay = useCallback(async () => {
    const audio = getAudio();
    if (!currentTrack) return;
    try {
      if (audioCtxRef.current?.state === 'suspended') await audioCtxRef.current.resume();
      if (isPlaying) { audio.pause(); setIsPlaying(false); stopViz(); }
      else { await audio.play(); setIsPlaying(true); startViz(); }
    } catch { /* ignore */ }
  }, [getAudio, currentTrack, isPlaying, startViz, stopViz]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const getNextIndex = useCallback(() => {
    if (queue.length === 0) return -1;
    if (shuffle) {
      const rest = queue.map((_, i) => i).filter((i) => i !== queueIndex);
      if (rest.length === 0) return repeat === 'all' ? Math.floor(Math.random() * queue.length) : -1;
      return rest[Math.floor(Math.random() * rest.length)];
    }
    const next = queueIndex + 1;
    if (next < queue.length) return next;
    return repeat === 'all' ? 0 : -1;
  }, [queue, queueIndex, shuffle, repeat]);

  const getPrevIndex = useCallback(() => {
    if (historyStack.current.length > 0) return historyStack.current.pop();
    if (queueIndex > 0) return queueIndex - 1;
    return repeat === 'all' ? queue.length - 1 : 0;
  }, [queueIndex, queue.length, repeat]);

  const playNext = useCallback(() => {
    if (queue.length === 0) return;
    historyStack.current.push(queueIndex);
    const nextIdx = getNextIndex();
    if (nextIdx === -1) { setIsPlaying(false); stopViz(); return; }
    setQueueIndex(nextIdx);
    playTrack(queue[nextIdx]);
  }, [queue, queueIndex, getNextIndex, playTrack, stopViz]);

  const playPrev = useCallback(() => {
    const audio = getAudio();
    if (audio.currentTime > 3) { audio.currentTime = 0; return; }
    if (queue.length === 0) return;
    const prevIdx = getPrevIndex();
    setQueueIndex(prevIdx);
    playTrack(queue[prevIdx]);
  }, [getAudio, queue, getPrevIndex, playTrack]);

  // ── Seeking ────────────────────────────────────────────────────────────────
  const seekTo = useCallback((pct) => {
    const audio = getAudio();
    if (!audio.duration) return;
    audio.currentTime = (pct / 100) * audio.duration;
  }, [getAudio]);

  const skipForward = useCallback((sec = 10) => {
    const audio = getAudio();
    if (!audio.duration) return;
    audio.currentTime = Math.min(audio.duration, audio.currentTime + sec);
  }, [getAudio]);

  const skipBackward = useCallback((sec = 10) => {
    const audio = getAudio();
    audio.currentTime = Math.max(0, audio.currentTime - sec);
  }, [getAudio]);

  // ── Volume & speed ─────────────────────────────────────────────────────────
  const setVolume = useCallback((v) => {
    const c = Math.max(0, Math.min(1, v));
    setVolumeState(c);
    getAudio().volume = c;
  }, [getAudio]);

  const setSpeed = useCallback((s) => {
    const clamped = Math.max(0.5, Math.min(2, s));
    setSpeedState(clamped);
    getAudio().playbackRate = clamped;
  }, [getAudio]);

  const toggleShuffle = useCallback(() => setShuffle((p) => !p), []);
  const cycleRepeat = useCallback(() => setRepeat((p) => (p === 'off' ? 'all' : p === 'all' ? 'one' : 'off')), []);

  // ── Like / Unlike ──────────────────────────────────────────────────────────
  const isLiked = useCallback((trackId) => likedSongs.some((s) => s.id === trackId), [likedSongs]);

  const toggleLike = useCallback((track) => {
    if (!track) return;
    setLikedSongs((prev) => {
      if (prev.some((s) => s.id === track.id)) return prev.filter((s) => s.id !== track.id);
      return [{ id: track.id, name: track.name, artist: track.artist, album: track.album, duration: track.duration, image: track.image, imageSmall: track.imageSmall, url: track.url }, ...prev];
    });
  }, []);

  // ── Sleep timer ────────────────────────────────────────────────────────────
  const setSleepTimer = useCallback((minutes) => {
    if (sleepIntervalRef.current) clearInterval(sleepIntervalRef.current);
    if (!minutes) { setSleepTimerState(null); setSleepRemaining(0); return; }
    const endTime = Date.now() + minutes * 60 * 1000;
    setSleepTimerState(minutes);
    setSleepRemaining(minutes * 60);
    sleepIntervalRef.current = setInterval(() => {
      const left = Math.max(0, Math.round((endTime - Date.now()) / 1000));
      setSleepRemaining(left);
      if (left <= 0) {
        clearInterval(sleepIntervalRef.current);
        sleepIntervalRef.current = null;
        setSleepTimerState(null);
        const audio = audioRef.current;
        if (audio) { audio.pause(); }
        setIsPlaying(false);
        stopViz();
      }
    }, 1000);
  }, [stopViz]);

  useEffect(() => {
    return () => { if (sleepIntervalRef.current) clearInterval(sleepIntervalRef.current); };
  }, []);

  // ── Audio events ───────────────────────────────────────────────────────────
  useEffect(() => {
    const audio = getAudio();

    const onTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
        setElapsed(Math.floor(audio.currentTime));
      }
    };
    const onLoadedMetadata = () => { if (audio.duration) setDuration(Math.round(audio.duration)); };
    const onEnded = () => {
      if (repeat === 'one') { audio.currentTime = 0; audio.play(); return; }
      playNext();
    };
    const onError = () => { setLoading(false); };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [getAudio, repeat, playNext]);

  // ── Media Session API ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.name,
      artist: currentTrack.artist,
      album: currentTrack.album,
      artwork: currentTrack.image ? [{ src: currentTrack.image, sizes: '500x500', type: 'image/jpeg' }] : [],
    });
    navigator.mediaSession.setActionHandler('play', togglePlay);
    navigator.mediaSession.setActionHandler('pause', togglePlay);
    navigator.mediaSession.setActionHandler('nexttrack', playNext);
    navigator.mediaSession.setActionHandler('previoustrack', playPrev);
    try {
      navigator.mediaSession.setActionHandler('seekforward', () => skipForward(10));
      navigator.mediaSession.setActionHandler('seekbackward', () => skipBackward(10));
    } catch { /* not all browsers support these */ }
  }, [currentTrack, togglePlay, playNext, playPrev, skipForward, skipBackward]);

  const value = {
    currentTrack, queue, queueIndex, isPlaying, progress, elapsed, duration,
    volume, shuffle, repeat, speed, loading, fullPlayerOpen, analyserData,
    likedSongs, sleepTimer, sleepRemaining,
    playTrack, playQueue, addToQueue, removeFromQueue, clearQueue,
    togglePlay, playNext, playPrev,
    seekTo, skipForward, skipBackward,
    setVolume, setSpeed, toggleShuffle, cycleRepeat,
    setFullPlayerOpen,
    isLiked, toggleLike, setSleepTimer,
  };

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
}

export function useMusic() {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error('useMusic must be used within MusicProvider');
  return ctx;
}
