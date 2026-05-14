'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useHistory, useUserStats } from '@/lib/store';

function IconBack() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
        </svg>
    );
}
function IconChevLeft() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
        </svg>
    );
}
function IconChevRight() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
        </svg>
    );
}
function IconSettings() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="14" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
            <circle cx="17" cy="12" r="3" />
        </svg>
    );
}
function IconPlay() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
    );
}
function IconPause() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
        </svg>
    );
}
function IconList() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
    );
}
function IconChat() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    );
}
function IconLike({ active }: { active: boolean }) {
    return active ? (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="#3b82f6" stroke="#3b82f6" strokeWidth="1.5">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
            <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" stroke="#3b82f6" fill="#3b82f6" />
        </svg>
    ) : (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
            <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
        </svg>
    );
}
function IconClose() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}
function IconSend() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
    );
}

// ── Custom Modal Components ───────────────────────────────────────────────
function AlertModal({ message, onClose }: { message: string; onClose: () => void }) {
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
            <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
            <div style={{
                position: 'relative', background: '#16181f', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 20, padding: '24px 20px 16px', width: '100%', maxWidth: 320,
                boxShadow: '0 24px 48px rgba(0,0,0,0.6)',
                animation: 'modalPop 0.2s cubic-bezier(.22,1,.36,1)',
            }}>
                <style>{`@keyframes modalPop { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }`}</style>
                <p style={{ color: '#e5e7eb', fontSize: 14, lineHeight: 1.6, marginBottom: 20, textAlign: 'center' }}>{message}</p>
                <button onClick={onClose} style={{
                    width: '100%', padding: '10px', borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: '#dc2626', color: 'white', fontWeight: 700, fontSize: 14,
                    transition: 'opacity 0.15s',
                }}>Oke</button>
            </div>
        </div>
    );
}

function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
            <div onClick={onCancel} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
            <div style={{
                position: 'relative', background: '#16181f', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 20, padding: '24px 20px 16px', width: '100%', maxWidth: 320,
                boxShadow: '0 24px 48px rgba(0,0,0,0.6)',
                animation: 'modalPop 0.2s cubic-bezier(.22,1,.36,1)',
            }}>
                <p style={{ color: '#e5e7eb', fontSize: 14, lineHeight: 1.6, marginBottom: 20, textAlign: 'center' }}>{message}</p>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={onCancel} style={{
                        flex: 1, padding: '10px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
                        cursor: 'pointer', background: 'rgba(255,255,255,0.06)', color: '#9ca3af', fontWeight: 700, fontSize: 14,
                    }}>Batal</button>
                    <button onClick={onConfirm} style={{
                        flex: 1, padding: '10px', borderRadius: 12, border: 'none',
                        cursor: 'pointer', background: '#dc2626', color: 'white', fontWeight: 700, fontSize: 14,
                    }}>Hapus</button>
                </div>
            </div>
        </div>
    );
}

// ── Firebase setup (shared config) ────────────────────────────────────────
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
        s.src = src; s.onload = () => resolve(); s.onerror = () => reject();
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

// ── Rank & helpers ────────────────────────────────────────────────────────
const RANK_TIERS = [
    { name: 'Stone',   minLvl: 0,     maxLvl: 49,      color: '#9ca3af', icon: '🌑' },
    { name: 'Bronze',  minLvl: 50,    maxLvl: 149,     color: '#cd7f32', icon: '🥉' },
    { name: 'Silver',  minLvl: 150,   maxLvl: 499,     color: '#bdc3c7', icon: '🥈' },
    { name: 'Gold',    minLvl: 500,   maxLvl: 2499,    color: '#f1c40f', icon: '🥇' },
    { name: 'Emerald', minLvl: 2500,  maxLvl: 4999,    color: '#2ecc71', icon: '🔮' },
    { name: 'Diamond', minLvl: 5000,  maxLvl: 9999,    color: '#3498db', icon: '💎' },
    { name: 'Master',  minLvl: 10000, maxLvl: 19999,   color: '#9b59b6', icon: '👑' },
    { name: 'Mythic',  minLvl: 20000, maxLvl: Infinity, color: '#ef4444', icon: '🌟' },
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

// ── Comment panel (Firebase realtime) ─────────────────────────────────────
interface CommentData {
    id: string; uid: string; nama: string; foto: string;
    role: string; level: number; teks: string; waktu: number; activeBorder?: string;
}

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

function CommentPanel({ onClose, chapterUrl, chapterTitle }: { onClose: () => void; chapterUrl: string; chapterTitle: string }) {
    const [comments, setComments]       = useState<CommentData[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [userData, setUserData]       = useState<any>(null);
    const [inputVal, setInputVal]       = useState('');
    const [posting, setPosting]         = useState(false);
    const [fbReady, setFbReady]         = useState(false);
    const [alertMsg, setAlertMsg]       = useState<string | null>(null);
    const [confirmState, setConfirmState] = useState<{ msg: string; id: string } | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const dbRef    = useRef<any>(null);
    const authRef  = useRef<any>(null);

    // Firebase key dari chapter URL
    const chapterKey = chapterUrl.replace(/[.#$[\]/]/g, '_').slice(-120);

    useEffect(() => {
        getFirebase().then(({ auth, db }) => {
            authRef.current = auth;
            dbRef.current   = db;
            setFbReady(true);

            auth.onAuthStateChanged(async (u: any) => {
                setCurrentUser(u);
                if (u) {
                    const snap = await db.ref(`users/${u.uid}`).get();
                    setUserData(snap.exists() ? snap.val() : null);
                } else {
                    setUserData(null);
                }
            });

            db.ref(`chapterComments/${chapterKey}`).on('value', (snap: any) => {
                if (!snap.exists()) { setComments([]); return; }
                const arr: CommentData[] = [];
                snap.forEach((c: any) => {
                    if (c.val()?.teks) arr.push({ id: c.key, ...c.val() });
                });
                setComments(arr.sort((a, b) => b.waktu - a.waktu));
            });
        });
        return () => {
            if (dbRef.current) dbRef.current.ref(`chapterComments/${chapterKey}`).off();
        };
    }, [chapterKey]);

    const handleSend = async () => {
        const txt = inputVal.trim();
        if (!txt || !currentUser || !dbRef.current || posting) return;
        setPosting(true);
        try {
            const u = userData || {};
            await dbRef.current.ref(`chapterComments/${chapterKey}`).push({
                uid: currentUser.uid,
                nama: u.displayName || currentUser.displayName || 'User',
                foto: u.photoURL    || currentUser.photoURL    || '',
                role: u.role        || 'Member',
                level: Number(u.level) || 1,
                activeBorder: u.activeBorder || '',
                teks: txt,
                waktu: Date.now(),
                chapterTitle,
            });
            setInputVal('');
        } catch (e: any) {
            setAlertMsg('Gagal kirim: ' + (e?.message || 'Unknown error'));
        } finally { setPosting(false); }
    };

    const handleDelete = async (id: string) => {
        if (!currentUser || !dbRef.current) return;
        setConfirmState({ msg: 'Hapus komentar ini?', id });
    };

    const doDelete = async (id: string) => {
        setConfirmState(null);
        try {
            await dbRef.current.ref(`chapterComments/${chapterKey}/${id}`).remove();
        } catch (e: any) { setAlertMsg('Gagal hapus: ' + (e?.message || 'Unknown error')); }
    };

    const handleLogin = async () => {
        if (!authRef.current) return;
        try {
            const p = new window.firebase.auth.GoogleAuthProvider();
            await authRef.current.signInWithPopup(p);
        } catch (e: any) { setAlertMsg('Login gagal: ' + e.message); }
    };

    return (
        <>
        <div
            onClick={e => e.stopPropagation()}
            style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
                animation: 'slideUp 0.3s cubic-bezier(.22,1,.36,1)',
            }}
            className="bg-[#0D0D10]/98 backdrop-blur-xl border-t border-white/[0.08] rounded-t-[20px] max-h-[72vh] flex flex-col"
        >
            <style>{`
                @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes shimmerBadge{0%{background-position:100% 0}100%{background-position:-100% 0}}
            `}</style>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5 border-b border-white/[0.07] flex-shrink-0">
                <span className="text-white font-bold text-[15px]">
                    Komentar <span className="text-white/40 font-normal text-[13px]">({comments.length})</span>
                </span>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center text-white">
                    <IconClose />
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-3 pt-3" style={{ WebkitOverflowScrolling: 'touch' }}>
                {!fbReady && (
                    <div className="flex justify-center py-8">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></svg>
                    </div>
                )}
                {fbReady && comments.length === 0 && (
                    <p className="text-center text-gray-600 text-sm py-10">Belum ada komentar. Jadilah yang pertama!</p>
                )}
                {fbReady && comments.map(c => (
                    <CommentItem key={c.id} c={c} currentUid={currentUser?.uid ?? null} onDelete={handleDelete} />
                ))}
            </div>

            {/* Input */}
            <div className="flex gap-3 px-3 py-2.5 border-t border-white/[0.07] flex-shrink-0 items-center" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}>
                <AvatarWithBorder
                    src={currentUser?.photoURL || ''}
                    size={36}
                    borderKey={userData?.activeBorder}
                />
                {currentUser ? (
                    <div className="flex-1 flex items-center gap-2 bg-[#0D0D10] border border-white/10 rounded-2xl px-4 pr-2 py-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputVal}
                            onChange={e => setInputVal(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                            placeholder="Tulis komentar..."
                            maxLength={300}
                            className="flex-1 bg-transparent text-sm text-white outline-none placeholder-gray-600"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!inputVal.trim() || posting}
                            className="w-8 h-8 rounded-xl bg-[#1C1F26] flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform flex-shrink-0"
                        >
                            {posting
                                ? <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                                : <IconSend />
                            }
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleLogin}
                        className="flex-1 flex items-center gap-2 bg-[#0D0D10] border border-white/10 rounded-2xl px-4 pr-3 py-2.5 active:scale-95 transition-transform"
                    >
                        <span className="flex-1 text-sm text-gray-600 text-left">Tulis komentar...</span>
                        <IconSend />
                    </button>
                )}
            </div>
        </div>
        {alertMsg && <AlertModal message={alertMsg} onClose={() => setAlertMsg(null)} />}
        {confirmState && (
            <ConfirmModal
                message={confirmState.msg}
                onConfirm={() => doDelete(confirmState.id)}
                onCancel={() => setConfirmState(null)}
            />
        )}
        </>
    );
}

// ── Auto-scroll speed panel ────────────────────────────────────────────────
function SpeedPanel({ speed, onSpeedChange, onClose }: { speed: number; onSpeedChange: (s: number) => void; onClose: () => void }) {
    const speeds = [0.5, 1, 1.5, 2, 3, 5];
    return (
        <div
            onClick={e => e.stopPropagation()}
            style={{
                position: 'fixed', bottom: 120, left: '50%', transform: 'translateX(-50%)', zIndex: 200,
                background: 'rgba(20,20,26,0.97)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16,
                padding: '14px 18px', minWidth: 220,
                animation: 'fadeInUp 0.2s ease',
            }}
        >
            <style>{`@keyframes fadeInUp { from { opacity:0; transform: translateX(-50%) translateY(10px); } to { opacity:1; transform: translateX(-50%) translateY(0); } }`}</style>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ color: '#e5e7eb', fontWeight: 700, fontSize: 14 }}>Kecepatan Scroll</span>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex' }}><IconClose /></button>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {speeds.map(s => (
                    <button key={s} onClick={() => { onSpeedChange(s); onClose(); }}
                        style={{
                            padding: '6px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                            background: speed === s ? '#dc2626' : 'rgba(255,255,255,0.08)',
                            color: speed === s ? 'white' : 'rgba(255,255,255,0.7)',
                            fontWeight: speed === s ? 700 : 400, fontSize: 13,
                            transition: 'all 0.15s',
                        }}
                    >{s}x</button>
                ))}
            </div>
            <div style={{ marginTop: 12 }}>
                <input type="range" min={0.2} max={6} step={0.1} value={speed}
                    onChange={e => onSpeedChange(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: '#dc2626' }}
                />
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 }}>Custom: {speed}x</div>
            </div>
        </div>
    );
}

// ── Overlay backdrop ───────────────────────────────────────────────────────
function Backdrop({ onClick }: { onClick: () => void }) {
    return <div onClick={onClick} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 150 }} />;
}

// ── Main ChapterContent ────────────────────────────────────────────────────
function ChapterContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const url = searchParams.get('url');
    const thumbParam = searchParams.get('thumb') || '';
    const mangaTitleParam = searchParams.get('mangaTitle') || '';
    const { addHistory } = useHistory();
    const { addExp } = useUserStats();

    const [chapter, setChapter] = useState<any>(null);
    const [loading, setLoading] = useState(!!url);
    const [navigating, setNavigating] = useState(false);
    const [error, setError] = useState<string | null>(url ? null : 'URL tidak valid');
    const [uiVisible, setUiVisible] = useState(true);
    const [liked, setLiked] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const hideTimer = useRef<any>(null);
    const [showXpToast, setShowXpToast] = useState(false);
    const xpToastTimer = useRef<any>(null);

    // Auto-scroll state
    const [isScrolling, setIsScrolling] = useState(false);
    const [scrollSpeed, setScrollSpeed] = useState(1); // multiplier
    const [showSpeedPanel, setShowSpeedPanel] = useState(false);
    const scrollRaf = useRef<number | null>(null);
    const scrollAccum = useRef(0);

    // Comment state
    const [showComments, setShowComments] = useState(false);

    useEffect(() => {
        if (!url) return;
        setLoading(true);
        setChapter(null);
        setError(null);
        setCurrentPage(0);

        async function fetchChapter() {
            try {
                window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
                const res = await fetch(`/api/manga/chapter?url=${encodeURIComponent(url as string)}`);
                const json = await res.json();
                if (json.success) {
                    setChapter(json.data);
                    addHistory({
                        mangaTitle:    mangaTitleParam || json.data.mangaTitle || json.data.title || 'Unknown',
                        mangaLink:     json.data.mangaLink   ?? '',
                        mangaThumb:    thumbParam || json.data.mangaThumb || '',
                        chapterTitle:  json.data.title       ?? '',
                        chapterLink:   url as string,
                        chapterNumber: json.data.chapterNumber ?? json.data.title ?? '',
                        pageRead:      1,
                        totalPages:    json.data.images?.length ?? 0,
                    });
                    addExp();
                    clearTimeout(xpToastTimer.current);
                    setShowXpToast(true);
                    xpToastTimer.current = setTimeout(() => setShowXpToast(false), 2500);
                } else {
                    setError(json.message || 'Gagal memuat chapter');
                }
            } catch (err: any) {
                setError(err.message || 'Terjadi kesalahan sistem');
            } finally {
                setLoading(false);
                setNavigating(false);
            }
        }
        fetchChapter();
    }, [url]);

    // ── Auto-scroll engine ─────────────────────────────────────────────────
    useEffect(() => {
        if (isScrolling) {
            const BASE_PX_PER_FRAME = 1.2; // px at 60fps at 1x speed
            let lastTime: number | null = null;

            const tick = (now: number) => {
                if (lastTime === null) { lastTime = now; }
                const delta = now - lastTime;
                lastTime = now;

                // Accumulate fractional pixels
                scrollAccum.current += (BASE_PX_PER_FRAME * scrollSpeed * delta) / (1000 / 60);
                const px = Math.floor(scrollAccum.current);
                if (px > 0) {
                    window.scrollBy(0, px);
                    scrollAccum.current -= px;
                }

                // Stop at page bottom
                const atBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 4;
                if (atBottom) {
                    setIsScrolling(false);
                    return;
                }

                scrollRaf.current = requestAnimationFrame(tick);
            };

            scrollRaf.current = requestAnimationFrame(tick);
            return () => {
                if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
            };
        } else {
            if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
        }
    }, [isScrolling, scrollSpeed]);

    // Stop scroll when chapter changes
    useEffect(() => {
        setIsScrolling(false);
    }, [url]);

    const resetHideTimer = useCallback(() => {
        clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => setUiVisible(false), 3500);
    }, []);

    useEffect(() => {
        if (uiVisible) resetHideTimer();
        return () => clearTimeout(hideTimer.current);
    }, [uiVisible]);

    const toggleUI = useCallback(() => {
        setUiVisible(v => { if (!v) resetHideTimer(); return !v; });
    }, [resetHideTimer]);

    useEffect(() => {
        if (!chapter) return;
        const imgs = document.querySelectorAll('.comic-page-img');
        if (!imgs.length) return;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setCurrentPage(parseInt((entry.target as HTMLElement).dataset.idx || '0'));
                }
            });
        }, { threshold: 0.3 });
        imgs.forEach(img => observer.observe(img));
        return () => observer.disconnect();
    }, [chapter]);

    const navigateTo = useCallback((targetUrl: string) => {
        setNavigating(true);
        const thumb = encodeURIComponent(thumbParam || chapter?.mangaThumb || '');
        const title = encodeURIComponent(mangaTitleParam || chapter?.mangaTitle || '');
        router.push(`/chapter?url=${encodeURIComponent(targetUrl)}&thumb=${thumb}&mangaTitle=${title}`);
    }, [chapter, thumbParam, mangaTitleParam, router]);

    const goToMangaDetail = useCallback(() => {
        const mangaLink = chapter?.mangaLink;
        if (mangaLink) router.push(`/manga?url=${encodeURIComponent(mangaLink)}`);
        else router.back();
    }, [chapter, router]);

    const scrollToPage = useCallback((pageIdx: number) => {
        const imgs = document.querySelectorAll('.comic-page-img');
        if (imgs[pageIdx]) imgs[pageIdx].scrollIntoView({ behavior: 'smooth' });
    }, []);

    if (loading || navigating) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen space-y-6 bg-[#0D0D10]">
                <Loader2 className="w-14 h-14 animate-spin text-gray-400" />
                <p className="text-gray-500 text-sm font-semibold tracking-widest uppercase animate-pulse">
                    {navigating ? 'Memuat Chapter...' : 'Menyiapkan Komik...'}
                </p>
            </div>
        );
    }

    if (error || !chapter) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#0D0D10] px-6 text-center space-y-4">
                <p className="text-gray-400 text-base font-semibold">{error || 'Chapter tidak ditemukan'}</p>
                <button onClick={() => window.history.back()} className="px-8 py-3 bg-[#1C1F26] text-white font-bold rounded-2xl border border-white/5 active:scale-95 transition-transform">
                    Kembali
                </button>
            </div>
        );
    }

    const totalPages = chapter.images?.length ?? 0;
    const progress = totalPages > 1 ? currentPage / (totalPages - 1) : 0;
    const chNum = chapter.chapterNumber ?? chapter.title?.match(/\d+/)?.[0] ?? '';

    return (
        <>
            <style>{`
                .ui-layer { transition: opacity 0.3s ease; }
                .ui-layer.hidden { opacity: 0; pointer-events: none; }
                .icon-btn {
                    width: 44px; height: 44px; border-radius: 50%;
                    background: rgba(28,28,34,0.9); border: none; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    transition: transform 0.15s; flex-shrink: 0;
                    -webkit-tap-highlight-color: transparent;
                }
                .icon-btn:active { transform: scale(0.86); }
                .icon-btn.play-active { background: rgba(220,38,38,0.25) !important; border: 1px solid rgba(220,38,38,0.5); }
                .ch-nav-btn {
                    background: none; border: none; cursor: pointer; color: white;
                    display: flex; align-items: center; gap: 2px;
                    padding: 5px 7px; border-radius: 8px; transition: background 0.15s;
                    -webkit-tap-highlight-color: transparent;
                }
                .ch-nav-btn:active { background: rgba(255,255,255,0.1); }
                .ch-nav-btn:disabled { opacity: 0.3; cursor: default; }
                .progress-slider {
                    -webkit-appearance: none; appearance: none;
                    position: absolute; inset: 0; width: 100%; height: 100%;
                    opacity: 0; cursor: pointer; margin: 0;
                }
                .scroll-indicator {
                    position: fixed; top: 60px; right: 12px; z-index: 99;
                    background: rgba(220,38,38,0.9); color: white; border-radius: 20px;
                    padding: 4px 10px; font-size: 12px; font-weight: 700;
                    display: flex; align-items: center; gap: 5px;
                    animation: pulse-red 1s ease-in-out infinite;
                    pointer-events: none;
                }
                @keyframes pulse-red {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.6); }
                    50% { box-shadow: 0 0 0 6px rgba(220,38,38,0); }
                }
                @keyframes xpToastIn {
                    from { opacity: 0; transform: translateX(12px) scale(0.92); }
                    to   { opacity: 1; transform: translateX(0)     scale(1); }
                }
            `}</style>

            {/* XP Toast */}
            {showXpToast && (
                <div style={{
                    position: 'fixed',
                    top: '72px',
                    right: '16px',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(26,29,36,0.95)',
                    border: '1px solid rgba(250,204,21,0.35)',
                    borderRadius: '14px',
                    padding: '10px 16px',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.5), 0 0 12px rgba(250,204,21,0.15)',
                    animation: 'xpToastIn 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards',
                }}>
                    <span style={{ fontSize: '18px', lineHeight: 1 }}>⚡</span>
                    <div>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#facc15', letterSpacing: '0.01em' }}>+10 XP</p>
                        <p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Chapter selesai dibuka</p>
                    </div>
                </div>
            )}

            {/* Auto-scroll indicator */}
            {isScrolling && (
                <div className="scroll-indicator">
                    <span style={{ width: 6, height: 6, background: 'white', borderRadius: '50%', display: 'inline-block' }} />
                    AUTO {scrollSpeed}x
                </div>
            )}

            {/* TOP BAR */}
            <div className={`ui-layer ${uiVisible ? '' : 'hidden'}`} style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
                background: 'rgba(15,15,18,0.93)', backdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8,
            }}>
                <button onClick={goToMangaDetail} className="ch-nav-btn" style={{ padding: 4 }}>
                    <IconBack />
                </button>
                <div style={{ flex: 1, overflow: 'hidden', textAlign: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                        {chapter.title}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <button className="ch-nav-btn" disabled={!chapter.prev} onClick={() => chapter.prev && navigateTo(chapter.prev)}>
                        <IconChevLeft />
                    </button>
                    <button onClick={goToMangaDetail} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontWeight: 900, fontSize: 14, padding: '4px 6px', fontFamily: 'inherit' }}>
                        Ch {chNum}
                    </button>
                    <button className="ch-nav-btn" disabled={!chapter.next} onClick={() => chapter.next && navigateTo(chapter.next)}>
                        <IconChevRight />
                    </button>
                </div>
            </div>

            {/* COMIC PAGES */}
            <div onClick={toggleUI} style={{ background: '#000', paddingTop: 52, paddingBottom: 108, minHeight: '100vh', cursor: 'pointer' }}>
                {totalPages > 0 ? chapter.images.map((img: string, i: number) => (
                    <div key={i} className="comic-page-img" data-idx={i} style={{ width: '100%', lineHeight: 0 }}>
                        <img
                            src={img || ''}
                            alt={`${chapter.title} - Halaman ${i + 1}`}
                            style={{ width: '100%', height: 'auto', display: 'block' }}
                            loading={i < 3 ? 'eager' : 'lazy'}
                            decoding="async"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                                const t = e.currentTarget;
                                if (!t.dataset.retried) { t.dataset.retried = '1'; t.src = `/api/img?url=${encodeURIComponent(img)}`; }
                            }}
                        />
                    </div>
                )) : (
                    <div style={{ padding: '80px 24px', textAlign: 'center', color: '#6b7280' }}>Tidak ada gambar yang dimuat.</div>
                )}
            </div>

            {/* BOTTOM BAR */}
            <div className={`ui-layer ${uiVisible ? '' : 'hidden'}`} style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
                background: 'rgba(10,10,13,0.96)', backdropFilter: 'blur(16px)',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                paddingBottom: 'max(env(safe-area-inset-bottom), 8px)',
            }}>
                {/* Action icons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '10px 20px 8px' }}>
                    {/* Settings / speed icon */}
                    <button
                        className="icon-btn"
                        onClick={(e) => { e.stopPropagation(); setShowSpeedPanel(v => !v); setShowComments(false); }}
                        style={{ position: 'relative' }}
                    >
                        <IconSettings />
                        {scrollSpeed !== 1 && (
                            <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, background: '#dc2626', borderRadius: '50%' }} />
                        )}
                    </button>

                    {/* Play / Pause button */}
                    <button
                        className={`icon-btn${isScrolling ? ' play-active' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsScrolling(v => !v);
                            setShowComments(false);
                            setShowSpeedPanel(false);
                        }}
                    >
                        {isScrolling ? <IconPause /> : <IconPlay />}
                    </button>

                    {/* Like */}
                    <button
                        className="icon-btn"
                        onClick={(e) => { e.stopPropagation(); setLiked(v => !v); }}
                        style={{ width: 52, height: 52, background: liked ? 'rgba(59,130,246,0.15)' : 'rgba(28,28,34,0.9)', border: liked ? '1px solid rgba(59,130,246,0.3)' : 'none', transition: 'all 0.2s' }}
                    >
                        <IconLike active={liked} />
                    </button>

                    {/* Chapter list */}
                    <button className="icon-btn" onClick={(e) => { e.stopPropagation(); goToMangaDetail(); }}><IconList /></button>

                    {/* Comments */}
                    <button
                        className={`icon-btn${showComments ? ' play-active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); setShowComments(v => !v); setShowSpeedPanel(false); setIsScrolling(false); }}
                    >
                        <IconChat />
                    </button>
                </div>

                {/* Progress row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px 6px' }}>
                    <button
                        disabled={!chapter.prev}
                        onClick={(e) => { e.stopPropagation(); chapter.prev && navigateTo(chapter.prev); }}
                        style={{ background: 'none', border: 'none', color: chapter.prev ? 'white' : 'rgba(255,255,255,0.2)', cursor: chapter.prev ? 'pointer' : 'default', padding: 2, flexShrink: 0, display: 'flex', alignItems: 'center' }}
                    >
                        <IconChevLeft />
                    </button>

                    <div style={{ flex: 1, position: 'relative', height: 24, display: 'flex', alignItems: 'center' }}>
                        {/* Dot segments */}
                        <div style={{ position: 'absolute', left: 0, right: 0, display: 'flex', alignItems: 'center', gap: 3, pointerEvents: 'none' }}>
                            {chapter.images.map((_: any, i: number) => (
                                <div key={i} style={{
                                    flex: 1, height: i === currentPage ? 8 : 5, borderRadius: 99,
                                    background: i < currentPage ? 'rgba(255,255,255,0.5)' : i === currentPage ? '#dc2626' : 'rgba(255,255,255,0.18)',
                                    transition: 'all 0.2s',
                                }} />
                            ))}
                        </div>
                        {/* Red thumb */}
                        <div style={{
                            position: 'absolute', left: `calc(${progress * 100}% - 8px)`,
                            width: 16, height: 16, background: '#dc2626', borderRadius: '50%',
                            border: '2px solid white', boxShadow: '0 0 6px rgba(220,38,38,0.8)',
                            pointerEvents: 'none', transition: 'left 0.1s', zIndex: 2,
                        }} />
                        {/* Invisible slider */}
                        <input
                            type="range" min={0} max={Math.max(totalPages - 1, 0)} value={currentPage}
                            onChange={(e) => { const pg = parseInt(e.target.value); setCurrentPage(pg); scrollToPage(pg); }}
                            onClick={e => e.stopPropagation()}
                            style={{ WebkitAppearance: 'none', appearance: 'none', position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', margin: 0 } as any}
                        />
                    </div>

                    <button
                        disabled={!chapter.next}
                        onClick={(e) => { e.stopPropagation(); chapter.next && navigateTo(chapter.next); }}
                        style={{ background: 'none', border: 'none', color: chapter.next ? 'white' : 'rgba(255,255,255,0.2)', cursor: chapter.next ? 'pointer' : 'default', padding: 2, flexShrink: 0, display: 'flex', alignItems: 'center' }}
                    >
                        <IconChevRight />
                    </button>
                </div>
            </div>

            {/* Overlays */}
            {(showComments || showSpeedPanel) && <Backdrop onClick={() => { setShowComments(false); setShowSpeedPanel(false); }} />}
            {showSpeedPanel && (
                <SpeedPanel
                    speed={scrollSpeed}
                    onSpeedChange={setScrollSpeed}
                    onClose={() => setShowSpeedPanel(false)}
                />
            )}
            {showComments && <CommentPanel onClose={() => setShowComments(false)} chapterUrl={url || ''} chapterTitle={chapter?.title || mangaTitleParam || ''} />}
        </>
    );
}

export default function ChapterPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-[#0D0D10]">
                <Loader2 className="w-12 h-12 animate-spin text-gray-300" />
            </div>
        }>
            <ChapterContent />
        </Suspense>
    );
}
