import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import Onboarding from './pages/Onboarding';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import WorkoutDay from './pages/WorkoutDay';
import Progress from './pages/Progress';
import Profile from './pages/Profile';
import Nutrition from './pages/Nutrition';
import DietPlan from './pages/DietPlan';

function AppRoutes() {
  const { user, loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading FitTrack...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // If a profile already exists locally, show login — otherwise show onboarding
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
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
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
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '12px',
              fontSize: '14px',
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
