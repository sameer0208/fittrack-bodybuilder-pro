import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Zap, ChevronRight, ChevronLeft, Scale, Ruler, Target,
  User, Mail, Lock, Dumbbell, Calendar, Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';
import { generatePlan } from '../data/planGenerator';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const steps = [
  { id: 'welcome' },
  { id: 'account' },
  { id: 'body' },
  { id: 'goal' },
  { id: 'schedule' },
  { id: 'ready' },
];

const GOALS = [
  { value: 'bulk', emoji: '💪', label: 'Bulk Up', desc: 'Gain muscle mass with calorie surplus' },
  { value: 'cut', emoji: '🔥', label: 'Lose Fat', desc: 'Reduce body fat while preserving muscle' },
  { value: 'maintain', emoji: '⚖️', label: 'Maintain', desc: 'Keep current weight & improve fitness' },
  { value: 'strength', emoji: '🏋️', label: 'Get Stronger', desc: 'Focus on maximal strength gains' },
  { value: 'endurance', emoji: '🏃', label: 'Endurance', desc: 'Improve stamina & cardiovascular fitness' },
];

const SPLITS = [
  { value: 'auto', label: 'Auto (Recommended)', desc: 'We pick the best split for your schedule' },
  { value: 'push_pull_legs', label: 'Push / Pull / Legs', desc: 'Classic PPL — great for 5-6 days' },
  { value: 'upper_lower', label: 'Upper / Lower', desc: 'Balanced — ideal for 4 days' },
  { value: 'full_body', label: 'Full Body', desc: 'Hit everything each session — great for 3 days' },
  { value: 'bro_split', label: 'Bro Split', desc: 'One muscle group per day — traditional' },
];

const DURATIONS = [
  { value: '30-45', label: '30–45 min', emoji: '⚡' },
  { value: '45-60', label: '45–60 min', emoji: '🕐' },
  { value: '60-75', label: '60–75 min', emoji: '💪' },
  { value: '75-90', label: '75–90 min', emoji: '🔥' },
];

const ALL_DAYS = [
  { key: 'monday', short: 'M', label: 'Mon' },
  { key: 'tuesday', short: 'T', label: 'Tue' },
  { key: 'wednesday', short: 'W', label: 'Wed' },
  { key: 'thursday', short: 'T', label: 'Thu' },
  { key: 'friday', short: 'F', label: 'Fri' },
  { key: 'saturday', short: 'S', label: 'Sat' },
  { key: 'sunday', short: 'S', label: 'Sun' },
];

async function checkEmailExists(email) {
  const url = `${API_BASE}/users/check-email?email=${encodeURIComponent(email)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Server returned ${res.status}`);
  const data = await res.json();
  return data.exists === true;
}

function AccountStep({ emailError, setEmailError, checkingEmail, backendOnline, onBack, onContinue }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nameErr, setNameErr] = useState('');

  const handleSubmitAccount = async (e) => {
    e.preventDefault();
    setNameErr('');
    if (!name.trim()) { setNameErr('Name is required'); return; }
    await onContinue({ name: name.trim(), email: email.trim(), password });
  };

  return (
    <div>
      <h2 className="section-title">Create Account</h2>
      <p className="section-subtitle">
        {backendOnline ? 'Save your progress to the cloud.' : 'Running in offline mode — data saves locally.'}
      </p>
      {!backendOnline && (
        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <p className="text-xs text-amber-400">Backend not connected. Data will save locally.</p>
        </div>
      )}
      <form onSubmit={handleSubmitAccount} className="space-y-4">
        <div>
          <label className="text-sm text-slate-400 mb-1.5 block">Your Name</label>
          <div className="relative">
            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={name} onChange={(e) => { setName(e.target.value); setNameErr(''); }}
              placeholder="e.g. Alex Power" className="input-field pl-10" />
          </div>
          {nameErr && <p className="text-red-400 text-xs mt-1">{nameErr}</p>}
        </div>
        <div>
          <label className="text-sm text-slate-400 mb-1.5 block">Email (optional)</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={email} onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(''); }}
              type="email" placeholder="you@example.com"
              className={`input-field pl-10 ${emailError ? 'border-red-500/60 focus:border-red-500' : ''}`} />
          </div>
          {emailError && (
            <div className="mt-2 p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-xs text-red-400 font-medium">{emailError}</p>
              <Link to="/login" className="text-xs text-indigo-400 font-semibold mt-1 inline-block hover:underline">Go to Login →</Link>
            </div>
          )}
        </div>
        <div>
          <label className="text-sm text-slate-400 mb-1.5 block">Password (optional)</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={password} onChange={(e) => setPassword(e.target.value)}
              type="password" placeholder="••••••••" className="input-field pl-10" />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onBack} className="btn-secondary flex items-center gap-2"><ChevronLeft size={16} /></button>
          <button type="submit" disabled={checkingEmail}
            className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60">
            {checkingEmail ? (<><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Checking...</>)
              : (<>Continue <ChevronRight size={18} /></>)}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    fitnessGoal: 'bulk',
    gymDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    preferredSplit: 'auto',
    weekendDoubles: true,
    sessionDuration: '75-90',
  });
  const [loading, setLoading] = useState(false);
  const { register: registerUser, saveLocalProfile, backendOnline } = useApp();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, watch } = useForm();

  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailError, setEmailError] = useState('');

  const totalSteps = steps.length - 2;
  const next = (data) => {
    if (data) setFormData((prev) => ({ ...prev, ...data }));
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const handleAccountStep = async (data) => {
    setEmailError('');
    const email = (data?.email || '').trim();
    if (email) {
      setCheckingEmail(true);
      try {
        const exists = await checkEmailExists(email);
        if (exists) {
          const msg = 'An account with this email already exists. Please log in instead.';
          setEmailError(msg);
          toast.error(msg, { duration: 5000 });
          setCheckingEmail(false);
          return;
        }
      } catch (err) { console.warn('[Onboarding] Email check failed:', err.message); }
      setCheckingEmail(false);
    }
    next(data);
  };

  const toggleDay = (dayKey) => {
    setFormData((prev) => {
      const current = prev.gymDays || [];
      const updated = current.includes(dayKey)
        ? current.filter((d) => d !== dayKey)
        : [...current, dayKey];
      return { ...prev, gymDays: updated, gymDaysPerWeek: updated.length };
    });
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const payload = { ...formData, name: formData.name || 'Athlete', gymDaysPerWeek: (formData.gymDays || []).length };
      if (backendOnline && formData.email && formData.password) {
        await registerUser(payload);
      } else {
        saveLocalProfile(payload);
      }
      toast.success('Your personalized plan is ready!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (err.response?.status === 400 && /already registered/i.test(msg)) {
        toast.error('An account with this email already exists. Please go back and log in instead.', { duration: 5000 });
      } else {
        toast.error(msg || 'Something went wrong');
      }
    } finally { setLoading(false); }
  };

  const goalLabel = GOALS.find((g) => g.value === formData.fitnessGoal)?.label || 'Bulk Up';
  const splitLabel = SPLITS.find((s) => s.value === formData.preferredSplit)?.label || 'Auto';
  const daysCount = (formData.gymDays || []).length;

  const previewPlan = generatePlan(formData);
  const sessionCount = Object.keys(previewPlan.workoutPlan).length;

  const calcCalories = () => {
    if (!formData.currentWeight) return null;
    const bmr = (formData.gender === 'female')
      ? 10 * formData.currentWeight + 6.25 * (formData.height || 175) - 5 * (formData.age || 25) - 161
      : 10 * formData.currentWeight + 6.25 * (formData.height || 175) - 5 * (formData.age || 25) + 5;
    const tdee = Math.round(bmr * 1.725);
    const goal = formData.fitnessGoal || 'bulk';
    if (goal === 'bulk') return tdee + 500;
    if (goal === 'cut') return Math.max(1200, tdee - 500);
    if (goal === 'strength') return tdee + 300;
    if (goal === 'endurance') return tdee + 200;
    return tdee;
  };

  const calcProtein = () => {
    if (!formData.currentWeight) return null;
    const w = formData.currentWeight;
    const g = formData.fitnessGoal || 'bulk';
    if (g === 'cut') return Math.round(w * 2.4);
    if (g === 'bulk' || g === 'strength') return Math.round(w * 2.2);
    if (g === 'endurance') return Math.round(w * 1.6);
    return Math.round(w * 1.8);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-900">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center glow-indigo">
            <Zap size={24} className="text-white" />
          </div>
          <div>
            <div className="font-black text-2xl text-white leading-tight">FitTrack Bodybuilder Pro</div>
            <div className="text-[10px] text-slate-500 leading-tight">by Sameer Application Production</div>
          </div>
        </div>

        {step > 0 && step < steps.length - 1 && (
          <div className="mb-6">
            <div className="flex justify-between text-xs text-slate-500 mb-2">
              <span>Step {step} of {totalSteps}</span>
              <span>{Math.round((step / totalSteps) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${(step / totalSteps) * 100}%` }} />
            </div>
          </div>
        )}

        {step === 0 && (
          <div className="mb-4">
            <Link to="/login"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-600 hover:border-indigo-500/60 bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 hover:text-white text-sm font-semibold transition-all duration-200">
              Already have an account? <span className="text-indigo-400">Sign In →</span>
            </Link>
          </div>
        )}

        <div className="card p-8 animate-slide-up">
          {/* ── Step 0: Welcome ── */}
          {step === 0 && (
            <div className="text-center">
              <div className="text-6xl mb-4">💪</div>
              <h1 className="text-3xl font-black text-white mb-3">
                Transform Your <span className="text-gradient">Body</span>
              </h1>
              <p className="text-slate-400 mb-2 leading-relaxed">
                A personalized fitness program designed just for you — whatever your goal.
              </p>
              <div className="grid grid-cols-3 gap-3 my-6">
                {[
                  { emoji: '🎯', label: 'Your Goal' },
                  { emoji: '📅', label: 'Your Schedule' },
                  { emoji: '📊', label: 'Track Progress' },
                ].map((item) => (
                  <div key={item.label} className="p-3 bg-slate-700/50 rounded-xl text-center">
                    <div className="text-2xl mb-1">{item.emoji}</div>
                    <div className="text-xs text-slate-400 font-medium">{item.label}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => next({})} className="btn-primary w-full flex items-center justify-center gap-2">
                Get Started <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* ── Step 1: Account ── */}
          {step === 1 && (
            <AccountStep emailError={emailError} setEmailError={setEmailError}
              checkingEmail={checkingEmail} backendOnline={backendOnline}
              onBack={prev} onContinue={handleAccountStep} />
          )}

          {/* ── Step 2: Body Stats ── */}
          {step === 2 && (
            <div>
              <h2 className="section-title">Your Body Stats</h2>
              <p className="section-subtitle">We'll calculate your nutrition targets.</p>
              <form onSubmit={handleSubmit(next)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-1.5 block flex items-center gap-1"><Scale size={13} /> Weight</label>
                    <div className="relative">
                      <input {...register('currentWeight', { required: 'Required', min: { value: 30, message: 'Min 30kg' }, max: { value: 300, message: 'Max 300kg' } })}
                        type="number" step="0.1" placeholder="75" className="input-field pr-12 text-center text-lg font-bold" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">kg</span>
                    </div>
                    {errors.currentWeight && <p className="text-red-400 text-xs mt-1">{errors.currentWeight.message}</p>}
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1.5 block flex items-center gap-1"><Ruler size={13} /> Height</label>
                    <div className="relative">
                      <input {...register('height', { required: 'Required', min: { value: 100, message: 'Min 100cm' }, max: { value: 250, message: 'Max 250cm' } })}
                        type="number" placeholder="175" className="input-field pr-12 text-center text-lg font-bold" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">cm</span>
                    </div>
                    {errors.height && <p className="text-red-400 text-xs mt-1">{errors.height.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-1.5 block">Age</label>
                    <input {...register('age', { min: 13, max: 80 })} type="number" placeholder="25" className="input-field text-center" />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1.5 block">Gender</label>
                    <select {...register('gender')} className="input-field">
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block">Experience Level</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['beginner', 'intermediate', 'advanced'].map((level) => (
                      <label key={level} className="cursor-pointer">
                        <input {...register('fitnessLevel')} type="radio" value={level} className="sr-only" />
                        <div className={`p-2.5 rounded-xl border text-center text-xs font-semibold capitalize transition-all ${
                          watch('fitnessLevel') === level ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300' : 'border-slate-600 text-slate-400 hover:border-slate-500'
                        }`}>
                          {level === 'beginner' ? '🌱' : level === 'intermediate' ? '🏋️' : '⚡'} {level}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={prev} className="btn-secondary flex items-center gap-2"><ChevronLeft size={16} /></button>
                  <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2">Continue <ChevronRight size={18} /></button>
                </div>
              </form>
            </div>
          )}

          {/* ── Step 3: Fitness Goal + Target Weight ── */}
          {step === 3 && (
            <div>
              <h2 className="section-title">What's Your Goal?</h2>
              <p className="section-subtitle">We'll customize everything — workouts, nutrition, and recovery.</p>
              <form onSubmit={handleSubmit((data) => next({ ...data, fitnessGoal: formData.fitnessGoal }))} className="space-y-4">
                <div className="grid grid-cols-1 gap-2">
                  {GOALS.map((g) => (
                    <button key={g.value} type="button"
                      onClick={() => setFormData((p) => ({ ...p, fitnessGoal: g.value }))}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        formData.fitnessGoal === g.value
                          ? 'border-indigo-500 bg-indigo-600/20' : 'border-slate-600 hover:border-slate-500'
                      }`}>
                      <span className="text-2xl">{g.emoji}</span>
                      <div>
                        <div className={`text-sm font-bold ${formData.fitnessGoal === g.value ? 'text-indigo-300' : 'text-white'}`}>{g.label}</div>
                        <div className="text-xs text-slate-400">{g.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block flex items-center gap-1"><Target size={13} /> Target Weight</label>
                  <div className="relative">
                    <input {...register('targetWeight', { required: 'Required', min: { value: 30, message: 'Min 30kg' }, max: { value: 300, message: 'Max 300kg' } })}
                      type="number" step="0.1" placeholder="85" className="input-field pr-12 text-center text-xl font-black" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">kg</span>
                  </div>
                  {errors.targetWeight && <p className="text-red-400 text-xs mt-1">{errors.targetWeight.message}</p>}
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={prev} className="btn-secondary flex items-center gap-2"><ChevronLeft size={16} /></button>
                  <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2">Continue <ChevronRight size={18} /></button>
                </div>
              </form>
            </div>
          )}

          {/* ── Step 4: Schedule & Preferences ── */}
          {step === 4 && (
            <div>
              <h2 className="section-title">Your Schedule</h2>
              <p className="section-subtitle">Select your gym days and preferences.</p>
              <div className="space-y-5">
                <div>
                  <label className="text-sm text-slate-400 mb-2 block flex items-center gap-1"><Calendar size={13} /> Which days can you train?</label>
                  <div className="grid grid-cols-7 gap-1.5">
                    {ALL_DAYS.map((d) => {
                      const active = (formData.gymDays || []).includes(d.key);
                      return (
                        <button key={d.key} type="button" onClick={() => toggleDay(d.key)}
                          className={`py-2.5 rounded-xl text-center text-xs font-bold transition-all ${
                            active ? 'bg-indigo-600/30 border border-indigo-500 text-indigo-300' : 'bg-slate-700/40 border border-slate-600 text-slate-500 hover:border-slate-500'
                          }`}>
                          <div>{d.short}</div>
                          <div className="text-[9px] font-normal mt-0.5 opacity-70">{d.label}</div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5">{daysCount} day{daysCount !== 1 ? 's' : ''} per week selected</p>
                </div>

                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Workout Split</label>
                  <div className="space-y-1.5">
                    {SPLITS.map((s) => (
                      <button key={s.value} type="button"
                        onClick={() => setFormData((p) => ({ ...p, preferredSplit: s.value }))}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                          formData.preferredSplit === s.value ? 'border-indigo-500 bg-indigo-600/20' : 'border-slate-600 hover:border-slate-500'
                        }`}>
                        <div>
                          <div className={`text-xs font-bold ${formData.preferredSplit === s.value ? 'text-indigo-300' : 'text-white'}`}>{s.label}</div>
                          <div className="text-[10px] text-slate-400">{s.desc}</div>
                        </div>
                        {formData.preferredSplit === s.value && <div className="w-2 h-2 rounded-full bg-indigo-400" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-slate-400 mb-2 block flex items-center gap-1"><Clock size={13} /> Session Duration</label>
                  <div className="grid grid-cols-4 gap-2">
                    {DURATIONS.map((d) => (
                      <button key={d.value} type="button"
                        onClick={() => setFormData((p) => ({ ...p, sessionDuration: d.value }))}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          formData.sessionDuration === d.value ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300' : 'border-slate-600 text-slate-400 hover:border-slate-500'
                        }`}>
                        <div className="text-lg">{d.emoji}</div>
                        <div className="text-[10px] font-semibold">{d.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {(formData.gymDays || []).some((d) => d === 'saturday' || d === 'sunday') && (
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-slate-600 hover:border-slate-500 transition-all">
                    <input type="checkbox" checked={formData.weekendDoubles}
                      onChange={(e) => setFormData((p) => ({ ...p, weekendDoubles: e.target.checked }))}
                      className="w-4 h-4 rounded border-slate-500 text-indigo-500 focus:ring-indigo-500 bg-slate-700" />
                    <div>
                      <div className="text-xs font-bold text-white">Weekend Double Sessions</div>
                      <div className="text-[10px] text-slate-400">Train morning + evening on weekends</div>
                    </div>
                  </label>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={prev} className="btn-secondary flex items-center gap-2"><ChevronLeft size={16} /></button>
                  <button type="button" onClick={() => {
                    if (daysCount < 2) { toast.error('Select at least 2 gym days'); return; }
                    next({});
                  }} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    Generate My Plan <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 5: Ready ── */}
          {step === 5 && (
            <div className="text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-2xl font-black text-white mb-2">Your Plan is Ready!</h2>
              <p className="text-slate-400 mb-6 text-sm">Personalized program based on your goals</p>

              <div className="space-y-3 mb-6 text-left">
                {[
                  { icon: '🎯', label: 'Goal', value: goalLabel },
                  { icon: '📅', label: 'Schedule', value: `${daysCount} days/week${formData.weekendDoubles ? ' (doubles on weekends)' : ''}` },
                  { icon: '🏋️', label: 'Split', value: splitLabel },
                  { icon: '⏱️', label: 'Sessions', value: `${sessionCount} sessions/week` },
                  {
                    icon: '🔥', label: 'Daily Calories',
                    value: calcCalories() ? `~${calcCalories()} kcal` : 'Calculated after signup',
                  },
                  {
                    icon: '🥩', label: 'Daily Protein',
                    value: calcProtein() ? `${calcProtein()}g` : 'Calculated after signup',
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-3 bg-slate-700/40 rounded-xl">
                    <span className="text-sm text-slate-400">{item.icon} {item.label}</span>
                    <span className="text-sm font-semibold text-white">{item.value}</span>
                  </div>
                ))}
              </div>

              <button onClick={handleFinish} disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-3 text-base py-4">
                {loading ? (<span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />)
                  : (<><Dumbbell size={20} /> Start My Program!</>)}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
