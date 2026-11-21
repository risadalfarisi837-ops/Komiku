"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUserStats } from '@/lib/store';
import { currentSeason, RANKS, rankFor, fmt, TARGETS, POINTS_PER_CHAPTER, NIGHT_BONUS, DAILY_BONUS, Track } from '@/lib/season';
import { fetchTop, pushSeasonScore, getUser, Row } from '@/lib/leaderboard';

const CORAL = '#FF6B6B';
const CARD = '#2A2931';
const MUTED = '#8F8D9B';
const GREEN = '#0E8A6A';
const MAROON = '#4A2A33';
const TABS: ('Semua' | Track)[] = ['Semua', 'Noble', 'Murim', 'Demon'];
const AVATAR_COLORS = ['#4A2A2E', '#F26B21', '#3B3F8C', '#0F6B55', '#7A1D2E', '#5B3A8C'];

const Shield = ({ color, size = 22 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="rgba(255,255,255,.55)" strokeWidth={1.4} strokeLinejoin="round">
    <path d="M12 2.5l8 3v6c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10v-6l8-3z" />
  </svg>
);

function Avatar({ name, photo, size = 52 }: { name: string; photo?: string; size?: number }) {
  const bg = AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo} alt="" referrerPolicy="no-referrer" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flex: `0 0 ${size}px` }} />;
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, flex: `0 0 ${size}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.4, fontWeight: 800 }}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function RankPill({ points }: { points: number }) {
  const { rank } = rankFor(points);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: rank.bg, padding: '4px 12px 4px 6px', borderRadius: 99, fontSize: 15, fontWeight: 800, letterSpacing: -0.4, alignSelf: 'flex-start' }}>
      <Shield color={rank.bg} size={22} />{rank.name}
    </span>
  );
}

function MiniStat({ icon, label, value, target, unit }: { icon: string; label: string; value: number; target: number; unit?: string }) {
  const pct = Math.min(100, (value / target) * 100);
  return (
    <div style={{ flex: 1, minWidth: 0, background: '#1F1E24', borderRadius: 18, padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: MUTED, fontSize: 15, fontWeight: 800 }}><span>{icon}</span>{label}</div>
      <div style={{ marginTop: 6, fontSize: 24, fontWeight: 800, letterSpacing: -1 }}>
        {fmt(value)}<span style={{ fontSize: 15, color: MUTED }}> / {fmt(target)}{unit ? ` ${unit}` : ''}</span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: MAROON, marginTop: 8 }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: GREEN }} />
      </div>
    </div>
  );
}

export default function RankingPage() {
  const season = currentSeason();
  const mine = useUserStats((s) => s.season);
  const [mounted, setMounted] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [me, setMe] = useState<any>(null);
  const [tab, setTab] = useState<'Semua' | Track>('Semua');
  const [sheet, setSheet] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const u = await getUser();
        if (!alive) return;
        setMe(u || null);
        if (u) await pushSeasonScore();   // sinkronkan poin lokal dulu
        const top = await fetchTop(season.id);
        if (alive) setRows(top);
      } catch (e: any) {
        if (alive) setError(e?.message || 'Gagal memuat peringkat');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [season.id]);

  const pts = mounted && mine.id === season.id ? mine.points : 0;
  const chapters = mounted && mine.id === season.id ? mine.chapters : 0;
  const night = mounted && mine.id === season.id ? mine.night : 0;
  const streak = mounted ? mine.streak : 0;
  const { next } = rankFor(pts);

  const list = tab === 'Semua' ? rows : rows.filter((r) => rankFor(r.points).rank.track === tab);
  const myIndex = me ? rows.findIndex((r) => r.uid === me.uid) : -1;
  const myRank = myIndex >= 0 ? String(myIndex + 1) : me && pts > 0 ? '100+' : '–';

  return (
    <div style={{ background: '#1B1A20', color: '#fff', minHeight: '100vh', paddingBottom: 90 }}>
      <style>{`a { text-decoration: none; color: inherit; } button { font-family: inherit; cursor: pointer; } .no-scrollbar::-webkit-scrollbar { display: none; }`}</style>

      {/* Judul musim */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px 14px 12px' }}>
        <div>
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: -1.6, lineHeight: 1.05 }}>Season {season.id}</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: MUTED, letterSpacing: -0.6, marginTop: 2 }}>{season.label} · {season.daysLeft} hari lagi</div>
        </div>
        <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
          <button onClick={() => setSheet(true)} aria-label="Daftar lencana" style={{ background: 'none', border: 0, padding: 8 }}>
            <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinejoin="round"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8z" /></svg>
          </button>
          <button onClick={() => setSheet(true)} aria-label="Aturan poin" style={{ background: 'none', border: 0, padding: 8 }}>
            <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round"><circle cx={12} cy={12} r={9.5} /><line x1={12} y1={11} x2={12} y2={17} /><circle cx={12} cy={7.6} r={0.6} fill="#fff" /></svg>
          </button>
        </div>
      </div>

      {/* Kartu progres */}
      <div style={{ margin: '0 14px', background: CARD, borderRadius: 26, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '6px 6px 12px' }}>
          <div style={{ width: 54, height: 54, borderRadius: '50%', background: '#1F1E24', border: '2px dashed rgba(255,255,255,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 54px' }}>
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x={5} y={11} width={14} height={9} rx={2} /><path d="M8 11V8a4 4 0 018 0v3" /></svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: 0.8, color: MUTED, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {next ? `LENCANA BERIKUTNYA · ${next.track.toUpperCase()}` : 'LENCANA TERTINGGI'}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1.2, lineHeight: 1.1 }}>{next ? next.name : rankFor(pts).rank.name}</div>
          </div>
          {next && (
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -1.4 }}>
              {fmt(pts)}<span style={{ fontSize: 20, color: MUTED }}>/{fmt(next.min)}</span>
            </div>
          )}
        </div>
        <div style={{ height: 8, borderRadius: 4, background: MAROON, margin: '0 6px 16px' }}>
          <div style={{ width: `${next ? Math.min(100, (pts / next.min) * 100) : 100}%`, height: '100%', borderRadius: 4, background: GREEN }} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <MiniStat icon="📖" label="Chapter" value={chapters} target={TARGETS.chapter} />
          <MiniStat icon="🔥" label="Streak" value={streak} target={TARGETS.streak} unit="hari" />
          <MiniStat icon="🌙" label="Malam" value={night} target={TARGETS.night} />
        </div>
      </div>

      {/* Papan peringkat */}
      <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1.5, padding: '34px 14px 14px' }}>Papan peringkat</div>
      <div className="no-scrollbar" style={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        {TABS.map((t) => {
          const on = tab === t;
          const color = t === 'Noble' ? '#27479E' : t === 'Murim' ? '#0F6B55' : '#8A1F34';
          return (
            <button key={t} onClick={() => setTab(t)} style={{ flex: '1 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 16px 14px', background: 'none', border: 0, borderBottom: `3px solid ${on ? CORAL : 'transparent'}`, color: on ? '#fff' : MUTED, fontSize: 21, fontWeight: 800, letterSpacing: -0.8 }}>
              {t !== 'Semua' && <Shield color={color} size={22} />}{t}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: MUTED, fontWeight: 700 }}>Memuat peringkat...</div>
      ) : error ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: MUTED, fontWeight: 700, lineHeight: 1.4 }}>
          Peringkat belum bisa dimuat.
          <div style={{ fontSize: 12.5, marginTop: 8, opacity: 0.8 }}>{error}</div>
        </div>
      ) : list.length === 0 ? (
        <div style={{ padding: '50px 20px', textAlign: 'center', color: MUTED, fontWeight: 700, lineHeight: 1.4 }}>
          Belum ada pembaca di peringkat ini.<br />Baca chapter untuk jadi yang pertama.
        </div>
      ) : (
        <div>
          {list.map((r, i) => (
            <div key={r.uid} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 14px' }}>
              <span style={{ width: 30, textAlign: 'center', fontSize: 30, fontWeight: 800, letterSpacing: -1, color: i < 3 ? CORAL : '#fff' }}>{i + 1}</span>
              <Avatar name={r.name} photo={r.photo} />
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
                <RankPill points={r.points} />
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -1 }}>{fmt(r.points)}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: MUTED, marginTop: -2 }}>poin</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Posisi kamu (menempel di atas navbar) */}
      <div style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', width: 'min(100%, 448px)', bottom: 'calc(78px + env(safe-area-inset-bottom, 0px))', padding: '0 14px', zIndex: 40 }}>
        {me ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#1B1A20', border: `2px solid ${CORAL}`, borderRadius: 22, padding: '10px 14px' }}>
            <span style={{ minWidth: 44, textAlign: 'center', fontSize: myRank.length > 3 ? 22 : 28, fontWeight: 800, letterSpacing: -1 }}>{myRank}</span>
            <Avatar name={me.displayName || 'Kamu'} photo={me.photoURL} size={48} />
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Kamu · {me.displayName || 'Pembaca'}</div>
              <RankPill points={pts} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -1 }}>{fmt(pts)}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: MUTED, marginTop: -2 }}>poin</div>
            </div>
          </div>
        ) : (
          !loading && (
            <Link href="/profile" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1B1A20', border: `2px solid ${CORAL}`, borderRadius: 22, padding: '14px 18px', fontSize: 17, fontWeight: 800 }}>
              <span>Masuk untuk ikut peringkat</span>
              <span style={{ background: CORAL, padding: '8px 18px', borderRadius: 99 }}>Masuk</span>
            </Link>
          )
        )}
      </div>

      {/* Lembar aturan + daftar lencana */}
      {sheet && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div onClick={() => setSheet(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.6)' }} />
          <div style={{ position: 'relative', background: '#16151A', borderRadius: '28px 28px 0 0', maxHeight: '82vh', overflowY: 'auto', padding: '14px 20px 28px', width: 'min(100%, 448px)', margin: '0 auto' }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.2)', margin: '0 auto 16px' }} />
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -1 }}>Cara dapat poin</div>
            <div style={{ color: '#D6D4DE', fontWeight: 700, fontSize: 15, lineHeight: 1.6, marginTop: 8 }}>
              • {POINTS_PER_CHAPTER} poin tiap chapter baru dibaca<br />
              • +{DAILY_BONUS} poin untuk chapter pertama tiap hari<br />
              • +{NIGHT_BONUS} poin kalau baca jam 22.00–04.59<br />
              • Chapter yang sama hanya dihitung sekali per musim<br />
              • Poin direset tiap musim (2 bulan)
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -1, margin: '22px 0 10px' }}>Daftar lencana</div>
            {RANKS.map((r) => (
              <div key={r.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: r.bg, padding: '4px 12px 4px 6px', borderRadius: 99, fontSize: 15, fontWeight: 800 }}><Shield color={r.bg} />{r.name}</span>
                <span style={{ color: MUTED, fontWeight: 800, fontSize: 15 }}>{r.track} · {fmt(r.min)} poin</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
