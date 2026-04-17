import { X, ExternalLink, Play, RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function VideoModal({ exercise, onClose }) {
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const iframeRef = useRef(null);
  const timeoutRef = useRef(null);

  // Build embed URL with YouTube IFrame API enabled so we can receive postMessage errors
  const embedUrl = exercise.videoId
    ? `https://www.youtube-nocookie.com/embed/${exercise.videoId}?rel=0&modestbranding=1&autoplay=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`
    : null;

  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    exercise.videoSearch || `${exercise.name} proper form tutorial`
  )}`;

  const watchUrl = exercise.videoId
    ? `https://www.youtube.com/watch?v=${exercise.videoId}`
    : searchUrl;

  // ── YouTube IFrame API postMessage listener ─────────────────────────
  // YouTube sends error codes via postMessage when embedding fails:
  //   2   = invalid parameter
  //   5   = HTML5 player error
  //   100 = video not found / private
  //   101 / 150 = embedding disallowed by owner
  useEffect(() => {
    if (!embedUrl) return;

    const handleMessage = (event) => {
      // Only accept messages from YouTube's nocookie domain
      if (
        !event.origin.includes('youtube-nocookie.com') &&
        !event.origin.includes('youtube.com')
      ) return;

      try {
        const data = JSON.parse(event.data);
        // Player state -1 = unstarted (ready), 1 = playing, etc.
        if (data.event === 'onStateChange' && data.info !== undefined) {
          if (data.info >= 0) setStatus('ready'); // any valid state means it's playing fine
        }
        if (data.event === 'onError') {
          setStatus('error');
          clearTimeout(timeoutRef.current);
        }
        // Info delivery with error code
        if (data.event === 'infoDelivery' && data.info?.errorCode) {
          setStatus('error');
          clearTimeout(timeoutRef.current);
        }
      } catch {
        // Ignore non-JSON messages
      }
    };

    window.addEventListener('message', handleMessage);

    // Fallback timeout: if no player event fires within 8 s, assume OK (just playing)
    timeoutRef.current = setTimeout(() => {
      setStatus((prev) => (prev === 'loading' ? 'ready' : prev));
    }, 8000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timeoutRef.current);
    };
  }, [embedUrl]);

  // Keyboard close
  useEffect(() => {
    const handle = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="min-w-0 flex-1 pr-3">
            <h3 className="font-bold text-white text-lg truncate">{exercise.name}</h3>
            <p className="text-sm text-slate-400 mt-0.5 truncate">
              {exercise.primaryMuscles?.join(', ')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-icon bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white shrink-0 w-9 h-9"
          >
            <X size={16} />
          </button>
        </div>

        {/* Video Area */}
        <div className="aspect-video bg-slate-900 relative">

          {/* ── State: no video ID configured ─────────── */}
          {!embedUrl && <NoVideoFallback searchUrl={searchUrl} />}

          {/* ── State: has ID — show iframe + overlays ── */}
          {embedUrl && (
            <>
              {/* Loading spinner — shown until first postMessage arrives */}
              {status === 'loading' && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-900">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                    <p className="text-slate-400 text-sm">Loading video…</p>
                  </div>
                </div>
              )}

              {/* Error fallback — shown when YouTube reports an error */}
              {status === 'error' && (
                <ErrorFallback
                  exercise={exercise}
                  watchUrl={watchUrl}
                  searchUrl={searchUrl}
                  onRetry={() => {
                    setStatus('loading');
                    // Force iframe reload by toggling src
                    if (iframeRef.current) {
                      iframeRef.current.src = embedUrl;
                    }
                    timeoutRef.current = setTimeout(
                      () => setStatus((p) => (p === 'loading' ? 'ready' : p)),
                      8000
                    );
                  }}
                />
              )}

              {/* The actual iframe */}
              <iframe
                ref={iframeRef}
                src={embedUrl}
                title={`${exercise.name} tutorial`}
                className={`w-full h-full transition-opacity duration-300 ${
                  status === 'error' ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-sm text-slate-400">
            {exercise.sets} sets × {exercise.reps} reps · Rest: {exercise.rest}
          </div>
          <div className="flex items-center gap-3">
            <a
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm font-semibold text-red-400 hover:text-red-300 transition-colors"
            >
              <Play size={13} fill="currentColor" />
              Watch on YouTube
            </a>
            <a
              href={searchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <ExternalLink size={13} />
              More videos
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function NoVideoFallback({ searchUrl }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-800 to-slate-900 p-6">
      <div className="w-16 h-16 bg-red-600/15 rounded-full flex items-center justify-center">
        <Play size={28} className="text-red-500 ml-1" fill="currentColor" />
      </div>
      <div className="text-center">
        <p className="text-white font-semibold mb-1">Video demo not configured</p>
        <p className="text-slate-400 text-sm">Find the best tutorial on YouTube</p>
      </div>
      <a
        href={searchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold text-sm transition-colors"
      >
        <Play size={14} fill="currentColor" /> Search on YouTube
      </a>
    </div>
  );
}

function ErrorFallback({ exercise, watchUrl, searchUrl, onRetry }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-900 to-slate-800 p-6 z-20">
      {/* YouTube-style icon */}
      <div className="w-20 h-20 bg-red-600/15 border border-red-500/20 rounded-2xl flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-10 h-10 text-red-500" fill="currentColor">
          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
        </svg>
      </div>

      <div className="text-center">
        <p className="text-white font-bold text-base mb-1">Video unavailable</p>
        <p className="text-slate-400 text-xs leading-relaxed max-w-xs">
          This video may be private or disabled for embedding.
          Watch it directly on YouTube or find an alternative.
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap justify-center">
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-xl font-semibold text-sm transition-colors touch-manipulation"
        >
          <Play size={13} fill="currentColor" />
          Watch on YouTube
        </a>
        <a
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-medium text-sm transition-colors touch-manipulation"
        >
          <ExternalLink size={13} />
          Search "{exercise.name}"
        </a>
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-700/60 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-sm transition-colors touch-manipulation"
        >
          <RefreshCw size={13} />
          Retry
        </button>
      </div>
    </div>
  );
}
