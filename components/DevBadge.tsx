// Lencana khusus Developer: rosetta gradien neon dengan petir.
export default function DevBadge({ size = 18 }: { size?: number }) {
  const id = 'dvg' + size;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-label="Developer" role="img" style={{ flex: '0 0 auto', display: 'inline-block', verticalAlign: 'middle', filter: 'drop-shadow(0 0 4px rgba(129,140,248,.8))' }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#22d3ee" />
          <stop offset="0.5" stopColor="#818cf8" />
          <stop offset="1" stopColor="#e879f9" />
        </linearGradient>
      </defs>
      <path fill={'url(#' + id + ')'} d="M12 1.2l2.5 1.9 3.1-.2 1.1 2.9 2.6 1.8-.9 3 .9 3-2.6 1.8-1.1 2.9-3.1-.2L12 22.8l-2.5-1.9-3.100.2-1.1-2.9-2.6-1.8.9-3-.9-3 2.6-1.8 1.1-2.9 3.1.2z" />
      <path fill="#fff" d="M13 5.6L7.6 13h3.5l-1 5.400L16.400 11h-3.600z" />
    </svg>
  );
}
