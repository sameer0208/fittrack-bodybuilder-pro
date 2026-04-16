import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useApp } from '../context/AppContext';
import toast from 'react-hot-toast';
import axios from 'axios';
import {
  User, Scale, Ruler, Target, Save, LogOut,
  Server, Wifi, WifiOff, ChevronDown, ChevronUp,
  Award, Flame, Calendar, CloudUpload, RefreshCw, Mail, Lock,
  Users, Copy, Bell, BellOff, Trophy
} from 'lucide-react';
import dayjs from 'dayjs';
import useWorkoutPlan from '../hooks/useWorkoutPlan';
import { subscribeToPush, unsubscribeFromPush } from '../utils/pushSubscription';

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });
API.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('ft_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

const GOAL_LABELS = { bulk: 'Bulking — Muscle Mass', cut: 'Cutting — Fat Loss', maintain: 'Maintenance — Stay Fit', strength: 'Strength — Max Power', endurance: 'Endurance — Stamina' };
const SPLIT_LABELS = { push_pull_legs: 'Push / Pull / Legs', upper_lower: 'Upper / Lower', full_body: 'Full Body', bro_split: 'Bro Split', auto: 'Auto (Optimized)' };
const DAY_SHORT_MAP = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };

function ProgramDetails({ user, weekSchedule, workoutPlan, muscleFrequency }) {
  const goal = user?.fitnessGoal || 'bulk';
  const split = user?.preferredSplit || 'auto';
  const duration = user?.sessionDuration || '75-90';
  const daysArr = user?.gymDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const doubles = user?.weekendDoubles ?? true;
  const totalSessions = Object.keys(workoutPlan || {}).length;

  const gymDaysStr = daysArr.map((d) => DAY_SHORT_MAP[d] || d).join(', ');
  const weekendDays = daysArr.filter((d) => d === 'saturday' || d === 'sunday');
  const weekdayDays = daysArr.filter((d) => d !== 'saturday' && d !== 'sunday');

  let scheduleLines = [];
  if (weekdayDays.length > 0) {
    scheduleLines.push(`🌅 ${weekdayDays.map((d) => DAY_SHORT_MAP[d]).join(', ')}: Morning session (${duration.replace('-', '–')} min)`);
  }
  if (weekendDays.length > 0 && doubles) {
    scheduleLines.push(`🌅🌇 ${weekendDays.map((d) => DAY_SHORT_MAP[d]).join(', ')}: Morning + Evening (2 sessions)`);
  } else if (weekendDays.length > 0) {
    scheduleLines.push(`🌅 ${weekendDays.map((d) => DAY_SHORT_MAP[d]).join(', ')}: Morning session (${duration.replace('-', '–')} min)`);
  }
  const restDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].filter((d) => !daysArr.includes(d));
  if (restDays.length > 0) {
    scheduleLines.push(`😴 ${restDays.map((d) => DAY_SHORT_MAP[d]).join(', ')}: Rest day`);
  }

  return (
    <div className="mt-4 space-y-3 animate-fade-in">
      <div className="p-3 bg-slate-700/30 rounded-xl">
        <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Program</div>
        <div className="text-white font-semibold">{daysArr.length}-Day {SPLIT_LABELS[split] || split} Split</div>
        <div className="text-xs text-slate-400 mt-0.5">{GOAL_LABELS[goal] || goal} · {totalSessions} sessions/week</div>
      </div>
      <div className="p-3 bg-slate-700/30 rounded-xl">
        <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Schedule</div>
        <div className="text-sm text-slate-300 space-y-1">
          {scheduleLines.map((line, i) => <div key={i}>{line}</div>)}
        </div>
      </div>
      <div className="p-3 bg-slate-700/30 rounded-xl">
        <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Weekly Sessions</div>
        <div className="space-y-1.5">
          {weekSchedule.filter((d) => d.sessions.length > 0).map((day) => (
            <div key={day.key} className="flex items-center justify-between text-sm">
              <span className="text-slate-300 font-medium">{day.day}</span>
              <div className="flex gap-1.5">
                {day.sessions.map((sk) => {
                  const plan = workoutPlan[sk];
                  return plan ? (
                    <span key={sk} className={`text-[10px] px-2 py-0.5 rounded-full font-semibold bg-gradient-to-r ${plan.colorClass} text-white`}>
                      {plan.name}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      {Object.keys(muscleFrequency).length > 0 && (
        <div className="p-3 bg-slate-700/30 rounded-xl">
          <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Muscle Frequency</div>
          <div className="space-y-1">
            {Object.entries(muscleFrequency).slice(0, 8).map(([muscle, sessions]) => (
              <div key={muscle} className="flex items-center justify-between text-sm">
                <span className="text-slate-300">{muscle}</span>
                <span className="text-indigo-400 font-semibold">{sessions.length}x / week</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Profile() {
  const { user, token, updateUser, logout, backendOnline, syncToCloud, checkHealth } = useApp();
  const { workoutPlan, weekSchedule, muscleFrequency } = useWorkoutPlan();
  const [loading, setLoading] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  const [showSyncForm, setShowSyncForm] = useState(false);
  const [syncEmail, setSyncEmail] = useState('');
  const [syncPassword, setSyncPassword] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const [leaderboardOptIn, setLeaderboardOptIn] = useState(false);
  const [buddyCode, setBuddyCode] = useState('');
  const [buddyInput, setBuddyInput] = useState('');
  const [buddyList, setBuddyList] = useState([]);
  const [pushEnabled, setPushEnabled] = useState(false);

  const fetchBuddies = () => {
    API.get('/social/buddy').then(({ data }) => {
      if (data.paired && data.buddies?.length > 0) setBuddyList(data.buddies);
      else setBuddyList([]);
    }).catch(() => {});
  };

  useEffect(() => {
    fetchBuddies();
    if ('Notification' in window && Notification.permission === 'granted') {
      navigator.serviceWorker?.getRegistration().then((reg) => {
        reg?.pushManager?.getSubscription().then((sub) => { if (sub) setPushEnabled(true); });
      });
    }
  }, []);

  const toggleLeaderboard = async () => {
    try {
      await updateUser({ leaderboardOptIn: !leaderboardOptIn });
      setLeaderboardOptIn(!leaderboardOptIn);
      toast.success(leaderboardOptIn ? 'Removed from leaderboard' : 'Added to leaderboard!');
    } catch { toast.error('Failed to update'); }
  };

  const generateBuddyCode = async () => {
    try {
      const { data } = await API.post('/social/buddy/invite');
      setBuddyCode(data.inviteCode);
      toast.success('Invite code generated!');
    } catch { toast.error('Failed to generate code'); }
  };

  const acceptBuddy = async () => {
    if (!buddyInput.trim()) return;
    try {
      await API.post('/social/buddy/accept', { code: buddyInput.trim() });
      setBuddyInput('');
      toast.success('Buddy paired!');
      fetchBuddies();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to pair'); }
  };

  const removeBuddy = async (pairId) => {
    try {
      await API.delete(`/social/buddy/${pairId}`);
      setBuddyList((prev) => prev.filter((b) => b.pairId !== pairId));
      toast.success('Buddy removed');
    } catch { toast.error('Failed to remove buddy'); }
  };

  const togglePush = async () => {
    if (pushEnabled) {
      await unsubscribeFromPush();
      setPushEnabled(false);
      toast.success('Push notifications disabled');
    } else {
      try {
        await subscribeToPush();
        setPushEnabled(true);
        toast.success('Push notifications enabled!');
      } catch (err) {
        toast.error(err.message || 'Could not enable push notifications', { duration: 5000 });
      }
    }
  };

  const handleRetryConnection = () => {
    setRetrying(true);
    checkHealth();
    setTimeout(() => setRetrying(false), 1500);
  };

  const handleSyncToCloud = async (e) => {
    e.preventDefault();
    if (!syncEmail || !syncPassword || syncPassword.length < 6) {
      toast.error('Enter a valid email and password (min 6 chars)');
      return;
    }
    setSyncing(true);
    try {
      await syncToCloud(syncEmail, syncPassword);
      toast.success('Account created! Data now syncing to MongoDB ☁️');
      setShowSyncForm(false);
    } catch (err) {
      const msg = err.response?.data?.message || 'Sync failed';
      if (msg.includes('already registered')) {
        toast.error('Email already registered — use the Login page instead');
      } else {
        toast.error(msg);
      }
    } finally {
      setSyncing(false);
    }
  };
  const [fitnessGoal, setFitnessGoal] = useState(user?.fitnessGoal || 'bulk');
  const [gymDays, setGymDays] = useState(user?.gymDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
  const [preferredSplit, setPreferredSplit] = useState(user?.preferredSplit || 'auto');
  const [weekendDoubles, setWeekendDoubles] = useState(user?.weekendDoubles ?? true);
  const [sessionDuration, setSessionDuration] = useState(user?.sessionDuration || '75-90');

  const { register, handleSubmit, formState: { errors, isDirty }, reset } = useForm({
    defaultValues: {
      name: user?.name || '',
      currentWeight: user?.currentWeight || '',
      height: user?.height || '',
      targetWeight: user?.targetWeight || '',
      age: user?.age || '',
      gender: user?.gender || 'male',
      fitnessLevel: user?.fitnessLevel || 'intermediate',
    },
  });

  const formSynced = useRef(false);
  useEffect(() => {
    if (user && !formSynced.current) {
      formSynced.current = true;
      reset({
        name: user.name || '',
        currentWeight: user.currentWeight || '',
        height: user.height || '',
        targetWeight: user.targetWeight || '',
        age: user.age || '',
        gender: user.gender || 'male',
        fitnessLevel: user.fitnessLevel || 'intermediate',
      });
      setFitnessGoal(user.fitnessGoal || 'bulk');
      setGymDays(user.gymDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
      setPreferredSplit(user.preferredSplit || 'auto');
      setWeekendDoubles(user.weekendDoubles ?? true);
      setSessionDuration(user.sessionDuration || '75-90');
      setLeaderboardOptIn(!!user.leaderboardOptIn);
    }
  }, [user, reset]);

  const handleSave = async (data) => {
    setLoading(true);
    try {
      await updateUser({
        ...data,
        currentWeight: parseFloat(data.currentWeight),
        height: parseFloat(data.height),
        targetWeight: parseFloat(data.targetWeight),
        age: parseInt(data.age),
        fitnessGoal, gymDays, gymDaysPerWeek: gymDays.length,
        preferredSplit, weekendDoubles, sessionDuration,
      });
      toast.success('Profile updated! Your plan has been recalculated.');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const programDays = user?.programStartDate
    ? dayjs().diff(dayjs(user.programStartDate), 'day') + 1
    : 1;

  return (
    <div className="page-container relative" style={{ background: '#0a0e17' }}>
      {/* Mobile Sticky Header */}
      <div className="sticky top-0 z-30 lg:hidden border-b border-slate-700/30 px-4 py-3 overflow-hidden w-full"
        style={{ background: 'linear-gradient(180deg, rgba(10,14,23,0.97) 0%, rgba(10,14,23,0.95) 100%)', backdropFilter: 'blur(20px)' }}
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-orange-500 rounded-lg flex items-center justify-center font-black text-white text-sm shadow-lg shadow-red-600/15">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div>
              <div className="text-[9px] text-slate-600 uppercase tracking-[0.2em] font-black">Settings</div>
              <div className="text-sm font-black text-white leading-tight">{user?.name || 'Profile'}</div>
            </div>
          </div>
          <button
            onClick={() => { logout(); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/8 border border-red-500/15 text-red-400 text-[10px] font-black uppercase tracking-wider touch-manipulation"
          >
            <LogOut size={12} /> Logout
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 lg:pt-8">
        {/* Desktop Header */}
        <div className="hidden lg:block mb-6">
          <h1 className="section-title flex items-center gap-2">
            <User size={24} className="text-indigo-400" />
            Profile
          </h1>
          <p className="section-subtitle">Update your stats and goals</p>
        </div>

        {/* Profile Card */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-lg shadow-indigo-500/30">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div>
              <h2 className="text-xl font-black text-white">{user?.name || 'Athlete'}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`badge ${
                  user?.fitnessLevel === 'advanced'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : user?.fitnessLevel === 'intermediate'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {user?.fitnessLevel === 'advanced' ? '⚡' : user?.fitnessLevel === 'intermediate' ? '🏋️' : '🌱'} {user?.fitnessLevel}
                </span>
                <span className="badge bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                  {user?.fitnessGoal === 'cut' ? '🔥' : user?.fitnessGoal === 'maintain' ? '⚖️' : user?.fitnessGoal === 'strength' ? '🏋️' : user?.fitnessGoal === 'endurance' ? '🏃' : '💪'} {user?.fitnessGoal || 'bulk'}
                </span>
                {backendOnline ? (
                  <span className="badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Wifi size={10} /> Cloud Sync
                  </span>
                ) : (
                  <span className="badge bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <WifiOff size={10} /> Local Mode
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Achievement Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="text-center p-3 bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-xl">
              <Flame size={18} className="text-orange-400 mx-auto mb-1" />
              <div className="text-xl font-black text-orange-400">{user?.streak || 0}</div>
              <div className="text-xs text-slate-400">Day Streak</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl">
              <Award size={18} className="text-indigo-400 mx-auto mb-1" />
              <div className="text-xl font-black text-indigo-400">{user?.totalWorkouts || 0}</div>
              <div className="text-xs text-slate-400">Workouts</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border border-teal-500/20 rounded-xl">
              <Calendar size={18} className="text-teal-400 mx-auto mb-1" />
              <div className="text-xl font-black text-teal-400">Day {programDays}</div>
              <div className="text-xs text-slate-400">In Program</div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="card p-6 mb-6">
          <h3 className="font-bold text-white mb-5">Update Stats</h3>
          <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-1.5 block">Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input {...register('name', { required: true })} className="input-field pl-10" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-400 mb-1.5 block flex items-center gap-1">
                  <Scale size={13} /> Current Weight (kg)
                </label>
                <input
                  {...register('currentWeight', { required: true, min: 30, max: 300 })}
                  type="number"
                  step="0.1"
                  className="input-field text-center font-bold"
                />
                {errors.currentWeight && <p className="text-red-400 text-xs mt-1">Required (30–300)</p>}
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1.5 block flex items-center gap-1">
                  <Ruler size={13} /> Height (cm)
                </label>
                <input
                  {...register('height', { required: true, min: 100, max: 250 })}
                  type="number"
                  className="input-field text-center font-bold"
                />
                {errors.height && <p className="text-red-400 text-xs mt-1">Required (100–250)</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-400 mb-1.5 block flex items-center gap-1">
                  <Target size={13} /> Target Weight (kg)
                </label>
                <input
                  {...register('targetWeight', { required: true, min: 30, max: 300 })}
                  type="number"
                  step="0.1"
                  className="input-field text-center font-bold"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1.5 block">Age</label>
                <input
                  {...register('age', { min: 13, max: 80 })}
                  type="number"
                  className="input-field text-center"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-400 mb-1.5 block">Gender</label>
                <select {...register('gender')} className="input-field">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1.5 block">Experience</label>
                <select {...register('fitnessLevel')} className="input-field">
                  <option value="beginner">Beginner 🌱</option>
                  <option value="intermediate">Intermediate 🏋️</option>
                  <option value="advanced">Advanced ⚡</option>
                </select>
              </div>
            </div>

            {/* ── Personalization Settings ── */}
            <div className="border-t border-slate-700/40 pt-4 mt-2">
              <h3 className="text-sm font-bold text-indigo-400 mb-3">Workout Preferences</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block">Fitness Goal</label>
                  <select value={fitnessGoal} onChange={(e) => setFitnessGoal(e.target.value)} className="input-field">
                    <option value="bulk">Bulk Up 💪</option>
                    <option value="cut">Lose Fat 🔥</option>
                    <option value="maintain">Maintain ⚖️</option>
                    <option value="strength">Strength 🏋️</option>
                    <option value="endurance">Endurance 🏃</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block">Workout Split</label>
                  <select value={preferredSplit} onChange={(e) => setPreferredSplit(e.target.value)} className="input-field">
                    <option value="auto">Auto (Recommended)</option>
                    <option value="push_pull_legs">Push / Pull / Legs</option>
                    <option value="upper_lower">Upper / Lower</option>
                    <option value="full_body">Full Body</option>
                    <option value="bro_split">Bro Split</option>
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label className="text-sm text-slate-400 mb-2 block">Gym Days</label>
                <div className="grid grid-cols-7 gap-1.5">
                  {[
                    { key: 'monday', short: 'M' }, { key: 'tuesday', short: 'T' },
                    { key: 'wednesday', short: 'W' }, { key: 'thursday', short: 'T' },
                    { key: 'friday', short: 'F' }, { key: 'saturday', short: 'S' },
                    { key: 'sunday', short: 'S' },
                  ].map((d) => {
                    const active = gymDays.includes(d.key);
                    return (
                      <button key={d.key} type="button"
                        onClick={() => setGymDays((prev) => active ? prev.filter((x) => x !== d.key) : [...prev, d.key])}
                        className={`py-2 rounded-lg text-xs font-bold transition-all ${
                          active ? 'bg-indigo-600/30 border border-indigo-500 text-indigo-300' : 'bg-slate-700/40 border border-slate-600 text-slate-500'
                        }`}>
                        {d.short}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">{gymDays.length} day{gymDays.length !== 1 ? 's' : ''}/week</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block">Session Duration</label>
                  <select value={sessionDuration} onChange={(e) => setSessionDuration(e.target.value)} className="input-field">
                    <option value="30-45">30–45 min</option>
                    <option value="45-60">45–60 min</option>
                    <option value="60-75">60–75 min</option>
                    <option value="75-90">75–90 min</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer mt-4">
                    <input type="checkbox" checked={weekendDoubles}
                      onChange={(e) => setWeekendDoubles(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-500 text-indigo-500 focus:ring-indigo-500 bg-slate-700" />
                    <span className="text-xs text-slate-300">Weekend doubles</span>
                  </label>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Save size={16} /> Save Changes</>
              )}
            </button>
          </form>
        </div>

        {/* Current Stats Computed */}
        <div className="card p-5 mb-6">
          <h3 className="font-bold text-white mb-4">Nutrition Targets</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-xl">
              <div className="text-3xl font-black text-orange-400">{user?.dailyCalories || '--'}</div>
              <div className="text-sm text-slate-400 mt-1">🔥 Daily Calories</div>
              <div className="text-xs text-orange-300/60 mt-1">
                {user?.fitnessGoal === 'cut' ? 'Deficit for fat loss' : user?.fitnessGoal === 'maintain' ? 'Maintenance level' : user?.fitnessGoal === 'strength' ? '+300 strength surplus' : user?.fitnessGoal === 'endurance' ? '+200 endurance fuel' : '+500 bulk surplus'}
              </div>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-xl">
              <div className="text-3xl font-black text-blue-400">{user?.proteinTarget || '--'}g</div>
              <div className="text-sm text-slate-400 mt-1">💪 Daily Protein</div>
              <div className="text-xs text-blue-300/60 mt-1">
                {user?.fitnessGoal === 'cut' ? '2.4' : (user?.fitnessGoal === 'endurance') ? '1.6' : (user?.fitnessGoal === 'maintain') ? '1.8' : '2.2'}g × {user?.currentWeight}kg BW
              </div>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/20 rounded-xl">
              <div className="text-3xl font-black text-purple-400">{user?.bmi || '--'}</div>
              <div className="text-sm text-slate-400 mt-1">📊 BMI</div>
              <div className="text-xs text-purple-300/60 mt-1">Body Mass Index</div>
            </div>
            {(() => {
              const g = user?.fitnessGoal || 'bulk';
              const diff = (user?.targetWeight || 0) - (user?.currentWeight || 0);
              const absDiff = Math.abs(diff).toFixed(1);
              const isCut = g === 'cut';
              const isMaintain = g === 'maintain';
              const weeks = Math.ceil(Math.abs(diff) / 0.5);
              return (
                <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl">
                  <div className="text-3xl font-black text-emerald-400">
                    {user?.targetWeight && user?.currentWeight
                      ? (isMaintain ? `±${absDiff}` : isCut ? `-${absDiff}` : `+${absDiff}`)
                      : '--'}
                  </div>
                  <div className="text-sm text-slate-400 mt-1">
                    {isCut ? '🔥 To Lose (kg)' : isMaintain ? '⚖️ Delta (kg)' : '⚡ To Gain (kg)'}
                  </div>
                  <div className="text-xs text-emerald-300/60 mt-1">
                    {isMaintain ? 'Staying at target' : `~${weeks} weeks at 0.5kg/week`}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Program Info */}
        <div className="card p-5 mb-6">
          <button
            onClick={() => setShowPlan(!showPlan)}
            className="w-full flex items-center justify-between"
          >
            <h3 className="font-bold text-white">Program Details</h3>
            {showPlan ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
          </button>

          {showPlan && (
            <ProgramDetails user={user} weekSchedule={weekSchedule} workoutPlan={workoutPlan} muscleFrequency={muscleFrequency} />
          )}
        </div>

        {/* Social & Notifications */}
        <div className="card p-5 mb-6">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Users size={16} className="text-indigo-400" /> Social & Notifications</h3>

          {/* Leaderboard Opt-In */}
          <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <Trophy size={16} className="text-amber-400" />
              <div>
                <div className="text-sm font-semibold text-white">Leaderboard</div>
                <div className="text-xs text-slate-400">Show on anonymous leaderboard</div>
              </div>
            </div>
            <button
              onClick={toggleLeaderboard}
              className={`w-12 h-6 rounded-full transition-all ${leaderboardOptIn ? 'bg-indigo-600' : 'bg-slate-600'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${leaderboardOptIn ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* Push Notifications */}
          <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              {pushEnabled ? <Bell size={16} className="text-emerald-400" /> : <BellOff size={16} className="text-slate-400" />}
              <div>
                <div className="text-sm font-semibold text-white">Push Notifications</div>
                <div className="text-xs text-slate-400">Reminders even when app is closed</div>
              </div>
            </div>
            <button
              onClick={togglePush}
              className={`w-12 h-6 rounded-full transition-all ${pushEnabled ? 'bg-emerald-600' : 'bg-slate-600'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${pushEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* Buddy System */}
          <div className="pt-3">
            <div className="flex items-center gap-2 mb-3">
              <Users size={14} className="text-purple-400" />
              <span className="text-sm font-semibold text-white">
                Workout Buddies {buddyList.length > 0 && <span className="text-purple-400/60">({buddyList.length})</span>}
              </span>
            </div>

            {/* Existing buddies list */}
            {buddyList.length > 0 && (
              <div className="space-y-2 mb-3">
                {buddyList.map((b) => (
                  <div key={b.pairId} className="p-3 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {b.name?.[0]?.toUpperCase() || 'B'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white">{b.fullName || b.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {b.fitnessGoal ? `Goal: ${b.fitnessGoal}` : 'Workout Buddy'} · 🔥 {b.streak} streak
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[10px] text-slate-500">{b.totalWorkouts} workouts</div>
                        <button onClick={() => removeBuddy(b.pairId)} className="text-[10px] text-red-400 hover:text-red-300 mt-0.5">Remove</button>
                      </div>
                    </div>
                    {b.lastWorkout && (
                      <div className="p-2 bg-slate-800/40 rounded-lg mt-2">
                        <div className="text-[10px] text-slate-500">Last workout</div>
                        <div className="text-xs text-white font-medium">{b.lastWorkout.name}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Always show invite/pair controls */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <button onClick={generateBuddyCode} className="flex-1 btn-secondary text-xs py-2">
                  {buddyList.length > 0 ? 'Add Another Buddy' : 'Generate Invite Code'}
                </button>
                {buddyCode && (
                  <button
                    onClick={() => { navigator.clipboard.writeText(buddyCode); toast.success('Copied!'); }}
                    className="flex items-center gap-1 px-3 py-2 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400 text-xs font-bold"
                  >
                    <Copy size={12} /> {buddyCode}
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  value={buddyInput}
                  onChange={(e) => setBuddyInput(e.target.value)}
                  placeholder="Enter buddy's invite code"
                  className="input-field flex-1 text-xs py-2"
                />
                <button onClick={acceptBuddy} disabled={!buddyInput.trim()} className="btn-primary text-xs px-4 py-2">Pair</button>
              </div>
            </div>
          </div>
        </div>

        {/* Backend Status */}
        <div className={`card p-4 mb-6 ${backendOnline && token ? 'border-emerald-500/30' : backendOnline ? 'border-blue-500/30' : 'border-amber-500/30'}`}>
          <div className="flex items-center gap-3 mb-1">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${backendOnline && token ? 'bg-emerald-600/20' : backendOnline ? 'bg-blue-600/20' : 'bg-amber-600/20'}`}>
              <Server size={16} className={backendOnline && token ? 'text-emerald-400' : backendOnline ? 'text-blue-400' : 'text-amber-400'} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-white flex items-center gap-2">
                {backendOnline && token
                  ? 'Cloud Sync Active'
                  : backendOnline
                  ? 'Server Connected — Not Syncing'
                  : 'Server Offline / Local Mode'}
                <div className={`w-2 h-2 rounded-full ${backendOnline && token ? 'bg-emerald-500 animate-pulse' : backendOnline ? 'bg-blue-500 animate-pulse' : 'bg-amber-500'}`} />
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {backendOnline && token
                  ? 'Profile and workouts syncing to MongoDB'
                  : backendOnline
                  ? 'Backend is running but you are in local mode — create a cloud account below'
                  : 'Data saved locally. Start the server and ensure MongoDB URI is set'}
              </div>
            </div>
            {!backendOnline && (
              <button
                onClick={handleRetryConnection}
                disabled={retrying}
                className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white transition-all"
                title="Retry connection"
              >
                <RefreshCw size={14} className={retrying ? 'animate-spin' : ''} />
              </button>
            )}
          </div>

          {/* Sync to Cloud — shown when backend is online but user has no token */}
          {backendOnline && !token && (
            <div className="mt-3 pt-3 border-t border-slate-700">
              {!showSyncForm ? (
                <button
                  onClick={() => setShowSyncForm(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 text-sm font-semibold transition-all"
                >
                  <CloudUpload size={15} />
                  Create Cloud Account & Sync Data
                </button>
              ) : (
                <form onSubmit={handleSyncToCloud} className="space-y-3">
                  <p className="text-xs text-slate-400">
                    Create a cloud account to sync your profile and workouts to MongoDB.
                  </p>
                  <div className="relative">
                    <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={syncEmail}
                      onChange={(e) => setSyncEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="input-field pl-9 text-sm py-2.5"
                      required
                    />
                  </div>
                  <div className="relative">
                    <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={syncPassword}
                      onChange={(e) => setSyncPassword(e.target.value)}
                      placeholder="Password (min 6 chars)"
                      className="input-field pl-9 text-sm py-2.5"
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSyncForm(false)}
                      className="flex-1 btn-secondary text-sm py-2.5"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={syncing}
                      className="flex-1 btn-primary text-sm py-2.5 flex items-center justify-center gap-2"
                    >
                      {syncing
                        ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <><CloudUpload size={14} /> Sync Now</>}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 font-semibold text-sm transition-all"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
