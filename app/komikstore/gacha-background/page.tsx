'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Gem, Ticket, X } from 'lucide-react';
import { getFirebase } from '@/lib/firebase-client';
import { BG_CATALOG, rollBg } from '@/lib/backgrounds';
import { COST_1, COST_10, TOKEN_DUP, RARITY_STYLE, RATES, RARITIES, type Rarity } from '@/lib/wallpapers';
import { fmtC } from '@/lib/season';
import ProfileBg from '@/components/ProfileBg';

type Res = { key: string; isNew: boolean; dup?: number };

function Tile({ k, h = 110, dim = false }: { k: string; h?: number; dim?: boolean }) {
  const b = BG_CATALOG[k];
  const st = RARITY_STYLE[b.rarity];
  return (
    <div style={{ position: 'relative', isolation: 'isolate', height: h, borderRadius: 18, overflow: 'hidden', border: '2px solid ' + st.border, boxShadow: st.glow, opacity: dim ? 0.35 : 1 }}>
      <ProfileBg k={k} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '14px 8px 6px', background: 'linear-gradient(transparent, rgba(0,0,0,.65))', fontSize: 13, fontWeight: 800, textAlign: 'center' }}>{b.nama}</div>
      <span style={{ position: 'absolute', top: 6, left: 6, fontSize: 10, fontWeight: 800, color: st.color, background: 'rgba(0,0,0,.55)', padding: '2px 7px', borderRadius: 99 }}>{b.rarity.toUpperCase()}</span>
    </div>
  );
}

export default function GachaBackgroundPage() {
  const router = useRouter();
  const [fb, setFb] = useState<any>(null);
  const [uid, setUid] = useState('');
  const [d, setD] = useState<any>({});
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Res[] | null>(null);
  const [tab, setTab] = useState<'summon' | 'koleksi'>('summon');
  const [toast, setToast] = useState('');

  useEffect(() => {
    let stop = false;
    let off: (() => void) | undefined;
    let ref: any = null;
    getFirebase().then((f: any) => {
      if (stop) return;
      setFb(f);
      off = f.auth.onAuthStateChanged((u: any) => {
        if (ref) { ref.off(); ref = null; }
        if (stop) return;
        if (!u) { setUid(''); setD({}); return; }
        setUid(u.uid);
        ref = f.db.ref('users/' + u.uid);
        ref.on('value', (s: any) => setD(s.val() || {}));
      });
    }).catch(() => {});
    return () => { stop = true; if (off) off(); if (ref) ref.off(); };
  }, []);

  const say = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2200); };
  const koin = Number(d.koin) || 0;
  const token = Number(d.token) || 0;
  const owned: Record<string, number> = d.ownedBackgrounds || {};
  const active: string = d.activeBackground || '';
  const ref = () => fb.db.ref('users/' + uid);

  const summon = async (n: 1 | 10) => {
    if (!uid) { say('Login dulu'); return; }
    if (!fb || busy) return;
    const cost = n === 1 ? COST_1 : COST_10;
    if (koin < cost) { say('Crystal kurang'); return; }
    setBusy(true);
    try {
      // potong saldo pakai transaction supaya nggak bisa dobel dari 2 tab
      const paid = await ref().child('koin').transaction((cur: any) => (typeof cur !== 'number' ? cur : cur >= cost ? cur - cost : undefined));
      if (!paid.committed) { say('Crystal kurang'); return; }
      const picks = rollBg(n);
      const counts: Record<string, number> = {};
      picks.forEach((k) => { counts[k] = (counts[k] || 0) + 1; });
      const was: Record<string, boolean> = {};
      await Promise.all(Object.keys(counts).map((k) =>
        ref().child('ownedBackgrounds/' + k).transaction((cur: any) => {
          if (typeof cur === 'number' && cur > 0) { was[k] = true; return cur; }
          was[k] = false; return 1;
        })
      ));
      // satu latar cuma dimiliki sekali; kelebihannya jadi token
      const left = { ...counts };
      let tokens = 0;
      const items: Res[] = picks.map((k) => {
        const first = left[k] === counts[k];
        left[k]--;
        if (first && !was[k]) return { key: k, isNew: true };
        const give = TOKEN_DUP[BG_CATALOG[k].rarity];
        tokens += give;
        return { key: k, isNew: false, dup: give };
      });
      if (tokens > 0) await ref().child('token').transaction((cur: any) => (Number(cur) || 0) + tokens);
      setRes(items);
    } catch (e: any) { say('Gagal: ' + (e?.message || 'coba lagi')); }
    finally { setBusy(false); }
  };

  const equip = async (k: string) => {
    try { await ref().update({ activeBackground: active === k ? '' : k }); say(active === k ? 'Latar dilepas' : 'Latar dipakai di Profil'); }
    catch (e: any) { say('Gagal: ' + (e?.message || 'coba lagi')); }
  };

  const keys = Object.keys(BG_CATALOG);
  const have = keys.filter((k) => owned[k]).length;

  return (
    <div className="min-h-screen text-white max-w-md mx-auto pb-16 -mb-28" style={{ background: 'radial-gradient(ellipse at top, #151c34 0%, #0b0f1d 60%, #070a14 100%)' }}>
      <div className="flex items-center gap-4 px-6 pt-8 pb-4">
        <button onClick={() => router.back()} aria-label="Kembali" className="p-1"><ArrowLeft className="w-7 h-7" /></button>
        <h1 className="text-3xl font-extrabold tracking-tight">Gacha Background</h1>
      </div>

      <div className="mx-5 flex rounded-3xl border border-white/10 bg-white/5 py-3">
        <div className="flex-1 text-center"><p className="text-2xl font-extrabold flex items-center justify-center gap-2" style={{ color: '#f1c40f' }}><Gem className="w-5 h-5" />{fmtC(koin)}</p><p className="text-sm font-bold text-white/50">Crystal</p></div>
        <div className="w-px bg-white/10" />
        <div className="flex-1 text-center"><p className="text-2xl font-extrabold flex items-center justify-center gap-2" style={{ color: '#7dd3fc' }}><Ticket className="w-5 h-5" />{fmtC(token)}</p><p className="text-sm font-bold text-white/50">Token</p></div>
      </div>

      <div className="mx-5 mt-4 flex rounded-full bg-white/5 p-1">
        {(['summon', 'koleksi'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className="flex-1 py-2.5 rounded-full text-base font-extrabold" style={{ background: tab === t ? '#FF6B6B' : 'transparent' }}>{t === 'summon' ? 'Summon' : `Koleksi ${have}/${keys.length}`}</button>
        ))}
      </div>

      {tab === 'summon' ? (
        <div className="px-5 pt-5">
          <div style={{ position: 'relative', isolation: 'isolate', height: 190, borderRadius: 26, overflow: 'hidden', border: '2px solid #fbbf24', boxShadow: '0 0 24px rgba(251,191,36,.35)' }}>
            <ProfileBg k="galaksi-emas" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
              <p className="text-sm font-extrabold tracking-widest" style={{ color: '#fde68a' }}>BANNER UTAMA</p>
              <p className="text-3xl font-extrabold mt-1">Latar Profil</p>
              <p className="text-sm font-bold text-white/70 mt-1">Pasang di bagian atas halaman Profilmu</p>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button disabled={busy} onClick={() => summon(1)} className="flex-1 rounded-2xl py-3 font-extrabold active:scale-95 transition-transform disabled:opacity-50" style={{ background: '#FF6B6B' }}>
              Summon ×1<span className="block text-sm font-bold text-white/80 flex items-center justify-center gap-1"><Gem className="w-3.5 h-3.5" />{COST_1}</span>
            </button>
            <button disabled={busy} onClick={() => summon(10)} className="flex-1 rounded-2xl py-3 font-extrabold active:scale-95 transition-transform disabled:opacity-50" style={{ background: 'linear-gradient(90deg,#f59e0b,#fbbf24)', color: '#451a03' }}>
              Summon ×10<span className="block text-sm font-bold flex items-center justify-center gap-1"><Gem className="w-3.5 h-3.5" />{COST_10}</span>
            </button>
          </div>
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="font-extrabold mb-2">Peluang</p>
            {RARITIES.map((r: Rarity) => (
              <div key={r} className="flex justify-between text-base font-bold py-0.5"><span style={{ color: RARITY_STYLE[r].color }}>{r}</span><span className="text-white/60">{RATES[r]}%</span></div>
            ))}
            <p className="mt-2 text-sm font-bold text-white/45">Summon ×10 dijamin minimal 1 Rare. Latar yang sudah dimiliki otomatis jadi token. Legendary punya animasi.</p>
          </div>
        </div>
      ) : (
        <div className="px-5 pt-5 grid grid-cols-2 gap-3">
          {keys.map((k) => (
            <button key={k} disabled={!owned[k]} onClick={() => equip(k)} className="text-left">
              <Tile k={k} dim={!owned[k]} />
              <p className="mt-1 text-center text-sm font-extrabold" style={{ color: active === k ? '#34D399' : owned[k] ? '#fff' : 'rgba(255,255,255,.35)' }}>{active === k ? '✓ Dipakai' : owned[k] ? 'Pakai' : 'Belum punya'}</p>
            </button>
          ))}
        </div>
      )}

      {res && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-5" style={{ background: 'rgba(5,8,18,.94)' }}>
          <button onClick={() => setRes(null)} aria-label="Tutup" className="absolute top-6 right-6 p-2"><X className="w-7 h-7" /></button>
          <p className="text-2xl font-extrabold mb-4">Hasil Summon</p>
          <div className={'grid gap-3 w-full max-w-md ' + (res.length === 1 ? 'grid-cols-1 px-12' : 'grid-cols-2')} style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {res.map((r, i) => (
              <div key={i}>
                <Tile k={r.key} h={res.length === 1 ? 200 : 90} />
                <p className="mt-1 text-center text-xs font-extrabold" style={{ color: r.isNew ? '#34D399' : '#7dd3fc' }}>{r.isNew ? 'BARU!' : '+' + r.dup + ' Token'}</p>
              </div>
            ))}
          </div>
          <button onClick={() => { setRes(null); setTab('koleksi'); }} className="mt-5 px-8 py-3 rounded-full font-extrabold" style={{ background: '#FF6B6B' }}>Lihat koleksi</button>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-10 inset-x-0 z-[60] flex justify-center pointer-events-none">
          <span className="px-5 py-3 rounded-full bg-black/85 text-white text-base font-bold">{toast}</span>
        </div>
      )}
    </div>
  );
}
