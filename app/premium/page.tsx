'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getFirebase, getUser } from '@/lib/leaderboard';
import { setPremiumCache } from '@/lib/premium';
import VerifiedBadge from '@/components/VerifiedBadge';

const GOLD = '#F5C84B';
const GOLD_DIM = '#C9A23F';
const GOLD_BG = '#2E2614';
const GOLD_LINE = '#8C6F1F';
const CARD = '#2A2931';
const MUTED = '#8F8D9B';

type Plan = 'bulanan' | 'tahunan';
const PLANS: { id: Plan; nama: string; harga: string; per: string; label: string; crystal: number }[] = [
  { id: 'bulanan', nama: 'Bulanan', harga: 'Rp 5.000', per: 'per bulan', label: 'Bulanan', crystal: 500 },
  { id: 'tahunan', nama: 'Tahunan', harga: 'Rp 30.000', per: 'per tahun', label: 'Tahunan', crystal: 6000 },
];

const Crown = ({ size = 22, color = GOLD, filled = true }: { size?: number; color?: string; filled?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round">
    <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8z" />
  </svg>
);

// Nomor WhatsApp admin (format internasional tanpa + / spasi / 0 di depan), contoh: '6281234567890'
const ADMIN_WA = '6281315059849';
const WA_READY = /^\d{9,15}$/.test(ADMIN_WA);
const QRIS_NAME = 'Risyadh All Store';

const K_ORDER = 'komiku-premium-order';
const ORDER_TTL = 24 * 60 * 60 * 1000; // pesanan berlaku 24 jam
const BASE_PRICE: Record<Plan, number> = { bulanan: 5000, tahunan: 30000 };

const FEATURES = [
  { text: 'Bebas iklan di seluruh aplikasi', icon: <path d="M6 6l12 12M18 6L6 18" /> },
  { text: 'Unduh satu volume sekaligus', icon: <><path d="M12 4v11M7 11l5 5 5-5" /><path d="M5 20h14" /></> },
  { text: 'Lencana Premium dan cincin profil emas', icon: <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8z" /> },
  { text: 'Centang biru di profil dan komentarmu', badge: true },
  { text: 'Poin musim bertambah 30%', icon: <><path d="M4 17l6-6 4 4 6-7" /><path d="M15 8h5v5" /></> },
  { text: 'Dapat Crystal sesuai paket yang dibeli', icon: <><path d="M6 4h12l3 5-9 11L3 9l3-5z" /><path d="M3 9h18" /></> },
];

export default function PremiumPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan>('tahunan');
  const [isPremium, setIsPremium] = useState(false);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [until, setUntil] = useState(0);
  const [pay, setPay] = useState<null | { orderId: string; amount: number; plan: Plan; createdAt: number; before: number; claimed: boolean }>(null);
  const [payState, setPayState] = useState<'wait' | 'ok' | 'rejected' | 'expired'>('wait');
  const [qrMissing, setQrMissing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [payName, setPayName] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const u: any = await getUser();
        if (!u) return;
        if (alive) setPayName(u.displayName || '');
        const { db } = await getFirebase();
        const v = (await db.ref(`users/${u.uid}/role`).get()).val();
        const pu = Number((await db.ref(`users/${u.uid}/premiumUntil`).get()).val()) || 0;
        // aktif kalau role Premium dan (tanpa batas waktu atau belum lewat)
        const aktif = v === 'Developer' || (v === 'Komikita Premium' && (!pu || pu > Date.now()));
        setPremiumCache(v === 'Komikita Premium' && (!pu || pu > Date.now()), pu);
        // lanjutkan pesanan yang masih menunggu
        try {
          const oid = localStorage.getItem(K_ORDER);
          if (oid) {
            const o = (await db.ref(`premiumOrders/${oid}`).get()).val();
            if (o && o.status === 'pending' && Date.now() - o.createdAt < ORDER_TTL) {
              if (alive) { setPay({ orderId: oid, amount: o.amount, plan: o.plan, createdAt: o.createdAt, before: pu, claimed: !!o.claimed }); setPayState('wait'); }
            } else localStorage.removeItem(K_ORDER);
          }
        } catch {}
        if (alive) { setUntil(pu); setIsPremium(aktif); }
      } catch {}
    })();
    return () => { alive = false; };
  }, []);

  const current = PLANS.find((p) => p.id === plan)!;

  const fmtDate = (ms: number) => new Date(ms).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  // Buat pesanan dengan nominal unik (harga + 3 digit) supaya pembayarannya mudah dicocokkan admin
  const lanjut = async () => {
    setMsg('');
    setBusy(true);
    try {
      const u: any = await getUser();
      if (!u) { setMsg('Masuk dulu lewat halaman Profil.'); setBusy(false); return; }
      setPayName(u.displayName || '');
      const { db } = await getFirebase();
      const amount = BASE_PRICE[plan] + 100 + Math.floor(Math.random() * 900);
      const ref = db.ref('premiumOrders').push();
      const createdAt = Date.now();
      await ref.set({ uid: u.uid, name: u.displayName || 'User', plan, amount, base: BASE_PRICE[plan], status: 'pending', createdAt });
      try { localStorage.setItem(K_ORDER, String(ref.key)); } catch {}
      setPay({ orderId: String(ref.key), amount, plan, createdAt, before: until, claimed: false });
      setPayState('wait');
      setQrMissing(false);
    } catch (e: any) { setMsg('Gagal membuat pesanan: ' + (e?.message || 'coba lagi')); }
    setBusy(false);
  };

  // Chat WhatsApp admin dengan ringkasan pesanan sudah terisi; bukti bayar dilampirkan user di chat
  const waUrl = () => {
    if (!pay || !WA_READY) return '';
    const paket = PLANS.find((p) => p.id === pay.plan)?.nama || pay.plan;
    const teks = `Halo, saya sudah bayar Komikita Premium.\n\nPaket: ${paket}\nNominal: Rp ${pay.amount.toLocaleString('id-ID')}\nNama: ${payName || 'User'}\nID pesanan: ${pay.orderId}\n\nBukti pembayaran saya kirim di chat ini.`;
    return `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(teks)}`;
  };
  const bukaWa = () => { const url = waUrl(); if (url) window.open(url, '_blank'); };

  const sudahBayar = async () => {
    if (!pay) return;
    bukaWa(); // dibuka sebelum proses async supaya tidak diblokir browser
    try {
      const { db } = await getFirebase();
      await db.ref(`premiumOrders/${pay.orderId}/claimed`).set(true);
      setPay({ ...pay, claimed: true });
    } catch { setMsg('Gagal mengirim. Coba lagi.'); }
  };

  const salinNominal = () => {
    if (!pay) return;
    try { navigator.clipboard.writeText(String(pay.amount)); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  };

  // Cek ulang status akun
  const pulihkan = async () => {
    setMsg('');
    try {
      const u: any = await getUser();
      if (!u) { setMsg('Masuk dulu lewat halaman Profil.'); return; }
      const { db } = await getFirebase();
      const v = (await db.ref(`users/${u.uid}/role`).get()).val();
      const pu = Number((await db.ref(`users/${u.uid}/premiumUntil`).get()).val()) || 0;
      setUntil(pu);
      const aktif = v === 'Developer' || (v === 'Komikita Premium' && (!pu || pu > Date.now()));
      setPremiumCache(v === 'Komikita Premium' && (!pu || pu > Date.now()), pu);
      setIsPremium(aktif);
      setMsg(aktif ? 'Premium kamu aktif.' : 'Belum ada pembayaran yang disetujui.');
    } catch { setMsg('Gagal memeriksa status. Coba lagi.'); }
  };

  // Pantau pesanan: saat admin menyetujui, status berubah dan layar ini ikut berubah
  useEffect(() => {
    if (!pay || payState !== 'wait') return;
    let alive = true;
    const poll = setInterval(async () => {
      try {
        if (Date.now() - pay.createdAt > ORDER_TTL) { setPayState('expired'); try { localStorage.removeItem(K_ORDER); } catch {} return; }
        const { db } = await getFirebase();
        const o = (await db.ref(`premiumOrders/${pay.orderId}`).get()).val();
        if (!alive || !o) return;
        if (o.status === 'approved') {
          const u: any = await getUser();
          const pu = u ? Number((await db.ref(`users/${u.uid}/premiumUntil`).get()).val()) || 0 : 0;
          setUntil(pu); setIsPremium(true); setPayState('ok'); setPremiumCache(true, pu);
          try { localStorage.removeItem(K_ORDER); } catch {}
        } else if (o.status === 'rejected') {
          setPayState('rejected');
          try { localStorage.removeItem(K_ORDER); } catch {}
        }
      } catch {}
    }, 4000);
    return () => { alive = false; clearInterval(poll); };
  }, [pay, payState]);

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
        <div style={{ fontSize: 31, fontWeight: 800, letterSpacing: -1.2, color: GOLD, marginTop: 8, lineHeight: 1.1 }}>Komikita Premium</div>
        <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: -0.6, color: GOLD_DIM, marginTop: 6 }}>Baca tanpa gangguan.</div>
      </div>

      {/* Keuntungan */}
      <div style={{ padding: '22px 14px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {FEATURES.map((f) => (
          <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ width: 32, height: 32, borderRadius: '50%', background: '#3A2226', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 32px' }}>
              {(f as any).badge
                ? <VerifiedBadge size={22} />
                : <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">{f.icon}</svg>}
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
              {p.id === 'tahunan' && (
                <span style={{ position: 'absolute', top: -14, right: 6, background: GOLD_BG, border: `1.5px solid ${GOLD_LINE}`, color: GOLD, fontSize: 16, fontWeight: 800, letterSpacing: -0.4, padding: '2px 12px', borderRadius: 99 }}>Paling hemat</span>
              )}
              <span style={{ position: 'absolute', top: 14, right: 14, width: 22, height: 22, borderRadius: '50%', border: on ? '0' : `2px solid ${MUTED}`, background: on ? '#fff' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {on && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1B1A20' }} />}
              </span>
              <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: -0.5, color: MUTED }}>{p.nama}</div>
              <div style={{ fontSize: 27, fontWeight: 800, letterSpacing: -1, marginTop: 2 }}>{p.harga}</div>
              <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.4, color: MUTED, marginTop: 2 }}>{p.per}</div>
              <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.4, color: GOLD, marginTop: 6 }}>+{p.crystal.toLocaleString('id-ID')} Crystal</div>
            </button>
          );
        })}
      </div>

      {/* Tombol lanjut */}
      <div style={{ padding: '22px 14px 0' }}>
        {isPremium && until > Date.now() && <div style={{ textAlign: 'center', color: GOLD, fontSize: 17, fontWeight: 800, letterSpacing: -0.4, marginBottom: 10 }}>Premium aktif sampai {fmtDate(until)}</div>}
        <button onClick={lanjut} disabled={busy} style={{ width: '100%', height: 56, borderRadius: 28, background: GOLD_BG, border: `1.5px solid ${GOLD_LINE}`, color: GOLD, fontSize: 22, fontWeight: 800, letterSpacing: -0.7, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: busy ? 0.6 : 1 }}>
          <Crown size={22} />{busy ? 'Membuat QRIS...' : isPremium ? `Perpanjang (${current.label})` : `Lanjutkan dengan ${current.label}`}
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: 28 }}>
        <button onClick={pulihkan} style={{ background: 'none', border: 0, color: '#fff', fontSize: 21, fontWeight: 800, letterSpacing: -0.6, padding: 8 }}>Cek status pembayaran</button>
      </div>

      {msg && <div style={{ textAlign: 'center', color: GOLD, fontSize: 16, fontWeight: 800, letterSpacing: -0.3, padding: '4px 28px 0' }}>{msg}</div>}

      <div style={{ textAlign: 'center', color: MUTED, fontSize: 17, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.35, padding: '22px 22px 0' }}>
        Bayar sekali sesuai paket, tidak diperpanjang otomatis. Bayar lagi sebelum habis untuk menambah masa aktif.
      </div>

      {/* Lembar pembayaran manual (QRIS + nominal unik) */}
      {pay && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 80, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div onClick={() => payState !== 'ok' && setPay(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.65)' }} />
          <div style={{ position: 'relative', background: '#16151A', borderRadius: '28px 28px 0 0', padding: '16px 20px 28px', width: 'min(100%, 448px)', margin: '0 auto', textAlign: 'center', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.2)', margin: '0 auto 14px' }} />
            {payState === 'ok' ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'center' }}><Crown size={56} /></div>
                <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, color: GOLD, marginTop: 10 }}>Premium aktif!</div>
                {until > 0 && <div style={{ color: '#D6D4DE', fontSize: 17, fontWeight: 700, marginTop: 6 }}>Berlaku sampai {fmtDate(until)}</div>}
                <button onClick={() => setPay(null)} style={{ marginTop: 22, width: '100%', height: 52, borderRadius: 26, border: 0, background: GOLD, color: '#2A2208', fontSize: 19, fontWeight: 800 }}>Selesai</button>
              </>
            ) : payState === 'rejected' || payState === 'expired' ? (
              <>
                <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.8 }}>{payState === 'rejected' ? 'Pembayaran ditolak' : 'Pesanan kedaluwarsa'}</div>
                <div style={{ color: MUTED, fontSize: 16, fontWeight: 700, marginTop: 6, lineHeight: 1.4 }}>{payState === 'rejected' ? 'Admin belum menemukan pembayaran dengan nominal itu. Kalau kamu sudah bayar, hubungi admin.' : 'Pesanan berlaku 24 jam. Buat pesanan baru kalau belum bayar.'}</div>
                <button onClick={() => setPay(null)} style={{ marginTop: 20, width: '100%', height: 52, borderRadius: 26, border: 0, background: '#2A2931', color: '#fff', fontSize: 18, fontWeight: 800 }}>Tutup</button>
              </>
            ) : (
              <>
                <div style={{ color: MUTED, fontSize: 15, fontWeight: 800 }}>Bayar TEPAT sebesar</div>
                <button onClick={salinNominal} style={{ background: 'none', border: 0, color: GOLD, fontSize: 36, fontWeight: 800, letterSpacing: -1.5, marginTop: 2 }}>Rp {pay.amount.toLocaleString('id-ID')}</button>
                <div style={{ color: MUTED, fontSize: 13.5, fontWeight: 700, lineHeight: 1.4 }}>{copied ? 'Nominal disalin ✓' : 'Tap nominal untuk menyalin. 3 digit terakhir dipakai untuk mencocokkan pembayaranmu.'}</div>
                <div style={{ background: '#fff', borderRadius: 20, padding: 10, margin: '14px auto 0', width: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {qrMissing
                    ? <span style={{ color: '#333', fontWeight: 700, fontSize: 14 }}>Gambar QRIS belum dipasang (public/qris.png)</span>
                    // eslint-disable-next-line @next/next/no-img-element
                    : <img src="/qris.png" alt="QRIS" onError={() => setQrMissing(true)} style={{ width: '100%', objectFit: 'contain' }} />}
                </div>
                <div style={{ color: '#D6D4DE', fontSize: 15, fontWeight: 800, marginTop: 8 }}>QRIS · {QRIS_NAME}</div>
                <div style={{ color: '#D6D4DE', fontSize: 14.5, fontWeight: 700, lineHeight: 1.5, marginTop: 12, textAlign: 'left' }}>
                  1. Scan QRIS dengan DANA atau e-wallet apa saja<br />
                  2. Isi nominal persis seperti di atas<br />
                  {WA_READY
                    ? <>3. Setelah bayar, tap “Saya sudah bayar”. WhatsApp admin terbuka, kirim screenshot bukti bayarnya<br /></>
                    : <>3. Setelah bayar, tap “Saya sudah bayar”<br /></>}
                  Admin akan mengecek lalu mengaktifkan Premium. Layar ini berubah sendiri.
                </div>
                {pay.claimed
                  ? <>
                      <div style={{ marginTop: 16, color: '#6FD6B2', fontWeight: 800, fontSize: 16 }}>✓ Menunggu persetujuan admin</div>
                      {WA_READY && <button onClick={bukaWa} style={{ marginTop: 12, width: '100%', height: 48, borderRadius: 24, border: 0, background: '#25D366', color: '#0B2E17', fontSize: 17, fontWeight: 800 }}>Kirim bukti ke WhatsApp</button>}
                    </>
                  : <button onClick={sudahBayar} style={{ marginTop: 16, width: '100%', height: 52, borderRadius: 26, border: 0, background: GOLD, color: '#2A2208', fontSize: 19, fontWeight: 800 }}>Saya sudah bayar</button>}
                <button onClick={() => setPay(null)} style={{ marginTop: 10, width: '100%', height: 46, borderRadius: 23, border: 0, background: '#2A2931', color: '#fff', fontSize: 16, fontWeight: 800 }}>Tutup (pesanan tetap tersimpan)</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
