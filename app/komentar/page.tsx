'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getFirebase } from '@/lib/leaderboard';
import { useMissions } from '@/lib/missions';
import { findLencana } from '@/lib/lencana';
import DevBadge from '@/components/DevBadge';
import PremiumName from '@/components/PremiumName';
import { isPremiumRole } from '@/lib/premium';
import VerifiedBadge from '@/components/VerifiedBadge';
import { LencanaIcon } from '@/components/LencanaBadge';
import WallpaperBg from '@/components/WallpaperBg';
import { WALLPAPER_CATALOG } from '@/lib/wallpapers';

const CORAL = '#FF6B6B';
const MUTED = '#8F8D9B';
const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const fmtDate = (t: number) => { const d = new Date(t); return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`; };

interface C {
  id: string; uid: string; nama: string; foto: string; role?: string; level?: number;
  teks: string; waktu: number; parentId?: string; lencana?: string; activeWallpaper?: string; likes?: Record<string, boolean>;
}

const Back = () => (
  <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 5l-7 7 7 7" /></svg>
);

function Avatar({ src, size, gold }: { src?: string; size: number; gold?: boolean }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', flex: `0 0 ${size}px`, width: size, height: size, borderRadius: '50%', padding: gold ? 2 : 0, background: gold ? 'linear-gradient(135deg,#F5C84B,#B8860B)' : 'transparent', boxSizing: 'border-box' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src || `https://placehold.co/${size}/2A2931/fff?text=?`} alt="" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', background: '#2A2931', border: gold ? '2px solid #1B1A20' : 0, boxSizing: 'border-box' }} />
    </span>
  );
}

function KomentarContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const url = sp.get('url') || '';
  const title = sp.get('title') || '';
  const ch = sp.get('ch') || '';
  const key = useMemo(() => url.replace(/[.#$[\]/]/g, '_').slice(-120), [url]);

  const [comments, setComments] = useState<C[]>([]);
  const [me, setMe] = useState<any>(null);
  const [meData, setMeData] = useState<any>(null);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<C | null>(null);
  const [menu, setMenu] = useState<C | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const dbRef = useRef<any>(null);
  const authRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const say = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2600); };

  useEffect(() => {
    if (!key) return;
    let off: (() => void) | null = null;
    (async () => {
      const { auth, db } = await getFirebase();
      authRef.current = auth; dbRef.current = db;
      auth.onAuthStateChanged(async (u: any) => {
        setMe(u);
        if (u) { try { setMeData((await db.ref(`users/${u.uid}`).get()).val()); } catch {} } else setMeData(null);
      });
      const ref = db.ref(`chapterComments/${key}`);
      const cb = (snap: any) => {
        const arr: C[] = [];
        snap.forEach((s: any) => { const v = s.val(); if (v?.teks) arr.push({ id: s.key, ...v }); });
        setComments(arr);
      };
      ref.on('value', cb);
      off = () => ref.off('value', cb);
    })();
    return () => { if (off) off(); };
  }, [key]);

  const { roots, repliesOf } = useMemo(() => {
    const roots = comments.filter((c) => !c.parentId).sort((a, b) => b.waktu - a.waktu);
    const repliesOf: Record<string, C[]> = {};
    comments.filter((c) => c.parentId).sort((a, b) => a.waktu - b.waktu).forEach((c) => { (repliesOf[c.parentId!] ||= []).push(c); });
    return { roots, repliesOf };
  }, [comments]);

  const login = async () => {
    try { await authRef.current.signInWithPopup(new window.firebase.auth.GoogleAuthProvider()); }
    catch (e: any) { say('Login gagal: ' + (e?.message || '')); }
  };

  const send = async () => {
    const t = text.trim();
    if (!t || busy) return;
    if (!me) { login(); return; }
    setBusy(true);
    try {
      const u = meData || {};
      await dbRef.current.ref(`chapterComments/${key}`).push({
        uid: me.uid,
        nama: u.displayName || me.displayName || 'User',
        foto: (u.photoURL ?? me.photoURL) || '',
        role: u.role || 'Member',
        level: Number(u.level) || 1,
        lencana: u.lencana || '',
        activeBorder: u.activeBorder || '',
        activeWallpaper: u.activeWallpaper || '',
        teks: t.slice(0, 300),
        waktu: Date.now(),
        chapterTitle: [title, ch && `Ch. ${ch}`].filter(Boolean).join(' · '),
        ...(replyTo ? { parentId: replyTo.parentId || replyTo.id } : {}),
      });
      useMissions.getState().addComment();
      setText(''); setReplyTo(null);
    } catch (e: any) { say('Gagal kirim: ' + (e?.message || 'coba lagi')); }
    finally { setBusy(false); }
  };

  const toggleLike = async (c: C) => {
    if (!me) { login(); return; }
    const ref = dbRef.current.ref(`chapterComments/${key}/${c.id}/likes/${me.uid}`);
    try { if (c.likes?.[me.uid]) await ref.remove(); else await ref.set(true); }
    catch (e: any) { say('Gagal menyukai: ' + (e?.message || 'izin database ditolak')); }
  };

  const hapus = async (c: C) => {
    setMenu(null);
    try {
      const ids = [c.id, ...(repliesOf[c.id] || []).map((r) => r.id)];
      await Promise.all(ids.map((id) => dbRef.current.ref(`chapterComments/${key}/${id}`).remove()));
      say('Komentar dihapus');
    } catch (e: any) { say('Gagal hapus: ' + (e?.message || '')); }
  };

  const laporkan = (c: C) => {
    setMenu(null);
    const msg = `Lapor komentar di ${title} Ch. ${ch}%0AID: ${c.id}%0APengirim: ${encodeURIComponent(c.nama)}%0AIsi: ${encodeURIComponent(c.teks.slice(0, 120))}`;
    window.open(`https://wa.me/6281315059849?text=${msg}`, '_blank');
  };

  const Row = ({ c, small }: { c: C; small?: boolean }) => {
    const lk = findLencana(c.lencana);
    const gold = c.role === 'Developer' || c.role === 'Wibu Premium' || c.role === 'Komikita Premium';
    const likes = Object.keys(c.likes || {}).length;
    const liked = !!(me && c.likes?.[me.uid]);
    const hasWp = !!(c.activeWallpaper && WALLPAPER_CATALOG[c.activeWallpaper]);
    return (
      <WallpaperBg
        wpKey={c.activeWallpaper}
        style={hasWp
          ? { display: 'flex', gap: 14, padding: small ? 12 : 14, marginTop: small ? 10 : 14, borderRadius: 18, border: '1px solid' }
          : { display: 'flex', gap: 14, padding: small ? '10px 0 0' : '16px 0 0' }}
      >
        <a href={`/user?uid=${c.uid}`} aria-label="Lihat profil" style={{ display: 'inline-flex', flex: '0 0 auto', alignSelf: 'flex-start' }}><Avatar src={c.foto} size={small ? 32 : 42} gold={gold} /></a>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', paddingRight: 28 }}>
            <a href={`/user?uid=${c.uid}`} style={{ color: 'inherit', textDecoration: 'none' }}><PremiumName premium={isPremiumRole(c.role)} dev={c.role === 'Developer'} style={{ fontSize: small ? 16 : 18, fontWeight: 800, letterSpacing: -0.5, wordBreak: 'break-word' }}>{c.nama}</PremiumName></a>
            {(c.role === 'Komikita Premium' || c.role === 'Wibu Premium') && <VerifiedBadge size={small ? 17 : 20} />}
            {c.role === 'Developer' && <DevBadge size={small ? 18 : 22} />}
            {lk && <LencanaIcon l={lk} size={small ? 22 : 28} />}
            <span style={{ fontSize: 15, fontWeight: 800, color: MUTED, letterSpacing: -0.3 }}>· {fmtDate(c.waktu)}</span>
          </div>
          <div style={{ fontSize: small ? 17 : 19, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.3, marginTop: 4, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{c.teks}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 26, marginTop: 8, color: MUTED }}>
            <button onClick={() => toggleLike(c)} style={{ background: 'none', border: 0, color: liked ? CORAL : MUTED, display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, fontWeight: 800, padding: '6px 0' }}>
              <svg width={22} height={22} viewBox="0 0 24 24" fill={liked ? CORAL : 'none'} stroke={liked ? CORAL : MUTED} strokeWidth={2} strokeLinejoin="round"><path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.600-7 10-7 10z" /></svg>{likes}
            </button>
            <button onClick={() => { setReplyTo(c); inputRef.current?.focus(); }} style={{ background: 'none', border: 0, color: MUTED, display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, fontWeight: 800, padding: '6px 0' }}>
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 14L4 9l5-5" /><path d="M4 9h9a7 7 0 017 7v2" /></svg>Balas
            </button>
          </div>
        </div>
        <button onClick={() => setMenu(c)} aria-label="Menu" style={{ background: 'none', border: 0, color: '#fff', alignSelf: 'flex-start', padding: '4px 8px', height: 32 }}>
          <svg width={20} height={20} viewBox="0 0 24 24" fill="#fff"><circle cx={12} cy={5} r={1.8} /><circle cx={12} cy={12} r={1.8} /><circle cx={12} cy={19} r={1.8} /></svg>
        </button>
      </WallpaperBg>
    );
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: '#1B1A20', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <style>{`button { font-family: inherit; cursor: pointer; } input { font-family: inherit; }`}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 'max(14px, env(safe-area-inset-top)) 12px 10px' }}>
        <button onClick={() => router.back()} aria-label="Kembali" style={{ background: 'none', border: 0, padding: 6, display: 'flex' }}><Back /></button>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 25, fontWeight: 800, letterSpacing: -0.9, lineHeight: 1.15 }}>Komentar · {comments.length}</div>
          <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: -0.6, color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}{ch ? ` · Ch. ${ch}` : ''}</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 14px 20px' }}>
        {roots.length === 0 ? (
          <div style={{ textAlign: 'center', color: MUTED, fontWeight: 800, fontSize: 18, padding: '90px 30px' }}>Belum ada komentar. Jadilah yang pertama!</div>
        ) : roots.map((c) => (
          <div key={c.id} style={{ paddingBottom: 14 }}>
            <Row c={c} />
            {(repliesOf[c.id] || []).length > 0 && (
              <div style={{ marginLeft: 56 }}>{repliesOf[c.id].map((r) => <Row key={r.id} c={r} small />)}</div>
            )}
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,.1)', background: '#1B1A20', padding: '10px 14px calc(12px + env(safe-area-inset-bottom, 0px))' }}>
        {replyTo && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: MUTED, fontSize: 15, fontWeight: 800, padding: '0 6px 8px' }}>
            <span>Membalas {replyTo.nama}</span>
            <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 0, color: CORAL, fontWeight: 800, fontSize: 15 }}>Batal</button>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar src={(meData?.photoURL ?? me?.photoURL) || ''} size={42} />
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#25242B', borderRadius: 99, padding: '0 8px 0 20px', height: 54 }}>
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onFocus={() => { if (!me && authRef.current) login(); }}
              onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
              maxLength={300}
              placeholder={me ? 'Tambah komentar…' : 'Masuk untuk berkomentar…'}
              style={{ flex: 1, minWidth: 0, background: 'none', border: 0, outline: 'none', color: '#fff', fontSize: 21, fontWeight: 800, letterSpacing: -0.6 }}
            />
            {text.trim() && (
              <button onClick={send} disabled={busy} aria-label="Kirim" style={{ width: 40, height: 40, borderRadius: '50%', background: CORAL, border: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: busy ? 0.6 : 1 }}>
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {menu && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 320, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div onClick={() => setMenu(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.55)' }} />
          <div style={{ position: 'relative', background: '#25242B', borderRadius: '24px 24px 0 0', padding: '12px 16px calc(20px + env(safe-area-inset-bottom, 0px))', width: 'min(100%, 448px)', margin: '0 auto' }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.2)', margin: '0 auto 12px' }} />
            {me && menu.uid === me.uid ? (
              <button onClick={() => hapus(menu)} style={{ width: '100%', textAlign: 'left', background: 'none', border: 0, color: CORAL, fontSize: 20, fontWeight: 800, padding: '14px 8px' }}>Hapus komentar</button>
            ) : (
              <button onClick={() => laporkan(menu)} style={{ width: '100%', textAlign: 'left', background: 'none', border: 0, color: '#fff', fontSize: 20, fontWeight: 800, padding: '14px 8px' }}>Laporkan komentar</button>
            )}
            <button onClick={() => setMenu(null)} style={{ width: '100%', textAlign: 'left', background: 'none', border: 0, color: MUTED, fontSize: 20, fontWeight: 800, padding: '14px 8px' }}>Batal</button>
          </div>
        </div>
      )}

      {toast && <div style={{ position: 'fixed', left: '50%', bottom: 100, transform: 'translateX(-50%)', background: '#2A2931', color: '#fff', padding: '10px 18px', borderRadius: 99, fontSize: 15, fontWeight: 800, zIndex: 330, maxWidth: '86%', textAlign: 'center' }}>{toast}</div>}
    </div>
  );
}

export default function KomentarPage() {
  return <Suspense fallback={null}><KomentarContent /></Suspense>;
}
