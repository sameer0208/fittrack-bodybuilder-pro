import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import SmartAgent from './components/SmartAgent';
import Onboarding from './pages/Onboarding';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import WorkoutDay from './pages/WorkoutDay';
import Progress from './pages/Progress';
import Profile from './pages/Profile';
import Achievements from './pages/Achievements';
import Leaderboard from './pages/Leaderboard';
import Analytics from './pages/Analytics';
import BodyTracker from './pages/BodyTracker';
import HealthRecovery from './pages/HealthRecovery';
import Nutrition from './pages/Nutrition';
import DietPlan from './pages/DietPlan';
import FeatureGuide from './pages/FeatureGuide';
import FeatureTour from './components/guide/FeatureTour';
import ContextualTip from './components/guide/ContextualTip';
import useReminders from './hooks/useReminders';

function AuthenticatedLayout() {
  useReminders();
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <Navbar />
      <main className="flex-1 min-w-0 w-0 lg:ml-64 overflow-x-hidden">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/workout/:sessionKey" element={<WorkoutDay />} />
          <Route path="/nutrition" element={<Nutrition />} />
          <Route path="/diet-plan" element={<DietPlan />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/body-tracker" element={<BodyTracker />} />
          <Route path="/health-recovery" element={<HealthRecovery />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/guide" element={<FeatureGuide />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
      <SmartAgent />
      <FeatureTour />
      <ContextualTip pathname={pathname} />
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0e17' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
          <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em]">Loading FitTrack...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    const hasExistingProfile = !!localStorage.getItem('ft_local_user') || !!localStorage.getItem('ft_token');
    const defaultUnauthRoute = hasExistingProfile ? '/login' : '/onboarding';

    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to={defaultUnauthRoute} replace />} />
      </Routes>
    );
  }

  return <AuthenticatedLayout />;
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#0f1724',
              color: '#f1f5f9',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '600',
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />
      </BrowserRouter>
    </AppProvider>
  );
}
