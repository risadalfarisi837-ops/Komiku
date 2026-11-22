'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles } from 'lucide-react';

// Isi menu KomikStore: ganti judul/sub/warna di sini kalau isinya sudah ada.
type Tile = { title: string; sub: string; from: string; to: string; border: string; dark?: boolean; href?: string };
const MENU: Tile[] = [
  { title: 'Segera hadir', sub: 'Menu menyusul', from: '#172554', to: '#1e3a8a', border: '#a16207' },
  { title: 'Segera hadir', sub: 'Menu menyusul', from: '#fcd34d', to: '#f59e0b', border: '#fde68a', dark: true },
  { title: 'Segera hadir', sub: 'Menu menyusul', from: '#3b0764', to: '#6d28d9', border: '#8b5cf6' },
  { title: 'Segera hadir', sub: 'Menu menyusul', from: '#0e4f5c', to: '#0e90a8', border: '#22d3ee' },
  { title: 'Segera hadir', sub: 'Menu menyusul', from: '#4a044e', to: '#7e22ce', border: '#c084fc' },
  { title: 'Segera hadir', sub: 'Menu menyusul', from: '#7c2d12', to: '#dc2626', border: '#fb7185' },
];

export default function KomikStorePage() {
  const router = useRouter();
  const [name, setName] = useState<string>('');
  const [photo, setPhoto] = useState<string>('');

  useEffect(() => {
    let stop = false;
    let tries = 0;
    const attach = () => {
      const fb = (window as any).firebase;
      if (!fb) return false;
      try {
        fb.auth().onAuthStateChanged((u: any) => {
          if (stop) return;
          setName(u?.displayName || '');
          setPhoto(u?.photoURL || '');
        });
        return true;
      } catch { return false; }
    };
    if (attach()) return () => { stop = true; };
    const t = setInterval(() => { tries++; if (attach() || tries > 20) clearInterval(t); }, 300);
    return () => { stop = true; clearInterval(t); };
  }, []);

  return (
    <div className="min-h-screen text-white max-w-md mx-auto pb-24" style={{ background: 'radial-gradient(ellipse at top, #151c34 0%, #0b0f1d 60%, #070a14 100%)' }}>
      <div className="flex items-center gap-4 px-6 pt-8 pb-6">
        <button onClick={() => router.back()} aria-label="Kembali" className="p-1"><ArrowLeft className="w-7 h-7" /></button>
        <h1 className="text-4xl font-extrabold tracking-tight">KomikStore</h1>
        <span className="px-3 py-1 rounded-xl text-xl font-extrabold bg-emerald-900/40 text-emerald-400">BETA</span>
      </div>

      <div className="mx-5 flex items-center gap-4 rounded-3xl border border-white/10 bg-white/5 px-5 py-5">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" referrerPolicy="no-referrer" className="w-16 h-16 rounded-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center"><Sparkles className="w-7 h-7 text-white/60" /></div>
        )}
        <div className="min-w-0">
          <p className="text-2xl font-extrabold truncate">{name || 'Tamu'}</p>
          <p className="text-lg font-bold text-white/60">Selamat datang!</p>
        </div>
      </div>

      <h2 className="px-6 pt-8 pb-4 text-2xl font-extrabold text-white/60">Menu</h2>
      <div className="grid grid-cols-2 gap-4 px-5">
        {MENU.map((m, i) => (
          <button
            key={i}
            onClick={() => { if (m.href) router.push(m.href); }}
            className="rounded-3xl px-4 py-8 text-center flex flex-col items-center justify-center gap-2 min-h-[190px]"
            style={{ background: 'linear-gradient(145deg,' + m.from + ',' + m.to + ')', border: '1.5px solid ' + m.border, color: m.dark ? '#451a03' : '#fff' }}
          >
            <Sparkles className="w-10 h-10 opacity-80" />
            <span className="text-2xl font-extrabold leading-tight">{m.title}</span>
            <span className="text-lg font-bold opacity-70">{m.sub}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
