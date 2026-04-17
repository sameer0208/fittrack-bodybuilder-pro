import { memo, useEffect, useRef } from 'react';

const ITEMS = [
  { x: 5,  y: 10, size: 64, speed: 40, delay: 0,   rot: 15,  type: 'dumbbell', op: 0.18, z: 0.6 },
  { x: 82, y: 22, size: 52, speed: 50, delay: -8,  rot: -10, type: 'flame',    op: 0.14, z: 0.3 },
  { x: 12, y: 55, size: 48, speed: 45, delay: -15, rot: 5,   type: 'target',   op: 0.14, z: 0.8 },
  { x: 72, y: 65, size: 68, speed: 55, delay: -20, rot: 20,  type: 'dumbbell', op: 0.16, z: 0.5 },
  { x: 40, y: 80, size: 44, speed: 42, delay: -5,  rot: -20, type: 'trophy',   op: 0.12, z: 0.7 },
  { x: 28, y: 16, size: 40, speed: 48, delay: -12, rot: 8,   type: 'heart',    op: 0.12, z: 0.4 },
  { x: 90, y: 45, size: 42, speed: 52, delay: -25, rot: -15, type: 'bolt',     op: 0.14, z: 0.9 },
  { x: 55, y: 6,  size: 58, speed: 58, delay: -30, rot: 12,  type: 'dumbbell', op: 0.16, z: 0.2 },
];

const SW = '2.5';

const SVGS = {
  dumbbell: (
    <g stroke="currentColor" strokeWidth={SW} strokeLinecap="round" fill="none">
      <path d="M6.5 6.5a2 2 0 00-3 0l-1 1a2 2 0 000 3l10 10a2 2 0 003 0l1-1a2 2 0 000-3z" />
      <path d="M14.5 14.5L9 9" />
      <path d="M14 4l6 6" /><path d="M4 14l6 6" />
      <path d="M20 10l1.5-1.5a2 2 0 000-3L20 4" />
      <path d="M10 20l-1.5 1.5a2 2 0 01-3 0L4 20" />
    </g>
  ),
  flame: (
    <path d="M8.5 14.5A4 4 0 0013 18c2.2 0 4-1.8 4-4 0-3-2-5.5-4-8-2 2.5-4 5-4 8zM12 12v1" stroke="currentColor" strokeWidth={SW} strokeLinecap="round" fill="none" />
  ),
  target: (
    <g stroke="currentColor" strokeWidth={SW} fill="none">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </g>
  ),
  trophy: (
    <g stroke="currentColor" strokeWidth={SW} strokeLinecap="round" fill="none">
      <path d="M6 9H4.5a2.5 2.5 0 010-5H6" /><path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
      <path d="M4 22h16" /><path d="M10 22V18a2 2 0 012-2v0a2 2 0 012 2v4" />
      <path d="M18 2H6v7a6 6 0 0012 0V2z" />
    </g>
  ),
  heart: (
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.3 1.5 4.05 3 5.5l7 7z" stroke="currentColor" strokeWidth={SW} fill="none" />
  ),
  bolt: (
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  ),
};

function GymAmbience() {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const children = el.querySelectorAll('.gym-eq');
    const start = performance.now();
    let raf;

    const animate = (now) => {
      const t = (now - start) / 1000;
      children.forEach((child, i) => {
        const item = ITEMS[i];
        const phase = t / item.speed + item.delay;
        const yOff = Math.sin(phase * Math.PI * 2) * 18;
        const xOff = Math.cos(phase * Math.PI * 2 * 0.7) * 8;
        const zOff = Math.sin(phase * Math.PI * 1.3) * 30;
        const rotX = Math.sin(phase * Math.PI * 1.5) * 8;
        const rotY = Math.cos(phase * Math.PI * 1.1) * 12;
        const scaleZ = 1 + Math.sin(phase * Math.PI) * 0.06;
        child.style.transform = `translate3d(${xOff}px, ${yOff}px, ${zOff}px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${scaleZ})`;
      });
      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        perspective: '1200px',
        perspectiveOrigin: '50% 50%',
      }}
      aria-hidden="true"
    >
      {ITEMS.map((item, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${item.x}%`,
            top: `${item.y}%`,
            opacity: item.op,
            transform: `rotate(${item.rot}deg) translateZ(${item.z * 60}px)`,
            transformStyle: 'preserve-3d',
            color: '#ef4444',
            filter: `blur(${(1 - item.z) * 1.5}px)`,
          }}
        >
          <div className="gym-eq" style={{ transformStyle: 'preserve-3d' }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={item.size}
              height={item.size}
              viewBox="0 0 24 24"
              style={{ display: 'block', filter: `drop-shadow(0 2px ${4 + item.z * 6}px rgba(239,68,68,0.15))` }}
            >
              {SVGS[item.type]}
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
}

export default memo(GymAmbience);
