import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, User, LogOut, Zap, UtensilsCrossed, Salad } from 'lucide-react';
import { useApp } from '../context/AppContext';

const navItems = [
  { to: '/dashboard',  icon: LayoutDashboard,  label: 'Home' },
  { to: '/nutrition',  icon: UtensilsCrossed,  label: 'Nutrition' },
  { to: '/diet-plan',  icon: Salad,             label: 'Diet' },
  { to: '/progress',   icon: TrendingUp,        label: 'Progress' },
  { to: '/profile',    icon: User,              label: 'Profile' },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const { user, logout } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (to) => pathname === to || (to !== '/dashboard' && pathname.startsWith(to));

  return (
    <>
      {/* ── Desktop Sidebar ────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 bg-slate-800/80 backdrop-blur-sm border-r border-slate-700/50 z-40 p-6">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center glow-indigo">
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-white text-lg leading-tight">FitTrack Bodybuilder Pro</div>
            <div className="text-[10px] text-slate-500 leading-tight">by Sameer Application Production</div>
          </div>
        </Link>

        {/* User Info */}
        {user && (
          <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-xl mb-8 border border-slate-600/50">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center font-bold text-white">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-sm text-white truncate">{user.name}</div>
              <div className="text-xs text-slate-400">{user.currentWeight} kg · {user.height} cm</div>
            </div>
          </div>
        )}

        {/* Nav Links */}
        <nav className="flex-1 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
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

        {/* Streak Badge */}
        {user && (
          <div className="mb-4 p-3 bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 rounded-xl">
            <div className="text-xs text-orange-300 font-medium">🔥 Current Streak</div>
            <div className="text-2xl font-bold text-orange-400">{user.streak || 0} days</div>
            <div className="text-xs text-slate-400 mt-0.5">{user.totalWorkouts || 0} total workouts</div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 font-medium text-sm transition-all duration-200 w-full"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </aside>

      {/* ── Mobile Bottom Navigation ───────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bottom-nav">
        {/* Glass background bar */}
        <div className="relative bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/60 shadow-[0_-8px_32px_rgba(0,0,0,0.5)]">
          <div className="flex items-stretch justify-around px-1 h-16">
            {navItems.map(({ to, icon: Icon, label }) => {
              const active = isActive(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className="relative flex flex-col items-center justify-center gap-1 flex-1 py-2 touch-manipulation"
                >
                  {/* Active top indicator pill */}
                  {active && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-indigo-400 rounded-full" />
                  )}

                  {/* Icon container */}
                  <div className={`relative flex items-center justify-center w-10 h-7 rounded-xl transition-all duration-200 ${
                    active
                      ? 'bg-indigo-600/25'
                      : ''
                  }`}>
                    <Icon
                      size={20}
                      strokeWidth={active ? 2.5 : 1.8}
                      className={`transition-all duration-200 ${
                        active ? 'text-indigo-400' : 'text-slate-500'
                      }`}
                    />
                  </div>

                  {/* Label */}
                  <span className={`text-[10px] font-semibold leading-none transition-all duration-200 ${
                    active ? 'text-indigo-400' : 'text-slate-500'
                  }`}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
