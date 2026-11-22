export type EffectKind = 'sparkle' | 'petal' | 'firefly' | 'ember' | 'snow' | 'rain';
export type EffectTier = 'Basic' | 'Standard' | 'Premium';

export interface EffectItem {
  nama: string;
  harga: number;
  tier: EffectTier;
  kind: EffectKind;
  color: string;      // warna utama partikel
  color2?: string;    // warna kedua (opsional)
  url?: string;       // opsional: kalau diisi, pakai gambar animasi (webp/apng/gif transparan) alih-alih partikel
}

export const EFFECT_CATALOG: Record<string, EffectItem> = {
  'whispering-rose': { nama: 'Whispering Rose', harga: 500,  tier: 'Basic',    kind: 'petal',   color: '#f9a8d4', color2: '#fecdd3' },
  'starlight':       { nama: 'Starlight',       harga: 500,  tier: 'Basic',    kind: 'sparkle', color: '#e0e7ff', color2: '#a5b4fc' },
  'fireflies':       { nama: 'Fireflies',       harga: 800,  tier: 'Basic',    kind: 'firefly', color: '#fde68a', color2: '#bef264' },
  'snowfall':        { nama: 'Snowfall',        harga: 1000, tier: 'Standard', kind: 'snow',    color: '#ffffff', color2: '#bae6fd' },
  'ember-drift':     { nama: 'Ember Drift',     harga: 1500, tier: 'Standard', kind: 'ember',   color: '#fb923c', color2: '#ef4444' },
  'neon-rain':       { nama: 'Neon Rain',       harga: 3000, tier: 'Premium',  kind: 'rain',    color: '#22d3ee', color2: '#a78bfa' },
};
