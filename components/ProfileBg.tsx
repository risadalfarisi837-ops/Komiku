'use client';

import { BG_CATALOG } from '@/lib/backgrounds';

// Latar bergambar CSS. Induknya harus position:relative + isolation:isolate (supaya z-index -1 tetap di atas latar induk).
export default function ProfileBg({ k, fade = false }: { k?: string | null; fade?: boolean }) {
  const b = k ? BG_CATALOG[k] : null;
  if (!b) return null;
  return (
    <>
      {b.anim && <style>{`@keyframes bgShift{0%{filter:hue-rotate(0deg) brightness(1)}100%{filter:hue-rotate(28deg) brightness(1.2)}}`}</style>}
      <div aria-hidden style={{ position: 'absolute', inset: 0, zIndex: -1, background: b.css, animation: b.anim ? 'bgShift 6s ease-in-out infinite alternate' : undefined }} />
      {fade && <div aria-hidden style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '45%', zIndex: -1, background: 'linear-gradient(to bottom, transparent, #1B1A20)' }} />}
    </>
  );
}
