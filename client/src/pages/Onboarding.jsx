import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Zap, ChevronRight, ChevronLeft, Scale, Ruler, Target, User, Mail, Lock, Dumbbell } from 'lucide-react';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';

const steps = [
  { id: 'welcome', title: 'Welcome to FitTrack Bodybuilder Pro' },
  { id: 'account', title: 'Create Account' },
  { id: 'body', title: 'Your Body Stats' },
  { id: 'goals', title: 'Set Your Goals' },
  { id: 'ready', title: "You're Ready!" },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const { register: registerUser, saveLocalProfile, backendOnline } = useApp();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, watch } = useForm();

  const bmi = formData.currentWeight && formData.height
    ? (formData.currentWeight / Math.pow(formData.height / 100, 2)).toFixed(1)
    : null;

  const next = (data) => {
    if (data) setFormData((prev) => ({ ...prev, ...data }));
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const handleFinish = async () => {
    setLoading(true);
    try {
      if (backendOnline && formData.email && formData.password) {
        await registerUser({ ...formData, name: formData.name || 'Athlete' });
      } else {
        saveLocalProfile({ ...formData, name: formData.name || 'Athlete' });
      }
      toast.success('Profile created! Let\'s get swole! 💪');
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.status === 400) {
        // Email already exists — try local mode
        saveLocalProfile({ ...formData, name: formData.name || 'Athlete' });
        toast.success('Using local mode. Let\'s get started!');
        navigate('/dashboard');
      } else {
        toast.error(err.response?.data?.message || 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  const progressWidth = ((step) / (steps.length - 1)) * 100;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-900">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center glow-indigo">
            <Zap size={24} className="text-white" />
          </div>
          <div>
            <div className="font-black text-2xl text-white leading-tight">FitTrack Bodybuilder Pro</div>
            <div className="text-[10px] text-slate-500 leading-tight">by Sameer Application Production</div>
          </div>
        </div>

        {/* Progress */}
        {step > 0 && step < steps.length - 1 && (
          <div className="mb-6">
            <div className="flex justify-between text-xs text-slate-500 mb-2">
              <span>Step {step} of {steps.length - 2}</span>
              <span>{Math.round((step / (steps.length - 2)) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${(step / (steps.length - 2)) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Login button — always visible on step 0 */}
        {step === 0 && (
          <div className="mb-4">
            <Link
              to="/login"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-600 hover:border-indigo-500/60 bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 hover:text-white text-sm font-semibold transition-all duration-200"
            >
              Already have an account? <span className="text-indigo-400">Sign In →</span>
            </Link>
          </div>
        )}

        {/* Card */}
        <div className="card p-8 animate-slide-up">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="text-center">
              <div className="text-6xl mb-4">💪</div>
              <h1 className="text-3xl font-black text-white mb-3">
                Transform Your <span className="text-gradient">Body</span>
              </h1>
              <p className="text-slate-400 mb-2 leading-relaxed">
                A science-based 7-day bodybuilding program designed to help you build maximum muscle mass.
              </p>
              <div className="grid grid-cols-3 gap-3 my-6">
                {[
                  { emoji: '🏋️', label: '7 Days/Week' },
                  { emoji: '🎯', label: '2x Per Muscle' },
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

          {/* Step 1: Account */}
          {step === 1 && (
            <div>
              <h2 className="section-title">Create Account</h2>
              <p className="section-subtitle">
                {backendOnline ? 'Save your progress to the cloud.' : 'Running in offline mode — data saves locally.'}
              </p>
              {!backendOnline && (
                <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <p className="text-xs text-amber-400">
                    ⚠️ Backend not connected. Your data will be saved locally. To enable cloud sync, start the server and add your MongoDB URI.
                  </p>
                </div>
              )}
              <form
                onSubmit={handleSubmit(next)}
                className="space-y-4"
              >
                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block">Your Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      {...register('name', { required: 'Name is required' })}
                      placeholder="e.g. Alex Power"
                      className="input-field pl-10"
                    />
                  </div>
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block">Email (optional)</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      {...register('email')}
                      type="email"
                      placeholder="you@example.com"
                      className="input-field pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block">Password (optional)</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      {...register('password')}
                      type="password"
                      placeholder="••••••••"
                      className="input-field pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={prev} className="btn-secondary flex items-center gap-2">
                    <ChevronLeft size={16} />
                  </button>
                  <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2">
                    Continue <ChevronRight size={18} />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 2: Body Stats */}
          {step === 2 && (
            <div>
              <h2 className="section-title">Your Body Stats</h2>
              <p className="section-subtitle">We'll calculate your BMI and nutrition targets.</p>
              <form onSubmit={handleSubmit(next)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-1.5 block flex items-center gap-1">
                      <Scale size={13} /> Current Weight
                    </label>
                    <div className="relative">
                      <input
                        {...register('currentWeight', {
                          required: 'Required',
                          min: { value: 30, message: 'Min 30kg' },
                          max: { value: 300, message: 'Max 300kg' },
                        })}
                        type="number"
                        step="0.1"
                        placeholder="75"
                        className="input-field pr-12 text-center text-lg font-bold"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">kg</span>
                    </div>
                    {errors.currentWeight && <p className="text-red-400 text-xs mt-1">{errors.currentWeight.message}</p>}
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1.5 block flex items-center gap-1">
                      <Ruler size={13} /> Height
                    </label>
                    <div className="relative">
                      <input
                        {...register('height', {
                          required: 'Required',
                          min: { value: 100, message: 'Min 100cm' },
                          max: { value: 250, message: 'Max 250cm' },
                        })}
                        type="number"
                        placeholder="175"
                        className="input-field pr-12 text-center text-lg font-bold"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">cm</span>
                    </div>
                    {errors.height && <p className="text-red-400 text-xs mt-1">{errors.height.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-1.5 block">Age</label>
                    <input
                      {...register('age', { min: 13, max: 80 })}
                      type="number"
                      placeholder="25"
                      className="input-field text-center"
                    />
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
                          watch('fitnessLevel') === level
                            ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300'
                            : 'border-slate-600 text-slate-400 hover:border-slate-500'
                        }`}>
                          {level === 'beginner' ? '🌱' : level === 'intermediate' ? '🏋️' : '⚡'} {level}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={prev} className="btn-secondary flex items-center gap-2">
                    <ChevronLeft size={16} />
                  </button>
                  <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2">
                    Continue <ChevronRight size={18} />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 3: Goals */}
          {step === 3 && (
            <div>
              <h2 className="section-title">Set Your Goal</h2>
              <p className="section-subtitle">What is your target weight for bulking?</p>
              <form onSubmit={handleSubmit(next)} className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block flex items-center gap-1">
                    <Target size={13} /> Target Weight
                  </label>
                  <div className="relative">
                    <input
                      {...register('targetWeight', {
                        required: 'Required',
                        min: { value: 30, message: 'Min 30kg' },
                        max: { value: 300, message: 'Max 300kg' },
                      })}
                      type="number"
                      step="0.1"
                      placeholder="85"
                      className="input-field pr-12 text-center text-2xl font-black"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">kg</span>
                  </div>
                  {errors.targetWeight && <p className="text-red-400 text-xs mt-1">{errors.targetWeight.message}</p>}
                </div>

                {/* Preview */}
                {formData.currentWeight && watch('targetWeight') && (
                  <div className="p-4 bg-indigo-600/10 border border-indigo-500/20 rounded-xl">
                    <div className="text-xs text-slate-400 mb-2">Your Transformation Plan:</div>
                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">{formData.currentWeight} kg</div>
                        <div className="text-xs text-slate-400">Current</div>
                      </div>
                      <div className="flex-1 flex items-center justify-center">
                        <div className="h-0.5 flex-1 bg-gradient-to-r from-slate-600 to-indigo-500" />
                        <div className="px-2 text-sm text-indigo-400 font-bold">
                          +{Math.abs(watch('targetWeight') - formData.currentWeight).toFixed(1)}kg
                        </div>
                        <div className="h-0.5 flex-1 bg-gradient-to-r from-indigo-500 to-emerald-500" />
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-emerald-400">{watch('targetWeight')} kg</div>
                        <div className="text-xs text-slate-400">Target</div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-slate-400 text-center">
                      Estimated timeline: ~{Math.ceil(Math.abs(watch('targetWeight') - formData.currentWeight) / 0.5)} weeks at 0.5kg/week bulking rate
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={prev} className="btn-secondary flex items-center gap-2">
                    <ChevronLeft size={16} />
                  </button>
                  <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2">
                    Calculate My Plan <ChevronRight size={18} />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 4: Ready */}
          {step === 4 && (
            <div className="text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-2xl font-black text-white mb-2">Your Plan is Ready!</h2>
              <p className="text-slate-400 mb-6 text-sm">Here's your personalised program summary</p>

              <div className="space-y-3 mb-6 text-left">
                {[
                  { icon: '📅', label: 'Program', value: '7-Day Push/Pull/Legs Split' },
                  { icon: '🕐', label: 'Schedule', value: 'Weekdays AM · Weekends AM+PM' },
                  { icon: '💪', label: 'Goal', value: 'Bulking — Maximum Muscle Mass' },
                  { icon: '🔁', label: 'Frequency', value: 'Every muscle 2x per week' },
                  {
                    icon: '🔥',
                    label: 'Daily Calories',
                    value: formData.currentWeight
                      ? `~${Math.round((10 * formData.currentWeight + 6.25 * (formData.height || 175) - 5 * (formData.age || 25) + 5) * 1.725 + 500)} kcal`
                      : 'Calculated',
                  },
                  {
                    icon: '🥩',
                    label: 'Daily Protein',
                    value: formData.currentWeight
                      ? `${Math.round(formData.currentWeight * 2.2)}g`
                      : 'Calculated',
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-3 bg-slate-700/40 rounded-xl">
                    <span className="text-sm text-slate-400">
                      {item.icon} {item.label}
                    </span>
                    <span className="text-sm font-semibold text-white">{item.value}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleFinish}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-3 text-base py-4"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Dumbbell size={20} />
                    Start My Program!
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
