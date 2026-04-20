import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Pause, SkipForward, SkipBack, Rocket, ChevronRight } from 'lucide-react';
import FEATURES from '../data/featureData';

const PI2 = Math.PI * 2, PI = Math.PI, TOTAL = FEATURES.length;
const S = Math.sin, C = Math.cos, A = Math.abs, sqrt = Math.sqrt;
const HOLD_MS = 4800, WARP_MS = 750, INTRO_MS = 3800;

const GRAD_MAP = {
  'from-red-600 to-orange-500':['#dc2626','#f97316','#7f1d1d'],
  'from-amber-500 to-orange-500':['#f59e0b','#f97316','#78350f'],
  'from-indigo-500 to-blue-500':['#6366f1','#3b82f6','#312e81'],
  'from-emerald-500 to-green-400':['#10b981','#4ade80','#064e3b'],
  'from-cyan-500 to-blue-400':['#06b6d4','#60a5fa','#164e63'],
  'from-purple-500 to-fuchsia-500':['#a855f7','#d946ef','#581c87'],
  'from-amber-500 to-orange-400':['#f59e0b','#fb923c','#78350f'],
  'from-rose-500 to-red-500':['#f43f5e','#ef4444','#881337'],
  'from-yellow-500 to-amber-400':['#eab308','#fbbf24','#713f12'],
  'from-pink-500 to-rose-500':['#ec4899','#f43f5e','#831843'],
  'from-sky-500 to-cyan-500':['#0ea5e9','#06b6d4','#0c4a6e'],
  'from-violet-500 to-purple-500':['#8b5cf6','#a855f7','#4c1d95'],
  'from-blue-500 to-indigo-500':['#3b82f6','#6366f1','#1e3a5f'],
  'from-teal-500 to-emerald-500':['#14b8a6','#10b981','#134e4a'],
  'from-lime-500 to-green-500':['#84cc16','#22c55e','#365314'],
  'from-rose-500 to-pink-500':['#f43f5e','#ec4899','#881337'],
  'from-emerald-500 to-teal-400':['#10b981','#2dd4bf','#064e3b'],
  'from-orange-500 to-amber-500':['#f97316','#f59e0b','#7c2d12'],
  'from-cyan-500 to-blue-500':['#06b6d4','#3b82f6','#164e63'],
  'from-indigo-600 to-violet-500':['#4f46e5','#8b5cf6','#312e81'],
  'from-rose-600 to-red-500':['#e11d48','#ef4444','#881337'],
  'from-orange-600 to-amber-500':['#ea580c','#f59e0b','#7c2d12'],
  'from-pink-600 to-rose-500':['#db2777','#f43f5e','#831843'],
  'from-slate-500 to-zinc-600':['#64748b','#52525b','#1e293b'],
  'from-amber-500 to-yellow-400':['#f59e0b','#facc15','#78350f'],
  'from-orange-500 to-red-500':['#f97316','#ef4444','#7c2d12'],
};
function gc(f){return GRAD_MAP[f.color]||['#ef4444','#f97316','#7f1d1d'];}
function hx(h){return[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];}
function srand(seed){let s=seed;return()=>{s=(s*16807)%2147483647;return s/2147483647;};}

// ═══════════════════ FULL SOLAR SYSTEM CANVAS ════════════════════════════════
function useSpaceCanvas(canvasRef, warpRef, activeIdxRef, phaseRef) {
  const dataRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    function resize() {
      cvs.width = window.innerWidth * dpr;
      cvs.height = window.innerHeight * dpr;
      cvs.style.width = '100vw';
      cvs.style.height = '100vh';
    }
    resize();
    window.addEventListener('resize', resize);
    const W = () => cvs.width / dpr;
    const H = () => cvs.height / dpr;

    // ── GENERATE ALL DATA ONCE ──
    if (!dataRef.current) {
      const rng = srand(42);

      // Stars stored as polar coords from center (for forward-flight effect)
      const stars = [];
      for (let i = 0; i < 2200; i++) {
        const layer = i < 1200 ? 0 : i < 1700 ? 1 : 2;
        const tmp = rng();
        const angle = rng() * PI2;
        const dist = 0.02 + rng() * 0.98;
        stars.push({
          angle, dist,
          rad: layer===0 ? 0.3+rng()*0.4 : layer===1 ? 0.5+rng()*0.8 : 1.0+rng()*1.4,
          spd: layer===0 ? 0.04 : layer===1 ? 0.09 : 0.18,
          bri: layer===0 ? 0.2+rng()*0.2 : layer===1 ? 0.35+rng()*0.3 : 0.7+rng()*0.3,
          tw: rng()*PI2, tws: 1.5+rng()*3.5, layer,
          cr: tmp<0.3?210+rng()*40:tmp<0.6?240+rng()*15:255,
          cg: tmp<0.3?190+rng()*30:tmp<0.6?220+rng()*35:245+rng()*10,
          cb: tmp<0.3?255:tmp<0.6?200+rng()*55:210+rng()*30,
        });
      }

      // Space dust particles rushing past (forward-flight)
      const dust = [];
      for (let i = 0; i < 300; i++) {
        dust.push({
          angle: rng() * PI2,
          dist: rng(),
          spd: 0.15 + rng() * 0.35,
          len: 0.02 + rng() * 0.04,
          bri: 0.08 + rng() * 0.15,
        });
      }

      // 6 nebulae
      const nebulae = [
        {x:.12,y:.22,r:.3,c:[180,30,70],d:.06},{x:.78,y:.6,r:.35,c:[50,25,160],d:.04},
        {x:.42,y:.08,r:.24,c:[15,70,190],d:.08},{x:.88,y:.18,r:.2,c:[130,50,110],d:.05},
        {x:.25,y:.78,r:.26,c:[30,110,150],d:.03},{x:.6,y:.4,r:.18,c:[100,20,140],d:.07},
      ];

      // 8 shooting stars
      const meteors = [];
      for (let i=0;i<8;i++) meteors.push({
        x:rng(),y:rng()*0.5,vx:.25+rng()*.5,vy:.1+rng()*.25,
        life:0,maxLife:35+rng()*55,delay:rng()*500+i*80,
        bri:.5+rng()*.5,len:25+rng()*60,
      });

      // 200 asteroids in a belt
      const asteroids = [];
      for (let i=0;i<200;i++) {
        const a = rng()*PI2;
        asteroids.push({
          angle:a, dist:.42+rng()*.1, spd:.015+rng()*.04,
          sz:.6+rng()*2.5, bri:.12+rng()*.25, yOff:(rng()-.5)*.04,
          shape: Math.floor(rng()*3),
        });
      }

      // ALL 28 feature planets — arranged in orbits around the sun
      const planets = FEATURES.map((f,i) => {
        const p = srand(i*1337+7);
        const hasMoon = p()>.3;
        const hasRing = p()>.6;
        const has2ndMoon = hasMoon && p()>.65;
        const craters = [];
        for(let c=0;c<6+Math.floor(p()*5);c++) craters.push({a:p()*PI2,d:.1+p()*.6,r:.03+p()*.07,dp:.25+p()*.4});
        const clouds = [];
        for(let c=0;c<4;c++) clouds.push({a:p()*PI2,d:p()*.45,w:.12+p()*.2,h:.02+p()*.05});
        const bands = [];
        for(let b=0;b<6+Math.floor(p()*4);b++) bands.push({off:p()*PI2,alpha:.04+p()*.08,dark:p()>.5});

        const orbitIdx = i;
        const orbitR = 0.14 + (orbitIdx / (TOTAL-1)) * 0.42;
        const orbitSpeed = 0.03 + (1 - orbitIdx/TOTAL) * 0.06;
        const startAngle = (i / TOTAL) * PI2 + p() * 0.3;
        const baseSize = 0.012 + p() * 0.014;

        return {
          orbitR, orbitSpeed, startAngle, baseSize,
          hasMoon, hasRing, has2ndMoon, craters, clouds, bands,
          moonDist: 1.8+p()*.8, moonSize:.2+p()*.15, moonSpd:.5+p()*.8,
          moonCol:[170+p()*70,160+p()*70,150+p()*60],
          moon2Dist: 2.4+p()*.6, moon2Size:.12+p()*.08, moon2Spd:.8+p()*.6,
          moon2Col:[140+p()*80,150+p()*60,180+p()*50],
          ringTilt:.2+p()*.3, ringCnt:2+Math.floor(p()*3),
          rotSpd:.1+p()*.35,
          tilt: (p()-.5)*.2,
        };
      });

      dataRef.current = { stars, dust, nebulae, meteors, asteroids, planets };
    }

    const d = dataRef.current;
    let t = 0, prevTs = performance.now();

    // ── Helper: draw a planet body (used for all 28 + moons) ──
    function drawPlanet(px,py,r,rgb1,rgb2,rgb3,pd,time,isMini) {
      if (r < 1) return;

      // Atmosphere halo
      if (!isMini) {
        for(let i=2;i>=0;i--) {
          const ar=r*(1.12+i*.1);
          const ag=ctx.createRadialGradient(px,py,r*.85,px,py,ar);
          ag.addColorStop(0,`rgba(${rgb1[0]},${rgb1[1]},${rgb1[2]},${.06-i*.015})`);
          ag.addColorStop(1,`rgba(${rgb1[0]},${rgb1[1]},${rgb1[2]},0)`);
          ctx.fillStyle=ag;ctx.beginPath();ctx.arc(px,py,ar,0,PI2);ctx.fill();
        }
      }

      // Rings behind planet
      if (pd && pd.hasRing) {
        ctx.save();ctx.translate(px,py);ctx.scale(1,pd.ringTilt);
        for(let ri=0;ri<pd.ringCnt;ri++) {
          const rd=r*(1.4+ri*.22), rw=Math.max(1,r*.06);
          ctx.beginPath();ctx.arc(0,0,rd,PI,PI2);
          ctx.strokeStyle=`rgba(${rgb2[0]},${rgb2[1]},${rgb2[2]},${.18-ri*.04})`;
          ctx.lineWidth=rw;ctx.stroke();
        }
        ctx.restore();
      }

      // Planet body
      ctx.save();ctx.beginPath();ctx.arc(px,py,r,0,PI2);ctx.clip();

      // Base lit gradient
      const bg=ctx.createRadialGradient(px-r*.35,py-r*.35,r*.05,px+r*.1,py+r*.1,r*1.1);
      bg.addColorStop(0,`rgba(${Math.min(255,rgb1[0]+50)},${Math.min(255,rgb1[1]+50)},${Math.min(255,rgb1[2]+50)},1)`);
      bg.addColorStop(.35,`rgb(${rgb1[0]},${rgb1[1]},${rgb1[2]})`);
      bg.addColorStop(.65,`rgb(${rgb2[0]},${rgb2[1]},${rgb2[2]})`);
      bg.addColorStop(1,`rgb(${rgb3[0]},${rgb3[1]},${rgb3[2]})`);
      ctx.fillStyle=bg;ctx.fillRect(px-r,py-r,r*2,r*2);

      if (pd && r > 4) {
        const rot = time * pd.rotSpd;
        // Bands
        for (const b of pd.bands) {
          const by = py - r + ((b.off + rot*.1) % PI2) / PI2 * r * 2;
          const bh = r * .1 + S(b.off*2) * r * .03;
          ctx.fillStyle = b.dark
            ? `rgba(${rgb3[0]},${rgb3[1]},${rgb3[2]},${b.alpha})`
            : `rgba(255,255,255,${b.alpha*.4})`;
          ctx.fillRect(px-r, by, r*2, bh);
        }
        // Craters
        if (r > 8) {
          for(const cr of pd.craters) {
            const ca=cr.a+rot*.2;
            const crx=px+C(ca)*cr.d*r, cry=py+S(ca*.7)*cr.d*r, crr=cr.r*r;
            const cg=ctx.createRadialGradient(crx-crr*.2,cry-crr*.2,0,crx,cry,crr);
            cg.addColorStop(0,`rgba(0,0,0,${cr.dp*.12})`);
            cg.addColorStop(.7,`rgba(0,0,0,${cr.dp*.05})`);
            cg.addColorStop(1,`rgba(255,255,255,${cr.dp*.02})`);
            ctx.fillStyle=cg;ctx.beginPath();ctx.arc(crx,cry,crr,0,PI2);ctx.fill();
          }
        }
        // Clouds
        if (r > 10) {
          ctx.globalCompositeOperation='screen';
          for(const cl of pd.clouds) {
            const ca=cl.a+time*pd.rotSpd*.4;
            const clx=px+C(ca)*cl.d*r, cly=py+S(ca*.5)*cl.d*r*.4;
            const cg=ctx.createRadialGradient(clx,cly,0,clx,cly,cl.w*r);
            cg.addColorStop(0,'rgba(255,255,255,.06)');cg.addColorStop(1,'rgba(255,255,255,0)');
            ctx.fillStyle=cg;ctx.beginPath();ctx.ellipse(clx,cly,cl.w*r,cl.h*r,ca*.3,0,PI2);ctx.fill();
          }
          ctx.globalCompositeOperation='source-over';
        }
      }

      // Terminator
      const sh=ctx.createLinearGradient(px-r,py,px+r,py);
      sh.addColorStop(0,'rgba(0,0,0,0)');sh.addColorStop(.5,'rgba(0,0,0,0)');
      sh.addColorStop(.75,'rgba(0,0,0,.3)');sh.addColorStop(1,'rgba(0,0,0,.6)');
      ctx.fillStyle=sh;ctx.fillRect(px-r,py-r,r*2,r*2);

      // Specular
      if (r > 3) {
        const sp=ctx.createRadialGradient(px-r*.32,py-r*.32,0,px-r*.2,py-r*.2,r*.55);
        sp.addColorStop(0,'rgba(255,255,255,.15)');sp.addColorStop(.6,'rgba(255,255,255,.03)');sp.addColorStop(1,'rgba(255,255,255,0)');
        ctx.fillStyle=sp;ctx.fillRect(px-r,py-r,r*2,r*2);
      }
      ctx.restore();

      // Rings in front
      if (pd && pd.hasRing) {
        ctx.save();ctx.translate(px,py);ctx.scale(1,pd.ringTilt);
        for(let ri=0;ri<pd.ringCnt;ri++) {
          const rd=r*(1.4+ri*.22), rw=Math.max(1,r*.06);
          ctx.beginPath();ctx.arc(0,0,rd,0,PI);
          ctx.strokeStyle=`rgba(${rgb2[0]},${rgb2[1]},${rgb2[2]},${.12-ri*.03})`;
          ctx.lineWidth=rw;ctx.stroke();
        }
        ctx.restore();
      }
    }

    // ── Helper: draw a moon ──
    function drawMoon(px, py, parentR, dist, size, speed, col, time) {
      const a = time * speed;
      const orbitRx = parentR * dist;
      const orbitRy = orbitRx * .35;
      const mx = px + C(a) * orbitRx;
      const my = py + S(a) * orbitRy;
      const mr = parentR * size;
      if (mr < 0.8) return;

      // Orbit path
      ctx.save();ctx.setLineDash([2,4]);
      ctx.beginPath();ctx.ellipse(px,py,orbitRx,orbitRy,0,0,PI2);
      ctx.strokeStyle='rgba(255,255,255,.025)';ctx.lineWidth=.5;ctx.stroke();
      ctx.setLineDash([]);ctx.restore();

      // Moon body
      const mg=ctx.createRadialGradient(mx-mr*.3,my-mr*.3,0,mx,my,mr);
      mg.addColorStop(0,`rgba(${Math.min(255,col[0]+35)},${Math.min(255,col[1]+35)},${Math.min(255,col[2]+35)},1)`);
      mg.addColorStop(.7,`rgba(${col[0]},${col[1]},${col[2]},1)`);
      mg.addColorStop(1,`rgba(${Math.max(0,col[0]-50)},${Math.max(0,col[1]-50)},${Math.max(0,col[2]-50)},1)`);
      ctx.beginPath();ctx.arc(mx,my,mr,0,PI2);ctx.fillStyle=mg;ctx.fill();

      // Moon shadow
      ctx.save();ctx.beginPath();ctx.arc(mx,my,mr,0,PI2);ctx.clip();
      const ms=ctx.createLinearGradient(mx-mr,my,mx+mr,my);
      ms.addColorStop(0,'rgba(0,0,0,0)');ms.addColorStop(.55,'rgba(0,0,0,0)');ms.addColorStop(1,'rgba(0,0,0,.45)');
      ctx.fillStyle=ms;ctx.fillRect(mx-mr,my-mr,mr*2,mr*2);
      ctx.restore();
    }

    function frame(ts) {
      const dt = Math.min((ts - prevTs) / 1000, 0.05);
      prevTs = ts; t += dt;
      const w = W(), h = H();
      ctx.setTransform(dpr,0,0,dpr,0,0);

      // Deep space background — center shifts slowly for travel feel
      const bgCx = w*.5 + S(t*.04)*w*.08;
      const bgCy = h*.45 + C(t*.03)*h*.06;
      const bgG=ctx.createRadialGradient(bgCx,bgCy,0,bgCx,bgCy,Math.max(w,h)*.85);
      bgG.addColorStop(0,'#0a0f1e');bgG.addColorStop(.35,'#060a14');bgG.addColorStop(1,'#020308');
      ctx.fillStyle=bgG;ctx.fillRect(0,0,w,h);

      const warp=warpRef.current, cx=w/2, cy=h/2;
      const idx=activeIdxRef.current;
      const minDim = Math.min(w,h);

      // ═══ NEBULAE (drift continuously to give travel feeling) ═══
      for(const n of d.nebulae) {
        const driftX = t * 8 * n.d;
        const driftY = t * 5 * n.d;
        let nx = ((n.x * w + S(t*n.d+n.x*9)*45 - driftX) % (w*1.4)) ;
        let ny = ((n.y * h + C(t*n.d*.7+n.y*7)*35 + driftY) % (h*1.4));
        if (nx < -w*.2) nx += w*1.4;
        if (ny < -h*.2) ny += h*1.4;
        const nr=n.r*minDim;
        const pulse=.75+.25*S(t*.25+n.x*4);
        const g=ctx.createRadialGradient(nx,ny,0,nx,ny,nr);
        g.addColorStop(0,`rgba(${n.c[0]},${n.c[1]},${n.c[2]},${.06*pulse})`);
        g.addColorStop(.3,`rgba(${n.c[0]},${n.c[1]},${n.c[2]},${.03*pulse})`);
        g.addColorStop(.7,`rgba(${n.c[0]},${n.c[1]},${n.c[2]},${.008*pulse})`);
        g.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
      }

      // ═══ STARS — forward-flight: expand outward from center ═══
      const flySpeed = warp ? 6 : 1;
      for(const s of d.stars) {
        // Stars move radially outward from center -> creates forward-flight parallax
        s.dist += s.spd * flySpeed * dt * 0.12;
        if (s.dist > 1.1) { s.dist = 0.01 + Math.random() * 0.05; s.angle = Math.random() * PI2; }

        // Map polar to screen coords from center
        const maxR = sqrt(cx*cx+cy*cy) * 1.15;
        const r = s.dist * maxR;
        const sx = cx + C(s.angle) * r;
        const sy = cy + S(s.angle) * r;

        // Brightness increases as star moves outward (closer = brighter, like approaching)
        const distFactor = Math.min(1, s.dist * 1.5);
        const twk = .55 + .45 * S(t * s.tws + s.tw);
        const al = s.bri * twk * (.3 + distFactor * .7);
        const drawRad = s.rad * (.4 + distFactor * .8);

        if (warp) {
          // Warp streaks: long lines radiating from center
          const slen = Math.min(r * .35, 100 + s.layer * 50);
          const gr = ctx.createLinearGradient(sx, sy, sx - C(s.angle)*slen, sy - S(s.angle)*slen);
          gr.addColorStop(0, `rgba(${s.cr},${s.cg},${s.cb},${al*.9})`);
          gr.addColorStop(1, `rgba(${s.cr},${s.cg},${s.cb},0)`);
          ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - C(s.angle)*slen, sy - S(s.angle)*slen);
          ctx.strokeStyle = gr; ctx.lineWidth = drawRad * .9; ctx.stroke();
        } else {
          // Normal: small motion trail to show forward movement
          const trailLen = s.spd * flySpeed * 3 * distFactor;
          if (trailLen > 1.5 && drawRad > .6) {
            const gr = ctx.createLinearGradient(sx, sy, sx - C(s.angle)*trailLen, sy - S(s.angle)*trailLen);
            gr.addColorStop(0, `rgba(${s.cr},${s.cg},${s.cb},${al*.7})`);
            gr.addColorStop(1, `rgba(${s.cr},${s.cg},${s.cb},0)`);
            ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - C(s.angle)*trailLen, sy - S(s.angle)*trailLen);
            ctx.strokeStyle = gr; ctx.lineWidth = drawRad * .5; ctx.stroke();
          }
          if (drawRad > 1) {
            const gl = ctx.createRadialGradient(sx, sy, 0, sx, sy, drawRad*3);
            gl.addColorStop(0, `rgba(${s.cr},${s.cg},${s.cb},${al*.4})`);
            gl.addColorStop(1, `rgba(${s.cr},${s.cg},${s.cb},0)`);
            ctx.fillStyle = gl; ctx.fillRect(sx-drawRad*3, sy-drawRad*3, drawRad*6, drawRad*6);
          }
          ctx.beginPath(); ctx.arc(sx, sy, drawRad, 0, PI2);
          ctx.fillStyle = `rgba(${s.cr},${s.cg},${s.cb},${al})`; ctx.fill();
        }
      }

      // ═══ SPACE DUST — fast thin streaks rushing past (forward-flight) ═══
      for (const p of d.dust) {
        p.dist += p.spd * flySpeed * dt * 0.15;
        if (p.dist > 1.05) { p.dist = 0.01; p.angle = Math.random() * PI2; }
        const maxR = sqrt(cx*cx+cy*cy) * 1.1;
        const r = p.dist * maxR;
        const px = cx + C(p.angle) * r;
        const py = cy + S(p.angle) * r;
        const trailR = p.len * maxR * p.dist;
        const al = p.bri * Math.min(1, p.dist * 2.5);
        if (al < 0.01) continue;
        const gr = ctx.createLinearGradient(px, py, px - C(p.angle)*trailR, py - S(p.angle)*trailR);
        gr.addColorStop(0, `rgba(180,200,255,${al})`);
        gr.addColorStop(1, 'rgba(180,200,255,0)');
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - C(p.angle)*trailR, py - S(p.angle)*trailR);
        ctx.strokeStyle = gr; ctx.lineWidth = .6; ctx.stroke();
      }

      // ═══ SHOOTING STARS / METEORS (always, 8) ═══
      for(const m of d.meteors) {
        if(t*60<m.delay) continue;
        m.life++;
        if(m.life>m.maxLife){m.life=0;m.x=Math.random();m.y=Math.random()*.4;m.delay=t*60+Math.random()*350+80;}
        const pr=m.life/m.maxLife;
        const al=pr<.1?pr*10:pr>.7?(1-pr)/.3:1;
        const sx=m.x*w+m.vx*m.life*1.6, sy=m.y*h+m.vy*m.life*1.6;
        if(sx>w*1.3||sy>h*1.3){m.life=m.maxLife;continue;}
        const gr=ctx.createLinearGradient(sx,sy,sx-m.vx*m.len,sy-m.vy*m.len);
        gr.addColorStop(0,`rgba(255,255,255,${al*m.bri*.85})`);
        gr.addColorStop(.25,`rgba(200,220,255,${al*m.bri*.35})`);
        gr.addColorStop(1,'rgba(180,200,255,0)');
        ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx-m.vx*m.len,sy-m.vy*m.len);
        ctx.strokeStyle=gr;ctx.lineWidth=1.5;ctx.stroke();
        ctx.beginPath();ctx.arc(sx,sy,2,0,PI2);ctx.fillStyle=`rgba(255,255,255,${al*m.bri})`;ctx.fill();
      }

      // ═══ SUN (always, slowly drifts to simulate camera movement) ═══
      const sunDrift = t * 3;
      const sunX = w*.22 + S(sunDrift * .08) * w * .04 + S(sunDrift * .03) * w * .02;
      const sunY = h*.28 + C(sunDrift * .06) * h * .03 + C(sunDrift * .025) * h * .015;
      const sunR=minDim*.06;
      const sunP=1+.04*S(t*2.2);

      // Solar wind / corona rays
      ctx.save();ctx.globalCompositeOperation='screen';
      for(let i=0;i<12;i++){
        const ra=t*.15+i*PI2/12;
        const rlen=sunR*(3+S(t*1.5+i*2)*1.2)*sunP;
        const rx1=sunX+C(ra)*sunR*.8, ry1=sunY+S(ra)*sunR*.8;
        const rx2=sunX+C(ra)*rlen, ry2=sunY+S(ra)*rlen;
        const rg=ctx.createLinearGradient(rx1,ry1,rx2,ry2);
        rg.addColorStop(0,`rgba(255,200,80,.04)`);rg.addColorStop(1,'rgba(255,150,40,0)');
        ctx.beginPath();ctx.moveTo(rx1,ry1);ctx.lineTo(rx2,ry2);ctx.strokeStyle=rg;ctx.lineWidth=sunR*.2;ctx.stroke();
      }
      ctx.restore();

      // Corona glow
      for(let i=5;i>=0;i--){
        const cr=sunR*(2+i*1.2)*sunP;
        const cg=ctx.createRadialGradient(sunX,sunY,sunR*.4,sunX,sunY,cr);
        cg.addColorStop(0,`rgba(255,200,80,${.015-i*.002})`);
        cg.addColorStop(.4,`rgba(255,150,50,${.008-i*.001})`);
        cg.addColorStop(1,'rgba(255,100,20,0)');
        ctx.fillStyle=cg;ctx.beginPath();ctx.arc(sunX,sunY,cr,0,PI2);ctx.fill();
      }

      // Sun body
      const sg=ctx.createRadialGradient(sunX-sunR*.25,sunY-sunR*.25,0,sunX,sunY,sunR*sunP);
      sg.addColorStop(0,'#fffde8');sg.addColorStop(.2,'#fff176');sg.addColorStop(.5,'#ffb020');
      sg.addColorStop(.8,'#ff8800');sg.addColorStop(1,'#cc4400');
      ctx.beginPath();ctx.arc(sunX,sunY,sunR*sunP,0,PI2);ctx.fillStyle=sg;ctx.fill();

      // Sun surface detail
      ctx.save();ctx.beginPath();ctx.arc(sunX,sunY,sunR*sunP,0,PI2);ctx.clip();
      ctx.globalCompositeOperation='overlay';
      for(let i=0;i<8;i++){
        const a=t*.35+i*PI2/8;
        const tx=sunX+C(a)*sunR*.45,ty=sunY+S(a)*sunR*.35;
        const tg=ctx.createRadialGradient(tx,ty,0,tx,ty,sunR*.45);
        tg.addColorStop(0,`rgba(255,230,120,${.12+.04*S(t*3.5+i)})`);tg.addColorStop(1,'rgba(255,180,60,0)');
        ctx.fillStyle=tg;ctx.beginPath();ctx.arc(tx,ty,sunR*.45,0,PI2);ctx.fill();
      }
      ctx.restore();

      // Lens flare
      ctx.save();ctx.globalCompositeOperation='screen';
      const fd=Math.atan2(cy-sunY,cx-sunX);
      const flares=[[.06,'100,200,255'],[.05,'255,210,100'],[.04,'200,100,255'],[.035,'100,255,200'],[.03,'255,160,100'],[.025,'180,180,255']];
      for(let i=0;i<flares.length;i++){
        const dist=50+i*55,fx=sunX+C(fd)*dist,fy=sunY+S(fd)*dist,fr=4+i*3.5;
        const fg=ctx.createRadialGradient(fx,fy,0,fx,fy,fr);
        fg.addColorStop(0,`rgba(${flares[i][1]},${flares[i][0]})`);fg.addColorStop(1,`rgba(${flares[i][1]},0)`);
        ctx.fillStyle=fg;ctx.beginPath();ctx.arc(fx,fy,fr,0,PI2);ctx.fill();
      }
      ctx.restore();

      // ═══ ORBITAL PATHS (always visible, concentric ellipses) ═══
      if (!warp) {
        for (let i=0;i<TOTAL;i++) {
          const p = d.planets[i];
          const orbitRx = p.orbitR * minDim;
          const orbitRy = orbitRx * .3;
          const isActive = i === idx;
          ctx.beginPath();
          ctx.ellipse(sunX, sunY, orbitRx, orbitRy, 0, 0, PI2);
          ctx.strokeStyle = isActive ? 'rgba(6,182,212,.08)' : 'rgba(255,255,255,.018)';
          ctx.lineWidth = isActive ? 1 : .5;
          ctx.stroke();
        }
      }

      // ═══ ASTEROID BELT (always, between inner & outer planets) ═══
      const beltR = (.14 + .42 * .55) * minDim;
      const beltRy = beltR * .3;
      for(const ast of d.asteroids) {
        ast.angle += ast.spd * dt;
        const ax = sunX + C(ast.angle) * beltR * (ast.dist/.47);
        const ay = sunY + S(ast.angle) * beltRy * (ast.dist/.47) + ast.yOff * h;
        ctx.beginPath();ctx.arc(ax,ay,ast.sz*(warp?.5:1),0,PI2);
        ctx.fillStyle=`rgba(155,148,138,${ast.bri*(warp?.3:1)})`;ctx.fill();
      }

      // ═══ ALL 28 PLANETS (always orbiting the sun) ═══
      // Sort by Y position for depth ordering
      const planetOrder = d.planets.map((p,i) => {
        const a = p.startAngle + t * p.orbitSpeed;
        const orbitRx = p.orbitR * minDim;
        const orbitRy = orbitRx * .3;
        const px = sunX + C(a) * orbitRx;
        const py = sunY + S(a) * orbitRy;
        return { i, px, py, a, orbitRx, orbitRy };
      }).sort((a,b) => a.py - b.py);

      for (const po of planetOrder) {
        const i = po.i;
        const p = d.planets[i];
        const feat = FEATURES[i];
        const [c1,c2,c3] = gc(feat);
        const rgb1=hx(c1), rgb2=hx(c2), rgb3=hx(c3);

        const isActive = i === idx && !warp;
        // Active planet gets bigger, others are smaller
        const sizeMul = isActive ? 3.5 : 1;
        const pr = Math.max(2, p.baseSize * minDim * sizeMul);

        drawPlanet(po.px, po.py, pr, rgb1, rgb2, rgb3, p, t, !isActive);

        // Moons
        if (p.hasMoon && pr > 3) {
          drawMoon(po.px, po.py, pr, p.moonDist, p.moonSize, p.moonSpd, p.moonCol, t);
        }
        if (p.has2ndMoon && pr > 5) {
          drawMoon(po.px, po.py, pr, p.moon2Dist, p.moon2Size, p.moon2Spd, p.moon2Col, t);
        }

        // Glow for active planet
        if (isActive) {
          const glR = pr * 3;
          const gl = ctx.createRadialGradient(po.px, po.py, pr*.5, po.px, po.py, glR);
          gl.addColorStop(0,`rgba(${rgb1[0]},${rgb1[1]},${rgb1[2]},.07)`);
          gl.addColorStop(.5,`rgba(${rgb1[0]},${rgb1[1]},${rgb1[2]},.02)`);
          gl.addColorStop(1,'rgba(0,0,0,0)');
          ctx.save();ctx.globalCompositeOperation='screen';
          ctx.fillStyle=gl;ctx.beginPath();ctx.arc(po.px,po.py,glR,0,PI2);ctx.fill();
          ctx.restore();
        }
      }

      // ═══ VIGNETTE ═══
      const vg=ctx.createRadialGradient(cx,cy,minDim*.3,cx,cy,Math.max(w,h)*.8);
      vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.45)');
      ctx.fillStyle=vg;ctx.fillRect(0,0,w,h);

      animRef.current = requestAnimationFrame(frame);
    }
    animRef.current = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize); };
  }, [canvasRef, warpRef, activeIdxRef, phaseRef]);
}

// ─── Typewriter ──────────────────────────────────────────────────────────────
function TypewriterText({ text, className, delay = 0 }) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    setDisplayed('');
    if (!text) return;
    let i = 0, iv;
    const timer = setTimeout(() => {
      iv = setInterval(() => { i++; setDisplayed(text.slice(0, i)); if (i >= text.length) clearInterval(iv); }, 22);
    }, delay);
    return () => { clearTimeout(timer); clearInterval(iv); };
  }, [text, delay]);
  return <span className={className}>{displayed}<span className="animate-pulse">_</span></span>;
}

// ─── HUD ─────────────────────────────────────────────────────────────────────
function HUD({ currentIdx }) {
  const sN = String(currentIdx + 1).padStart(2, '0');
  const tN = String(TOTAL).padStart(2, '0');
  const pr = TOTAL > 0 ? ((currentIdx + 1) / TOTAL) * 100 : 0;
  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      <div className="absolute top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-cyan-500/30 rounded-tl-lg" />
      <div className="absolute top-4 right-4 w-12 h-12 border-r-2 border-t-2 border-cyan-500/30 rounded-tr-lg" />
      <div className="absolute bottom-20 sm:bottom-4 left-4 w-12 h-12 border-l-2 border-b-2 border-cyan-500/30 rounded-bl-lg" />
      <div className="absolute bottom-20 sm:bottom-4 right-4 w-12 h-12 border-r-2 border-b-2 border-cyan-500/30 rounded-br-lg" />
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span className="text-[10px] sm:text-xs font-mono font-bold text-cyan-400/80 tracking-[0.3em] uppercase">Sector {sN} / {tN}</span>
        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
      </div>
      <div className="absolute bottom-24 sm:bottom-6 left-1/2 -translate-x-1/2 w-48 sm:w-64">
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg,#06b6d4,#8b5cf6,#ec4899)' }} animate={{ width: `${pr}%` }} transition={{ duration: 0.5 }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[8px] font-mono text-slate-600">ORIGIN</span>
          <span className="text-[8px] font-mono text-slate-600">DESTINATION</span>
        </div>
      </div>
      <div className="absolute inset-0 opacity-[0.012]" style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,.03) 2px,rgba(255,255,255,.03) 4px)' }} />
    </div>
  );
}

// ─── Feature Panel ───────────────────────────────────────────────────────────
function FeaturePanel({ feature, visible }) {
  const [c1] = gc(feature);
  const navigate = useNavigate();
  const Icon = feature.icon;
  return (
    <AnimatePresence mode="wait">
      {visible && feature && (
        <motion.div key={feature.id+'-p'} className="w-full max-w-lg mx-auto px-4 text-center"
          initial={{ opacity:0,y:30 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-20 }} transition={{ duration:.5,delay:.3 }}>
          <motion.div className="mx-auto mb-3 w-10 h-10 rounded-xl flex items-center justify-center border border-white/10"
            style={{ background:`linear-gradient(135deg,${c1}22,${c1}08)` }}
            initial={{ scale:0 }} animate={{ scale:1 }} transition={{ delay:.35,type:'spring',stiffness:300 }}>
            <Icon size={20} style={{ color:c1 }} />
          </motion.div>
          <motion.h2 className="text-2xl sm:text-4xl font-black text-white mb-2 tracking-tight"
            style={{ textShadow:`0 0 40px ${c1}66, 0 0 80px ${c1}33` }}
            initial={{ opacity:0,scale:.9 }} animate={{ opacity:1,scale:1 }} transition={{ delay:.4,duration:.5 }}>
            {feature.title}
          </motion.h2>
          <motion.p className="text-sm sm:text-base font-mono text-cyan-400/80 tracking-wider mb-4"
            initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.6 }}>
            {feature.tagline}
          </motion.p>
          <div className="space-y-1.5 mb-4">
            {feature.highlights.slice(0,4).map((h,i)=>(
              <motion.div key={i} className="flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-300/80 font-mono"
                initial={{ opacity:0,x:-20 }} animate={{ opacity:1,x:0 }} transition={{ delay:.8+i*.15 }}>
                <span className="text-cyan-500/60">[+]</span>{h}
              </motion.div>
            ))}
          </div>
          <motion.button onClick={()=>navigate(feature.link)}
            className="pointer-events-auto inline-flex items-center gap-2 px-5 py-2 rounded-lg border border-cyan-500/30 bg-cyan-500/5 text-cyan-400 text-xs font-bold hover:bg-cyan-500/15 transition-colors"
            initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1.4 }}
            whileHover={{ scale:1.05 }} whileTap={{ scale:.95 }}>
            NAVIGATE <ChevronRight size={14} />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Finale ──────────────────────────────────────────────────────────────────
function Finale({ visible }) {
  const navigate = useNavigate();
  return (
    <AnimatePresence>
      {visible && (
        <motion.div className="absolute inset-0 z-30 flex flex-col items-center justify-center px-4"
          initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:1 }}>
          <motion.h2 className="text-3xl sm:text-5xl font-black text-white text-center mb-2 tracking-tight"
            style={{ textShadow:'0 0 60px rgba(6,182,212,.3)' }}
            initial={{ y:20,opacity:0 }} animate={{ y:0,opacity:1 }} transition={{ delay:.5 }}>
            YOUR ARSENAL.
          </motion.h2>
          <motion.h2 className="text-3xl sm:text-5xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent text-center mb-6"
            initial={{ y:20,opacity:0 }} animate={{ y:0,opacity:1 }} transition={{ delay:.7 }}>
            YOUR UNIVERSE.
          </motion.h2>
          <motion.p className="text-sm text-slate-400 font-mono mb-8 tracking-wider"
            initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1 }}>
            {TOTAL} SYSTEMS ONLINE. ALL SECTORS OPERATIONAL.
          </motion.p>
          <motion.button onClick={()=>navigate('/dashboard')}
            className="pointer-events-auto inline-flex items-center gap-3 px-10 py-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-purple-600 text-white font-black text-sm uppercase tracking-wider shadow-2xl shadow-cyan-600/20 hover:shadow-cyan-600/40 transition-shadow"
            initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:1.3,type:'spring' }}
            whileHover={{ scale:1.05 }} whileTap={{ scale:.95 }}>
            <Rocket size={20} /> ENTER THE GYM
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════ MAIN COMPONENT ══════════════════════════════════════
export default function Universe() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const warpRef = useRef(false);
  const activeIdxRef = useRef(-1);
  const phaseRef = useRef('intro');
  const [phase, setPhase] = useState('intro');
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [playing, setPlaying] = useState(true);
  const [showFeature, setShowFeature] = useState(false);
  const timerRef = useRef(null);

  useEffect(()=>{phaseRef.current=phase;},[phase]);
  useSpaceCanvas(canvasRef, warpRef, activeIdxRef, phaseRef);

  const currentFeature = currentIdx>=0&&currentIdx<TOTAL ? FEATURES[currentIdx] : null;

  const goToSector = useCallback((idx) => {
    if(idx>=TOTAL){setShowFeature(false);warpRef.current=false;setPhase('finale');return;}
    setShowFeature(false);warpRef.current=true;setPhase('warp');
    setTimeout(()=>{warpRef.current=false;setCurrentIdx(idx);activeIdxRef.current=idx;setPhase('feature');setShowFeature(true);},WARP_MS);
  },[]);

  useEffect(()=>{
    if(!playing)return;clearTimeout(timerRef.current);
    if(phase==='intro')timerRef.current=setTimeout(()=>goToSector(0),INTRO_MS);
    else if(phase==='feature')timerRef.current=setTimeout(()=>goToSector(currentIdx+1),HOLD_MS);
    return()=>clearTimeout(timerRef.current);
  },[phase,currentIdx,playing,goToSector]);

  useEffect(()=>{
    function onKey(e){
      if(e.key===' '||e.key==='k'){e.preventDefault();setPlaying(p=>!p);}
      else if(e.key==='ArrowRight'||e.key==='ArrowDown'){e.preventDefault();clearTimeout(timerRef.current);goToSector(Math.min(currentIdx+1,TOTAL));}
      else if(e.key==='ArrowLeft'||e.key==='ArrowUp'){e.preventDefault();clearTimeout(timerRef.current);if(currentIdx>0)goToSector(currentIdx-1);}
      else if(e.key==='Escape')navigate(-1);
    }
    let wt=null;
    function onWheel(e){e.preventDefault();clearTimeout(wt);wt=setTimeout(()=>{clearTimeout(timerRef.current);if(e.deltaY>0)goToSector(Math.min(currentIdx+1,TOTAL));else if(currentIdx>0)goToSector(currentIdx-1);},100);}
    window.addEventListener('keydown',onKey);window.addEventListener('wheel',onWheel,{passive:false});
    return()=>{window.removeEventListener('keydown',onKey);window.removeEventListener('wheel',onWheel);};
  },[currentIdx,goToSector,navigate]);

  const touchRef=useRef(null);
  useEffect(()=>{
    function ts(e){touchRef.current=e.touches[0].clientY;}
    function te(e){if(touchRef.current===null)return;const dy=touchRef.current-e.changedTouches[0].clientY;touchRef.current=null;if(A(dy)<40)return;clearTimeout(timerRef.current);if(dy>0)goToSector(Math.min(currentIdx+1,TOTAL));else if(currentIdx>0)goToSector(currentIdx-1);}
    window.addEventListener('touchstart',ts,{passive:true});window.addEventListener('touchend',te,{passive:true});
    return()=>{window.removeEventListener('touchstart',ts);window.removeEventListener('touchend',te);};
  },[currentIdx,goToSector]);

  return (
    <div className="fixed inset-0 z-50 bg-[#020308] overflow-hidden select-none">
      <canvas ref={canvasRef} className="absolute inset-0" />

      {phase!=='intro'&&phase!=='finale'&&<HUD currentIdx={currentIdx} />}

      <AnimatePresence>
        {phase==='intro'&&(
          <motion.div className="absolute inset-0 z-30 flex flex-col items-center justify-center" exit={{opacity:0}} transition={{duration:.8}}>
            <motion.div initial={{scale:.5,opacity:0}} animate={{scale:1,opacity:1}} transition={{duration:1.2,ease:[.22,1,.36,1]}} className="text-center">
              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter mb-4"
                style={{textShadow:'0 0 80px rgba(6,182,212,.4),0 0 160px rgba(139,92,246,.2)'}}>
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">FITTRACK</span>
                <br/><span className="text-white">UNIVERSE</span>
              </h1>
            </motion.div>
            <motion.div className="mt-6" initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1.2}}>
              <TypewriterText text="INITIATING DEEP SPACE SCAN..." className="text-xs sm:text-sm font-mono text-cyan-500/70 tracking-[0.25em]" delay={1400} />
            </motion.div>
            <motion.div className="mt-8 flex items-center gap-2" initial={{opacity:0}} animate={{opacity:1}} transition={{delay:2.2}}>
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-[10px] font-mono text-slate-500 tracking-widest">{TOTAL} SECTORS DETECTED</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {phase==='feature'&&currentFeature&&(
        <div className="absolute inset-0 z-20 flex flex-col items-end justify-end pointer-events-none" style={{paddingBottom:'max(10rem,22vh)'}}>
          <div className="w-full pointer-events-none"><FeaturePanel feature={currentFeature} visible={showFeature} /></div>
        </div>
      )}

      <AnimatePresence>
        {phase==='warp'&&(
          <motion.div className="absolute inset-0 z-25 pointer-events-none" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.2}}>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,.08)_0%,transparent_60%)]" />
          </motion.div>
        )}
      </AnimatePresence>

      <Finale visible={phase==='finale'} />

      <div className="absolute bottom-28 sm:bottom-12 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4">
        <button onClick={()=>{clearTimeout(timerRef.current);if(currentIdx>0)goToSector(currentIdx-1);}}
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all">
          <SkipBack size={16} />
        </button>
        <button onClick={()=>setPlaying(p=>!p)}
          className="w-12 h-12 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white hover:bg-white/20 transition-all">
          {playing?<Pause size={20}/>:<Play size={20}/>}
        </button>
        <button onClick={()=>{clearTimeout(timerRef.current);goToSector(Math.min(currentIdx+1,TOTAL));}}
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all">
          <SkipForward size={16} />
        </button>
      </div>

      {phase!=='intro'&&phase!=='finale'&&(
        <div className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-1.5">
          {FEATURES.map((f,i)=>{
            const [c1]=gc(f);const active=i===currentIdx;
            return(
              <button key={f.id} onClick={()=>{clearTimeout(timerRef.current);goToSector(i);}} className="group relative" title={f.title}>
                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${active?'scale-150':'opacity-40 hover:opacity-70'}`}
                  style={{background:active?c1:'#64748b',boxShadow:active?`0 0 8px ${c1}`:'none'}} />
                {active&&<div className="absolute right-5 top-1/2 -translate-y-1/2 text-[9px] font-mono text-white/60 whitespace-nowrap hidden sm:block">{f.title}</div>}
              </button>
            );
          })}
        </div>
      )}

      <button onClick={()=>navigate(-1)} className="absolute top-5 left-4 z-40 flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm font-bold">
        <ArrowLeft size={16}/> Exit
      </button>
    </div>
  );
}
