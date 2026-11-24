'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFavorites } from '@/lib/store';
import { currentSeason } from '@/lib/season';
import { getFirebase, getUser } from '@/lib/leaderboard';
import { Gift, claimGift, GIFT_TYPE_LABEL } from '@/lib/gifts';
import { BORDER_CATALOG } from '@/components/BorderSheet';
import { WALLPAPER_CATALOG, RARITY_STYLE, wpBg } from '@/lib/wallpapers';
import { EFFECT_CATALOG } from '@/lib/effects';
import ProfileEffect from '@/components/ProfileEffect';
import GiftEffect from '@/components/GiftEffect';
import GiftVisual from '@/components/GiftVisual';

const CORAL = '#FF6B6B';
const MUTED = '#8F8D9B';
const K_SEEN = 'komiku-notif-seen';        // { [linkKomik]: jumlahChapterTerakhirDilihat }
const K_INFO = 'komiku-notif-info-read';   // string[] id info yang sudah dibaca
const K_REL = 'komiku-notif-releases';     // string[] link rilis yang sudah dilihat

type Tab = 'update' | 'hadiah' | 'info' | 'komentar';
interface UpdateItem { link: string; title: string; thumb: string; baru: number; chapter: string; date: string }
interface InfoItem { id: string; judul: string; isi: string; waktu?: number; jenis?: string }
interface Release { link: string; title: string; thumb: string; type: string; chapter: string; time: string; baru: boolean }

const Back = () => (
  <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 5l-7 7 7 7" /></svg>
);

const readJSON = <T,>(k: string, d: T): T => { try { return JSON.parse(localStorage.getItem(k) || '') as T; } catch { return d; } };
const writeJSON = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// Info bawaan; kalau di database ada node `notifikasi/info`, itu yang dipakai.
function builtinInfo(): InfoItem[] {
  const s = currentSeason();
  return [
    { id: `season-${s.id}`, judul: `Season ${s.id} sudah dimulai`, isi: `Periode ${s.label}. Baca chapter untuk kumpulkan poin dan naikkan lencanamu.` },
    { id: 'lencana-3-jalur', judul: 'Lencana baru: Noble, Murim, Demon', isi: 'Tiga jalur dengan 10 tingkat tiap jalur. Lencana musim lalu tetap terbuka.' },
    { id: 'edit-profil', judul: 'Profilmu bisa diedit', isi: 'Ganti foto, nama tampilan, dan lencana yang dipakai dari halaman Profil.' },
    { id: 'cara-poin', judul: 'Cara dapat poin', isi: '10 poin tiap chapter baru, bonus 10 poin untuk chapter pertama tiap hari.' },
    { id: 'bonus-malam', judul: 'Bonus baca malam', isi: 'Baca jam 22.00–04.59 dapat tambahan 5 poin per chapter.' },
    { id: 'streak', judul: 'Jaga streak-mu', isi: 'Baca minimal satu chapter tiap hari supaya streak tidak putus.' },
    { id: 'reset-musim', judul: 'Poin direset tiap musim', isi: 'Satu musim berlangsung 2 bulan. Lencana yang sudah terbuka tetap jadi milikmu.' },
    { id: 'papan-peringkat', judul: 'Papan peringkat 100 besar', isi: 'Pembaca dengan poin tertinggi musim ini tampil di tab Peringkat.' },
    { id: 'notif-chapter', judul: 'Notifikasi chapter baru', isi: 'Komik di Favorit yang rilis chapter baru akan muncul di tab Pembaruan.' },
  ];
}

function KomoSleeping() {
  const ol = '#2B3A24', g = '#8AA16E', gd = '#6F8955', cream = '#EFE6BE';
  return (
    <svg width={120} height={132} viewBox="0 0 120 132" style={{ overflow: 'visible' }}>
      {/* Zz */}
      <g fontFamily="Plus Jakarta Sans, system-ui, sans-serif" fontWeight={900} textAnchor="middle" fill="#fff" stroke="#14201a" strokeWidth={3} paintOrder="stroke" strokeLinejoin="round">
        <text x={86} y={34} fontSize={20}>Z</text>
        <text x={100} y={14} fontSize={14}>Z</text>
      </g>
      {/* ekor */}
      <path d="M78 112c14 1 26-6 30-22 1 14-6 30-22 34z" fill={g} stroke={ol} strokeWidth={2.4} strokeLinejoin="round" />
      <circle cx={96} cy={108} r={2} fill={gd} /><circle cx={102} cy={100} r={1.6} fill={gd} />
      {/* badan */}
      <path d="M26 112c0-20 12-34 32-34s32 14 32 34c0 8-6 12-14 12H40c-8 0-14-4-14-12z" fill={g} stroke={ol} strokeWidth={2.4} />
      <ellipse cx={58} cy={108} rx={21} ry={13} fill={cream} />
      {/* buku */}
      <rect x={38} y={100} width={40} height={15} rx={3} fill="#fff" stroke={ol} strokeWidth={2.2} />
      <rect x={38} y={104} width={40} height={4} fill="#D64545" /><rect x={38} y={109} width={40} height={2.6} fill="#D64545" />
      <line x1={58} y1={100} x2={58} y2={115} stroke={ol} strokeWidth={1.8} />
      {/* tangan & kaki */}
      <ellipse cx={34} cy={108} rx={7} ry={8} fill={g} stroke={ol} strokeWidth={2.2} />
      <ellipse cx={82} cy={108} rx={7} ry={8} fill={g} stroke={ol} strokeWidth={2.2} />
      <ellipse cx={42} cy={124} rx={13} ry={6} fill={g} stroke={ol} strokeWidth={2.2} />
      <ellipse cx={74} cy={124} rx={13} ry={6} fill={g} stroke={ol} strokeWidth={2.2} />
      {/* kepala */}
      <path d="M44 22l3 8-8-3zM56 17l3 9-8-2zM68 21l-1 9 8-4z" fill={g} stroke={ol} strokeWidth={2} strokeLinejoin="round" />
      <ellipse cx={58} cy={50} rx={32} ry={28} fill={g} stroke={ol} strokeWidth={2.4} />
      <circle cx={42} cy={38} r={2.6} fill={gd} /><circle cx={74} cy={36} r={2.2} fill={gd} /><circle cx={66} cy={30} r={1.8} fill={gd} />
      <ellipse cx={58} cy={58} rx={17} ry={13} fill={cream} />
      <ellipse cx={37} cy={58} rx={5} ry={3.6} fill="#F2A2A2" opacity={0.75} /><ellipse cx={79} cy={58} rx={5} ry={3.6} fill="#F2A2A2" opacity={0.75} />
      <path d="M40 50q6 5 12 0M64 50q6 5 12 0" fill="none" stroke={ol} strokeWidth={2.6} strokeLinecap="round" />
      <circle cx={55} cy={56} r={1} fill={ol} /><circle cx={61} cy={56} r={1} fill={ol} />
      <path d="M52 62q6 5 12 0" fill="none" stroke={ol} strokeWidth={2.4} strokeLinecap="round" />
    </svg>
  );
}

function Empty({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '110px 48px 0' }}>
      <KomoSleeping />
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.6, marginTop: 16 }}>{title}</div>
      <div style={{ color: MUTED, fontSize: 18, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.35, marginTop: 6, maxWidth: 260 }}>{sub}</div>
    </div>
  );
}


// ─── Hadiah ──────────────────────────────────────────────────────────────────
function ago(ts: number) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return 'baru saja';
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  return `${Math.floor(h / 24)} hari lalu`;
}

const NUM_ART: Record<string, { bg: string; icon: React.ReactNode; tag?: string }> = {
  koin: { bg: 'linear-gradient(135deg,#0ea5e9,#6366f1)', icon: (
    <svg width={34} height={34} viewBox="0 0 24 24"><path d="M6 3h12l4 6-10 12L2 9l4-6z" fill="#fff" fillOpacity={0.95} /><path d="M2 9h20M9 3l3 18M15 3l-3 18" stroke="rgba(0,0,0,.22)" fill="none" strokeWidth={1} /></svg>) },
  level: { bg: 'linear-gradient(135deg,#f59e0b,#ef4444)', icon: <span style={{ fontSize: 26, fontWeight: 900, letterSpacing: -1 }}>LV</span> },
  exp: { bg: 'linear-gradient(135deg,#10b981,#0ea5e9)', icon: (
    <svg width={34} height={34} viewBox="0 0 24 24" fill="#fff"><path d="M12 2l3 6.5 7 .9-5.2 4.8 1.4 7L12 17.8 5.8 21.2l1.4-7L2 9.4l7-.9L12 2z" /></svg>) },
  poin: { bg: 'linear-gradient(135deg,#ff6b6b,#be123c)', icon: (
    <svg width={34} height={34} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M7 4h10v5a5 5 0 01-10 0V4zM4 5h3v3a3 3 0 01-3-3zM20 5h-3v3a3 3 0 003-3zM9 20h6M12 14v6" /></svg>) },
};

function GiftArt({ g, photo }: { g: Gift; photo: string }) {
  const box: React.CSSProperties = { width: 88, height: 88, borderRadius: 20, flex: '0 0 88px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, color: '#fff' };
  if (g.type === 'border') {
    const url = g.itemKey ? BORDER_CATALOG[g.itemKey]?.url : '';
    return (
      <div style={{ ...box, background: 'linear-gradient(135deg,#1e1b4b,#4c1d95)' }}>
        <div style={{ position: 'relative', width: 48, height: 48 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo || 'https://placehold.co/96/1a1d24/fff?text=?'} alt="" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
          {url && <div style={{ position: 'absolute', top: '50%', left: '50%', width: '130%', height: '130%', transform: 'translate(-50%,-50%)', backgroundImage: `url('${url}')`, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', pointerEvents: 'none' }} />}
        </div>
      </div>
    );
  }
  if (g.type === 'wallpaper') {
    const w = g.itemKey ? WALLPAPER_CATALOG[g.itemKey] : undefined;
    const r = w ? RARITY_STYLE[w.rarity] : undefined;
    return (
      <div style={{ ...box, background: w ? wpBg(g.itemKey) : '#334155', border: `2px solid ${r?.border || 'rgba(255,255,255,.1)'}`, boxShadow: r?.glow && r.glow !== 'none' ? r.glow : undefined, justifyContent: 'flex-end' }}>
        <span style={{ background: 'rgba(0,0,0,.55)', width: '100%', textAlign: 'center', fontSize: 12, fontWeight: 800, padding: '3px 0', color: r?.color || '#fff' }}>{w?.rarity || 'Wallpaper'}</span>
      </div>
    );
  }
  if (g.type === 'effect') {
    const e = g.itemKey ? EFFECT_CATALOG[g.itemKey] : undefined;
    return (
      <div style={{ ...box, background: 'linear-gradient(135deg,#0f172a,#312e81)', justifyContent: 'flex-end' }}>
        <div style={{ position: 'absolute', inset: 0 }}><ProfileEffect effectKey={g.itemKey} /></div>
        <span style={{ position: 'relative', background: 'rgba(0,0,0,.55)', width: '100%', textAlign: 'center', fontSize: 12, fontWeight: 800, padding: '3px 0' }}>{e?.tier || 'Efek'}</span>
      </div>
    );
  }
  const n = NUM_ART[g.type] || NUM_ART.koin;
  return (
    <div style={{ ...box, background: n.bg }}>
      {n.icon}
      <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.6 }}>+{(g.amount || 0).toLocaleString('id-ID')}</span>
    </div>
  );
}

export default function NotifikasiPage() {
  const router = useRouter();
  const favorites = useFavorites((s) => s.favorites);
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>('update');
  const [updates, setUpdates] = useState<UpdateItem[]>([]);
  const [infos, setInfos] = useState<InfoItem[]>([]);
  const [readInfo, setReadInfo] = useState<string[]>([]);
  const [checking, setChecking] = useState(true);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [giftsLoading, setGiftsLoading] = useState(true);
  const [needLogin, setNeedLogin] = useState(false);
  const [uid, setUid] = useState('');
  const [photo, setPhoto] = useState('');
  const [claiming, setClaiming] = useState('');
  const [giftErr, setGiftErr] = useState('');
  const [fx, setFx] = useState<{ title: string; sub?: string; visual?: React.ReactNode } | null>(null);
  const [releases, setReleases] = useState<Release[]>([]);

  useEffect(() => { setMounted(true); setReadInfo(readJSON<string[]>(K_INFO, [])); }, []);

  // Cek chapter baru di komik favorit
  useEffect(() => {
    if (!mounted) return;
    let alive = true;
    (async () => {
      const seen = readJSON<Record<string, number>>(K_SEEN, {});
      const found: UpdateItem[] = [];
      const list = favorites.slice(0, 15);
      await Promise.all(list.map(async (f) => {
        try {
          const r = await fetch(`/api/manga/detail?url=${encodeURIComponent(f.link)}`);
          const j = await r.json();
          const chs: { title: string; date: string }[] = j?.data?.chapters || [];
          if (!j?.success || !chs.length) return;
          if (seen[f.link] === undefined) { seen[f.link] = chs.length; return; }   // pertama kali: catat saja
          if (chs.length > seen[f.link]) {
            found.push({ link: f.link, title: f.title, thumb: f.thumb, baru: chs.length - seen[f.link], chapter: chs[0].title, date: chs[0].date });
          }
        } catch {}
      }));
      writeJSON(K_SEEN, seen);
      if (alive) { setUpdates(found); setChecking(false); }
    })();
    return () => { alive = false; };
  }, [mounted, favorites]);

  // Rilis terbaru di Komikita (urut pembaruan). Yang belum pernah dilihat diberi tanda BARU.
  useEffect(() => {
    if (!mounted) return;
    let alive = true;
    (async () => {
      try {
        const r = await fetch(`/api/manga/browse?path=${encodeURIComponent('/daftar-manga/?orderby=update')}`);
        const j = await r.json();
        const items: any[] = j?.data?.items || [];
        if (!items.length) return;
        const seen = readJSON<string[] | null>(K_REL, null);
        const list: Release[] = items.slice(0, 12).map((m) => ({
          link: m.link, title: m.title, thumb: m.thumb, type: m.type || '', chapter: m.chapter || '', time: m.time || '',
          baru: !!seen && !seen.includes(m.link),
        }));
        if (!seen) writeJSON(K_REL, items.map((m) => m.link)); // kunjungan pertama: cukup dicatat, jangan banjir notifikasi
        if (alive) setReleases(list);
      } catch {}
    })();
    return () => { alive = false; };
  }, [mounted]);

  // Info: dari database kalau ada, kalau tidak pakai bawaan
  useEffect(() => {
    if (!mounted) return;
    let alive = true;
    (async () => {
      let items = builtinInfo();
      try {
        const { db } = await getFirebase();
        const v = (await db.ref('notifikasi/info').get()).val();
        if (v) {
          const arr = Object.entries(v as Record<string, any>).map(([id, x]) => ({ id, judul: x.judul || 'Info', isi: x.isi || '', waktu: x.waktu }));
          if (arr.length) items = arr.sort((a, b) => (b.waktu || 0) - (a.waktu || 0));
        }
      } catch {}
      // Notifikasi pribadi (Premium disetujui/ditolak, dll) dari users/<uid>/inbox
      try {
        const u = await getUser();
        if (u) {
          const { db } = await getFirebase();
          const v = (await db.ref(`users/${u.uid}/inbox`).get()).val();
          if (v) {
            const mine: InfoItem[] = Object.entries(v as Record<string, any>).map(([id, x]) => ({ id: 'u_' + id, judul: x.judul || 'Info', isi: x.isi || '', waktu: Number(x.waktu) || 0, jenis: x.jenis }));
            items = [...mine, ...items].sort((a, b) => (b.waktu || 0) - (a.waktu || 0));
          }
        }
      } catch {}
      if (alive) setInfos(items);
    })();
    return () => { alive = false; };
  }, [mounted]);

  // Hadiah dari developer (users/<uid>/gifts)
  useEffect(() => {
    if (!mounted) return;
    let alive = true;
    (async () => {
      try {
        const u = await getUser();
        if (!alive) return;
        if (!u) { setNeedLogin(true); return; }
        setUid(u.uid); setPhoto(u.photoURL || '');
        const { db } = await getFirebase();
        const v = (await db.ref(`users/${u.uid}/gifts`).get()).val() || {};
        const arr: Gift[] = Object.entries(v as Record<string, any>).map(([id, x]) => ({
          id, type: x.type, amount: x.amount, itemKey: x.itemKey, itemName: x.itemName || 'Hadiah',
          from: x.from || 'Developer', message: x.message, timestamp: Number(x.timestamp) || 0, claimed: !!x.claimed,
        })).sort((a, b) => b.timestamp - a.timestamp);
        if (alive) { setGifts(arr); if (arr.some((g) => !g.claimed)) setTab('hadiah'); }
      } catch {} finally { if (alive) setGiftsLoading(false); }
    })();
    return () => { alive = false; };
  }, [mounted]);

  const doClaim = async (g: Gift) => {
    if (!uid || claiming) return;
    setClaiming(g.id); setGiftErr('');
    try {
      const { db } = await getFirebase();
      const ok = await claimGift(db, uid, g);
      setGifts((prev) => prev.map((x) => (x.id === g.id ? { ...x, claimed: true } : x)));
      if (ok) setFx({ title: 'Hadiah diterima!', sub: g.itemName, visual: <GiftVisual type={g.type} itemKey={g.itemKey} /> });
    } catch (e: any) { setGiftErr('Gagal mengklaim: ' + (e?.message || 'coba lagi')); }
    setClaiming('');
  };

  const claimAll = async () => {
    if (!uid || claiming) return;
    const pending = gifts.filter((g) => !g.claimed);
    setClaiming('all'); setGiftErr('');
    let n = 0;
    try {
      const { db } = await getFirebase();
      for (const g of pending) {
        if (await claimGift(db, uid, g)) n++;
        setGifts((prev) => prev.map((x) => (x.id === g.id ? { ...x, claimed: true } : x)));
      }
      if (n) setFx({ title: 'Hadiah diterima!', sub: n + ' hadiah berhasil diklaim' });
    } catch (e: any) { setGiftErr('Gagal mengklaim: ' + (e?.message || 'coba lagi')); }
    setClaiming('');
  };

  const pendingGifts = gifts.filter((g) => !g.claimed);
  const doneGifts = gifts.filter((g) => g.claimed).slice(0, 15);

  const unreadInfo = useMemo(() => infos.filter((i) => !readInfo.includes(i.id)).length, [infos, readInfo]);

  const addSeen = (links: string[]) => {
    const cur = readJSON<string[]>(K_REL, []);
    writeJSON(K_REL, Array.from(new Set([...cur, ...links])).slice(-500));
  };
  const openRelease = (r: Release) => {
    addSeen([r.link]);
    router.push(`/manga?url=${encodeURIComponent(r.link)}`);
  };
  const newRel = releases.filter((r) => r.baru).length;

  const markAll = () => {
    addSeen(releases.map((r) => r.link));
    setReleases((prev) => prev.map((r) => ({ ...r, baru: false })));
    // Catat jumlah chapter terbaru sebagai "sudah dilihat" untuk semua komik yang punya pembaruan
    const seen = readJSON<Record<string, number>>(K_SEEN, {});
    updates.forEach((u) => { seen[u.link] = (seen[u.link] || 0) + u.baru; });
    writeJSON(K_SEEN, seen);
    setUpdates([]);
    const ids = infos.map((i) => i.id);
    writeJSON(K_INFO, ids);
    setReadInfo(ids);
  };

  const openUpdate = (u: UpdateItem) => {
    const seen = readJSON<Record<string, number>>(K_SEEN, {});
    seen[u.link] = (seen[u.link] || 0) + u.baru;
    writeJSON(K_SEEN, seen);
    router.push(`/manga?url=${encodeURIComponent(u.link)}`);
  };

  const readOne = (id: string) => {
    if (readInfo.includes(id)) return;
    const next = [...readInfo, id];
    setReadInfo(next); writeJSON(K_INFO, next);
  };

  const tabs: { k: Tab; label: string }[] = [
    { k: 'update', label: updates.length + newRel > 0 ? `Pembaruan · ${updates.length + newRel}` : 'Pembaruan' },
    { k: 'hadiah', label: pendingGifts.length > 0 ? `Hadiah · ${pendingGifts.length}` : 'Hadiah' },
    { k: 'info', label: unreadInfo > 0 ? `Info · ${unreadInfo}` : 'Info' },
    { k: 'komentar', label: 'Komentar' },
  ];

  return (
    <div style={{ background: '#1B1A20', color: '#fff', minHeight: '100vh', paddingBottom: 40 }}>
      <style>{`button { font-family: inherit; cursor: pointer; }`}</style>

      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 12px 10px', gap: 12 }}>
        <button onClick={() => router.back()} aria-label="Kembali" style={{ background: 'none', border: 0, padding: 6, display: 'flex' }}><Back /></button>
        <div style={{ flex: 1, fontSize: 25, fontWeight: 800, letterSpacing: -0.8 }}>Notifikasi</div>
        <button onClick={markAll} style={{ background: 'none', border: 0, color: CORAL, fontSize: 19, fontWeight: 800, letterSpacing: -0.5, padding: '6px 8px' }}>Tandai semua dibaca</button>
      </div>

      {/* Segmen */}
      <div style={{ display: 'flex', margin: '12px 14px 0', padding: 5, borderRadius: 99, background: '#25242B', border: '1px solid rgba(255,255,255,.06)' }}>
        {tabs.map((t) => {
          const on = tab === t.k;
          return (
            <button key={t.k} onClick={() => setTab(t.k)} style={{ flex: 1, height: 42, borderRadius: 99, border: 0, background: on ? '#1B1A20' : 'transparent', color: on ? '#fff' : MUTED, fontSize: 15.5, fontWeight: 800, letterSpacing: -0.5, padding: 0 }}>{t.label}</button>
          );
        })}
      </div>

      {tab === 'update' && (
        checking ? (
          <div style={{ padding: '80px 20px', textAlign: 'center', color: MUTED, fontWeight: 700 }}>Memeriksa chapter baru...</div>
        ) : updates.length === 0 && releases.length === 0 ? (
          <Empty title="Semua sudah kamu baca" sub="Tidak ada notifikasi baru. Komo akan membangunkanmu saat ada chapter rilis." />
        ) : (
          <div style={{ padding: '14px 14px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {updates.length > 0 && <div style={{ color: MUTED, fontSize: 14, fontWeight: 800, letterSpacing: 0.3, margin: '2px 2px 0' }}>CHAPTER BARU DI FAVORITMU</div>}
            {updates.map((u) => (
              <button key={u.link} onClick={() => openUpdate(u)} style={{ display: 'flex', gap: 12, alignItems: 'center', background: '#2A2931', border: 0, borderRadius: 16, padding: 10, textAlign: 'left', color: '#fff' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u.thumb} alt="" style={{ width: 52, height: 72, borderRadius: 10, objectFit: 'cover', flex: '0 0 52px' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.4, lineHeight: 1.2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{u.title}</div>
                  <div style={{ color: MUTED, fontSize: 15, fontWeight: 800, marginTop: 4 }}>{u.baru > 1 ? `${u.baru} chapter baru` : u.chapter} · {u.date}</div>
                </div>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: CORAL, flex: '0 0 10px' }} />
              </button>
            ))}

            {releases.length > 0 && <div style={{ color: MUTED, fontSize: 14, fontWeight: 800, letterSpacing: 0.3, margin: '10px 2px 0' }}>RILIS TERBARU DI KOMIKITA</div>}
            {releases.map((r) => (
              <button key={r.link} onClick={() => openRelease(r)} style={{ display: 'flex', gap: 12, alignItems: 'center', background: '#2A2931', border: 0, borderRadius: 16, padding: 10, textAlign: 'left', color: '#fff' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.thumb} alt="" referrerPolicy="no-referrer" style={{ width: 52, height: 72, borderRadius: 10, objectFit: 'cover', flex: '0 0 52px' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.4, lineHeight: 1.2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{r.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
                    {r.type && <span style={{ background: '#1F1E24', fontSize: 12, fontWeight: 800, padding: '3px 8px', borderRadius: 7 }}>{r.type}</span>}
                    <span style={{ color: MUTED, fontSize: 14.5, fontWeight: 800 }}>{[r.chapter, r.time].filter(Boolean).join(' · ') || 'Baru diperbarui'}</span>
                  </div>
                </div>
                {r.baru && <span style={{ background: CORAL, color: '#fff', fontSize: 11.5, fontWeight: 800, padding: '3px 8px', borderRadius: 7, flex: '0 0 auto' }}>BARU</span>}
              </button>
            ))}
          </div>
        )
      )}

      {tab === 'info' && (
        infos.length === 0 ? (
          <Empty title="Belum ada info" sub="Pengumuman dari Komikita akan muncul di sini." />
        ) : (
          <div style={{ padding: '14px 14px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {infos.map((i) => {
              const unread = !readInfo.includes(i.id);
              return (
                <button key={i.id} onClick={() => readOne(i.id)} style={{ background: '#2A2931', border: 0, borderRadius: 16, padding: '14px 16px', textAlign: 'left', color: '#fff', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  {i.jenis === 'premium_ok' && <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(245,200,75,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 40px' }}><svg width={22} height={22} viewBox="0 0 24 24" fill="#F5C84B"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8z" /></svg></div>}
                  {i.jenis === 'premium_no' && <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,92,92,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 40px' }}><svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#FF7A7A" strokeWidth={2.4} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg></div>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.4, color: unread ? '#fff' : '#C8C6D2' }}>{i.judul}</div>
                    <div style={{ color: MUTED, fontSize: 15, fontWeight: 700, lineHeight: 1.4, marginTop: 4 }}>{i.isi}</div>
                  </div>
                  {unread && <span style={{ width: 10, height: 10, borderRadius: '50%', background: CORAL, flex: '0 0 10px', marginTop: 6 }} />}
                </button>
              );
            })}
          </div>
        )
      )}

      {tab === 'hadiah' && (
        giftsLoading ? (
          <div style={{ padding: '80px 20px', textAlign: 'center', color: MUTED, fontWeight: 700 }}>Memuat hadiah...</div>
        ) : needLogin ? (
          <Empty title="Masuk dulu ya" sub="Masuk lewat halaman Profil untuk melihat dan mengklaim hadiah." />
        ) : gifts.length === 0 ? (
          <Empty title="Belum ada hadiah" sub="Hadiah dari developer akan muncul di sini, lalu kamu klaim sendiri." />
        ) : (
          <div style={{ padding: '14px 14px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {giftErr && <div style={{ background: 'rgba(255,92,92,.12)', color: '#FF7A7A', borderRadius: 14, padding: '10px 14px', fontSize: 14, fontWeight: 700 }}>{giftErr}</div>}
            {pendingGifts.length > 1 && (
              <button onClick={claimAll} disabled={!!claiming} style={{ height: 48, borderRadius: 99, border: 0, background: 'linear-gradient(90deg,#FF6B6B,#F59E0B)', color: '#fff', fontSize: 18, fontWeight: 800, opacity: claiming ? 0.6 : 1 }}>
                {claiming === 'all' ? 'Mengklaim...' : `Klaim semua (${pendingGifts.length})`}
              </button>
            )}
            {[...pendingGifts, ...doneGifts].map((g) => (
              <div key={g.id} style={{ background: '#2A2931', borderRadius: 24, padding: 14, border: g.claimed ? '1px solid rgba(255,255,255,.05)' : '1px solid rgba(255,107,107,.45)', opacity: g.claimed ? 0.6 : 1 }}>
                <div style={{ display: 'flex', gap: 14 }}>
                  <GiftArt g={g} photo={photo} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: MUTED, fontSize: 14, fontWeight: 800 }}>Hadiah dari {g.from} · {ago(g.timestamp)}</div>
                    <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: -0.7, lineHeight: 1.15, marginTop: 4 }}>{g.itemName}</div>
                    <div style={{ color: CORAL, fontSize: 14, fontWeight: 800, marginTop: 3 }}>{GIFT_TYPE_LABEL[g.type] || 'Hadiah'}</div>
                    {g.message && <div style={{ marginTop: 8, background: '#1F1E24', borderRadius: 12, padding: '8px 10px', color: '#D6D4DE', fontSize: 14, fontWeight: 700, lineHeight: 1.35 }}>“{g.message}”</div>}
                  </div>
                </div>
                {g.claimed ? (
                  <div style={{ marginTop: 12, textAlign: 'center', color: '#6FD6B2', fontWeight: 800, fontSize: 15 }}>✓ Sudah diklaim</div>
                ) : (
                  <button onClick={() => doClaim(g)} disabled={!!claiming} style={{ marginTop: 12, width: '100%', height: 48, borderRadius: 99, border: 0, background: CORAL, color: '#fff', fontSize: 18, fontWeight: 800, opacity: claiming ? 0.6 : 1 }}>
                    {claiming === g.id ? 'Mengklaim...' : 'Klaim hadiah'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      )}

      <GiftEffect show={!!fx} onDone={() => setFx(null)} title={fx?.title} sub={fx?.sub} visual={fx?.visual} />

      {tab === 'komentar' && <Empty title="Belum ada balasan" sub="Balasan di komentarmu akan muncul di sini." />}
    </div>
  );
}
