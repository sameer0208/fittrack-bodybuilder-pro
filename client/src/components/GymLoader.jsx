import { memo } from 'react';

function GymLoader({ text = 'Loading FitTrack...' }) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0e17' }}>
      <div className="flex flex-col items-center gap-6">
        {/* Animated Dumbbell */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          {/* Glow ring */}
          <div className="absolute inset-0 rounded-full gym-loader-glow" />

          <svg
            className="gym-loader-dumbbell"
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Left outer plate */}
            <rect x="6" y="18" width="6" height="28" rx="2" fill="#ef4444" className="gym-loader-plate-left" />
            {/* Left inner plate */}
            <rect x="13" y="22" width="5" height="20" rx="1.5" fill="#b91c1c" className="gym-loader-plate-left" />
            {/* Bar */}
            <rect x="18" y="29" width="28" height="6" rx="3" fill="#64748b" />
            {/* Right inner plate */}
            <rect x="46" y="22" width="5" height="20" rx="1.5" fill="#b91c1c" className="gym-loader-plate-right" />
            {/* Right outer plate */}
            <rect x="52" y="18" width="6" height="28" rx="2" fill="#ef4444" className="gym-loader-plate-right" />
            {/* Grip texture on bar */}
            <line x1="26" y1="30" x2="26" y2="34" stroke="#475569" strokeWidth="1" />
            <line x1="30" y1="30" x2="30" y2="34" stroke="#475569" strokeWidth="1" />
            <line x1="34" y1="30" x2="34" y2="34" stroke="#475569" strokeWidth="1" />
            <line x1="38" y1="30" x2="38" y2="34" stroke="#475569" strokeWidth="1" />
          </svg>
        </div>

        {/* Text */}
        <div className="text-center">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.25em] gym-loader-text">{text}</p>
          {/* Animated dots */}
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500/60 gym-loader-dot" style={{ animationDelay: '0s' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-red-500/60 gym-loader-dot" style={{ animationDelay: '0.15s' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-red-500/60 gym-loader-dot" style={{ animationDelay: '0.3s' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(GymLoader);
