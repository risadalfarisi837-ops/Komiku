'use client';
import type { HTMLAttributes, ReactNode } from 'react';
import { WALLPAPER_CATALOG, RARITY_STYLE, wpBg } from '@/lib/wallpapers';

type Props = { wpKey?: string; animated?: boolean; noGlow?: boolean; className?: string; children: ReactNode } & HTMLAttributes<HTMLDivElement>;

/**
 * Pembungkus kartu komentar: kasih wallpaper + efek sesuai rarity. Tanpa wallpaper = div biasa.
 * noGlow=true: tanpa bayangan/denyut emas (untuk daftar panjang seperti Peringkat supaya ringan).
 * Legendary memakai gambar diam supaya daftar komentar tidak ngelag; animated=true hanya untuk 1 tampilan besar.
 */
export default function WallpaperBg({ wpKey, animated = false, noGlow = false, className = '', children, style, ...rest }: Props) {
  const w = wpKey ? WALLPAPER_CATALOG[wpKey] : undefined;
  if (!w) return <div className={className} style={style} {...rest}>{children}</div>;
  const r = RARITY_STYLE[w.rarity];
  return (
    <div
      className={className + ' relative overflow-hidden' + (r.pulse && !noGlow ? ' wp-pulse' : '')}
      style={{ isolation: 'isolate', borderColor: r.border, boxShadow: noGlow ? 'none' : r.glow, ...style }}
      {...rest}
    >
      <div className="absolute inset-0" style={{ zIndex: -1, background: wpBg(wpKey, animated) }} />
      <div className="absolute inset-0 bg-black/55" style={{ zIndex: -1 }} />
      {r.shimmer && <div className="wp-shimmer" />}
      {children}
    </div>
  );
}
