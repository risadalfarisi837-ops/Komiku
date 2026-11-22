'use client';

export type ReactionKey = 'like' | 'love' | 'laugh' | 'sad' | 'angry';

export const REACTIONS: { key: ReactionKey; label: string }[] = [
  { key: 'like', label: 'Like' },
  { key: 'love', label: 'Love' },
  { key: 'laugh', label: 'Laugh' },
  { key: 'sad', label: 'Sad' },
  { key: 'angry', label: 'Angry' },
];

const OL = '#2B3A24';
const G = '#8AA16E';
const GD = '#6F8955';
const CREAM = '#EFE6BE';

export function KomoFace({ kind, size = 44 }: { kind: ReactionKey; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ overflow: 'visible' }}>
      <path d="M22 14l3 7-8-2zM32 10l3 8-8-1zM42 14l-1 7 8-2z" fill={G} stroke={OL} strokeWidth={2} strokeLinejoin="round" />
      <ellipse cx={32} cy={36} rx={26} ry={23} fill={G} stroke={OL} strokeWidth={2.4} />
      <circle cx={17} cy={26} r={2.3} fill={GD} /><circle cx={47} cy={25} r={2} fill={GD} /><circle cx={40} cy={19} r={1.6} fill={GD} />
      <ellipse cx={32} cy={43} rx={15} ry={11} fill={CREAM} />
      <circle cx={29} cy={41} r={0.9} fill={OL} /><circle cx={35} cy={41} r={0.9} fill={OL} />
      <ellipse cx={13} cy={42} rx={4.6} ry={3.2} fill="#F2A2A2" opacity={0.8} />
      <ellipse cx={51} cy={42} rx={4.6} ry={3.2} fill="#F2A2A2" opacity={0.8} />

      {kind === 'like' && (
        <g>
          <path d="M20 31c-3-3-8 0-5 4l5 5 5-5c3-4-2-7-5-4z" fill="#EF4A5A" stroke={OL} strokeWidth={1.4} strokeLinejoin="round" />
          <path d="M44 31c-3-3-8 0-5 4l5 5 5-5c3-4-2-7-5-4z" fill="#EF4A5A" stroke={OL} strokeWidth={1.4} strokeLinejoin="round" />
          <path d="M25 47q7 6 14 0q-2 7-7 7t-7-7z" fill="#C0394A" stroke={OL} strokeWidth={1.8} strokeLinejoin="round" />
          <path d="M6 14c-2-2-5 0-3 2.4l3 3 3-3C11 14 8 12 6 14z" fill="#EF4A5A" />
          <path d="M58 12c-1.6-1.6-4 0-2.4 1.9l2.4 2.4 2.4-2.4C62 12 59.600 10.400 58 12z" fill="#EF4A5A" />
        </g>
      )}

      {kind === 'love' && (
        <g>
          <path d="M16 30l9 4-9 4M48 30l-9 4 9 4" fill="none" stroke={OL} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M24 46q8 8 16 0z" fill="#C0394A" stroke={OL} strokeWidth={2} strokeLinejoin="round" />
          <path d="M11 38q-3 4 0 7q3-3 0-7z" fill="#7EC8F0" stroke={OL} strokeWidth={1.2} />
          <path d="M53 38q3 4 0 7q-3-3 0-7z" fill="#7EC8F0" stroke={OL} strokeWidth={1.2} />
        </g>
      )}

      {kind === 'laugh' && (
        <g>
          <circle cx={21} cy={32} r={7.5} fill="#fff" stroke={OL} strokeWidth={2} /><circle cx={43} cy={32} r={7.5} fill="#fff" stroke={OL} strokeWidth={2} />
          <circle cx={21} cy={33} r={3.2} fill={OL} /><circle cx={43} cy={33} r={3.2} fill={OL} />
          <ellipse cx={32} cy={48} rx={4.2} ry={5} fill="#C0394A" stroke={OL} strokeWidth={2} />
        </g>
      )}

      {kind === 'sad' && (
        <g>
          <path d="M14 27q6-5 11-1M50 27q-6-5-11-1" fill="none" stroke={OL} strokeWidth={2.2} strokeLinecap="round" />
          <circle cx={21} cy={33} r={5.5} fill="#fff" stroke={OL} strokeWidth={2} /><circle cx={43} cy={33} r={5.5} fill="#fff" stroke={OL} strokeWidth={2} />
          <circle cx={21} cy={34} r={2.6} fill={OL} /><circle cx={43} cy={34} r={2.6} fill={OL} />
          <path d="M16 38q-3 8-1 14q4-3 3-10zM48 38q3 8 1 14q-4-3-3-10z" fill="#7EC8F0" stroke={OL} strokeWidth={1.2} strokeLinejoin="round" />
          <path d="M26 52q6-6 12 0" fill="none" stroke={OL} strokeWidth={2.6} strokeLinecap="round" />
        </g>
      )}

      {kind === 'angry' && (
        <g>
          <path d="M13 24l13 6M51 24l-13 6" stroke={OL} strokeWidth={3.4} strokeLinecap="round" />
          <circle cx={21} cy={35} r={5} fill="#fff" stroke={OL} strokeWidth={2} /><circle cx={43} cy={35} r={5} fill="#fff" stroke={OL} strokeWidth={2} />
          <circle cx={22} cy={36} r={2.4} fill={OL} /><circle cx={42} cy={36} r={2.4} fill={OL} />
          <rect x={22} y={45} width={20} height={9} rx={2.5} fill="#fff" stroke={OL} strokeWidth={2} />
          <path d="M27 45v9M32 45v9M37 45v9M22 49.500h20" stroke={OL} strokeWidth={1.4} />
          <path d="M52 8l4 4 4-4M52 18l4-4 4 4" fill="none" stroke="#EF4444" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </svg>
  );
}
