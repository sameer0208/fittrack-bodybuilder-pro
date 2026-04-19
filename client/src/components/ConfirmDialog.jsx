import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, CheckCircle2, LogOut, RotateCcw, X } from 'lucide-react';

const VARIANTS = {
  danger: {
    icon: Trash2,
    iconBg: 'bg-red-500/10 border-red-500/20',
    iconColor: 'text-red-400',
    confirmBg: 'bg-red-500 hover:bg-red-600 active:bg-red-700',
    accentLine: 'via-red-500/30',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-500/10 border-amber-500/20',
    iconColor: 'text-amber-400',
    confirmBg: 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700',
    accentLine: 'via-amber-500/30',
  },
  success: {
    icon: CheckCircle2,
    iconBg: 'bg-emerald-500/10 border-emerald-500/20',
    iconColor: 'text-emerald-400',
    confirmBg: 'bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700',
    accentLine: 'via-emerald-500/30',
  },
  logout: {
    icon: LogOut,
    iconBg: 'bg-slate-500/10 border-slate-500/20',
    iconColor: 'text-slate-400',
    confirmBg: 'bg-slate-600 hover:bg-slate-500 active:bg-slate-400',
    accentLine: 'via-slate-500/30',
  },
  reset: {
    icon: RotateCcw,
    iconBg: 'bg-orange-500/10 border-orange-500/20',
    iconColor: 'text-orange-400',
    confirmBg: 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700',
    accentLine: 'via-orange-500/30',
  },
};

export default function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title = 'Are you sure?',
  message = '',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  icon: CustomIcon,
}) {
  const overlayRef = useRef(null);
  const v = VARIANTS[variant] || VARIANTS.danger;
  const Icon = CustomIcon || v.icon;

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onCancel(); }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-sm rounded-2xl border border-slate-700/40 overflow-hidden"
        style={{ background: '#0f1420', animation: 'confirmEnter 0.2s ease-out' }}
      >
        <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent ${v.accentLine} to-transparent`} />

        <button
          onClick={onCancel}
          className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-slate-800/60 border border-slate-700/30 flex items-center justify-center text-slate-500 hover:text-white transition-colors z-10"
        >
          <X size={13} />
        </button>

        <div className="px-5 pt-6 pb-5 flex flex-col items-center text-center">
          <div className={`w-12 h-12 rounded-xl ${v.iconBg} border flex items-center justify-center mb-4`}>
            <Icon size={22} className={v.iconColor} />
          </div>

          <h3 className="text-base font-black text-white mb-1.5">{title}</h3>
          {message && <p className="text-xs text-slate-400 leading-relaxed max-w-[280px]">{message}</p>}
        </div>

        <div className="px-5 pb-5 flex gap-2.5">
          <button
            onClick={onCancel}
            className="flex-1 h-10 rounded-xl bg-slate-800/60 border border-slate-700/30 text-sm font-bold text-slate-300 hover:text-white transition-all active:scale-95"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 h-10 rounded-xl ${v.confirmBg} text-sm font-bold text-white transition-all active:scale-95 shadow-lg`}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes confirmEnter {
          from { opacity: 0; transform: scale(0.92) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>,
    document.body
  );
}
