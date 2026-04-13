import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, User, LogOut, Zap, UtensilsCrossed, Salad, BarChart3, Ruler, Heart, Trophy, Users, MoreHorizontal, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import NotificationCenter from './NotificationCenter';

const primaryNav = [
  { to: '/dashboard',  icon: LayoutDashboard,  label: 'Home' },
  { to: '/nutrition',  icon: UtensilsCrossed,  label: 'Nutrition' },
  { to: '/progress',   icon: TrendingUp,        label: 'Progress' },
  { to: '/analytics',  icon: BarChart3,         label: 'Analytics' },
  { to: '/profile',    icon: User,              label: 'Profile' },
];

const secondaryNav = [
  { to: '/diet-plan',       icon: Salad,    label: 'Diet Plan' },
  { to: '/body-tracker',    icon: Ruler,    label: 'Body Tracker' },
  { to: '/health-recovery', icon: Heart,    label: 'Health' },
  { to: '/achievements',    icon: Trophy,   label: 'Achievements' },
  { to: '/leaderboard',     icon: Users,    label: 'Leaderboard' },
];

const allNavItems = [...primaryNav, ...secondaryNav];

export default function Navbar() {
  const { pathname } = useLocation();
  const { user, logout } = useApp();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    document.body.dataset.moreNav = moreOpen ? '1' : '';
  }, [moreOpen]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (to) => pathname === to || (to !== '/dashboard' && pathname.startsWith(to));
  const isSecondaryActive = secondaryNav.some((n) => isActive(n.to));

  return (
    <>
      {/* ── Desktop Sidebar ────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 bg-slate-800/80 backdrop-blur-sm border-r border-slate-700/50 z-40 p-6">
        <Link to="/dashboard" className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center glow-indigo">
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-white text-lg leading-tight">FitTrack Bodybuilder Pro</div>
            <div className="text-[10px] text-slate-500 leading-tight">by Sameer Application Production</div>
          </div>
        </Link>

        {user && (
          <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-xl mb-6 border border-slate-600/50">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center font-bold text-white">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-sm text-white truncate">{user.name}</div>
              <div className="text-xs text-slate-400">{user.currentWeight} kg · {user.height} cm</div>
            </div>
          </div>
        )}

        <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-hide">
          {allNavItems.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                isActive(to)
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Icon size={18} />
              {label === 'Home' ? 'Dashboard' : label}
            </Link>
          ))}
        </nav>

        {user && (
          <div className="mb-3 p-3 bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 rounded-xl">
            <div className="text-xs text-orange-300 font-medium">🔥 Current Streak</div>
            <div className="text-2xl font-bold text-orange-400">{user.streak || 0} days</div>
            <div className="text-xs text-slate-400 mt-0.5">{user.totalWorkouts || 0} total workouts</div>
          </div>
        )}

        <div className="mb-2">
          <NotificationCenter variant="desktop" />
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 font-medium text-sm transition-all duration-200 w-full"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </aside>

      {/* ── Mobile "More" backdrop ─────────────────────────── */}
      {moreOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* ── Mobile Bottom Navigation ───────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[9999] bottom-nav">
        {moreOpen && (
          <div className="absolute bottom-full left-0 right-0 bg-slate-900 border-t border-slate-700/60 p-4 pb-2 rounded-t-2xl shadow-[0_-16px_40px_rgba(0,0,0,0.6)] animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">More</span>
              <button onClick={() => setMoreOpen(false)} className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {secondaryNav.map(({ to, icon: Icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMoreOpen(false)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${
                    isActive(to) ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-[10px] font-semibold">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="relative bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/60 shadow-[0_-8px_32px_rgba(0,0,0,0.5)]">
          <div className="flex items-stretch justify-around px-1 h-16">
            {primaryNav.map(({ to, icon: Icon, label }) => {
              const active = isActive(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className="relative flex flex-col items-center justify-center gap-1 flex-1 py-2 touch-manipulation"
                >
                  {active && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-indigo-400 rounded-full" />
                  )}
                  <div className={`relative flex items-center justify-center w-10 h-7 rounded-xl transition-all duration-200 ${
                    active ? 'bg-indigo-600/25' : ''
                  }`}>
                    <Icon
                      size={20}
                      strokeWidth={active ? 2.5 : 1.8}
                      className={`transition-all duration-200 ${active ? 'text-indigo-400' : 'text-slate-500'}`}
                    />
                  </div>
                  <span className={`text-[10px] font-semibold leading-none transition-all duration-200 ${
                    active ? 'text-indigo-400' : 'text-slate-500'
                  }`}>
                    {label}
                  </span>
                </Link>
              );
            })}

            {/* More button */}
            <button
              onClick={() => setMoreOpen((v) => !v)}
              className="relative flex flex-col items-center justify-center gap-1 flex-1 py-2 touch-manipulation"
            >
              {(isSecondaryActive || moreOpen) && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-indigo-400 rounded-full" />
              )}
              <div className={`relative flex items-center justify-center w-10 h-7 rounded-xl transition-all duration-200 ${
                moreOpen || isSecondaryActive ? 'bg-indigo-600/25' : ''
              }`}>
                <MoreHorizontal
                  size={20}
                  strokeWidth={moreOpen || isSecondaryActive ? 2.5 : 1.8}
                  className={`transition-all duration-200 ${moreOpen || isSecondaryActive ? 'text-indigo-400' : 'text-slate-500'}`}
                />
              </div>
              <span className={`text-[10px] font-semibold leading-none transition-all duration-200 ${
                moreOpen || isSecondaryActive ? 'text-indigo-400' : 'text-slate-500'
              }`}>
                More
              </span>
            </button>

            <div className="relative flex flex-col items-center justify-center gap-1 flex-1 py-2">
              <NotificationCenter variant="mobile" />
              <span className="text-[10px] font-semibold leading-none text-slate-500">Alerts</span>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
