import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, User, LogOut, Dumbbell, UtensilsCrossed, Salad, BarChart3, Ruler, Heart, Trophy, Users, MoreHorizontal, X, BookOpen, Flame, Activity, HeartPulse, Footprints } from 'lucide-react';
import { useApp } from '../context/AppContext';
import NotificationCenter from './NotificationCenter';

const TOUR_KEYS = {
  '/dashboard': 'nav-home',
  '/nutrition': 'nav-nutrition',
  '/progress': 'nav-progress',
  '/analytics': 'nav-analytics',
  '/profile': 'nav-profile',
};

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
  { to: '/health-insights', icon: Activity, label: 'Insights' },
  { to: '/biometrics',      icon: HeartPulse, label: 'Biometrics' },
  { to: '/steps',            icon: Footprints, label: 'Steps' },
  { to: '/achievements',    icon: Trophy,   label: 'Achievements' },
  { to: '/leaderboard',     icon: Users,    label: 'Leaderboard' },
  { to: '/guide',            icon: BookOpen, label: 'Feature Guide' },
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
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 z-40 p-6 border-r border-slate-700/30"
        style={{ background: 'linear-gradient(180deg, rgba(15,20,35,0.97) 0%, rgba(10,14,23,0.98) 100%)' }}
      >
        {/* Top energy line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />

        <Link to="/dashboard" className="flex items-center gap-3 mb-10 group">
          <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20 group-hover:shadow-red-600/40 transition-shadow">
            <Dumbbell size={20} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-black text-white text-base leading-tight tracking-tight">FitTrack Pro</div>
            <div className="text-[9px] text-slate-600 leading-tight font-medium uppercase tracking-widest">Sameer App Production</div>
          </div>
        </Link>

        {user && (
          <div className="flex items-center gap-3 p-3 rounded-xl mb-6 border border-slate-700/40 bg-slate-800/30">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-orange-500 rounded-full flex items-center justify-center font-black text-white text-sm shadow-lg shadow-red-600/15">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm text-white truncate">{user.name}</div>
              <div className="text-[10px] text-slate-500 font-medium">{user.currentWeight}kg · {user.height}cm</div>
            </div>
          </div>
        )}

        <nav className="flex-1 space-y-0.5 overflow-y-auto scrollbar-hide">
          {allNavItems.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              data-tour={TOUR_KEYS[to] || undefined}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 group ${
                isActive(to)
                  ? 'text-white'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.03]'
              }`}
              style={isActive(to) ? {
                background: 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(249,115,22,0.1) 100%)',
                boxShadow: '0 2px 12px rgba(239,68,68,0.1)',
                borderLeft: '2px solid rgba(239,68,68,0.6)',
              } : undefined}
            >
              <Icon size={17} className={isActive(to) ? 'text-red-400' : 'group-hover:text-slate-300'} />
              {label === 'Home' ? 'Dashboard' : label}
            </Link>
          ))}
        </nav>

        {user && (
          <div className="mb-3 p-3 rounded-xl border border-red-500/15 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(249,115,22,0.04) 100%)' }}
          >
            <div className="relative">
              <div className="flex items-center gap-1.5 mb-1">
                <Flame size={12} className="text-red-400" />
                <span className="text-[10px] text-red-400/80 font-black uppercase tracking-widest">Streak</span>
              </div>
              <div className="text-3xl font-black text-white leading-none">{user.streak || 0}<span className="text-sm text-slate-500 font-bold ml-1">days</span></div>
              <div className="text-[10px] text-slate-500 mt-1 font-medium">{user.totalWorkouts || 0} total workouts</div>
            </div>
          </div>
        )}

        <div className="mb-2">
          <NotificationCenter variant="desktop" />
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/5 font-medium text-sm transition-all duration-200 w-full"
        >
          <LogOut size={17} />
          Sign Out
        </button>
      </aside>

      {/* ── Mobile "More" backdrop ─────────────────────────── */}
      {moreOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* ── Mobile Bottom Navigation ───────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[9999] bottom-nav">
        {moreOpen && (
          <div className="absolute bottom-full left-0 right-0 border-t border-slate-700/40 p-4 pb-2 rounded-t-2xl shadow-[0_-16px_40px_rgba(0,0,0,0.7)] animate-slide-up"
            style={{ background: 'linear-gradient(180deg, rgba(15,20,35,0.98) 0%, rgba(10,14,23,0.99) 100%)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">More</span>
              <button onClick={() => setMoreOpen(false)} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-slate-500"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {secondaryNav.map(({ to, icon: Icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMoreOpen(false)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${
                    isActive(to) ? 'bg-red-500/10 text-red-400' : 'text-slate-500 hover:bg-white/[0.03]'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-[10px] font-bold">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="relative border-t border-slate-700/30 shadow-[0_-8px_32px_rgba(0,0,0,0.6)]"
          style={{ background: 'linear-gradient(180deg, rgba(12,16,26,0.97) 0%, rgba(10,14,23,0.99) 100%)' }}
        >
          {/* Top energy line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />

          <div className="flex items-stretch justify-around px-1 h-16">
            {primaryNav.map(({ to, icon: Icon, label }) => {
              const active = isActive(to);
              return (
                <Link
                  key={to}
                  to={to}
                  data-tour={TOUR_KEYS[to] || undefined}
                  className="relative flex flex-col items-center justify-center gap-1 flex-1 py-2 touch-manipulation"
                >
                  {active && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full" style={{ background: 'linear-gradient(90deg, #ef4444, #f97316)' }} />
                  )}
                  <div className={`relative flex items-center justify-center w-10 h-7 rounded-xl transition-all duration-200 ${
                    active ? 'bg-red-500/10' : ''
                  }`}>
                    <Icon
                      size={20}
                      strokeWidth={active ? 2.5 : 1.8}
                      className={`transition-all duration-200 ${active ? 'text-red-400' : 'text-slate-600'}`}
                    />
                  </div>
                  <span className={`text-[10px] font-bold leading-none transition-all duration-200 ${
                    active ? 'text-red-400' : 'text-slate-600'
                  }`}>
                    {label}
                  </span>
                </Link>
              );
            })}

            <button
              onClick={() => setMoreOpen((v) => !v)}
              className="relative flex flex-col items-center justify-center gap-1 flex-1 py-2 touch-manipulation"
            >
              {(isSecondaryActive || moreOpen) && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full" style={{ background: 'linear-gradient(90deg, #ef4444, #f97316)' }} />
              )}
              <div className={`relative flex items-center justify-center w-10 h-7 rounded-xl transition-all duration-200 ${
                moreOpen || isSecondaryActive ? 'bg-red-500/10' : ''
              }`}>
                <MoreHorizontal
                  size={20}
                  strokeWidth={moreOpen || isSecondaryActive ? 2.5 : 1.8}
                  className={`transition-all duration-200 ${moreOpen || isSecondaryActive ? 'text-red-400' : 'text-slate-600'}`}
                />
              </div>
              <span className={`text-[10px] font-bold leading-none transition-all duration-200 ${
                moreOpen || isSecondaryActive ? 'text-red-400' : 'text-slate-600'
              }`}>
                More
              </span>
            </button>

            <div className="relative flex flex-col items-center justify-center gap-1 flex-1 py-2">
              <NotificationCenter variant="mobile" />
              <span className="text-[10px] font-bold leading-none text-slate-600">Alerts</span>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
