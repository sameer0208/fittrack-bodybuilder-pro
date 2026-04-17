import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import {
  Dumbbell, UtensilsCrossed, Droplets, Users, Trophy,
  Calendar, BarChart3, Camera, Heart, Zap, Target, Flame,
  ChevronRight, ArrowLeft, Sparkles, Star, BookOpen,
  Ruler, TrendingUp, Bot, Clock, Crown,
  ChevronDown, Rocket, Activity, Wind, Shield, HeartPulse, Pill,
} from 'lucide-react';

/* ─────────────────────── Motivational Quotes ─────────────────────── */
const QUOTES = [
  { text: 'The only bad workout is the one that didn\'t happen.', author: 'Unknown' },
  { text: 'Your body can stand almost anything. It\'s your mind that you have to convince.', author: 'Unknown' },
  { text: 'The pain you feel today will be the strength you feel tomorrow.', author: 'Arnold Schwarzenegger' },
  { text: 'Don\'t count the days, make the days count.', author: 'Muhammad Ali' },
  { text: 'Success isn\'t given. It\'s earned. On the track, on the field, in the gym.', author: 'Unknown' },
  { text: 'No pain, no gain. Shut up and train.', author: 'Unknown' },
];

/* ─────────────────────── Features Data ─────────────────────── */
const FEATURES = [
  {
    id: 'workouts',
    icon: Dumbbell,
    title: 'Smart Workout Tracker',
    tagline: 'Log sets, reps & weight — watch your progress explode',
    description: 'Full workout logging with customizable exercises, extra sets, auto-timer, and rest alerts. Every rep counts, every set is tracked.',
    highlights: ['Auto rest timer with sound alerts', 'Add/remove exercises freely', 'Track weight, reps & completion', 'Save drafts & continue later'],
    color: 'from-red-600 to-orange-500',
    glow: 'shadow-red-500/20',
    accent: 'text-red-400',
    ring: 'ring-red-500/30',
    link: '/dashboard',
  },
  {
    id: 'nutrition',
    icon: UtensilsCrossed,
    title: 'Nutrition Logger',
    tagline: 'Fuel your gains — track every macro with precision',
    description: 'Log meals across 6 categories, search from 500+ foods including Indian cuisine, track calories, protein, carbs & fat in real time.',
    highlights: ['500+ food database', '6 meal categories', 'Auto calorie & macro calculation', '7-day history & trends'],
    color: 'from-emerald-500 to-green-400',
    glow: 'shadow-emerald-500/20',
    accent: 'text-emerald-400',
    ring: 'ring-emerald-500/30',
    link: '/nutrition',
  },
  {
    id: 'water',
    icon: Droplets,
    title: 'Hydration Tracker',
    tagline: 'Stay hydrated, stay powerful',
    description: 'Track water intake with quick-add buttons. Personalized goals based on your body weight. Smart reminders keep you on track.',
    highlights: ['Quick-add preset amounts', 'Weight-based daily goals', 'Visual progress ring', 'Smart hydration reminders'],
    color: 'from-cyan-500 to-blue-400',
    glow: 'shadow-cyan-500/20',
    accent: 'text-cyan-400',
    ring: 'ring-cyan-500/30',
    link: '/nutrition',
  },
  {
    id: 'samai',
    icon: Bot,
    title: 'SamAI — Your AI Coach',
    tagline: 'Ask anything about fitness, nutrition & health',
    description: 'Powered by Google Gemini AI. Get personalized advice, log food by voice, and ask any fitness question. Your 24/7 smart training partner.',
    highlights: ['Voice-powered food logging', 'Personalized fitness advice', 'Nutrition analysis & tips', 'Available 24/7, always learning'],
    color: 'from-purple-500 to-fuchsia-500',
    glow: 'shadow-purple-500/20',
    accent: 'text-purple-400',
    ring: 'ring-purple-500/30',
    link: '/dashboard',
  },
  {
    id: 'timer',
    icon: Clock,
    title: 'Smart Rest Timer',
    tagline: 'Never lose track between sets',
    description: 'Configurable rest timer (30s–180s) auto-triggers after completing a set. Sound alerts and vibration let you know when rest is over.',
    highlights: ['Auto-starts after set completion', 'Configurable per exercise', '3-second ring alert + vibration', 'Pause, reset & adjust on the fly'],
    color: 'from-amber-500 to-orange-400',
    glow: 'shadow-amber-500/20',
    accent: 'text-amber-400',
    ring: 'ring-amber-500/30',
    link: '/dashboard',
  },
  {
    id: 'calendar',
    icon: Calendar,
    title: 'Workout Calendar',
    tagline: 'Build streaks. Build discipline.',
    description: 'Visual monthly calendar showing completed workout days. Navigate months, tap dates for details. See your consistency at a glance.',
    highlights: ['Monthly completion overview', 'Red cross on completed days', 'Navigate between months', 'Tap dates for workout details'],
    color: 'from-rose-500 to-red-500',
    glow: 'shadow-rose-500/20',
    accent: 'text-rose-400',
    ring: 'ring-rose-500/30',
    link: '/dashboard',
  },
  {
    id: 'challenges',
    icon: Zap,
    title: 'Daily Challenges',
    tagline: 'Daily missions to keep you unstoppable',
    description: 'Fresh challenges every day targeting workouts, nutrition, and hydration. Earn XP, level up, and unlock rewards. Streak your way to the top.',
    highlights: ['New challenges daily', 'XP & leveling system', 'Auto-detection + manual check', 'Undo accidental completions'],
    color: 'from-yellow-500 to-amber-400',
    glow: 'shadow-yellow-500/20',
    accent: 'text-yellow-400',
    ring: 'ring-yellow-500/30',
    link: '/dashboard',
  },
  {
    id: 'buddy',
    icon: Users,
    title: 'Buddy System',
    tagline: 'Train together, push each other',
    description: 'Pair with friends via invite codes. See their activity, send nudges, chat in real-time, and compete in weekly challenges.',
    highlights: ['Pair with multiple buddies', 'Real-time chat with content filter', 'Weekly workout challenges', 'Activity feed & nudges'],
    color: 'from-pink-500 to-rose-500',
    glow: 'shadow-pink-500/20',
    accent: 'text-pink-400',
    ring: 'ring-pink-500/30',
    link: '/profile',
  },
  {
    id: 'body',
    icon: Camera,
    title: 'Body Tracker & Photos',
    tagline: 'See your transformation unfold',
    description: 'Log body measurements, take progress photos with your camera, compare before/after shots side by side. Your visual proof of progress.',
    highlights: ['In-app camera capture', 'Before/after comparison', 'Body measurements tracking', 'Photo gallery with filters'],
    color: 'from-violet-500 to-purple-500',
    glow: 'shadow-violet-500/20',
    accent: 'text-violet-400',
    ring: 'ring-violet-500/30',
    link: '/body-tracker',
  },
  {
    id: 'analytics',
    icon: BarChart3,
    title: 'Analytics Dashboard',
    tagline: 'Data-driven gains — see what\'s working',
    description: 'Deep insights into your training: volume trends, muscle balance radar, consistency scores, and weekly performance breakdowns.',
    highlights: ['Volume & strength trends', 'Muscle balance radar chart', 'Weekly consistency scoring', 'Progress visualization'],
    color: 'from-blue-500 to-indigo-500',
    glow: 'shadow-blue-500/20',
    accent: 'text-blue-400',
    ring: 'ring-blue-500/30',
    link: '/analytics',
  },
  {
    id: 'progress',
    icon: TrendingUp,
    title: 'Progress Tracking',
    tagline: 'Watch the numbers climb, week after week',
    description: 'Track weight changes, total volume lifted, and workout frequency over time with beautiful interactive charts.',
    highlights: ['Weight progress chart', 'Volume tracking over weeks', 'Muscle group hit map', 'Workout history log'],
    color: 'from-teal-500 to-emerald-500',
    glow: 'shadow-teal-500/20',
    accent: 'text-teal-400',
    ring: 'ring-teal-500/30',
    link: '/progress',
  },
  {
    id: 'diet',
    icon: Target,
    title: 'Personalized Diet Plan',
    tagline: 'Nutrition tailored to YOUR goals',
    description: 'AI-generated meal plans based on your weight, goal (bulk/cut/maintain), and calorie targets. Meal ideas for every time of day.',
    highlights: ['Goal-specific meal plans', 'Calorie & macro targets', 'Meal ideas per category', 'Adjusts to your profile'],
    color: 'from-lime-500 to-green-500',
    glow: 'shadow-lime-500/20',
    accent: 'text-lime-400',
    ring: 'ring-lime-500/30',
    link: '/diet-plan',
  },
  {
    id: 'health',
    icon: Heart,
    title: 'Health & Recovery',
    tagline: 'Recover smarter, train harder',
    description: 'Log sleep, mood, and soreness. Access guided stretching routines. Track your recovery to prevent overtraining.',
    highlights: ['Sleep quality logging', 'Mood & soreness tracking', 'Guided stretch routines', 'Recovery trend charts'],
    color: 'from-rose-500 to-pink-500',
    glow: 'shadow-rose-500/20',
    accent: 'text-rose-400',
    ring: 'ring-rose-500/30',
    link: '/health-recovery',
  },
  {
    id: 'insights',
    icon: Activity,
    title: 'Health Insights',
    tagline: 'Your body\'s intelligence dashboard',
    description: 'Recovery readiness score, overtraining detection, body composition analysis, vitals tracking, injury management, breathing exercises, meal timing, posture assessment, and supplement tracking — all powered by your existing data.',
    highlights: ['Recovery Readiness Score (0-100)', 'Overtraining detection with ACWR', 'Body fat %, FFMI & composition', 'Heart rate & BP tracking'],
    color: 'from-emerald-500 to-teal-400',
    glow: 'shadow-emerald-500/20',
    accent: 'text-emerald-400',
    ring: 'ring-emerald-500/30',
    link: '/health-insights',
  },
  {
    id: 'injury',
    icon: Shield,
    title: 'Injury & Pain Tracker',
    tagline: 'Stay safe, train smart',
    description: 'Log injuries by body part, track severity and pain type, monitor recovery status. Get alerts when exercises might aggravate your injuries.',
    highlights: ['Track any body part injury', 'Severity & pain type logging', 'Recovery status management', 'Historical injury trends'],
    color: 'from-orange-500 to-amber-500',
    glow: 'shadow-orange-500/20',
    accent: 'text-orange-400',
    ring: 'ring-orange-500/30',
    link: '/health-insights',
  },
  {
    id: 'breathing',
    icon: Wind,
    title: 'Breathing Exercises',
    tagline: 'Breathe your way to better performance',
    description: 'Guided breathing techniques including Box Breathing, 4-7-8 Relaxation, Power Breathing, and Wim Hof Method. Animated visual guide with round tracking.',
    highlights: ['5 scientifically-backed techniques', 'Animated breathing circle guide', 'Pre-workout & recovery modes', 'Round counter & pause controls'],
    color: 'from-cyan-500 to-blue-500',
    glow: 'shadow-cyan-500/20',
    accent: 'text-cyan-400',
    ring: 'ring-cyan-500/30',
    link: '/health-insights',
  },
  {
    id: 'vitals',
    icon: HeartPulse,
    title: 'Camera Heart Rate + Vitals',
    tagline: 'Measure your pulse — no wearable needed',
    description: 'Place your finger on the camera to measure your heart rate using photoplethysmography (PPG). Live ECG waveform, real-time BPM, and automatic anomaly detection. Plus daily blood pressure logging.',
    highlights: ['Camera-based heart rate scanning', 'Live ECG waveform visualization', 'Automatic anomaly alerts', 'Blood pressure tracking & trends'],
    color: 'from-rose-600 to-red-500',
    glow: 'shadow-rose-500/20',
    accent: 'text-rose-400',
    ring: 'ring-rose-500/30',
    link: '/health-insights',
  },
  {
    id: 'supplements',
    icon: Pill,
    title: 'Supplement Tracker',
    tagline: 'Never miss a dose again',
    description: 'Daily supplement checklist with compliance tracking. Pre-loaded with common gym supplements. Add custom supplements and track your consistency over time.',
    highlights: ['One-tap daily checklist', 'Custom supplement support', 'Weekly compliance charts', 'Pre-loaded gym essentials'],
    color: 'from-violet-500 to-purple-500',
    glow: 'shadow-violet-500/20',
    accent: 'text-violet-400',
    ring: 'ring-violet-500/30',
    link: '/health-insights',
  },
  {
    id: 'biometrics',
    icon: HeartPulse,
    title: 'Biometric Scanner & Dashboard',
    tagline: 'One scan. Five vital metrics. Complete health picture.',
    description: 'Place your finger on the camera for 30 seconds to measure Heart Rate, HRV (RMSSD/SDNN/pNN50), Blood Oxygen (SpO2), Respiratory Rate, and Stress Level. View trends, a wellness radar chart, AI-generated insights, and correlations with your sleep and mood data.',
    highlights: ['HRV analysis (RMSSD, SDNN, pNN50, LF/HF)', 'SpO2 blood oxygen estimation', 'Respiratory rate from PPG waveform', 'Stress index with autonomic scoring', 'Wellness radar & trend charts', '7-day / 30-day comparative reports'],
    color: 'from-rose-600 to-red-500',
    glow: 'shadow-rose-500/20',
    accent: 'text-rose-400',
    ring: 'ring-rose-500/30',
    link: '/biometrics',
  },
  {
    id: 'achievements',
    icon: Trophy,
    title: 'Achievements & Badges',
    tagline: 'Earn badges. Flex your dedication.',
    description: 'Unlock achievements for milestones: first workout, streak records, volume PRs, and more. Collect them all and show off your progress.',
    highlights: ['20+ unique badges', 'Automatic milestone detection', 'Bronze to Platinum tiers', 'Goal-aware badge system'],
    color: 'from-amber-500 to-yellow-400',
    glow: 'shadow-amber-500/20',
    accent: 'text-amber-400',
    ring: 'ring-amber-500/30',
    link: '/achievements',
  },
  {
    id: 'leaderboard',
    icon: Crown,
    title: 'Leaderboard',
    tagline: 'Compete. Climb. Conquer.',
    description: 'See how you stack up against the community. Leaderboards for streak, total volume, and consistency. Opt in to compete.',
    highlights: ['Streak leaderboard', 'Volume leaderboard', 'Consistency leaderboard', 'Opt-in privacy control'],
    color: 'from-orange-500 to-red-500',
    glow: 'shadow-orange-500/20',
    accent: 'text-orange-400',
    ring: 'ring-orange-500/30',
    link: '/leaderboard',
  },
];

/* ─────────────────────── Animated Counter ─────────────────────── */
function AnimatedCounter({ value, suffix = '', duration = 2 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);
  const numVal = parseInt(value) || 0;

  useEffect(() => {
    if (!isInView || numVal === 0) return;
    let start = 0;
    const step = Math.ceil(numVal / (duration * 60));
    const interval = setInterval(() => {
      start += step;
      if (start >= numVal) { start = numVal; clearInterval(interval); }
      setDisplay(start);
    }, 1000 / 60);
    return () => clearInterval(interval);
  }, [isInView, numVal, duration]);

  return <span ref={ref}>{isInView ? display : 0}{suffix}</span>;
}

/* ─────────────────────── Pulsing Energy Ring ─────────────────────── */
function EnergyRing({ size = 200, color = '#ef4444', delay = 0 }) {
  return (
    <motion.div
      className="absolute rounded-full border-2 opacity-0"
      style={{
        width: size,
        height: size,
        borderColor: color,
        left: '50%',
        top: '50%',
        x: '-50%',
        y: '-50%',
      }}
      animate={{
        scale: [0.5, 1.5],
        opacity: [0.6, 0],
      }}
      transition={{
        duration: 3,
        delay,
        repeat: Infinity,
        ease: 'easeOut',
      }}
    />
  );
}

/* ─────────────────────── Heartbeat Line ─────────────────────── */
function HeartbeatLine() {
  return (
    <div className="relative w-full h-12 overflow-hidden opacity-30">
      <svg viewBox="0 0 600 40" className="w-full h-full" preserveAspectRatio="none">
        <motion.path
          d="M0,20 L120,20 L140,5 L160,35 L180,10 L200,30 L220,20 L400,20 L420,5 L440,35 L460,10 L480,30 L500,20 L600,20"
          fill="none"
          stroke="url(#heartGrad)"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, ease: 'easeInOut' }}
        />
        <defs>
          <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0" />
            <stop offset="30%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#f97316" />
            <stop offset="70%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      <motion.div
        className="absolute top-0 left-0 w-20 h-full bg-gradient-to-r from-transparent via-red-500/40 to-transparent"
        animate={{ x: ['-80px', '700px'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

/* ─────────────────────── Motivational Banner ─────────────────────── */
function MotivationalBanner({ index }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const quote = QUOTES[index % QUOTES.length];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="relative py-10 sm:py-14 my-4"
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-40 h-40 rounded-full bg-red-500/5 blur-3xl" />
      </div>
      <div className="relative text-center px-6">
        <motion.div
          className="text-6xl sm:text-8xl font-black text-white/[0.03] absolute inset-0 flex items-center justify-center select-none pointer-events-none"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={isInView ? { scale: 1, opacity: 1 } : {}}
          transition={{ duration: 1, delay: 0.2 }}
        >
          GRIND
        </motion.div>
        <Flame size={24} className="mx-auto text-red-500 mb-3" />
        <p className="text-lg sm:text-xl font-bold text-white/90 italic max-w-lg mx-auto leading-relaxed">
          &ldquo;{quote.text}&rdquo;
        </p>
        <p className="text-xs text-red-400/70 font-semibold mt-2 uppercase tracking-wider">— {quote.author}</p>
      </div>
    </motion.div>
  );
}

/* ─────────────────────── Feature Card ─────────────────────── */
function FeatureCard({ feature, index }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const Icon = feature.icon;
  const navigate = useNavigate();
  const isEven = index % 2 === 0;
  const num = String(index + 1).padStart(2, '0');

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: isEven ? -80 : 80, rotateY: isEven ? -8 : 8 }}
      animate={isInView ? { opacity: 1, x: 0, rotateY: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="group perspective-1000"
    >
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-slate-900/80 border border-slate-700/40 hover:border-slate-600/60 transition-all duration-500 hover:shadow-2xl hover:shadow-red-500/5">
        {/* Top gradient line — gym red energy */}
        <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${feature.color}`} />

        {/* Background glow orb */}
        <div className={`absolute ${isEven ? '-top-32 -right-32' : '-top-32 -left-32'} w-64 h-64 rounded-full blur-[80px] bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-[0.07] transition-opacity duration-700`} />

        {/* Number watermark */}
        <div className="absolute -top-3 right-4 sm:right-8 text-[80px] sm:text-[100px] font-black text-white/[0.02] select-none leading-none pointer-events-none">
          {num}
        </div>

        <div className={`relative p-5 sm:p-7 flex flex-col ${isEven ? 'sm:flex-row' : 'sm:flex-row-reverse'} gap-5 sm:gap-7 items-center`}>
          {/* Icon — pulsing power icon */}
          <motion.div
            className="shrink-0 relative"
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            <div className={`w-18 h-18 sm:w-22 sm:h-22 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg ${feature.glow} relative overflow-hidden`}
              style={{ width: '5rem', height: '5rem' }}
            >
              <Icon size={32} className="text-white relative z-10" strokeWidth={2.5} />
              <motion.div
                className="absolute inset-0 bg-white/10"
                animate={{ opacity: [0, 0.3, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
            {/* Pulse ring */}
            <motion.div
              className={`absolute inset-0 rounded-2xl ring-2 ${feature.ring}`}
              animate={{ scale: [1, 1.25], opacity: [0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ width: '5rem', height: '5rem' }}
            />
          </motion.div>

          {/* Content */}
          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
              <span className={`text-[10px] font-black ${feature.accent} uppercase tracking-[0.2em]`}>{num}</span>
              <span className="w-4 h-px bg-slate-600" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{feature.id}</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white mb-1 leading-tight tracking-tight">{feature.title}</h3>
            <p className={`text-sm font-bold bg-gradient-to-r ${feature.color} bg-clip-text text-transparent mb-3`}>{feature.tagline}</p>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">{feature.description}</p>

            {/* Highlights with stagger */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-5">
              {feature.highlights.map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -15 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.4 + i * 0.08, duration: 0.5 }}
                  className="flex items-center gap-2 text-xs text-slate-300"
                >
                  <motion.div
                    className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${feature.color} shrink-0`}
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
                  />
                  {h}
                </motion.div>
              ))}
            </div>

            <motion.button
              onClick={() => navigate(feature.link)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r ${feature.color} text-white text-sm font-bold shadow-lg hover:shadow-xl transition-shadow duration-300`}
            >
              Explore <ChevronRight size={14} />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────── Power Stat ─────────────────────── */
function PowerStat({ icon: Icon, value, suffix, label, delay, color }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, scale: 0.8 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ delay, duration: 0.5, type: 'spring', stiffness: 200 }}
      className="text-center relative"
    >
      <motion.div
        className={`w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg relative overflow-hidden`}
        whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
      >
        <Icon size={24} className="text-white relative z-10" strokeWidth={2.5} />
        <motion.div
          className="absolute inset-0 bg-white/20"
          animate={{ y: ['100%', '-100%'] }}
          transition={{ duration: 2, delay: delay + 0.5, repeat: Infinity, repeatDelay: 3 }}
        />
      </motion.div>
      <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
        <AnimatedCounter value={value} suffix={suffix} />
      </div>
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{label}</div>
    </motion.div>
  );
}

/* ═══════════════════════ MAIN COMPONENT ═══════════════════════ */
export default function FeatureGuide() {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.92]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const [showScrollHint, setShowScrollHint] = useState(true);
  const [heroReady, setHeroReady] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setHeroReady(true), 300);
    const t2 = setTimeout(() => setShowScrollHint(false), 6000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="min-h-screen pb-32 lg:pb-8 overflow-x-hidden">

      {/* ── Ambient Background ──────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Gym dark atmosphere */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(127,29,29,0.08)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(99,102,241,0.05)_0%,transparent_50%)]" />
        {/* Subtle grid pattern — like gym floor tiles */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
        {/* Floating embers */}
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              left: `${5 + (i * 7) % 90}%`,
              background: i % 3 === 0 ? '#ef4444' : i % 3 === 1 ? '#f97316' : '#fbbf24',
            }}
            animate={{
              y: [typeof window !== 'undefined' ? window.innerHeight + 20 : 800, -20],
              opacity: [0, 0.7, 0.7, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 6 + (i % 4) * 2,
              delay: i * 0.6,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      {/* ═══════════════ HERO SECTION ═══════════════ */}
      <motion.div ref={heroRef} style={{ opacity: heroOpacity, scale: heroScale, y: heroY }} className="relative z-10">
        <div className="relative min-h-[100vh] sm:min-h-[92vh] flex flex-col items-center justify-center px-4 text-center overflow-hidden">
          {/* Cinematic lighting */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.08)_0%,transparent_60%)]" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-red-600/5 blur-[100px]" />

          {/* Energy rings behind logo */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] pointer-events-none">
            <EnergyRing size={200} color="rgba(239,68,68,0.3)" delay={0} />
            <EnergyRing size={300} color="rgba(249,115,22,0.2)" delay={1} />
            <EnergyRing size={400} color="rgba(239,68,68,0.1)" delay={2} />
          </div>

          {/* Back button */}
          <motion.button
            onClick={() => navigate('/dashboard')}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute top-5 left-4 flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm font-bold z-20"
          >
            <ArrowLeft size={16} /> Back
          </motion.button>

          {/* Main logo entrance */}
          <motion.div
            initial={{ scale: 0, rotate: -180, opacity: 0 }}
            animate={heroReady ? { scale: 1, rotate: 0, opacity: 1 } : {}}
            transition={{ type: 'spring', duration: 1.4, bounce: 0.35 }}
            className="relative mb-8"
          >
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-red-600 via-orange-600 to-amber-500 flex items-center justify-center shadow-2xl shadow-red-600/40 relative overflow-hidden">
              <Dumbbell size={56} className="text-white relative z-10 drop-shadow-lg" strokeWidth={2.5} />
              {/* Shine sweep */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                animate={{ x: ['-200%', '200%'] }}
                transition={{ duration: 3, delay: 1.5, repeat: Infinity, repeatDelay: 5 }}
              />
            </div>
            {/* Power badge */}
            <motion.div
              className="absolute -top-2 -right-2 w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-red-500 flex items-center justify-center shadow-lg shadow-amber-500/40 border-2 border-[#0a0a0f]"
              initial={{ scale: 0, rotate: 180 }}
              animate={heroReady ? { scale: 1, rotate: 0 } : {}}
              transition={{ delay: 1, type: 'spring', stiffness: 300 }}
            >
              <Flame size={18} className="text-white" />
            </motion.div>
          </motion.div>

          {/* Title — POWER typography */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={heroReady ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.6, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.85] mb-3">
              <span className="bg-gradient-to-r from-red-500 via-orange-400 to-amber-400 bg-clip-text text-transparent drop-shadow-sm">
                FitTrack
              </span>
              <br />
              <span className="text-white">
                Bodybuilder
              </span>
              <br />
              <span className="bg-gradient-to-r from-slate-400 to-slate-300 bg-clip-text text-transparent text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-wide">
                PRO
              </span>
            </h1>
          </motion.div>

          {/* Tagline */}
          <motion.p
            className="text-base sm:text-lg text-slate-400 max-w-md mb-2 font-bold tracking-wide"
            initial={{ opacity: 0 }}
            animate={heroReady ? { opacity: 1 } : {}}
            transition={{ delay: 1 }}
          >
            YOUR BODY. YOUR DATA. YOUR&nbsp;
            <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">POWER</span>.
          </motion.p>

          <motion.p
            className="text-sm text-slate-600 max-w-xs mb-10"
            initial={{ opacity: 0 }}
            animate={heroReady ? { opacity: 1 } : {}}
            transition={{ delay: 1.2 }}
          >
            The ultimate weapon for every gym warrior
          </motion.p>

          {/* Heartbeat line */}
          <motion.div
            className="w-full max-w-md mb-10"
            initial={{ opacity: 0 }}
            animate={heroReady ? { opacity: 1 } : {}}
            transition={{ delay: 1.4 }}
          >
            <HeartbeatLine />
          </motion.div>

          {/* Power Stats */}
          <motion.div
            className="grid grid-cols-4 gap-3 sm:gap-8 mb-12 w-full max-w-xl"
            initial={{ opacity: 0, y: 30 }}
            animate={heroReady ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 1.5 }}
          >
            <PowerStat icon={Sparkles} value="22" suffix="+" label="Features" delay={1.6} color="from-red-600 to-orange-500" />
            <PowerStat icon={Dumbbell} value="100" suffix="+" label="Exercises" delay={1.7} color="from-orange-500 to-amber-500" />
            <PowerStat icon={UtensilsCrossed} value="500" suffix="+" label="Foods" delay={1.8} color="from-emerald-500 to-green-400" />
            <PowerStat icon={Bot} value="24" suffix="/7" label="AI Coach" delay={1.9} color="from-purple-500 to-fuchsia-500" />
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={heroReady ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 2.0 }}
          >
            <motion.button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 text-white font-black shadow-xl shadow-red-600/30 hover:shadow-red-600/50 transition-shadow text-sm uppercase tracking-wider"
            >
              <Flame size={18} /> Explore Arsenal
            </motion.button>
            <motion.button
              onClick={() => navigate('/dashboard')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-slate-300 font-bold hover:bg-white/10 hover:text-white transition-all text-sm uppercase tracking-wider"
            >
              <Rocket size={18} /> Start Training
            </motion.button>
          </motion.div>

          {/* Scroll indicator */}
          <AnimatePresence>
            {showScrollHint && (
              <motion.div
                className="absolute bottom-8 flex flex-col items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ delay: 2.5 }}
              >
                <span className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">Scroll down</span>
                <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                  <ChevronDown size={20} className="text-red-500/60" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ═══════════════ SECTION: YOUR ARSENAL ═══════════════ */}
      <div id="features" className="relative z-10 max-w-4xl mx-auto px-4 pt-12 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-4"
        >
          <motion.div
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-red-500/10 border border-red-500/30 mb-5"
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <Flame size={14} className="text-red-400" />
            <span className="text-xs font-black text-red-400 uppercase tracking-[0.2em]">Your Arsenal</span>
            <Flame size={14} className="text-red-400" />
          </motion.div>

          <h2 className="text-4xl sm:text-5xl font-black text-white mb-3 tracking-tight leading-none">
            Every Weapon<br />
            <span className="bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent">You Need</span>
          </h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto font-medium">
            22 battle-tested features. One unstoppable app. Built for warriors who take their gains seriously.
          </p>
        </motion.div>
      </div>

      {/* ═══════════════ FEATURE CARDS ═══════════════ */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 space-y-5">
        {FEATURES.map((feature, i) => (
          <div key={feature.id}>
            <FeatureCard feature={feature} index={i} />
            {/* Insert motivational quote every 5 features */}
            {(i + 1) % 5 === 0 && i < FEATURES.length - 1 && (
              <MotivationalBanner index={Math.floor(i / 5)} />
            )}
          </div>
        ))}
      </div>

      {/* ═══════════════ BOTTOM: BATTLE CRY CTA ═══════════════ */}
      <motion.div
        className="relative z-10 max-w-4xl mx-auto px-4 mt-20"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-950/40 via-slate-900 to-orange-950/30 border border-red-500/20 p-8 sm:p-14 text-center">
          {/* Background energy */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.08)_0%,transparent_60%)]" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />

          <motion.div className="relative">
            <motion.div
              className="text-[100px] sm:text-[140px] font-black text-white/[0.02] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none whitespace-nowrap"
              initial={{ scale: 0.8 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
            >
              BEAST MODE
            </motion.div>

            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              whileInView={{ scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', bounce: 0.4 }}
              className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center shadow-2xl shadow-red-600/30 relative overflow-hidden"
            >
              <Dumbbell size={40} className="text-white relative z-10" strokeWidth={2.5} />
              <motion.div
                className="absolute inset-0 bg-white/10"
                animate={{ opacity: [0, 0.4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>

            <h3 className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tight">
              Time to <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">Crush It</span>
            </h3>
            <p className="text-slate-400 text-sm mb-8 max-w-md mx-auto">
              Stop scrolling. Start lifting. Every feature is loaded and ready to push you to your max.
            </p>

            <motion.button
              onClick={() => navigate('/dashboard')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-3 px-12 py-5 rounded-2xl bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 text-white font-black text-lg shadow-2xl shadow-red-600/30 hover:shadow-red-600/50 transition-shadow uppercase tracking-wider"
            >
              <Flame size={24} /> ENTER THE GYM
            </motion.button>
          </motion.div>
        </div>

        {/* Credit */}
        <motion.div
          className="text-center mt-10 mb-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <p className="text-[10px] text-slate-600 uppercase tracking-[0.3em] font-bold mb-1">Developed by</p>
          <p className="text-xs text-slate-500 font-bold tracking-wide">Sameer Application Production</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
