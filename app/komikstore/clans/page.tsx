'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getFirebase } from '@/lib/firebase-client';
import ClanCard, { Clan } from '@/components/ClanCard';

const DEMO: Clan[] = [
  { id: 'd1', name: 'AKATSUKI', tag: 'AKA', level: 138, members: 330, xp: 213e6, verified: true },
  { id: 'd2', name: 'OCTAGRAM', tag: 'OCTA', level: 116, members: 412, xp: 127e6, verified: true },
  { id: 'd3', name: 'Loli and Yuri Lovers', tag: 'LYL', level: 109, members: 500, xp: 104e6, verified: true },
  { id: 'd4', name: 'Just Friend', tag: 'JF', level: 97, members: 241, xp: 73e6, verified: true },
  { id: 'd5', name: 'One For All', tag: 'OFA', level: 91, members: 211, xp: 60.3e6, verified: true },
];

export default function ClansPage() {
  const router = useRouter();
  const [clans, setClans] = useState<Clan[]>(DEMO);
  const [demo, setDemo] = useState(true);

  useEffect(() => {
    let stop = false;
    getFirebase().then(async ({ db }: any) => {
      try {
        const v = (await db.ref('clans').get()).val();
        if (stop || !v) return;
        const arr: Clan[] = Object.entries(v).map(([id, c]: any) => ({ id, ...c }));
        arr.sort((a, b) => (b.xp || 0) - (a.xp || 0));
        if (arr.length) { setClans(arr.slice(0, 20)); setDemo(false); }
      } catch {}
    }).catch(() => {});
    return () => { stop = true; };
  }, []);

  return (
    <div className="min-h-screen text-white max-w-md mx-auto pb-10 -mb-28"
      style={{ background: 'radial-gradient(ellipse at top,#151c34 0%,#0b0f1d 60%,#070a14 100%)' }}>
      <div className="flex items-center gap-4 px-5 pt-8 pb-5">
        <button onClick={() => router.back()} className="active:scale-90 transition-transform">
          <ArrowLeft className="w-7 h-7" />
        </button>
        <div>
          <h1 className="text-3xl font-black">Clans</h1>
          <p className="text-sm font-semibold text-white/50">Build squad, donate & grow together</p>
        </div>
      </div>

      <div className="mx-4 grid grid-cols-2 gap-3 rounded-3xl bg-white/5 p-4">
        <button onClick={() => alert('Buat Clan segera hadir.')}
          className="rounded-full py-4 text-lg font-extrabold text-black bg-violet-400 active:scale-95 transition-transform">
          Buat Clan
        </button>
        <button onClick={() => alert('Cari Clan segera hadir.')}
          className="rounded-full py-4 text-lg font-extrabold text-black bg-sky-400 active:scale-95 transition-transform">
          Cari Clan
        </button>
      </div>

      <div className="mx-4 mt-4 rounded-3xl bg-white/[.04] p-4">
        <h2 className="text-2xl font-black text-amber-300 mb-3">Top Clans</h2>
        <div className="flex flex-col gap-3">
          {clans.map((c, i) => (
            <ClanCard key={c.id || i} clan={c} rank={i + 1} index={i} />
          ))}
        </div>
        {demo && <p className="mt-3 text-center text-xs text-white/30">Data demo (belum ada clan di database)</p>}
      </div>
    </div>
  );
}
