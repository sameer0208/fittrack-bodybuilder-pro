import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Heart, X, Camera, Loader2, Save, RotateCcw, Fingerprint } from 'lucide-react';
import toast from 'react-hot-toast';

const MEASUREMENT_SECONDS = 25;
const MIN_VALID_BPM = 40;
const MAX_VALID_BPM = 200;
const WARMUP_FRAMES = 60;
const WAVEFORM_POINTS = 150;
const TARGET_FPS = 30;
const FRAME_INTERVAL = 1000 / TARGET_FPS;

function peakDetect(signal, minDist) {
  const peaks = [];
  if (signal.length < 5) return peaks;

  const mean = signal.reduce((s, v) => s + v, 0) / signal.length;
  const stdDev = Math.sqrt(signal.reduce((s, v) => s + (v - mean) ** 2, 0) / signal.length);
  const threshold = mean + stdDev * 0.4;

  for (let i = 2; i < signal.length - 2; i++) {
    if (
      signal[i] > threshold &&
      signal[i] > signal[i - 1] &&
      signal[i] > signal[i - 2] &&
      signal[i] >= signal[i + 1] &&
      signal[i] >= signal[i + 2]
    ) {
      if (peaks.length === 0 || i - peaks[peaks.length - 1] >= minDist) {
        peaks.push(i);
      }
    }
  }
  return peaks;
}

function calcBPM(peaks, fps) {
  if (peaks.length < 3) return 0;
  const intervals = [];
  for (let i = 1; i < peaks.length; i++) {
    intervals.push(peaks[i] - peaks[i - 1]);
  }
  intervals.sort((a, b) => a - b);
  const trim = Math.max(1, Math.floor(intervals.length * 0.15));
  const trimmed = intervals.slice(trim, intervals.length - trim);
  if (!trimmed.length) return 0;
  const avg = trimmed.reduce((s, v) => s + v, 0) / trimmed.length;
  const bpm = Math.round((fps * 60) / avg);
  return bpm >= MIN_VALID_BPM && bpm <= MAX_VALID_BPM ? bpm : 0;
}

function movingAvg(arr, w) {
  const out = [];
  for (let i = 0; i < arr.length; i++) {
    let s = 0, c = 0;
    for (let j = Math.max(0, i - w); j <= Math.min(arr.length - 1, i + w); j++) {
      s += arr[j]; c++;
    }
    out.push(s / c);
  }
  return out;
}

function detrend(signal) {
  if (signal.length < 2) return signal;
  const n = signal.length;
  let sx = 0, sy = 0, sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++) {
    sx += i; sy += signal[i]; sxy += i * signal[i]; sxx += i * i;
  }
  const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  const intercept = (sy - slope * sx) / n;
  return signal.map((v, i) => v - (slope * i + intercept));
}

function processSignal(raw) {
  const dt = detrend(raw);
  return movingAvg(dt, 2);
}

export default function HeartRateMonitor({ onResult, onClose }) {
  const [phase, setPhase] = useState('idle');
  const [bpm, setBpm] = useState(0);
  const [liveBpm, setLiveBpm] = useState(0);
  const [progress, setProgress] = useState(0);
  const [fingerDetected, setFingerDetected] = useState(false);
  const [signalQuality, setSignalQuality] = useState(0);
  const [beatPulse, setBeatPulse] = useState(false);
  const [waveform, setWaveform] = useState([]);
  const [debugInfo, setDebugInfo] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const bufferRef = useRef([]);
  const rawFrameCount = useRef(0);
  const measureStartRef = useRef(0);
  const lastBeatRef = useRef(0);
  const actualFpsRef = useRef(TARGET_FPS);
  const fpsFrames = useRef([]);
  const phaseRef = useRef('idle');

  const stopCamera = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const triggerBeatPulse = useCallback(() => {
    setBeatPulse(true);
    setTimeout(() => setBeatPulse(false), 200);
  }, []);

  const startMeasurement = useCallback(async () => {
    phaseRef.current = 'starting';
    setPhase('starting');
    setBpm(0);
    setLiveBpm(0);
    setProgress(0);
    setFingerDetected(false);
    setSignalQuality(0);
    setWaveform([]);
    setDebugInfo('Requesting camera...');
    bufferRef.current = [];
    rawFrameCount.current = 0;
    fpsFrames.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 160, max: 320 },
          height: { ideal: 160, max: 320 },
        },
      });
      streamRef.current = stream;

      const track = stream.getVideoTracks()[0];
      let torchOn = false;
      try {
        await track.applyConstraints({ advanced: [{ torch: true }] });
        torchOn = true;
      } catch {
        try {
          const caps = track.getCapabilities?.();
          if (caps?.torch) {
            await track.applyConstraints({ advanced: [{ torch: true }] });
            torchOn = true;
          }
        } catch {}
      }

      const video = videoRef.current;
      if (!video) { stopCamera(); setPhase('idle'); return; }

      video.srcObject = stream;
      video.setAttribute('playsinline', '');
      video.muted = true;

      await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => { video.play().then(resolve).catch(reject); };
        setTimeout(reject, 5000);
      });

      await new Promise((r) => setTimeout(r, 500));

      const canvas = canvasRef.current;
      if (!canvas) { stopCamera(); setPhase('idle'); return; }
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      canvas.width = 64;
      canvas.height = 64;

      setDebugInfo(torchOn ? 'Torch ON — place finger' : 'No torch — press finger firmly');
      phaseRef.current = 'measuring';
      setPhase('measuring');
      measureStartRef.current = performance.now();

      timerRef.current = setInterval(() => {
        if (phaseRef.current !== 'measuring' || !streamRef.current) return;

        const now = performance.now();

        fpsFrames.current.push(now);
        fpsFrames.current = fpsFrames.current.filter((t) => now - t < 2000);
        if (fpsFrames.current.length > 2) {
          actualFpsRef.current = fpsFrames.current.length / 2;
        }

        rawFrameCount.current++;
        const elapsed = (now - measureStartRef.current) / 1000;

        try {
          ctx.drawImage(video, 0, 0, 64, 64);
        } catch { return; }

        const data = ctx.getImageData(8, 8, 48, 48).data;
        let rSum = 0, gSum = 0, bSum = 0, px = 0;
        for (let i = 0; i < data.length; i += 16) {
          rSum += data[i];
          gSum += data[i + 1];
          bSum += data[i + 2];
          px++;
        }
        const avgR = rSum / px;
        const avgG = gSum / px;
        const avgB = bSum / px;

        const isFinger = avgR > 80 && (avgR > avgG * 1.2) && (avgR > avgB * 1.3);
        setFingerDetected(isFinger);

        if (rawFrameCount.current <= WARMUP_FRAMES) {
          setDebugInfo(`Stabilizing... ${WARMUP_FRAMES - rawFrameCount.current} frames`);
          if (isFinger) bufferRef.current.push(avgR);
          const prog = Math.min(5, (rawFrameCount.current / WARMUP_FRAMES) * 5);
          setProgress(prog);
          return;
        }

        if (isFinger) {
          bufferRef.current.push(avgR);
        }

        const buffer = bufferRef.current;
        const fps = actualFpsRef.current;
        const minSamples = Math.floor(fps * 4);

        if (buffer.length > minSamples) {
          const window = buffer.slice(-Math.floor(fps * 10));
          const filtered = processSignal(window);
          const minDist = Math.max(5, Math.floor(fps * 0.33));
          const peaks = peakDetect(filtered, minDist);
          const currentBpm = calcBPM(peaks, fps);

          if (currentBpm > 0) {
            setLiveBpm(currentBpm);

            const variance = filtered.reduce((s, v) => s + v * v, 0) / filtered.length;
            const q = Math.min(100, Math.round(Math.sqrt(variance) * 80));
            setSignalQuality(Math.max(q, 15));

            if (peaks.length >= 2) {
              const lastGap = peaks[peaks.length - 1] - peaks[peaks.length - 2];
              const interval = (lastGap / fps) * 1000;
              if (now - lastBeatRef.current > interval * 0.7) {
                lastBeatRef.current = now;
                triggerBeatPulse();
              }
            }
          }

          setDebugInfo(`Samples: ${buffer.length} | FPS: ${Math.round(fps)} | Peaks: ${peaks.length} | R: ${Math.round(avgR)}`);
        }

        if (buffer.length > 5) {
          const slice = buffer.slice(-WAVEFORM_POINTS);
          const min = Math.min(...slice);
          const max = Math.max(...slice);
          const range = max - min || 1;
          setWaveform(slice.map((v) => (v - min) / range));
        }

        const warmupSec = WARMUP_FRAMES / TARGET_FPS;
        const measuringTime = Math.max(0, elapsed - warmupSec);
        const prog = Math.min(100, (measuringTime / MEASUREMENT_SECONDS) * 100);
        setProgress(prog);

        if (measuringTime >= MEASUREMENT_SECONDS) {
          phaseRef.current = 'done';

          let finalBpm = 0;
          if (buffer.length > fps * 5) {
            const filtered = processSignal(buffer);
            const minDist = Math.max(5, Math.floor(fps * 0.33));
            const peaks = peakDetect(filtered, minDist);
            finalBpm = calcBPM(peaks, fps);
          }
          setBpm(finalBpm || liveBpm || 0);
          stopCamera();
          setPhase('done');
        }
      }, FRAME_INTERVAL);

    } catch (err) {
      console.error('Camera error:', err);
      toast.error(err.name === 'NotAllowedError'
        ? 'Camera permission denied — please allow camera access'
        : 'Could not access camera');
      phaseRef.current = 'idle';
      setPhase('idle');
    }
  }, [stopCamera, triggerBeatPulse, liveBpm]);

  useEffect(() => {
    return () => {
      phaseRef.current = 'idle';
      stopCamera();
    };
  }, [stopCamera]);

  const handleSave = () => {
    if (bpm > 0 && onResult) onResult(bpm);
    onClose();
  };

  const handleRetry = () => {
    phaseRef.current = 'idle';
    stopCamera();
    setPhase('idle');
    setBpm(0);
    setLiveBpm(0);
    setWaveform([]);
  };

  const waveformPath = useMemo(() => {
    if (waveform.length < 2) return '';
    const step = 100 / (waveform.length - 1);
    return waveform.map((v, i) => {
      const x = i * step;
      const y = 85 - v * 70;
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    }).join(' ');
  }, [waveform]);

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.95)' }}>
      {/* Always-mounted hidden video & canvas so refs are available */}
      <video ref={videoRef} playsInline muted
        style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }} />
      <canvas ref={canvasRef}
        style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }} />

      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.3) 0%, transparent 70%)' }} />
        {phase === 'measuring' && beatPulse && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full animate-ping opacity-10"
            style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.5) 0%, transparent 60%)' }} />
        )}
      </div>

      {/* Close button */}
      <button onClick={() => { phaseRef.current = 'idle'; stopCamera(); onClose(); }}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white touch-manipulation">
        <X size={20} />
      </button>

      <div className="relative w-full max-w-sm mx-4">

        {/* ── IDLE ── */}
        {phase === 'idle' && (
          <div className="text-center space-y-6">
            <div className="relative w-32 h-32 mx-auto">
              <div className="absolute inset-0 rounded-full bg-red-500/10 animate-pulse" />
              <div className="absolute inset-3 rounded-full bg-red-500/15" />
              <div className="absolute inset-6 rounded-full bg-gradient-to-br from-red-600 to-rose-500 flex items-center justify-center shadow-2xl shadow-red-600/30">
                <Heart size={40} className="text-white" fill="currentColor" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white mb-2">Heart Rate Scanner</h2>
              <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
                Place your <strong className="text-red-400">fingertip</strong> gently over the <strong className="text-red-400">rear camera</strong> and hold still for 25 seconds.
              </p>
            </div>
            <div className="space-y-3 text-left max-w-xs mx-auto">
              {[
                { icon: Fingerprint, text: 'Cover the camera lens completely — apply light pressure' },
                { icon: Camera, text: 'The flashlight will turn on automatically if supported' },
                { icon: Heart, text: 'Stay very still — even tiny movements affect the reading' },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-white/[0.03] border border-white/5 rounded-xl">
                  <Icon size={16} className="text-red-400 shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-300">{text}</span>
                </div>
              ))}
            </div>
            <button onClick={startMeasurement}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-red-600/25 active:shadow-red-600/40 active:scale-[0.98] transition-all touch-manipulation flex items-center justify-center gap-2">
              <Heart size={18} /> Start Measurement
            </button>
            <p className="text-[10px] text-slate-600 leading-relaxed">
              For informational purposes only. Not a medical device.
            </p>
          </div>
        )}

        {/* ── STARTING ── */}
        {phase === 'starting' && (
          <div className="text-center space-y-4">
            <Loader2 size={48} className="text-red-400 animate-spin mx-auto" />
            <p className="text-sm text-slate-300 font-bold">Accessing camera...</p>
            <p className="text-[10px] text-slate-500">Place your finger on the camera now</p>
          </div>
        )}

        {/* ── MEASURING ── */}
        {phase === 'measuring' && (
          <div className="space-y-5">
            {/* Heart Animation */}
            <div className="text-center">
              <div className="relative w-28 h-28 mx-auto mb-4">
                {beatPulse && (
                  <>
                    <div className="absolute inset-0 rounded-full border-2 border-red-500/40 animate-ping" />
                    <div className="absolute -inset-3 rounded-full border border-red-500/20 animate-ping" style={{ animationDelay: '0.1s' }} />
                  </>
                )}
                <div className="absolute inset-0 rounded-full transition-all duration-200"
                  style={{
                    background: beatPulse
                      ? 'radial-gradient(circle, rgba(239,68,68,0.4) 0%, rgba(239,68,68,0.1) 60%, transparent 80%)'
                      : 'radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 70%)',
                    transform: beatPulse ? 'scale(1.15)' : 'scale(1)',
                  }} />
                <div className="absolute inset-0 flex items-center justify-center transition-transform duration-150"
                  style={{ transform: beatPulse ? 'scale(1.2)' : 'scale(1)' }}>
                  <Heart size={52} className="text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                    fill="currentColor" strokeWidth={0} />
                </div>
              </div>

              <div className="mb-1">
                <span className="text-5xl font-black text-white tabular-nums tracking-tight transition-all duration-300"
                  style={{ textShadow: beatPulse ? '0 0 30px rgba(239,68,68,0.6)' : 'none' }}>
                  {liveBpm || '--'}
                </span>
                <span className="text-lg text-red-400 font-bold ml-2">BPM</span>
              </div>

              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                fingerDetected
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${fingerDetected ? 'bg-emerald-400' : 'bg-red-400'}`} />
                {fingerDetected ? 'Finger detected — reading pulse...' : 'Place finger on camera lens'}
              </div>
            </div>

            {/* Live Waveform */}
            <div className="relative h-24 bg-black/40 rounded-2xl border border-red-500/10 overflow-hidden p-2">
              <div className="absolute top-2 left-3 text-[9px] text-red-400/60 font-bold uppercase tracking-wider">PPG Waveform</div>
              <svg className="absolute inset-0 w-full h-full opacity-10" preserveAspectRatio="none">
                {[20, 40, 60, 80].map((y) => (
                  <line key={y} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`} stroke="#ef4444" strokeWidth="0.5" />
                ))}
                {Array.from({ length: 20 }, (_, i) => (
                  <line key={`v${i}`} x1={`${i * 5}%`} y1="0" x2={`${i * 5}%`} y2="100%" stroke="#ef4444" strokeWidth="0.5" />
                ))}
              </svg>
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full relative z-10">
                <defs>
                  <linearGradient id="waveGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.1" />
                    <stop offset="50%" stopColor="#ef4444" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="1" />
                  </linearGradient>
                  <linearGradient id="waveFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>
                {waveformPath && (
                  <>
                    <path d={waveformPath + ' L 100 100 L 0 100 Z'} fill="url(#waveFill)" />
                    <path d={waveformPath} fill="none" stroke="url(#waveGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    {waveform.length > 0 && (
                      <circle cx="100" cy={85 - waveform[waveform.length - 1] * 70} r="2.5"
                        fill="#ef4444" filter="url(#glow)" />
                    )}
                  </>
                )}
              </svg>
            </div>

            {/* Signal Quality */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-500 w-16 shrink-0">Signal</span>
              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${signalQuality}%`,
                    background: signalQuality > 60 ? '#22c55e' : signalQuality > 30 ? '#eab308' : '#ef4444',
                  }} />
              </div>
              <span className="text-[10px] text-slate-400 w-10 text-right">{signalQuality}%</span>
            </div>

            {/* Progress */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-slate-500 font-bold">MEASURING</span>
                <span className="text-[10px] text-slate-400 tabular-nums">{Math.round(progress)}%</span>
              </div>
              <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #dc2626, #ef4444, #f87171)' }} />
              </div>
            </div>

            {/* Debug info */}
            <div className="text-[9px] text-slate-600 text-center font-mono">{debugInfo}</div>

            <button onClick={() => { phaseRef.current = 'idle'; stopCamera(); setPhase('idle'); }}
              className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-xs font-bold touch-manipulation">
              Cancel
            </button>
          </div>
        )}

        {/* ── DONE ── */}
        {phase === 'done' && (
          <div className="text-center space-y-6">
            <div className="relative w-36 h-36 mx-auto">
              <div className="absolute inset-0 rounded-full bg-red-500/10 animate-pulse" />
              <div className="absolute inset-3 rounded-full bg-red-500/15 animate-pulse" style={{ animationDelay: '0.3s' }} />
              <div className="absolute inset-6 rounded-full bg-gradient-to-br from-red-600 to-rose-500 flex items-center justify-center shadow-2xl shadow-red-600/40">
                <Heart size={44} className="text-white" fill="currentColor" />
              </div>
            </div>

            <div>
              {bpm > 0 ? (
                <>
                  <div className="text-6xl font-black text-white tabular-nums mb-1" style={{ textShadow: '0 0 40px rgba(239,68,68,0.3)' }}>
                    {bpm}
                  </div>
                  <div className="text-lg text-red-400 font-bold">BPM</div>
                  <div className="mt-2 text-sm text-slate-400">
                    {bpm < 60 ? 'Resting — Athletic heart rate' :
                     bpm < 80 ? 'Normal resting heart rate' :
                     bpm < 100 ? 'Slightly elevated' :
                     'Elevated — were you active?'}
                  </div>
                  <div className="mt-3 inline-flex items-center gap-4 text-[10px] text-slate-500">
                    <span>🟢 40–60 Athletic</span>
                    <span>🔵 60–80 Normal</span>
                    <span>🟡 80–100 Elevated</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-xl font-bold text-slate-400 mb-2">Could not detect heart rate</div>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Press your finger firmly on the rear camera lens. Make sure you cover the entire lens and hold very still. The flashlight should be shining through your fingertip.
                  </p>
                </>
              )}
            </div>

            <div className="space-y-2">
              {bpm > 0 && (
                <button onClick={handleSave}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-red-600/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform touch-manipulation">
                  <Save size={16} /> Save {bpm} BPM to Vitals
                </button>
              )}
              <button onClick={handleRetry}
                className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-bold flex items-center justify-center gap-2 touch-manipulation">
                <RotateCcw size={14} /> Measure Again
              </button>
            </div>

            <p className="text-[10px] text-slate-600">
              For informational purposes only. Not a substitute for medical advice.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
