import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import dayjs from 'dayjs';
import {
  Copy,
  Download,
  Dumbbell,
  Flame,
  Trophy,
  X,
  Zap,
} from 'lucide-react';

const CANVAS_SIZE = 1080;

function getFirstName(name) {
  if (!name || typeof name !== 'string') return 'Athlete';
  const t = name.trim();
  return t.split(/\s+/)[0] || 'Athlete';
}

function formatStat(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value.toLocaleString();
  }
  return String(value);
}

/**
 * Draws the share image on a 1080×1080 canvas (Instagram-ready).
 * @param {object} stats — same shape as ShareCard props.stats
 * @returns {HTMLCanvasElement}
 */
function drawShareCardToCanvas(stats) {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const first = getFirstName(stats?.name);
  const dateStr = dayjs().format('MMMM D, YYYY');
  const streak = formatStat(stats?.streak);
  const totalWorkouts = formatStat(stats?.totalWorkouts);
  const todayWorkout = formatStat(stats?.todayWorkout);
  const volume = formatStat(stats?.totalVolume);
  const cw = formatStat(stats?.currentWeight);
  const tw = formatStat(stats?.targetWeight);

  // Background gradient (indigo-900 → slate-900 → slate-800)
  const bg = ctx.createLinearGradient(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  bg.addColorStop(0, '#312e81');
  bg.addColorStop(0.45, '#0f172a');
  bg.addColorStop(1, '#1e293b');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  const pad = 72;
  const contentW = CANVAS_SIZE - pad * 2;
  let y = pad + 24;

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // FitTrack branding
  ctx.fillStyle = '#a5b4fc';
  ctx.font = '600 38px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText('FitTrack', pad, y);
  y += 52;

  ctx.fillStyle = '#f8fafc';
  ctx.font = '700 64px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText(first, pad, y);
  y += 96;

  const statRows = [
    { label: 'Streak', value: `${streak} days`, sub: 'Keep it going' },
    { label: 'Total workouts', value: totalWorkouts, sub: 'All-time sessions' },
    { label: "Today's workout", value: todayWorkout, sub: 'Latest session' },
    { label: 'Volume', value: volume, sub: 'Total load moved' },
  ];

  const colGap = 48;
  const colW = (contentW - colGap) / 2;
  let rowY = y;

  const drawStatBox = (x, boxY, label, value, sub) => {
    ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.beginPath();
    const r = 20;
    const bw = colW;
    const bh = 168;
    ctx.moveTo(x + r, boxY);
    ctx.arcTo(x + bw, boxY, x + bw, boxY + bh, r);
    ctx.arcTo(x + bw, boxY + bh, x, boxY + bh, r);
    ctx.arcTo(x, boxY + bh, x, boxY, r);
    ctx.arcTo(x, boxY, x + bw, boxY, r);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 22px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText(label, x + 28, boxY + 22);

    ctx.fillStyle = '#f1f5f9';
    ctx.font = '700 36px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    const valueStr = String(value);
    const maxValW = bw - 56;
    let fontSize = 36;
    while (ctx.measureText(valueStr).width > maxValW && fontSize > 20) {
      fontSize -= 1;
      ctx.font = `700 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    }
    ctx.fillText(valueStr, x + 28, boxY + 58);

    ctx.fillStyle = '#64748b';
    ctx.font = '500 18px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText(sub, x + 28, boxY + 124);
  };

  for (let i = 0; i < statRows.length; i += 1) {
    const row = statRows[i];
    const c = i % 2;
    const r = Math.floor(i / 2);
    const bx = pad + c * (colW + colGap);
    const by = rowY + r * (168 + 28);
    drawStatBox(bx, by, row.label, row.value, row.sub);
  }

  rowY += 2 * (168 + 28) + 8;

  // Weight row (optional visual block)
  ctx.fillStyle = 'rgba(99, 102, 241, 0.25)';
  ctx.beginPath();
  {
    const rx = pad;
    const ry = rowY;
    const rw = contentW;
    const rh = 88;
    const r = 16;
    ctx.moveTo(rx + r, ry);
    ctx.arcTo(rx + rw, ry, rx + rw, ry + rh, r);
    ctx.arcTo(rx + rw, ry + rh, rx, ry + rh, r);
    ctx.arcTo(rx, ry + rh, rx, ry, r);
    ctx.arcTo(rx, ry, rx + rw, ry, r);
    ctx.closePath();
  }
  ctx.fill();

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '600 24px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText(`Current weight  ${cw}   ·   Target  ${tw}`, pad + 28, rowY + 28);

  const bottomY = CANVAS_SIZE - pad - 120;

  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 26px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText(dateStr, pad, bottomY);

  ctx.globalAlpha = 0.45;
  ctx.fillStyle = '#64748b';
  ctx.font = '600 22px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText('FitTrack Bodybuilder Pro', pad, bottomY + 44);
  ctx.globalAlpha = 1;

  return canvas;
}

function canvasToBlob(canvas, type = 'image/png', quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Could not create image blob'));
      },
      type,
      quality
    );
  });
}

/**
 * @param {object} props
 * @param {object} props.stats
 * @param {string} [props.stats.name]
 * @param {number} [props.stats.streak]
 * @param {number} [props.stats.totalWorkouts]
 * @param {string|number} [props.stats.todayWorkout]
 * @param {number} [props.stats.totalVolume]
 * @param {number|string} [props.stats.currentWeight]
 * @param {number|string} [props.stats.targetWeight]
 * @param {() => void} props.onClose
 */
export default function ShareCard({ stats, onClose }) {
  const cardRef = useRef(null);
  const [feedback, setFeedback] = useState(null);
  const [busy, setBusy] = useState(false);

  const safeStats = useMemo(
    () => (stats && typeof stats === 'object' ? stats : {}),
    [stats]
  );

  useEffect(() => {
    const handle = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [onClose]);

  const runWithCanvas = useCallback(
    async (fn) => {
      setBusy(true);
      setFeedback(null);
      try {
        const canvas = drawShareCardToCanvas(safeStats);
        await fn(canvas);
      } catch (err) {
        setFeedback(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setBusy(false);
      }
    },
    [safeStats]
  );

  const handleDownload = () => {
    runWithCanvas(async (canvas) => {
      const blob = await canvasToBlob(canvas);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fittrack-share-${dayjs().format('YYYY-MM-DD')}.png`;
      a.click();
      URL.revokeObjectURL(url);
      setFeedback('Image downloaded');
    });
  };

  const handleCopy = () => {
    runWithCanvas(async (canvas) => {
      const blob = await canvasToBlob(canvas);
      if (!navigator.clipboard || !window.ClipboardItem) {
        setFeedback('Clipboard image copy is not supported in this browser');
        return;
      }
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      setFeedback('Copied image to clipboard');
    });
  };

  const first = getFirstName(safeStats.name);
  const dateLabel = dayjs().format('MMMM D, YYYY');

  const statTiles = [
    {
      icon: Flame,
      label: 'Streak',
      value: `${formatStat(safeStats.streak)} days`,
    },
    {
      icon: Trophy,
      label: 'Total workouts',
      value: formatStat(safeStats.totalWorkouts),
    },
    {
      icon: Zap,
      label: "Today's workout",
      value: formatStat(safeStats.todayWorkout),
    },
    {
      icon: Dumbbell,
      label: 'Volume',
      value: formatStat(safeStats.totalVolume),
    },
  ];

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-card-title"
    >
      <div className="relative w-full max-w-md">
        <button
          type="button"
          onClick={onClose}
          className="absolute -right-1 -top-1 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-slate-800/90 text-slate-200 shadow-lg ring-1 ring-white/10 transition hover:bg-slate-700 hover:text-white"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div
          ref={cardRef}
          className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-800 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl ring-1 ring-white/10"
        >
          <p id="share-card-title" className="text-sm font-semibold tracking-wide text-indigo-300">
            FitTrack
          </p>
          <h2 className="mt-1 text-3xl font-bold text-white">{first}</h2>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {statTiles.map((tile) => {
              const StatIcon = tile.icon;
              return (
              <div
                key={tile.label}
                className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm"
              >
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <StatIcon className="h-3.5 w-3.5 text-indigo-400" aria-hidden />
                  {tile.label}
                </div>
                <p className="mt-2 break-words text-lg font-bold leading-snug text-slate-50">
                  {tile.value}
                </p>
              </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-xl border border-indigo-500/20 bg-indigo-950/40 px-4 py-3 text-sm text-slate-300">
            <span className="text-slate-400">Weight</span>{' '}
            <span className="font-semibold text-white">{formatStat(safeStats.currentWeight)}</span>
            <span className="mx-2 text-slate-500">→</span>
            <span className="text-slate-400">Target</span>{' '}
            <span className="font-semibold text-indigo-200">
              {formatStat(safeStats.targetWeight)}
            </span>
          </div>

          <p className="mt-5 text-center text-sm text-slate-400">{dateLabel}</p>
          <p className="mt-2 text-center text-xs font-medium text-slate-500/90">
            FitTrack Bodybuilder Pro
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            disabled={busy}
            onClick={handleDownload}
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-xl px-4 py-2.5 font-semibold shadow-lg shadow-indigo-900/40 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            Download as PNG
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handleCopy}
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-xl px-4 py-2.5 font-semibold shadow-lg shadow-indigo-900/40 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Copy className="h-4 w-4" />
            Copy to Clipboard
          </button>
        </div>

        {feedback ? (
          <p className="mt-3 text-center text-sm text-slate-300">{feedback}</p>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
