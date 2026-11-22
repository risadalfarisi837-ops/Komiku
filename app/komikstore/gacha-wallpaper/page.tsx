'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Sparkles, Check, RefreshCw } from 'lucide-react';
import { getFirebase } from '@/lib/firebase-client';
import { WALLPAPER_CATALOG, RARITY_STYLE, RARITIES, RATES, COST_1, COST_10, rollMany, type Rarity } from '@/lib/wallpapers';
import WallpaperBg from '@/components/WallpaperBg';

const fmt = (n: number) => (n >= 1e3 ? (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K' : String(n));
const rank = (k: string) => RARITIES.indexOf(WALLPAPER_CATALOG[k].rarity);
const bg = (k: string) => { const w = WALLPAPER_CATALOG[k]; return w.url ? 'url(' + w.url + ') center/cover' : w.grad; };

function Pill({ r }: { r: Rarity }) {
  return <span className="rounded-full bg-black/70 border border-white/15 px-3 py-1 text-xs font-black" style={{ color: RARITY_STYLE[r].color }}>{r}</span>;
}

export default function GachaWallpaperPage() {
  const router = useRouter();
  const [fb, setFb] = useState<any>(null);
  const [uid, setUid] = useState('');
  const [ready, setReady] = useState(false);
  const [d, setD] = useState<any>({});
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const [result, setResult] = useState<{ key: string; isNew: boolean }[] | null>(null);

  const load = async (f: any, id: string, photo = '') => {
    try {
      const v = (await f.db.ref('users/' + id).get()).val() || {};
      setD({ ...v, photoURL: v.photoURL || photo });
    } catch {}
  };

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
        await load(f, u.uid, u.photoURL || '');
        if (!stop) setReady(true);
      });
    }).catch(() => setReady(true));
    return () => { stop = true; if (off) off(); };
  }, []);

  const say = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2200); };
  const ref = () => fb.db.ref('users/' + uid);
  const koin: number = d.koin || 0;
  const owned: Record<string, number> = d.ownedWallpapers || {};
  const active: string = d.activeWallpaper || '';

  const summon = async (n: 1 | 10) => {
    if (!fb || !uid || busy) return;
    const cost = n === 1 ? COST_1 : COST_10;
    if (koin < cost) { say('Crystal kurang'); return; }
    setBusy(true);
    try {
      // potong saldo pakai transaction supaya nggak bisa dobel dari 2 tab
      const res = await ref().child('koin').transaction((cur: any) => (typeof cur !== 'number' ? cur : cur >= cost ? cur - cost : undefined));
      if (!res.committed) { say('Crystal kurang'); setBusy(false); return; }
      const picks = rollMany(n);
      const counts: Record<string, number> = {};
      picks.forEach((k) => { counts[k] = (counts[k] || 0) + 1; });
      await Promise.all(Object.entries(counts).map(([k, c]) =>
        ref().child('ownedWallpapers/' + k).transaction((cur: any) => (typeof cur === 'number' ? cur : 0) + c)
      ));
      const items = picks.map((k) => ({ key: k, isNew: !owned[k] }));
      // tandai "baru" hanya sekali per wallpaper dalam 1 sesi summon
      const seen = new Set<string>();
      items.forEach((it) => { if (it.isNew) { if (seen.has(it.key)) it.isNew = false; else seen.add(it.key); } });
      setD((p: any) => {
        const nextOwned = { ...(p.ownedWallpapers || {}) };
        Object.entries(counts).forEach(([k, c]) => { nextOwned[k] = (nextOwned[k] || 0) + c; });
        return { ...p, koin: res.snapshot.val(), ownedWallpapers: nextOwned };
      });
      setResult(items.sort((a, b) => rank(b.key) - rank(a.key)));
    } catch { say('Gagal, coba lagi'); }
    setBusy(false);
  };

  const equip = async (key: string) => {
    if (!fb || !uid || busy) return;
    setBusy(true);
    try {
      await ref().update({ activeWallpaper: key });
      setD((p: any) => ({ ...p, activeWallpaper: key }));
    } catch { say('Gagal, coba lagi'); }
    setBusy(false);
  };

  const list = useMemo(
    () => Object.keys(owned)
      .filter((k) => WALLPAPER_CATALOG[k] && WALLPAPER_CATALOG[k].nama.toLowerCase().includes(q.trim().toLowerCase()))
      .sort((a, b) => rank(b) - rank(a)),
    [owned, q]
  );
  const total = Object.keys(owned).filter((k) => WALLPAPER_CATALOG[k]).length;
  const card = 'rounded-3xl border border-white/10 bg-[#111a2e]';
  const last = result && result[0];

  return (
    <div className="fixed inset-0 overflow-y-auto text-white" style={{ background: 'radial-gradient(ellipse at top,#131b33 0%,#0a0f1e 60%,#070a14 100%)' }}>
      <div className="max-w-md mx-auto pb-16">
        <div className="flex items-center gap-4 px-5 pt-8 pb-5">
          <button onClick={() => router.back()} className="active:scale-90 transition-transform"><ArrowLeft className="w-7 h-7" /></button>
          <h1 className="text-2xl font-black">Gacha Wallpaper</h1>
        </div>

        {ready && !uid && <p className="px-5 pt-6 text-white/60">Login dulu buat summon wallpaper.</p>}

        {uid && (
          <>
            <div className={card + ' mx-4 p-5 text-center'}>
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-7 h-7 text-sky-400" />
                <span className="text-4xl font-black">{koin.toLocaleString('id-ID')}</span>
              </div>
              <p className="mt-1 font-bold text-white/50">Crystal</p>
            </div>

            <div className="mx-4 mt-4 rounded-3xl border border-white/10 overflow-hidden relative h-60 flex flex-col items-center justify-center text-center px-5"
              style={{ background: last ? bg(last.key) : 'radial-gradient(circle at 50% 40%,#2c3f8f,#0a0f1e 70%)' }}>
              <div className="absolute inset-0 bg-black/35" />
              <div className="relative">
                <h2 className="text-3xl font-black drop-shadow">{last ? WALLPAPER_CATALOG[last.key].nama : 'Wallpaper Summon'}</h2>
                {last
                  ? <div className="mt-3 flex justify-center"><Pill r={WALLPAPER_CATALOG[last.key].rarity} /></div>
                  : <><Sparkles className="w-14 h-14 mx-auto mt-3 text-sky-200" /><p className="mt-3 font-bold text-white/80">Wallpaper langka akan muncul di sini setelah summon.</p></>}
              </div>
            </div>
            <p className="px-5 pt-2 text-center text-xs font-bold text-white/40">
              {RARITIES.map((r) => r + ' ' + RATES[r] + '%').join(' · ')} · 10x dijamin minimal Rare
            </p>

            <div className="mx-4 mt-3 grid grid-cols-2 gap-3">
              <button onClick={() => summon(1)} disabled={busy}
                className="rounded-3xl py-4 font-black active:scale-95 transition-transform disabled:opacity-60"
                style={{ background: '#38b6ff', border: '2px solid #5cc3ff' }}>
                <div className="text-xl">Summon 1x</div>
                <div className="mt-2 mx-auto w-fit rounded-full bg-[#143a5c] px-5 py-1.5 flex items-center gap-1.5 text-xl"><Sparkles className="w-5 h-5 text-sky-300" />{fmt(COST_1)}</div>
              </button>
              <button onClick={() => summon(10)} disabled={busy}
                className="rounded-3xl py-4 font-black active:scale-95 transition-transform disabled:opacity-60"
                style={{ background: '#f5b84d', border: '2px solid #fcd34d' }}>
                <div className="text-xl">Summon 10x</div>
                <div className="mt-2 mx-auto w-fit rounded-full bg-[#5a3a12] px-5 py-1.5 flex items-center gap-1.5 text-xl"><Sparkles className="w-5 h-5 text-sky-300" />{fmt(COST_10)}</div>
              </button>
            </div>

            <div className="flex items-center gap-3 px-5 pt-7 pb-3">
              <h2 className="text-xl font-black">Koleksi Wallpaper</h2>
              <span className="rounded-full border border-white/15 px-3 py-0.5 font-black text-emerald-400">{total}</span>
              <button onClick={() => fb && uid && load(fb, uid, d.photoURL)} className="ml-auto flex items-center gap-1 font-black text-emerald-400 active:scale-95">
                <RefreshCw className="w-4 h-4" />Refresh
              </button>
            </div>

            {active && WALLPAPER_CATALOG[active] && (
              <div className="px-4 pb-3">
                <p className="pb-2 text-xs font-bold text-white/50">Preview di komentar</p>
                <WallpaperBg wpKey={active} className="flex gap-3 p-3 rounded-2xl border border-white/5 bg-[#1B1A20]/60">
                  <div className="w-10 h-10 shrink-0 rounded-full overflow-hidden bg-white/10">{d.photoURL ? <img src={d.photoURL} alt="" className="w-full h-full object-cover" /> : null}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold truncate">{d.displayName || 'Kamu'}</p>
                    <p className="text-[13px] text-gray-200">Wallpaper {WALLPAPER_CATALOG[active].nama} aktif!</p>
                  </div>
                  <button onClick={() => equip('')} disabled={busy} className="self-start rounded-full bg-black/50 px-3 py-1 text-xs font-extrabold active:scale-95">Lepas</button>
                </WallpaperBg>
              </div>
            )}

            <div className={card + ' mx-4 flex items-center gap-3 px-4 py-3'}>
              <Search className="w-5 h-5 text-white/50" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari wallpaper..." className="flex-1 bg-transparent outline-none font-bold placeholder:text-white/35" />
            </div>

            {list.length === 0 && <p className="px-5 pt-8 text-center text-white/40 font-bold">Belum ada wallpaper. Summon dulu!</p>}

            <div className="grid grid-cols-2 gap-3 px-4 pt-3">
              {list.map((k) => {
                const w = WALLPAPER_CATALOG[k];
                const on = active === k;
                return (
                  <button key={k} onClick={() => !on && equip(k)} disabled={busy}
                    className={card + ' p-2.5 text-left active:scale-95 transition-transform'}
                    style={on ? { border: '2px solid #fcd34d' } : undefined}>
                    <div className="relative h-28 rounded-2xl overflow-hidden" style={{ background: bg(k) }}>
                      <span className="absolute left-2 top-2"><Pill r={w.rarity} /></span>
                      {on && <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-amber-300 px-3 py-1 text-xs font-black text-black">★ Aktif</span>}
                      {!on && <span className="absolute bottom-2 right-2 rounded-full bg-emerald-600/80 p-1"><Check className="w-3.5 h-3.5" /></span>}
                    </div>
                    <p className="mt-2 text-center font-black truncate">{w.nama}{owned[k] > 1 ? ' x' + owned[k] : ''}</p>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {result && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={() => setResult(null)}>
          <div className="w-full max-w-md rounded-t-3xl bg-[#1a2238] p-5" onClick={(e) => e.stopPropagation()}>
            <p className="text-center text-xl font-black">Hasil Summon</p>
            <div className={'mt-4 grid gap-2 ' + (result.length > 1 ? 'grid-cols-5' : 'grid-cols-1 w-40 mx-auto')}>
              {result.map((it, i) => {
                const w = WALLPAPER_CATALOG[it.key];
                const st = RARITY_STYLE[w.rarity];
                return (
                  <div key={i} className="relative rounded-xl overflow-hidden aspect-[3/4]"
                    style={{ background: bg(it.key), border: '2px solid ' + st.border, boxShadow: st.glow }}>
                    {it.isNew && <span className="absolute left-0 top-0 bg-rose-500 px-1.5 text-[9px] font-black">BARU</span>}
                    <span className="absolute bottom-0 inset-x-0 bg-black/60 text-center text-[9px] font-black truncate px-0.5" style={{ color: st.color }}>{w.nama}</span>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setResult(null)} className="mt-5 w-full rounded-2xl bg-violet-500 py-3 font-black">Oke</button>
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] rounded-full bg-slate-900/90 px-4 py-2 text-sm font-bold">{toast}</div>}
    </div>
  );
}
