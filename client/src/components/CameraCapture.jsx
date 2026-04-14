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
  Shield,
  Settings,
} from 'lucide-react';

const FACING_MODES = ['environment', 'user'];

async function queryCameraPermission() {
  try {
    if (navigator.permissions?.query) {
      const result = await navigator.permissions.query({ name: 'camera' });
      return result.state; // 'granted' | 'prompt' | 'denied'
    }
  } catch { /* Safari doesn't support camera permission query */ }
  return 'unknown';
}

export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const mountedRef = useRef(true);
  const retryCountRef = useRef(0);

  const [phase, setPhase] = useState('checking'); // 'checking' | 'ask' | 'camera' | 'review' | 'error'
  const [ready, setReady] = useState(false);
  const [errorType, setErrorType] = useState(null);
  const [facingIdx, setFacingIdx] = useState(0);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [capturedUrl, setCapturedUrl] = useState(null);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [shutterFlash, setShutterFlash] = useState(false);
  const [mirrored, setMirrored] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const isFrontCamera = FACING_MODES[facingIdx] === 'user';

  const MAX_AUTO_RETRIES = 3;
  const RETRY_DELAY_MS = 600;

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  // ── Check permission on mount ──────────────────────────────────────────────

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorType('unsupported');
      setPhase('error');
      return;
    }

    queryCameraPermission().then((state) => {
      if (!mountedRef.current) return;
      if (state === 'granted') {
        setPhase('camera');
      } else if (state === 'denied') {
        setErrorType('denied');
        setPhase('error');
      } else {
        // 'prompt' or 'unknown' (Safari) → show our permission screen
        setPhase('ask');
      }
    });
  }, []);

  // ── Start / stop camera stream ─────────────────────────────────────────────

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
    setReady(false);
    try {
      await attemptCamera(facing);
    } catch (err) {
      if (!mountedRef.current) return;
      const isPermission = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
      const isNotFound = err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError';

      if (isPermission) { setErrorType('denied'); setPhase('error'); return; }
      if (isNotFound) { setErrorType('notfound'); setPhase('error'); return; }

      if (retryCountRef.current < MAX_AUTO_RETRIES) {
        retryCountRef.current += 1;
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        if (mountedRef.current) startCamera(facing, true);
        return;
      }
      setErrorType('generic');
      setPhase('error');
    }
  }, [attemptCamera]);

  // Auto-start camera when phase becomes 'camera'
  useEffect(() => {
    if (phase !== 'camera') return;
    retryCountRef.current = 0;
    const timer = setTimeout(() => {
      if (mountedRef.current) startCamera(FACING_MODES[facingIdx]);
    }, 150);
    return () => { clearTimeout(timer); stopStream(); };
  }, [phase, facingIdx, startCamera, stopStream]);

  // ── Permission request ─────────────────────────────────────────────────────

  const requestPermission = async () => {
    setRequesting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      stream.getTracks().forEach((t) => t.stop());
      if (!mountedRef.current) return;
      setPhase('camera');
    } catch (err) {
      if (!mountedRef.current) return;
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorType('denied');
        setPhase('error');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorType('notfound');
        setPhase('error');
      } else {
        // Generic fail — still try to proceed to camera phase, the retry logic there will handle it
        setPhase('camera');
      }
    } finally {
      if (mountedRef.current) setRequesting(false);
    }
  };

  // ── Torch & flip ───────────────────────────────────────────────────────────

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
      setPhase('review');
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
    setPhase('camera');
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

  // ── Render helpers ─────────────────────────────────────────────────────────

  const safeBottom = 'env(safe-area-inset-bottom, 0px)';
  const safeTop = 'env(safe-area-inset-top, 0px)';

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/i.test(navigator.userAgent);

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] bg-black select-none overflow-hidden"
      style={{ touchAction: 'none', height: '100dvh' }}
    >
      <canvas ref={canvasRef} className="hidden" />

      {/* ═══ PHASE: CHECKING ═══ */}
      {phase === 'checking' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-indigo-400" />
        </div>
      )}

      {/* ═══ PHASE: ASK PERMISSION ═══ */}
      {phase === 'ask' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center z-20">
          {/* Close button */}
          <button type="button" onClick={handleClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all"
            style={{ marginTop: `calc(${safeTop})` }}>
            <X size={20} />
          </button>

          <div className="w-24 h-24 rounded-3xl bg-indigo-600/15 flex items-center justify-center mb-6">
            <Camera size={44} className="text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Camera Access Needed</h2>
          <p className="text-sm text-slate-400 max-w-xs mb-2 leading-relaxed">
            To take progress photos directly in the app, FitTrack needs access to your device camera.
          </p>
          <p className="text-xs text-slate-500 max-w-xs mb-8 leading-relaxed">
            Your photos are only uploaded when you choose to save them. The camera is never used in the background.
          </p>

          <button
            type="button"
            onClick={requestPermission}
            disabled={requesting}
            className="w-full max-w-xs flex items-center justify-center gap-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.97] text-white font-semibold text-sm py-3.5 px-6 rounded-2xl transition-all disabled:opacity-60 shadow-lg shadow-indigo-600/20"
          >
            {requesting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Shield size={18} />
            )}
            {requesting ? 'Waiting for permission…' : 'Allow Camera Access'}
          </button>

          <button type="button" onClick={handleClose}
            className="mt-3 text-sm text-slate-500 hover:text-slate-300 py-2 transition-colors">
            Not now
          </button>
        </div>
      )}

      {/* ═══ PHASE: ERROR ═══ */}
      {phase === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center z-20">
          <button type="button" onClick={handleClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all"
            style={{ marginTop: `calc(${safeTop})` }}>
            <X size={20} />
          </button>

          {errorType === 'denied' ? (
            <>
              <div className="w-24 h-24 rounded-3xl bg-amber-500/10 flex items-center justify-center mb-6">
                <ShieldAlert size={44} className="text-amber-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Camera Permission Blocked</h2>
              <p className="text-sm text-slate-400 max-w-xs mb-4 leading-relaxed">
                Camera access was denied. You'll need to enable it in your browser settings to take photos.
              </p>

              <div className="w-full max-w-xs bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 mb-6 text-left">
                <div className="flex items-center gap-2 mb-3">
                  <Settings size={14} className="text-slate-400" />
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">How to enable</span>
                </div>
                {isIOS ? (
                  <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside leading-relaxed">
                    <li>Open <span className="text-white font-medium">Settings</span> on your iPhone</li>
                    <li>Scroll to <span className="text-white font-medium">Safari</span> (or your browser)</li>
                    <li>Tap <span className="text-white font-medium">Camera</span> and select <span className="text-white font-medium">Allow</span></li>
                    <li>Come back here and tap <span className="text-white font-medium">Try Again</span></li>
                  </ol>
                ) : isAndroid ? (
                  <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside leading-relaxed">
                    <li>Tap the <span className="text-white font-medium">lock icon</span> in the address bar</li>
                    <li>Tap <span className="text-white font-medium">Permissions</span> or <span className="text-white font-medium">Site settings</span></li>
                    <li>Set <span className="text-white font-medium">Camera</span> to <span className="text-white font-medium">Allow</span></li>
                    <li>Come back and tap <span className="text-white font-medium">Try Again</span></li>
                  </ol>
                ) : (
                  <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside leading-relaxed">
                    <li>Click the <span className="text-white font-medium">lock/info icon</span> in the address bar</li>
                    <li>Find <span className="text-white font-medium">Camera</span> permission</li>
                    <li>Change it to <span className="text-white font-medium">Allow</span></li>
                    <li>Reload the page and try again</li>
                  </ol>
                )}
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={handleClose}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 border border-slate-700 text-slate-300 hover:text-white active:scale-95 transition-all">
                  Cancel
                </button>
                <button type="button" onClick={() => { setErrorType(null); setPhase('ask'); }}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95 transition-all">
                  Try Again
                </button>
              </div>
            </>
          ) : errorType === 'notfound' ? (
            <>
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-5">
                <CameraOff size={36} className="text-red-400" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">No Camera Found</h2>
              <p className="text-sm text-slate-400 max-w-xs mb-5">
                This device doesn't have a camera, or it's currently in use by another app.
              </p>
              <button type="button" onClick={handleClose}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 border border-slate-700 text-slate-300 hover:text-white active:scale-95 transition-all">
                Go Back
              </button>
            </>
          ) : errorType === 'unsupported' ? (
            <>
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-5">
                <CameraOff size={36} className="text-red-400" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">Camera Not Supported</h2>
              <p className="text-sm text-slate-400 max-w-xs mb-5">
                Your browser doesn't support camera access. Try using Chrome or Safari.
              </p>
              <button type="button" onClick={handleClose}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 border border-slate-700 text-slate-300 hover:text-white active:scale-95 transition-all">
                Go Back
              </button>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-5">
                <CameraOff size={36} className="text-red-400" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">Could Not Start Camera</h2>
              <p className="text-sm text-slate-400 max-w-xs mb-5">
                Something went wrong. Make sure no other app is using the camera and try again.
              </p>
              <div className="flex gap-3">
                <button type="button" onClick={handleClose}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 border border-slate-700 text-slate-300 hover:text-white active:scale-95 transition-all">
                  Cancel
                </button>
                <button type="button" onClick={() => { setErrorType(null); setPhase('camera'); }}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95 transition-all">
                  Try Again
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══ PHASE: CAMERA VIEWFINDER ═══ */}
      {phase === 'camera' && (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover ${isFrontCamera && !mirrored ? 'scale-x-[-1]' : ''}`}
          />

          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={36} className="animate-spin text-indigo-400" />
                <span className="text-sm text-slate-400">Starting camera…</span>
              </div>
            </div>
          )}

          {shutterFlash && <div className="absolute inset-0 bg-white/40 pointer-events-none z-30" />}

          {countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20">
              <span className="text-8xl font-black text-white drop-shadow-2xl animate-bounce-in">{countdown}</span>
            </div>
          )}

          {ready && (
            <>
              <div className="absolute inset-0 pointer-events-none opacity-15 z-[1]">
                <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white" />
                <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white" />
                <div className="absolute top-1/3 left-0 right-0 h-px bg-white" />
                <div className="absolute top-2/3 left-0 right-0 h-px bg-white" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1]">
                <div className="w-36 h-56 sm:w-44 sm:h-64 border-2 border-dashed border-white/10 rounded-[40%]" />
              </div>
            </>
          )}

          {/* Top bar */}
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

          {/* Bottom controls */}
          <div className="absolute bottom-0 inset-x-0 z-10 bg-gradient-to-t from-black/70 via-black/40 to-transparent"
            style={{ paddingBottom: `calc(16px + ${safeBottom})`, paddingTop: '28px' }}>
            <div className="flex items-center justify-center gap-8 px-6 max-w-xs mx-auto">
              <button type="button" onClick={startTimer} disabled={!ready || countdown !== null}
                className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition-all disabled:opacity-30 active:scale-90"
                title="3-second timer">
                <Timer size={20} />
              </button>
              <button type="button" onClick={capture} disabled={!ready || countdown !== null}
                className="relative w-[68px] h-[68px] rounded-full flex items-center justify-center disabled:opacity-30 group active:scale-95 transition-transform"
                aria-label="Capture photo">
                <span className="absolute inset-0 rounded-full border-[3px] border-white/90" />
                <span className="w-[56px] h-[56px] rounded-full bg-white group-active:bg-indigo-100 group-active:scale-90 transition-all flex items-center justify-center">
                  <Camera size={22} className="text-slate-900" />
                </span>
              </button>
              <button type="button" onClick={flipCamera} disabled={!ready}
                className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition-all disabled:opacity-30 active:scale-90"
                title="Switch camera">
                <SwitchCamera size={20} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* ═══ PHASE: REVIEW ═══ */}
      {phase === 'review' && capturedUrl && (
        <>
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <img src={capturedUrl} alt="Captured" className="w-full h-full object-contain" />
          </div>
          <div className="absolute top-0 inset-x-0 z-10 flex items-center px-4 bg-gradient-to-b from-black/70 to-transparent"
            style={{ paddingTop: `calc(12px + ${safeTop})`, paddingBottom: '16px' }}>
            <button type="button" onClick={handleClose}
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-all active:scale-90">
              <X size={20} />
            </button>
            <span className="flex-1 text-center text-sm font-semibold text-white/70">Review Photo</span>
            <div className="w-10" />
          </div>
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
      )}
    </div>,
    document.body
  );
}
