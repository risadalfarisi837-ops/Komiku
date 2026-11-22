'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getFirebase, getUser } from '@/lib/leaderboard';

const GOLD = '#F5C84B';
const GOLD_DIM = '#C9A23F';
const GOLD_BG = '#2E2614';
const GOLD_LINE = '#8C6F1F';
const CARD = '#2A2931';
const MUTED = '#8F8D9B';

type Plan = 'mingguan' | 'bulanan';
const PLANS: { id: Plan; nama: string; harga: string; per: string; label: string }[] = [
  { id: 'mingguan', nama: 'Mingguan', harga: 'Rp 7.000', per: 'per minggu', label: 'Mingguan' },
  { id: 'bulanan', nama: 'Bulanan', harga: 'Rp 25.000', per: 'per bulan', label: 'Bulanan' },
];

const Crown = ({ size = 22, color = GOLD, filled = true }: { size?: number; color?: string; filled?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round">
    <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8z" />
  </svg>
);

const FEATURES = [
  { text: 'Bebas iklan di seluruh aplikasi', icon: <path d="M6 6l12 12M18 6L6 18" /> },
  { text: 'Unduh satu volume sekaligus', icon: <><path d="M12 4v11M7 11l5 5 5-5" /><path d="M5 20h14" /></> },
  { text: 'Lencana Premium dan cincin profil emas', icon: <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8z" /> },
];

export default function PremiumPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan>('bulanan');
  const [isPremium, setIsPremium] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const u = await getUser();
        if (!u) return;
        const { db } = await getFirebase();
        const v = (await db.ref(`users/${u.uid}/role`).get()).val();
        if (alive && (v === 'Komiku Premium' || v === 'Developer')) setIsPremium(true);
      } catch {}
    })();
    return () => { alive = false; };
  }, []);

  const current = PLANS.find((p) => p.id === plan)!;

  // Pembelian Google Play belum tersedia di versi web — jangan pura-pura sukses.
  const lanjut = () => setMsg('Pembelian lewat Google Play belum aktif di versi web ini.');
  const pulihkan = () => setMsg('Tidak ada pembelian yang bisa dipulihkan di versi web ini.');

  return (
    <div style={{ background: '#1B1A20', color: '#fff', minHeight: '100vh', paddingBottom: 40 }}>
      <style>{`button { font-family: inherit; cursor: pointer; }`}</style>

      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '14px 12px 8px' }}>
        <button onClick={() => router.back()} aria-label="Tutup" style={{ background: 'none', border: 0, padding: 8, display: 'flex' }}>
          <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round"><path d="M5 5l14 14M19 5L5 19" /></svg>
        </button>
      </div>

      {/* Kartu atas */}
      <div style={{ margin: '12px 14px 0', background: GOLD_BG, border: `1.5px solid ${GOLD_LINE}`, borderRadius: 22, padding: '22px 18px 20px' }}>
        <Crown size={26} />
        <div style={{ fontSize: 31, fontWeight: 800, letterSpacing: -1.2, color: GOLD, marginTop: 8, lineHeight: 1.1 }}>KomikID Premium</div>
        <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: -0.6, color: GOLD_DIM, marginTop: 6 }}>Baca tanpa gangguan.</div>
      </div>

      {/* Keuntungan */}
      <div style={{ padding: '22px 14px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {FEATURES.map((f) => (
          <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ width: 32, height: 32, borderRadius: '50%', background: '#3A2226', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 32px' }}>
              <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">{f.icon}</svg>
            </span>
            <span style={{ fontSize: 21, fontWeight: 800, letterSpacing: -0.7, lineHeight: 1.2 }}>{f.text}</span>
          </div>
        ))}
      </div>

      {/* Pilihan paket */}
      <div style={{ display: 'flex', gap: 10, padding: '30px 14px 0' }}>
        {PLANS.map((p) => {
          const on = plan === p.id;
          return (
            <button key={p.id} onClick={() => setPlan(p.id)} style={{ position: 'relative', flex: 1, textAlign: 'left', background: CARD, color: '#fff', borderRadius: 20, padding: '14px 16px 14px', border: on ? '2.5px solid #fff' : '1.5px solid rgba(255,255,255,.08)' }}>
              {p.id === 'bulanan' && (
                <span style={{ position: 'absolute', top: -14, right: 6, background: GOLD_BG, border: `1.5px solid ${GOLD_LINE}`, color: GOLD, fontSize: 16, fontWeight: 800, letterSpacing: -0.4, padding: '2px 12px', borderRadius: 99 }}>Paling hemat</span>
              )}
              <span style={{ position: 'absolute', top: 14, right: 14, width: 22, height: 22, borderRadius: '50%', border: on ? '0' : `2px solid ${MUTED}`, background: on ? '#fff' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {on && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1B1A20' }} />}
              </span>
              <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: -0.5, color: MUTED }}>{p.nama}</div>
              <div style={{ fontSize: 27, fontWeight: 800, letterSpacing: -1, marginTop: 2 }}>{p.harga}</div>
              <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.4, color: MUTED, marginTop: 2 }}>{p.per}</div>
            </button>
          );
        })}
      </div>

      {/* Tombol lanjut */}
      <div style={{ padding: '22px 14px 0' }}>
        <button onClick={lanjut} disabled={isPremium} style={{ width: '100%', height: 56, borderRadius: 28, background: GOLD_BG, border: `1.5px solid ${GOLD_LINE}`, color: GOLD, fontSize: 22, fontWeight: 800, letterSpacing: -0.7, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: isPremium ? 0.6 : 1 }}>
          <Crown size={22} />{isPremium ? 'Premium aktif' : `Lanjutkan dengan ${current.label}`}
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: 28 }}>
        <button onClick={pulihkan} style={{ background: 'none', border: 0, color: '#fff', fontSize: 21, fontWeight: 800, letterSpacing: -0.6, padding: 8 }}>Pulihkan pembelian</button>
      </div>

      {msg && <div style={{ textAlign: 'center', color: GOLD, fontSize: 16, fontWeight: 800, letterSpacing: -0.3, padding: '4px 28px 0' }}>{msg}</div>}

      <div style={{ textAlign: 'center', color: MUTED, fontSize: 17, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.35, padding: '22px 22px 0' }}>
        Diperpanjang otomatis sampai dibatalkan. Batalkan kapan saja lewat Google Play.
      </div>
    </div>
  );
}
