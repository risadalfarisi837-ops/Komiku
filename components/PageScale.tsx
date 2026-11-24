'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

// Skala tampilan halaman utama. 1 = ukuran asli, makin kecil makin ringkas.
// Ubah angka ini kalau mau lebih kecil (misal 0.8) atau lebih besar (misal 0.9).
const UI_SCALE = 0.85;

// Halaman yang dikecilkan (Peringkat sudah pas, jadi tidak ikut)
const SCALED_PAGES = ['/', '/schedule', '/history', '/profile'];

export default function PageScale({ children }: { children: ReactNode }) {
  const path = usePathname();
  if (!SCALED_PAGES.includes(path)) return <>{children}</>;
  return <div className="ui-scale" style={{ zoom: UI_SCALE }}>{children}</div>;
}
