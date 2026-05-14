'use client';

import { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, ChevronLeft, Heart, Send } from 'lucide-react';
import Link from 'next/link';
import { useFavorites, useHistory } from '@/lib/store';

// ─── Firebase ────────────────────────────────────────────────────────────────
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
  const urls = [
    'https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/10.14.0/firebase-auth-compat.js',
    'https://www.gstatic.com/firebasejs/10.14.0/firebase-database-compat.js',
  ];
  return urls.reduce((chain, src) => chain.then(() => new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject();
    document.head.appendChild(s);
  })), Promise.resolve()).then(() => { window._fbReady = true; });
}

let _fbInit = false;
let _fbPromise: Promise<{ auth: any; db: any }> | null = null;
async function getFirebase() {
  if (_fbPromise) return _fbPromise;
  _fbPromise = (async () => {
    await loadFirebaseCDN();
    if (!_fbInit) {
      if (!window.firebase.apps.length) window.firebase.initializeApp(FIREBASE_CONFIG);
      _fbInit = true;
    }
    return { auth: window.firebase.auth(), db: window.firebase.database() };
  })();
  return _fbPromise;
}

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
function getShortUid(uid: string) { return '#' + uid.substring(0, 6).toUpperCase(); }

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
    : 'linear-gradient(90deg,#1C1F26,#2a2d35,#1C1F26)';

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
function RoleBadge({ role, level }: { role: string; level: number }) {
  const isDev     = role === 'Developer';
  const isPremium = !isDev && (role === 'Wibu Premium' || level >= 50);
  const label     = isDev ? '⚡ DEV' : isPremium ? 'Premium' : 'Member';
  const cls       = isDev
    ? 'bg-white/5 text-gray-400 border-white/20/30'
    : isPremium
    ? 'bg-white/5 text-gray-300 border-white/10'
    : 'bg-white/5 text-gray-500 border-white/10';
  return (
    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${cls}`}>
      {label}
    </span>
  );
}

// ─── Comment Item ─────────────────────────────────────────────────────────────
interface CommentData {
  id: string; uid: string; nama: string; foto: string;
  role: string; level: number; teks: string; waktu: number; activeBorder?: string;
}

function CommentItem({ c, currentUid, onDelete }: { c: CommentData; currentUid: string | null; onDelete: (id: string) => void }) {
  const isMine = currentUid === c.uid;
  const timerRef = useRef<any>(null);
  const start = () => { if (!isMine) return; timerRef.current = setTimeout(() => onDelete(c.id), 650); };
  const stop  = () => { if (timerRef.current) clearTimeout(timerRef.current); };

  return (
    <div
      onMouseDown={start} onMouseUp={stop} onMouseLeave={stop}
      onTouchStart={start} onTouchEnd={stop} onTouchMove={stop}
      className="flex gap-3 p-3 rounded-2xl border border-white/5 bg-[#0D0D10]/60 mb-3 select-none"
    >
      <AvatarWithBorder src={c.foto} size={38} borderKey={c.activeBorder} />
      <div className="flex-1 min-w-0">
        {/* Name + time */}
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-[13px] font-bold text-white truncate max-w-[130px]">{c.nama}</span>
          <span className="text-[11px] text-gray-500">• {timeAgo(c.waktu)}</span>
          {isMine && <span className="text-[10px] text-gray-400 font-bold ml-auto opacity-60">Tahan hapus</span>}
        </div>
        {/* Badges */}
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          <LevelBadge level={c.level} />
          <RoleBadge role={c.role} level={c.level} />
          <span className="text-[10px] text-gray-600 font-mono">{getShortUid(c.uid)}</span>
        </div>
        {/* Text */}
        <p className="text-[13px] text-gray-200 leading-relaxed">{c.teks}</p>
      </div>
    </div>
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
          <div className="flex-1 flex items-center gap-2 bg-[#0D0D10] border border-white/10 rounded-2xl px-4 pr-2 py-2">
            <input
              type="text" value={text} onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') post(); }}
              placeholder="Tulis komentar..." maxLength={300}
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder-gray-600"
            />
            <button onClick={post} disabled={!text.trim() || posting}
              className="w-8 h-8 rounded-xl bg-[#1C1F26] flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform flex-shrink-0">
              {posting ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
            </button>
          </div>
        ) : (
          <button onClick={login}
            className="flex-1 flex items-center gap-2 bg-[#0D0D10] border border-white/10 rounded-2xl px-4 pr-3 py-2.5 active:scale-95 transition-transform">
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

// ─── Main ────────────────────────────────────────────────────────────────────
function MangaDetailContent() {
  const searchParams = useSearchParams();
  const url = searchParams.get('url');
  const router = useRouter();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { history } = useHistory();

  const [detail, setDetail]           = useState<any>(null);
  const [loading, setLoading]         = useState(!!url);
  const [error, setError]             = useState<string | null>(url ? null : 'URL tidak valid');
  const [activeTab, setActiveTab]     = useState('Chapters');
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [mounted, setMounted]         = useState(false);
  const chaptersRef = useRef<HTMLDivElement>(null);

  // Cari chapter terakhir dibaca untuk manga ini
  const lastRead = history.find(h => h.mangaLink === url);

  useEffect(() => {
    setMounted(true);
    if (!url) return;
    (async () => {
      try {
        const res  = await fetch(`/api/manga/detail?url=${encodeURIComponent(url as string)}`);
        const json = await res.json();
        if (json.success) setDetail(json.data);
        else setError(json.message || 'Gagal memuat detail manga');
      } catch (e: any) { setError(e.message || 'Terjadi kesalahan sistem'); }
      finally { setLoading(false); }
    })();
  }, [url]);

  if (loading) return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-[#0D0D10] gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-gray-300" />
      <p className="text-gray-500 text-sm">Memuat detail manga...</p>
    </div>
  );
  if (error || !detail) return (
    <div className="px-6 py-20 text-center bg-[#0D0D10] min-h-screen">
      <p className="text-gray-400 mb-4">{error || 'Manga tidak ditemukan'}</p>
      <button onClick={() => router.back()} className="px-6 py-2 bg-[#1A1D24] text-white rounded-full">Kembali</button>
    </div>
  );

  const isFav = isFavorite(url as string);

  return (
    <div className="bg-[#0D0D10] flex flex-col relative text-white">
      {/* Background */}
      <div className="absolute top-0 left-0 w-full h-[60vh] z-0">
        <Image src={detail.thumb || "https://picsum.photos/400/600"} alt={detail.title} fill
          className="object-cover opacity-80" referrerPolicy="no-referrer" priority unoptimized />
        <div className="absolute inset-0 bg-gradient-to-t from-[#13151A] via-transparent to-black/30" />
      </div>

      {/* Top Nav */}
      <div className="fixed top-6 inset-x-6 z-20 flex items-center gap-3 max-w-md mx-auto">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 active:scale-95 transition-transform">
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>

      </div>

      {/* Sheet */}
      <div className="relative z-10 mt-[45vh] bg-[#1A1D24] rounded-t-[2.5rem] w-full max-w-md mx-auto p-6 border-t border-white/5 shadow-2xl">
        <div className="flex justify-between items-start mt-2">
          <div className="flex-1 pr-4">
            <h1 className="text-2xl font-black text-white leading-tight mb-1">{detail.title}</h1>
            <p className="text-sm font-medium text-gray-400">by <span className="text-gray-300">Komiku Authors</span></p>
          </div>
          <button
            onClick={() => toggleFavorite({ title: detail.title, link: url as string, thumb: detail.thumb, desc: detail.synopsis?.slice(0, 50) })}
            className={`w-12 h-12 rounded-full flex items-center justify-center border active:scale-95 transition-all shrink-0 z-50 relative cursor-pointer ${mounted && isFav ? 'bg-red-500/10 border-red-500/30' : 'bg-[#0D0D10] border-white/5'}`}
          >
            <Heart className={`w-5 h-5 transition-all ${mounted && isFav ? 'fill-red-500 text-red-500 scale-110' : 'fill-gray-600 text-gray-600'}`} strokeWidth={0} />
          </button>
        </div>

        <p className={`text-gray-400 text-sm leading-relaxed mt-6 ${isDescExpanded ? '' : 'line-clamp-3'}`}>{detail.synopsis}</p>
        {detail.synopsis && detail.synopsis.length > 150 && (
          <button onClick={() => setIsDescExpanded(!isDescExpanded)} className="mt-2 text-gray-300 text-xs font-bold">
            {isDescExpanded ? '...Show Less' : '...Show More'}
          </button>
        )}

        {/* Tabs */}
        <div className="flex gap-6 mt-8 border-b border-white/5 pb-2">
          {['Chapters', 'Info', 'Reviews'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`pb-2 text-sm font-bold transition-colors relative ${activeTab === tab ? 'text-white' : 'text-gray-500'}`}>
              {tab}
              {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1C1F26] rounded-t-full shadow-[0_0_8px_rgba(58,200,186,0.8)]" />}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="mt-6 pb-20" ref={chaptersRef}>
          {activeTab === 'Chapters' && (
            <div className="space-y-3">
              {detail.chapters.length === 0
                ? <p className="text-gray-500 text-sm py-4">Belum ada chapter.</p>
                : detail.chapters.map((ch: any, i: number) => {
                    const isRead = history.some(h => h.chapterLink === ch.link);
                    const isLastRead = lastRead?.chapterLink === ch.link;
                    return (
                      <Link href={`/chapter?url=${encodeURIComponent(ch.link)}&thumb=${encodeURIComponent(detail.thumb||"")}&mangaTitle=${encodeURIComponent(detail.title||"")}`} key={i}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer group ${isRead ? 'bg-[#0D0D10]/30 border-white/5 opacity-70' : 'bg-[#0D0D10]/50 border-white/5 hover:bg-[#1C1F26]'}`}>
                        <div className="flex items-center gap-3 pointer-events-none">
                          <div className={`w-10 h-10 rounded-full border flex items-center justify-center font-bold text-sm relative ${isLastRead ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : isRead ? 'bg-[#1A1D24] border-white/5 text-gray-600' : 'bg-[#1A1D24] border-white/5 text-gray-300'}`}>
                            {detail.chapters.length - i}
                            {isLastRead && (
                              <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-[#1A1D24]" />
                            )}
                          </div>
                          <div>
                            <h4 className={`font-bold text-sm line-clamp-1 transition-colors ${isRead ? 'text-gray-500' : 'text-gray-200 group-hover:text-gray-300'}`}>{ch.title}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-xs text-gray-600 font-medium">Release Date • {ch.date || 'Unknown'}</p>
                              {isLastRead && <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">Terakhir Dibaca</span>}
                              {isRead && !isLastRead && <span className="text-[10px] font-black text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">Sudah Dibaca</span>}
                            </div>
                          </div>
                        </div>
                        <ChevronLeft className={`w-4 h-4 rotate-180 pointer-events-none ${isRead ? 'text-gray-700' : 'text-gray-600 group-hover:text-gray-300'}`} />
                      </Link>
                    );
                  })
              }
            </div>
          )}
          {activeTab === 'Info' && (
            <p className="text-gray-400 text-sm">Informasi manga sedang dimuat. Genre: Action, Adventure.</p>
          )}
          {activeTab === 'Reviews' && (
            <ReviewsTab mangaUrl={url as string} mangaTitle={detail.title} />
          )}
        </div>
      </div>

      {/* Bottom CTA */}
      {detail.chapters.length > 0 && (() => {
        const firstChapter = detail.chapters[detail.chapters.length - 1];
        const targetChapter = lastRead
          ? (detail.chapters.find((ch: any) => ch.link === lastRead.chapterLink) || firstChapter)
          : firstChapter;
        const isResume = !!lastRead;
        // Ambil chapter number aja, bukan full title manga
        const rawLabel = lastRead?.chapterNumber || lastRead?.chapterTitle || '';
        // Kalau ada angka chapter (misal "Chapter 1" atau "1"), ambil itu aja
        const chMatch = rawLabel.match(/chapter\s*(\d+)/i) || rawLabel.match(/^(\d+)$/);
        const chapterLabel = isResume
          ? (chMatch ? 'Ch. ' + chMatch[1] : rawLabel || 'Terakhir')
          : 'Ch. 1';
        return (
          <div className="fixed bottom-0 left-0 right-0 mx-auto w-full max-w-md z-50">
            <div className="bg-[#0D0D10] px-4 pt-3 pb-6 flex items-center border-t border-white/5">
              <Link
                href={`/chapter?url=${encodeURIComponent(targetChapter.link)}&thumb=${encodeURIComponent(detail.thumb||"")}&mangaTitle=${encodeURIComponent(detail.title||"")}`}
                className="flex-1 bg-[#1A1D24] text-white font-black py-4 rounded-[1.5rem] flex items-center justify-center gap-2 active:scale-95 transition-transform border border-white/5"
              >
                {isResume ? 'Lanjut Baca →' : 'Swipe to Read →'}
              </Link>
              <div className="w-[120px] flex flex-col items-center justify-center">
                <span className="text-xs text-gray-500 font-medium">{isResume ? 'Lanjut dari' : 'Start From'}</span>
                <span className="text-sm font-black text-white">{chapterLabel}</span>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default function MangaPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen bg-[#0D0D10]"><Loader2 className="w-10 h-10 animate-spin text-gray-300" /></div>}>
      <MangaDetailContent />
    </Suspense>
  );
}
