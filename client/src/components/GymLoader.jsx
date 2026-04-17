import { memo, useRef, useEffect } from 'react';

function GymLoader({ text = 'Loading FitTrack...' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const size = 200;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    let t = 0;
    let raf;

    function drawDumbbell(ctx, cx, cy, rotateY, rotateX, pump) {
      ctx.save();

      const scaleX = Math.cos(rotateY);
      const lift = Math.sin(pump) * 8;
      const tilt = Math.sin(rotateX) * 0.05;

      ctx.translate(cx, cy + lift);

      // 3D shadow on floor
      ctx.save();
      ctx.scale(1, 0.15);
      ctx.translate(0, 180);
      const shadowW = 80 * Math.abs(scaleX);
      const shadowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, shadowW);
      shadowGrad.addColorStop(0, 'rgba(239,68,68,0.12)');
      shadowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = shadowGrad;
      ctx.fillRect(-shadowW, -20, shadowW * 2, 40);
      ctx.restore();

      // Bar
      const barW = 60 * Math.abs(scaleX);
      const barH = 6;
      const barGrad = ctx.createLinearGradient(-barW, -barH / 2, barW, barH / 2);
      barGrad.addColorStop(0, '#475569');
      barGrad.addColorStop(0.3, '#94a3b8');
      barGrad.addColorStop(0.5, '#cbd5e1');
      barGrad.addColorStop(0.7, '#94a3b8');
      barGrad.addColorStop(1, '#475569');
      ctx.fillStyle = barGrad;
      roundRect(ctx, -barW, -barH / 2, barW * 2, barH, 3);
      ctx.fill();

      // Grip knurling
      const knurlSpacing = 6;
      for (let kx = -12; kx <= 12; kx += knurlSpacing) {
        ctx.beginPath();
        ctx.moveTo(kx * Math.abs(scaleX), -barH / 2 + 1);
        ctx.lineTo(kx * Math.abs(scaleX), barH / 2 - 1);
        ctx.strokeStyle = 'rgba(71,85,105,0.4)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // Plates (left and right)
      for (const side of [-1, 1]) {
        const plateX = side * barW;

        // Outer plate
        const pw = 10 * Math.abs(scaleX);
        const ph = 36;
        const pg = ctx.createLinearGradient(plateX - pw, 0, plateX + pw, 0);
        pg.addColorStop(0, '#991b1b');
        pg.addColorStop(0.3, '#ef4444');
        pg.addColorStop(0.5, '#fca5a5');
        pg.addColorStop(0.7, '#ef4444');
        pg.addColorStop(1, '#991b1b');
        ctx.fillStyle = pg;
        roundRect(ctx, plateX - pw, -ph / 2, pw * 2, ph, 3);
        ctx.fill();
        // Plate edge highlight
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 0.5;
        roundRect(ctx, plateX - pw, -ph / 2, pw * 2, ph, 3);
        ctx.stroke();

        // Inner plate
        const ipw = 7 * Math.abs(scaleX);
        const ipx = plateX + side * (pw + ipw);
        const iph = 28;
        const ipg = ctx.createLinearGradient(ipx - ipw, 0, ipx + ipw, 0);
        ipg.addColorStop(0, '#7f1d1d');
        ipg.addColorStop(0.5, '#dc2626');
        ipg.addColorStop(1, '#7f1d1d');
        ctx.fillStyle = ipg;
        roundRect(ctx, ipx - ipw, -iph / 2, ipw * 2, iph, 2);
        ctx.fill();

        // Collar
        const cw = 4 * Math.abs(scaleX);
        const cx2 = plateX - side * cw;
        ctx.fillStyle = '#64748b';
        roundRect(ctx, cx2 - cw / 2, -4, cw, 8, 1);
        ctx.fill();
      }

      // 3D specular on bar center
      const specGrad = ctx.createRadialGradient(0, -2, 0, 0, 0, 20);
      specGrad.addColorStop(0, 'rgba(255,255,255,0.15)');
      specGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = specGrad;
      ctx.fillRect(-20, -10, 40, 12);

      ctx.restore();
    }

    function drawGlowRing(ctx, cx, cy, t) {
      const radius = 70;
      const pulse = 0.5 + Math.sin(t * 2) * 0.5;

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(239, 68, 68, ${0.06 + pulse * 0.08})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Orbiting light
      const orbAngle = t * 1.5;
      const orbX = cx + Math.cos(orbAngle) * radius;
      const orbY = cy + Math.sin(orbAngle) * radius;
      const orbGrad = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, 12);
      orbGrad.addColorStop(0, `rgba(239, 68, 68, ${0.3 + pulse * 0.2})`);
      orbGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = orbGrad;
      ctx.fillRect(orbX - 12, orbY - 12, 24, 24);
      ctx.restore();
    }

    function animate() {
      t += 0.016;
      ctx.clearRect(0, 0, size, size);

      drawGlowRing(ctx, cx, cy, t);
      drawDumbbell(ctx, cx, cy, t * 0.8, t * 0.4, t * 3);

      raf = requestAnimationFrame(animate);
    }

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0e17' }}>
      <div className="flex flex-col items-center gap-6">
        <canvas ref={canvasRef} className="drop-shadow-2xl" />

        <div className="text-center">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.25em] gym-loader-text">{text}</p>
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

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export default memo(GymLoader);
