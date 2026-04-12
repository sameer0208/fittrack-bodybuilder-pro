import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useApp } from '../context/AppContext';
import toast from 'react-hot-toast';
import {
  User, Scale, Ruler, Target, Save, LogOut,
  Server, Wifi, WifiOff, ChevronDown, ChevronUp,
  Award, Flame, Calendar, CloudUpload, RefreshCw, Mail, Lock
} from 'lucide-react';
import dayjs from 'dayjs';
import { muscleFrequency } from '../data/workoutPlan';

export default function Profile() {
  const { user, token, updateUser, logout, backendOnline, syncToCloud, checkHealth } = useApp();
  const [loading, setLoading] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  const [showSyncForm, setShowSyncForm] = useState(false);
  const [syncEmail, setSyncEmail] = useState('');
  const [syncPassword, setSyncPassword] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [retrying, setRetrying] = useState(false);

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
  const { register, handleSubmit, formState: { errors, isDirty } } = useForm({
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

  const handleSave = async (data) => {
    setLoading(true);
    try {
      await updateUser({
        ...data,
        currentWeight: parseFloat(data.currentWeight),
        height: parseFloat(data.height),
        targetWeight: parseFloat(data.targetWeight),
        age: parseInt(data.age),
      });
      toast.success('Profile updated! 💪');
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
    <div className="page-container">
      {/* Mobile Sticky Header */}
      <div className="sticky top-0 z-30 lg:hidden bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/40 px-4 py-3 overflow-hidden w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white text-sm">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Settings</div>
              <div className="text-sm font-bold text-white leading-tight">{user?.name || 'Profile'}</div>
            </div>
          </div>
          <button
            onClick={() => { logout(); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold touch-manipulation"
          >
            <LogOut size={13} /> Logout
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
              <div className="flex items-center gap-2 mt-1">
                <span className={`badge ${
                  user?.fitnessLevel === 'advanced'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : user?.fitnessLevel === 'intermediate'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {user?.fitnessLevel === 'advanced' ? '⚡' : user?.fitnessLevel === 'intermediate' ? '🏋️' : '🌱'} {user?.fitnessLevel}
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

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
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
              <div className="text-xs text-orange-300/60 mt-1">Includes +500 bulk surplus</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-xl">
              <div className="text-3xl font-black text-blue-400">{user?.proteinTarget || '--'}g</div>
              <div className="text-sm text-slate-400 mt-1">💪 Daily Protein</div>
              <div className="text-xs text-blue-300/60 mt-1">2.2g × {user?.currentWeight}kg BW</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/20 rounded-xl">
              <div className="text-3xl font-black text-purple-400">{user?.bmi || '--'}</div>
              <div className="text-sm text-slate-400 mt-1">📊 BMI</div>
              <div className="text-xs text-purple-300/60 mt-1">Body Mass Index</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl">
              <div className="text-3xl font-black text-emerald-400">
                {user?.targetWeight && user?.currentWeight
                  ? `+${(user.targetWeight - user.currentWeight).toFixed(1)}`
                  : '--'}
              </div>
              <div className="text-sm text-slate-400 mt-1">⚡ To Gain (kg)</div>
              <div className="text-xs text-emerald-300/60 mt-1">
                ~{Math.ceil(Math.abs((user?.targetWeight || 0) - (user?.currentWeight || 0)) / 0.5)} weeks
              </div>
            </div>
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
            <div className="mt-4 space-y-3 animate-fade-in">
              <div className="p-3 bg-slate-700/30 rounded-xl">
                <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Program Name</div>
                <div className="text-white font-semibold">7-Day PPL Bodybuilding Split</div>
                <div className="text-xs text-slate-400 mt-0.5">Push · Pull · Legs × 2 + Weekend Double Sessions</div>
              </div>
              <div className="p-3 bg-slate-700/30 rounded-xl">
                <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Schedule</div>
                <div className="text-sm text-slate-300 space-y-1">
                  <div>🌅 Mon–Fri: Morning session only (75–90 min)</div>
                  <div>🌅🌇 Sat–Sun: Morning + Evening (2 sessions)</div>
                </div>
              </div>
              <div className="p-3 bg-slate-700/30 rounded-xl">
                <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Muscle Frequency</div>
                <div className="space-y-1">
                  {Object.entries(muscleFrequency).slice(0, 6).map(([muscle, sessions]) => (
                    <div key={muscle} className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">{muscle}</span>
                      <span className="text-indigo-400 font-semibold">{sessions.length}x / week</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
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
