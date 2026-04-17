import { useState, useEffect, useCallback, useRef, useMemo, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import { breathingExercises } from '../data/breathingExercises';
import axios from 'axios';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import {
  Activity, AlertTriangle, Brain, ChevronRight, Clock,
  Heart, HeartPulse, Loader2, Moon, Plus, Pill, Ruler, Shield, Sparkles,
  Target, TrendingDown, TrendingUp, Wind, X, Check, Trash2, Save,
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line,
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Cell,
} from 'recharts';

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });
API.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('ft_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

const TABS = [
  { key: 'overview', label: 'Overview', icon: Activity },
  { key: 'composition', label: 'Body Comp', icon: Ruler },
  { key: 'vitals', label: 'Blood Pressure', icon: HeartPulse },
  { key: 'injury', label: 'Injuries', icon: Shield },
  { key: 'supplements', label: 'Supplements', icon: Pill },
  { key: 'breathing', label: 'Breathing', icon: Wind },
  { key: 'fasting', label: 'Meal Timing', icon: Clock },
  { key: 'posture', label: 'Posture', icon: Target },
];

const today = () => dayjs().format('YYYY-MM-DD');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  OVERVIEW TAB — Readiness Score + Overtraining + Sleep Insights
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function OverviewTab() {
  const [readiness, setReadiness] = useState(null);
  const [overtraining, setOvertraining] = useState(null);
  const [sleepInsights, setSleepInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/health-insights/readiness').then((r) => r.data).catch(() => null),
      API.get('/health-insights/overtraining').then((r) => r.data).catch(() => null),
      API.get('/health-insights/sleep-insights').then((r) => r.data).catch(() => null),
    ]).then(([r, o, s]) => {
      setReadiness(r);
      setOvertraining(o);
      setSleepInsights(s);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingState />;

  if (!readiness && !overtraining && !sleepInsights) {
    return (
      <div className="card p-6 text-center">
        <Activity size={32} className="text-slate-600 mx-auto mb-3" />
        <h3 className="font-bold text-white text-sm mb-1">No Data Yet</h3>
        <p className="text-xs text-slate-400">Log your sleep, check-in, and workouts on the Health &amp; Recovery page to see your readiness score, overtraining risk, and sleep insights.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Recovery Readiness Score */}
      {readiness && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={18} className="text-amber-400" />
            <h3 className="font-bold text-white text-sm">Recovery Readiness</h3>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative w-28 h-28 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                <circle cx="50" cy="50" r="42" fill="none" stroke={readiness.color} strokeWidth="8"
                  strokeLinecap="round" strokeDasharray={`${readiness.score * 2.64} 264`}
                  style={{ transition: 'stroke-dasharray 1s ease' }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-white">{readiness.score}</span>
                <span className="text-[10px] font-bold" style={{ color: readiness.color }}>{readiness.label}</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-300 mb-3">{readiness.advice}</p>
              <div className="space-y-1.5">
                {[
                  { label: 'Sleep', val: readiness.breakdown.sleepScore, max: 30 },
                  { label: 'Wellbeing', val: readiness.breakdown.subjectiveScore, max: 30 },
                  { label: 'Training Load', val: readiness.breakdown.trainingScore, max: 25 },
                  { label: 'Streak Balance', val: readiness.breakdown.streakScore, max: 15 },
                ].map((b) => (
                  <div key={b.label} className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 w-20 shrink-0">{b.label}</span>
                    <div className="flex-1 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${(b.val / b.max) * 100}%`, background: readiness.color }} />
                    </div>
                    <span className="text-[10px] text-slate-400 w-8 text-right">{b.val}/{b.max}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {readiness.history?.length > 0 && (
            <div className="mt-4 h-24">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={readiness.history} barSize={20}>
                  <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {readiness.history.map((h, i) => (
                      <Cell key={i} fill={h.score >= 70 ? '#22c55e' : h.score >= 45 ? '#eab308' : '#ef4444'} fillOpacity={0.7} />
                    ))}
                  </Bar>
                  <Tooltip cursor={false} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }}
                    formatter={(v) => [`${v}/100`, 'Score']} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Overtraining Detection */}
      {overtraining && (
        <div className={`card p-5 border-l-4 ${
          overtraining.risk === 'high' ? 'border-l-red-500' :
          overtraining.risk === 'moderate' ? 'border-l-amber-500' : 'border-l-emerald-500'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className={
              overtraining.risk === 'high' ? 'text-red-400' :
              overtraining.risk === 'moderate' ? 'text-amber-400' : 'text-emerald-400'
            } />
            <h3 className="font-bold text-white text-sm">Overtraining Monitor</h3>
            <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-lg ${
              overtraining.risk === 'high' ? 'bg-red-500/15 text-red-400' :
              overtraining.risk === 'moderate' ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'
            }`}>
              {overtraining.risk.toUpperCase()} RISK
            </span>
          </div>
          <p className="text-sm text-slate-300 mb-3">{overtraining.recommendation}</p>

          <div className="flex items-center gap-3 mb-3 p-3 bg-slate-800/40 rounded-xl">
            <div className="text-center">
              <div className="text-lg font-black text-white">{overtraining.acwr}</div>
              <div className="text-[10px] text-slate-500">ACWR</div>
            </div>
            <div className="text-[10px] text-slate-400 flex-1">
              Acute:Chronic Workload Ratio
              <span className="block text-slate-500 mt-0.5">Optimal: 0.8 – 1.3 · High risk: &gt;1.5</span>
            </div>
          </div>

          {overtraining.flags.length > 0 && (
            <div className="space-y-1.5">
              {overtraining.flags.map((f, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-amber-300/80">
                  <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          )}

          {overtraining.weeklyVolumes?.length > 0 && (
            <div className="mt-4 h-24">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={overtraining.weeklyVolumes} barSize={24}>
                  <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Bar dataKey="volume" radius={[4, 4, 0, 0]} fill="#6366f1" fillOpacity={0.6} />
                  <Tooltip cursor={false} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }}
                    formatter={(v) => [`${(v / 1000).toFixed(1)}k kg`, 'Volume']} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Sleep Insights */}
      {sleepInsights && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Moon size={18} className="text-indigo-400" />
            <h3 className="font-bold text-white text-sm">Sleep Insights</h3>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <MetricBox label="Avg Duration" value={`${sleepInsights.avgDuration}h`} color="#818cf8" />
            <MetricBox label="Sleep Debt" value={`${sleepInsights.sleepDebt}h`}
              color={sleepInsights.sleepDebt > 5 ? '#ef4444' : sleepInsights.sleepDebt > 2 ? '#eab308' : '#22c55e'} />
            <MetricBox label="Consistency" value={`${sleepInsights.consistencyScore}%`}
              color={sleepInsights.consistencyScore >= 70 ? '#22c55e' : '#eab308'} />
          </div>

          {sleepInsights.bedtimeDrift !== 0 && (
            <div className="flex items-center gap-2 p-2.5 bg-slate-800/40 rounded-xl mb-3">
              {sleepInsights.bedtimeDrift > 0 ? (
                <TrendingDown size={14} className="text-amber-400" />
              ) : (
                <TrendingUp size={14} className="text-emerald-400" />
              )}
              <span className="text-xs text-slate-300">
                Bedtime drifting <strong>{Math.abs(sleepInsights.bedtimeDrift)} min</strong> {sleepInsights.bedtimeDrift > 0 ? 'later' : 'earlier'} each night
              </span>
            </div>
          )}

          <div className="space-y-1.5">
            {sleepInsights.insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                <Brain size={12} className="shrink-0 mt-0.5 text-indigo-400" />
                <span>{insight}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  BODY COMPOSITION TAB
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function CompositionTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/health-insights/body-composition').then((r) => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (!data?.available) {
    return (
      <div className="card p-6 text-center">
        <Ruler size={32} className="text-slate-600 mx-auto mb-3" />
        <h3 className="font-bold text-white text-sm mb-1">No Measurements Yet</h3>
        <p className="text-xs text-slate-400">Log body measurements in Body Tracker (waist, neck, hips) to see your body composition analysis.</p>
      </div>
    );
  }

  const ffmiLabel = data.ffmi >= 25 ? 'Elite' : data.ffmi >= 22 ? 'Advanced' : data.ffmi >= 20 ? 'Intermediate' : 'Beginner';

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
          <Ruler size={16} className="text-cyan-400" />
          Body Composition
        </h3>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {data.bodyFatPct !== null && (
            <div className="bg-slate-800/40 rounded-xl p-3 text-center">
              <div className="text-2xl font-black text-white">{data.bodyFatPct}%</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Body Fat</div>
            </div>
          )}
          {data.ffmi !== null && (
            <div className="bg-slate-800/40 rounded-xl p-3 text-center">
              <div className="text-2xl font-black text-white">{data.ffmi}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">FFMI ({ffmiLabel})</div>
            </div>
          )}
          {data.leanMass !== null && (
            <div className="bg-slate-800/40 rounded-xl p-3 text-center">
              <div className="text-lg font-black text-emerald-400">{data.leanMass} kg</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Lean Mass</div>
            </div>
          )}
          {data.fatMass !== null && (
            <div className="bg-slate-800/40 rounded-xl p-3 text-center">
              <div className="text-lg font-black text-amber-400">{data.fatMass} kg</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Fat Mass</div>
            </div>
          )}
        </div>

        {data.whr !== null && (
          <div className={`flex items-center gap-3 p-3 rounded-xl border ${
            data.whrRisk === 'elevated' ? 'bg-red-500/5 border-red-500/20' : 'bg-emerald-500/5 border-emerald-500/20'
          }`}>
            <Heart size={16} className={data.whrRisk === 'elevated' ? 'text-red-400' : 'text-emerald-400'} />
            <div>
              <div className="text-sm font-bold text-white">WHR: {data.whr}</div>
              <div className={`text-[10px] ${data.whrRisk === 'elevated' ? 'text-red-400' : 'text-emerald-400'}`}>
                Cardiovascular risk: {data.whrRisk === 'elevated' ? 'Elevated — consider reducing waist circumference' : 'Normal range'}
              </div>
            </div>
          </div>
        )}
      </div>

      {data.history?.length > 1 && (
        <div className="card p-5">
          <h3 className="font-bold text-white text-sm mb-3">Body Fat Trend</h3>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                <Line type="monotone" dataKey="bodyFat" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3, fill: '#06b6d4' }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }}
                  formatter={(v) => [`${v}%`, 'Body Fat']} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* FFMI Scale */}
      {data.ffmi !== null && (
        <div className="card p-5">
          <h3 className="font-bold text-white text-sm mb-3">FFMI Scale (Fat-Free Mass Index)</h3>
          <div className="relative h-6 bg-gradient-to-r from-slate-600 via-emerald-600 via-cyan-500 to-purple-600 rounded-full overflow-hidden mb-2">
            <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg shadow-white/50"
              style={{ left: `${Math.min(100, Math.max(0, ((data.ffmi - 15) / 15) * 100))}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>15 (Low)</span>
            <span>20 (Average)</span>
            <span>22-23 (Advanced)</span>
            <span>25+ (Elite)</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  VITALS TAB — Blood Pressure Logging + Link to Biometrics
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function VitalsTab() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ date: today(), systolic: '', diastolic: '', notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    API.get('/vitals').then((r) => setLogs(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!form.systolic || !form.diastolic) {
      toast.error('Enter both systolic and diastolic values');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        date: form.date,
        systolic: Number(form.systolic),
        diastolic: Number(form.diastolic),
        notes: form.notes,
      };
      const { data } = await API.post('/vitals', payload);
      setLogs((prev) => {
        const filtered = prev.filter((l) => l.date !== data.date);
        return [data, ...filtered];
      });
      toast.success('Blood pressure saved');
      setForm({ date: today(), systolic: '', diastolic: '', notes: '' });
    } catch {
      toast.error('Failed to save');
    }
    setSaving(false);
  };

  const bpLogs = logs.filter((l) => l.systolic && l.diastolic);
  const latestBP = bpLogs[0];
  const bpCategory = (sys, dia) => {
    if (sys < 120 && dia < 80) return { label: 'Normal', color: 'text-emerald-400' };
    if (sys < 130 && dia < 80) return { label: 'Elevated', color: 'text-yellow-400' };
    if (sys < 140 || dia < 90) return { label: 'High Stage 1', color: 'text-orange-400' };
    return { label: 'High Stage 2', color: 'text-red-400' };
  };

  const chartData = bpLogs.slice(0, 14).map((l) => ({
    date: dayjs(l.date).format('M/D'),
    sys: l.systolic,
    dia: l.diastolic,
  })).reverse();

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      {/* Biometrics Scanner CTA */}
      <div className="card overflow-hidden relative cursor-pointer group" onClick={() => navigate('/biometrics')}>
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 via-transparent to-purple-600/5 group-hover:from-red-600/15 transition-colors" />
        <div className="relative p-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-rose-500 flex items-center justify-center shadow-lg shadow-red-600/20 shrink-0">
              <Heart size={24} className="text-white" fill="currentColor" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-black text-white text-sm mb-0.5">Biometric Scanner</h3>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Measure heart rate, HRV, SpO2, respiratory rate &amp; stress — all from your camera in 30 seconds
              </p>
            </div>
            <ChevronRight size={18} className="text-slate-500 group-hover:text-red-400 transition-colors shrink-0" />
          </div>
        </div>
      </div>

      {/* Blood Pressure Log */}
      <div className="card p-5">
        <h3 className="font-bold text-white text-sm mb-1 flex items-center gap-2">
          <HeartPulse size={16} className="text-indigo-400" />
          Blood Pressure Log
        </h3>
        <p className="text-[10px] text-slate-500 mb-4">
          Log readings from your BP cuff. Camera cannot measure blood pressure.
        </p>

        {latestBP && (
          <div className="flex items-center gap-3 p-3 bg-indigo-500/5 border border-indigo-500/15 rounded-xl mb-4">
            <div>
              <span className="text-lg font-black text-white">{latestBP.systolic}/{latestBP.diastolic}</span>
              <span className="text-[10px] text-slate-500 ml-1.5">mmHg</span>
            </div>
            <div className={`text-[10px] font-bold ${bpCategory(latestBP.systolic, latestBP.diastolic).color}`}>
              {bpCategory(latestBP.systolic, latestBP.diastolic).label}
            </div>
            <span className="text-[10px] text-slate-600 ml-auto">{dayjs(latestBP.date).format('MMM D')}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-[10px] text-slate-500 font-bold block mb-1">Systolic (top)</label>
            <input type="number" placeholder="e.g. 120" value={form.systolic}
              onChange={(e) => setForm((f) => ({ ...f, systolic: e.target.value }))}
              className="w-full bg-slate-800/50 border border-slate-700/40 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-indigo-500/50 focus:outline-none" />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 font-bold block mb-1">Diastolic (bottom)</label>
            <input type="number" placeholder="e.g. 80" value={form.diastolic}
              onChange={(e) => setForm((f) => ({ ...f, diastolic: e.target.value }))}
              className="w-full bg-slate-800/50 border border-slate-700/40 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-indigo-500/50 focus:outline-none" />
          </div>
        </div>
        <input type="text" placeholder="Notes (optional)" value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          className="w-full bg-slate-800/50 border border-slate-700/40 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-indigo-500/50 focus:outline-none mb-3" />
        <button onClick={handleSave} disabled={saving}
          className="w-full py-2.5 rounded-xl bg-indigo-600/15 border border-indigo-500/25 text-indigo-400 text-xs font-bold flex items-center justify-center gap-2 active:bg-indigo-600/25 disabled:opacity-50 touch-manipulation">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Blood Pressure
        </button>
      </div>

      {/* BP Reference */}
      <div className="card p-4">
        <div className="text-[10px] text-slate-500 font-bold uppercase mb-2">BP Reference Ranges</div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Normal', range: '< 120/80', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Elevated', range: '120-129/< 80', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
            { label: 'High Stage 1', range: '130-139/80-89', color: 'text-orange-400', bg: 'bg-orange-500/10' },
            { label: 'High Stage 2', range: '≥ 140/≥ 90', color: 'text-red-400', bg: 'bg-red-500/10' },
          ].map((r) => (
            <div key={r.label} className={`${r.bg} rounded-lg p-2`}>
              <div className={`text-[10px] font-bold ${r.color}`}>{r.label}</div>
              <div className="text-[10px] text-slate-400">{r.range} mmHg</div>
            </div>
          ))}
        </div>
      </div>

      {/* BP Trend Chart */}
      {chartData.length > 1 && (
        <div className="card p-5">
          <h3 className="font-bold text-white text-sm mb-3">Blood Pressure Trend</h3>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                <Line type="monotone" dataKey="sys" stroke="#818cf8" strokeWidth={2} dot={{ r: 3, fill: '#818cf8' }} name="Systolic" connectNulls />
                <Line type="monotone" dataKey="dia" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3, fill: '#a78bfa' }} name="Diastolic" connectNulls />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* BP History */}
      {bpLogs.length > 0 && (
        <div className="card p-5">
          <h3 className="font-bold text-white text-sm mb-3">Recent Readings</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {bpLogs.slice(0, 10).map((l) => {
              const cat = bpCategory(l.systolic, l.diastolic);
              return (
                <div key={l._id || l.date} className="flex items-center justify-between p-2.5 bg-slate-800/30 rounded-xl">
                  <span className="text-xs text-slate-400">{dayjs(l.date).format('MMM D')}</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-indigo-400 font-bold">{l.systolic}/{l.diastolic}</span>
                    <span className={`text-[10px] font-bold ${cat.color}`}>{cat.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  INJURY TRACKER TAB
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const BODY_PARTS = [
  'shoulder', 'lower_back', 'upper_back', 'knee', 'elbow', 'wrist', 'hip',
  'neck', 'ankle', 'chest', 'hamstring', 'quad', 'calf', 'bicep', 'tricep', 'forearm', 'shin', 'foot', 'other',
];
const PAIN_TYPES = ['sharp', 'dull_ache', 'stiffness', 'tingling', 'burning', 'throbbing'];
const OCCURRENCES = ['during_exercise', 'at_rest', 'morning_stiffness', 'after_specific_movement', 'constant'];
const STATUSES = ['new', 'improving', 'chronic', 'resolved'];

function formatEnum(s) { return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()); }

function InjuryTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    bodyPart: 'shoulder', severity: 5, painType: 'dull_ache',
    occurrence: 'during_exercise', status: 'new', notes: '', date: today(),
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    API.get('/injury').then((r) => setLogs(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await API.post('/injury', form);
      setLogs((prev) => [data, ...prev]);
      setShowForm(false);
      toast.success('Injury logged');
      setForm({ bodyPart: 'shoulder', severity: 5, painType: 'dull_ache', occurrence: 'during_exercise', status: 'new', notes: '', date: today() });
    } catch {
      toast.error('Failed to save');
    }
    setSaving(false);
  };

  const updateStatus = async (id, status) => {
    try {
      const { data } = await API.put(`/injury/${id}`, { status });
      setLogs((prev) => prev.map((l) => (l._id === id ? data : l)));
      toast.success(`Marked as ${formatEnum(status)}`);
    } catch {
      toast.error('Failed to update');
    }
  };

  const deleteInjury = async (id) => {
    try {
      await API.delete(`/injury/${id}`);
      setLogs((prev) => prev.filter((l) => l._id !== id));
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const active = logs.filter((l) => l.status !== 'resolved');
  const resolved = logs.filter((l) => l.status === 'resolved');

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white text-sm flex items-center gap-2">
          <Shield size={16} className="text-orange-400" />
          Injury & Pain Tracker
        </h3>
        <button onClick={() => setShowForm((v) => !v)}
          className="px-3 py-1.5 rounded-xl bg-orange-600/15 border border-orange-500/25 text-orange-400 text-xs font-bold flex items-center gap-1.5 active:bg-orange-600/25 touch-manipulation">
          {showForm ? <X size={12} /> : <Plus size={12} />} {showForm ? 'Cancel' : 'Log Injury'}
        </button>
      </div>

      {showForm && (
        <div className="card p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-500 font-bold block mb-1">Body Part</label>
              <select value={form.bodyPart} onChange={(e) => setForm((f) => ({ ...f, bodyPart: e.target.value }))}
                className="w-full bg-slate-800/50 border border-slate-700/40 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
                {BODY_PARTS.map((p) => <option key={p} value={p}>{formatEnum(p)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-bold block mb-1">Severity (1-10)</label>
              <input type="range" min="1" max="10" value={form.severity}
                onChange={(e) => setForm((f) => ({ ...f, severity: Number(e.target.value) }))}
                className="w-full accent-orange-500" />
              <div className="text-center text-xs font-bold text-orange-400">{form.severity}/10</div>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-bold block mb-1">Pain Type</label>
              <select value={form.painType} onChange={(e) => setForm((f) => ({ ...f, painType: e.target.value }))}
                className="w-full bg-slate-800/50 border border-slate-700/40 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
                {PAIN_TYPES.map((p) => <option key={p} value={p}>{formatEnum(p)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-bold block mb-1">When It Occurs</label>
              <select value={form.occurrence} onChange={(e) => setForm((f) => ({ ...f, occurrence: e.target.value }))}
                className="w-full bg-slate-800/50 border border-slate-700/40 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
                {OCCURRENCES.map((o) => <option key={o} value={o}>{formatEnum(o)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-slate-500 font-bold block mb-1">Notes</label>
            <textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="What triggered it, what makes it worse..."
              className="w-full bg-slate-800/50 border border-slate-700/40 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none resize-none" />
          </div>
          <button onClick={handleSave} disabled={saving}
            className="w-full py-2.5 rounded-xl bg-orange-600/15 border border-orange-500/25 text-orange-400 text-xs font-bold flex items-center justify-center gap-2 active:bg-orange-600/25 disabled:opacity-50 touch-manipulation">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Injury Log
          </button>
        </div>
      )}

      {active.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active ({active.length})</h4>
          {active.map((injury) => (
            <InjuryCard key={injury._id} injury={injury} onStatusChange={updateStatus} onDelete={deleteInjury} />
          ))}
        </div>
      )}

      {resolved.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resolved ({resolved.length})</h4>
          {resolved.slice(0, 5).map((injury) => (
            <InjuryCard key={injury._id} injury={injury} onStatusChange={updateStatus} onDelete={deleteInjury} />
          ))}
        </div>
      )}

      {logs.length === 0 && (
        <div className="card p-6 text-center">
          <Shield size={32} className="text-slate-600 mx-auto mb-3" />
          <p className="text-xs text-slate-400">No injuries logged. Stay injury-free!</p>
        </div>
      )}
    </div>
  );
}

function InjuryCard({ injury, onStatusChange, onDelete }) {
  const sevColor = injury.severity >= 7 ? 'text-red-400' : injury.severity >= 4 ? 'text-amber-400' : 'text-emerald-400';
  const statusColor = {
    new: 'bg-red-500/15 text-red-400',
    improving: 'bg-emerald-500/15 text-emerald-400',
    chronic: 'bg-amber-500/15 text-amber-400',
    resolved: 'bg-slate-700/50 text-slate-400',
  };

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-black ${sevColor}`}>{injury.severity}</span>
          <span className="text-sm font-bold text-white">{formatEnum(injury.bodyPart)}</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${statusColor[injury.status]}`}>
            {formatEnum(injury.status)}
          </span>
        </div>
        <span className="text-[10px] text-slate-500">{dayjs(injury.date).format('MMM D')}</span>
      </div>
      <div className="flex items-center gap-3 text-[10px] text-slate-400 mb-2">
        <span>{formatEnum(injury.painType)}</span>
        <span>·</span>
        <span>{formatEnum(injury.occurrence)}</span>
      </div>
      {injury.notes && <p className="text-xs text-slate-400 mb-2">{injury.notes}</p>}
      <div className="flex items-center gap-2">
        {injury.status !== 'resolved' && (
          <>
            {injury.status !== 'improving' && (
              <button onClick={() => onStatusChange(injury._id, 'improving')}
                className="text-[10px] px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold touch-manipulation">
                Mark Improving
              </button>
            )}
            <button onClick={() => onStatusChange(injury._id, 'resolved')}
              className="text-[10px] px-2 py-1 rounded-lg bg-slate-700/40 text-slate-400 font-bold touch-manipulation">
              Resolved
            </button>
          </>
        )}
        <button onClick={() => onDelete(injury._id)}
          className="text-[10px] px-2 py-1 rounded-lg bg-red-500/10 text-red-400 font-bold ml-auto touch-manipulation">
          <Trash2 size={10} />
        </button>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SUPPLEMENT TRACKER TAB
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const DEFAULT_SUPPLEMENTS = [
  { name: 'Creatine', dose: '5g', taken: false },
  { name: 'Vitamin D3', dose: '2000 IU', taken: false },
  { name: 'Omega-3 Fish Oil', dose: '1000mg', taken: false },
  { name: 'Whey Protein', dose: '1 scoop', taken: false },
  { name: 'Multivitamin', dose: '1 tab', taken: false },
];

function SupplementsTab() {
  const [supplements, setSupplements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDose, setNewDose] = useState('');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    Promise.all([
      API.get(`/supplements/${today()}`),
      API.get('/supplements'),
    ]).then(([todayRes, histRes]) => {
      const sups = todayRes.data.supplements;
      setSupplements(sups.length > 0 ? sups : DEFAULT_SUPPLEMENTS);
      setHistory(histRes.data);
    }).catch(() => {
      setSupplements(DEFAULT_SUPPLEMENTS);
    }).finally(() => setLoading(false));
  }, []);

  const save = useCallback(async (sups) => {
    setSaving(true);
    try {
      await API.post('/supplements', { date: today(), supplements: sups });
    } catch {}
    setSaving(false);
  }, []);

  const toggle = (idx) => {
    setSupplements((prev) => {
      const next = prev.map((s, i) => i === idx ? { ...s, taken: !s.taken } : s);
      save(next);
      return next;
    });
  };

  const addSupplement = () => {
    if (!newName.trim()) return;
    const next = [...supplements, { name: newName.trim(), dose: newDose.trim(), taken: false }];
    setSupplements(next);
    save(next);
    setNewName('');
    setNewDose('');
    toast.success('Added');
  };

  const removeSupplement = (idx) => {
    const next = supplements.filter((_, i) => i !== idx);
    setSupplements(next);
    save(next);
  };

  const takenCount = supplements.filter((s) => s.taken).length;
  const compliance = supplements.length > 0 ? Math.round((takenCount / supplements.length) * 100) : 0;

  // Weekly compliance
  const weekCompliance = useMemo(() => {
    return history.slice(0, 7).map((h) => {
      const total = h.supplements?.length || 1;
      const taken = (h.supplements || []).filter((s) => s.taken).length;
      return { date: dayjs(h.date).format('ddd'), pct: Math.round((taken / total) * 100) };
    }).reverse();
  }, [history]);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Pill size={16} className="text-violet-400" />
            Today's Supplements
          </h3>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
            compliance === 100 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-700/50 text-slate-400'
          }`}>
            {takenCount}/{supplements.length} {compliance === 100 && '✓'}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          {supplements.map((s, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
              s.taken ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-slate-800/30 border-slate-700/30'
            }`}>
              <button onClick={() => toggle(i)} className="shrink-0 touch-manipulation">
                {s.taken ? <Check size={20} className="text-emerald-400" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-600" />}
              </button>
              <div className="flex-1 min-w-0">
                <span className={`text-sm font-medium ${s.taken ? 'text-emerald-300 line-through' : 'text-white'}`}>{s.name}</span>
                {s.dose && <span className="text-[10px] text-slate-500 ml-2">{s.dose}</span>}
              </div>
              <button onClick={() => removeSupplement(i)} className="text-slate-600 hover:text-red-400 touch-manipulation">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input type="text" placeholder="Supplement name" value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 bg-slate-800/50 border border-slate-700/40 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none" />
          <input type="text" placeholder="Dose" value={newDose}
            onChange={(e) => setNewDose(e.target.value)}
            className="w-24 bg-slate-800/50 border border-slate-700/40 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none" />
          <button onClick={addSupplement}
            className="px-3 py-2 rounded-xl bg-violet-600/15 border border-violet-500/25 text-violet-400 touch-manipulation">
            <Plus size={16} />
          </button>
        </div>
      </div>

      {weekCompliance.length > 1 && (
        <div className="card p-5">
          <h3 className="font-bold text-white text-sm mb-3">Weekly Compliance</h3>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekCompliance} barSize={20}>
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                  {weekCompliance.map((d, i) => (
                    <Cell key={i} fill={d.pct === 100 ? '#22c55e' : d.pct >= 50 ? '#eab308' : '#ef4444'} fillOpacity={0.6} />
                  ))}
                </Bar>
                <Tooltip cursor={false} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }}
                  formatter={(v) => [`${v}%`, 'Taken']} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  BREATHING EXERCISES TAB
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function breathingReducer(state, action) {
  if (action.type === 'start') {
    const ex = action.exercise;
    return { active: true, exercise: ex, round: 1, phaseIdx: 0, secondsLeft: ex.phases[0].duration, paused: false };
  }
  if (action.type === 'stop') return { active: false };
  if (action.type === 'pause') return { ...state, paused: !state.paused };
  if (action.type === 'tick') {
    if (!state.active || state.paused) return state;
    if (state.secondsLeft > 1) return { ...state, secondsLeft: state.secondsLeft - 1 };
    const nextPhase = state.phaseIdx + 1;
    if (nextPhase < state.exercise.phases.length) {
      return { ...state, phaseIdx: nextPhase, secondsLeft: state.exercise.phases[nextPhase].duration };
    }
    const nextRound = state.round + 1;
    if (nextRound <= state.exercise.rounds) {
      return { ...state, round: nextRound, phaseIdx: 0, secondsLeft: state.exercise.phases[0].duration };
    }
    return { active: false, complete: true };
  }
  return state;
}

function BreathingTab() {
  const [state, dispatch] = useReducer(breathingReducer, { active: false });

  useEffect(() => {
    if (!state.active) return;
    const id = setInterval(() => dispatch({ type: 'tick' }), 1000);
    return () => clearInterval(id);
  }, [state.active, state.paused]);

  if (state.active && state.exercise) {
    const phase = state.exercise.phases[state.phaseIdx];
    const progress = 1 - state.secondsLeft / phase.duration;
    const isInhale = phase.label.toLowerCase().includes('inhale');
    const circleScale = isInhale ? 0.6 + progress * 0.4 : 1 - progress * 0.4;

    return (
      <div className="card p-6 text-center">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-white text-sm">{state.exercise.name}</h3>
          <button onClick={() => dispatch({ type: 'stop' })}
            className="text-slate-500 hover:text-red-400 touch-manipulation">
            <X size={18} />
          </button>
        </div>

        <div className="relative w-40 h-40 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full transition-transform duration-1000 ease-in-out"
            style={{
              transform: `scale(${circleScale})`,
              background: `radial-gradient(circle, ${state.exercise.color}30, ${state.exercise.color}10)`,
              border: `2px solid ${state.exercise.color}50`,
            }} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-white">{state.secondsLeft}</span>
            <span className="text-sm font-bold" style={{ color: state.exercise.color }}>{phase.label}</span>
          </div>
        </div>

        <div className="text-xs text-slate-400 mb-4">
          Round {state.round} of {state.exercise.rounds}
        </div>

        <button onClick={() => dispatch({ type: 'pause' })}
          className="px-6 py-2.5 rounded-xl border text-sm font-bold touch-manipulation"
          style={{ borderColor: `${state.exercise.color}40`, color: state.exercise.color, background: `${state.exercise.color}10` }}>
          {state.paused ? 'Resume' : 'Pause'}
        </button>
      </div>
    );
  }

  if (state.complete) {
    return (
      <div className="card p-6 text-center">
        <div className="text-4xl mb-3">🧘</div>
        <h3 className="font-bold text-white text-lg mb-1">Session Complete!</h3>
        <p className="text-sm text-slate-400 mb-4">Great work on your breathing practice.</p>
        <button onClick={() => dispatch({ type: 'stop' })}
          className="px-6 py-2.5 rounded-xl bg-emerald-600/15 border border-emerald-500/25 text-emerald-400 text-sm font-bold touch-manipulation">
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-white text-sm flex items-center gap-2">
        <Wind size={16} className="text-cyan-400" />
        Breathing & Stress Management
      </h3>
      {breathingExercises.map((ex) => (
        <div key={ex.key} className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${ex.color}15`, border: `1px solid ${ex.color}30` }}>
              <Wind size={18} style={{ color: ex.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white">{ex.name}</div>
              <div className="text-[10px] text-slate-400 leading-relaxed">{ex.description}</div>
              <div className="text-[10px] font-medium mt-0.5" style={{ color: ex.color }}>{ex.benefit}</div>
            </div>
            <button onClick={() => dispatch({ type: 'start', exercise: ex })}
              className="px-3 py-2 rounded-xl text-xs font-bold shrink-0 touch-manipulation"
              style={{ background: `${ex.color}15`, border: `1px solid ${ex.color}30`, color: ex.color }}>
              Start
            </button>
          </div>
          <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
            <span>{ex.rounds} rounds</span>
            <span>·</span>
            <span>{ex.phases.map((p) => `${p.label} ${p.duration}s`).join(' → ')}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MEAL TIMING / FASTING TAB
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const MEAL_LABELS = {
  breakfast: '🌅 Breakfast', morning_snack: '🍎 Morning Snack', lunch: '🍽️ Lunch',
  afternoon_snack: '🥜 Afternoon Snack', dinner: '🌙 Dinner', late_snack: '🌃 Late Snack',
};
const MEAL_HOURS = { breakfast: 8, morning_snack: 10, lunch: 13, afternoon_snack: 15, dinner: 19, late_snack: 21 };

function FastingTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/health-insights/meal-timing').then((r) => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (!data || !data.dailyWindows?.length) {
    return (
      <div className="card p-6 text-center">
        <Clock size={32} className="text-slate-600 mx-auto mb-3" />
        <h3 className="font-bold text-white text-sm mb-1">No Meal Data Yet</h3>
        <p className="text-xs text-slate-400">Log your meals on the Nutrition page to see timing insights.</p>
      </div>
    );
  }

  const todayWindow = data.dailyWindows.find((d) => d.date === today());

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
          <Clock size={16} className="text-amber-400" />
          Meal Timing & Eating Window
        </h3>

        {todayWindow && (
          <div className="p-4 bg-slate-800/40 rounded-xl mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">Today's eating window</span>
              <span className="text-sm font-black text-amber-400">{todayWindow.windowHours}h</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-emerald-400">{MEAL_LABELS[todayWindow.firstMeal] || todayWindow.firstMeal}</span>
              <span className="text-slate-600">→</span>
              <span className="text-rose-400">{MEAL_LABELS[todayWindow.lastMeal] || todayWindow.lastMeal}</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">{todayWindow.mealsCount} meals logged today</div>
          </div>
        )}

        {data.avgWindow && (
          <div className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl mb-4">
            <div className="text-center">
              <div className="text-lg font-black text-white">{data.avgWindow}h</div>
              <div className="text-[10px] text-slate-500">Avg Window</div>
            </div>
            <div className="text-xs text-slate-400 flex-1">
              {data.avgWindow <= 8 ? 'Consistent with 16:8 intermittent fasting pattern.' :
               data.avgWindow <= 10 ? 'Moderate eating window — room to tighten for IF benefits.' :
               'Wide eating window. Consider narrowing for metabolic benefits.'}
            </div>
          </div>
        )}

        {/* 24-hour clock visualization */}
        <div className="relative w-48 h-48 mx-auto my-4">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="16" />
            {todayWindow && (() => {
              const startAngle = ((MEAL_HOURS[todayWindow.firstMeal] || 8) / 24) * 360 - 90;
              const endAngle = ((MEAL_HOURS[todayWindow.lastMeal] || 20) / 24) * 360 - 90;
              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (endAngle * Math.PI) / 180;
              const x1 = 100 + 90 * Math.cos(startRad);
              const y1 = 100 + 90 * Math.sin(startRad);
              const x2 = 100 + 90 * Math.cos(endRad);
              const y2 = 100 + 90 * Math.sin(endRad);
              const largeArc = endAngle - startAngle > 180 ? 1 : 0;
              return (
                <path d={`M ${x1} ${y1} A 90 90 0 ${largeArc} 1 ${x2} ${y2}`}
                  fill="none" stroke="#f59e0b" strokeWidth="16" strokeLinecap="round" opacity="0.5" />
              );
            })()}
            {[6, 12, 18, 0].map((h) => {
              const angle = (h / 24) * 360 - 90;
              const rad = (angle * Math.PI) / 180;
              const x = 100 + 75 * Math.cos(rad);
              const y = 100 + 75 * Math.sin(rad);
              return <text key={h} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="#64748b" fontSize="10">{h === 0 ? '12a' : h === 6 ? '6a' : h === 12 ? '12p' : '6p'}</text>;
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] text-slate-500">EATING</span>
            <span className="text-lg font-black text-amber-400">{todayWindow?.windowHours || data.avgWindow}h</span>
            <span className="text-[10px] text-slate-500">WINDOW</span>
          </div>
        </div>
      </div>

      {data.dailyWindows.length > 1 && (
        <div className="card p-5">
          <h3 className="font-bold text-white text-sm mb-3">Eating Window History</h3>
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.dailyWindows.slice(-7).reverse()} barSize={20}>
                <XAxis dataKey="date" tickFormatter={(d) => dayjs(d).format('ddd')}
                  tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Bar dataKey="windowHours" radius={[4, 4, 0, 0]} fill="#f59e0b" fillOpacity={0.5} />
                <Tooltip cursor={false} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }}
                  formatter={(v) => [`${v}h`, 'Window']} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  POSTURE & MOBILITY ASSESSMENT TAB
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const POSTURE_CHECKS = [
  { key: 'forwardHead', label: 'Forward Head Posture', description: 'Does your head sit forward of your shoulders when relaxed?', bad: 'yes', icon: '🧠', options: ['yes', 'no', 'unsure'] },
  { key: 'roundedShoulders', label: 'Rounded Shoulders', description: 'Do your shoulders roll forward when standing naturally?', bad: 'yes', icon: '🫁', options: ['yes', 'no', 'unsure'] },
  { key: 'anteriorPelvicTilt', label: 'Anterior Pelvic Tilt', description: 'Does your lower back arch excessively with belly pushed forward?', bad: 'yes', icon: '🦴', options: ['yes', 'no', 'unsure'] },
  { key: 'touchToes', label: 'Touch Your Toes', description: 'Can you touch your toes with straight legs?', bad: 'no', icon: '🦵', options: ['yes', 'almost', 'no'] },
  { key: 'overheadSquat', label: 'Overhead Squat', description: 'Can you squat with arms straight overhead?', bad: 'no', icon: '🏋️', options: ['yes', 'partial', 'no'] },
  { key: 'ankleDorsiflexion', label: 'Ankle Flexibility', description: 'Can your knee go past your toes while keeping heel down?', bad: 'no', icon: '🦶', options: ['yes', 'no', 'unsure'] },
];

const CORRECTIVE_EXERCISES = {
  forwardHead: ['Chin tucks (3×15 daily)', 'Neck retraction stretches', 'Upper trap stretches'],
  roundedShoulders: ['Face pulls (3×15)', 'Band pull-aparts (3×20)', 'Doorway chest stretch (30s each side)'],
  anteriorPelvicTilt: ['Dead bugs (3×10 each side)', 'Glute bridges (3×15)', 'Hip flexor stretch (30s each)'],
  touchToes: ['Romanian deadlifts (light)', 'Standing hamstring stretch (30s each)', 'Jefferson curls (bodyweight)'],
  overheadSquat: ['Wall angels (3×10)', 'Thoracic foam rolling', 'Lat stretches (30s each)'],
  ankleDorsiflexion: ['Wall ankle mobilizations (3×15 each)', 'Calf raises (3×20)', 'Foam roll calves'],
};

function PostureTab() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    forwardHead: 'unsure', roundedShoulders: 'unsure', anteriorPelvicTilt: 'unsure',
    touchToes: 'unsure', overheadSquat: 'unsure', ankleDorsiflexion: 'unsure', notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    API.get('/posture').then((r) => setAssessments(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await API.post('/posture', { ...form, date: today() });
      setAssessments((prev) => [data, ...prev]);
      setShowForm(false);
      toast.success('Assessment saved!');
    } catch {
      toast.error('Failed to save');
    }
    setSaving(false);
  };

  const latest = assessments[0];
  const issues = latest ? POSTURE_CHECKS.filter((pc) => {
    const val = latest[pc.key];
    return val === pc.bad;
  }) : [];

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white text-sm flex items-center gap-2">
          <Target size={16} className="text-teal-400" />
          Posture & Mobility
        </h3>
        <button onClick={() => setShowForm((v) => !v)}
          className="px-3 py-1.5 rounded-xl bg-teal-600/15 border border-teal-500/25 text-teal-400 text-xs font-bold flex items-center gap-1.5 active:bg-teal-600/25 touch-manipulation">
          {showForm ? <X size={12} /> : <Plus size={12} />} {showForm ? 'Cancel' : 'New Assessment'}
        </button>
      </div>

      {showForm && (
        <div className="card p-5 space-y-4">
          <p className="text-xs text-slate-400">Answer each question honestly. This helps generate personalized corrective exercise recommendations.</p>
          {POSTURE_CHECKS.map((pc) => (
            <div key={pc.key}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm">{pc.icon}</span>
                <span className="text-sm font-bold text-white">{pc.label}</span>
              </div>
              <p className="text-[10px] text-slate-400 mb-2">{pc.description}</p>
              <div className="flex gap-2">
                {pc.options.map((opt) => (
                  <button key={opt} onClick={() => setForm((f) => ({ ...f, [pc.key]: opt }))}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all touch-manipulation ${
                      form[pc.key] === opt
                        ? 'bg-teal-500/20 border-teal-500/40 text-teal-400 border'
                        : 'bg-slate-800/40 border border-slate-700/30 text-slate-400'
                    }`}>
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button onClick={handleSave} disabled={saving}
            className="w-full py-2.5 rounded-xl bg-teal-600/15 border border-teal-500/25 text-teal-400 text-xs font-bold flex items-center justify-center gap-2 active:bg-teal-600/25 disabled:opacity-50 touch-manipulation">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Assessment
          </button>
        </div>
      )}

      {latest && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-white text-sm">Latest Assessment</h4>
            <span className="text-[10px] text-slate-500">{dayjs(latest.date).format('MMM D, YYYY')}</span>
          </div>

          {/* Score ring */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-20 h-20 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                <circle cx="50" cy="50" r="42" fill="none"
                  stroke={latest.overallScore >= 70 ? '#22c55e' : latest.overallScore >= 40 ? '#eab308' : '#ef4444'}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${latest.overallScore * 2.64} 264`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-white">{latest.overallScore}</span>
                <span className="text-[8px] text-slate-500">/100</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="text-sm text-slate-300">
                {latest.overallScore >= 70 ? 'Good mobility! Keep maintaining.' :
                 latest.overallScore >= 40 ? 'Some areas need work. See recommendations below.' :
                 'Significant mobility issues detected. Focus on corrective exercises.'}
              </div>
            </div>
          </div>

          {/* Per-check results */}
          <div className="space-y-2">
            {POSTURE_CHECKS.map((pc) => {
              const val = latest[pc.key];
              const isBad = val === pc.bad;
              const isGood = pc.bad === 'yes' ? val === 'no' : val === 'yes';
              return (
                <div key={pc.key} className="flex items-center gap-2 text-xs">
                  <span>{pc.icon}</span>
                  <span className="flex-1 text-slate-300">{pc.label}</span>
                  <span className={`font-bold ${isGood ? 'text-emerald-400' : isBad ? 'text-red-400' : 'text-amber-400'}`}>
                    {formatEnum(val || 'unsure')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {issues.length > 0 && (
        <div className="card p-5">
          <h4 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
            <Sparkles size={14} className="text-teal-400" />
            Your Corrective Exercises
          </h4>
          <div className="space-y-3">
            {issues.map((issue) => (
              <div key={issue.key}>
                <div className="text-xs font-bold text-amber-400 mb-1">{issue.icon} {issue.label}</div>
                <ul className="space-y-1">
                  {(CORRECTIVE_EXERCISES[issue.key] || []).map((ex, i) => (
                    <li key={i} className="text-xs text-slate-300 flex items-center gap-2">
                      <ChevronRight size={10} className="text-teal-400 shrink-0" />
                      {ex}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {assessments.length > 1 && (
        <div className="card p-5">
          <h4 className="font-bold text-white text-sm mb-3">Score History</h4>
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={assessments.slice(0, 6).map((a) => ({ date: dayjs(a.date).format('MMM'), score: a.overallScore })).reverse()}>
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Line type="monotone" dataKey="score" stroke="#14b8a6" strokeWidth={2} dot={{ r: 3, fill: '#14b8a6' }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }}
                  formatter={(v) => [`${v}/100`, 'Score']} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SHARED COMPONENTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 size={24} className="text-slate-500 animate-spin" />
    </div>
  );
}

function MetricBox({ label, value, color }) {
  return (
    <div className="bg-slate-800/40 rounded-xl p-3 text-center">
      <div className="text-lg font-black" style={{ color }}>{value}</div>
      <div className="text-[10px] text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MAIN PAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const TAB_COMPONENTS = {
  overview: OverviewTab,
  composition: CompositionTab,
  vitals: VitalsTab,
  injury: InjuryTab,
  supplements: SupplementsTab,
  breathing: BreathingTab,
  fasting: FastingTab,
  posture: PostureTab,
};

export default function HealthInsights() {
  const [activeTab, setActiveTab] = useState('overview');
  const tabRef = useRef(null);

  const TabComponent = TAB_COMPONENTS[activeTab];

  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-slate-700/30 px-4 pt-4 pb-0"
        style={{ background: 'linear-gradient(180deg, rgba(10,14,23,0.98) 0%, rgba(10,14,23,0.95) 100%)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-600 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/15">
              <Activity size={18} className="text-white" />
            </div>
            <div>
              <h1 className="font-black text-white text-lg leading-tight">Health Insights</h1>
              <p className="text-[10px] text-slate-500 font-medium">Recovery · Composition · Vitals · Wellness</p>
            </div>
          </div>

          {/* Tab bar */}
          <div ref={tabRef} className="flex gap-1 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 touch-manipulation ${
                  activeTab === key
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-500 hover:text-slate-300 border border-transparent'
                }`}>
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <TabComponent />
      </div>
    </div>
  );
}
