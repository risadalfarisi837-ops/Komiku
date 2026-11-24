'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Gift } from 'lucide-react';

type C = { x: number; y: number; vx: number; vy: number; w: number; h: number; r: number; vr: number; c: string };
const PALETTE = ['#fbbf24', '#f472b6', '#38bdf8', '#a78bfa', '#34d399', '#fb7185', '#ffffff'];

/** Ledakan confetti dari tengah layar. Dipakai di efek gift dan hasil gacha. */
export function Confetti({ colors = PALETTE, count = 110, duration = 2600, origin = 0.45 }: { colors?: string[]; count?: number; duration?: number; origin?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const key = colors.join(',');
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const cols = key.split(',');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = cv.clientWidth, h = cv.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const ps: C[] = Array.from({ length: count }, () => {
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.15;
      const sp = 6 + Math.random() * 9;
      return { x: w / 2, y: h * origin, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, w: 6 + Math.random() * 6, h: 4 + Math.random() * 6, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.4, c: cols[Math.floor(Math.random() * cols.length)] };
    });
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const el = t - t0;
      ctx.clearRect(0, 0, w, h);
      const fade = el > duration - 600 ? Math.max(0, (duration - el) / 600) : 1;
      for (const p of ps) {
        p.vy += 0.22; p.vx *= 0.985; p.vy *= 0.992;
        p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.globalAlpha = fade; ctx.fillStyle = p.c;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      if (el < duration) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [key, count, duration, origin]);
  return <canvas ref={ref} className="fixed inset-0 w-full h-full pointer-events-none z-[95]" />;
}

const CSS = `
@keyframes gfFade{from{opacity:0}to{opacity:1}}
@keyframes gfDrop{from{transform:translateY(-240px) scale(.6);opacity:0}to{transform:none;opacity:1}}
@keyframes gfShake{0%,100%{transform:rotate(0)}20%{transform:rotate(-12deg)}40%{transform:rotate(12deg)}60%{transform:rotate(-9deg)}80%{transform:rotate(9deg)}}
@keyframes gfOpen{to{transform:scale(1.8);opacity:0}}
@keyframes gfPop{from{transform:scale(.4) translateY(14px);opacity:0}to{transform:none;opacity:1}}
@keyframes gfGlow{0%{opacity:0;transform:scale(.4)}45%{opacity:1}100%{opacity:.85;transform:scale(1.15)}}
@keyframes gfSpin{to{transform:rotate(360deg)}}
@keyframes gfRing{0%{transform:scale(.5);opacity:.9}100%{transform:scale(3);opacity:0}}
`;

/** Efek saat gift terkirim: kotak jatuh, goyang, terbuka, confetti meledak. Ketuk layar untuk menutup. */
export default function GiftEffect({ show, onDone, title = 'Gift terkirim!', sub, duration = 3000, visual }: { show: boolean; onDone: () => void; title?: string; sub?: string; duration?: number; visual?: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [burst, setBurst] = useState(false);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!show) { setBurst(false); return; }
    const a = setTimeout(() => setBurst(true), 1100);
    const b = setTimeout(() => done.current(), duration);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [show, duration]);

  if (!mounted || !show) return null;
  return createPortal(
    <div
      onClick={() => done.current()}
      className="fixed inset-0 z-[90] flex flex-col items-center justify-center select-none"
      style={{ background: 'radial-gradient(circle at 50% 45%,rgba(30,20,60,.78),rgba(5,7,15,.92) 75%)', animation: 'gfFade .25s ease-out' }}
    >
      <style>{CSS}</style>
      <div className="absolute w-80 h-80 rounded-full" style={{ background: 'radial-gradient(circle,rgba(253,224,71,.55),transparent 65%)', animation: 'gfGlow 3s ease-out both' }} />
      <div
        className="absolute w-96 h-96 rounded-full opacity-0"
        style={{
          background: 'conic-gradient(from 0deg,transparent,rgba(253,224,71,.55),transparent,rgba(244,114,182,.5),transparent,rgba(253,224,71,.55),transparent)',
          WebkitMaskImage: 'radial-gradient(circle,#000 25%,transparent 68%)', maskImage: 'radial-gradient(circle,#000 25%,transparent 68%)',
          animation: 'gfFade .5s ease-out 1.1s forwards, gfSpin 7s linear infinite',
        }}
      />
      {[0, 1].map(i => (
        <span key={i} className="absolute rounded-full border-2 border-amber-300 opacity-0" style={{ width: 120, height: 120, animation: 'gfRing 1.2s ease-out ' + (1.1 + i * 0.25) + 's' }} />
      ))}
      <div className={'relative flex items-center justify-center ' + (visual ? 'w-48 h-48' : 'w-28 h-28')}>
        <div
          className="relative w-28 h-28 rounded-3xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg,#f472b6,#a855f7)',
            boxShadow: '0 10px 40px rgba(168,85,247,.6)',
            animation: 'gfDrop .6s cubic-bezier(.3,1.5,.5,1) both, gfShake .5s ease-in-out .6s, gfOpen .4s ease-in 1.1s forwards',
          }}
        >
          <Gift className="w-14 h-14 text-white" />
        </div>
        {visual && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0" style={{ animation: 'gfPop .55s cubic-bezier(.2,1.4,.4,1) 1.15s both' }}>
            {visual}
          </div>
        )}
      </div>
      <p className="relative mt-8 text-3xl font-black text-white drop-shadow-lg text-center px-6 opacity-0" style={{ animation: 'gfPop .5s cubic-bezier(.2,1.4,.4,1) 1.2s both' }}>{title}</p>
      {sub && <p className="relative mt-2 text-lg font-bold text-amber-200 text-center px-8 opacity-0" style={{ animation: 'gfPop .5s cubic-bezier(.2,1.4,.4,1) 1.4s both' }}>{sub}</p>}
      {burst && <Confetti />}
    </div>,
    document.body
  );
}
