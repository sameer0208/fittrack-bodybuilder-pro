import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// In development: relative '/api' is proxied by Vite to localhost:5001
// In production: VITE_API_URL is set to the deployed Render backend URL
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('ft_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('ft_token'));
  const [workoutLogs, setWorkoutLogs] = useState({});
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState(false);

  // Check backend health — on mount, every 30s, and on window focus
  const checkHealth = useCallback(() => {
    API.get('/health')
      .then(() => setBackendOnline(true))
      .catch(() => setBackendOnline(false));
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    window.addEventListener('focus', checkHealth);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', checkHealth);
    };
  }, [checkHealth]);

  // Load user from token or active local session
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
          setToken(null);
          setLoading(false);
        });
    } else {
      // Local mode: only restore session if ft_session flag is active
      const session = localStorage.getItem('ft_session');
      const localProfile = localStorage.getItem('ft_local_user');
      if (session === 'true' && localProfile) {
        setUser(JSON.parse(localProfile));
      }
      setLoading(false);
    }
  }, [token]);

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
    localStorage.removeItem('ft_session'); // only clear session flag; keep ft_local_user so login page can restore it
    setToken(null);
    setUser(null);
  };

  // Login with local saved profile (offline mode)
  const loginLocal = () => {
    const localProfile = localStorage.getItem('ft_local_user');
    if (!localProfile) throw new Error('No local profile found');
    localStorage.setItem('ft_session', 'true');
    setUser(JSON.parse(localProfile));
  };

  // Save user profile locally (offline-first)
  const saveLocalProfile = (profileData) => {
    const bmi = (profileData.currentWeight / Math.pow(profileData.height / 100, 2)).toFixed(1);
    const bmr = 10 * profileData.currentWeight + 6.25 * profileData.height - 5 * (profileData.age || 25) + 5;
    const dailyCalories = Math.round(bmr * 1.725 + 500);
    const proteinTarget = Math.round(profileData.currentWeight * 2.2);
    const enriched = {
      ...profileData,
      bmi,
      dailyCalories,
      proteinTarget,
      streak: 0,
      totalWorkouts: 0,
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
    } else {
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
    }
  };

  // Workout log management (local storage based)
  const getWorkoutKey = (sessionKey) => {
    const today = new Date().toISOString().split('T')[0];
    return `ft_workout_${today}_${sessionKey}`;
  };

  const saveWorkoutLog = useCallback((sessionKey, logData) => {
    const key = getWorkoutKey(sessionKey);
    const data = { ...logData, sessionKey, savedAt: new Date().toISOString() };
    localStorage.setItem(key, JSON.stringify(data));
    setWorkoutLogs((prev) => ({ ...prev, [sessionKey]: data }));

    // Also try to save to backend
    if (token && backendOnline) {
      API.post('/workouts/log', {
        workoutDay: sessionKey,
        ...logData,
      }).catch(() => {});
    }
  }, [token, backendOnline]);

  const getWorkoutLog = useCallback((sessionKey) => {
    const key = getWorkoutKey(sessionKey);
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  }, []);

  const fetchStats = useCallback(async () => {
    if (token && backendOnline) {
      const res = await API.get('/workouts/stats');
      setStats(res.data);
    } else {
      // Build stats from localStorage
      const allKeys = Object.keys(localStorage).filter((k) => k.startsWith('ft_workout_'));
      const logs = allKeys.map((k) => JSON.parse(localStorage.getItem(k))).filter(Boolean);
      const completed = logs.filter((l) => l.completed);
      setStats({
        totalWorkouts: completed.length,
        totalVolume: completed.reduce((sum, l) => sum + (l.totalVolume || 0), 0),
        weeklyVolume: [],
        completionByDay: {},
      });
    }
  }, [token, backendOnline]);

  // Migrate a local-mode user to the backend (creates account and returns JWT)
  const syncToCloud = async (email, password) => {
    const localUser = JSON.parse(localStorage.getItem('ft_local_user') || '{}');
    const res = await API.post('/users/register', {
      name: localUser.name || user?.name || 'Athlete',
      email,
      password,
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

  // ─── Nutrition / Water log (localStorage + optional backend sync) ────────
  const getNutritionLog = useCallback((date) => {
    const key = `ft_nutrition_${date}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  }, []);

  const saveNutritionLog = useCallback((date, logData) => {
    const key = `ft_nutrition_${date}`;
    localStorage.setItem(key, JSON.stringify({ ...logData, date, savedAt: new Date().toISOString() }));

    if (token && backendOnline) {
      API.post('/nutrition/save', { ...logData, date }).catch(() => {});
    }
  }, [token, backendOnline]);

  const value = {
    user, token, loading, backendOnline,
    register, login, logout, loginLocal,
    saveLocalProfile, updateUser, syncToCloud,
    checkHealth,
    saveWorkoutLog, getWorkoutLog,
    getNutritionLog, saveNutritionLog,
    stats, fetchStats,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
