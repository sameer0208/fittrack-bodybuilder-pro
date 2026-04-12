import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, LogIn, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';

export default function Login() {
  const { login, loginLocal, backendOnline } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if a local profile exists from a previous onboarding session
  const hasLocalProfile = !!localStorage.getItem('ft_local_user');
  const localUser = hasLocalProfile ? JSON.parse(localStorage.getItem('ft_local_user')) : null;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back! 💪');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleLocalLogin = () => {
    try {
      loginLocal();
      toast.success(`Welcome back, ${localUser?.name?.split(' ')[0] || 'Athlete'}! 💪`);
      navigate('/dashboard');
    } catch {
      toast.error('Could not restore session');
    }
  };

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

        <div className="card p-8 animate-slide-up">
          <h1 className="text-2xl font-black text-white mb-1">Welcome Back</h1>
          <p className="text-slate-400 text-sm mb-6">Sign in to continue your journey</p>

          {/* Local Profile Quick Login */}
          {hasLocalProfile && (
            <div className="mb-6">
              <button
                onClick={handleLocalLogin}
                className="w-full flex items-center gap-4 p-4 bg-indigo-600/10 border border-indigo-500/30 rounded-xl hover:bg-indigo-600/20 transition-all group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-xl font-black text-white shrink-0">
                  {localUser?.name?.[0]?.toUpperCase() || 'A'}
                </div>
                <div className="text-left flex-1">
                  <div className="font-bold text-white">{localUser?.name || 'Athlete'}</div>
                  <div className="text-xs text-slate-400">
                    {localUser?.currentWeight}kg · {localUser?.height}cm · Target: {localUser?.targetWeight}kg
                  </div>
                  <div className="text-xs text-indigo-400 mt-0.5">Tap to sign in instantly</div>
                </div>
                <LogIn size={18} className="text-indigo-400 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>

              {backendOnline && (
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-slate-700" />
                  <span className="text-xs text-slate-500">or sign in with email</span>
                  <div className="flex-1 h-px bg-slate-700" />
                </div>
              )}
            </div>
          )}

          {/* Email / Password login (only shown if backend is online) */}
          {backendOnline && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-field pl-10"
                    autoComplete="email"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-field pl-10"
                    autoComplete="current-password"
                  />
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
                  <><LogIn size={16} /> Sign In</>
                )}
              </button>
            </form>
          )}

          {/* No local profile and backend offline */}
          {!hasLocalProfile && !backendOnline && (
            <div className="text-center py-4 text-slate-400 text-sm">
              No saved profile found.
            </div>
          )}

          {/* Link to create new account */}
          <div className="mt-6 pt-5 border-t border-slate-700 text-center">
            <p className="text-sm text-slate-400">
              New here?{' '}
              <Link to="/onboarding" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                Create your program <UserPlus size={13} className="inline" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
