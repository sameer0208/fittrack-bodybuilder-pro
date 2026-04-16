import { memo } from 'react';

function GymAmbience({ variant = 'default' }) {
  return (
    <div className="gym-ambience pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* Dark gym atmosphere glow */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[400px] rounded-full bg-red-900/[0.04] blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[400px] rounded-full bg-indigo-900/[0.04] blur-[120px]" />

      {/* Subtle gym grid floor texture */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      {/* Top edge red energy line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/15 to-transparent" />

      {variant === 'workout' && (
        <>
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-orange-600/[0.03] blur-[100px] gym-pulse" />
          <div className="absolute bottom-1/4 right-0 w-[300px] h-[300px] rounded-full bg-red-600/[0.03] blur-[80px]" />
        </>
      )}

      {variant === 'nutrition' && (
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-emerald-600/[0.03] blur-[100px]" />
      )}
    </div>
  );
}

export default memo(GymAmbience);
