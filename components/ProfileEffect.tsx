'use client';
import { useEffect, useRef } from 'react';
import { EFFECT_CATALOG, type EffectItem } from '@/lib/effects';

type P = { x: number; y: number; vx: number; vy: number; r: number; a: number; ph: number; rot: number; vr: number; c: string };

function spawn(e: EffectItem, w: number, h: number, fresh: boolean): P {
  const c = Math.random() < 0.5 || !e.color2 ? e.color : e.color2;
  const p: P = { x: Math.random() * w, y: Math.random() * h, vx: 0, vy: 0, r: 2, a: 1, ph: Math.random() * 6.28, rot: Math.random() * 6.28, vr: 0, c };
  switch (e.kind) {
    case 'petal':   p.y = fresh ? Math.random() * h : -10; p.r = 4 + Math.random() * 4; p.vy = 0.4 + Math.random() * 0.6; p.vx = 0.2 + Math.random() * 0.4; p.vr = (Math.random() - 0.5) * 0.06; break;
    case 'snow':    p.y = fresh ? Math.random() * h : -6;  p.r = 1.5 + Math.random() * 2.5; p.vy = 0.3 + Math.random() * 0.7; p.vx = (Math.random() - 0.5) * 0.3; break;
    case 'ember':   p.y = fresh ? Math.random() * h : h + 6; p.r = 1 + Math.random() * 2; p.vy = -(0.4 + Math.random() * 0.9); p.vx = (Math.random() - 0.5) * 0.4; break;
    case 'rain':    p.y = fresh ? Math.random() * h : -20; p.r = 1; p.vy = 4 + Math.random() * 3; p.vx = -0.8; p.a = 0.5 + Math.random() * 0.5; break;
    case 'firefly': p.r = 1.5 + Math.random() * 2; p.vx = (Math.random() - 0.5) * 0.3; p.vy = (Math.random() - 0.5) * 0.3; break;
    default:        p.r = 1 + Math.random() * 2.5; p.vx = (Math.random() - 0.5) * 0.1; p.vy = (Math.random() - 0.5) * 0.1; // sparkle
  }
  return p;
}

export default function ProfileEffect({ effectKey, item, min = 12, className = '', lite = false }: { effectKey?: string; item?: EffectItem; min?: number; className?: string; lite?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const e = item ?? (effectKey ? EFFECT_CATALOG[effectKey] : undefined);

  useEffect(() => {
    const cv = ref.current;
    if (!cv || !e || e.url) return;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    let w = 0, h = 0, raf = 0, ps: P[] = [];
    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.max(min, Math.min(lite ? 28 : 60, Math.round((w * h) / 9000)));
      ps = Array.from({ length: n }, () => spawn(e, w, h, true));
    };
    fit();
    const ro = new ResizeObserver(fit); ro.observe(cv);

    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      if (document.hidden) return;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        ctx.fillStyle = p.c; ctx.strokeStyle = p.c;
        if (e.kind === 'sparkle' || e.kind === 'firefly') {
          const tw = 0.5 + 0.5 * Math.sin(t / (e.kind === 'firefly' ? 700 : 450) + p.ph);
          ctx.globalAlpha = tw; ctx.shadowColor = p.c; ctx.shadowBlur = lite ? 0 : e.kind === 'firefly' ? 10 : 6;
          if (e.kind === 'sparkle') { // bintang 4 sudut
            const s = p.r * 2.2;
            ctx.beginPath(); ctx.moveTo(p.x, p.y - s); ctx.lineTo(p.x + s * 0.25, p.y - s * 0.25); ctx.lineTo(p.x + s, p.y);
            ctx.lineTo(p.x + s * 0.25, p.y + s * 0.25); ctx.lineTo(p.x, p.y + s); ctx.lineTo(p.x - s * 0.25, p.y + s * 0.25);
            ctx.lineTo(p.x - s, p.y); ctx.lineTo(p.x - s * 0.25, p.y - s * 0.25); ctx.closePath(); ctx.fill();
          } else { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fill(); p.vx += (Math.random() - 0.5) * 0.02; p.vy += (Math.random() - 0.5) * 0.02; p.vx *= 0.99; p.vy *= 0.99; }
          ctx.shadowBlur = 0;
          if (p.x < -10 || p.x > w + 10 || p.y < -10 || p.y > h + 10) { p.x = Math.random() * w; p.y = Math.random() * h; }
        } else if (e.kind === 'petal') {
          p.x += Math.sin(t / 900 + p.ph) * 0.4;
          ctx.globalAlpha = 0.85; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, 6.28); ctx.fill(); ctx.restore();
        } else if (e.kind === 'rain') {
          ctx.globalAlpha = p.a; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.vx * 3, p.y - p.vy * 3); ctx.stroke();
        } else { // snow / ember
          const fade = e.kind === 'ember' ? Math.max(0, Math.min(1, p.y / h)) : 0.9;
          ctx.globalAlpha = fade; if (e.kind === 'ember' && !lite) { ctx.shadowColor = p.c; ctx.shadowBlur = 6; }
          ctx.beginPath(); ctx.arc(p.x + Math.sin(t / 1000 + p.ph) * 4, p.y, p.r, 0, 6.28); ctx.fill(); ctx.shadowBlur = 0;
        }
        ctx.globalAlpha = 1;
        if (p.y > h + 12 || p.y < -24 || p.x > w + 14) {
          if (e.kind === 'petal' || e.kind === 'snow' || e.kind === 'ember' || e.kind === 'rain') ps[i] = spawn(e, w, h, false);
        }
      }
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [e, min]);

  if (!e) return null;
  if (e.url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={e.url} alt="" loading="lazy" className={'absolute inset-0 w-full h-full object-cover pointer-events-none ' + className} />;
  }
  return <canvas ref={ref} className={'absolute inset-0 w-full h-full pointer-events-none ' + className} />;
}
