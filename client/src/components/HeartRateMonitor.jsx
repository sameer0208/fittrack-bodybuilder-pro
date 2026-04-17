import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Heart, X, Camera, Loader2, Save, RotateCcw, Fingerprint, Activity, Wind, Brain, Droplets } from 'lucide-react';
import toast from 'react-hot-toast';

const MEASUREMENT_SECONDS = 30;
const MIN_VALID_BPM = 40;
const MAX_VALID_BPM = 200;
const WARMUP_FRAMES = 90;
const WAVEFORM_POINTS = 150;
const TARGET_FPS = 30;
const FRAME_INTERVAL = 1000 / TARGET_FPS;

// ──────── Signal Processing Utilities ────────

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
  return movingAvg(detrend(raw), 2);
}

function peakDetect(signal, minDist) {
  const peaks = [];
  if (signal.length < 5) return peaks;
  const mean = signal.reduce((s, v) => s + v, 0) / signal.length;
  const stdDev = Math.sqrt(signal.reduce((s, v) => s + (v - mean) ** 2, 0) / signal.length);
  const threshold = mean + stdDev * 0.35;

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
  for (let i = 1; i < peaks.length; i++) intervals.push(peaks[i] - peaks[i - 1]);
  intervals.sort((a, b) => a - b);
  const trim = Math.max(1, Math.floor(intervals.length * 0.15));
  const trimmed = intervals.slice(trim, intervals.length - trim);
  if (!trimmed.length) return 0;
  const avg = trimmed.reduce((s, v) => s + v, 0) / trimmed.length;
  const bpm = Math.round((fps * 60) / avg);
  return bpm >= MIN_VALID_BPM && bpm <= MAX_VALID_BPM ? bpm : 0;
}

// ──────── Derived Biometric Calculations ────────

function calcRRIntervals(peaks, fps) {
  const intervals = [];
  for (let i = 1; i < peaks.length; i++) {
    const ms = ((peaks[i] - peaks[i - 1]) / fps) * 1000;
    if (ms > 300 && ms < 1500) intervals.push(ms);
  }
  return intervals;
}

function calcHRV(rrIntervals) {
  if (rrIntervals.length < 5) return { rmssd: null, sdnn: null, pnn50: null };

  const mean = rrIntervals.reduce((s, v) => s + v, 0) / rrIntervals.length;

  // SDNN — standard deviation of NN intervals
  const sdnn = Math.round(
    Math.sqrt(rrIntervals.reduce((s, v) => s + (v - mean) ** 2, 0) / (rrIntervals.length - 1)) * 10
  ) / 10;

  // RMSSD — root mean square of successive differences
  let sumSqDiff = 0;
  let nn50Count = 0;
  for (let i = 1; i < rrIntervals.length; i++) {
    const diff = rrIntervals[i] - rrIntervals[i - 1];
    sumSqDiff += diff * diff;
    if (Math.abs(diff) > 50) nn50Count++;
  }
  const rmssd = Math.round(Math.sqrt(sumSqDiff / (rrIntervals.length - 1)) * 10) / 10;

  // pNN50 — percentage of successive differences > 50ms
  const pnn50 = Math.round((nn50Count / (rrIntervals.length - 1)) * 100 * 10) / 10;

  return { rmssd, sdnn, pnn50 };
}

function calcLFHF(rrIntervals, fps) {
  if (rrIntervals.length < 10) return null;

  // Simple frequency domain via zero-crossing approach
  // Resample RR intervals to evenly-spaced time series
  const mean = rrIntervals.reduce((s, v) => s + v, 0) / rrIntervals.length;
  const detrended = rrIntervals.map((v) => v - mean);

  // Count zero crossings in different frequency bands
  // LF: 0.04-0.15 Hz (sympathetic + parasympathetic)
  // HF: 0.15-0.40 Hz (parasympathetic/vagal)
  const n = detrended.length;
  let lfPower = 0, hfPower = 0;

  // Simple DFT for LF and HF bands
  const sampleInterval = mean / 1000; // seconds
  for (let k = 0; k < n; k++) {
    const freq = k / (n * sampleInterval);
    if (freq < 0.04 || freq > 0.4) continue;

    let realPart = 0, imagPart = 0;
    for (let t = 0; t < n; t++) {
      const angle = (2 * Math.PI * k * t) / n;
      realPart += detrended[t] * Math.cos(angle);
      imagPart -= detrended[t] * Math.sin(angle);
    }
    const power = (realPart * realPart + imagPart * imagPart) / (n * n);

    if (freq >= 0.04 && freq < 0.15) lfPower += power;
    else if (freq >= 0.15 && freq <= 0.4) hfPower += power;
  }

  if (hfPower === 0) return null;
  return Math.round((lfPower / hfPower) * 100) / 100;
}

function calcSpO2(redSignal, blueSignal) {
  if (redSignal.length < 30 || blueSignal.length < 30) return null;

  const acdc = (signal) => {
    const mean = signal.reduce((s, v) => s + v, 0) / signal.length;
    if (mean === 0) return null;
    const ac = Math.sqrt(signal.reduce((s, v) => s + (v - mean) ** 2, 0) / signal.length);
    return ac / mean;
  };

  const ratioRed = acdc(redSignal);
  const ratioBlue = acdc(blueSignal);

  if (!ratioRed || !ratioBlue || ratioBlue === 0) return null;
  const R = ratioRed / ratioBlue;

  // Empirical calibration curve (approximation without true IR)
  // SpO2 ≈ 110 - 25 * R (standard pulse oximetry calibration)
  const spo2 = Math.round(110 - 25 * R);
  return Math.max(85, Math.min(100, spo2));
}

function calcRespiratoryRate(signal, fps) {
  if (signal.length < fps * 6) return null;

  // Low-pass filter the PPG signal to extract respiratory component (0.1-0.5 Hz)
  const smoothed = movingAvg(signal, Math.floor(fps * 0.8));
  const dt = detrend(smoothed);
  const superSmooth = movingAvg(dt, Math.floor(fps * 0.5));

  // Count zero crossings (positive direction)
  let crossings = 0;
  for (let i = 1; i < superSmooth.length; i++) {
    if (superSmooth[i - 1] <= 0 && superSmooth[i] > 0) crossings++;
  }

  const durationMin = superSmooth.length / fps / 60;
  if (durationMin === 0) return null;
  const rr = Math.round(crossings / durationMin);

  return rr >= 8 && rr <= 30 ? rr : null;
}

function calcStressIndex(hrv, lfhf, heartRate) {
  let stress = 50;

  if (hrv.rmssd != null) {
    // Low RMSSD = high stress
    if (hrv.rmssd < 15) stress = 85;
    else if (hrv.rmssd < 25) stress = 70;
    else if (hrv.rmssd < 40) stress = 50;
    else if (hrv.rmssd < 60) stress = 35;
    else stress = 20;
  }

  if (lfhf != null) {
    // High LF/HF = sympathetic dominance = stress
    const lfhfStress = lfhf > 3 ? 80 : lfhf > 2 ? 65 : lfhf > 1 ? 45 : 25;
    stress = Math.round(stress * 0.6 + lfhfStress * 0.4);
  }

  if (heartRate) {
    // Higher resting HR correlates with stress
    const hrFactor = heartRate > 90 ? 15 : heartRate > 80 ? 8 : heartRate > 70 ? 0 : -10;
    stress = Math.max(0, Math.min(100, stress + hrFactor));
  }

  return stress;
}

// ──────── Component ────────

export default function HeartRateMonitor({ onResult, onClose }) {
  const [phase, setPhase] = useState('idle');
  const [bpm, setBpm] = useState(0);
  const [liveBpm, setLiveBpm] = useState(0);
  const [progress, setProgress] = useState(0);
  const [fingerDetected, setFingerDetected] = useState(false);
  const [signalQuality, setSignalQuality] = useState(0);
  const [beatPulse, setBeatPulse] = useState(false);
  const [waveform, setWaveform] = useState([]);
  const [biometrics, setBiometrics] = useState(null);
  const [scanPhaseLabel, setScanPhaseLabel] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const redBufferRef = useRef([]);
  const blueBufferRef = useRef([]);
  const greenBufferRef = useRef([]);
  const rawFrameCount = useRef(0);
  const measureStartRef = useRef(0);
  const lastBeatRef = useRef(0);
  const actualFpsRef = useRef(TARGET_FPS);
  const fpsFrames = useRef([]);
  const phaseRef = useRef('idle');

  const stopCamera = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const triggerBeatPulse = useCallback(() => {
    setBeatPulse(true);
    setTimeout(() => setBeatPulse(false), 200);
  }, []);

  const startMeasurement = useCallback(async () => {
    phaseRef.current = 'starting';
    setPhase('starting');
    setBpm(0); setLiveBpm(0); setProgress(0);
    setFingerDetected(false); setSignalQuality(0);
    setWaveform([]); setBiometrics(null);
    setScanPhaseLabel('Accessing camera...');
    redBufferRef.current = []; blueBufferRef.current = []; greenBufferRef.current = [];
    rawFrameCount.current = 0; fpsFrames.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 160 }, height: { ideal: 160 } },
      });
      streamRef.current = stream;

      const track = stream.getVideoTracks()[0];
      try { await track.applyConstraints({ advanced: [{ torch: true }] }); } catch {}

      const video = videoRef.current;
      if (!video) { stopCamera(); setPhase('idle'); return; }
      video.srcObject = stream;
      video.setAttribute('playsinline', '');
      video.muted = true;

      await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => video.play().then(resolve).catch(reject);
        setTimeout(reject, 5000);
      });
      await new Promise((r) => setTimeout(r, 500));

      const canvas = canvasRef.current;
      if (!canvas) { stopCamera(); setPhase('idle'); return; }
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      canvas.width = 64; canvas.height = 64;

      phaseRef.current = 'measuring';
      setPhase('measuring');
      measureStartRef.current = performance.now();

      timerRef.current = setInterval(() => {
        if (phaseRef.current !== 'measuring' || !streamRef.current) return;

        const now = performance.now();
        fpsFrames.current.push(now);
        fpsFrames.current = fpsFrames.current.filter((t) => now - t < 2000);
        if (fpsFrames.current.length > 2) actualFpsRef.current = fpsFrames.current.length / 2;

        rawFrameCount.current++;
        const elapsed = (now - measureStartRef.current) / 1000;

        try { ctx.drawImage(video, 0, 0, 64, 64); } catch { return; }

        const data = ctx.getImageData(8, 8, 48, 48).data;
        let rS = 0, gS = 0, bS = 0, px = 0;
        for (let i = 0; i < data.length; i += 16) {
          rS += data[i]; gS += data[i + 1]; bS += data[i + 2]; px++;
        }
        const avgR = rS / px, avgG = gS / px, avgB = bS / px;
        const isFinger = avgR > 80 && avgR > avgG * 1.2 && avgR > avgB * 1.3;
        setFingerDetected(isFinger);

        if (rawFrameCount.current <= WARMUP_FRAMES) {
          setScanPhaseLabel(`Stabilizing... ${WARMUP_FRAMES - rawFrameCount.current}`);
          if (isFinger) {
            redBufferRef.current.push(avgR);
            blueBufferRef.current.push(avgB);
            greenBufferRef.current.push(avgG);
          }
          setProgress(Math.min(5, (rawFrameCount.current / WARMUP_FRAMES) * 5));
          return;
        }

        if (isFinger) {
          redBufferRef.current.push(avgR);
          blueBufferRef.current.push(avgB);
          greenBufferRef.current.push(avgG);
        }

        const buffer = redBufferRef.current;
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
        }

        if (buffer.length > 5) {
          const slice = buffer.slice(-WAVEFORM_POINTS);
          const min = Math.min(...slice), max = Math.max(...slice), range = max - min || 1;
          setWaveform(slice.map((v) => (v - min) / range));
        }

        // Progress & phase labels
        const warmupSec = WARMUP_FRAMES / TARGET_FPS;
        const measuringTime = Math.max(0, elapsed - warmupSec);
        const prog = Math.min(100, (measuringTime / MEASUREMENT_SECONDS) * 100);
        setProgress(prog);

        if (prog < 30) setScanPhaseLabel('Capturing PPG signal...');
        else if (prog < 60) setScanPhaseLabel('Analyzing heart rhythm...');
        else if (prog < 85) setScanPhaseLabel('Computing biometrics...');
        else setScanPhaseLabel('Finalizing measurements...');

        if (measuringTime >= MEASUREMENT_SECONDS) {
          phaseRef.current = 'analyzing';
          setScanPhaseLabel('Processing all metrics...');

          // Final calculations
          const fps = actualFpsRef.current;
          const redBuf = redBufferRef.current;
          const blueBuf = blueBufferRef.current;

          const filtered = processSignal(redBuf);
          const minDist = Math.max(5, Math.floor(fps * 0.33));
          const peaks = peakDetect(filtered, minDist);
          const finalBpm = calcBPM(peaks, fps) || liveBpm || 0;

          const rrIntervals = calcRRIntervals(peaks, fps);
          const hrv = calcHRV(rrIntervals);
          const lfhf = calcLFHF(rrIntervals, fps);
          const spo2 = calcSpO2(redBuf, blueBuf);
          const respiratoryRate = calcRespiratoryRate(redBuf, fps);
          const stressIndex = calcStressIndex(hrv, lfhf, finalBpm);

          const finalSignalQuality = Math.min(100, Math.max(10,
            Math.round(
              (peaks.length > 15 ? 30 : peaks.length * 2) +
              (hrv.rmssd != null ? 25 : 0) +
              (spo2 != null ? 20 : 0) +
              (respiratoryRate != null ? 15 : 0) +
              (redBuf.length > 500 ? 10 : redBuf.length / 50)
            )
          ));

          setBpm(finalBpm);
          setBiometrics({
            heartRate: finalBpm,
            hrvRMSSD: hrv.rmssd,
            hrvSDNN: hrv.sdnn,
            hrvPNN50: hrv.pnn50,
            hrvLFHF: lfhf,
            spo2,
            respiratoryRate,
            stressIndex,
            signalQuality: finalSignalQuality,
            rrIntervals,
            scanDuration: MEASUREMENT_SECONDS,
          });

          stopCamera();
          setPhase('done');
        }
      }, FRAME_INTERVAL);

    } catch (err) {
      console.error('Camera error:', err);
      toast.error(err.name === 'NotAllowedError' ? 'Camera permission denied' : 'Could not access camera');
      phaseRef.current = 'idle'; setPhase('idle');
    }
  }, [stopCamera, triggerBeatPulse, liveBpm]);

  useEffect(() => {
    return () => { phaseRef.current = 'idle'; stopCamera(); };
  }, [stopCamera]);

  const handleSave = () => {
    if (biometrics && onResult) onResult(biometrics);
    onClose();
  };

  const handleRetry = () => {
    phaseRef.current = 'idle'; stopCamera();
    setPhase('idle'); setBpm(0); setLiveBpm(0);
    setWaveform([]); setBiometrics(null);
  };

  const waveformPath = useMemo(() => {
    if (waveform.length < 2) return '';
    const step = 100 / (waveform.length - 1);
    return waveform.map((v, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${85 - v * 70}`).join(' ');
  }, [waveform]);

  const stressLabel = (v) => v <= 25 ? 'Low' : v <= 50 ? 'Moderate' : v <= 75 ? 'High' : 'Very High';
  const stressColor = (v) => v <= 25 ? 'text-emerald-400' : v <= 50 ? 'text-yellow-400' : v <= 75 ? 'text-orange-400' : 'text-red-400';

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center overflow-y-auto" style={{ background: 'rgba(0,0,0,0.97)' }}>
      <video ref={videoRef} playsInline muted style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }} />
      <canvas ref={canvasRef} style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }} />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.3) 0%, transparent 70%)' }} />
        {phase === 'measuring' && beatPulse && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full animate-ping opacity-10"
            style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.5) 0%, transparent 60%)' }} />
        )}
      </div>

      <button onClick={() => { phaseRef.current = 'idle'; stopCamera(); onClose(); }}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white touch-manipulation">
        <X size={20} />
      </button>

      <div className="relative w-full max-w-sm mx-4 my-8">

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
              <h2 className="text-2xl font-black text-white mb-1">Biometric Scanner</h2>
              <p className="text-xs text-slate-500 mb-3">Complete Health Scan in 30 Seconds</p>
              <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
                Place your <strong className="text-red-400">fingertip</strong> over the <strong className="text-red-400">rear camera</strong>. One scan measures:
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">
              {[
                { icon: Heart, label: 'Heart Rate', sub: 'BPM', color: 'text-red-400' },
                { icon: Activity, label: 'HRV', sub: 'RMSSD / SDNN', color: 'text-emerald-400' },
                { icon: Droplets, label: 'SpO2', sub: 'Blood Oxygen', color: 'text-cyan-400' },
                { icon: Wind, label: 'Resp Rate', sub: 'Breaths/min', color: 'text-blue-400' },
                { icon: Brain, label: 'Stress Level', sub: 'LF/HF Ratio', color: 'text-purple-400' },
                { icon: Fingerprint, label: 'Signal Quality', sub: 'Accuracy %', color: 'text-amber-400' },
              ].map(({ icon: Icon, label, sub, color }, i) => (
                <div key={i} className="flex items-center gap-2.5 p-2.5 bg-white/[0.03] border border-white/5 rounded-xl text-left">
                  <Icon size={16} className={`${color} shrink-0`} />
                  <div>
                    <div className="text-[11px] font-bold text-white">{label}</div>
                    <div className="text-[9px] text-slate-500">{sub}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-left max-w-xs mx-auto">
              {[
                { icon: Fingerprint, text: 'Cover the camera lens completely with your fingertip' },
                { icon: Camera, text: 'Flash turns on automatically — light passes through your finger' },
                { icon: Heart, text: 'Hold perfectly still for 30 seconds' },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-start gap-3 p-2.5 bg-white/[0.02] border border-white/5 rounded-xl">
                  <Icon size={14} className="text-red-400 shrink-0 mt-0.5" />
                  <span className="text-[10px] text-slate-400">{text}</span>
                </div>
              ))}
            </div>

            <button onClick={startMeasurement}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-red-600/25 active:scale-[0.98] transition-all touch-manipulation flex items-center justify-center gap-2">
              <Heart size={18} /> Start Full Scan
            </button>
            <p className="text-[10px] text-slate-600">For informational purposes only. Not a medical device.</p>
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
          <div className="space-y-4">
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-3">
                {beatPulse && <div className="absolute inset-0 rounded-full border-2 border-red-500/40 animate-ping" />}
                <div className="absolute inset-0 rounded-full transition-all duration-200"
                  style={{ background: beatPulse ? 'radial-gradient(circle, rgba(239,68,68,0.4) 0%, transparent 80%)' : 'radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 70%)', transform: beatPulse ? 'scale(1.15)' : 'scale(1)' }} />
                <div className="absolute inset-0 flex items-center justify-center transition-transform duration-150" style={{ transform: beatPulse ? 'scale(1.2)' : 'scale(1)' }}>
                  <Heart size={44} className="text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]" fill="currentColor" strokeWidth={0} />
                </div>
              </div>

              <div className="mb-1">
                <span className="text-5xl font-black text-white tabular-nums" style={{ textShadow: beatPulse ? '0 0 30px rgba(239,68,68,0.6)' : 'none' }}>
                  {liveBpm || '--'}
                </span>
                <span className="text-lg text-red-400 font-bold ml-2">BPM</span>
              </div>

              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${fingerDetected ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${fingerDetected ? 'bg-emerald-400' : 'bg-red-400'}`} />
                {fingerDetected ? 'Finger detected — reading pulse...' : 'Place finger on camera lens'}
              </div>
            </div>

            {/* Waveform */}
            <div className="relative h-20 bg-black/40 rounded-2xl border border-red-500/10 overflow-hidden p-2">
              <div className="absolute top-2 left-3 text-[9px] text-red-400/60 font-bold uppercase tracking-wider">PPG Waveform</div>
              <svg className="absolute inset-0 w-full h-full opacity-10" preserveAspectRatio="none">
                {[20, 40, 60, 80].map((y) => <line key={y} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`} stroke="#ef4444" strokeWidth="0.5" />)}
              </svg>
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full relative z-10">
                <defs>
                  <linearGradient id="wg" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#ef4444" stopOpacity="0.1" /><stop offset="100%" stopColor="#ef4444" stopOpacity="1" /></linearGradient>
                  <linearGradient id="wf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef4444" stopOpacity="0.15" /><stop offset="100%" stopColor="#ef4444" stopOpacity="0" /></linearGradient>
                </defs>
                {waveformPath && (
                  <>
                    <path d={waveformPath + ' L 100 100 L 0 100 Z'} fill="url(#wf)" />
                    <path d={waveformPath} fill="none" stroke="url(#wg)" strokeWidth="1.5" strokeLinecap="round" />
                  </>
                )}
              </svg>
            </div>

            {/* Signal + Progress */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-500 w-14 shrink-0">Signal</span>
              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${signalQuality}%`, background: signalQuality > 60 ? '#22c55e' : signalQuality > 30 ? '#eab308' : '#ef4444' }} />
              </div>
              <span className="text-[10px] text-slate-400 w-8 text-right">{signalQuality}%</span>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase">{scanPhaseLabel}</span>
                <span className="text-[10px] text-slate-400 tabular-nums">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #dc2626, #ef4444, #f87171)' }} />
              </div>
            </div>

            <button onClick={() => { phaseRef.current = 'idle'; stopCamera(); setPhase('idle'); }}
              className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-xs font-bold touch-manipulation">
              Cancel
            </button>
          </div>
        )}

        {/* ── DONE ── */}
        {phase === 'done' && biometrics && (
          <div className="space-y-5">
            {/* Heart + BPM header */}
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-3">
                <div className="absolute inset-0 rounded-full bg-red-500/10 animate-pulse" />
                <div className="absolute inset-3 rounded-full bg-gradient-to-br from-red-600 to-rose-500 flex items-center justify-center shadow-2xl shadow-red-600/40">
                  <Heart size={36} className="text-white" fill="currentColor" />
                </div>
              </div>
              {bpm > 0 ? (
                <>
                  <div className="text-5xl font-black text-white tabular-nums mb-0.5" style={{ textShadow: '0 0 40px rgba(239,68,68,0.3)' }}>{bpm}</div>
                  <div className="text-sm text-red-400 font-bold">BPM</div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {bpm < 60 ? 'Athletic resting rate' : bpm < 80 ? 'Normal resting rate' : bpm < 100 ? 'Slightly elevated' : 'Elevated'}
                  </div>
                </>
              ) : (
                <div className="text-sm text-slate-400 font-bold">Could not detect heart rate</div>
              )}
            </div>

            {/* Biometric Results Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* HRV RMSSD */}
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Activity size={14} className="text-emerald-400" />
                  <span className="text-[10px] text-slate-500 font-bold uppercase">HRV (RMSSD)</span>
                </div>
                <div className="text-2xl font-black text-white tabular-nums">
                  {biometrics.hrvRMSSD != null ? biometrics.hrvRMSSD : '--'}
                  <span className="text-[10px] text-slate-500 ml-1">ms</span>
                </div>
                <div className="text-[9px] text-slate-500 mt-1">
                  {biometrics.hrvRMSSD != null ? (
                    biometrics.hrvRMSSD > 50 ? 'Excellent recovery' :
                    biometrics.hrvRMSSD > 30 ? 'Good balance' :
                    biometrics.hrvRMSSD > 20 ? 'Below average' : 'Low — rest needed'
                  ) : 'Insufficient data'}
                </div>
              </div>

              {/* SpO2 */}
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Droplets size={14} className="text-cyan-400" />
                  <span className="text-[10px] text-slate-500 font-bold uppercase">SpO2</span>
                </div>
                <div className="text-2xl font-black text-white tabular-nums">
                  {biometrics.spo2 != null ? biometrics.spo2 : '--'}
                  <span className="text-[10px] text-slate-500 ml-1">%</span>
                </div>
                <div className="text-[9px] text-slate-500 mt-1">
                  {biometrics.spo2 != null ? (
                    biometrics.spo2 >= 97 ? 'Excellent oxygen levels' :
                    biometrics.spo2 >= 95 ? 'Normal range' :
                    biometrics.spo2 >= 93 ? 'Slightly low' : 'Below normal'
                  ) : 'Insufficient data'}
                </div>
              </div>

              {/* Respiratory Rate */}
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Wind size={14} className="text-blue-400" />
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Resp Rate</span>
                </div>
                <div className="text-2xl font-black text-white tabular-nums">
                  {biometrics.respiratoryRate != null ? biometrics.respiratoryRate : '--'}
                  <span className="text-[10px] text-slate-500 ml-1">br/m</span>
                </div>
                <div className="text-[9px] text-slate-500 mt-1">
                  {biometrics.respiratoryRate != null ? (
                    biometrics.respiratoryRate >= 12 && biometrics.respiratoryRate <= 18 ? 'Normal range' :
                    biometrics.respiratoryRate < 12 ? 'Below average' : 'Slightly elevated'
                  ) : 'Insufficient data'}
                </div>
              </div>

              {/* Stress */}
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Brain size={14} className="text-purple-400" />
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Stress Level</span>
                </div>
                <div className={`text-2xl font-black tabular-nums ${stressColor(biometrics.stressIndex)}`}>
                  {biometrics.stressIndex != null ? biometrics.stressIndex : '--'}
                  <span className="text-[10px] text-slate-500 ml-1">/100</span>
                </div>
                <div className="text-[9px] text-slate-500 mt-1">
                  {biometrics.stressIndex != null ? stressLabel(biometrics.stressIndex) : 'Insufficient data'}
                </div>
              </div>
            </div>

            {/* Extended HRV details */}
            {(biometrics.hrvSDNN != null || biometrics.hrvPNN50 != null || biometrics.hrvLFHF != null) && (
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                <div className="text-[10px] text-slate-500 font-bold uppercase mb-2">HRV Details</div>
                <div className="grid grid-cols-3 gap-2">
                  {biometrics.hrvSDNN != null && (
                    <div>
                      <div className="text-lg font-black text-white tabular-nums">{biometrics.hrvSDNN}</div>
                      <div className="text-[9px] text-slate-500">SDNN (ms)</div>
                    </div>
                  )}
                  {biometrics.hrvPNN50 != null && (
                    <div>
                      <div className="text-lg font-black text-white tabular-nums">{biometrics.hrvPNN50}</div>
                      <div className="text-[9px] text-slate-500">pNN50 (%)</div>
                    </div>
                  )}
                  {biometrics.hrvLFHF != null && (
                    <div>
                      <div className="text-lg font-black text-white tabular-nums">{biometrics.hrvLFHF}</div>
                      <div className="text-[9px] text-slate-500">LF/HF</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Signal Quality Bar */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-500 w-20 shrink-0">Signal Quality</span>
              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${biometrics.signalQuality}%`, background: biometrics.signalQuality > 60 ? '#22c55e' : biometrics.signalQuality > 30 ? '#eab308' : '#ef4444' }} />
              </div>
              <span className="text-[10px] text-slate-400 w-10 text-right">{biometrics.signalQuality}%</span>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button onClick={handleSave}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-red-600/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform touch-manipulation">
                <Save size={16} /> Save Scan Results
              </button>
              <button onClick={handleRetry}
                className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-bold flex items-center justify-center gap-2 touch-manipulation">
                <RotateCcw size={14} /> Scan Again
              </button>
            </div>
            <p className="text-[10px] text-slate-600 text-center">For informational purposes only. Not a substitute for medical advice.</p>
          </div>
        )}
      </div>
    </div>
  );
}
