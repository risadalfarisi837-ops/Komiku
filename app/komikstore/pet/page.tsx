'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText } from 'lucide-react';

type Rar = 'C' | 'R' | 'E';
type Species = { name: string; r: Rar; e: string; img?: string };
type Pet = Species & { id: number; readyAt: number };

const ISLAND_IMG = '';
const CD = (16 * 60 + 42) * 60000;
const MAX = 15;
const COST = 100;
const REWARD = 25;
const RC: Record<Rar, string> = { C: '#64748b', R: '#0ea5e9', E: '#a855f7' };
const POOL: Species[] = [
  { name: 'Ceruh', r: 'C', e: '🐍' },
  { name: 'Glacius', r: 'R', e: '🐉' },
  { name: 'Blazon', r: 'R', e: '🦁' },
  { name: 'Mochi', r: 'C', e: '🐱' }, { name: 'Bubu', r: 'C', e: '🐸' },
  { name: 'Nocta', r: 'E', e: '🦉' }, { name: 'Pyra', r: 'E', e: '🦊' },
];
const POS: number[][] = [
  [48, 30], [70, 34], [28, 38], [58, 46], [18, 50], [78, 50], [40, 54], [66, 58],
  [34, 32], [84, 44], [14, 42], [50, 40], [60, 28], [26, 56], [74, 54],
];

const fmt = (ms: number) => {
  if (ms <= 0) return 'Klaim';
  const m = Math.floor(ms / 60000);
  return Math.floor(m / 60) + 'h ' + (m % 60) + 'm';
};
const btn3d = (c: string) => ({ boxShadow: '0 5px 0 ' + c });

function Island() {
  if (ISLAND_IMG) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={ISLAND_IMG} alt="" className="w-full h-full object-contain" />;
  }
  return (
    <svg viewBox="0 0 400 345" className="w-full h-full">
      <defs>
        <radialGradient id="kzg" cx="50%" cy="40%" r="65%"><stop offset="0" stopColor="#92d452" /><stop offset="1" stopColor="#4a9828" /></radialGradient>
        <linearGradient id="kzr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#bf9a6e" /><stop offset="1" stopColor="#7a5b3d" /></linearGradient>
        <linearGradient id="kzd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#a98557" /><stop offset="1" stopColor="#5f4630" /></linearGradient>
      </defs>
      <path d="M28 150 L36 190 L58 214 L80 246 L112 262 L134 296 L168 306 L190 338 L216 318 L240 304 L268 284 L300 262 L330 236 L350 206 L366 178 L372 150 Z" fill="url(#kzd)" />
      <path d="M60 200 L90 236 L120 226 Z M250 270 L290 250 L270 232 Z M170 280 L200 260 L214 296 Z" fill="#000" opacity=".12" />
      <path d="M96 232 L124 214 L150 250 L128 268 Z M300 220 L330 206 L322 240 Z" fill="#fff" opacity=".12" />
      <path d="M30 130 Q40 90 90 66 L108 44 L128 64 L158 50 L176 66 L236 66 L258 48 L284 64 L316 56 L338 80 Q372 96 372 130 Z" fill="url(#kzr)" />
      <ellipse cx="200" cy="150" rx="170" ry="82" fill="url(#kzg)" stroke="#9a7a52" strokeWidth="9" />
      <ellipse cx="96" cy="122" rx="32" ry="11" fill="#2f86c9" stroke="#e6d27a" strokeWidth="5" />
      <ellipse cx="108" cy="205" rx="34" ry="10" fill="#2f86c9" stroke="#e6d27a" strokeWidth="5" />
      <ellipse cx="300" cy="206" rx="36" ry="10" fill="#2f86c9" stroke="#e6d27a" strokeWidth="5" />
      <path d="M22 168 L40 150 L52 176 L36 196 Z M376 168 L360 150 L348 176 L364 196 Z M150 236 L176 226 L190 246 L160 256 Z M240 238 L270 228 L282 248 L252 256 Z" fill="url(#kzr)" />
      <ellipse cx="150" cy="300" rx="52" ry="13" fill="#fff" opacity=".6" />
      <ellipse cx="290" cy="270" rx="46" ry="12" fill="#fff" opacity=".55" />
      <ellipse cx="205" cy="322" rx="36" ry="10" fill="#fff" opacity=".6" />
    </svg>
  );
}

export default function PetPage() {
  const router = useRouter();
  const [coins, setCoins] = useState(300);
  const [now, setNow] = useState(0);
  const [pets, setPets] = useState<Pet[]>([]);
  const [sheet, setSheet] = useState<'' | 'kelola' | 'katalog'>('');
  const [toast, setToast] = useState('');
  const [music, setMusic] = useState(true);

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
    <div className="min-h-screen max-w-md mx-auto relative overflow-hidden text-slate-800" style={{ background: 'linear-gradient(180deg,#86c8e8 0%,#a9dcef 50%,#c4e6f4 100%)' }}>
      <div className="absolute top-20 right-4 w-24 h-24 rounded-full bg-yellow-100" style={{ boxShadow: '0 0 0 22px rgba(254,249,195,.35)' }} />
      <div className="absolute top-[22%] -left-6 w-56 h-72 rounded-full bg-white/30" />
      <div className="absolute top-[30%] left-[28%] w-40 h-80 rounded-full bg-white/30" />
      <div className="absolute top-[26%] -right-10 w-52 h-80 rounded-full bg-white/30" />

      <div className="relative z-20 flex items-center gap-2 px-4 pt-6">
        <button onClick={() => router.back()} aria-label="Kembali" className="p-1 -ml-1"><ArrowLeft className="w-6 h-6" style={{ color: '#1b4a6b' }} /></button>
        <h1 className="text-[26px] leading-none font-extrabold" style={{ color: '#1b4a6b' }}>KomikZoo</h1>
        <button
          onClick={() => setMusic(m => !m)}
          aria-label="Musik"
          className={'w-9 h-9 rounded-full bg-white flex items-center justify-center text-lg shadow ' + (music ? 'text-slate-700' : 'text-slate-300 line-through')}
        >♪</button>
        <div className="flex-1" />
        <button
          onClick={() => claim(ready.map(p => p.id))}
          className={'rounded-full pl-3 pr-1.5 py-1.5 text-sm font-extrabold flex items-center gap-1.5 ' + (ready.length ? 'bg-orange-400 text-white' : 'bg-orange-200/70 text-amber-800/70')}
          style={btn3d(ready.length ? '#d97706' : 'rgba(180,120,60,.25)')}
        >
          Klaim Semua
          <span className={'min-w-[22px] h-[22px] rounded-full text-xs flex items-center justify-center text-white ' + (ready.length ? 'bg-red-500' : 'bg-rose-400/70')}>{ready.length}</span>
        </button>
        <div className="rounded-full px-3 py-1.5 text-lg font-extrabold text-white flex items-center gap-1.5" style={{ background: 'linear-gradient(180deg,#4fb4ee,#2f95dc)', boxShadow: '0 4px 0 #2478b5' }}>
          <span className="text-base">✦</span>{coins}
        </div>
      </div>

      <div className="relative z-10" style={{ height: 'calc(100vh - 230px)' }}>
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 aspect-[400/345]">
          <Island />
          {pets.map((p, i) => {
            const [x, y] = POS[i % POS.length];
            const left = p.readyAt - now;
            const ok = left <= 0;
            return (
              <div key={p.id} className="absolute -translate-x-1/2 -translate-y-[70%] flex flex-col items-center" style={{ left: x + '%', top: y + '%' }}>
                <button
                  onClick={() => ok && claim([p.id])}
                  className={'mb-0.5 rounded-full pl-2 pr-3 py-1 text-sm font-extrabold shadow-md flex items-center gap-1 ' + (ok ? 'bg-emerald-500 text-white' : 'bg-white text-slate-700')}
                >
                  <span className={ok ? 'text-white' : 'text-sky-300'}>✦</span>{now ? fmt(left) : '...'}
                </button>
                {p.img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.img} alt={p.name} className="w-24 h-24 object-contain" />
                ) : (
                  <span className="text-6xl leading-none drop-shadow-md">{p.e}</span>
                )}
                <span className="-mt-1 flex items-center gap-1 rounded-full bg-white/90 pl-1 pr-3 py-0.5 text-base font-extrabold shadow" style={{ color: '#2f4a3a' }}>
                  <span className="w-6 h-6 rounded-full text-xs text-white flex items-center justify-center" style={{ background: RC[p.r] }}>{p.r}</span>
                  {p.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {toast && <div className="fixed top-24 left-1/2 -translate-x-1/2 z-40 rounded-full bg-slate-900/85 text-white px-4 py-2 text-sm font-bold">{toast}</div>}

      <div className="fixed bottom-3 left-0 right-0 max-w-md mx-auto px-3 z-20">
        <div className="flex gap-2.5 rounded-[28px] bg-white/95 p-3 shadow-xl">
          <button onClick={gacha} className="flex-[1.15] rounded-2xl text-white py-3.5 text-xl font-extrabold flex items-center justify-center gap-2" style={{ background: 'linear-gradient(180deg,#a66cf0,#7a3fd0)', ...btn3d('#5b2aa8') }}>
            <span className="w-6 h-8 rounded-[50%] bg-gradient-to-b from-yellow-200 to-yellow-500" /> Gacha
          </button>
          <button onClick={() => setSheet('kelola')} className="relative flex-[1.5] rounded-2xl text-white py-3.5 text-xl font-extrabold flex items-center justify-center gap-2" style={{ background: 'linear-gradient(180deg,#2fd3a6,#14a98a)', ...btn3d('#0d7d68') }}>
            <span className="text-3xl leading-none">{pets[0]?.e ?? '🥚'}</span> Kelola
            <span className="rounded-xl bg-white/90 text-slate-800 px-2.5 text-lg">{pets.length}/{MAX}</span>
            <span className="absolute -top-2 -right-1 min-w-[26px] h-[26px] rounded-full bg-red-500 text-white text-sm flex items-center justify-center border-2 border-white">{ready.length}</span>
          </button>
          <button onClick={() => setSheet('katalog')} className="flex-1 rounded-2xl bg-white text-slate-800 py-2 text-base font-extrabold flex flex-col items-center justify-center border border-slate-200" style={btn3d('#e2e8f0')}>
            <FileText className="w-7 h-7 text-violet-500" /> Katalog
          </button>
        </div>
      </div>

      {sheet && (
        <div className="fixed inset-0 z-30 bg-black/50 flex items-end" onClick={() => setSheet('')}>
          <div className="w-full max-w-md mx-auto max-h-[70vh] overflow-y-auto rounded-t-3xl bg-white p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-extrabold">{sheet === 'kelola' ? 'Kelola Pet (' + pets.length + '/' + MAX + ')' : 'Katalog Pet'}</h2>
              <button onClick={() => setSheet('')} aria-label="Tutup" className="text-2xl leading-none px-2">×</button>
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
