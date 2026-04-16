import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Flame } from 'lucide-react';

const TIPS = {
  '/dashboard': {
    id: 'dashboard',
    text: 'Tap any workout card to start logging. Your timer and sets save automatically — even if you close the app mid-set!',
    badge: 'POWER MOVE',
  },
  '/nutrition': {
    id: 'nutrition',
    text: 'Tell SamAI "I ate 2 eggs and rice" to auto-log your food with calories. Faster than typing — fuel your gains!',
    badge: 'FUEL TIP',
  },
  '/progress': {
    id: 'progress',
    text: 'Log your weight regularly to see your transformation unfold. Switch tabs for volume and muscle hit tracking.',
    badge: 'TRACK IT',
  },
  '/analytics': {
    id: 'analytics',
    text: 'The muscle balance radar reveals weak spots. Check weekly trends to optimize your split for maximum hypertrophy.',
    badge: 'SMART GAINS',
  },
  '/body-tracker': {
    id: 'body-tracker',
    text: 'Use the camera to snap progress photos right in-app. Compare before/after side by side — your visual proof!',
    badge: 'TRANSFORM',
  },
  '/diet-plan': {
    id: 'diet-plan',
    text: 'Your meal plan adapts to your goal and calorie target. Update your profile to recalculate recommendations.',
    badge: 'EAT BIG',
  },
  '/health-recovery': {
    id: 'health-recovery',
    text: 'Recovery is where muscles grow. Log sleep and soreness to prevent overtraining. Try guided stretch routines!',
    badge: 'RECOVER',
  },
  '/achievements': {
    id: 'achievements',
    text: 'Badges unlock automatically when you hit milestones. Train consistently to climb from Bronze to Platinum!',
    badge: 'EARN IT',
  },
  '/profile': {
    id: 'profile',
    text: 'Pair with workout buddies using invite codes! Customize your split, schedule, and push notification preferences.',
    badge: 'SQUAD UP',
  },
  '/leaderboard': {
    id: 'leaderboard',
    text: 'Opt-in from Profile to appear on leaderboards. Compete in streak, volume, and consistency — dominate the gym!',
    badge: 'COMPETE',
  },
};

const SEEN_KEY = 'ft_tips_seen';

function getSeenTips() {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')); } catch { return new Set(); }
}

function markSeen(id) {
  const seen = getSeenTips();
  seen.add(id);
  localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
}

export default function ContextualTip({ pathname }) {
  const [show, setShow] = useState(false);
  const [tip, setTip] = useState(null);

  useEffect(() => {
    const matched = TIPS[pathname];
    if (!matched) { setShow(false); return; }
    const seen = getSeenTips();
    if (seen.has(matched.id)) { setShow(false); return; }

    const timer = setTimeout(() => {
      setTip(matched);
      setShow(true);
    }, 800);
    return () => clearTimeout(timer);
  }, [pathname]);

  const dismiss = () => {
    if (tip) markSeen(tip.id);
    setShow(false);
  };

  useEffect(() => {
    if (!show) return;
    const auto = setTimeout(dismiss, 8000);
    return () => clearTimeout(auto);
  }, [show]);

  return (
    <AnimatePresence>
      {show && tip && (
        <motion.div
          initial={{ y: 80, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed bottom-20 lg:bottom-6 left-3 right-3 lg:left-auto lg:right-6 lg:max-w-sm z-[9990] pointer-events-auto"
        >
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800/95 to-slate-900 backdrop-blur-xl border border-red-500/20 rounded-2xl p-4 shadow-2xl shadow-red-500/5">
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500 via-orange-500 to-amber-500" />

            <div className="flex items-start gap-3">
              <motion.div
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center shrink-0 shadow-lg shadow-red-500/20"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Flame size={18} className="text-white" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[9px] font-black text-red-400 uppercase tracking-[0.2em]">{tip.badge}</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{tip.text}</p>
              </div>
              <button
                onClick={dismiss}
                className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all shrink-0"
              >
                <X size={14} />
              </button>
            </div>

            {/* Auto-dismiss progress bar */}
            <motion.div
              className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-red-500 to-orange-500"
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 8, ease: 'linear' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
