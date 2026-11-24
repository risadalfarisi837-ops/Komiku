'use client';

import { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import WallpaperBg from '@/components/WallpaperBg';
import { numericId } from '@/lib/utils';
import DevBadge from '@/components/DevBadge';
import PremiumName from '@/components/PremiumName';
import VerifiedBadge from '@/components/VerifiedBadge';
import { isPremiumRole } from '@/lib/premium';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, ChevronLeft, Heart, Send, ArrowLeft, Share2, MoreVertical, Bookmark, MessageSquare, Download, BookOpen, Search, ArrowUpDown, Star, X } from 'lucide-react';
import Link from 'next/link';
import { useFavorites, useHistory } from '@/lib/store';
import { getFirebase } from '@/lib/firebase-client';

// ─── Rank System (sama persis animeku) ───────────────────────────────────────
const RANK_TIERS = [
  { name: 'Stone',   minLvl: 0,     maxLvl: 49,       color: '#9ca3af', icon: '🌑' },
  { name: 'Bronze',  minLvl: 50,    maxLvl: 149,      color: '#cd7f32', icon: '🥉' },
  { name: 'Silver',  minLvl: 150,   maxLvl: 499,      color: '#bdc3c7', icon: '🥈' },
  { name: 'Gold',    minLvl: 500,   maxLvl: 2499,     color: '#f1c40f', icon: '🥇' },
  { name: 'Emerald', minLvl: 2500,  maxLvl: 4999,     color: '#2ecc71', icon: '🔮' },
  { name: 'Diamond', minLvl: 5000,  maxLvl: 9999,     color: '#3498db', icon: '💎' },
  { name: 'Master',  minLvl: 10000, maxLvl: 19999,    color: '#9b59b6', icon: '👑' },
  { name: 'Mythic',  minLvl: 20000, maxLvl: Infinity,  color: '#ef4444', icon: '🌟' },
];
function getRankInfo(level: number) {
  return RANK_TIERS.find(r => level >= r.minLvl && level <= r.maxLvl) || RANK_TIERS[0];
}
function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Baru saja';
  if (m < 60) return `${m}m lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}j lalu`;
  return `${Math.floor(h / 24)}h lalu`;
}
function getShortUid(uid: string) { return numericId(uid); }

// ─── Border Catalog ───────────────────────────────────────────────────────────
const BORDER_CATALOG: Record<string, string> = {
  'glitch_merah':    'https://cdn.discordapp.com/media/v1/collectibles-shop/1436367668897775757/animated',
  'blue_premium':    'https://cdn.discordapp.com/media/v1/collectibles-shop/1373015260507930664/animated',
  'phoenix':         'https://cdn.discordapp.com/media/v1/collectibles-shop/1298033986622328842/animated',
  'venom':           'https://cdn.discordapp.com/media/v1/collectibles-shop/1481388474673139855/animated',
  'black-mana':      'https://cdn.discordapp.com/media/v1/collectibles-shop/1379220459026911342/animated',
  'the-haxcore':     'https://cdn.discordapp.com/media/v1/collectibles-shop/1303490165171294268/animated',
  'fishbones':       'https://cdn.discordapp.com/media/v1/collectibles-shop/1303490165150322698/animated',
  'hologram-dragon': 'https://cdn.discordapp.com/media/v1/collectibles-shop/1366494385583165630/animated',
  'dark-hood':       'https://cdn.discordapp.com/media/v1/collectibles-shop/1287835633615765524/animated',
  'spider-man':      'https://cdn.discordapp.com/media/v1/collectibles-shop/1481384635886862397/animated',
  'purple-animation':'https://cdn.discordapp.com/media/v1/collectibles-shop/1303490165192265799/animated',
};

// ─── Avatar with animated border ─────────────────────────────────────────────
function AvatarWithBorder({ src, size, borderKey }: { src: string; size: number; borderKey?: string }) {
  const borderUrl = borderKey ? BORDER_CATALOG[borderKey] : '';
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <img
        src={src || `https://placehold.co/${size}/1a1d24/fff?text=?`}
        alt=""
        className="w-full h-full rounded-full object-cover"
        referrerPolicy="no-referrer"
      />
      {borderUrl && (
        <div
          className="absolute pointer-events-none"
          style={{
            top: '50%', left: '50%',
            width: '130%', height: '130%',
            transform: 'translate(-50%,-50%)',
            backgroundImage: `url('${borderUrl}')`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            zIndex: 10,
          }}
        />
      )}
    </div>
  );
}

// ─── Level Badge ──────────────────────────────────────────────────────────────
function LevelBadge({ level }: { level: number }) {
  const rank = getRankInfo(level);
  const isShimmer = rank.name === 'Diamond' || rank.name === 'Mythic';
  const shimmerBg = rank.name === 'Diamond'
    ? 'linear-gradient(90deg,#9ca3af,#06b6d4,#9ca3af)'
    : 'linear-gradient(90deg,#2A2931,#2a2d35,#2A2931)';

  return (
    <span
      className="text-[10px] font-black px-2 py-0.5 rounded-full border"
      style={isShimmer ? {
        background: shimmerBg,
        backgroundSize: '200% 100%',
        animation: 'shimmerBadge 3s infinite linear',
        color: '#fff',
        border: 'none',
      } : {
        background: `${rank.color}22`,
        color: rank.color,
        borderColor: `${rank.color}44`,
      }}
    >
      {rank.icon} Lvl. {level}
    </span>
  );
}

// ─── Role Badge ───────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string; level?: number }) {
  if (role === 'Developer') return <DevBadge size={16} />;
  return isPremiumRole(role) ? <VerifiedBadge size={15} /> : null;
}

// ─── Comment Item ─────────────────────────────────────────────────────────────
interface CommentData {
  id: string; uid: string; nama: string; foto: string;
  role: string; level: number; teks: string; waktu: number; activeBorder?: string; activeWallpaper?: string;
}

function CommentItem({ c, currentUid, onDelete }: { c: CommentData; currentUid: string | null; onDelete: (id: string) => void }) {
  const isMine = currentUid === c.uid;
  const timerRef = useRef<any>(null);
  const start = () => { if (!isMine) return; timerRef.current = setTimeout(() => onDelete(c.id), 650); };
  const stop  = () => { if (timerRef.current) clearTimeout(timerRef.current); };

  return (
    <WallpaperBg wpKey={c.activeWallpaper}
      onMouseDown={start} onMouseUp={stop} onMouseLeave={stop}
      onTouchStart={start} onTouchEnd={stop} onTouchMove={stop}
      className="flex gap-3 p-3 rounded-2xl border border-white/5 bg-[#1B1A20]/60 mb-3 select-none"
    >
      <a href={`/user?uid=${c.uid}`} aria-label="Lihat profil" onClick={(e) => e.stopPropagation()} style={{ display: 'inline-flex', flex: '0 0 auto' }}><AvatarWithBorder src={c.foto} size={38} borderKey={c.activeBorder} /></a>
      <div className="flex-1 min-w-0">
        {/* Name + time */}
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <PremiumName premium={isPremiumRole(c.role)} dev={c.role === 'Developer'} className="text-[13px] font-bold text-white truncate max-w-[130px]">{c.nama}</PremiumName>
          <RoleBadge role={c.role} />
          <span className="text-[11px] text-gray-500">• {timeAgo(c.waktu)}</span>
          {isMine && <span className="text-[10px] text-gray-400 font-bold ml-auto opacity-60">Tahan hapus</span>}
        </div>
        {/* Text */}
        <p className="text-[13px] text-gray-200 leading-relaxed">{c.teks}</p>
      </div>
    </WallpaperBg>
  );
}

// ─── Reviews Tab ──────────────────────────────────────────────────────────────
function ReviewsTab({ mangaUrl, mangaTitle }: { mangaUrl: string; mangaTitle: string }) {
  const [comments, setComments]     = useState<CommentData[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userData, setUserData]     = useState<any>(null);
  const [text, setText]             = useState('');
  const [posting, setPosting]       = useState(false);
  const [fbReady, setFbReady]       = useState(false);
  const dbRef   = useRef<any>(null);
  const authRef = useRef<any>(null);

  // Firebase key: sanitize url
  const mangaKey = mangaUrl.replace(/[.#$[\]/]/g, '_').slice(-120);

  useEffect(() => {
    getFirebase().then(({ auth, db }) => {
      authRef.current = auth;
      dbRef.current   = db;
      setFbReady(true);

      auth.onAuthStateChanged(async (u: any) => {
        setCurrentUser(u);
        if (u) {
          const snap = await db.ref(`users/${u.uid}`).get();
          if (snap.exists()) setUserData(snap.val());
          else setUserData(null);
        } else {
          setUserData(null);
        }
      });

      db.ref(`mangaComments/${mangaKey}`).on('value', (snap: any) => {
        if (!snap.exists()) { setComments([]); return; }
        const arr: CommentData[] = [];
        snap.forEach((c: any) => {
          if (c.val() && c.val().teks) arr.push({ id: c.key, ...c.val() });
        });
        setComments(arr.sort((a, b) => b.waktu - a.waktu));
      });
    });
    return () => {
      if (dbRef.current) dbRef.current.ref(`mangaComments/${mangaKey}`).off();
    };
  }, [mangaKey]);

  const post = async () => {
    if (!text.trim() || !currentUser || !dbRef.current || posting) return;
    setPosting(true);
    try {
      const u = userData || {};
      const newComment = {
        uid: currentUser.uid,
        nama: u.displayName || currentUser.displayName || 'User',
        foto: u.photoURL   || currentUser.photoURL    || '',
        role: u.role       || 'Member',
        level: Number(u.level) || 1,
        activeBorder: u.activeBorder || '',
        activeWallpaper: u.activeWallpaper || '',
        teks: text.trim(),
        waktu: Date.now(),
        mangaTitle,
      };
      await dbRef.current.ref(`mangaComments/${mangaKey}`).push(newComment);
      setText('');
    } catch (e: any) {
      alert('Gagal kirim komentar: ' + (e?.message || 'Unknown error'));
    } finally { setPosting(false); }
  };

  const deleteComment = async (id: string) => {
    if (!currentUser || !dbRef.current) return;
    if (!window.confirm('Hapus komentar ini?')) return;
    try {
      await dbRef.current.ref(`mangaComments/${mangaKey}/${id}`).remove();
    } catch (e: any) {
      alert('Gagal hapus: ' + (e?.message || 'Unknown error'));
    }
  };

  const login = async () => {
    if (!authRef.current) return;
    try {
      const p = new window.firebase.auth.GoogleAuthProvider();
      await authRef.current.signInWithPopup(p);
    } catch (e: any) { alert('Login gagal: ' + e.message); }
  };

  if (!fbReady) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>;

  return (
    <div>
      {/* shimmer keyframe */}
      <style>{`@keyframes shimmerBadge{0%{background-position:100% 0}100%{background-position:-100% 0}}`}</style>

      <p className="text-xs text-gray-500 font-bold mb-4">{comments.length} Komentar</p>

      {/* Input - selalu tampil dengan avatar, kalau belum login klik trigger login */}
      <div className="flex gap-3 mb-5 items-center">
        <AvatarWithBorder
          src={currentUser?.photoURL || ''}
          size={36}
          borderKey={userData?.activeBorder}
        />
        {currentUser ? (
          <div className="flex-1 flex items-center gap-2 bg-[#1B1A20] border border-white/10 rounded-2xl px-4 pr-2 py-2">
            <input
              type="text" value={text} onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') post(); }}
              placeholder="Tulis komentar..." maxLength={300}
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder-gray-600"
            />
            <button onClick={post} disabled={!text.trim() || posting}
              className="w-8 h-8 rounded-xl bg-[#2A2931] flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform flex-shrink-0">
              {posting ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
            </button>
          </div>
        ) : (
          <button onClick={login}
            className="flex-1 flex items-center gap-2 bg-[#1B1A20] border border-white/10 rounded-2xl px-4 pr-3 py-2.5 active:scale-95 transition-transform">
            <span className="flex-1 text-sm text-gray-600 text-left">Tulis komentar...</span>
            <Send className="w-4 h-4 text-gray-700 flex-shrink-0" />
          </button>
        )}
      </div>

      {/* List */}
      {comments.length === 0
        ? <p className="text-center text-gray-600 text-sm py-8">Belum ada komentar. Jadilah yang pertama!</p>
        : comments.map(c => (
            <CommentItem key={c.id} c={c} currentUid={currentUser?.uid ?? null} onDelete={deleteComment} />
          ))
      }
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────
const CORAL = '#FF6B6B';
const STATUS_INFO: Record<string, { label: string; color: string }> = {
  ongoing:   { label: 'Berlanjut',  color: '#34D399' },
  hiatus:    { label: 'Hiatus',     color: '#FB923C' },
  completed: { label: 'Tamat',      color: '#60A5FA' },
  cancelled: { label: 'Dibatalkan', color: '#F87171' },
};
function fmtCount(n?: number | null) {
  if (n == null) return '-';
  const f = (v: number, s: string) => v.toFixed(1).replace('.', ',').replace(/,0$/, '') + ' ' + s;
  if (n >= 1_000_000) return f(n / 1_000_000, 'jt');
  if (n >= 1_000) return f(n / 1_000, 'rb');
  return String(n);
}
function fmtDate(iso?: string) {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return ''; }
}
const isNewChapter = (iso?: string) => !!iso && Date.now() - new Date(iso).getTime() < 3 * 86400000;
const chNumOf = (title: string) => (title.match(/chapter\s*([\d.]+)/i)?.[1]) || '';

function MangaDetailContent() {
  const searchParams = useSearchParams();
  const url = searchParams.get('url');
  const router = useRouter();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { history } = useHistory();

  const [detail, setDetail]           = useState<any>(null);
  const [loading, setLoading]         = useState(!!url);
  const [error, setError]             = useState<string | null>(url ? null : 'URL tidak valid');
  const [officialUrl, setOfficialUrl] = useState<string | null>(null);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [mounted, setMounted]         = useState(false);
  const [scrolled, setScrolled]       = useState(false);
  const [newestFirst, setNewestFirst] = useState(true);
  const [searchOpen, setSearchOpen]   = useState(false);
  const [chQuery, setChQuery]         = useState('');
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [menuOpen, setMenuOpen]       = useState(false);
  const [toast, setToast]             = useState('');

  const lastRead = history.find(h => h.mangaLink === url);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 300);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!url) return;
    (async () => {
      try {
        const res  = await fetch(`/api/manga/detail?url=${encodeURIComponent(url as string)}`);
        const json = await res.json();
        if (json.success) setDetail(json.data);
        else { setError(json.message || 'Gagal memuat detail manga'); if (json.officialUrl) setOfficialUrl(json.officialUrl); }
      } catch (e: any) { setError(e.message || 'Terjadi kesalahan sistem'); }
      finally { setLoading(false); }
    })();
  }, [url]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  if (loading) return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-[#1B1A20] gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-gray-300" />
      <p className="text-gray-500 text-sm">Memuat detail manga...</p>
    </div>
  );
  if (error || !detail) return (
    <div className="px-6 py-20 text-center bg-[#1B1A20] min-h-screen">
      <p className="text-gray-400 mb-4">{error || 'Manga tidak ditemukan'}</p>
      {officialUrl && (
        <a href={officialUrl} target="_blank" rel="noopener noreferrer" className="inline-block mr-2 px-6 py-2 bg-[#2A2931] text-white rounded-full">Buka situs resmi</a>
      )}
      <button onClick={() => router.back()} className="px-6 py-2 bg-[#2A2931] text-white rounded-full">Kembali</button>
    </div>
  );

  const isFav = mounted && isFavorite(url as string);
  const chapters: any[] = detail.chapters || [];
  const status = STATUS_INFO[detail.status || ''] || null;
  const mangaHref = (link: string) =>
    `/chapter?url=${encodeURIComponent(link)}&thumb=${encodeURIComponent(detail.thumb || '')}&mangaTitle=${encodeURIComponent(detail.title || '')}`;

  const firstChapter = chapters[chapters.length - 1];
  const resumeChapter = lastRead ? chapters.find(ch => ch.link === lastRead.chapterLink) : null;
  const target = resumeChapter || firstChapter;
  const targetNum = chNumOf(target?.title || '') || target?.num || '';
  const youAt = resumeChapter ? (chNumOf(resumeChapter.title) || resumeChapter.num || '') : '';

  const q = chQuery.trim().toLowerCase();
  let list = q ? chapters.filter(ch => ch.title.toLowerCase().includes(q)) : chapters;
  if (!newestFirst) list = [...list].reverse();

  const share = async () => {
    const data = { title: detail.title, url: typeof window !== 'undefined' ? window.location.href : '' };
    try {
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(data.url); setToast('Link disalin'); }
    } catch {}
  };

  const circleBtn = 'w-12 h-12 rounded-full bg-black/45 backdrop-blur-md flex items-center justify-center border border-white/10 active:scale-95 transition-transform';

  return (
    <div className="bg-[#1B1A20] min-h-screen text-white max-w-md mx-auto relative pb-16">
      {/* Hero background */}
      <div className="absolute top-0 inset-x-0 h-[470px] overflow-hidden z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={detail.thumb} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover scale-125 blur-[3px] opacity-80" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(27,26,32,.15) 0%, rgba(27,26,32,.55) 55%, #1B1A20 100%)' }} />
      </div>

      {/* Floating buttons (di atas hero) */}
      <div className={'absolute top-4 inset-x-4 z-20 flex items-center justify-between transition-opacity ' + (scrolled ? 'opacity-0 pointer-events-none' : 'opacity-100')}>
        <button onClick={() => router.back()} aria-label="Kembali" className={circleBtn}><ArrowLeft className="w-6 h-6" /></button>
        <div className="flex gap-2">
          <button onClick={share} aria-label="Bagikan" className={circleBtn}><Share2 className="w-5 h-5" /></button>
          <button onClick={() => setMenuOpen(v => !v)} aria-label="Menu" className={circleBtn}><MoreVertical className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Bar atas saat di-scroll */}
      <div className={'fixed top-0 inset-x-0 z-30 max-w-md mx-auto flex items-center gap-3 px-4 py-3 bg-[#1B1A20]/95 backdrop-blur-md transition-opacity ' + (scrolled ? 'opacity-100' : 'opacity-0 pointer-events-none')}>
        <button onClick={() => router.back()} aria-label="Kembali" className="p-2"><ArrowLeft className="w-6 h-6" /></button>
        <h2 className="flex-1 text-2xl font-extrabold tracking-tight truncate">{detail.title}</h2>
        <button onClick={share} aria-label="Bagikan" className="p-2"><Share2 className="w-5 h-5" /></button>
        <button onClick={() => setMenuOpen(v => !v)} aria-label="Menu" className="p-2"><MoreVertical className="w-5 h-5" /></button>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)}>
          <div className="absolute right-4 top-16 w-56 rounded-2xl bg-[#2A2931] border border-white/10 shadow-2xl overflow-hidden max-w-md" onClick={e => e.stopPropagation()}>
            <a href={url as string} target="_blank" rel="noopener noreferrer" className="block px-4 py-3.5 text-base font-bold">Buka di MangaDex</a>
          </div>
        </div>
      )}

      <div className="relative z-10 px-5 pt-[120px]">
        {/* Cover + judul */}
        <div className="flex gap-4 items-end">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={detail.thumb} alt={detail.title} referrerPolicy="no-referrer" className="w-[148px] h-[220px] rounded-2xl object-cover shrink-0 shadow-2xl bg-[#2A2931]" />
          <div className="min-w-0 pb-1">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="px-3 py-1 rounded-lg bg-black text-white text-base font-extrabold">{detail.type || 'Manga'}</span>
              {status && (
                <span className="px-3 py-1 rounded-lg text-base font-extrabold flex items-center gap-1.5" style={{ background: 'rgba(120,60,50,.55)', color: status.color }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: status.color }} />{status.label}
                </span>
              )}
            </div>
            <h1 className="text-[32px] leading-[1.05] font-extrabold tracking-tight line-clamp-4">{detail.title}</h1>
            {detail.nativeTitle && <p className="mt-2 text-lg font-bold text-white/50 truncate">{detail.nativeTitle}</p>}
          </div>
        </div>

        {/* Statistik */}
        <div className="mt-6 flex items-stretch rounded-3xl bg-[#2A2931] py-4">
          <div className="flex-1 text-center">
            <p className="text-3xl font-extrabold flex items-center justify-center gap-1.5"><Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />{detail.rating != null ? String(detail.rating).replace('.', ',') : '-'}</p>
            <p className="text-lg font-bold text-white/50">Rating</p>
          </div>
          <div className="w-px bg-white/10" />
          <div className="flex-1 text-center">
            <p className="text-3xl font-extrabold">{fmtCount(detail.follows)}</p>
            <p className="text-lg font-bold text-white/50">Disimpan</p>
          </div>
          <div className="w-px bg-white/10" />
          <div className="flex-1 text-center">
            <p className="text-3xl font-extrabold">{chapters.length}</p>
            <p className="text-lg font-bold text-white/50">Chapter</p>
          </div>
        </div>

        {/* Aksi */}
        <div className="mt-5 flex items-center gap-3">
          {target ? (
            <Link href={mangaHref(target.link)} className="flex-1 h-16 rounded-full flex items-center justify-center gap-3 text-xl font-extrabold text-white active:scale-95 transition-transform" style={{ background: CORAL }}>
              <BookOpen className="w-6 h-6" />{resumeChapter ? `Lanjutkan Ch. ${targetNum}` : `Mulai Ch. ${targetNum || 1}`}
            </Link>
          ) : <div className="flex-1" />}
          <button
            onClick={() => toggleFavorite({ title: detail.title, link: url as string, thumb: detail.thumb, desc: detail.synopsis?.slice(0, 50) })}
            aria-label="Simpan" className="w-12 h-12 flex items-center justify-center"
          ><Bookmark className="w-7 h-7" style={{ color: CORAL, fill: isFav ? CORAL : 'transparent' }} /></button>
          <button onClick={() => setCommentsOpen(true)} aria-label="Komentar" className="w-12 h-12 flex items-center justify-center"><MessageSquare className="w-7 h-7" /></button>
          <button onClick={() => setToast('Fitur unduh segera hadir')} aria-label="Unduh" className="w-12 h-12 flex items-center justify-center"><Download className="w-7 h-7" /></button>
        </div>

        {/* Sinopsis */}
        <p className={'mt-6 text-[22px] leading-snug font-extrabold tracking-tight ' + (isDescExpanded ? '' : 'line-clamp-3')}>{detail.synopsis}</p>
        {detail.synopsis && detail.synopsis.length > 120 && (
          <button onClick={() => setIsDescExpanded(v => !v)} className="mt-1 text-xl font-extrabold" style={{ color: CORAL }}>{isDescExpanded ? 'Sembunyikan' : 'Selengkapnya'}</button>
        )}

        {/* Genre */}
        {detail.genres?.length > 0 && (
          <div className="mt-5 -mx-5 px-5 flex gap-3 overflow-x-auto no-scrollbar">
            {detail.genres.map((g: string) => (
              <span key={g} className="shrink-0 px-5 py-2.5 rounded-full text-xl font-extrabold" style={{ background: 'rgba(255,107,107,.16)' }}>{g}</span>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="mt-7 grid grid-cols-[auto_1fr] gap-x-8 gap-y-3 text-xl">
          {detail.author && (<><span className="font-bold text-white/45">Penulis</span><span className="font-extrabold">{detail.author}</span></>)}
          {detail.artist && (<><span className="font-bold text-white/45">Ilustrator</span><span className="font-extrabold">{detail.artist}</span></>)}
          <span className="font-bold text-white/45">Format</span><span className="font-extrabold">{detail.type || 'Manga'}</span>
        </div>

        {/* Header chapter (sticky) */}
        <div className="sticky top-[60px] z-20 bg-[#1B1A20] -mx-5 px-5 pt-8 pb-3 mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[34px] font-extrabold tracking-tight">Chapter <span className="text-white/45 text-3xl">· {chapters.length}</span></h3>
            <div className="flex items-center gap-2">
              <button onClick={() => { setSearchOpen(v => !v); setChQuery(''); }} aria-label="Cari chapter" className="w-11 h-11 flex items-center justify-center"><Search className="w-6 h-6" /></button>
              <button onClick={() => setNewestFirst(v => !v)} aria-label="Urutkan" className="w-11 h-11 flex items-center justify-center"><ArrowUpDown className="w-6 h-6" /></button>
            </div>
          </div>
          {searchOpen ? (
            <input autoFocus value={chQuery} onChange={e => setChQuery(e.target.value)} placeholder="Cari nomor chapter..." className="mt-2 w-full rounded-full bg-[#2A2931] px-5 py-3 text-lg font-bold outline-none placeholder-white/30" />
          ) : (
            <p className="mt-1 text-xl font-bold text-white/45">{newestFirst ? 'Terbaru dulu' : 'Terlama dulu'}{youAt ? ` · kamu di Ch. ${youAt}` : ''}</p>
          )}
        </div>

        {/* Daftar chapter */}
        <div className="pt-2">
          {list.length === 0 ? (
            <p className="text-white/40 text-lg font-bold py-8 text-center">Chapter tidak ditemukan.</p>
          ) : list.map((ch, i) => {
            const isRead = history.some(h => h.chapterLink === ch.link);
            const num = chNumOf(ch.title) || ch.num;
            const pos = ['top', 'center', 'bottom'][i % 3];
            return (
              <Link key={ch.link} href={mangaHref(ch.link)} className={'flex items-center gap-4 py-2.5 ' + (isRead ? 'opacity-55' : '')}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={detail.thumb} alt="" referrerPolicy="no-referrer" loading="lazy" className="w-[68px] h-[68px] rounded-2xl object-cover shrink-0 bg-[#2A2931]" style={{ objectPosition: pos }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[28px] leading-tight font-extrabold tracking-tight truncate">{num ? `Ch. ${num}` : ch.title}</p>
                    {isNewChapter(ch.at) && <span className="shrink-0 px-2.5 py-0.5 rounded-md text-base font-extrabold text-white" style={{ background: CORAL }}>BARU</span>}
                  </div>
                  <p className="text-xl font-bold text-white/45 truncate">{fmtDate(ch.at) || ch.date}{ch.pages ? ` · ${ch.pages} hlm` : ''}</p>
                </div>
                <span onClick={(e) => { e.preventDefault(); e.stopPropagation(); setToast('Fitur unduh segera hadir'); }} className="p-2 text-white/50"><Download className="w-6 h-6" /></span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Komentar */}
      {commentsOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setCommentsOpen(false)} />
          <div className="relative bg-[#2A2931] rounded-t-3xl max-h-[85vh] w-full max-w-md mx-auto flex flex-col">
            <div className="flex items-center justify-between px-5 pt-5 pb-2 shrink-0">
              <h3 className="text-2xl font-extrabold">Komentar</h3>
              <button onClick={() => setCommentsOpen(false)} aria-label="Tutup" className="p-1"><X className="w-6 h-6" /></button>
            </div>
            <div className="overflow-y-auto px-5 pb-8">
              <ReviewsTab mangaUrl={url as string} mangaTitle={detail.title} />
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-8 inset-x-0 z-[60] flex justify-center pointer-events-none">
          <span className="px-5 py-3 rounded-full bg-black/80 text-white text-base font-bold">{toast}</span>
        </div>
      )}
    </div>
  );
}

export default function MangaPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen bg-[#1B1A20]"><Loader2 className="w-10 h-10 animate-spin text-gray-300" /></div>}>
      <MangaDetailContent />
    </Suspense>
  );
}
