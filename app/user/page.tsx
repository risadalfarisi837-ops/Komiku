'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PawPrint, Trophy } from 'lucide-react';
import { findLencana, TRACK_COLOR } from '@/lib/lencana';
import { numericId } from '@/lib/utils';
import { RANKS } from '@/lib/season';
import { getFirebase } from '@/lib/leaderboard';
import { useFavorites, useHistory } from '@/lib/store';
import { WALLPAPER_CATALOG, RARITY_STYLE, wpBg } from '@/lib/wallpapers';
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

const FIELDS = ['displayName', 'photoURL', 'level', 'role', 'joinedAt', 'menitMenonton', 'activeBorder', 'activeWallpaper', 'premiumUntil', 'lencana'];

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

function Shield({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="rgba(255,255,255,.55)" strokeWidth={1.4} strokeLinejoin="round">
      <path d="M12 2.5l8 3v6c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10v-6l8-3z" />
    </svg>
  );
}

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
    <button onClick={back} aria-label="Kembali" style={{ position: 'absolute', left: 10, top: 'max(12px, env(safe-area-inset-top))', background: 'rgba(0,0,0,.3)', border: 0, borderRadius: 99, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 5l-7 7 7 7" /></svg>
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
  const bannerBg = wp ? wpBg(prof.activeWallpaper, true) : 'linear-gradient(160deg,#1c2133,#0b0c10)';
  const pu = Number(prof.premiumUntil) || 0;
  const verified = isPremiumRole(prof.role) && (!pu || pu > Date.now());
  const dev = prof.role === 'Developer';
  const joined = Number(prof.joinedAt) || 0;
  const months = joined ? Math.max(0, Math.floor((Date.now() - joined) / (30.44 * 86400000))) : null;
  const minutes = Number(prof.menitMenonton) || 0;
  const shortUid = numericId(uid);
  const name = prof.displayName || 'User';
  const lk = findLencana(prof.lencana);
  const lkBg = (lk && ((RANKS as any[]).find((r) => r.name === lk.name)?.bg || TRACK_COLOR[lk.track])) || '#334155';

  const stat = (val: any, label: string) => (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.8, lineHeight: 1.1 }}>{val}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: MUTED, marginTop: 2 }}>{label}</div>
    </div>
  );

  const private_ = (txt: string) => (
    <div style={{ textAlign: 'center', color: MUTED, fontWeight: 700, fontSize: 15, padding: '48px 30px' }}>{txt}</div>
  );

  return (
    <Wrap>
      <div style={{ position: 'relative', height: 250, background: bannerBg }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(0,0,0,.25),rgba(0,0,0,.05) 40%,rgba(18,18,18,.9))' }} />
        <BackBtn />
        {wp && rs && (
          <span style={{ position: 'absolute', right: 14, top: 'max(16px, env(safe-area-inset-top))', padding: '3px 11px', borderRadius: 99, background: 'rgba(30,30,34,.75)', color: rs.color, fontWeight: 800, fontSize: 13, border: '1px solid ' + rs.border, zIndex: 5 }}>{wp.rarity}</span>
        )}
      </div>

      <div style={{ marginTop: -114, display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 6 }}>
        <div style={{ borderRadius: '50%', boxShadow: '0 4px 18px rgba(0,0,0,.45)' }}>
          <Avatar src={prof.photoURL} size={108} borderKey={prof.activeBorder} />
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: '18px 16px 0' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <PremiumName premium={verified} dev={dev} style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.8, wordBreak: 'break-word' }}>{name}</PremiumName>
          <span style={{ fontSize: 17, fontWeight: 800, color: MUTED }}>{shortUid}</span>
          {verified && <VerifiedBadge size={22} />}
          {dev && <DevBadge size={26} />}
        </div>
        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center', gap: 8 }}>
          {lk && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 14px 3px 5px', borderRadius: 99, background: lkBg, fontSize: 16, fontWeight: 800, letterSpacing: -0.3 }}>
              <Shield color={lkBg} size={20} />{lk.name}
            </span>
          )}
          {prof.role && prof.role !== 'Member' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 13px', borderRadius: 99, background: dev ? 'linear-gradient(90deg,#22d3ee,#818cf8,#e879f9)' : '#1a2236', color: dev ? '#0b0b14' : '#cbd5f0', fontSize: 14, fontWeight: 800 }}>{dev ? 'DEVELOPER' : prof.role}</span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', padding: '18px 8px 4px' }}>
        {stat(months === null ? '–' : months, 'bulan')}
        {stat(comments.length, 'komentar')}
        {stat(isMe ? history.length : '–', 'riwayat')}
        {stat(minutes, 'menit')}
      </div>

      {isMe && (
        <div style={{ display: 'flex', gap: 10, padding: '12px 14px 2px' }}>
          <Link href="/komikstore/pet" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 0', borderRadius: 99, border: '1.5px solid #2a3350', background: '#161b2b', color: '#fff', fontSize: 17, fontWeight: 800 }}><PawPrint size={18} /> Peliharaan</Link>
          <Link href="/ranking" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 0', borderRadius: 99, border: '1.5px solid #2f3a7a', background: '#161a33', color: '#fff', fontSize: 17, fontWeight: 800 }}><Trophy size={18} color="#fbbf24" /> Peringkat</Link>
        </div>
      )}

      <div style={{ display: 'flex', marginTop: 12, borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        {(['komentar', 'favorit', 'riwayat'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, background: 'none', border: 0, padding: '12px 0 0', color: tab === t ? '#fff' : MUTED, fontSize: 18, fontWeight: 800, textTransform: 'capitalize' }}>
            <span style={{ display: 'inline-block', padding: '0 2px 9px', borderBottom: '3px solid ' + (tab === t ? BLUE : 'transparent') }}>{t}</span>
          </button>
        ))}
      </div>

      <div style={{ padding: '2px 14px 60px' }}>
        {tab === 'komentar' && (comments.length === 0
          ? private_('Belum ada komentar.')
          : comments.map((c: UserComment) => (
            <div key={c.id} style={{ padding: '14px 0 16px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar src={prof.photoURL} size={34} />
                <PremiumName premium={verified} dev={dev} style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3 }}>{name}</PremiumName>
                <span style={{ marginLeft: 'auto', color: MUTED, fontSize: 13, fontWeight: 700 }}>• {c.waktu ? timeAgo(c.waktu) : ''}</span>
              </div>
              {c.chapterTitle ? <div style={{ marginTop: 8, color: '#cdd6ee', fontSize: 14, fontWeight: 800 }}>{c.chapterTitle}</div> : null}
              <div style={{ marginTop: 6, fontSize: 16, fontWeight: 600, lineHeight: 1.4, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{c.teks}</div>
            </div>
          )))}

        {tab === 'favorit' && (!isMe
          ? private_('Daftar favorit bersifat pribadi.')
          : favorites.length === 0
            ? private_('Belum ada favorit.')
            : favorites.map((f: any) => (
              <Link key={f.link} href={'/manga?url=' + encodeURIComponent(f.link)} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.thumb} alt="" referrerPolicy="no-referrer" style={{ width: 48, height: 66, borderRadius: 8, objectFit: 'cover', background: '#1a1d24' }} />
                <span style={{ fontSize: 16, fontWeight: 800 }}>{f.title}</span>
              </Link>
            )))}

        {tab === 'riwayat' && (!isMe
          ? private_('Riwayat baca bersifat pribadi.')
          : history.length === 0
            ? private_('Belum ada riwayat.')
            : history.slice(0, 60).map((h: any) => (
              <Link key={h.chapterLink} href={'/chapter?url=' + encodeURIComponent(h.chapterLink) + '&thumb=' + encodeURIComponent(h.mangaThumb || '') + '&mangaTitle=' + encodeURIComponent(h.mangaTitle || '')} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={h.mangaThumb} alt="" referrerPolicy="no-referrer" style={{ width: 48, height: 66, borderRadius: 8, objectFit: 'cover', background: '#1a1d24' }} />
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 16, fontWeight: 800 }}>{h.mangaTitle}</span>
                  <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: MUTED, marginTop: 3 }}>Ch. {h.chapterNumber} · {h.totalPages ? Math.round((h.pageRead / h.totalPages) * 100) : 0}%</span>
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
