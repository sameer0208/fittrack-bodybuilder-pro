import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Calendar,
  StickyNote,
  Maximize2,
  Filter,
  Plus,
  ArrowRightLeft,
  Aperture,
} from 'lucide-react';
import CameraCapture from '../components/CameraCapture';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const API = axios.create({ baseURL: API_BASE });
API.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('ft_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

function normalizePhotoUrl(url) {
  if (!url) return url;
  let fixed = url.replace(/^http:\/\//, 'https://');
  if (fixed.startsWith('/uploads/') && API_BASE !== '/api') {
    const backendOrigin = API_BASE.replace(/\/api\/?$/, '');
    fixed = backendOrigin + fixed;
  }
  return fixed;
}

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
  '#6366f1', '#a855f7', '#ec4899', '#14b8a6', '#f97316',
  '#22c55e', '#eab308', '#3b82f6', '#f43f5e', '#06b6d4', '#84cc16',
];

const POSE_OPTIONS = [
  { value: 'all', label: 'All', color: 'indigo' },
  { value: 'front', label: 'Front', color: 'blue' },
  { value: 'side', label: 'Side', color: 'purple' },
  { value: 'back', label: 'Back', color: 'emerald' },
];

const POSE_BADGE_STYLES = {
  front: 'bg-blue-500/80 text-blue-50',
  side: 'bg-purple-500/80 text-purple-50',
  back: 'bg-emerald-500/80 text-emerald-50',
};

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
      if (!ctx) { reject(new Error('Canvas not supported')); return; }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
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
    () => MEASUREMENT_FIELDS.reduce((acc, { key }) => { acc[key] = ''; return acc; }, { notes: '' }),
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
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const [galleryFilter, setGalleryFilter] = useState('all');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const hasCameraSupport = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

  const [modalPhoto, setModalPhoto] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [compareLeftId, setCompareLeftId] = useState('');
  const [compareRightId, setCompareRightId] = useState('');
  const [showCompare, setShowCompare] = useState(false);

  // ── Data Fetching ──────────────────────────────────────────────────────────

  const fetchMeasurements = useCallback(async () => {
    setLoadingMeasurements(true);
    try {
      const { data } = await API.get('/body/measurements');
      setMeasurements(Array.isArray(data) ? data : data?.measurements || []);
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || 'Could not load measurements');
      setMeasurements([]);
    } finally { setLoadingMeasurements(false); }
  }, []);

  const fetchPhotos = useCallback(async () => {
    setLoadingPhotos(true);
    try {
      const { data } = await API.get('/body/photos');
      const raw = Array.isArray(data) ? data : data?.photos || [];
      const list = raw.map((p) => ({
        ...p,
        cloudinaryUrl: normalizePhotoUrl(p.cloudinaryUrl),
        thumbnailUrl: normalizePhotoUrl(p.thumbnailUrl),
      }));
      setPhotos(list);
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || 'Could not load photos');
      setPhotos([]);
    } finally { setLoadingPhotos(false); }
  }, []);

  useEffect(() => { fetchMeasurements(); }, [fetchMeasurements]);
  useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

  useEffect(() => {
    if (!photos.length) { setCompareLeftId(''); setCompareRightId(''); return; }
    const sorted = [...photos].sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());
    const weeks = [...new Set(sorted.map((p) => p.weekNumber).filter((w) => w != null))].sort((a, b) => a - b);
    const firstWeek = weeks[0] ?? sorted[0]?.weekNumber;
    const week1 = sorted.filter((p) => p.weekNumber === firstWeek);
    const left = week1[0] || sorted[0];
    const right = sorted[sorted.length - 1];
    setCompareLeftId((id) => (id && photos.some((p) => (p._id || p.id) === id) ? id : left?._id || left?.id || ''));
    setCompareRightId((id) => (id && photos.some((p) => (p._id || p.id) === id) ? id : right?._id || right?.id || ''));
  }, [photos]);

  // ── Measurements logic ─────────────────────────────────────────────────────

  const chartData = useMemo(() => {
    const chronological = [...measurements].sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());
    return chronological.map((m) => {
      const row = { dateLabel: m.date ? dayjs(m.date).format('MMM D') : '—', ts: m.date ? dayjs(m.date).valueOf() : 0 };
      MEASUREMENT_FIELDS.forEach(({ key }) => { const v = m[key]; row[key] = typeof v === 'number' && !Number.isNaN(v) ? v : null; });
      return row;
    });
  }, [measurements]);

  const toggleChartKey = (key) => {
    setChartKeys((prev) => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; });
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
    if (Object.keys(payload).filter((k) => k !== 'notes').length === 0) { toast.error('Enter at least one measurement'); return; }
    setSavingMeasurements(true);
    try {
      await API.post('/body/measurements', payload);
      toast.success('Measurements saved');
      setForm({ ...emptyForm });
      await fetchMeasurements();
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || 'Failed to save');
    } finally { setSavingMeasurements(false); }
  };

  // ── Photo upload logic ─────────────────────────────────────────────────────

  const clearPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewFile(null);
  };

  const handleFileSelect = (file) => {
    if (!file || !file.type.startsWith('image/')) { toast.error('Choose an image file'); return; }
    clearPreview();
    setPreviewUrl(URL.createObjectURL(file));
    setPreviewFile(file);
    setShowUploadForm(true);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    handleFileSelect(file);
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    handleFileSelect(file);
  };

  const handleCameraCapture = (file) => {
    setShowCamera(false);
    handleFileSelect(file);
  };

  const handleUpload = async () => {
    if (!previewFile) { toast.error('Select an image first'); return; }
    setUploading(true);
    try {
      const image = await compressImageToJpeg(previewFile);
      await API.post('/body/photos', { image, pose, notes: photoNotes.trim() || undefined, weekNumber: Number(weekNumber) || 1 });
      toast.success('Photo uploaded successfully!');
      setPhotoNotes('');
      clearPreview();
      setShowUploadForm(false);
      await fetchPhotos();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally { setUploading(false); }
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
    } finally { setDeletingId(null); }
  };

  // ── Computed data ──────────────────────────────────────────────────────────

  const filteredPhotos = useMemo(() => {
    if (galleryFilter === 'all') return photos;
    return photos.filter((p) => p.pose === galleryFilter);
  }, [photos, galleryFilter]);

  const photosByWeek = useMemo(() => {
    const map = new Map();
    const sorted = [...filteredPhotos].sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());
    sorted.forEach((p) => { const w = p.weekNumber ?? '—'; if (!map.has(w)) map.set(w, []); map.get(w).push(p); });
    return [...map.entries()].sort((a, b) => { if (a[0] === '—') return 1; if (b[0] === '—') return -1; return Number(b[0]) - Number(a[0]); });
  }, [filteredPhotos]);

  const photoById = useMemo(() => {
    const m = new Map();
    photos.forEach((p) => { const id = p._id || p.id; if (id) m.set(id, p); });
    return m;
  }, [photos]);

  const compareLeft = compareLeftId ? photoById.get(compareLeftId) : null;
  const compareRight = compareRightId ? photoById.get(compareRightId) : null;

  const flatSorted = useMemo(() => [...photos].sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf()), [photos]);
  const modalIndex = modalPhoto ? flatSorted.findIndex((p) => (p._id || p.id) === (modalPhoto._id || modalPhoto.id)) : -1;
  const canPrev = modalIndex > 0;
  const canNext = modalIndex >= 0 && modalIndex < flatSorted.length - 1;
  const goModalPrev = () => { if (canPrev) setModalPhoto(flatSorted[modalIndex - 1]); };
  const goModalNext = () => { if (canNext) setModalPhoto(flatSorted[modalIndex + 1]); };

  const poseCounts = useMemo(() => {
    const counts = { all: photos.length, front: 0, side: 0, back: 0 };
    photos.forEach((p) => { if (counts[p.pose] !== undefined) counts[p.pose]++; });
    return counts;
  }, [photos]);

  const tabs = [
    { id: 'measurements', label: 'Measurements', icon: Ruler },
    { id: 'photos', label: 'Photos', icon: Camera },
  ];

  return (
    <div className="page-container">
      {/* Mobile header */}
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
        {/* Desktop header */}
        <div className="hidden lg:block mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Ruler className="text-indigo-400" size={28} />
            Body Tracker
          </h1>
          <p className="text-sm text-slate-400 mt-1">Measurements and progress photos</p>
        </div>

        {/* Tab switcher */}
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

        {/* ═══ MEASUREMENTS TAB ═══ */}
        {activeTab === 'measurements' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">New entry (cm)</p>
              {loadingMeasurements && measurements.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
                  <Loader2 className="animate-spin" size={20} /> Loading…
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {MEASUREMENT_FIELDS.map(({ key, label }) => (
                      <label key={key} className="block">
                        <span className="text-xs text-slate-500 mb-1 block">{label}</span>
                        <input type="number" inputMode="decimal" step="0.1" min="0" placeholder="—" value={form[key]}
                          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                          className="w-full bg-slate-700/60 border border-slate-600/50 rounded-xl px-3 py-2.5 text-white text-sm" />
                      </label>
                    ))}
                  </div>
                  <label className="block mb-4">
                    <span className="text-xs text-slate-500 mb-1 block">Notes</span>
                    <textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      placeholder="Optional" className="w-full bg-slate-700/60 border border-slate-600/50 rounded-xl px-3 py-2.5 text-white text-sm resize-none" />
                  </label>
                  <button type="button" disabled={savingMeasurements} onClick={handleSaveMeasurements}
                    className="w-full sm:w-auto bg-indigo-600 text-white rounded-xl px-4 py-2.5 font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
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
                  <button key={key} type="button" onClick={() => toggleChartKey(key)}
                    className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors ${
                      chartKeys.has(key) ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200' : 'bg-slate-700/40 border-slate-600 text-slate-400'
                    }`}>
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
                      <Legend wrapperStyle={{ fontSize: 11 }} formatter={(value) => <span className="text-slate-300">{value}</span>} />
                      {[...chartKeys].map((key, i) => {
                        const label = MEASUREMENT_FIELDS.find((f) => f.key === key)?.label || key;
                        return <Line key={key} type="monotone" dataKey={key} name={label} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} dot={{ r: 3 }} connectNulls />;
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Recent measurements</p>
              {loadingMeasurements ? (
                <div className="flex justify-center py-8 text-slate-400 gap-2"><Loader2 className="animate-spin" size={20} /></div>
              ) : measurements.length === 0 ? (
                <div className="text-center text-slate-500 text-sm py-8 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                  No entries yet. Add your first measurements above.
                </div>
              ) : (
                <div className="space-y-3">
                  {measurements.slice(0, 12).map((m, idx) => (
                    <div key={m._id || m.id || idx} className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-white">{m.date ? dayjs(m.date).format('MMM D, YYYY') : 'Date unknown'}</span>
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

        {/* ═══ PHOTOS TAB ═══ */}
        {activeTab === 'photos' && (
          <div className="space-y-5 animate-fade-in pb-4">

            {/* ── Action bar ── */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => { setShowUploadForm((v) => !v); if (showCompare) setShowCompare(false); }}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  showUploadForm
                    ? 'bg-indigo-600 text-white ring-2 ring-indigo-400/40'
                    : 'bg-slate-800 border border-slate-700 text-slate-300 hover:border-indigo-500/50 hover:text-white'
                }`}
              >
                <Plus size={16} /> Upload
              </button>
              <button
                type="button"
                onClick={() => { setShowCompare((v) => !v); if (showUploadForm) setShowUploadForm(false); }}
                disabled={photos.length < 2}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  showCompare
                    ? 'bg-purple-600 text-white ring-2 ring-purple-400/40'
                    : 'bg-slate-800 border border-slate-700 text-slate-300 hover:border-purple-500/50 hover:text-white'
                }`}
              >
                <ArrowRightLeft size={16} /> Compare
              </button>
              <div className="flex-1" />
              <span className="text-xs text-slate-500">
                {photos.length} photo{photos.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* ── Upload Panel ── */}
            {showUploadForm && (
              <div className="bg-gradient-to-br from-slate-800 to-slate-800/80 border border-slate-700 rounded-2xl overflow-hidden animate-fade-in">
                {/* Image source: Preview / Camera+Gallery picker / Drop zone */}
                <div
                  className={`relative border-b border-slate-700/60 transition-colors ${dragOver ? 'bg-indigo-600/10' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleFileDrop}
                >
                  {previewUrl ? (
                    <div className="relative flex items-center justify-center bg-black/40 min-h-[200px] max-h-[320px]">
                      <img src={previewUrl} alt="Preview" className="max-h-[320px] max-w-full object-contain" />
                      <button type="button" onClick={clearPreview}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-black/80 transition-colors">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="py-8 px-4">
                      <div className="flex items-center justify-center gap-4 max-w-sm mx-auto">
                        {/* Open Camera */}
                        {hasCameraSupport && (
                          <button type="button" onClick={() => setShowCamera(true)}
                            className="flex-1 flex flex-col items-center gap-3 py-6 px-3 rounded-2xl border-2 border-dashed border-slate-600 hover:border-indigo-500/60 bg-slate-800/50 hover:bg-indigo-600/5 transition-all group cursor-pointer">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 group-hover:bg-indigo-600/30 flex items-center justify-center transition-all group-hover:scale-110">
                              <Aperture size={26} className="text-indigo-400" />
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-semibold text-white">Open Camera</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">Take a photo now</p>
                            </div>
                          </button>
                        )}

                        {/* Choose from gallery */}
                        <button type="button" onClick={() => fileInputRef.current?.click()}
                          className="flex-1 flex flex-col items-center gap-3 py-6 px-3 rounded-2xl border-2 border-dashed border-slate-600 hover:border-purple-500/60 bg-slate-800/50 hover:bg-purple-600/5 transition-all group cursor-pointer">
                          <div className="w-14 h-14 rounded-2xl bg-purple-600/20 group-hover:bg-purple-600/30 flex items-center justify-center transition-all group-hover:scale-110">
                            <Upload size={26} className="text-purple-400" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-semibold text-white">Gallery</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{hasCameraSupport ? 'Pick existing' : 'Select or drag & drop'}</p>
                          </div>
                        </button>
                      </div>
                      <p className="text-center text-[10px] text-slate-600 mt-4">JPG, PNG up to 10MB · Auto-resized to 1200px</p>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileInput} disabled={uploading} />
                </div>

                {/* Upload form fields */}
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Pose</span>
                      <div className="flex gap-1">
                        {['front', 'side', 'back'].map((p) => (
                          <button key={p} type="button" onClick={() => setPose(p)}
                            className={`flex-1 py-2 text-xs font-semibold rounded-lg capitalize transition-all ${
                              pose === p ? 'bg-indigo-600 text-white' : 'bg-slate-700/60 text-slate-400 hover:text-white'
                            }`}>
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Week</span>
                      <input type="number" min={1} value={weekNumber} onChange={(e) => setWeekNumber(e.target.value)}
                        className="w-full bg-slate-700/60 border border-slate-600/50 rounded-lg px-3 py-2 text-white text-sm text-center" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Notes</span>
                      <input type="text" value={photoNotes} onChange={(e) => setPhotoNotes(e.target.value)} placeholder="Optional"
                        className="w-full bg-slate-700/60 border border-slate-600/50 rounded-lg px-3 py-2 text-white text-sm" />
                    </div>
                  </div>
                  <button type="button" disabled={uploading || !previewFile} onClick={handleUpload}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl px-4 py-3 font-semibold transition-all flex items-center justify-center gap-2">
                    {uploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                    {uploading ? 'Uploading…' : previewFile ? 'Upload Photo' : 'Select an image first'}
                  </button>
                </div>
              </div>
            )}

            {/* ── Compare Panel ── */}
            {showCompare && photos.length >= 2 && (
              <div className="bg-gradient-to-br from-slate-800 to-slate-800/80 border border-slate-700 rounded-2xl p-4 animate-fade-in">
                <div className="flex items-center gap-2 mb-4">
                  <ArrowRightLeft size={16} className="text-purple-400" />
                  <span className="text-sm font-bold text-white">Progress Comparison</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block mb-1.5">Before</span>
                    <div className="relative">
                      <select value={compareLeftId} onChange={(e) => setCompareLeftId(e.target.value)}
                        className="w-full appearance-none bg-slate-700/60 border border-slate-600/50 rounded-xl px-3 py-2 text-white text-xs pr-8">
                        {photos.map((p) => {
                          const id = p._id || p.id;
                          return <option key={id} value={id}>W{p.weekNumber ?? '?'} · {p.pose} · {p.date ? dayjs(p.date).format('MMM D') : ''}</option>;
                        })}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-1.5">After</span>
                    <div className="relative">
                      <select value={compareRightId} onChange={(e) => setCompareRightId(e.target.value)}
                        className="w-full appearance-none bg-slate-700/60 border border-slate-600/50 rounded-xl px-3 py-2 text-white text-xs pr-8">
                        {photos.map((p) => {
                          const id = p._id || p.id;
                          return <option key={id} value={id}>W{p.weekNumber ?? '?'} · {p.pose} · {p.date ? dayjs(p.date).format('MMM D') : ''}</option>;
                        })}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[{ photo: compareLeft, label: 'Before', color: 'purple' }, { photo: compareRight, label: 'After', color: 'indigo' }].map(({ photo, label, color }) => (
                    <div key={label} className="relative rounded-2xl overflow-hidden border border-slate-600/60 bg-black/40 aspect-[3/4] flex items-center justify-center group">
                      {photo?.cloudinaryUrl ? (
                        <>
                          <img src={photo.cloudinaryUrl} alt={label} className="w-full h-full object-cover"
                            onError={(e) => { e.target.style.display = 'none'; }} />
                          <div className="absolute inset-x-0 top-0 p-2 bg-gradient-to-b from-black/60 to-transparent">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${color === 'purple' ? 'text-purple-300' : 'text-indigo-300'}`}>
                              {label}
                            </span>
                            <span className="text-[10px] text-white/70 block">
                              Week {photo.weekNumber ?? '?'} · {photo.pose}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-slate-500">
                          <ImageOff size={20} />
                          <span className="text-[10px]">No image</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Gallery Filter Tabs ── */}
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-slate-500" />
              <div className="flex gap-1.5 flex-1 overflow-x-auto scrollbar-none">
                {POSE_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setGalleryFilter(value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      galleryFilter === value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                    }`}
                  >
                    {label}
                    {poseCounts[value] > 0 && (
                      <span className={`ml-1.5 ${galleryFilter === value ? 'text-indigo-200' : 'text-slate-600'}`}>
                        {poseCounts[value]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Photo Gallery ── */}
            {loadingPhotos ? (
              <div className="flex justify-center py-16 text-slate-400 gap-2">
                <Loader2 className="animate-spin" size={24} />
                <span className="text-sm">Loading photos…</span>
              </div>
            ) : photos.length === 0 ? (
              /* Beautiful empty state */
              <div className="text-center py-16 bg-gradient-to-b from-slate-800/60 to-slate-800/30 rounded-2xl border border-dashed border-slate-700">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-slate-700/40 flex items-center justify-center mb-4">
                  <Camera size={36} className="text-slate-500" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">No progress photos yet</h3>
                <p className="text-sm text-slate-400 max-w-xs mx-auto mb-5">
                  Start documenting your transformation. Capture or upload your first photo.
                </p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  {hasCameraSupport && (
                    <button type="button" onClick={() => { setShowUploadForm(true); setShowCamera(true); }}
                      className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-5 py-2.5 font-semibold text-sm transition-colors">
                      <Aperture size={16} /> Open Camera
                    </button>
                  )}
                  <button type="button" onClick={() => setShowUploadForm(true)}
                    className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 font-semibold text-sm transition-colors ${
                      hasCameraSupport
                        ? 'bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}>
                    <Upload size={16} /> Upload Photo
                  </button>
                </div>
              </div>
            ) : filteredPhotos.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm bg-slate-800/30 rounded-2xl border border-slate-700/50">
                No {galleryFilter} photos yet
              </div>
            ) : (
              <div className="space-y-6">
                {photosByWeek.map(([week, items]) => (
                  <div key={String(week)}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-indigo-600/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-indigo-400">{week === '—' ? '?' : week}</span>
                      </div>
                      <div>
                        <span className="text-sm font-bold text-white">Week {week}</span>
                        <span className="text-xs text-slate-500 ml-2">{items.length} photo{items.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {items.map((p) => {
                        const id = p._id || p.id;
                        const thumb = p.thumbnailUrl || p.cloudinaryUrl;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setModalPhoto(p)}
                            className="relative group rounded-2xl overflow-hidden bg-slate-900 aspect-[3/4] text-left ring-1 ring-slate-700/60 hover:ring-indigo-500/50 transition-all hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-indigo-400"
                          >
                            {thumb ? (
                              <img src={thumb} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling && (e.target.nextElementSibling.style.display = 'flex'); }} />
                            ) : null}
                            <div className={`w-full h-full items-center justify-center text-slate-600 absolute inset-0 ${thumb ? 'hidden' : 'flex'}`}>
                              <ImageOff size={28} />
                            </div>

                            {/* Top badge: pose */}
                            <div className="absolute top-2 left-2">
                              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md backdrop-blur-sm ${POSE_BADGE_STYLES[p.pose] || 'bg-slate-700/80 text-slate-200'}`}>
                                {p.pose}
                              </span>
                            </div>

                            {/* Bottom overlay */}
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8">
                              <div className="flex items-end justify-between gap-1">
                                <div>
                                  <p className="text-[11px] font-semibold text-white leading-tight">
                                    {p.date ? dayjs(p.date).format('MMM D, YYYY') : ''}
                                  </p>
                                  {p.notes && (
                                    <p className="text-[9px] text-white/60 truncate max-w-[120px] mt-0.5">{p.notes}</p>
                                  )}
                                </div>
                                <Maximize2 size={12} className="text-white/40 group-hover:text-white/80 transition-colors shrink-0" />
                              </div>
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
        )}
      </div>

      {/* ═══ LIGHTBOX MODAL ═══ */}
      {modalPhoto && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          onClick={() => setModalPhoto(null)}
        >
          {/* Close button */}
          <button type="button" onClick={() => setModalPhoto(null)}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-all"
            aria-label="Close">
            <X size={20} />
          </button>

          {/* Navigation arrows */}
          {canPrev && (
            <button type="button" onClick={(e) => { e.stopPropagation(); goModalPrev(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all"
              aria-label="Previous photo">
              <ChevronLeft size={22} />
            </button>
          )}
          {canNext && (
            <button type="button" onClick={(e) => { e.stopPropagation(); goModalNext(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all"
              aria-label="Next photo">
              <ChevronRight size={22} />
            </button>
          )}

          <div
            className="relative flex flex-col items-center max-w-3xl w-full mx-4 max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Main image */}
            {modalPhoto.cloudinaryUrl ? (
              <img
                src={modalPhoto.cloudinaryUrl}
                alt={`${modalPhoto.pose} progress`}
                className="w-auto max-w-full max-h-[72vh] object-contain rounded-2xl"
                onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling && (e.target.nextElementSibling.style.display = 'flex'); }}
              />
            ) : null}
            <div className="hidden w-full h-64 items-center justify-center rounded-2xl bg-slate-900/80 text-slate-500 flex-col gap-2">
              <ImageOff size={40} />
              <span className="text-sm">Image could not be loaded</span>
            </div>

            {/* Photo details bar */}
            <div className="w-full mt-3 flex items-center justify-between gap-3 flex-wrap bg-white/5 backdrop-blur-sm rounded-xl px-4 py-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${POSE_BADGE_STYLES[modalPhoto.pose] || 'bg-slate-700/80 text-slate-200'}`}>
                  {modalPhoto.pose}
                </span>
                {modalPhoto.date && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-300">
                    <Calendar size={12} className="text-slate-500" />
                    {dayjs(modalPhoto.date).format('MMM D, YYYY · h:mm A')}
                  </span>
                )}
                {modalPhoto.weekNumber != null && (
                  <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded-md">Week {modalPhoto.weekNumber}</span>
                )}
                {modalPhoto.notes && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                    <StickyNote size={12} /> {modalPhoto.notes}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDeletePhoto(modalPhoto._id || modalPhoto.id)}
                disabled={deletingId}
                className="inline-flex items-center gap-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-300 hover:text-red-200 rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50 transition-colors"
              >
                {deletingId ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
                Delete
              </button>
            </div>

            {/* Photo counter */}
            {flatSorted.length > 1 && modalIndex >= 0 && (
              <span className="text-[10px] text-slate-500 mt-2">
                {modalIndex + 1} / {flatSorted.length}
              </span>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* ═══ CAMERA OVERLAY ═══ */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}
