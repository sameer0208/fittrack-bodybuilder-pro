import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Heart, X, Camera, Loader2, Save, RotateCcw, Fingerprint } from 'lucide-react';
import toast from 'react-hot-toast';

const SAMPLE_RATE = 30;
const MEASUREMENT_SECONDS = 30;
const MIN_VALID_BPM = 40;
const MAX_VALID_BPM = 200;
const WARMUP_SECONDS = 3;
const WAVEFORM_POINTS = 200;

function peakDetect(signal, minDistance = 8) {
  const peaks = [];
  if (signal.length < 3) return peaks;
  const mean = signal.reduce((s, v) => s + v, 0) / signal.length;
  const threshold = mean * 1.02;
  for (let i = 2; i < signal.length - 2; i++) {
    if (
      signal[i] > threshold &&
      signal[i] > signal[i - 1] &&
      signal[i] > signal[i - 2] &&
      signal[i] >= signal[i + 1] &&
      signal[i] >= signal[i + 2]
    ) {
      if (peaks.length === 0 || i - peaks[peaks.length - 1] >= minDistance) {
        peaks.push(i);
      }
    }
  }
  return peaks;
}

function calcBPM(peaks, sampleRate) {
  if (peaks.length < 2) return 0;
  const intervals = [];
  for (let i = 1; i < peaks.length; i++) {
    intervals.push(peaks[i] - peaks[i - 1]);
  }
  intervals.sort((a, b) => a - b);
  const trimmed = intervals.slice(
    Math.floor(intervals.length * 0.1),
    Math.ceil(intervals.length * 0.9)
  );
  if (trimmed.length === 0) return 0;
  const avgInterval = trimmed.reduce((s, v) => s + v, 0) / trimmed.length;
  const bpm = Math.round((sampleRate * 60) / avgInterval);
  return bpm >= MIN_VALID_BPM && bpm <= MAX_VALID_BPM ? bpm : 0;
}

function smoothSignal(signal, windowSize = 5) {
  const result = [];
  for (let i = 0; i < signal.length; i++) {
    let sum = 0, count = 0;
    for (let j = Math.max(0, i - windowSize); j <= Math.min(signal.length - 1, i + windowSize); j++) {
      sum += signal[j];
      count++;
    }
    result.push(sum / count);
  }
  return result;
}

function bandpass(signal) {
  if (signal.length < 5) return signal;
  const mean = signal.reduce((s, v) => s + v, 0) / signal.length;
  const detrended = signal.map((v) => v - mean);
  return smoothSignal(detrended, 3);
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

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animRef = useRef(null);
  const bufferRef = useRef([]);
  const startTimeRef = useRef(0);
  const lastBeatRef = useRef(0);
  const frameCountRef = useRef(0);

  const stopCamera = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const triggerBeatPulse = useCallback(() => {
    setBeatPulse(true);
    setTimeout(() => setBeatPulse(false), 200);
  }, []);

  const startMeasurement = useCallback(async () => {
    setPhase('starting');
    setBpm(0);
    setLiveBpm(0);
    setProgress(0);
    setFingerDetected(false);
    setSignalQuality(0);
    setWaveform([]);
    bufferRef.current = [];
    frameCountRef.current = 0;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 128 },
          height: { ideal: 128 },
          frameRate: { ideal: SAMPLE_RATE },
        },
      });
      streamRef.current = stream;

      const track = stream.getVideoTracks()[0];
      try {
        await track.applyConstraints({ advanced: [{ torch: true }] });
      } catch {
        // Torch not supported — continue without it
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      startTimeRef.current = performance.now();
      setPhase('measuring');

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d', { willReadFrequently: true });
      if (!canvas || !ctx) return;

      canvas.width = 64;
      canvas.height = 64;

      const processFrame = () => {
        if (!streamRef.current) return;

        const now = performance.now();
        const elapsed = (now - startTimeRef.current) / 1000;
        frameCountRef.current++;

        if (videoRef.current && ctx) {
          ctx.drawImage(videoRef.current, 0, 0, 64, 64);
          const imageData = ctx.getImageData(16, 16, 32, 32).data;

          let redSum = 0, greenSum = 0, count = 0;
          for (let i = 0; i < imageData.length; i += 4) {
            redSum += imageData[i];
            greenSum += imageData[i + 1];
            count++;
          }
          const avgRed = redSum / count;
          const avgGreen = greenSum / count;

          const isFinger = avgRed > 100 && avgRed > avgGreen * 1.4;
          setFingerDetected(isFinger);

          if (isFinger && elapsed > WARMUP_SECONDS) {
            bufferRef.current.push(avgRed);

            const buffer = bufferRef.current;
            const recentWindow = buffer.slice(-SAMPLE_RATE * 8);

            if (recentWindow.length > SAMPLE_RATE * 3) {
              const filtered = bandpass(recentWindow);
              const peaks = peakDetect(filtered, Math.floor(SAMPLE_RATE * 0.35));
              const currentBpm = calcBPM(peaks, SAMPLE_RATE);

              if (currentBpm > 0) {
                setLiveBpm(currentBpm);

                const variance = filtered.reduce((s, v) => s + v * v, 0) / filtered.length;
                const quality = Math.min(100, Math.round(Math.sqrt(variance) * 50));
                setSignalQuality(quality);

                if (peaks.length >= 2) {
                  const lastInterval = peaks[peaks.length - 1] - peaks[peaks.length - 2];
                  const beatInterval = (lastInterval / SAMPLE_RATE) * 1000;
                  if (now - lastBeatRef.current > beatInterval * 0.8) {
                    lastBeatRef.current = now;
                    triggerBeatPulse();
                  }
                }
              }
            }

            const waveSlice = buffer.slice(-WAVEFORM_POINTS);
            if (waveSlice.length > 10) {
              const min = Math.min(...waveSlice);
              const max = Math.max(...waveSlice);
              const range = max - min || 1;
              setWaveform(waveSlice.map((v) => (v - min) / range));
            }
          }
        }

        const measuringElapsed = Math.max(0, elapsed - WARMUP_SECONDS);
        const prog = Math.min(100, (measuringElapsed / MEASUREMENT_SECONDS) * 100);
        setProgress(prog);

        if (elapsed >= MEASUREMENT_SECONDS + WARMUP_SECONDS) {
          const buffer = bufferRef.current;
          if (buffer.length > SAMPLE_RATE * 5) {
            const filtered = bandpass(buffer);
            const peaks = peakDetect(filtered, Math.floor(SAMPLE_RATE * 0.35));
            const finalBpm = calcBPM(peaks, SAMPLE_RATE);
            setBpm(finalBpm || liveBpm);
          } else {
            setBpm(liveBpm);
          }
          stopCamera();
          setPhase('done');
          return;
        }

        animRef.current = requestAnimationFrame(processFrame);
      };

      animRef.current = requestAnimationFrame(processFrame);
    } catch (err) {
      console.error('Camera error:', err);
      toast.error('Camera access denied or not available');
      setPhase('idle');
    }
  }, [stopCamera, triggerBeatPulse, liveBpm]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const handleSave = () => {
    if (bpm > 0 && onResult) {
      onResult(bpm);
    }
    onClose();
  };

  const handleRetry = () => {
    stopCamera();
    setPhase('idle');
    setBpm(0);
    setLiveBpm(0);
  };

  // Animated waveform path
  const waveformPath = useMemo(() => {
    if (waveform.length < 2) return '';
    const step = 100 / (waveform.length - 1);
    return waveform.map((v, i) => {
      const x = i * step;
      const y = 80 - v * 60;
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    }).join(' ');
  }, [waveform]);

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.95)' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.3) 0%, transparent 70%)' }} />
        {phase === 'measuring' && beatPulse && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full animate-ping opacity-10"
            style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.5) 0%, transparent 60%)' }} />
        )}
      </div>

      <button onClick={() => { stopCamera(); onClose(); }}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white touch-manipulation">
        <X size={20} />
      </button>

      <div className="relative w-full max-w-sm mx-4">

        {/* ── IDLE STATE ── */}
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
                Place your <strong className="text-red-400">fingertip</strong> gently over the <strong className="text-red-400">rear camera</strong> and hold still for 30 seconds.
              </p>
            </div>

            <div className="space-y-3 text-left max-w-xs mx-auto">
              {[
                { icon: Fingerprint, text: 'Cover the camera lens completely with your finger' },
                { icon: Camera, text: 'The flashlight will turn on automatically' },
                { icon: Heart, text: 'Stay still — movement affects accuracy' },
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

        {/* ── STARTING STATE ── */}
        {phase === 'starting' && (
          <div className="text-center space-y-4">
            <Loader2 size={48} className="text-red-400 animate-spin mx-auto" />
            <p className="text-sm text-slate-300 font-bold">Accessing camera...</p>
          </div>
        )}

        {/* ── MEASURING STATE ── */}
        {phase === 'measuring' && (
          <div className="space-y-5">
            {/* Hidden video & canvas */}
            <video ref={videoRef} playsInline muted className="hidden" />
            <canvas ref={canvasRef} className="hidden" />

            {/* Heart Animation */}
            <div className="text-center">
              <div className="relative w-28 h-28 mx-auto mb-4">
                {/* Pulse rings */}
                {beatPulse && (
                  <>
                    <div className="absolute inset-0 rounded-full border-2 border-red-500/40 animate-ping" />
                    <div className="absolute -inset-3 rounded-full border border-red-500/20 animate-ping" style={{ animationDelay: '0.1s' }} />
                  </>
                )}
                {/* Glow */}
                <div className="absolute inset-0 rounded-full transition-all duration-200"
                  style={{
                    background: beatPulse
                      ? 'radial-gradient(circle, rgba(239,68,68,0.4) 0%, rgba(239,68,68,0.1) 60%, transparent 80%)'
                      : 'radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 70%)',
                    transform: beatPulse ? 'scale(1.15)' : 'scale(1)',
                  }} />
                {/* Heart icon */}
                <div className="absolute inset-0 flex items-center justify-center transition-transform duration-150"
                  style={{ transform: beatPulse ? 'scale(1.2)' : 'scale(1)' }}>
                  <Heart size={52} className="text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                    fill="currentColor" strokeWidth={0} />
                </div>
              </div>

              {/* Live BPM */}
              <div className="mb-1">
                <span className="text-5xl font-black text-white tabular-nums tracking-tight transition-all duration-300"
                  style={{ textShadow: beatPulse ? '0 0 30px rgba(239,68,68,0.6)' : 'none' }}>
                  {liveBpm || '--'}
                </span>
                <span className="text-lg text-red-400 font-bold ml-2">BPM</span>
              </div>

              {/* Finger detection status */}
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
              <div className="absolute top-2 left-3 text-[9px] text-red-400/60 font-bold uppercase tracking-wider">ECG Waveform</div>
              {/* Grid lines */}
              <svg className="absolute inset-0 w-full h-full opacity-10" preserveAspectRatio="none">
                {[20, 40, 60, 80].map((y) => (
                  <line key={y} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`} stroke="#ef4444" strokeWidth="0.5" />
                ))}
                {Array.from({ length: 20 }, (_, i) => (
                  <line key={i} x1={`${i * 5}%`} y1="0" x2={`${i * 5}%`} y2="100%" stroke="#ef4444" strokeWidth="0.5" />
                ))}
              </svg>
              {/* Waveform line */}
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full relative z-10">
                {waveformPath && (
                  <>
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
                    </defs>
                    <path d={waveformPath + ' L 100 100 L 0 100 Z'} fill="url(#waveFill)" />
                    <path d={waveformPath} fill="none" stroke="url(#waveGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    {/* Glowing dot at the end */}
                    {waveform.length > 0 && (
                      <circle cx="100" cy={80 - waveform[waveform.length - 1] * 60} r="2.5"
                        fill="#ef4444" filter="url(#glow)">
                      </circle>
                    )}
                    <defs>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                      </filter>
                    </defs>
                  </>
                )}
              </svg>
              {/* Scan line */}
              <div className="absolute top-0 bottom-0 w-px bg-red-400/50 transition-all duration-100"
                style={{ left: `${progress}%` }} />
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

            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-slate-500 font-bold">MEASURING</span>
                <span className="text-[10px] text-slate-400 tabular-nums">{Math.round(progress)}%</span>
              </div>
              <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden relative">
                <div className="h-full rounded-full transition-all duration-300 relative overflow-hidden"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #dc2626, #ef4444, #f87171)',
                  }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_1.5s_infinite]"
                    style={{ animation: 'shimmer 1.5s infinite linear', backgroundSize: '200% 100%' }} />
                </div>
              </div>
            </div>

            <button onClick={() => { stopCamera(); setPhase('idle'); }}
              className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-xs font-bold touch-manipulation">
              Cancel
            </button>
          </div>
        )}

        {/* ── DONE STATE ── */}
        {phase === 'done' && (
          <div className="text-center space-y-6">
            <video ref={videoRef} className="hidden" />
            <canvas ref={canvasRef} className="hidden" />

            {/* Result heart */}
            <div className="relative w-36 h-36 mx-auto">
              <div className="absolute inset-0 rounded-full bg-red-500/10" style={{ animation: 'pulse 2s infinite' }} />
              <div className="absolute inset-3 rounded-full bg-red-500/15" style={{ animation: 'pulse 2s infinite 0.3s' }} />
              <div className="absolute inset-6 rounded-full bg-gradient-to-br from-red-600 to-rose-500 flex items-center justify-center shadow-2xl shadow-red-600/40">
                <Heart size={44} className="text-white" fill="currentColor" />
              </div>
            </div>

            {/* BPM Result */}
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
                    Make sure your finger fully covers the camera lens and hold very still. Try again in a well-lit room.
                  </p>
                </>
              )}
            </div>

            {/* Actions */}
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
