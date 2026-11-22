'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, Egg, BookOpen, X } from 'lucide-react';

type Rar = 'C' | 'R' | 'E';
type Species = { name: string; r: Rar; e: string };
type Pet = Species & { id: number; readyAt: number };

const CD = (16 * 60 + 42) * 60000;
const MAX = 15;
const COST = 100;
const REWARD = 25;
const RC: Record<Rar, string> = { C: '#6b7280', R: '#0ea5e9', E: '#a855f7' };
const POOL: Species[] = [
  { name: 'Ceruh', r: 'C', e: '🐍' }, { name: 'Glacius', r: 'R', e: '🐉' }, { name: 'Blazon', r: 'R', e: '🦁' },
  { name: 'Mochi', r: 'C', e: '🐱' }, { name: 'Bubu', r: 'C', e: '🐸' }, { name: 'Nocta', r: 'E', e: '🦉' }, { name: 'Pyra', r: 'E', e: '🦊' },
];
const POS: number[][] = [
  [50, 30], [72, 36], [30, 38], [58, 46], [22, 48], [78, 48], [44, 54], [66, 56],
  [34, 30], [84, 40], [16, 40], [52, 38], [60, 30], [26, 52], [72, 52],
];

const fmt = (ms: number) => {
  if (ms <= 0) return 'Klaim';
  const m = Math.floor(ms / 60000);
  return Math.floor(m / 60) + 'h ' + (m % 60) + 'm';
};

export default function PetPage() {
  const router = useRouter();
  const [coins, setCoins] = useState(300);
  const [now, setNow] = useState(0);
  const [pets, setPets] = useState<Pet[]>([]);
  const [sheet, setSheet] = useState<'' | 'kelola' | 'katalog'>('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    const t = Date.now();
    setNow(t);
    setPets([POOL[1], POOL[2], POOL[0]].map((s, i) => ({ ...s, id: i + 1, readyAt: t + CD })));
    const iv = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(iv);
  }, []);

  const say = (s: string) => { setToast(s); setTimeout(() => setToast(''), 2500); };
  const ready = pets.filter(p => p.readyAt <= now);

  const claim = (ids: number[]) => {
    if (!ids.length) return;
    const t = Date.now();
    setCoins(c => c + ids.length * REWARD);
    setPets(ps => ps.map(p => (ids.includes(p.id) ? { ...p, readyAt: t + CD } : p)));
    say('+' + ids.length * REWARD + ' sparkle');
  };

  const gacha = () => {
    if (pets.length >= MAX) { say('Kandang penuh (' + MAX + '/' + MAX + ')'); return; }
    if (coins < COST) { say('Sparkle kurang (butuh ' + COST + ')'); return; }
    const roll = Math.random() * 100;
    const r: Rar = roll < 10 ? 'E' : roll < 40 ? 'R' : 'C';
    const list = POOL.filter(s => s.r === r);
    const s = list[Math.floor(Math.random() * list.length)];
    setCoins(c => c - COST);
    setPets(ps => [...ps, { ...s, id: Date.now(), readyAt: Date.now() + CD }]);
    say('Dapat ' + s.name + ' (' + r + ')!');
  };

  return (
    <div className="min-h-screen max-w-md mx-auto relative overflow-hidden text-slate-800" style={{ background: 'linear-gradient(180deg,#7ec8e8 0%,#b5e0f2 55%,#d6eef8 100%)' }}>
      <div className="absolute top-24 right-6 w-28 h-28 rounded-full bg-yellow-100/90 blur-[1px]" />
      <div className="absolute top-40 -left-10 w-56 h-24 rounded-full bg-white/50" />
      <div className="absolute top-72 -right-10 w-64 h-28 rounded-full bg-white/40" />

      <div className="relative z-10 flex items-center justify-between gap-2 px-4 pt-6">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={() => router.back()} aria-label="Kembali" className="p-1"><ArrowLeft className="w-6 h-6 text-sky-900" /></button>
          <h1 className="text-2xl font-extrabold text-sky-900 truncate">KomikZoo</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => claim(ready.map(p => p.id))}
            className={'rounded-full px-3 py-2 text-sm font-extrabold flex items-center gap-1.5 shadow ' + (ready.length ? 'bg-orange-400 text-white' : 'bg-orange-200/70 text-orange-900/60')}
          >
            Klaim Semua
            <span className="rounded-full bg-white/80 text-orange-700 px-1.5 text-xs">{ready.length}</span>
          </button>
          <div className="rounded-full bg-sky-500 text-white px-3 py-2 text-sm font-extrabold flex items-center gap-1 shadow">
            <Sparkles className="w-4 h-4" /> {coins}
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-16 h-[460px] w-full">
        <div className="absolute left-[12%] top-[40%] w-[76%] h-[36%]" style={{ background: 'linear-gradient(180deg,#a8825a,#6b4f33)', clipPath: 'polygon(0 0,100% 0,86% 48%,62% 100%,40% 72%,16% 42%)' }} />
        <div className="absolute left-[4%] top-[18%] w-[92%] h-[42%] rounded-[50%]" style={{ background: 'radial-gradient(ellipse at 50% 40%,#7cc640 0%,#4e9e2a 100%)', border: '10px solid #9c7a52', boxShadow: '0 12px 0 #7a5c3c' }} />

        {pets.map((p, i) => {
          const [x, y] = POS[i % POS.length];
          const left = p.readyAt - now;
          const ok = left <= 0;
          return (
            <div key={p.id} className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center" style={{ left: x + '%', top: y + '%' }}>
              <button
                onClick={() => ok && claim([p.id])}
                className={'mb-0.5 rounded-full px-2.5 py-1 text-xs font-extrabold shadow flex items-center gap-1 ' + (ok ? 'bg-emerald-500 text-white' : 'bg-white/90 text-slate-700')}
              >
                <Sparkles className="w-3 h-3" /> {now ? fmt(left) : '...'}
              </button>
              <span className="text-5xl leading-none drop-shadow">{p.e}</span>
              <span className="mt-0.5 flex items-center gap-1 rounded-full bg-white/90 pl-0.5 pr-2 py-0.5 text-xs font-extrabold shadow">
                <span className="w-4 h-4 rounded-full text-[10px] text-white flex items-center justify-center" style={{ background: RC[p.r] }}>{p.r}</span>
                {p.name}
              </span>
            </div>
          );
        })}
      </div>

      {toast && <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 rounded-full bg-slate-900/85 text-white px-4 py-2 text-sm font-bold">{toast}</div>}

      <div className="fixed bottom-4 left-0 right-0 max-w-md mx-auto px-4 z-20">
        <div className="flex gap-2 rounded-3xl bg-white/90 p-2 shadow-xl">
          <button onClick={gacha} className="flex-[1.1] rounded-2xl bg-gradient-to-b from-violet-400 to-violet-600 text-white py-3 font-extrabold flex items-center justify-center gap-2">
            <Egg className="w-6 h-6 text-yellow-300" /> Gacha
          </button>
          <button onClick={() => setSheet('kelola')} className="flex-[1.4] rounded-2xl bg-gradient-to-b from-emerald-400 to-teal-500 text-white py-3 font-extrabold flex items-center justify-center gap-2">
            Kelola <span className="rounded-lg bg-white/90 text-slate-800 px-2 text-sm">{pets.length}/{MAX}</span>
          </button>
          <button onClick={() => setSheet('katalog')} className="flex-1 rounded-2xl bg-white text-slate-800 py-2 font-extrabold flex flex-col items-center justify-center text-sm border border-slate-200">
            <BookOpen className="w-5 h-5 text-violet-500" /> Katalog
          </button>
        </div>
      </div>

      {sheet && (
        <div className="fixed inset-0 z-30 bg-black/50 flex items-end" onClick={() => setSheet('')}>
          <div className="w-full max-w-md mx-auto max-h-[70vh] overflow-y-auto rounded-t-3xl bg-white p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-extrabold">{sheet === 'kelola' ? 'Kelola Pet (' + pets.length + '/' + MAX + ')' : 'Katalog Pet'}</h2>
              <button onClick={() => setSheet('')} aria-label="Tutup"><X className="w-6 h-6" /></button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(sheet === 'kelola' ? pets : POOL).map((p, i) => (
                <div key={i} className="rounded-2xl border border-slate-200 p-3 flex flex-col items-center text-center">
                  <span className="text-4xl">{p.e}</span>
                  <span className="mt-1 text-sm font-extrabold">{p.name}</span>
                  <span className="mt-1 rounded-full px-2 text-[10px] font-extrabold text-white" style={{ background: RC[p.r] }}>{p.r}</span>
                  {sheet === 'katalog' && pets.some(x => x.name === p.name) && <span className="mt-1 text-[10px] font-bold text-emerald-600">Dimiliki</span>}
                </div>
              ))}
            </div>
            {sheet === 'kelola' && !pets.length && <p className="text-center text-slate-500 py-6">Belum punya pet. Coba Gacha dulu.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
