'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFavorites } from '@/lib/store';
import { currentSeason } from '@/lib/season';
import { getFirebase } from '@/lib/leaderboard';

const CORAL = '#FF6B6B';
const MUTED = '#8F8D9B';
const K_SEEN = 'komiku-notif-seen';        // { [linkKomik]: jumlahChapterTerakhirDilihat }
const K_INFO = 'komiku-notif-info-read';   // string[] id info yang sudah dibaca

type Tab = 'update' | 'info' | 'komentar';
interface UpdateItem { link: string; title: string; thumb: string; baru: number; chapter: string; date: string }
interface InfoItem { id: string; judul: string; isi: string; waktu?: number }

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

export default function NotifikasiPage() {
  const router = useRouter();
  const favorites = useFavorites((s) => s.favorites);
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>('update');
  const [updates, setUpdates] = useState<UpdateItem[]>([]);
  const [infos, setInfos] = useState<InfoItem[]>([]);
  const [readInfo, setReadInfo] = useState<string[]>([]);
  const [checking, setChecking] = useState(true);

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
      if (alive) setInfos(items);
    })();
    return () => { alive = false; };
  }, [mounted]);

  const unreadInfo = useMemo(() => infos.filter((i) => !readInfo.includes(i.id)).length, [infos, readInfo]);

  const markAll = () => {
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
    { k: 'update', label: 'Pembaruan' },
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
            <button key={t.k} onClick={() => setTab(t.k)} style={{ flex: 1, height: 42, borderRadius: 99, border: 0, background: on ? '#1B1A20' : 'transparent', color: on ? '#fff' : MUTED, fontSize: 19, fontWeight: 800, letterSpacing: -0.6 }}>{t.label}</button>
          );
        })}
      </div>

      {tab === 'update' && (
        checking ? (
          <div style={{ padding: '80px 20px', textAlign: 'center', color: MUTED, fontWeight: 700 }}>Memeriksa chapter baru...</div>
        ) : updates.length === 0 ? (
          <Empty title="Semua sudah kamu baca" sub="Tidak ada notifikasi baru. Komo akan membangunkanmu saat ada chapter rilis." />
        ) : (
          <div style={{ padding: '14px 14px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
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
          </div>
        )
      )}

      {tab === 'info' && (
        infos.length === 0 ? (
          <Empty title="Belum ada info" sub="Pengumuman dari Komiku akan muncul di sini." />
        ) : (
          <div style={{ padding: '14px 14px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {infos.map((i) => {
              const unread = !readInfo.includes(i.id);
              return (
                <button key={i.id} onClick={() => readOne(i.id)} style={{ background: '#2A2931', border: 0, borderRadius: 16, padding: '14px 16px', textAlign: 'left', color: '#fff', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
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

      {tab === 'komentar' && <Empty title="Belum ada balasan" sub="Balasan di komentarmu akan muncul di sini." />}
    </div>
  );
}
