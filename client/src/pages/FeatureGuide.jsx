import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import {
  Dumbbell, UtensilsCrossed, Flame,
  ChevronRight, ArrowLeft, Sparkles, Bot,
  ChevronDown, Rocket, Orbit,
} from 'lucide-react';
import FEATURES from '../data/featureData';

/* ─────────────────────── Motivational Quotes ─────────────────────── */
const QUOTES = [
  { text: 'The only bad workout is the one that didn\'t happen.', author: 'Unknown' },
  { text: 'Your body can stand almost anything. It\'s your mind that you have to convince.', author: 'Unknown' },
  { text: 'The pain you feel today will be the strength you feel tomorrow.', author: 'Arnold Schwarzenegger' },
  { text: 'Don\'t count the days, make the days count.', author: 'Muhammad Ali' },
  { text: 'Success isn\'t given. It\'s earned. On the track, on the field, in the gym.', author: 'Unknown' },
  { text: 'No pain, no gain. Shut up and train.', author: 'Unknown' },
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
        <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${feature.color} pointer-events-none`} />

        {/* Background glow orb */}
        <div className={`absolute ${isEven ? '-top-32 -right-32' : '-top-32 -left-32'} w-64 h-64 rounded-full blur-[80px] bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-[0.07] transition-opacity duration-700 pointer-events-none`} />

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
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.08)_0%,transparent_60%)] pointer-events-none" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-red-600/5 blur-[100px] pointer-events-none" />

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
            <PowerStat icon={Sparkles} value="28" suffix="+" label="Features" delay={1.6} color="from-red-600 to-orange-500" />
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
              onClick={() => navigate('/universe')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-purple-600 text-white font-black shadow-xl shadow-cyan-600/20 hover:shadow-cyan-600/40 transition-shadow text-sm uppercase tracking-wider"
            >
              <Orbit size={18} /> Launch Universe
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
            28 battle-tested features. One unstoppable app. Built for warriors who take their gains seriously.
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
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.08)_0%,transparent_60%)] pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent pointer-events-none" />

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
