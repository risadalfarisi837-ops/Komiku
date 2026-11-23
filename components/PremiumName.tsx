'use client';

import type { CSSProperties, ReactNode } from 'react';

// Nama pengguna Premium: emas berkilau bergerak. Pengguna biasa tampil seperti teks normal.
function ensureCss() {
  if (typeof document === 'undefined' || document.getElementById('pn-css')) return;
  const s = document.createElement('style');
  s.id = 'pn-css';
  s.textContent = '@keyframes pnShine{0%{background-position:0% 50%}100%{background-position:200% 50%}}@media (prefers-reduced-motion:reduce){.pn-gold{animation:none!important}}';
  document.head.appendChild(s);
}

export default function PremiumName({ premium, children, style, className }: { premium?: boolean; children?: ReactNode; style?: CSSProperties; className?: string }) {
  if (!premium) return <span className={className} style={style}>{children}</span>;
  ensureCss();
  return (
    <span
      className={'pn-gold ' + (className || '')}
      style={{
        ...style,
        backgroundImage: 'linear-gradient(90deg,#f5c84b,#fff3b0,#ff9a3c,#ffe58a,#f5c84b)',
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        color: 'transparent',
        animation: 'pnShine 3.2s linear infinite',
        filter: 'drop-shadow(0 0 6px rgba(245,200,75,.35))',
      }}
    >
      {children}
    </span>
  );
}
