import { useEffect, useRef, memo } from 'react';

const PARTICLE_POOL_SIZE = 8;
const PARTICLE_LIFETIME = 600;

const PARTICLE_SHAPES = [
  '\u26A1', // lightning bolt
  '\uD83D\uDD25', // fire
  '\uD83D\uDCAA', // flex
  '\u2B50', // star
];

function spawnBurst(x, y) {
  const container = document.getElementById('gym-click-fx');
  if (!container) return;

  for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
    const el = document.createElement('span');
    el.className = 'gym-spark';
    el.textContent = PARTICLE_SHAPES[i % PARTICLE_SHAPES.length];

    const angle = (Math.PI * 2 * i) / PARTICLE_POOL_SIZE + (Math.random() - 0.5) * 0.5;
    const dist = 30 + Math.random() * 40;
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist;

    el.style.cssText = `
      left:${x}px;top:${y}px;
      --tx:${tx}px;--ty:${ty}px;
      font-size:${10 + Math.random() * 6}px;
      animation-delay:${i * 20}ms;
    `;

    container.appendChild(el);
    setTimeout(() => el.remove(), PARTICLE_LIFETIME + i * 20);
  }
}

function GymClickEffect() {
  const throttle = useRef(0);

  useEffect(() => {
    const clickHandler = (e) => {
      const now = Date.now();
      if (now - throttle.current < 150) return;

      const target = e.target.closest(
        'button, .btn-primary, .btn-secondary, .btn-success, [role="button"]'
      );
      if (!target) return;

      throttle.current = now;
      const rect = target.getBoundingClientRect();
      spawnBurst(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2
      );
    };

    const moveHandler = (e) => {
      const card = e.target.closest('.card-hover');
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--mouse-x', `${x}%`);
      card.style.setProperty('--mouse-y', `${y}%`);
    };

    document.addEventListener('click', clickHandler, { passive: true });
    document.addEventListener('mousemove', moveHandler, { passive: true });
    return () => {
      document.removeEventListener('click', clickHandler);
      document.removeEventListener('mousemove', moveHandler);
    };
  }, []);

  return <div id="gym-click-fx" className="fixed inset-0 z-[99999] pointer-events-none overflow-hidden" aria-hidden="true" />;
}

export default memo(GymClickEffect);
