import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import HeartRateMonitor from '../components/HeartRateMonitor';
import axios from 'axios';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import {
  Activity, AlertTriangle, ArrowLeft, Brain, ChevronRight, Clock,
  Droplets, Heart, HeartPulse, Loader2, Moon, Smile, Sparkles,
  TrendingDown, TrendingUp, Wind, Minus, Trash2, Zap, Shield,
} from 'lucide-react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });
API.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('ft_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

const today = () => dayjs().format('YYYY-MM-DD');

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={28} className="text-red-400 animate-spin" />
    </div>
  );
}

const TrendIcon = ({ trend }) => {
  if (trend === 'up') return <TrendingUp size={12} className="text-emerald-400" />;
  if (trend === 'down') return <TrendingDown size={12} className="text-red-400" />;
  return <Minus size={12} className="text-slate-500" />;
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  WELLNESS SCORE RING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ScoreRing({ score, size = 120, strokeWidth = 8 }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const progress = circ - (score / 100) * circ;
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={progress}
          style={{ transition: 'stroke-dashoffset 1.5s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-white tabular-nums">{score}</span>
        <span className="text-[9px] text-slate-500 font-bold uppercase">/ 100</span>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  METRIC CARD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function MetricCard({ icon: Icon, iconColor, label, value, unit, subtitle, trend, children }) {
  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 relative overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon size={16} className={iconColor} />
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{label}</span>
        </div>
        {trend && <TrendIcon trend={trend} />}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-black text-white tabular-nums">{value ?? '--'}</span>
        {unit && <span className="text-xs text-slate-500 font-bold">{unit}</span>}
      </div>
      {subtitle && <div className="text-[10px] text-slate-500 mt-1">{subtitle}</div>}
      {children}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MAIN DASHBOARD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function BiometricsDashboard() {
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [activeChart, setActiveChart] = useState('hr');

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      API.get('/biometrics/report').then((r) => r.data).catch(() => null),
      API.get('/biometrics/history?limit=30').then((r) => r.data).catch(() => []),
    ]).then(([r, h]) => {
      setReport(r);
      setHistory(h);
      setLoading(false);
    });
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleScanResult = async (biometrics) => {
    try {
      await API.post('/biometrics', { date: today(), ...biometrics });
      if (biometrics.heartRate) {
        await API.post('/vitals', { date: today(), restingHR: biometrics.heartRate, notes: 'Biometric scan' });
      }
      toast.success('Scan saved successfully');
      fetchData();
    } catch {
      toast.error('Failed to save scan');
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/biometrics/${id}`);
      setHistory((prev) => prev.filter((s) => s._id !== id));
      toast.success('Scan deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <LoadingState />;

  const chartOptions = [
    { key: 'hr', label: 'Heart Rate', color: '#ef4444', dataKey: 'hr' },
    { key: 'hrv', label: 'HRV', color: '#22c55e', dataKey: 'hrv' },
    { key: 'stress', label: 'Stress', color: '#a855f7', dataKey: 'stress' },
    { key: 'spo2', label: 'SpO2', color: '#06b6d4', dataKey: 'spo2' },
    { key: 'rr', label: 'Resp Rate', color: '#3b82f6', dataKey: 'rr' },
  ];

  const selectedChart = chartOptions.find((c) => c.key === activeChart);

  const radarData = report?.scores ? [
    { metric: 'Cardio', value: report.scores.cardio },
    { metric: 'Autonomic', value: report.scores.autonomic },
    { metric: 'Respiratory', value: report.scores.respiratory },
    { metric: 'Oxygen', value: report.scores.oxygen },
  ] : [];

  const stressLabel = (v) => !v ? '--' : v <= 25 ? 'Low' : v <= 50 ? 'Moderate' : v <= 75 ? 'High' : 'Very High';

  return (
    <div className="min-h-screen pb-32 lg:pb-8">
      {showScanner && (
        <HeartRateMonitor onResult={handleScanResult} onClose={() => setShowScanner(false)} />
      )}

      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-slate-700/30 px-4 py-3"
        style={{ background: 'rgba(10,14,23,0.95)' }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white touch-manipulation">
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-lg font-black text-white flex items-center gap-2">
                <HeartPulse size={20} className="text-red-400" /> Biometrics
              </h1>
              <p className="text-[10px] text-slate-500">HRV · SpO2 · Stress · Respiratory</p>
            </div>
          </div>
          <button onClick={() => setShowScanner(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-red-600/20 active:scale-[0.97] transition-transform touch-manipulation flex items-center gap-1.5">
            <Heart size={14} /> Scan
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-5 space-y-5">

        {/* No data state */}
        {!report && history.length === 0 && (
          <div className="card p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
              <HeartPulse size={36} className="text-red-400" />
            </div>
            <h3 className="font-black text-white text-lg mb-2">No Scans Yet</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto mb-6">
              Take your first biometric scan to measure heart rate, HRV, SpO2, respiratory rate, and stress level — all from your camera.
            </p>
            <button onClick={() => setShowScanner(true)}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-red-600/25 active:scale-[0.97] transition-transform touch-manipulation inline-flex items-center gap-2">
              <Heart size={16} /> Take First Scan
            </button>
          </div>
        )}

        {/* Wellness Score */}
        {report && (
          <div className="card overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 via-transparent to-purple-600/5 pointer-events-none" />
            <div className="relative p-5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={16} className="text-amber-400" />
                <h3 className="font-bold text-white text-sm">Wellness Score</h3>
                <span className="text-[10px] text-slate-500 ml-auto">{report.totalScans} scans total</span>
              </div>

              <div className="flex items-center gap-6">
                <ScoreRing score={report.overallScore} />
                <div className="flex-1 space-y-2">
                  {[
                    { label: 'Cardiovascular', value: report.scores.cardio, color: '#ef4444' },
                    { label: 'Autonomic Balance', value: report.scores.autonomic, color: '#22c55e' },
                    { label: 'Respiratory', value: report.scores.respiratory, color: '#3b82f6' },
                    { label: 'Oxygen', value: report.scores.oxygen, color: '#06b6d4' },
                  ].map((s) => (
                    <div key={s.label}>
                      <div className="flex justify-between mb-0.5">
                        <span className="text-[10px] text-slate-400 font-medium">{s.label}</span>
                        <span className="text-[10px] text-white font-bold tabular-nums">{s.value}</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${s.value}%`, background: s.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Correlations */}
              {(report.correlations.avgMood || report.correlations.avgSleep) && (
                <div className="flex gap-3 mt-4 pt-3 border-t border-white/5">
                  {report.correlations.avgSleep && (
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <Moon size={12} className="text-indigo-400" />
                      Avg Sleep: <span className="text-white font-bold">{report.correlations.avgSleep}h</span>
                    </div>
                  )}
                  {report.correlations.avgMood && (
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <Smile size={12} className="text-yellow-400" />
                      Avg Mood: <span className="text-white font-bold">{report.correlations.avgMood}/5</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Insights */}
        {report?.insights?.length > 0 && (
          <div className="space-y-2">
            {report.insights.map((ins, i) => (
              <div key={i} className={`card p-3 flex items-start gap-3 border-l-4 ${
                ins.type === 'warning' ? 'border-l-amber-500' : ins.type === 'success' ? 'border-l-emerald-500' : 'border-l-blue-500'
              }`}>
                {ins.type === 'warning' ? <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" /> :
                 ins.type === 'success' ? <Zap size={14} className="text-emerald-400 shrink-0 mt-0.5" /> :
                 <Shield size={14} className="text-blue-400 shrink-0 mt-0.5" />}
                <span className="text-xs text-slate-300">{ins.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Current Averages */}
        {report && (
          <div className="grid grid-cols-2 gap-3">
            <MetricCard icon={Heart} iconColor="text-red-400" label="Heart Rate"
              value={report.averages.week.heartRate} unit="bpm"
              subtitle={report.averages.week.heartRate ? (report.averages.week.heartRate < 60 ? 'Athletic' : report.averages.week.heartRate < 80 ? 'Normal' : 'Elevated') : null}
              trend={report.trends.heartRate} />

            <MetricCard icon={Activity} iconColor="text-emerald-400" label="HRV (RMSSD)"
              value={report.averages.week.hrvRMSSD} unit="ms"
              subtitle={report.averages.week.hrvRMSSD ? (report.averages.week.hrvRMSSD > 50 ? 'Excellent' : report.averages.week.hrvRMSSD > 30 ? 'Good' : 'Below avg') : null}
              trend={report.trends.hrvRMSSD} />

            <MetricCard icon={Droplets} iconColor="text-cyan-400" label="SpO2"
              value={report.averages.week.spo2} unit="%"
              subtitle={report.averages.week.spo2 ? (report.averages.week.spo2 >= 97 ? 'Excellent' : report.averages.week.spo2 >= 95 ? 'Normal' : 'Below optimal') : null}
              trend={report.trends.spo2} />

            <MetricCard icon={Wind} iconColor="text-blue-400" label="Resp Rate"
              value={report.averages.week.respiratoryRate} unit="br/m"
              subtitle={report.averages.week.respiratoryRate ? (report.averages.week.respiratoryRate <= 18 ? 'Normal' : 'Elevated') : null} />

            <MetricCard icon={Brain} iconColor="text-purple-400" label="Stress"
              value={report.averages.week.stressIndex} unit="/100"
              subtitle={stressLabel(report.averages.week.stressIndex)}
              trend={report.trends.stressIndex} />

            <MetricCard icon={Clock} iconColor="text-amber-400" label="Month Avg HR"
              value={report.averages.month.heartRate} unit="bpm"
              subtitle="30-day average" />
          </div>
        )}

        {/* Radar Chart */}
        {radarData.length > 0 && (
          <div className="card p-5">
            <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400" /> Health Radar
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar dataKey="value" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Trend Charts */}
        {report?.chartData?.length > 0 && (
          <div className="card p-5">
            <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
              <Activity size={16} className="text-emerald-400" /> Trends
            </h3>

            <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-hide pb-1">
              {chartOptions.map((opt) => (
                <button key={opt.key} onClick={() => setActiveChart(opt.key)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all ${
                    activeChart === opt.key ? 'text-white' : 'bg-white/5 text-slate-500 hover:text-slate-300'
                  }`}
                  style={activeChart === opt.key ? { background: `${opt.color}22`, color: opt.color, border: `1px solid ${opt.color}44` } : undefined}>
                  {opt.label}
                </button>
              ))}
            </div>

            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={report.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 9 }} tickLine={false} axisLine={false} width={30} />
                <Tooltip
                  contentStyle={{ background: '#0f1724', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 11 }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 700, fontSize: 10 }}
                />
                <defs>
                  <linearGradient id={`grad-${activeChart}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={selectedChart.color} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={selectedChart.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey={selectedChart.dataKey} stroke={selectedChart.color}
                  strokeWidth={2} fill={`url(#grad-${activeChart})`} dot={{ r: 2, fill: selectedChart.color }} connectNulls />
              </AreaChart>
            </ResponsiveContainer>

            {/* Week vs Month comparison */}
            {report.averages.month[selectedChart.key === 'hr' ? 'heartRate' : selectedChart.key === 'hrv' ? 'hrvRMSSD' : selectedChart.key === 'stress' ? 'stressIndex' : selectedChart.key === 'spo2' ? 'spo2' : 'respiratoryRate'] != null && (
              <div className="flex gap-4 mt-3 pt-3 border-t border-white/5 text-[10px]">
                <div className="text-slate-400">
                  7-day avg: <span className="text-white font-bold">{report.averages.week[selectedChart.key === 'hr' ? 'heartRate' : selectedChart.key === 'hrv' ? 'hrvRMSSD' : selectedChart.key === 'stress' ? 'stressIndex' : selectedChart.key === 'spo2' ? 'spo2' : 'respiratoryRate']}</span>
                </div>
                <div className="text-slate-400">
                  30-day avg: <span className="text-white font-bold">{report.averages.month[selectedChart.key === 'hr' ? 'heartRate' : selectedChart.key === 'hrv' ? 'hrvRMSSD' : selectedChart.key === 'stress' ? 'stressIndex' : selectedChart.key === 'spo2' ? 'spo2' : 'respiratoryRate']}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Scan History */}
        {history.length > 0 && (
          <div className="card p-5">
            <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
              <Clock size={16} className="text-slate-400" /> Scan History
            </h3>
            <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-hide">
              {history.map((scan) => (
                <div key={scan._id} className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                    <Heart size={18} className="text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-black text-white">{scan.heartRate || '--'} bpm</span>
                      {scan.hrvRMSSD != null && <span className="text-[9px] text-emerald-400 font-bold">HRV {scan.hrvRMSSD}</span>}
                      {scan.spo2 != null && <span className="text-[9px] text-cyan-400 font-bold">SpO2 {scan.spo2}%</span>}
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-slate-500">
                      <span>{dayjs(scan.createdAt).format('MMM D, h:mm A')}</span>
                      {scan.stressIndex != null && <span>Stress: {scan.stressIndex}/100</span>}
                      {scan.respiratoryRate != null && <span>RR: {scan.respiratoryRate}</span>}
                    </div>
                  </div>
                  <button onClick={() => handleDelete(scan._id)}
                    className="w-8 h-8 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-slate-600 hover:text-red-400 transition-colors touch-manipulation shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Scan CTA at bottom */}
        {(report || history.length > 0) && (
          <button onClick={() => setShowScanner(true)}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600/20 to-rose-600/20 border border-red-500/20 text-red-400 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 active:from-red-600/30 active:to-rose-600/30 touch-manipulation">
            <HeartPulse size={16} /> Take New Biometric Scan
          </button>
        )}
      </div>
    </div>
  );
}
