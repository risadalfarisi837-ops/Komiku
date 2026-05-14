'use client';

import { useEffect, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

declare global { interface Window { firebase: any; _fbReady: boolean; } }
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAptqYUJWJ-bfadEA5Oa3d5c8YBl8qGzd0",
  authDomain: "komiku-d8788.firebaseapp.com",
  databaseURL: "https://komiku-d8788-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "komiku-d8788",
  storageBucket: "komiku-d8788.firebasestorage.app",
  messagingSenderId: "186745171350",
  appId: "1:186745171350:web:92cd160ed67e25de8801b7",
};
function loadFirebaseCDN(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window._fbReady) return Promise.resolve();
  return new Promise(resolve => {
    const urls = [
      'https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js',
      'https://www.gstatic.com/firebasejs/10.14.0/firebase-auth-compat.js',
      'https://www.gstatic.com/firebasejs/10.14.0/firebase-database-compat.js',
    ];
    let done = 0;
    urls.forEach(src => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => { done++; if (done === urls.length) { window._fbReady = true; resolve(); } };
      document.head.appendChild(s);
    });
  });
}
let _fbInit = false;
async function getFirebase() {
  await loadFirebaseCDN();
  if (!_fbInit) {
    if (!window.firebase.apps.length) window.firebase.initializeApp(FIREBASE_CONFIG);
    _fbInit = true;
  }
  return { auth: window.firebase.auth(), db: window.firebase.database() };
}

const TRACKS = [
  {
    key: 'all',
    line1: 'All', line2: 'Tracks',
    color: '#ef4444', bg: 'rgba(239,68,68,0.18)', border: 'rgba(239,68,68,0.5)',
    minLvl: 0, maxLvl: undefined as number | undefined,
    titles: [] as string[], titleIcon: '',
  },
  {
    key: 'noble',
    line1: 'Noble', line2: 'Rank',
    color: '#f1c40f', bg: 'rgba(241,196,15,0.15)', border: 'rgba(241,196,15,0.45)',
    minLvl: 0, maxLvl: 499,
    titles: ['Squire','Knight','Baron','Viscount','Count','Earl','Marquess','Duke','Archduke','Grand Duke'],
    titleIcon: '',
  },
  {
    key: 'murim',
    line1: 'Murim', line2: 'Path',
    color: '#a855f7', bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.45)',
    minLvl: 500, maxLvl: 9999,
    titles: ['Disciple','Practitioner','Fighter','Warrior','Expert','Master','Elder','Saint','Sage','Martial Saint'],
    titleIcon: '',
  },
  {
    key: 'demon',
    line1: 'Demon', line2: 'Court',
    color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.45)',
    minLvl: 10000, maxLvl: undefined as number | undefined,
    titles: ['Imp','Demon','Devil','Fiend','Archfiend','Warlord','Overlord','Demon Lord','Demon King','Abyssal Monarch'],
    titleIcon: '',
  },
];

const RANK_TIERS = [
  { name: 'Mortal',      minLvl: 0,     maxLvl: 49,      color: '#9ca3af' },
  { name: 'Disciple',    minLvl: 50,    maxLvl: 149,     color: '#cd7f32' },
  { name: 'Warrior',     minLvl: 150,   maxLvl: 499,     color: '#bdc3c7' },
  { name: 'Cultivator',  minLvl: 500,   maxLvl: 2499,    color: '#f1c40f' },
  { name: 'Sword Master',minLvl: 2500,  maxLvl: 4999,    color: '#2ecc71' },
  { name: 'Grand Elder', minLvl: 5000,  maxLvl: 9999,    color: '#3498db' },
  { name: 'Sect Leader', minLvl: 10000, maxLvl: 19999,   color: '#9b59b6' },
  { name: 'Immortal',    minLvl: 20000, maxLvl: Infinity, color: '#ef4444' },
];
function getRankTier(level: number) {
  return RANK_TIERS.find(r => level >= r.minLvl && level <= r.maxLvl) || RANK_TIERS[0];
}
function getUserTrack(level: number) {
  if (level >= 10000) return TRACKS[3];
  if (level >= 500)   return TRACKS[2];
  return TRACKS[1];
}
function getUserTitle(level: number, equippedTitle?: string): string {
  if (equippedTitle) return equippedTitle;
  const track = getUserTrack(level);
  if (!track.titles.length) return '';
  const maxLvl = track.maxLvl ?? 29999;
  const max    = maxLvl === Infinity ? 29999 : maxLvl;
  const min    = track.minLvl;
  const ratio  = Math.min((level - min) / Math.max(max - min, 1), 0.999);
  const idx    = Math.floor(ratio * track.titles.length);
  return track.titles[Math.max(0, Math.min(idx, track.titles.length - 1))];
}
function getScore(u: UserEntry) {
  return (u.koin || 0) + (u.level || 1) * 10 + (u.chaptersRead || 0) * 2;
}

interface UserEntry {
  uid: string; displayName: string; photoURL: string;
  level: number; koin: number; role: string; equippedTitle?: string;
  lastActive?: number; menitMenonton?: number; chaptersRead?: number; streak?: number;
}

function Avatar({ src, size, color }: { src: string; size: number; color: string }) {
  const [err, setErr] = useState(false);
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', border: `3px solid ${color}`, flexShrink: 0, background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {src && !err
        ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" onError={() => setErr(true)} />
        : <div style={{ width: '100%', height: '100%', background: '#2a2a3a', borderRadius: '50%' }} />}
    </div>
  );
}

export default function LeaderboardPage() {
  const [users,    setUsers]    = useState<UserEntry[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [trackTab, setTrackTab] = useState(0);
  const [meInfo,   setMeInfo]   = useState<{ uid: string } | null>(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const { auth, db } = await getFirebase();
      const me: any = await new Promise(resolve => {
        const unsub = auth.onAuthStateChanged((u: any) => { unsub(); resolve(u); });
      });
      if (me) setMeInfo({ uid: me.uid });
      const snap = await db.ref('users').get();
      if (!snap.exists()) { setUsers([]); return; }
      const raw: UserEntry[] = [];
      snap.forEach((child: any) => {
        const d = child.val();
        if (!d || !d.displayName) return;
        raw.push({
          uid: child.key, displayName: d.displayName || 'User',
          photoURL: d.photoURL || '', level: d.level || 1,
          koin: d.koin || 0, role: d.role || 'Member',
          equippedTitle: d.equippedTitle || d.activeTitle || '',
          lastActive: d.lastActive || d.joinedAt || 0,
          menitMenonton: d.menitMenonton || 0,
          chaptersRead: d.chaptersRead || d.totalChapters || 0,
          streak: d.streak || d.loginStreak || 0,
        });
      });
      setUsers(raw);
    } catch (e: any) { setError(e.message || 'Gagal memuat data'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const activeTrack = TRACKS[trackTab];
  const filtered = (() => {
    let arr = [...users].sort((a, b) => getScore(b) - getScore(a));
    if (activeTrack.key !== 'all') arr = arr.filter(u => getUserTrack(u.level).key === activeTrack.key);
    return arr;
  })();

  return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh', color: '#fff', maxWidth: 448, margin: '0 auto', paddingBottom: 96, fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&display=swap');
        .chip { display:inline-flex; align-items:center; gap:4px; background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.1); border-radius:99px; padding:5px 13px; font-size:13px; font-weight:600; color:#9ca3af; }
        .chip b { color:#fff; font-weight:800; }
        ::-webkit-scrollbar { display:none; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 40, background: '#0a0a0f' }}>
        <div style={{ padding: '18px 16px 10px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, letterSpacing: -0.5 }}>Leaderboard</h1>
            <p style={{ fontSize: 12, color: '#6b7280', margin: '3px 0 0', fontWeight: 600 }}>
              {activeTrack.key === 'all' ? 'All Tracks · 8-Week Ranking by Track' : `${activeTrack.line1} ${activeTrack.line2} · 8-Week Ranking`}
            </p>
          </div>
          <button onClick={load} disabled={loading} style={{ width: 40, height: 40, borderRadius: 13, background: '#1C1F26', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginTop: 4 }}>
            <RefreshCw size={16} color="#9ca3af" />
          </button>
        </div>

        {/* ── Track tabs — 4 kolom fixed, persis referensi ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          {TRACKS.map((t, i) => {
            const isActive = trackTab === i;
            return (
              <button key={t.key} onClick={() => setTrackTab(i)} style={{
                padding: '11px 4px',
                background: isActive ? t.bg : 'transparent',
                border: 'none',
                borderBottom: isActive ? `3px solid ${t.color}` : '3px solid transparent',
                borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                color: isActive ? t.color : '#6b7280',
                fontWeight: 800, fontSize: 12, cursor: 'pointer',
                lineHeight: 1.3, textAlign: 'center' as const,
                transition: 'all 0.18s', fontFamily: "'Outfit', sans-serif",
              }}>
                {t.line1}<br />{t.line2}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── List ── */}
      <div style={{ padding: '14px 12px 0' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: 16 }}>
            <Loader2 size={40} color="#4b5563" className="animate-spin" />
            <p style={{ color: '#6b7280', fontSize: 14 }}>Memuat leaderboard...</p>
          </div>
        ) : error ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 32px', gap: 16, textAlign: 'center' }}>
            <p style={{ color: '#9ca3af', fontSize: 14 }}>{error}</p>
            <button onClick={load} style={{ padding: '10px 24px', background: '#1C1F26', color: '#fff', fontWeight: 800, fontSize: 14, borderRadius: 99, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>Coba Lagi</button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: 12 }}>
            <p style={{ color: '#6b7280', fontSize: 14 }}>Belum ada player di track ini</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map((u, idx) => {
              const rankNum  = idx + 1;
              const tierObj  = getRankTier(u.level);
              const trackObj = getUserTrack(u.level);
              const isMe     = meInfo?.uid === u.uid;
              const score    = getScore(u);
              const title    = getUserTitle(u.level, u.equippedTitle);
              const menit    = u.menitMenonton || 0;

              // Border warna card — referensi: #1 merah/track, #2 ungu, #3 emas
              const borderCol = isMe
                ? '#f1c40f'
                : rankNum === 1 ? trackObj.color
                : rankNum === 2 ? '#a855f7'
                : rankNum === 3 ? '#f1c40f'
                : 'rgba(255,255,255,0.07)';
              const borderOpacity = isMe ? '99' : rankNum <= 3 ? 'bb' : '';

              return (
                <div key={u.uid} style={{
                  background: isMe ? 'rgba(241,196,15,0.04)' : '#0f0f18',
                  border: `1.5px solid ${borderCol}${rankNum > 3 && !isMe ? '' : borderOpacity}`,
                  borderRadius: 20,
                  padding: '18px 16px 15px',
                }}>
                  {/* ── Baris utama: rank · avatar · nama+badge ── */}
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>


                    <div style={{ minWidth: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 4 }}>
                      <span style={{ fontSize: 22, fontWeight: 900, lineHeight: 1, color: rankNum===1?'#ef4444':rankNum===2?'#a855f7':rankNum===3?'#f1c40f':'#4b5563' }}>#{rankNum}</span>
                    </div>

                    {/* Avatar border warna rank tier */}
                    <Avatar src={u.photoURL} size={60} color={tierObj.color} />

                    {/* Nama + badges */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Nama + Kamu badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 19, fontWeight: 900, color: '#fff', letterSpacing: -0.4, lineHeight: 1.1 }}>
                          {u.displayName}
                        </span>
                        {isMe && (
                          <span style={{ fontSize: 11, background: 'rgba(241,196,15,0.15)', color: '#f1c40f', border: '1px solid rgba(241,196,15,0.4)', borderRadius: 99, padding: '2px 10px', fontWeight: 800, flexShrink: 0 }}>
                            Kamu
                          </span>
                        )}
                      </div>

                      {/* Badge baris: Track (kotak) + Title (pill) — persis referensi */}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        {/* Track badge — kotak rounded kecil */}
                        <span style={{
                          fontSize: 12, fontWeight: 800,
                          color: trackObj.color,
                          background: trackObj.bg,
                          border: `1px solid ${trackObj.border}`,
                          borderRadius: 8, padding: '4px 11px',
                        }}>
                          {trackObj.line1} {trackObj.line2}
                        </span>

                        {/* Title badge — pill dengan icon */}
                        <span style={{
                          fontSize: 12, fontWeight: 700,
                          color: '#d1d5db',
                          background: 'rgba(255,255,255,0.07)',
                          border: '1px solid rgba(255,255,255,0.13)',
                          borderRadius: 99, padding: '4px 12px',
                          display: 'inline-flex', alignItems: 'center',
                        }}>
                          {title}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ── Stat chips baris 1 ── */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                    <span className="chip">Score <b>{score.toLocaleString()}</b></span>
                    <span className="chip">Chapters <b>{(u.chaptersRead || 0).toLocaleString()}</b></span>
                    <span className="chip">Streak <b>{u.streak || 0}</b></span>
                  </div>

                  {/* ── Stat chips baris 2 ── */}
                  <div style={{ marginTop: 8 }}>
                    <span className="chip">Night <b>{menit.toLocaleString()} m</b></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
