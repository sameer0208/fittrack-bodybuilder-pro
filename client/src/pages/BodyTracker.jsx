import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Ruler,
  Camera,
  Loader2,
  Upload,
  X,
  Trash2,
  GitCompare,
  ChevronDown,
} from 'lucide-react';

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });
API.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('ft_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

const MEASUREMENT_FIELDS = [
  { key: 'chest', label: 'Chest' },
  { key: 'waist', label: 'Waist' },
  { key: 'hips', label: 'Hips' },
  { key: 'bicepsLeft', label: 'Biceps L' },
  { key: 'bicepsRight', label: 'Biceps R' },
  { key: 'thighLeft', label: 'Thigh L' },
  { key: 'thighRight', label: 'Thigh R' },
  { key: 'calves', label: 'Calves' },
  { key: 'forearms', label: 'Forearms' },
  { key: 'neck', label: 'Neck' },
  { key: 'shoulders', label: 'Shoulders' },
];

const CHART_COLORS = [
  '#6366f1',
  '#a855f7',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#22c55e',
  '#eab308',
  '#3b82f6',
  '#f43f5e',
  '#06b6d4',
  '#84cc16',
];

function compressImageToJpeg(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const maxW = 1200;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > maxW) {
        h = (h * maxW) / w;
        w = maxW;
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-2xl text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={String(p.dataKey)} className="text-white font-semibold">
          <span style={{ color: p.color }}>{p.name}</span>: {p.value != null ? `${Number(p.value).toFixed(1)} cm` : '—'}
        </p>
      ))}
    </div>
  );
};

export default function BodyTracker() {
  const [activeTab, setActiveTab] = useState('measurements');

  const emptyForm = useMemo(
    () =>
      MEASUREMENT_FIELDS.reduce((acc, { key }) => {
        acc[key] = '';
        return acc;
      }, { notes: '' }),
    []
  );

  const [form, setForm] = useState(() => ({ ...emptyForm }));
  const [measurements, setMeasurements] = useState([]);
  const [loadingMeasurements, setLoadingMeasurements] = useState(true);
  const [savingMeasurements, setSavingMeasurements] = useState(false);

  const [chartKeys, setChartKeys] = useState(() => new Set(['chest', 'waist', 'hips']));

  const [photos, setPhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [pose, setPose] = useState('front');
  const [photoNotes, setPhotoNotes] = useState('');
  const [weekNumber, setWeekNumber] = useState(1);

  const [modalPhoto, setModalPhoto] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [compareLeftId, setCompareLeftId] = useState('');
  const [compareRightId, setCompareRightId] = useState('');

  const fetchMeasurements = useCallback(async () => {
    setLoadingMeasurements(true);
    try {
      const { data } = await API.get('/body/measurements');
      setMeasurements(Array.isArray(data) ? data : data?.measurements || []);
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || 'Could not load measurements');
      setMeasurements([]);
    } finally {
      setLoadingMeasurements(false);
    }
  }, []);

  const fetchPhotos = useCallback(async () => {
    setLoadingPhotos(true);
    try {
      const { data } = await API.get('/body/photos');
      const list = Array.isArray(data) ? data : data?.photos || [];
      setPhotos(list);
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || 'Could not load photos');
      setPhotos([]);
    } finally {
      setLoadingPhotos(false);
    }
  }, []);

  useEffect(() => {
    fetchMeasurements();
  }, [fetchMeasurements]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  useEffect(() => {
    if (!photos.length) {
      setCompareLeftId('');
      setCompareRightId('');
      return;
    }
    const sorted = [...photos].sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());
    const weeks = [...new Set(sorted.map((p) => p.weekNumber).filter((w) => w != null))].sort((a, b) => a - b);
    const firstWeek = weeks[0] ?? sorted[0]?.weekNumber;
    const week1Photos = sorted.filter((p) => p.weekNumber === firstWeek);
    const left = week1Photos[0] || sorted[0];
    const right = sorted[sorted.length - 1];
    setCompareLeftId((id) => {
      if (id && photos.some((p) => p._id === id || p.id === id)) return id;
      return left?._id || left?.id || '';
    });
    setCompareRightId((id) => {
      if (id && photos.some((p) => p._id === id || p.id === id)) return id;
      return right?._id || right?.id || '';
    });
  }, [photos]);

  const chartData = useMemo(() => {
    const chronological = [...measurements].sort(
      (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf()
    );
    return chronological.map((m) => {
      const row = {
        dateLabel: m.date ? dayjs(m.date).format('MMM D') : '—',
        ts: m.date ? dayjs(m.date).valueOf() : 0,
      };
      MEASUREMENT_FIELDS.forEach(({ key }) => {
        const v = m[key];
        row[key] = typeof v === 'number' && !Number.isNaN(v) ? v : null;
      });
      return row;
    });
  }, [measurements]);

  const toggleChartKey = (key) => {
    setChartKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSaveMeasurements = async () => {
    const payload = {};
    MEASUREMENT_FIELDS.forEach(({ key }) => {
      const raw = form[key];
      if (raw === '' || raw == null) return;
      const n = parseFloat(String(raw).replace(',', '.'));
      if (!Number.isNaN(n) && n > 0) payload[key] = n;
    });
    if (form.notes?.trim()) payload.notes = form.notes.trim();

    if (Object.keys(payload).filter((k) => k !== 'notes').length === 0) {
      toast.error('Enter at least one measurement');
      return;
    }

    setSavingMeasurements(true);
    try {
      await API.post('/body/measurements', payload);
      toast.success('Measurements saved');
      setForm({ ...emptyForm });
      await fetchMeasurements();
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || 'Failed to save');
    } finally {
      setSavingMeasurements(false);
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Choose an image file');
      return;
    }
    setUploading(true);
    try {
      const image = await compressImageToJpeg(file);
      await API.post('/body/photos', {
        image,
        pose,
        notes: photoNotes.trim() || undefined,
        weekNumber: Number(weekNumber) || 1,
      });
      toast.success('Photo uploaded');
      setPhotoNotes('');
      await fetchPhotos();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (id) => {
    if (!id) return;
    setDeletingId(id);
    try {
      await API.delete(`/body/photos/${id}`);
      toast.success('Photo removed');
      setModalPhoto(null);
      await fetchPhotos();
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const photosByWeek = useMemo(() => {
    const map = new Map();
    const sorted = [...photos].sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());
    sorted.forEach((p) => {
      const w = p.weekNumber ?? '—';
      if (!map.has(w)) map.set(w, []);
      map.get(w).push(p);
    });
    return [...map.entries()].sort((a, b) => {
      if (a[0] === '—') return 1;
      if (b[0] === '—') return -1;
      return Number(b[0]) - Number(a[0]);
    });
  }, [photos]);

  const photoById = useMemo(() => {
    const m = new Map();
    photos.forEach((p) => {
      const id = p._id || p.id;
      if (id) m.set(id, p);
    });
    return m;
  }, [photos]);

  const compareLeft = compareLeftId ? photoById.get(compareLeftId) : null;
  const compareRight = compareRightId ? photoById.get(compareRightId) : null;

  const tabs = [
    { id: 'measurements', label: 'Measurements', icon: Ruler },
    { id: 'photos', label: 'Photos', icon: Camera },
  ];

  return (
    <div className="page-container">
      <div className="sticky top-0 z-30 lg:hidden bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/40 px-4 py-3 overflow-hidden w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600/20 rounded-lg flex items-center justify-center">
            <Ruler size={15} className="text-indigo-400" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Physique</div>
            <div className="text-sm font-bold text-white leading-tight">Body Tracker</div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-4 lg:pt-8">
        <div className="hidden lg:block mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Ruler className="text-indigo-400" size={28} />
            Body Tracker
          </h1>
          <p className="text-sm text-slate-400 mt-1">Measurements and progress photos</p>
        </div>

        <div className="flex gap-1 p-1 bg-slate-800 rounded-xl mb-5 border border-slate-700">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-lg transition-all touch-manipulation min-h-[44px] ${
                activeTab === id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'measurements' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">New entry (cm)</p>
              {loadingMeasurements && measurements.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
                  <Loader2 className="animate-spin" size={20} />
                  Loading…
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {MEASUREMENT_FIELDS.map(({ key, label }) => (
                      <label key={key} className="block">
                        <span className="text-xs text-slate-500 mb-1 block">{label}</span>
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.1"
                          min="0"
                          placeholder="—"
                          value={form[key]}
                          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                          className="w-full bg-slate-700/60 border border-slate-600/50 rounded-xl px-3 py-2.5 text-white text-sm"
                        />
                      </label>
                    ))}
                  </div>
                  <label className="block mb-4">
                    <span className="text-xs text-slate-500 mb-1 block">Notes</span>
                    <textarea
                      rows={2}
                      value={form.notes}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      placeholder="Optional"
                      className="w-full bg-slate-700/60 border border-slate-600/50 rounded-xl px-3 py-2.5 text-white text-sm resize-none"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={savingMeasurements}
                    onClick={handleSaveMeasurements}
                    className="w-full sm:w-auto bg-indigo-600 text-white rounded-xl px-4 py-2.5 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {savingMeasurements ? <Loader2 className="animate-spin" size={18} /> : null}
                    Save Measurements
                  </button>
                </>
              )}
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Trends</p>
              <p className="text-xs text-slate-500 mb-3">Select measurements to plot</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {MEASUREMENT_FIELDS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleChartKey(key)}
                    className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors ${
                      chartKeys.has(key)
                        ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                        : 'bg-slate-700/40 border-slate-600 text-slate-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {chartData.length < 2 ? (
                <div className="h-48 flex items-center justify-center text-slate-500 text-sm border border-dashed border-slate-600 rounded-xl">
                  Log at least two entries to see trends
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.6)" />
                      <XAxis dataKey="dateLabel" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend
                        wrapperStyle={{ fontSize: 11 }}
                        formatter={(value) => <span className="text-slate-300">{value}</span>}
                      />
                      {[...chartKeys].map((key, i) => {
                        const label = MEASUREMENT_FIELDS.find((f) => f.key === key)?.label || key;
                        return (
                          <Line
                            key={key}
                            type="monotone"
                            dataKey={key}
                            name={label}
                            stroke={CHART_COLORS[i % CHART_COLORS.length]}
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            connectNulls
                          />
                        );
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Recent measurements</p>
              {loadingMeasurements ? (
                <div className="flex justify-center py-8 text-slate-400 gap-2">
                  <Loader2 className="animate-spin" size={20} />
                </div>
              ) : measurements.length === 0 ? (
                <div className="text-center text-slate-500 text-sm py-8 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                  No entries yet. Add your first measurements above.
                </div>
              ) : (
                <div className="space-y-3">
                  {measurements.slice(0, 12).map((m, idx) => (
                    <div key={m._id || m.id || idx} className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-white">
                          {m.date ? dayjs(m.date).format('MMM D, YYYY') : 'Date unknown'}
                        </span>
                        {m.notes && <span className="text-xs text-slate-500 truncate max-w-[40%]">{m.notes}</span>}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        {MEASUREMENT_FIELDS.map(({ key, label }) => {
                          const v = m[key];
                          if (v == null || v === '') return null;
                          return (
                            <div key={key} className="flex justify-between gap-2 bg-slate-700/40 rounded-lg px-2 py-1.5">
                              <span className="text-slate-400">{label}</span>
                              <span className="text-white font-semibold">{Number(v).toFixed(1)} cm</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="space-y-6 animate-fade-in pb-4">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Upload progress photo</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <label className="block">
                  <span className="text-xs text-slate-500 mb-1 block">Pose</span>
                  <div className="relative">
                    <select
                      value={pose}
                      onChange={(e) => setPose(e.target.value)}
                      className="w-full appearance-none bg-slate-700/60 border border-slate-600/50 rounded-xl px-3 py-2.5 text-white text-sm pr-10"
                    >
                      <option value="front">Front</option>
                      <option value="side">Side</option>
                      <option value="back">Back</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  </div>
                </label>
                <label className="block">
                  <span className="text-xs text-slate-500 mb-1 block">Week #</span>
                  <input
                    type="number"
                    min={1}
                    value={weekNumber}
                    onChange={(e) => setWeekNumber(e.target.value)}
                    className="w-full bg-slate-700/60 border border-slate-600/50 rounded-xl px-3 py-2.5 text-white text-sm"
                  />
                </label>
              </div>
              <label className="block mb-4">
                <span className="text-xs text-slate-500 mb-1 block">Notes</span>
                <input
                  type="text"
                  value={photoNotes}
                  onChange={(e) => setPhotoNotes(e.target.value)}
                  placeholder="Optional"
                  className="w-full bg-slate-700/60 border border-slate-600/50 rounded-xl px-3 py-2.5 text-white text-sm"
                />
              </label>
              <label className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-xl px-4 py-2.5 font-semibold cursor-pointer disabled:opacity-50 w-full sm:w-auto">
                {uploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                {uploading ? 'Uploading…' : 'Choose image'}
                <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
              </label>
              <p className="text-xs text-slate-500 mt-2">Images are resized to max 1200px wide and saved as JPEG.</p>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                <GitCompare size={14} />
                Compare
              </p>
              <p className="text-xs text-slate-500 mb-4">Week 1 vs latest — pick any two photos</p>
              {loadingPhotos && photos.length === 0 ? (
                <div className="flex justify-center py-8 text-slate-400 gap-2">
                  <Loader2 className="animate-spin" size={20} />
                </div>
              ) : photos.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">Upload photos to compare progress.</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Week 1</span>
                      <div className="relative">
                        <select
                          value={compareLeftId}
                          onChange={(e) => setCompareLeftId(e.target.value)}
                          className="w-full appearance-none bg-slate-700/60 border border-slate-600/50 rounded-xl px-3 py-2.5 text-white text-sm pr-10"
                        >
                          {photos.map((p) => {
                            const id = p._id || p.id;
                            return (
                              <option key={id} value={id}>
                                W{p.weekNumber ?? '?'} · {p.pose} · {p.date ? dayjs(p.date).format('MMM D') : ''}
                              </option>
                            );
                          })}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Latest</span>
                      <div className="relative">
                        <select
                          value={compareRightId}
                          onChange={(e) => setCompareRightId(e.target.value)}
                          className="w-full appearance-none bg-slate-700/60 border border-slate-600/50 rounded-xl px-3 py-2.5 text-white text-sm pr-10"
                        >
                          {photos.map((p) => {
                            const id = p._id || p.id;
                            return (
                              <option key={id} value={id}>
                                W{p.weekNumber ?? '?'} · {p.pose} · {p.date ? dayjs(p.date).format('MMM D') : ''}
                              </option>
                            );
                          })}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl overflow-hidden border border-slate-600 bg-slate-900 aspect-[3/4] flex items-center justify-center">
                      {compareLeft?.cloudinaryUrl ? (
                        <img
                          src={compareLeft.cloudinaryUrl}
                          alt="Compare A"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-slate-500 text-xs">No image</span>
                      )}
                    </div>
                    <div className="rounded-xl overflow-hidden border border-slate-600 bg-slate-900 aspect-[3/4] flex items-center justify-center">
                      {compareRight?.cloudinaryUrl ? (
                        <img
                          src={compareRight.cloudinaryUrl}
                          alt="Compare B"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-slate-500 text-xs">No image</span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Gallery by week</p>
              {loadingPhotos ? (
                <div className="flex justify-center py-12 text-slate-400 gap-2">
                  <Loader2 className="animate-spin" size={22} />
                </div>
              ) : photos.length === 0 ? (
                <div className="text-center text-slate-500 text-sm py-10 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                  No photos yet.
                </div>
              ) : (
                <div className="space-y-8">
                  {photosByWeek.map(([week, items]) => (
                    <div key={String(week)}>
                      <h3 className="text-sm font-bold text-white mb-3">
                        Week {week}
                        <span className="text-slate-500 font-normal text-xs ml-2">
                          {items.length} photo{items.length !== 1 ? 's' : ''}
                        </span>
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {items.map((p) => {
                          const id = p._id || p.id;
                          const thumb = p.thumbnailUrl || p.cloudinaryUrl;
                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() => setModalPhoto(p)}
                              className="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-900 aspect-[3/4] text-left"
                            >
                              {thumb ? (
                                <img src={thumb} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">No thumb</div>
                              )}
                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                <span className="text-[10px] font-bold text-white uppercase">{p.pose}</span>
                                <span className="text-[10px] text-slate-300 block">
                                  {p.date ? dayjs(p.date).format('MMM D, HH:mm') : ''}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {modalPhoto && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setModalPhoto(null)}
        >
          <div
            className="relative max-w-3xl w-full max-h-[90vh] flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setModalPhoto(null)}
              className="absolute -top-2 -right-2 z-10 w-10 h-10 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-white hover:bg-slate-700"
              aria-label="Close"
            >
              <X size={20} />
            </button>
            {modalPhoto.cloudinaryUrl && (
              <img
                src={modalPhoto.cloudinaryUrl}
                alt={`${modalPhoto.pose} full`}
                className="w-full max-h-[75vh] object-contain rounded-2xl border border-slate-700"
              />
            )}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="text-sm text-slate-300">
                <span className="font-semibold capitalize">{modalPhoto.pose}</span>
                {modalPhoto.date && (
                  <span className="text-slate-500 ml-2">{dayjs(modalPhoto.date).format('MMM D, YYYY HH:mm')}</span>
                )}
                {modalPhoto.weekNumber != null && (
                  <span className="text-slate-500 ml-2">· Week {modalPhoto.weekNumber}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDeletePhoto(modalPhoto._id || modalPhoto.id)}
                disabled={deletingId}
                className="inline-flex items-center gap-2 bg-red-600/90 hover:bg-red-600 text-white rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                {deletingId ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
