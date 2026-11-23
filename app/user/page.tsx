'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getFirebase } from '@/lib/leaderboard';
import { useFavorites, useHistory } from '@/lib/store';
import { WALLPAPER_CATALOG, RARITY_STYLE } from '@/lib/wallpapers';
import { BORDER_CATALOG } from '@/components/BorderSheet';
import VerifiedBadge from '@/components/VerifiedBadge';
import DevBadge from '@/components/DevBadge';
import PremiumName from '@/components/PremiumName';
import { isPremiumRole } from '@/lib/premium';

const MUTED = '#8e9bb8';
const BLUE = '#1D9BF0';

const TIERS = [
  { name: 'Stone', min: 0, max: 49, color: '#9ca3af', icon: '🌑' },
  { name: 'Bronze', min: 50, max: 149, color: '#cd7f32', icon: '🥉' },
  { name: 'Silver', min: 150, max: 499, color: '#bdc3c7', icon: '🥈' },
  { name: 'Gold', min: 500, max: 2499, color: '#f1c40f', icon: '🥇' },
  { name: 'Emerald', min: 2500, max: 4999, color: '#2ecc71', icon: '🔮' },
  { name: 'Diamond', min: 5000, max: 9999, color: '#3498db', icon: '💎' },
  { name: 'Master', min: 10000, max: 19999, color: '#9b59b6', icon: '👑' },
  { name: 'Mythic', min: 20000, max: Infinity, color: '#ef4444', icon: '🌟' },
];
const tierOf = (lv: number) => TIERS.find((t) => lv >= t.min && lv <= t.max) || TIERS[0];

const FIELDS = ['displayName', 'photoURL', 'level', 'role', 'joinedAt', 'menitMenonton', 'activeBorder', 'activeWallpaper', 'premiumUntil'];

function timeAgo(ts: number) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return 'Baru saja';
  if (m < 60) return m + ' menit lalu';
  const h = Math.floor(m / 60);
  if (h < 24) return h + ' jam lalu';
  const d = Math.floor(h / 24);
  if (d < 30) return d + ' hari lalu';
  return Math.floor(d / 30) + ' bulan lalu';
}

interface UserComment { id: string; teks: string; waktu: number; chapterTitle?: string; kind: string }

function Avatar({ src, size, borderKey }: { src?: string; size: number; borderKey?: string }) {
  const b: any = borderKey ? (BORDER_CATALOG as any)[borderKey] : null;
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: '0 0 ' + size + 'px' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src || 'https://placehold.co/' + size + '/1a1d24/fff?text=?'}
        alt=""
        referrerPolicy="no-referrer"
        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', background: '#1a1d24' }}
      />
      {b && b.url && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', width: '130%', height: '130%', transform: 'translate(-50%,-50%)', backgroundImage: "url('" + b.url + "')", backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', pointerEvents: 'none', zIndex: 10 }} />
      )}
    </div>
  );
}

function UserContent() {
  const sp = useSearchParams();
  const uid = sp.get('uid') || '';
  const [prof, setProf] = useState<any>(null);
  const [comments, setComments] = useState<UserComment[]>([]);
  const [myUid, setMyUid] = useState<string>('');
  const [state, setState] = useState<'loading' | 'ok' | 'error' | 'empty'>('loading');
  const [tab, setTab] = useState<'komentar' | 'favorit' | 'riwayat'>('komentar');
  const { favorites } = useFavorites();
  const { history } = useHistory();

  useEffect(() => {
    if (!uid) { setState('empty'); return; }
    let alive = true;
    (async () => {
      try {
        const { auth, db } = await getFirebase();
        auth.onAuthStateChanged((u: any) => { if (alive) setMyUid(u ? u.uid : ''); });

        const res = await Promise.all(
          FIELDS.map((f) =>
            db.ref('users/' + uid + '/' + f).get().then((s: any) => [f, s.val()]).catch(() => [f, undefined])
          )
        );
        const p: any = {};
        let anyOk = false;
        res.forEach((r: any) => { if (r[1] !== undefined && r[1] !== null) { p[r[0]] = r[1]; anyOk = true; } });
        if (!alive) return;
        if (!anyOk) { setState('error'); return; }
        setProf(p);
        setState('ok');

        const list: UserComment[] = [];
        for (const node of ['chapterComments', 'mangaComments']) {
          try {
            const snap = await db.ref(node).get();
            snap.forEach((room: any) => {
              room.forEach((c: any) => {
                const v = c.val();
                if (v && v.uid === uid && v.teks) list.push({ id: node + c.key, teks: v.teks, waktu: v.waktu || 0, chapterTitle: v.chapterTitle || v.mangaTitle || '', kind: node });
              });
            });
          } catch { /* node tidak bisa dibaca, lewati */ }
        }
        list.sort((a, b) => b.waktu - a.waktu);
        if (alive) setComments(list);
      } catch {
        if (alive) setState('error');
      }
    })();
    return () => { alive = false; };
  }, [uid]);

  const back = () => { if (window.history.length > 1) window.history.back(); else window.location.assign('/'); };
  const isMe = !!myUid && myUid === uid;

  const Wrap = ({ children }: { children: any }) => (
    <div style={{ position: 'fixed', inset: 0, overflowY: 'auto', background: '#121212', color: '#fff', zIndex: 300 }}>{children}</div>
  );
  const BackBtn = () => (
    <button onClick={back} aria-label="Kembali" style={{ position: 'absolute', left: 12, top: 'max(14px, env(safe-area-inset-top))', background: 'rgba(0,0,0,.35)', border: 0, borderRadius: 99, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
      <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 5l-7 7 7 7" /></svg>
    </button>
  );

  if (state === 'loading') return <Wrap><BackBtn /><div style={{ padding: '140px 24px', textAlign: 'center', color: MUTED, fontWeight: 700 }}>Memuat profil…</div></Wrap>;
  if (state === 'empty') return <Wrap><BackBtn /><div style={{ padding: '140px 24px', textAlign: 'center', color: MUTED, fontWeight: 700 }}>Profil tidak ditemukan.</div></Wrap>;
  if (state === 'error' || !prof) return (
    <Wrap><BackBtn />
      <div style={{ padding: '140px 24px', textAlign: 'center', color: MUTED, fontWeight: 700, lineHeight: 1.5 }}>
        Profil belum bisa dimuat.<br /><span style={{ fontSize: 13, fontWeight: 600 }}>Pastikan kamu sudah login, dan Rules Firebase mengizinkan membaca data profil.</span>
      </div>
    </Wrap>
  );

  const level = Number(prof.level) || 1;
  const tier = tierOf(level);
  const wp: any = prof.activeWallpaper ? (WALLPAPER_CATALOG as any)[prof.activeWallpaper] : null;
  const rs: any = wp ? (RARITY_STYLE as any)[wp.rarity] : null;
  const bannerBg = wp ? (wp.url ? 'url(' + wp.url + ') center/cover' : wp.grad) : 'linear-gradient(160deg,#1c2133,#0b0c10)';
  const pu = Number(prof.premiumUntil) || 0;
  const verified = isPremiumRole(prof.role) && (!pu || pu > Date.now());
  const dev = prof.role === 'Developer';
  const joined = Number(prof.joinedAt) || 0;
  const months = joined ? Math.max(0, Math.floor((Date.now() - joined) / (30.44 * 86400000))) : null;
  const minutes = Number(prof.menitMenonton) || 0;
  const shortUid = '#' + uid.substring(0, 6).toUpperCase();
  const name = prof.displayName || 'User';

  const stat = (val: any, label: string) => (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.1 }}>{val}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: MUTED, letterSpacing: -0.6 }}>{label}</div>
    </div>
  );

  const private_ = (txt: string) => (
    <div style={{ textAlign: 'center', color: MUTED, fontWeight: 700, fontSize: 17, padding: '60px 30px' }}>{txt}</div>
  );

  return (
    <Wrap>
      <div style={{ position: 'relative', height: 260, background: bannerBg }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(0,0,0,.25),rgba(0,0,0,.05) 40%,rgba(18,18,18,.9))' }} />
        <BackBtn />
        {wp && rs && (
          <span style={{ position: 'absolute', right: 16, top: 'max(22px, env(safe-area-inset-top))', padding: '5px 14px', borderRadius: 99, background: 'rgba(30,30,34,.75)', color: rs.color, fontWeight: 800, fontSize: 17, border: '1px solid ' + rs.border, zIndex: 5 }}>{wp.rarity}</span>
        )}
      </div>

      <div style={{ marginTop: -78, display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 6 }}>
        <div style={{ padding: 6, borderRadius: '50%', background: '#121212' }}>
          <Avatar src={prof.photoURL} size={140} borderKey={prof.activeBorder} />
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: '12px 16px 0' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <PremiumName premium={verified} dev={dev} style={{ fontSize: 34, fontWeight: 800, letterSpacing: -1.2, wordBreak: 'break-word' }}>{name}</PremiumName>
          <span style={{ fontSize: 26, fontWeight: 800, color: MUTED }}>{shortUid}</span>
          {verified && <VerifiedBadge size={32} />}
          {dev && <DevBadge size={36} />}
        </div>
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center', gap: 10 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 99, background: tier.color + '33', color: tier.color, fontSize: 28, fontWeight: 800, letterSpacing: -0.8 }}>
            <span style={{ fontSize: 24 }}>{tier.icon}</span>Lvl. {level}
          </span>
          {prof.role && prof.role !== 'Member' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '10px 20px', borderRadius: 99, background: dev ? 'linear-gradient(90deg,#22d3ee,#818cf8,#e879f9)' : '#1a2236', color: dev ? '#0b0b14' : '#cbd5f0', fontSize: 22, fontWeight: 800 }}>{dev ? 'DEVELOPER' : prof.role}</span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', padding: '26px 8px 6px' }}>
        {stat(months === null ? '–' : months, 'bulan')}
        {stat(comments.length, 'komentar')}
        {stat(isMe ? history.length : '–', 'riwayat')}
        {stat(minutes, 'menit')}
      </div>

      {isMe && (
        <div style={{ display: 'flex', gap: 12, padding: '14px 14px 4px' }}>
          <Link href="/komikstore/pet" style={{ flex: 1, textAlign: 'center', padding: '16px 0', borderRadius: 99, border: '2px solid #2a3350', background: '#161b2b', color: '#fff', fontSize: 24, fontWeight: 800, letterSpacing: -0.7 }}>🐾 Peliharaan</Link>
          <Link href="/ranking" style={{ flex: 1, textAlign: 'center', padding: '16px 0', borderRadius: 99, border: '2px solid #2f3a7a', background: '#161a33', color: '#fff', fontSize: 24, fontWeight: 800, letterSpacing: -0.7 }}>🏆 Peringkat</Link>
        </div>
      )}

      <div style={{ display: 'flex', marginTop: 18, borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        {(['komentar', 'favorit', 'riwayat'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, background: 'none', border: 0, padding: '18px 0 14px', color: tab === t ? '#fff' : MUTED, fontSize: 28, fontWeight: 800, letterSpacing: -0.9, borderBottom: tab === t ? '4px solid ' + BLUE : '4px solid transparent', textTransform: 'capitalize' }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: '4px 14px 60px' }}>
        {tab === 'komentar' && (comments.length === 0
          ? private_('Belum ada komentar.')
          : comments.map((c: UserComment) => (
            <div key={c.id} style={{ padding: '18px 0 20px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar src={prof.photoURL} size={44} />
                <PremiumName premium={verified} dev={dev} style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.7 }}>{name}</PremiumName>
                <span style={{ marginLeft: 'auto', color: MUTED, fontSize: 18, fontWeight: 700 }}>• {c.waktu ? timeAgo(c.waktu) : ''}</span>
              </div>
              {c.chapterTitle ? <div style={{ marginTop: 12, color: '#cdd6ee', fontSize: 20, fontWeight: 800, letterSpacing: -0.4 }}>{c.chapterTitle}</div> : null}
              <div style={{ marginTop: 8, fontSize: 24, fontWeight: 700, letterSpacing: -0.4, lineHeight: 1.35, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{c.teks}</div>
            </div>
          )))}

        {tab === 'favorit' && (!isMe
          ? private_('Daftar favorit bersifat pribadi.')
          : favorites.length === 0
            ? private_('Belum ada favorit.')
            : favorites.map((f: any) => (
              <Link key={f.link} href={'/manga?url=' + encodeURIComponent(f.link)} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.thumb} alt="" referrerPolicy="no-referrer" style={{ width: 62, height: 84, borderRadius: 10, objectFit: 'cover', background: '#1a1d24' }} />
                <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>{f.title}</span>
              </Link>
            )))}

        {tab === 'riwayat' && (!isMe
          ? private_('Riwayat baca bersifat pribadi.')
          : history.length === 0
            ? private_('Belum ada riwayat.')
            : history.slice(0, 60).map((h: any) => (
              <Link key={h.chapterLink} href={'/chapter?url=' + encodeURIComponent(h.chapterLink) + '&thumb=' + encodeURIComponent(h.mangaThumb || '') + '&mangaTitle=' + encodeURIComponent(h.mangaTitle || '')} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={h.mangaThumb} alt="" referrerPolicy="no-referrer" style={{ width: 62, height: 84, borderRadius: 10, objectFit: 'cover', background: '#1a1d24' }} />
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>{h.mangaTitle}</span>
                  <span style={{ display: 'block', fontSize: 18, fontWeight: 700, color: MUTED, marginTop: 4 }}>Ch. {h.chapterNumber} · {h.totalPages ? Math.round((h.pageRead / h.totalPages) * 100) : 0}%</span>
                </span>
              </Link>
            )))}
      </div>
    </Wrap>
  );
}

export default function UserPage() {
  return (
    <Suspense fallback={null}>
      <UserContent />
    </Suspense>
  );
}
