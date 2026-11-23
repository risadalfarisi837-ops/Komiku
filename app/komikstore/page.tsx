'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, Shield, PawPrint, Mic, Fish, Smile, Info, Gift, Target, Mountain } from 'lucide-react';
import { getFirebase } from '@/lib/firebase-client';

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
  { title: 'Misi', sub: 'Harian & mingguan', href: '/misi', from: '#065f46', to: '#10b981', border: '#6ee7b7', icon: <Target className={ICON} /> },
  { title: 'Pet', sub: 'Koleksi pet', href: '/komikstore/pet', from: '#fcd34d', to: '#f59e0b', border: '#fde68a', dark: true, icon: <PawPrint className={ICON} fill="#451a03" color="#451a03" /> },
  { title: 'Avatar Border', sub: 'Shop decoration', href: '/komikstore/avatar-border', from: '#4a044e', to: '#7e22ce', border: '#c084fc', icon: <Smile className={ICON} /> },
  { title: 'Profile Effects', sub: 'Efek profil', href: '/komikstore/profile-effects', from: '#7c2d12', to: '#dc2626', border: '#fb7185', icon: <Sparkles className={ICON} /> },
  { title: 'Gacha Background', sub: 'Latar profil', href: '/komikstore/gacha-background', from: '#0c4a6e', to: '#6d28d9', border: '#67e8f9', icon: <Mountain className={ICON} /> },
  { title: 'Gacha Wallpaper', sub: 'Spin banner', href: '/komikstore/gacha-wallpaper', from: '#581c87', to: '#be185d', border: '#f472b6', icon: <Gift className={ICON} /> },
  { title: 'Info', sub: 'Panduan KomikStore', from: '#1e293b', to: '#334155', border: '#64748b', icon: <Info className={ICON} /> },
];

export default function KomikStorePage() {
  const router = useRouter();
  const [name, setName] = useState<string>('');
  const [photo, setPhoto] = useState<string>('');

  useEffect(() => {
    let stop = false;
    let off: (() => void) | undefined;
    getFirebase().then(({ auth, db }: any) => {
      if (stop) return;
      off = auth.onAuthStateChanged(async (u: any) => {
        if (stop) return;
        setName(u?.displayName || '');
        setPhoto(u?.photoURL || '');
        if (!u) return;
        try {
          const v = (await db.ref('users/' + u.uid).get()).val();
          if (stop || !v) return;
          if (typeof v.displayName === 'string' && v.displayName) setName(v.displayName);
          if (typeof v.photoURL === 'string' && v.photoURL) setPhoto(v.photoURL);
        } catch {}
      });
    }).catch(() => {});
    return () => { stop = true; if (off) off(); };
  }, []);

  return (
    <div className="min-h-screen text-white max-w-md mx-auto pb-10 -mb-28" style={{ background: 'radial-gradient(ellipse at top, #151c34 0%, #0b0f1d 60%, #070a14 100%)' }}>
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
