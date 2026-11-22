'use client';
import type { HTMLAttributes, ReactNode } from 'react';
import { WALLPAPER_CATALOG, RARITY_STYLE } from '@/lib/wallpapers';
import ProfileEffect from '@/components/ProfileEffect';

type Props = { wpKey?: string; className?: string; children: ReactNode } & HTMLAttributes<HTMLDivElement>;

/** Pembungkus kartu komentar: kasih wallpaper + efek sesuai rarity. Tanpa wallpaper = div biasa. */
export default function WallpaperBg({ wpKey, className = '', children, style, ...rest }: Props) {
  const w = wpKey ? WALLPAPER_CATALOG[wpKey] : undefined;
  if (!w) return <div className={className} style={style} {...rest}>{children}</div>;
  const r = RARITY_STYLE[w.rarity];
  return (
    <div
      className={className + ' relative overflow-hidden' + (r.pulse ? ' wp-pulse' : '')}
      style={{ isolation: 'isolate', borderColor: r.border, boxShadow: r.glow, ...style }}
      {...rest}
    >
      <div className="absolute inset-0" style={{ zIndex: -1, background: w.url ? 'url(' + w.url + ') center/cover' : w.grad }} />
      <div className="absolute inset-0 bg-black/55" style={{ zIndex: -1 }} />
      {r.shimmer && <div className="wp-shimmer" />}
      {r.sparkle && <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}><ProfileEffect item={r.sparkle} min={8} /></div>}
      {children}
    </div>
  );
}
