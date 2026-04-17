import { useState, useRef, useEffect } from 'react';
import { Bell, Droplets, Flame, Dumbbell, Beef, X, CheckCheck, Trash2, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const TYPE_META = {
  water:    { icon: Droplets, color: 'text-blue-400',    bg: 'bg-blue-500/20' },
  calories: { icon: Flame,    color: 'text-amber-400',   bg: 'bg-amber-500/20' },
  workout:  { icon: Dumbbell, color: 'text-indigo-400',  bg: 'bg-indigo-500/20' },
  protein:  { icon: Beef,     color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  info:     { icon: Info,     color: 'text-sky-400',     bg: 'bg-sky-500/20' },
};

export default function NotificationCenter({ variant = 'desktop' }) {
  const { notifications, unreadCount, markAllRead, markRead, dismissNotification, clearNotifications } = useApp();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [open]);

  const handleOpen = () => {
    setOpen((v) => !v);
  };

  const handleNotificationClick = (n) => {
    if (!n.read) markRead(n.id);
  };

  const bellBtn = (
    <button
      onClick={handleOpen}
      className={`relative flex items-center justify-center rounded-xl transition-all duration-200 touch-manipulation ${
        variant === 'desktop'
          ? 'w-full gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-700/60 font-medium text-sm'
          : 'w-10 h-10'
      }`}
    >
      <Bell size={variant === 'desktop' ? 18 : 20} className={variant !== 'desktop' ? 'text-slate-400' : ''} />
      {variant === 'desktop' && <span className="flex-1 text-left">Notifications</span>}
      {unreadCount > 0 && (
        <span className={`absolute flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full min-w-[18px] h-[18px] px-1 ${
          variant === 'desktop' ? 'top-2 right-3' : '-top-0.5 -right-0.5'
        }`}>
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );

  const panel = open && (
    <div
      ref={panelRef}
      className={`z-[100] bg-slate-800 border border-slate-700 shadow-2xl shadow-black/50 flex flex-col overflow-hidden ${
        variant === 'desktop'
          ? 'absolute left-full top-0 ml-2 w-80 max-h-[460px] rounded-2xl'
          : 'fixed inset-x-0 bottom-0 max-h-[75vh] rounded-t-2xl sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:inset-x-auto sm:w-80 sm:max-h-[460px] sm:rounded-2xl sm:bottom-auto'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 shrink-0">
        <h3 className="font-bold text-white text-sm">
          Notifications
          {unreadCount > 0 && (
            <span className="ml-2 text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-bold">
              {unreadCount} new
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors" title="Mark all read">
              <CheckCheck size={14} />
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={clearNotifications} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors" title="Clear all">
              <Trash2 size={14} />
            </button>
          )}
          <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors lg:hidden">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Bell size={28} className="mb-2 opacity-40" />
            <p className="text-sm font-medium">All caught up!</p>
            <p className="text-xs mt-1 text-slate-600">Reminders for water, calories & workouts will appear here</p>
          </div>
        ) : (
          notifications.map((n) => {
            const meta = TYPE_META[n.type] || TYPE_META.info;
            const Icon = meta.icon;
            return (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`flex items-start gap-3 px-4 py-3 border-b border-slate-700/50 cursor-pointer transition-colors group ${
                  !n.read ? 'bg-slate-700/20 hover:bg-slate-700/30' : 'hover:bg-slate-800/50'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.bg}`}>
                  <Icon size={16} className={meta.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${!n.read ? 'text-white font-medium' : 'text-slate-300'}`}>{n.message}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{dayjs(n.timestamp).fromNow()}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!n.read && <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5" />}
                  <button
                    onClick={(e) => { e.stopPropagation(); dismissNotification(n.id); }}
                    className="p-1 rounded-md text-slate-600 hover:text-red-400 hover:bg-slate-700/50 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Dismiss"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div className="relative">
      {bellBtn}
      {panel}
    </div>
  );
}
