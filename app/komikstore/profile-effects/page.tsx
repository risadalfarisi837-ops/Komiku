'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, ShoppingBag, Smile, Sparkles } from 'lucide-react';
import { getFirebase } from '@/lib/firebase-client';
import { EFFECT_CATALOG } from '@/lib/effects';
import ProfileEffect from '@/components/ProfileEffect';

type Tier = 'Basic' | 'Standard' | 'Premium';
type Item = { key: string; nama: string; harga: number; tier: Tier };

const TIERS = ['Semua', 'Basic', 'Standard', 'Premium'] as const;
const tierOf = (h: number): Tier => (h >= 3000 ? 'Premium' : h >= 1000 ? 'Standard' : 'Basic');
const TIER_CLR: Record<Tier, string> = { Basic: '#cbd5e1', Standard: '#7dd3fc', Premium: '#fcd34d' };
const fmt = (n: number) =>
  n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'
  : n >= 1e3 ? (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K' : String(n);

function Preview({ photo, effectKey, h }: { photo: string; effectKey?: string; h: number }) {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl" style={{ height: h, background: 'radial-gradient(circle at 50% 35%,#1a2440,#0a0f1e)' }}>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full overflow-hidden bg-white/10" style={{ width: h * 0.42, height: h * 0.42 }}>
        {photo ? <img src={photo} alt="" className="w-full h-full object-cover" /> : null}
      </div>
      <ProfileEffect effectKey={effectKey} />
    </div>
  );
}

export default function ProfileEffectsPage() {
  const router = useRouter();
  const [fb, setFb] = useState<any>(null);
  const [uid, setUid] = useState('');
  const [ready, setReady] = useState(false);
  const [d, setD] = useState<any>({});
  const [tab, setTab] = useState<'shop' | 'koleksi'>('shop');
  const [q, setQ] = useState('');
  const [tier, setTier] = useState<(typeof TIERS)[number]>('Semua');
  const [confirm, setConfirm] = useState<Item | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    let stop = false;
    let off: (() => void) | undefined;
    getFirebase().then((f: any) => {
      if (stop) return;
      setFb(f);
      off = f.auth.onAuthStateChanged(async (u: any) => {
        if (stop) return;
        if (!u) { setUid(''); setReady(true); return; }
        setUid(u.uid);
        try {
          const v = (await f.db.ref('users/' + u.uid).get()).val() || {};
          if (!stop) setD({ ...v, photoURL: v.photoURL || u.photoURL || '' });
        } catch {}
        if (!stop) setReady(true);
      });
    }).catch(() => setReady(true));
    return () => { stop = true; if (off) off(); };
  }, []);

  const say = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2200); };
  const ref = () => fb.db.ref('users/' + uid);
  const koin: number = d.koin || 0;
  const owned: Record<string, boolean> = d.ownedEffects || {};
  const active: string = d.activeEffect || '';

  const items: Item[] = useMemo(
    () => Object.entries(EFFECT_CATALOG).map(([key, v]) => ({
      key, nama: v.nama, harga: v.harga || 0, tier: v.tier || tierOf(v.harga || 0),
    })),
    []
  );

  const shopCount = items.filter((i) => !owned[i.key]).length;
  const ownCount = items.filter((i) => owned[i.key]).length;
  const list = items.filter((i) =>
    (tab === 'koleksi' ? !!owned[i.key] : !owned[i.key]) &&
    (tier === 'Semua' || i.tier === tier) &&
    i.nama.toLowerCase().includes(q.trim().toLowerCase())
  );
  const activeItem = items.find((i) => i.key === active);

  const equip = async (key: string) => {
    if (!fb || !uid || busy) return;
    setBusy(true);
    try {
      await ref().update({ activeEffect: key });
      setD((p: any) => ({ ...p, activeEffect: key }));
    } catch { say('Gagal, coba lagi'); }
    setBusy(false);
  };

  const buy = async (it: Item) => {
    if (!fb || !uid || busy) return;
    setBusy(true);
    try {
      const cur = ((await ref().get()).val() || {}).koin || 0;
      if (cur < it.harga) { say('Crystal kurang'); setBusy(false); setConfirm(null); return; }
      await ref().update({ koin: cur - it.harga, ['ownedEffects/' + it.key]: true, activeEffect: it.key });
      setD((p: any) => ({
        ...p, koin: cur - it.harga,
        ownedEffects: { ...(p.ownedEffects || {}), [it.key]: true },
        activeEffect: it.key,
      }));
      say(it.nama + ' dibeli & dipakai');
    } catch { say('Gagal, coba lagi'); }
    setBusy(false);
    setConfirm(null);
  };

  const card = 'rounded-3xl border border-white/10 bg-[#111a2e]';

  return (
    <div className="fixed inset-0 overflow-y-auto text-white"
      style={{ background: 'radial-gradient(ellipse at top,#131b33 0%,#0a0f1e 60%,#070a14 100%)' }}>
      <div className="max-w-md mx-auto pb-16">
        <div className="flex items-center gap-4 px-5 pt-8 pb-5">
          <button onClick={() => router.back()} className="active:scale-90 transition-transform">
            <ArrowLeft className="w-7 h-7" />
          </button>
          <h1 className="text-2xl font-black">Profile Effects</h1>
        </div>

        {ready && !uid && <p className="px-5 pt-6 text-white/60">Login dulu buat ganti effect.</p>}

        {uid && (
          <>
            <div className={card + ' mx-4 p-4 flex items-center gap-4'}>
              <div className="w-24 shrink-0"><Preview photo={d.photoURL} effectKey={activeItem?.key} h={96} /></div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white/50">Profile effect aktif</p>
                <p className="text-xl font-black truncate">{activeItem ? activeItem.nama : 'Belum dipakai'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  <span className="font-black">{koin.toLocaleString('id-ID')}</span>
                  <span className="text-sm font-bold text-white/50">Crystal</span>
                </div>
                {activeItem && (
                  <button onClick={() => equip('')} disabled={busy}
                    className="mt-2 rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold active:scale-95 transition-transform">
                    Lepas effect
                  </button>
                )}
              </div>
            </div>

            <div className={card + ' mx-4 mt-3 p-1.5 grid grid-cols-2 gap-1.5'}>
              {([['shop', 'Shop', shopCount, ShoppingBag], ['koleksi', 'Koleksi', ownCount, Smile]] as const).map(([k, label, n, Ic]) => (
                <button key={k} onClick={() => setTab(k)}
                  className="flex items-center justify-center gap-2 rounded-2xl py-3 font-black transition-colors"
                  style={{ background: tab === k ? '#1b2a4d' : 'transparent', color: tab === k ? '#fff' : 'rgba(255,255,255,.55)' }}>
                  <Ic className="w-5 h-5" />{label}
                  <span style={{ color: tab === k ? '#34d399' : 'rgba(255,255,255,.4)' }}>{n}</span>
                </button>
              ))}
            </div>

            <div className={card + ' mx-4 mt-3 flex items-center gap-3 px-4 py-3'}>
              <Search className="w-5 h-5 text-white/50" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama effect..."
                className="flex-1 bg-transparent outline-none font-bold placeholder:text-white/35" />
            </div>

            <div className="flex gap-2 overflow-x-auto px-4 py-3">
              {TIERS.map((t) => (
                <button key={t} onClick={() => setTier(t)}
                  className="shrink-0 rounded-full border px-5 py-2 font-black transition-colors"
                  style={{
                    background: tier === t ? '#3a4152' : 'transparent',
                    borderColor: tier === t ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.14)',
                    color: tier === t ? '#fff' : 'rgba(255,255,255,.6)',
                  }}>{t}</button>
              ))}
            </div>

            {list.length === 0 && <p className="px-5 pt-6 text-center text-white/40 font-bold">Tidak ada effect</p>}

            <div className="grid grid-cols-2 gap-3 px-4">
              {list.map((it) => {
                const mine = !!owned[it.key];
                const on = active === it.key;
                const can = koin >= it.harga;
                return (
                  <div key={it.key} className={card + ' p-3'}>
                    <div className="relative">
                      <span className="absolute left-2 top-2 z-10 rounded-full bg-black/70 border border-white/15 px-3 py-1 text-xs font-black"
                        style={{ color: TIER_CLR[it.tier] }}>{it.tier}</span>
                      <Preview photo={d.photoURL} effectKey={it.key} h={190} />
                    </div>
                    <p className="mt-3 text-center font-black truncate">{it.nama}</p>
                    {mine ? (
                      <button onClick={() => !on && equip(it.key)} disabled={busy || on}
                        className="mt-3 w-full rounded-2xl py-3 font-black active:scale-95 transition-transform"
                        style={on
                          ? { background: '#10331f', border: '1.5px solid #22c55e', color: '#4ade80' }
                          : { background: '#1b2a4d', border: '1.5px solid #3b82f6', color: '#fff' }}>
                        {on ? 'Sedang dipakai' : 'Pakai'}
                      </button>
                    ) : (
                      <button onClick={() => can && setConfirm(it)} disabled={busy}
                        className="mt-3 w-full rounded-2xl py-2.5 font-black active:scale-95 transition-transform"
                        style={can
                          ? { background: '#2a1f5c', border: '1.5px solid #8b5cf6', color: '#fff' }
                          : { background: '#3b2d14', border: '1.5px solid #b8860b', color: '#fcd34d' }}>
                        <div className="text-sm">{can ? 'Beli' : 'Crystal Kurang'}</div>
                        <div className="flex items-center justify-center gap-1 text-lg">
                          <Sparkles className="w-4 h-4" />{fmt(it.harga)}
                        </div>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65" onClick={() => !busy && setConfirm(null)}>
          <div className="w-full max-w-md rounded-t-3xl bg-[#1a2238] p-5 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto w-40"><Preview photo={d.photoURL} effectKey={confirm.key} h={170} /></div>
            <p className="mt-2 text-xl font-black">{confirm.nama}</p>
            <p className="mt-1 text-white/60 font-bold">Beli seharga {confirm.harga.toLocaleString('id-ID')} Crystal?</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button onClick={() => setConfirm(null)} disabled={busy} className="rounded-2xl bg-white/10 py-3 font-black">Batal</button>
              <button onClick={() => buy(confirm)} disabled={busy} className="rounded-2xl bg-violet-500 py-3 font-black">
                {busy ? '...' : 'Beli'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] rounded-full bg-slate-900/90 px-4 py-2 text-sm font-bold">
          {toast}
        </div>
      )}
    </div>
  );
}
