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
  ];
}

function KomoSleeping() {
  return (
    <svg width={240} height={190} viewBox="0 0 240 190">
      <g fill="#fff" stroke="#14301c" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round">
        <path d="M168 48h18l-18 18h20" fill="none" /><path d="M190 22h14l-14 14h16" fill="none" />
      </g>
      <path d="M150 128c20-4 42-16 52-38-2 20-8 38-30 52z" fill="#7C9961" stroke="#14301c" strokeWidth={3.5} strokeLinejoin="round" />
      <ellipse cx={120} cy={146} rx={50} ry={34} fill="#7C9961" stroke="#14301c" strokeWidth={3.5} />
      <path d="M95 126c0-12 10-20 25-20s25 8 25 20c0 14-10 22-25 22s-25-8-25-22z" fill="#EBE0B5" />
      <path d="M100 118h40v18h-40z" fill="#fff" stroke="#14301c" strokeWidth={3} />
      <path d="M100 124h40M100 130h40" stroke="#D64545" strokeWidth={5} /><path d="M120 118v18" stroke="#14301c" strokeWidth={2.5} />
      <ellipse cx={86} cy={160} rx={20} ry={11} fill="#7C9961" stroke="#14301c" strokeWidth={3.5} />
      <ellipse cx={154} cy={160} rx={20} ry={11} fill="#7C9961" stroke="#14301c" strokeWidth={3.5} />
      <circle cx={120} cy={74} r={40} fill="#7C9961" stroke="#14301c" strokeWidth={3.5} />
      <path d="M96 34l4 10-9-4zM114 30l4 10-9-3zM134 32l-2 10 9-3z" fill="#7C9961" stroke="#14301c" strokeWidth={3} strokeLinejoin="round" />
      <ellipse cx={120} cy={84} rx={22} ry={16} fill="#EBE0B5" />
      <circle cx={92} cy={86} r={6} fill="#F2A2A2" opacity={0.7} /><circle cx={148} cy={86} r={6} fill="#F2A2A2" opacity={0.7} />
      <path d="M97 70q8 6 16 0M127 70q8 6 16 0" fill="none" stroke="#14301c" strokeWidth={3.5} strokeLinecap="round" />
      <path d="M113 90q7 6 14 0" fill="none" stroke="#14301c" strokeWidth={3.5} strokeLinecap="round" />
      <ellipse cx={120} cy={80} rx={4} ry={2.4} fill="#14301c" />
    </svg>
  );
}

function Empty({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '70px 40px 0' }}>
      <KomoSleeping />
      <div style={{ fontSize: 25, fontWeight: 800, letterSpacing: -0.8, marginTop: 14 }}>{title}</div>
      <div style={{ color: MUTED, fontSize: 21, fontWeight: 800, letterSpacing: -0.6, lineHeight: 1.35, marginTop: 8 }}>{sub}</div>
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
        <button onClick={markAll} style={{ background: 'none', border: 0, color: CORAL, fontSize: 21, fontWeight: 800, letterSpacing: -0.6, padding: '6px 8px' }}>Tandai semua dibaca</button>
      </div>

      {/* Segmen */}
      <div style={{ display: 'flex', margin: '12px 14px 0', padding: 5, borderRadius: 99, background: '#25242B', border: '1px solid rgba(255,255,255,.06)' }}>
        {tabs.map((t) => {
          const on = tab === t.k;
          return (
            <button key={t.k} onClick={() => setTab(t.k)} style={{ flex: 1, height: 46, borderRadius: 99, border: 0, background: on ? '#1B1A20' : 'transparent', color: on ? '#fff' : MUTED, fontSize: 21, fontWeight: 800, letterSpacing: -0.6 }}>{t.label}</button>
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
