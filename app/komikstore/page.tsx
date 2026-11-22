'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, Shield, PawPrint, Mic, Fish, Smile, Info } from 'lucide-react';

type Tile = {
  title: string;
  sub: string;
  from: string;
  to: string;
  border: string;
  icon: ReactNode;
  dark?: boolean;
  live?: boolean;
  href?: string;
};

const ICON = 'w-12 h-12';
const MENU: Tile[] = [
  { title: 'Clans', sub: 'Gabung squad', from: '#172554', to: '#1e3a8a', border: '#a16207', icon: <Shield className={ICON} fill="#fbbf24" color="#fbbf24" /> },
  { title: 'AniPet', sub: 'Koleksi pet', from: '#fcd34d', to: '#f59e0b', border: '#fde68a', dark: true, icon: <PawPrint className={ICON} fill="#451a03" color="#451a03" /> },
  { title: 'Mancing', sub: 'Mini game santai', from: '#0e4f5c', to: '#0e90a8', border: '#22d3ee', icon: <Fish className={ICON} /> },
  { title: 'Avatar Border', sub: 'Shop decoration', from: '#4a044e', to: '#7e22ce', border: '#c084fc', icon: <Smile className={ICON} /> },
  { title: 'Profile Effects', sub: 'Efek profil', from: '#7c2d12', to: '#dc2626', border: '#fb7185', icon: <Sparkles className={ICON} /> },
  { title: 'Info', sub: 'Panduan KomikStore', from: '#1e293b', to: '#334155', border: '#64748b', icon: <Info className={ICON} /> },
  { title: 'Segera hadir', sub: 'Menu menyusul', from: '#581c87', to: '#be185d', border: '#e879f9', icon: <Sparkles className={ICON} /> },
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
            onClick={() => (m.href ? router.push(m.href) : alert(m.title + ' segera hadir.'))}
            className="relative rounded-3xl px-4 py-6 text-center flex flex-col items-center justify-center gap-2 min-h-[190px] active:scale-95 transition-transform"
            style={{ background: 'linear-gradient(145deg,' + m.from + ',' + m.to + ')', border: '1.5px solid ' + m.border, color: m.dark ? '#451a03' : '#fff' }}
          >
            {m.live && (
              <span className="absolute top-8 right-6 flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-xs font-extrabold text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-red-200" /> LIVE
              </span>
            )}
            <span className="h-14 flex items-center justify-center">{m.icon}</span>
            <span className="text-2xl font-extrabold leading-tight">{m.title}</span>
            <span className="text-lg font-bold opacity-70 leading-tight">{m.sub}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
