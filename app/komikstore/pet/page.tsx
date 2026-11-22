'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText } from 'lucide-react';
import PetSvg from '@/components/PetArt';
import { getFirebase, loginWithGoogle } from '@/lib/firebase-client';

type Rar = 'Common' | 'Rare' | 'Epic' | 'Legend' | 'Mythic';
type Species = { name: string; r: Rar; e: string };
type Pet = Species & { id: number; readyAt: number };

const SPRITES = true;
const CD = (16 * 60 + 42) * 60000;
const DAY = 86400000;
const MAX = 15;
const COST = 100;
const MIGRATE_CAP = 5000; // saldo ✦ lama dipindah ke Crystal sekali per akun, maksimal segini
const KEY = 'kz-pet-v1';
const ORDER: Rar[] = ['Common', 'Rare', 'Epic', 'Legend', 'Mythic'];
const RAR: Record<Rar, { l: string; bg: string; fg: string; rate: number; w: number }> = {
  Common: { l: 'C', bg: '#64748b', fg: '#fff', rate: 50, w: 50 },
  Rare: { l: 'R', bg: '#0ea5e9', fg: '#fff', rate: 100, w: 28 },
  Epic: { l: 'E', bg: '#8b5cf6', fg: '#fff', rate: 200, w: 14 },
  Legend: { l: 'L', bg: 'linear-gradient(135deg,#fde047,#f59e0b)', fg: '#713f12', rate: 500, w: 6 },
  Mythic: { l: 'M', bg: 'linear-gradient(135deg,#f472b6,#8b5cf6)', fg: '#fff', rate: 1200, w: 2 },
};
const POOL: Species[] = [
  { name: 'Ceruh the Dragon', r: 'Common', e: '🐲' }, { name: 'Drako the Dragon', r: 'Common', e: '🦎' },
  { name: 'Kova the Dragon', r: 'Common', e: '🐋' }, { name: 'Hijau the Pokemon', r: 'Common', e: '🐸' },
  { name: 'Frosta the Mini', r: 'Common', e: '🐧' }, { name: 'Luna the Mini', r: 'Common', e: '🐈‍⬛' },
  { name: 'Ignis the Fire', r: 'Rare', e: '🦖' }, { name: 'Glacius the Ice', r: 'Rare', e: '🐉' },
  { name: 'Blazon the Rare', r: 'Rare', e: '🦁' }, { name: 'Stormo the Rare', r: 'Rare', e: '🦄' },
  { name: 'Eran the Dragon', r: 'Epic', e: '🐍' }, { name: 'Sylax the Dragon', r: 'Epic', e: '🦋' },
  { name: 'Nexar the Dragon', r: 'Epic', e: '🦕' }, { name: 'Vreth the Dragon', r: 'Epic', e: '🐊' },
  { name: 'Volt the Legend', r: 'Legend', e: '🐅' }, { name: 'Verdra the Legend', r: 'Legend', e: '🦜' },
  { name: 'Purplex the Legend', r: 'Legend', e: '🦇' },
  { name: 'Bara the Dragon', r: 'Mythic', e: '🦂' }, { name: 'Kurama the Fox', r: 'Mythic', e: '🦊' },
  { name: 'Shukaku the Tanuki', r: 'Mythic', e: '🦝' }, { name: 'Matatabi the Cat', r: 'Mythic', e: '🐱' },
];
const START = ['Glacius the Ice', 'Blazon the Rare', 'Ceruh the Dragon'];
const POS: number[][] = [
  [50, 38], [28, 34], [72, 34], [38, 50], [62, 50], [16, 42], [84, 42], [50, 60],
  [24, 52], [76, 52], [40, 28], [60, 28], [34, 42], [66, 42], [50, 48],
];

const short = (n: string) => n.split(' ')[0];
const reward = (s: Species) => Math.round((RAR[s.r].rate * CD) / DAY);
const fmt = (ms: number) => {
  if (ms <= 0) return 'Klaim';
  const m = Math.floor(ms / 60000);
  return Math.floor(m / 60) + 'h ' + (m % 60) + 'm';
};
const btn3d = (c: string) => ({ boxShadow: '0 5px 0 ' + c });

const CSS = `
@keyframes kzBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
@keyframes kzHop{0%,100%{transform:translateY(0) scale(1)}40%{transform:translateY(-16px) scale(1.07)}60%{transform:translateY(0) scale(.96)}}
@keyframes kzFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes kzDrift{0%{transform:translateX(-14px)}100%{transform:translateX(28px)}}
@keyframes kzSun{0%,100%{box-shadow:0 0 0 22px rgba(254,249,195,.35)}50%{box-shadow:0 0 0 36px rgba(254,249,195,.15)}}
@keyframes kzPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
@keyframes kzWiggle{0%,60%,100%{transform:rotate(0)}70%{transform:rotate(-14deg)}85%{transform:rotate(14deg)}}
@keyframes kzPop{0%{transform:scale(.3);opacity:0}60%{transform:scale(1.12);opacity:1}100%{transform:scale(1)}}
@keyframes kzToast{0%{transform:translate(-50%,10px);opacity:0}15%,80%{transform:translate(-50%,0);opacity:1}100%{transform:translate(-50%,-14px);opacity:0}}
@keyframes kzSpin{to{transform:rotate(360deg)}}
@keyframes kzUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes kzTwinkle{0%,100%{opacity:.35}50%{opacity:1}}
`;

function useSprite(src: string) {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (!SPRITES) return;
    let alive = true;
    const im = new window.Image();
    im.onload = () => { if (alive) setOk(true); };
    im.src = src;
    return () => { alive = false; };
  }, [src]);
  return ok;
}

function PetArt({ s, size }: { s: Species; size: number }) {
  const src = '/pet/' + short(s.name).toLowerCase() + '.png';
  const ok = useSprite(src);
  if (!ok) return <span style={{ fontSize: size * 0.8, lineHeight: 1, display: 'inline-flex' }}><PetSvg e={s.e} ground={size >= 64} /></span>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={s.name} draggable={false} style={{ width: size, height: size, objectFit: 'contain' }} />
  );
}

function Chip({ r, big }: { r: Rar; big?: boolean }) {
  return (
    <span className={'inline-block rounded-full font-extrabold ' + (big ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs')} style={{ background: RAR[r].bg, color: RAR[r].fg }}>{r}</span>
  );
}

function Island() {
  const ok = useSprite('/pet/island.png');
  if (ok) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src="/pet/island.png" alt="" draggable={false} className="w-full h-full object-contain" />;
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
  const [koin, setKoin] = useState(0);   // Crystal akun (users/{uid}/koin), sama dengan toko lain
  const [uid, setUid] = useState('');
  const [fb, setFb] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const legacy = useRef(0);               // saldo ✦ lama dari localStorage, menunggu dipindah ke Crystal
  const [now, setNow] = useState(0);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [sheet, setSheet] = useState<'' | 'kelola' | 'katalog'>('');
  const [toast, setToast] = useState<{ m: string; k: number } | null>(null);
  const [reveal, setReveal] = useState<Pet | null>(null);

  useEffect(() => {
    const t = Date.now();
    setNow(t);
    let list: Pet[] | null = null;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw) as { coins?: number; pets?: { n: string; id: number; at: number }[] };
        if (typeof d.coins === 'number' && d.coins > 0) legacy.current = Math.floor(d.coins);
        if (Array.isArray(d.pets)) {
          const out: Pet[] = [];
          for (const x of d.pets) {
            const s = POOL.find(p => p.name === x.n);
            if (s) out.push({ ...s, id: x.id, readyAt: x.at });
          }
          list = out;
        }
      }
    } catch {}
    if (!list) {
      list = START.map((n, i) => ({ ...(POOL.find(p => p.name === n) as Species), id: i + 1, readyAt: t + CD }));
    }
    setPets(list);
    setLoaded(true);
    const iv = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ coins: legacy.current, pets: pets.map(p => ({ n: p.name, id: p.id, at: p.readyAt })) }));
    } catch {}
  }, [pets, loaded]);

  // Login + saldo Crystal. Saldo ✦ lama (kalau ada) dipindah ke Crystal satu kali per akun.
  useEffect(() => {
    let stop = false;
    let off: (() => void) | undefined;
    getFirebase().then((f: any) => {
      if (stop) return;
      setFb(f);
      off = f.auth.onAuthStateChanged(async (u: any) => {
        if (stop) return;
        if (!u) { setUid(''); setKoin(0); return; }
        setUid(u.uid);
        const ref = f.db.ref('users/' + u.uid);
        try {
          if (legacy.current > 0) {
            const flag = await ref.child('petMigrated').transaction((cur: any) => (cur ? undefined : true));
            if (flag.committed && flag.snapshot.val() === true) {
              const add = Math.min(legacy.current, MIGRATE_CAP);
              await ref.child('koin').transaction((cur: any) => (typeof cur === 'number' ? cur : 0) + add);
              say('Saldo ✦ lamamu jadi +' + add + ' Crystal');
            }
            legacy.current = 0;
            try {
              const d = JSON.parse(localStorage.getItem(KEY) || '{}');
              d.coins = 0;
              localStorage.setItem(KEY, JSON.stringify(d));
            } catch {}
          }
          const v = (await ref.child('koin').get()).val();
          if (!stop) setKoin(typeof v === 'number' ? v : 0);
        } catch {}
      });
    }).catch(() => {});
    return () => { stop = true; if (off) off(); };
  }, []);

  const say = (m: string) => setToast({ m, k: Date.now() });
  const ready = pets.filter(p => p.readyAt <= now);

  const needLogin = () => { say('Login dulu buat pakai Crystal'); };

  const claim = async (ids: number[]) => {
    if (lock.current) return;
    if (!uid || !fb) { needLogin(); return; }
    const t = Date.now();
    const g = pets.filter(p => ids.includes(p.id) && p.readyAt <= t);
    if (!g.length) return;
    const total = g.reduce((a, p) => a + reward(p), 0);
    lock.current = true; setBusy(true);
    try {
      const res = await fb.db.ref('users/' + uid + '/koin').transaction((cur: any) => (typeof cur === 'number' ? cur : 0) + total);
      if (!res.committed) throw new Error('x');
      const got = g.map(p => p.id);
      setKoin(Number(res.snapshot.val()) || 0);
      setPets(ps => ps.map(p => (got.includes(p.id) ? { ...p, readyAt: Date.now() + CD } : p)));
      say('+' + total.toLocaleString('id-ID') + ' Crystal');
    } catch { say('Gagal klaim, coba lagi'); }
    lock.current = false; setBusy(false);
  };

  const gacha = async () => {
    if (lock.current) return;
    if (!uid || !fb) { needLogin(); return; }
    if (pets.length >= MAX) { say('Kandang penuh (' + MAX + '/' + MAX + ')'); return; }
    if (koin < COST) { say('Crystal kurang (butuh ' + COST + ')'); return; }
    lock.current = true; setBusy(true);
    try {
      // potong saldo pakai transaction supaya nggak bisa dobel dari 2 tab
      const res = await fb.db.ref('users/' + uid + '/koin').transaction((cur: any) => (typeof cur !== 'number' ? cur : cur >= COST ? cur - COST : undefined));
      const left = res.snapshot.val();
      if (!res.committed || typeof left !== 'number') { say('Crystal kurang (butuh ' + COST + ')'); lock.current = false; setBusy(false); return; }
      setKoin(left);
      let roll = Math.random() * 100;
      let r: Rar = 'Common';
      for (const k of ORDER) { roll -= RAR[k].w; if (roll < 0) { r = k; break; } }
      const list = POOL.filter(s => s.r === r);
      const s = list[Math.floor(Math.random() * list.length)];
      const p: Pet = { ...s, id: Date.now(), readyAt: Date.now() + CD };
      setPets(ps => [...ps, p]);
      setReveal(p);
    } catch { say('Gagal, coba lagi'); }
    lock.current = false; setBusy(false);
  };

  const owned = (n: string) => pets.filter(p => p.name === n).length;

  return (
    <div onContextMenu={e => e.preventDefault()} className="min-h-screen max-w-md mx-auto relative overflow-hidden text-slate-800 select-none [-webkit-touch-callout:none] [-webkit-tap-highlight-color:transparent]" style={{ background: 'linear-gradient(180deg,#86c8e8 0%,#a9dcef 50%,#c4e6f4 100%)' }}>
      <style>{CSS}</style>
      <div className="absolute top-20 right-4 w-24 h-24 rounded-full bg-yellow-100" style={{ animation: 'kzSun 5s ease-in-out infinite' }} />
      <div className="absolute top-[22%] -left-6 w-56 h-72 rounded-full bg-white/30" style={{ animation: 'kzDrift 14s ease-in-out infinite alternate' }} />
      <div className="absolute top-[30%] left-[28%] w-40 h-80 rounded-full bg-white/30" style={{ animation: 'kzDrift 18s ease-in-out infinite alternate-reverse' }} />
      <div className="absolute top-[26%] -right-10 w-52 h-80 rounded-full bg-white/30" style={{ animation: 'kzDrift 16s ease-in-out infinite alternate' }} />
      {[[12, 14], [30, 8], [62, 12], [44, 20]].map((q, i) => (
        <span key={i} className="absolute text-white text-sm" style={{ left: q[0] + '%', top: q[1] + '%', animation: 'kzTwinkle 2.4s ease-in-out ' + i * 0.6 + 's infinite' }}>✦</span>
      ))}

      <div className="relative z-20 flex items-center gap-1.5 px-3 pt-6">
        <button onClick={() => router.back()} aria-label="Kembali" className="p-1 shrink-0"><ArrowLeft className="w-6 h-6" style={{ color: '#1b4a6b' }} /></button>
        <h1 className="text-xl leading-none font-extrabold whitespace-nowrap shrink-0" style={{ color: '#1b4a6b' }}>KomikZoo</h1>
        <div className="flex-1" />
        <button
          onClick={() => claim(ready.map(p => p.id))}
          className={'rounded-full pl-3 pr-1.5 py-1.5 text-[13px] font-extrabold whitespace-nowrap flex items-center gap-1.5 shrink-0 ' + (ready.length ? 'bg-orange-400 text-white' : 'bg-orange-200/70 text-amber-800/70')}
          style={{ ...btn3d(ready.length ? '#d97706' : 'rgba(180,120,60,.25)'), animation: ready.length ? 'kzPulse 1.2s ease-in-out infinite' : undefined }}
        >
          Klaim Semua
          <span className={'min-w-[22px] h-[22px] rounded-full text-xs flex items-center justify-center text-white ' + (ready.length ? 'bg-red-500' : 'bg-rose-400/70')}>{ready.length}</span>
        </button>
        <button
          onClick={() => { if (!uid) loginWithGoogle().catch(() => say('Login gagal, coba lagi')); }}
          aria-label="Crystal"
          className="rounded-full px-3 py-1.5 text-base font-extrabold text-white flex items-center gap-1 shrink-0"
          style={{ background: 'linear-gradient(180deg,#4fb4ee,#2f95dc)', boxShadow: '0 4px 0 #2478b5' }}
        >
          <span className="text-sm">✦</span>{uid ? koin.toLocaleString('id-ID') : 'Login'}
        </button>
      </div>

      <div className="relative z-[5]" style={{ height: 'calc(100vh - 230px)' }}>
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
          <div className="relative w-full aspect-[400/345]" style={{ animation: 'kzFloat 7s ease-in-out infinite' }}>
            <Island />
            {pets.map((p, i) => {
              const [x, y] = POS[i % POS.length];
              const left = p.readyAt - now;
              const ok = !!now && left <= 0;
              return (
                <div key={p.id} className="absolute -translate-x-1/2 -translate-y-[70%]" style={{ left: x + '%', top: y + '%', zIndex: Math.round(y) }}>
                  <div className="flex flex-col items-center" style={{ animation: (ok ? 'kzHop 1.1s' : 'kzBob 2.6s') + ' ease-in-out ' + (i % 5) * 0.35 + 's infinite' }}>
                    <button
                      onClick={() => ok && claim([p.id])}
                      className={'mb-0.5 rounded-full pl-2 pr-2.5 py-0.5 text-xs font-extrabold shadow-md flex items-center gap-1 ' + (ok ? 'bg-emerald-500 text-white' : 'bg-white text-slate-700')}
                    >
                      <span className={ok ? 'text-white' : 'text-sky-300'}>✦</span>{now ? fmt(left) : '...'}
                    </button>
                    <span className="drop-shadow-md"><PetArt s={p} size={64} /></span>
                    <span className="-mt-1 flex items-center gap-1 rounded-full bg-white/90 pl-1 pr-2.5 py-0.5 text-sm font-extrabold shadow" style={{ color: '#2f4a3a' }}>
                      <span className="w-5 h-5 rounded-full text-[10px] flex items-center justify-center" style={{ background: RAR[p.r].bg, color: RAR[p.r].fg }}>{RAR[p.r].l}</span>
                      {short(p.name)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {toast && <div key={toast.k} className="fixed top-24 left-1/2 z-40 rounded-full bg-slate-900/85 text-white px-4 py-2 text-sm font-bold" style={{ animation: 'kzToast 2.4s ease forwards' }}>{toast.m}</div>}

      {sheet && (
        <>
          <div className="fixed inset-0 z-10 bg-slate-900/20" onClick={() => setSheet('')} />
          <div className="fixed left-0 right-0 bottom-0 top-[110px] max-w-md mx-auto z-10 rounded-t-[28px] bg-white overflow-y-auto px-4 pb-40" style={{ animation: 'kzUp .25s ease-out' }}>
            <div className="sticky top-0 bg-white pt-3 pb-3 z-10">
              <div className="mx-auto w-14 h-1.5 rounded-full bg-slate-300 mb-3" />
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-extrabold">{sheet === 'kelola' ? 'Kelola Pet (' + pets.length + '/' + MAX + ')' : 'Katalog Pet'}</h2>
                <button onClick={() => setSheet('')} aria-label="Tutup" className="w-11 h-11 rounded-xl bg-slate-100 text-2xl font-extrabold leading-none">×</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(sheet === 'kelola' ? pets : POOL).map((p, i) => {
                const pet = p as Pet;
                return (
                  <div key={i} className="rounded-2xl border border-slate-200 bg-[#fbfbf6] p-2.5 flex gap-2.5 items-center">
                    <div className="w-12 h-12 shrink-0 rounded-xl bg-white flex items-center justify-center"><PetArt s={p} size={40} /></div>
                    <div className="min-w-0">
                      <p className="text-[15px] font-extrabold leading-tight">{p.name}</p>
                      <div className="mt-1"><Chip r={p.r} /></div>
                      <p className="mt-1 inline-block rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[11px] font-extrabold text-emerald-800 whitespace-nowrap">
                        HASILKAN {RAR[p.r].rate} Crystal/hari
                      </p>
                      {sheet === 'katalog' && owned(p.name) > 0 && <p className="text-[11px] font-bold text-emerald-600">Dimiliki ×{owned(p.name)}</p>}
                      {sheet === 'kelola' && <p className="text-[11px] font-bold text-slate-500">{now ? (pet.readyAt - now <= 0 ? 'Siap klaim' : fmt(pet.readyAt - now)) : ''}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
            {sheet === 'kelola' && !pets.length && <p className="text-center text-slate-500 py-8">Belum punya pet. Coba Gacha dulu.</p>}
          </div>
        </>
      )}

      <div className="fixed bottom-3 left-0 right-0 max-w-md mx-auto px-3 z-20">
        <div className="flex gap-2.5 rounded-[28px] bg-white/95 p-3 shadow-xl">
          <button onClick={gacha} disabled={busy} className="flex-[1.15] rounded-2xl text-white py-2 text-xl font-extrabold flex flex-col items-center justify-center leading-tight active:translate-y-1 disabled:opacity-60" style={{ background: 'linear-gradient(180deg,#a66cf0,#7a3fd0)', ...btn3d('#5b2aa8') }}>
            Gacha
            <span className="text-xs font-bold text-white/85">{COST} Crystal</span>
          </button>
          <button onClick={() => setSheet(s => (s === 'kelola' ? '' : 'kelola'))} className="relative flex-[1.5] rounded-2xl text-white py-3 text-xl font-extrabold flex items-center justify-center gap-2 active:translate-y-1" style={{ background: 'linear-gradient(180deg,#2fd3a6,#14a98a)', ...btn3d('#0d7d68') }}>
            Kelola
            <span className="rounded-xl bg-white/90 text-slate-800 px-2.5 text-lg">{pets.length}/{MAX}</span>
            <span className="absolute -top-2 -right-1 min-w-[26px] h-[26px] rounded-full bg-red-500 text-white text-sm flex items-center justify-center border-2 border-white">{ready.length}</span>
          </button>
          <button onClick={() => setSheet(s => (s === 'katalog' ? '' : 'katalog'))} className="flex-1 rounded-2xl bg-white text-slate-800 py-2 text-base font-extrabold flex flex-col items-center justify-center border border-slate-200 active:translate-y-1" style={btn3d('#e2e8f0')}>
            <FileText className="w-7 h-7 text-violet-500" /> Katalog
          </button>
        </div>
      </div>

      {reveal && (
        <div className="fixed inset-0 z-40 bg-black/65 flex items-center justify-center" onClick={() => setReveal(null)}>
          <div className="relative flex flex-col items-center" style={{ animation: 'kzPop .5s ease-out' }}>
            <div className="absolute w-80 h-80 rounded-full opacity-60" style={{ background: 'conic-gradient(from 0deg,transparent,rgba(253,224,71,.8),transparent,rgba(253,224,71,.8),transparent,rgba(253,224,71,.8),transparent)', animation: 'kzSpin 6s linear infinite', maskImage: 'radial-gradient(circle,#000 30%,transparent 70%)', WebkitMaskImage: 'radial-gradient(circle,#000 30%,transparent 70%)' }} />
            <div className="relative" style={{ animation: 'kzBob 2s ease-in-out infinite' }}><PetArt s={reveal} size={150} /></div>
            <p className="relative mt-3 text-3xl font-extrabold text-white">{reveal.name}</p>
            <div className="relative mt-2"><Chip r={reveal.r} big /></div>
            <p className="relative mt-2 text-white/90 font-bold">{RAR[reveal.r].rate} Crystal/hari</p>
            <p className="relative mt-5 text-white/60 text-sm">Ketuk untuk tutup</p>
          </div>
        </div>
      )}
    </div>
  );
}
