'use client';

import { Lencana, RARITY_COLOR, TRACK_COLOR, TrackName } from '@/lib/lencana';

const SHAPE: Record<TrackName, string> = {
  Noble: 'M50 6 L88 20 V50 C88 74 72 90 50 96 C28 90 12 74 12 50 V20 Z',
  Murim: 'M32 6 H68 L94 32 V68 L68 94 H32 L6 68 V32 Z',
  Demon: 'M50 10 L88 31 V69 L50 90 L12 69 V31 Z',
};

// Lambang di tengah. Tingkat 10–8 punya gambar sendiri, sisanya lambang jalur + bintang tingkat.
function Emblem({ l }: { l: Lencana }) {
  const gold = '#F5C84B', cream = '#FBEFD5', white = '#fff';
  const key = `${l.track}:${l.tier}`;
  switch (key) {
    case 'Noble:10': return <g fill={gold}><path d="M50 30c-9 4-12 14-8 22 3 5 6 6 8 6s5-1 8-6c4-8 1-18-8-22z" /><rect x="48" y="58" width="4" height="12" rx="2" /></g>;
    case 'Noble:9': return <g><path d="M36 36h22v16c0 8-5 12-11 14-6-2-11-6-11-14z" fill={cream} /><path d="M47 38v26M38 47h18" stroke="#27479E" strokeWidth="3" /><path d="M60 38l9-12" stroke={gold} strokeWidth="3" strokeLinecap="round" /></g>;
    case 'Noble:8': return <g><path d="M36 34c0-9 28-9 28 0v22H36z" fill={cream} /><path d="M58 28c8-8 12-2 8 4" stroke={gold} strokeWidth="4" fill="none" strokeLinecap="round" /><path d="M42 42h16M50 42v14" stroke="#27479E" strokeWidth="3.5" /></g>;
    case 'Murim:10': return <g><rect x="38" y="36" width="9" height="30" rx="3" fill={cream} /><rect x="53" y="44" width="9" height="22" rx="3" fill={cream} /><path d="M40 36c0-8 8-12 14-8-2 7-8 10-14 8zM60 34c4-4 10-6 14-4-2 6-8 8-14 4z" fill="#8FE3C3" /></g>;
    case 'Murim:9': return <g><rect x="32" y="38" width="36" height="24" rx="5" fill={cream} /><path d="M38 46h18M38 52h24M38 58h14" stroke="#0F6B55" strokeWidth="3" strokeLinecap="round" /><rect x="58" y="54" width="5" height="4" fill="#D64545" /></g>;
    case 'Murim:8': return <g><rect x="38" y="30" width="24" height="34" rx="10" fill={cream} /><circle cx="50" cy="47" r="7" fill="none" stroke="#0F6B55" strokeWidth="3" /><path d="M50 40v14M43 47h14" stroke="#0F6B55" strokeWidth="3" /><path d="M50 22v8" stroke="#D64545" strokeWidth="3" /><path d="M46 64h8l-2 10h-4z" fill="#D64545" /></g>;
    case 'Demon:10': return <g><path d="M50 30c4 7 14 9 14 21 0 8-6 14-14 14s-14-6-14-14c0-12 10-14 14-21z" fill="#F4A582" /><circle cx="44" cy="50" r="2.4" fill="#5B1626" /><circle cx="56" cy="50" r="2.4" fill="#5B1626" /><path d="M43 57q7 5 14 0" stroke="#5B1626" strokeWidth="2.5" fill="none" strokeLinecap="round" /></g>;
    case 'Demon:9': return <g fill="none" stroke="#F4A582" strokeWidth="4.5" strokeLinecap="round"><path d="M38 32q10 18 0 36" /><path d="M50 30q11 20 0 40" /><path d="M62 32q10 18 0 36" /></g>;
    case 'Demon:8': return <g><path d="M34 46c0-14 32-14 32 0 0 8-5 10-5 16H39c0-6-5-8-5-16z" fill={cream} /><circle cx="43.5" cy="48" r="4" fill="#5B1626" /><circle cx="56.5" cy="48" r="4" fill="#5B1626" /><path d="M42 62v6M50 62v6M58 62v6" stroke="#5B1626" strokeWidth="2.5" /><path d="M38 34l-6-8M62 34l6-8" stroke="#F4A582" strokeWidth="5" strokeLinecap="round" /></g>;
  }
  const stars = Math.max(1, 11 - l.tier - 2);
  const mark =
    l.track === 'Noble' ? <path d="M32 58V38l9 8 9-14 9 14 9-8v20z" fill={gold} />
    : l.track === 'Murim' ? <g><circle cx="50" cy="36" r="7" fill={cream} /><path d="M33 62c0-12 8-18 17-18s17 6 17 18z" fill={cream} /></g>
    : <g><path d="M34 30l8 10h16l8-10-2 22c-2 8-8 12-14 14-6-2-12-6-14-14z" fill={cream} /><circle cx="43" cy="48" r="3" fill="#5B1626" /><circle cx="57" cy="48" r="3" fill="#5B1626" /></g>;
  return (
    <g>
      <g transform="translate(0,-6)">{mark}</g>
      <g fill={gold}>
        {Array.from({ length: Math.min(stars, 5) }).map((_, i, a) => (
          <circle key={i} cx={50 + (i - (a.length - 1) / 2) * 9} cy={74} r={2.8} />
        ))}
      </g>
    </g>
  );
}

export function LencanaIcon({ l, locked = false, size = 72 }: { l: Lencana; locked?: boolean; size?: number }) {
  const ring = locked ? '#46454D' : RARITY_COLOR[l.rarity];
  const fill = locked ? '#2D2C33' : TRACK_COLOR[l.track];
  const big = l.rarity === 'Mythic' || l.rarity === 'Legendary';
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: 'visible', flex: `0 0 ${size}px` }}>
      {l.track === 'Demon' && <path d="M22 28L14 8l22 12zM78 28l8-20-22 12z" fill={locked ? '#3A393F' : '#F08A5D'} />}
      {!locked && big && <path d={SHAPE[l.track]} fill="none" stroke={ring} strokeOpacity={0.35} strokeWidth={9} strokeLinejoin="round" />}
      <path d={SHAPE[l.track]} fill={fill} stroke={ring} strokeWidth={l.rarity === 'Common' || locked ? 3.5 : 5} strokeLinejoin="round" />
      <g opacity={locked ? 0.18 : 1}><Emblem l={l} /></g>
      {locked && (
        <g>
          <circle cx="50" cy="50" r="17" fill="#1B1A20" fillOpacity="0.85" />
          <rect x="40.5" y="48" width="19" height="14" rx="3" fill="none" stroke="#E6E4EE" strokeWidth="2.6" />
          <path d="M44 48v-4a6 6 0 0112 0v4" fill="none" stroke="#E6E4EE" strokeWidth="2.6" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}

// Pill kecil (dipakai di Edit profil)
export function LencanaPill({ l }: { l: Lencana }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: TRACK_COLOR[l.track], padding: '4px 14px 4px 6px', borderRadius: 99, fontSize: 17, fontWeight: 800, letterSpacing: -0.3, color: '#fff', whiteSpace: 'nowrap' }}>
      <LencanaIcon l={l} size={24} />{l.name}
    </span>
  );
}
