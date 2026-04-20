import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import API from '../utils/api';
import { sendBrowserNotification } from '../utils/notifications';

/**
 * AppContext — cloud-first data layer.
 *
 * When a user is logged in (has a JWT token) ALL user-specific data
 * (workouts, nutrition, notifications) lives exclusively in MongoDB
 * and React state.  localStorage is ONLY used for:
 *   - ft_token        (auth JWT)
 *   - ft_session       (session flag)
 *   - ft_local_user    (offline-only profile — no account)
 *
 * This eliminates cross-user data leakage on shared browsers.
 */

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('ft_token'));
  const [loading, setLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState(false);

  // In-memory stores — populated from server, never from localStorage
  const [workoutLogs, setWorkoutLogs] = useState({});
  const workoutLogsRef = useRef(workoutLogs);
  workoutLogsRef.current = workoutLogs;
  const [nutritionLogs, setNutritionLogs] = useState({});
  const nutritionLogsRef = useRef(nutritionLogs);
  nutritionLogsRef.current = nutritionLogs;
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem('ft_notifications');
      if (!stored) return [];
      const { date, items } = JSON.parse(stored);
      const today = new Date().toISOString().split('T')[0];
      if (date !== today) {
        localStorage.removeItem('ft_notifications');
        return [];
      }
      return items || [];
    } catch {
      return [];
    }
  });

  // ── Health check ──────────────────────────────────────────────────────────
  const checkHealth = useCallback(() => {
    API.get('/health')
      .then(() => setBackendOnline(true))
      .catch(() => setBackendOnline(false));
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    window.addEventListener('focus', checkHealth);
    return () => { clearInterval(interval); window.removeEventListener('focus', checkHealth); };
  }, [checkHealth]);

  // ── Auth / user loading ───────────────────────────────────────────────────
  useEffect(() => {
    if (token) {
      API.get('/users/me')
        .then(({ data }) => {
          setUser(data);
          localStorage.setItem('ft_session', 'true');
          setLoading(false);
        })
        .catch(() => {
          localStorage.removeItem('ft_token');
          localStorage.removeItem('ft_session');
          setToken(null);
          setLoading(false);
        });
    } else {
      const session = localStorage.getItem('ft_session');
      const localProfile = localStorage.getItem('ft_local_user');
      if (session === 'true') {
        // Session flag without a token means the JWT was invalidated — force re-login
        localStorage.removeItem('ft_session');
      } else if (localProfile) {
        // Pure offline user (onboarded but never registered) — allow local profile
        setUser(JSON.parse(localProfile));
      }
      setLoading(false);
    }
  }, [token]);

  // Clear in-memory stores on logout / user change
  useEffect(() => {
    if (!user) {
      setWorkoutLogs({});
      setNutritionLogs({});
      setNotifications([]);
      setStats(null);
      try { localStorage.removeItem('ft_notifications'); localStorage.removeItem('ft_reminder_fired'); } catch {}
    }
  }, [user]);

  const register = async (data) => {
    const res = await API.post('/users/register', data);
    localStorage.setItem('ft_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const login = async (email, password) => {
    const res = await API.post('/users/login', { email, password });
    localStorage.setItem('ft_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('ft_token');
    localStorage.removeItem('ft_session');
    setToken(null);
    setUser(null);
  };

  const loginLocal = () => {
    const localProfile = localStorage.getItem('ft_local_user');
    if (!localProfile) throw new Error('No local profile found');
    localStorage.setItem('ft_session', 'true');
    setUser(JSON.parse(localProfile));
  };

  const saveLocalProfile = (profileData) => {
    const bmi = (profileData.currentWeight / Math.pow(profileData.height / 100, 2)).toFixed(1);
    const bmr = profileData.gender === 'female'
      ? 10 * profileData.currentWeight + 6.25 * profileData.height - 5 * (profileData.age || 25) - 161
      : 10 * profileData.currentWeight + 6.25 * profileData.height - 5 * (profileData.age || 25) + 5;
    const tdee = Math.round(bmr * 1.725);
    const goal = profileData.fitnessGoal || 'bulk';
    const dailyCalories = goal === 'bulk' ? tdee + 500 : goal === 'cut' ? Math.max(1200, tdee - 500) : goal === 'strength' ? tdee + 300 : goal === 'endurance' ? tdee + 200 : tdee;
    const w = profileData.currentWeight;
    const proteinTarget = goal === 'cut' ? Math.round(w * 2.4) : (goal === 'bulk' || goal === 'strength') ? Math.round(w * 2.2) : goal === 'endurance' ? Math.round(w * 1.6) : Math.round(w * 1.8);
    const enriched = {
      ...profileData,
      bmi, dailyCalories, proteinTarget,
      streak: 0, totalWorkouts: 0,
      programStartDate: new Date().toISOString(),
      weightHistory: [{ weight: profileData.currentWeight, date: new Date().toISOString() }],
      id: 'local',
    };
    localStorage.setItem('ft_local_user', JSON.stringify(enriched));
    localStorage.setItem('ft_session', 'true');
    setUser(enriched);
    return enriched;
  };

  const updateUser = async (data) => {
    if (token && backendOnline) {
      const res = await API.put('/users/update', data);
      setUser(res.data);
      return res.data;
    }
    const updated = { ...user, ...data };
    if (data.currentWeight && data.currentWeight !== user.currentWeight) {
      updated.weightHistory = [
        ...(user.weightHistory || []),
        { weight: data.currentWeight, date: new Date().toISOString() },
      ];
      updated.bmi = (data.currentWeight / Math.pow((data.height || user.height) / 100, 2)).toFixed(1);
    }
    localStorage.setItem('ft_local_user', JSON.stringify(updated));
    setUser(updated);
    return updated;
  };

  const syncToCloud = async (email, password) => {
    const localUser = JSON.parse(localStorage.getItem('ft_local_user') || '{}');
    const res = await API.post('/users/register', {
      name: localUser.name || user?.name || 'Athlete',
      email, password,
      currentWeight: localUser.currentWeight || user?.currentWeight,
      height: localUser.height || user?.height,
      targetWeight: localUser.targetWeight || user?.targetWeight,
      age: localUser.age || user?.age,
      gender: localUser.gender || user?.gender || 'male',
      fitnessLevel: localUser.fitnessLevel || user?.fitnessLevel || 'intermediate',
    });
    localStorage.setItem('ft_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  // ── Workout logs (server-only when logged in) ─────────────────────────────
  const saveWorkoutLog = useCallback(async (sessionKey, logData) => {
    const { exerciseLogs: _uiLogs, ...serverData } = logData;

    if (token) {
      const res = await API.post('/workouts/log', { workoutDay: sessionKey, ...serverData });
      setWorkoutLogs((prev) => ({ ...prev, [sessionKey]: { ...res.data, sessionKey } }));
      return res.data;
    }

    // Local-only fallback (no account)
    const data = { ...logData, sessionKey, savedAt: new Date().toISOString() };
    setWorkoutLogs((prev) => ({ ...prev, [sessionKey]: data }));
    return data;
  }, [token]);

  const getWorkoutLog = useCallback((sessionKey) => {
    return workoutLogs[sessionKey] || null;
  }, [workoutLogs]);

  const fetchWorkoutLog = useCallback(async (sessionKey) => {
    if (token) {
      try {
        const res = await API.get(`/workouts/today/${sessionKey}`);
        if (res.data) {
          const log = { ...res.data, sessionKey };
          setWorkoutLogs((prev) => ({ ...prev, [sessionKey]: log }));
          return log;
        }
        // Server returned null — no log for this week. Clear stale cache.
        setWorkoutLogs((prev) => {
          if (!prev[sessionKey]) return prev;
          const next = { ...prev };
          delete next[sessionKey];
          return next;
        });
        return null;
      } catch { /* server unreachable — return in-memory */ }
    }
    return workoutLogsRef.current[sessionKey] || null;
  }, [token]);

  const fetchStats = useCallback(async () => {
    if (token) {
      try {
        const res = await API.get('/workouts/stats');
        setStats(res.data);
        return;
      } catch { /* fall through */ }
    }
    setStats({ totalWorkouts: 0, totalVolume: 0, weeklyVolume: [], completionByDay: {} });
  }, [token]);

  // ── Nutrition logs (server-only when logged in) ───────────────────────────
  const getNutritionLog = useCallback((date) => {
    return nutritionLogs[date] || null;
  }, [nutritionLogs]);

  const fetchNutritionLog = useCallback(async (date) => {
    if (token) {
      try {
        const res = await API.get(`/nutrition/date/${date}`);
        if (res.data) {
          setNutritionLogs((prev) => ({ ...prev, [date]: res.data }));
          return res.data;
        }
      } catch { /* server unreachable */ }
    }
    return nutritionLogsRef.current[date] || null;
  }, [token]);

  const saveNutritionLog = useCallback(async (date, logData) => {
    if (token) {
      const res = await API.post('/nutrition/save', { ...logData, date });
      setNutritionLogs((prev) => ({ ...prev, [date]: { ...logData, date } }));
      return res.data;
    }
    const data = { ...logData, date, savedAt: new Date().toISOString() };
    setNutritionLogs((prev) => ({ ...prev, [date]: data }));
    return data;
  }, [token]);

  // ── Notifications (persisted to localStorage per day) ───────────────────
  useEffect(() => {
    try {
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem('ft_notifications', JSON.stringify({
        date: today,
        items: notifications.slice(0, 50),
      }));
    } catch {}
  }, [notifications]);

  const addNotification = useCallback((type, message) => {
    const entry = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type, message,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [entry, ...prev].slice(0, 50));
    sendBrowserNotification('SamAI Reminder', message);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markRead = useCallback((id) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }, []);

  const dismissNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => setNotifications([]), []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  // ── Context value ─────────────────────────────────────────────────────────
  const value = {
    user, token, loading, backendOnline,
    register, login, logout, loginLocal,
    saveLocalProfile, updateUser, syncToCloud,
    checkHealth,
    saveWorkoutLog, getWorkoutLog, fetchWorkoutLog,
    getNutritionLog, fetchNutritionLog, saveNutritionLog,
    stats, fetchStats,
    notifications, addNotification, markAllRead, markRead, dismissNotification, clearNotifications, unreadCount,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
