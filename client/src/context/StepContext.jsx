import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useApp } from './AppContext';
import API from '../utils/api';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

const StepContext = createContext(null);
export const useSteps = () => useContext(StepContext);

const today = () => dayjs().format('YYYY-MM-DD');

export function StepProvider({ children }) {
  const { user } = useApp();

  const [steps, setSteps] = useState(0);
  const [goal, setGoal] = useState(10000);
  const [hourly, setHourly] = useState(new Array(24).fill(0));
  const [isTracking, setIsTracking] = useState(false);
  const [history, setHistory] = useState([]);
  const [weekStats, setWeekStats] = useState(null);
  const [monthStats, setMonthStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMinutes, setActiveMinutes] = useState(0);
  const [motionSupported, setMotionSupported] = useState(true);

  const accelRef = useRef({ lastMag: 0, lastTime: 0, stepBuffer: 0 });
  const stepsRef = useRef(0);
  const hourlyRef = useRef(new Array(24).fill(0));
  const saveTimerRef = useRef(null);
  const activeMinRef = useRef(0);
  const lastActiveMinute = useRef(-1);
  const trackingRef = useRef(false);

  useEffect(() => { stepsRef.current = steps; }, [steps]);
  useEffect(() => { hourlyRef.current = [...hourly]; }, [hourly]);
  useEffect(() => { trackingRef.current = isTracking; }, [isTracking]);

  const distanceKm = useMemo(() => {
    const stride = ((user?.height || 170) * 0.00415);
    return parseFloat(((steps * stride) / 1000).toFixed(2));
  }, [steps, user?.height]);

  const caloriesBurned = useMemo(() => {
    return Math.round(steps * 0.04 * ((user?.currentWeight || 70) / 70));
  }, [steps, user?.currentWeight]);

  const progress = useMemo(() => Math.min(steps / Math.max(goal, 1), 1), [steps, goal]);

  // Load today's data
  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [todayRes, histRes, statsRes] = await Promise.all([
        API.get(`/steps/today/${today()}`),
        API.get('/steps/history?limit=30'),
        API.get('/steps/stats'),
      ]);
      const d = todayRes.data;
      setSteps(d.steps || 0);
      stepsRef.current = d.steps || 0;
      setGoal(d.goal || 10000);
      setHourly(d.hourly?.length === 24 ? d.hourly : new Array(24).fill(0));
      hourlyRef.current = d.hourly?.length === 24 ? [...d.hourly] : new Array(24).fill(0);
      setActiveMinutes(d.activeMinutes || 0);
      activeMinRef.current = d.activeMinutes || 0;
      setHistory(histRes.data);
      setWeekStats(statsRes.data.week);
      setMonthStats(statsRes.data.month);
    } catch {}
    setLoading(false);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const saveToServer = useCallback(async () => {
    try {
      await API.post('/steps', {
        date: today(),
        steps: stepsRef.current,
        goal,
        hourly: hourlyRef.current,
        activeMinutes: activeMinRef.current,
        source: trackingRef.current ? 'accelerometer' : 'manual',
      });
    } catch {}
  }, [goal]);

  useEffect(() => {
    if (!isTracking) return;
    saveTimerRef.current = setInterval(saveToServer, 30000);
    return () => clearInterval(saveTimerRef.current);
  }, [isTracking, saveToServer]);

  const handleMotion = useCallback((e) => {
    const acc = e.accelerationIncludingGravity;
    if (!acc) return;

    const mag = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);
    const now = Date.now();
    const ref = accelRef.current;
    const delta = mag - ref.lastMag;

    if (delta > 3.2 && now - ref.lastTime > 280) {
      ref.lastTime = now;
      ref.stepBuffer++;

      if (ref.stepBuffer >= 2) {
        const newSteps = stepsRef.current + ref.stepBuffer;
        stepsRef.current = newSteps;
        setSteps(newSteps);

        const h = new Date().getHours();
        const updated = [...hourlyRef.current];
        updated[h] += ref.stepBuffer;
        hourlyRef.current = updated;
        setHourly(updated);

        const currentMin = Math.floor(now / 60000);
        if (currentMin !== lastActiveMinute.current) {
          lastActiveMinute.current = currentMin;
          activeMinRef.current++;
          setActiveMinutes(activeMinRef.current);
        }

        ref.stepBuffer = 0;
      }
    }
    ref.lastMag = mag;
  }, []);

  const motionHandlerRef = useRef(handleMotion);
  useEffect(() => { motionHandlerRef.current = handleMotion; }, [handleMotion]);

  const startTracking = useCallback(async () => {
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const perm = await DeviceMotionEvent.requestPermission();
        if (perm !== 'granted') {
          toast.error('Motion sensor permission denied');
          setMotionSupported(false);
          return;
        }
      } catch {
        toast.error('Could not access motion sensor');
        setMotionSupported(false);
        return;
      }
    } else if (typeof DeviceMotionEvent === 'undefined') {
      setMotionSupported(false);
      toast.error('Motion sensor not available on this device');
      return;
    }

    window.addEventListener('devicemotion', motionHandlerRef.current);
    setIsTracking(true);
    toast.success('Step tracking started');
  }, []);

  const stopTracking = useCallback(() => {
    window.removeEventListener('devicemotion', motionHandlerRef.current);
    setIsTracking(false);
    saveToServer();
    toast.success(`Tracking paused — ${stepsRef.current.toLocaleString()} steps saved`);
  }, [saveToServer]);

  const addManualSteps = useCallback((val) => {
    if (!val || val < 0) return;
    const newSteps = stepsRef.current + val;
    stepsRef.current = newSteps;
    setSteps(newSteps);

    const h = new Date().getHours();
    const updated = [...hourlyRef.current];
    updated[h] += val;
    hourlyRef.current = updated;
    setHourly(updated);

    API.post('/steps', {
      date: today(),
      steps: newSteps,
      goal,
      hourly: updated,
      activeMinutes: activeMinRef.current,
      source: 'manual',
    }).then(() => toast.success(`+${val.toLocaleString()} steps added`))
      .catch(() => toast.error('Failed to save'));
  }, [goal]);

  const adjustGoal = useCallback((delta) => {
    setGoal((g) => {
      const next = Math.max(1000, g + delta);
      API.post('/steps', {
        date: today(),
        steps: stepsRef.current,
        goal: next,
        hourly: hourlyRef.current,
        activeMinutes: activeMinRef.current,
        source: trackingRef.current ? 'accelerometer' : 'manual',
      }).catch(() => {});
      return next;
    });
  }, []);

  const resetToday = useCallback(() => {
    setSteps(0);
    stepsRef.current = 0;
    const fresh = new Array(24).fill(0);
    setHourly(fresh);
    hourlyRef.current = fresh;
    activeMinRef.current = 0;
    setActiveMinutes(0);
    API.post('/steps', {
      date: today(), steps: 0, goal, hourly: fresh, activeMinutes: 0, source: 'manual',
    }).then(() => toast.success('Steps reset'))
      .catch(() => toast.error('Failed to reset'));
  }, [goal]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.removeEventListener('devicemotion', motionHandlerRef.current);
      clearInterval(saveTimerRef.current);
    };
  }, []);

  const value = useMemo(() => ({
    steps, goal, hourly, isTracking, history, weekStats, monthStats,
    loading, activeMinutes, motionSupported, distanceKm, caloriesBurned, progress,
    startTracking, stopTracking, addManualSteps, adjustGoal, resetToday, loadData,
  }), [
    steps, goal, hourly, isTracking, history, weekStats, monthStats,
    loading, activeMinutes, motionSupported, distanceKm, caloriesBurned, progress,
    startTracking, stopTracking, addManualSteps, adjustGoal, resetToday, loadData,
  ]);

  return <StepContext.Provider value={value}>{children}</StepContext.Provider>;
}
