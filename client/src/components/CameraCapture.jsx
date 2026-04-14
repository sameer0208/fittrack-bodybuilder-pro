import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Camera,
  SwitchCamera,
  RotateCcw,
  Check,
  Loader2,
  ShieldAlert,
  CameraOff,
  Zap,
  ZapOff,
  FlipHorizontal2,
  Timer,
} from 'lucide-react';

const FACING_MODES = ['environment', 'user'];

export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [facingIdx, setFacingIdx] = useState(0);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [capturedUrl, setCapturedUrl] = useState(null);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [shutterFlash, setShutterFlash] = useState(false);
  const [mirrored, setMirrored] = useState(false);
  const isFrontCamera = FACING_MODES[facingIdx] === 'user';

  // ── Start / stop camera stream ─────────────────────────────────────────────

  const mountedRef = useRef(true);
  const retryCountRef = useRef(0);
  const MAX_AUTO_RETRIES = 3;
  const RETRY_DELAY_MS = 600;

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const attemptCamera = useCallback(async (facing) => {
    stopStream();
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false,
    });
    if (!mountedRef.current) { stream.getTracks().forEach((t) => t.stop()); return; }
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }
    const track = stream.getVideoTracks()[0];
    setTorchSupported(!!(track.getCapabilities?.()?.torch));
    setTorchOn(false);
    retryCountRef.current = 0;
    setReady(true);
  }, [stopStream]);

  const startCamera = useCallback(async (facing, isAutoRetry = false) => {
    setError(null);
    setReady(false);
    try {
      await attemptCamera(facing);
    } catch (err) {
      if (!mountedRef.current) return;

      const isPermission = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
      const isNotFound = err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError';

      if (isPermission) { setError('permission'); return; }
      if (isNotFound) { setError('notfound'); return; }

      if (retryCountRef.current < MAX_AUTO_RETRIES && !isAutoRetry) {
        retryCountRef.current += 1;
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        if (mountedRef.current) startCamera(facing, true);
        return;
      }
      if (isAutoRetry && retryCountRef.current < MAX_AUTO_RETRIES) {
        retryCountRef.current += 1;
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        if (mountedRef.current) startCamera(facing, true);
        return;
      }

      setError('generic');
    }
  }, [attemptCamera]);

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) { setError('unsupported'); return; }
    retryCountRef.current = 0;
    const timer = setTimeout(() => {
      if (mountedRef.current) startCamera(FACING_MODES[facingIdx]);
    }, 150);
    return () => { clearTimeout(timer); stopStream(); };
  }, [facingIdx, startCamera, stopStream]);

  // ── Torch ──────────────────────────────────────────────────────────────────

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    try { await track.applyConstraints({ advanced: [{ torch: next }] }); setTorchOn(next); } catch { /* noop */ }
  };

  const flipCamera = () => setFacingIdx((i) => (i + 1) % FACING_MODES.length);

  // ── Capture ────────────────────────────────────────────────────────────────

  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 200);

    const w = video.videoWidth;
    const h = video.videoHeight;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    const shouldMirror = isFrontCamera && !mirrored;
    if (shouldMirror) { ctx.translate(w, 0); ctx.scale(-1, 1); }
    ctx.drawImage(video, 0, 0, w, h);
    if (shouldMirror) ctx.setTransform(1, 0, 0, 1, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;
      setCapturedBlob(blob);
      setCapturedUrl(URL.createObjectURL(blob));
      stopStream();
    }, 'image/jpeg', 0.92);
  }, [isFrontCamera, mirrored, stopStream]);

  const startTimer = () => {
    let sec = 3;
    setCountdown(sec);
    const iv = setInterval(() => {
      sec -= 1;
      if (sec <= 0) { clearInterval(iv); setCountdown(null); capture(); }
      else setCountdown(sec);
    }, 1000);
  };

  const retake = () => {
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    setCapturedUrl(null);
    setCapturedBlob(null);
    startCamera(FACING_MODES[facingIdx]);
  };

  const usePhoto = () => {
    if (!capturedBlob) return;
    onCapture(new File([capturedBlob], `progress_${Date.now()}.jpg`, { type: 'image/jpeg' }));
  };

  const handleClose = () => {
    stopStream();
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    onClose();
  };

  // ── Error UI ───────────────────────────────────────────────────────────────

  const renderError = () => {
    const configs = {
      permission: { icon: ShieldAlert, title: 'Camera access denied', desc: 'Allow camera access in your browser settings to take photos.', action: () => startCamera(FACING_MODES[facingIdx]), actionLabel: 'Try again' },
      notfound: { icon: CameraOff, title: 'No camera found', desc: 'This device doesn\'t have a camera, or it\'s in use by another app.', action: handleClose, actionLabel: 'Go back' },
      unsupported: { icon: CameraOff, title: 'Camera not supported', desc: 'Your browser doesn\'t support camera access. Try Chrome or Safari.', action: handleClose, actionLabel: 'Go back' },
      generic: { icon: CameraOff, title: 'Could not start camera', desc: 'Something went wrong. Make sure no other app is using the camera.', action: () => startCamera(FACING_MODES[facingIdx]), actionLabel: 'Try again' },
    };
    const cfg = configs[error] || configs.generic;
    const Icon = cfg.icon;
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center gap-4 z-20">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
          <Icon size={36} className="text-red-400" />
        </div>
        <h2 className="text-lg font-bold text-white">{cfg.title}</h2>
        <p className="text-sm text-slate-400 max-w-xs">{cfg.desc}</p>
        <div className="flex gap-3 mt-2">
          <button type="button" onClick={handleClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 border border-slate-700 text-slate-300 hover:text-white active:scale-95 transition-all">
            Cancel
          </button>
          <button type="button" onClick={cfg.action}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95 transition-all">
            {cfg.actionLabel}
          </button>
        </div>
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const safeBottom = 'env(safe-area-inset-bottom, 0px)';
  const safeTop = 'env(safe-area-inset-top, 0px)';

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] bg-black select-none overflow-hidden"
      style={{ touchAction: 'none', height: '100dvh' }}
    >
      <canvas ref={canvasRef} className="hidden" />

      {error ? (
        renderError()
      ) : capturedUrl ? (
        /* ═══ REVIEW MODE ═══ */
        <>
          {/* Full-bleed captured image */}
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <img src={capturedUrl} alt="Captured" className="w-full h-full object-contain" />
          </div>

          {/* Top bar */}
          <div className="absolute top-0 inset-x-0 z-10 flex items-center px-4 bg-gradient-to-b from-black/70 to-transparent"
            style={{ paddingTop: `calc(12px + ${safeTop})`, paddingBottom: '16px' }}>
            <button type="button" onClick={handleClose}
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-all active:scale-90">
              <X size={20} />
            </button>
            <span className="flex-1 text-center text-sm font-semibold text-white/70">Review Photo</span>
            <div className="w-10" />
          </div>

          {/* Bottom actions */}
          <div className="absolute bottom-0 inset-x-0 z-10 bg-gradient-to-t from-black/80 via-black/60 to-transparent"
            style={{ paddingBottom: `calc(20px + ${safeBottom})`, paddingTop: '24px' }}>
            <div className="flex items-center justify-center gap-4 px-6">
              <button type="button" onClick={retake}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 text-white font-semibold text-sm hover:bg-white/20 active:scale-95 transition-all">
                <RotateCcw size={18} />
                Retake
              </button>
              <button type="button" onClick={usePhoto}
                className="flex items-center gap-2 px-7 py-3 rounded-2xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-500 active:scale-95 transition-all shadow-lg shadow-indigo-600/30">
                <Check size={18} />
                Use Photo
              </button>
            </div>
          </div>
        </>
      ) : (
        /* ═══ VIEWFINDER MODE ═══ */
        <>
          {/* Full-bleed video */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover ${isFrontCamera && !mirrored ? 'scale-x-[-1]' : ''}`}
          />

          {/* Loading spinner */}
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={36} className="animate-spin text-indigo-400" />
                <span className="text-sm text-slate-400">Starting camera…</span>
              </div>
            </div>
          )}

          {/* Shutter flash */}
          {shutterFlash && <div className="absolute inset-0 bg-white/40 pointer-events-none z-30" />}

          {/* Countdown */}
          {countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20">
              <span className="text-8xl font-black text-white drop-shadow-2xl animate-bounce-in">{countdown}</span>
            </div>
          )}

          {/* Guide overlays (only when viewfinder is active) */}
          {ready && (
            <>
              {/* Rule-of-thirds grid */}
              <div className="absolute inset-0 pointer-events-none opacity-15 z-[1]">
                <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white" />
                <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white" />
                <div className="absolute top-1/3 left-0 right-0 h-px bg-white" />
                <div className="absolute top-2/3 left-0 right-0 h-px bg-white" />
              </div>
              {/* Pose silhouette hint */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1]">
                <div className="w-36 h-56 sm:w-44 sm:h-64 border-2 border-dashed border-white/10 rounded-[40%]" />
              </div>
            </>
          )}

          {/* ─── Top bar (overlaid) ─── */}
          <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between px-4 bg-gradient-to-b from-black/60 to-transparent"
            style={{ paddingTop: `calc(12px + ${safeTop})`, paddingBottom: '20px' }}>
            <button type="button" onClick={handleClose}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white active:scale-90 transition-all">
              <X size={20} />
            </button>

            {ready && (
              <div className="flex items-center gap-2">
                {torchSupported && (
                  <button type="button" onClick={toggleTorch}
                    className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-all active:scale-90 ${
                      torchOn ? 'bg-yellow-500/30 text-yellow-300' : 'bg-black/40 text-white/70 hover:text-white'
                    }`}>
                    {torchOn ? <Zap size={18} /> : <ZapOff size={18} />}
                  </button>
                )}
                {isFrontCamera && (
                  <button type="button" onClick={() => setMirrored((v) => !v)}
                    className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-all active:scale-90 ${
                      mirrored ? 'bg-indigo-500/30 text-indigo-300' : 'bg-black/40 text-white/70 hover:text-white'
                    }`}>
                    <FlipHorizontal2 size={18} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ─── Bottom controls (overlaid) ─── */}
          <div className="absolute bottom-0 inset-x-0 z-10 bg-gradient-to-t from-black/70 via-black/40 to-transparent"
            style={{ paddingBottom: `calc(16px + ${safeBottom})`, paddingTop: '28px' }}>
            <div className="flex items-center justify-center gap-8 px-6 max-w-xs mx-auto">
              {/* Timer */}
              <button type="button" onClick={startTimer} disabled={!ready || countdown !== null}
                className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition-all disabled:opacity-30 active:scale-90"
                title="3-second timer">
                <Timer size={20} />
              </button>

              {/* Shutter */}
              <button type="button" onClick={capture} disabled={!ready || countdown !== null}
                className="relative w-[68px] h-[68px] rounded-full flex items-center justify-center disabled:opacity-30 group active:scale-95 transition-transform"
                aria-label="Capture photo">
                <span className="absolute inset-0 rounded-full border-[3px] border-white/90" />
                <span className="w-[56px] h-[56px] rounded-full bg-white group-active:bg-indigo-100 group-active:scale-90 transition-all flex items-center justify-center">
                  <Camera size={22} className="text-slate-900" />
                </span>
              </button>

              {/* Flip */}
              <button type="button" onClick={flipCamera} disabled={!ready}
                className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition-all disabled:opacity-30 active:scale-90"
                title="Switch camera">
                <SwitchCamera size={20} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>,
    document.body
  );
}
