'use client';
import { BadgeCheck } from 'lucide-react';

export type Clan = {
  id?: string; name: string; tag?: string; level?: number; members?: number;
  xp?: number; banner?: string; icon?: string; verified?: boolean;
};

const fmt = (n = 0) =>
  n >= 1e9 ? (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B'
  : n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'
  : n >= 1e3 ? (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K' : String(n);

const RANK: Record<number, { c: string; glow: string }> = {
  1: { c: '#facc15', glow: 'rgba(250,204,21,.45)' },
  2: { c: '#e5e7eb', glow: 'rgba(229,231,235,.30)' },
  3: { c: '#fb7185', glow: 'rgba(251,113,133,.30)' },
};

export default function ClanCard({ clan, rank, index = 0, onClick }: {
  clan: Clan; rank: number; index?: number; onClick?: () => void;
}) {
  const r = RANK[rank];
  return (
    <>
      <style>{`
        @keyframes cc-up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
        @keyframes cc-shine{0%{transform:translateX(-130%)}60%,100%{transform:translateX(130%)}}
        @keyframes cc-glow{0%,100%{box-shadow:0 0 12px var(--g)}50%{box-shadow:0 0 28px var(--g)}}
        @keyframes cc-tw{0%,100%{opacity:.15;transform:scale(.6)}50%{opacity:1;transform:scale(1.2)}}
        @media (prefers-reduced-motion:reduce){.cc,.cc *{animation:none!important}}
      `}</style>
      <button
        onClick={onClick}
        className="cc relative w-full overflow-hidden rounded-3xl text-left active:scale-[.98] transition-transform"
        style={{
          ['--g' as any]: r?.glow,
          border: `${r ? 2 : 1}px solid ${r ? r.c : 'rgba(255,255,255,.08)'}`,
          background: '#0f1424',
          animation: `cc-up .5s ease ${index * 70}ms both${r ? ', cc-glow 2.8s ease-in-out infinite' : ''}`,
        }}
      >
        {clan.banner && (
          <div className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${clan.banner})` }} />
        )}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg,rgba(8,10,20,.55),rgba(8,10,20,.85))' }} />
        {rank <= 3 && (
          <div className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(110deg,transparent 35%,rgba(255,255,255,.16) 50%,transparent 65%)',
              animation: `cc-shine ${rank === 1 ? 3.2 : 4.5}s ease-in-out infinite`,
            }} />
        )}
        {rank === 1 && (
          <>
            <span className="absolute top-2 right-6 text-yellow-200 text-xs" style={{ animation: 'cc-tw 1.8s infinite' }}>✦</span>
            <span className="absolute bottom-3 left-3 text-yellow-200 text-[10px]" style={{ animation: 'cc-tw 2.4s .6s infinite' }}>✦</span>
          </>
        )}

        <div className="relative px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black w-12" style={{ color: r?.c || '#fbbf24' }}>#{rank}</span>
            {clan.icon && <img src={clan.icon} alt="" className="w-11 h-11 rounded-full object-cover border-2 border-white/20" />}
            {clan.tag && (
              <span className="px-4 py-1 text-xs font-extrabold text-white bg-white/15"
                style={{ clipPath: 'polygon(0 0,85% 0,100% 50%,85% 100%,0 100%)' }}>
                {clan.tag}
              </span>
            )}
            <span className="flex-1 min-w-0 truncate text-lg font-extrabold text-white">{clan.name}</span>
            {clan.verified && <BadgeCheck className="w-5 h-5 shrink-0 text-sky-400" />}
          </div>
          <div className="flex flex-wrap gap-2 mt-3 pl-1">
            <span className="px-3 py-1 rounded-full text-xs font-bold text-violet-300 bg-violet-500/20 border border-violet-400/20">Lv {clan.level ?? 1}</span>
            <span className="px-3 py-1 rounded-full text-xs font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-400/20">{clan.members ?? 0} member</span>
            <span className="px-3 py-1 rounded-full text-xs font-bold text-amber-300 bg-amber-500/20 border border-amber-400/20">{fmt(clan.xp)} XP</span>
          </div>
        </div>
      </button>
    </>
  );
}
