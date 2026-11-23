// Centang biru untuk pengguna Komikita Premium
export default function VerifiedBadge({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-label="Premium" role="img" style={{ flex: '0 0 auto', display: 'inline-block', verticalAlign: 'middle' }}>
      <circle cx={12} cy={12} r={10.5} fill="#1D9BF0" />
      <path d="M7.6 12.3l3 3 5.8-6.2" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
