'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, ChevronRight, Crown, Palette, Globe, Smartphone, Image as ImageIcon, Download,
  Bookmark, Bell, Reply, Info, RefreshCw, Trash2, Share2, Bug, LogOut, Wrench, Hash, Upload,
} from 'lucide-react';
import { useFavorites, useHistory } from '@/lib/store';
import type { FavoriteItem, HistoryItem } from '@/lib/store';
import { useSettings } from '@/lib/settings';
import { numericId } from '@/lib/utils';
import { getFirebase, loginWithGoogle } from '@/lib/firebase-client';
import pkg from '@/package.json';

const CARD = '#2A2931';
const MUTED = '#8F8D9B';
const ICON = '#C8C6D2';
const ACCENT = '#FF6B6B';
const DANGER = '#FF7A7A';
const HOME_CACHE_KEY = 'komiku_home_v2';
const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

// ─── Komponen kecil ───────────────────────────────────────────────────────────
function Switch({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        width: 50, height: 30, borderRadius: 15, flexShrink: 0, position: 'relative', boxSizing: 'border-box',
        background: on ? ACCENT : '#442930',
        border: on ? '2px solid transparent' : '2px solid #8F8D9B',
        transition: 'background .2s',
      }}
    >
      <span style={{
        position: 'absolute', top: on ? 2 : 5, left: on ? 22 : 5,
        width: on ? 22 : 16, height: on ? 22 : 16, borderRadius: '50%',
        background: on ? '#fff' : '#B5B3C0', transition: 'all .2s',
      }} />
    </span>
  );
}

interface RowProps {
  icon?: React.ReactNode;
  title: string;
  sub?: string;
  right?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  chevron?: boolean;
  toggle?: { on: boolean; onChange: (v: boolean) => void };
  danger?: boolean;
  border?: boolean;
}

function Row({ icon, title, sub, right, onClick, href, chevron, toggle, danger, border }: RowProps) {
  const inner = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 16px', minHeight: 57, borderTop: border ? '1px solid rgba(255,255,255,.08)' : 'none' }}>
      <span style={{ width: 28, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.8, lineHeight: 1.15, color: danger ? DANGER : '#fff' }}>{title}</div>
        {sub && <div style={{ fontSize: 17, fontWeight: 700, color: MUTED, letterSpacing: -0.5, lineHeight: 1.25, marginTop: 1 }}>{sub}</div>}
      </div>
      {right != null && <span style={{ fontSize: 20, fontWeight: 800, color: MUTED, letterSpacing: -0.6, flexShrink: 0 }}>{right}</span>}
      {toggle ? <Switch on={toggle.on} /> : chevron ? <ChevronRight size={20} color={MUTED} style={{ flexShrink: 0 }} /> : null}
    </div>
  );
  if (href) return <Link href={href} style={{ display: 'block', color: 'inherit', textDecoration: 'none' }}>{inner}</Link>;
  if (toggle) {
    return (
      <button role="switch" aria-checked={toggle.on} onClick={() => toggle.onChange(!toggle.on)}
        style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 0, padding: 0, color: 'inherit', font: 'inherit', cursor: 'pointer' }}>
        {inner}
      </button>
    );
  }
  if (onClick) {
    return (
      <button onClick={onClick}
        style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 0, padding: 0, color: 'inherit', font: 'inherit', cursor: 'pointer' }}>
        {inner}
      </button>
    );
  }
  return <div>{inner}</div>;
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: 16, fontWeight: 800, color: '#B5B3C0', letterSpacing: -0.3, margin: '26px 16px 10px', textTransform: 'uppercase' }}>{children}</div>
);

const Group = ({ children }: { children: React.ReactNode }) => (
  <div style={{ margin: '0 16px', background: CARD, borderRadius: 22, overflow: 'hidden' }}>{children}</div>
);

function Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}
        style={{ background: CARD, borderRadius: 24, padding: '20px 18px 16px', width: '100%', maxWidth: 360, border: '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.6, marginBottom: 8 }}>{title}</div>
        {children}
      </div>
    </div>
  );
}

const dialogText: React.CSSProperties = { fontSize: 17, fontWeight: 700, color: MUTED, letterSpacing: -0.4, lineHeight: 1.4 };
const dialogBtn: React.CSSProperties = { flex: 1, border: 0, borderRadius: 14, padding: '13px 0', fontSize: 17, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' };

// ─── Halaman ──────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const favorites = useFavorites((s) => s.favorites);
  const settings = useSettings();

  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<{ uid: string; name: string; photo: string } | null>(null);
  const [role, setRole] = useState('Member');
  const [cacheKb, setCacheKb] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  const say = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const readCache = useCallback(() => {
    try {
      const raw = localStorage.getItem(HOME_CACHE_KEY);
      setCacheKb(raw ? Math.max(1, Math.round(raw.length / 1024)) : 0);
    } catch { setCacheKb(0); }
  }, []);

  useEffect(() => {
    setMounted(true);
    readCache();
    let dead = false;
    let unsub: (() => void) | null = null;
    getFirebase().then(async ({ auth, db }) => {
      try { await auth.getRedirectResult(); } catch { /* abaikan error redirect */ }
      if (dead) return;
      unsub = auth.onAuthStateChanged(async (fu: any) => {
        if (dead) return;
        setReady(true);
        if (!fu) { setUser(null); setRole('Member'); return; }
        setUser({ uid: fu.uid, name: fu.displayName || 'User', photo: fu.photoURL || '' });
        try {
          const snap = await db.ref(`users/${fu.uid}`).get();
          if (dead) return;
          const d = snap.exists() ? snap.val() : {};
          setRole(d.role || 'Member');
          if (d.displayName) setUser({ uid: fu.uid, name: d.displayName, photo: fu.photoURL || '' });
        } catch { /* biarkan role default */ }
      });
    }).catch(() => setReady(true));
    return () => { dead = true; if (unsub) unsub(); if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, [readCache]);

  const isPremium = role === 'Komikita Premium';
  const isDev = role === 'Developer';

  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push('/profile');
  };

  const handleLogin = async () => {
    if (loggingIn) return;
    setLoggingIn(true);
    try { await loginWithGoogle(); }
    catch (e: any) { if (!e?.code?.includes('redirect')) say('Login gagal: ' + (e?.message || e?.code || 'coba lagi')); }
    finally { setLoggingIn(false); }
  };

  const handleLogout = async () => {
    setLogoutOpen(false);
    try {
      const { auth } = await getFirebase();
      await auth.signOut();
      say('Kamu sudah keluar.');
    } catch (e: any) { say('Gagal keluar: ' + (e?.message || 'coba lagi')); }
  };

  const copyUid = async () => {
    if (!user) return;
    try { await navigator.clipboard.writeText(numericId(user.uid)); say('ID akun disalin.'); }
    catch { say('Tidak bisa menyalin ID.'); }
  };

  // ── Data: ekspor / impor ────────────────────────────────────────────────────
  const exportData = () => {
    try {
      const payload = {
        app: 'komiku',
        version: 1,
        exportedAt: new Date().toISOString(),
        favorites: useFavorites.getState().favorites,
        history: useHistory.getState().history,
      };
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `komiku-cadangan-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      say(`Cadangan disimpan: ${payload.favorites.length} favorit, ${payload.history.length} riwayat.`);
    } catch { say('Gagal membuat cadangan.'); }
  };

  const importData = async (file: File) => {
    try {
      if (file.size > MAX_IMPORT_BYTES) throw new Error('besar');
      const data = JSON.parse(await file.text());
      if (data?.app !== 'komiku' || !Array.isArray(data.favorites) || !Array.isArray(data.history)) throw new Error('format');

      const favIn: FavoriteItem[] = data.favorites
        .filter((f: any) => f && typeof f.link === 'string' && typeof f.title === 'string')
        .map((f: any) => ({ title: f.title, link: f.link, thumb: typeof f.thumb === 'string' ? f.thumb : '', ...(typeof f.desc === 'string' ? { desc: f.desc } : {}) }));
      const histIn: HistoryItem[] = data.history
        .filter((h: any) => h && typeof h.chapterLink === 'string' && typeof h.mangaTitle === 'string')
        .map((h: any) => ({
          mangaTitle: h.mangaTitle,
          mangaLink: typeof h.mangaLink === 'string' ? h.mangaLink : '',
          mangaThumb: typeof h.mangaThumb === 'string' ? h.mangaThumb : '',
          chapterTitle: typeof h.chapterTitle === 'string' ? h.chapterTitle : '',
          chapterLink: h.chapterLink,
          chapterNumber: typeof h.chapterNumber === 'string' ? h.chapterNumber : String(h.chapterNumber ?? ''),
          pageRead: Number(h.pageRead) || 0,
          totalPages: Number(h.totalPages) || 0,
          readAt: Number(h.readAt) || Date.now(),
        }));

      const favNow = useFavorites.getState().favorites;
      const favKnown = new Set(favNow.map(f => f.link));
      const favNew = favIn.filter((f, i) => !favKnown.has(f.link) && favIn.findIndex(x => x.link === f.link) === i);
      useFavorites.setState({ favorites: [...favNow, ...favNew] });

      const histNow = useHistory.getState().history;
      const byLink = new Map<string, HistoryItem>(histNow.map((h): [string, HistoryItem] => [h.chapterLink, h]));
      let histAdded = 0;
      for (const h of histIn) {
        const cur = byLink.get(h.chapterLink);
        if (!cur) { byLink.set(h.chapterLink, h); histAdded++; }
        else if (h.readAt > cur.readAt) byLink.set(h.chapterLink, h);
      }
      const merged = Array.from(byLink.values()).sort((a, b) => b.readAt - a.readAt).slice(0, 200);
      useHistory.setState({ history: merged });

      say(`Diimpor: ${favNew.length} favorit baru, ${histAdded} riwayat baru.`);
    } catch (e: any) {
      say(e?.message === 'besar' ? 'File terlalu besar.' : 'File bukan cadangan Komikita yang valid.');
    }
  };

  const clearCache = async () => {
    try {
      localStorage.removeItem(HOME_CACHE_KEY);
      if (typeof caches !== 'undefined') {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      readCache();
      say('Cache dihapus. Data beranda dimuat ulang saat dibuka.');
    } catch { say('Gagal menghapus cache.'); }
  };

  const share = async () => {
    const url = window.location.origin;
    const text = 'Baca komik manga, manhwa, manhua gratis dan lengkap di Komikita.';
    try {
      if (navigator.share) { await navigator.share({ title: 'Komikita', text, url }); return; }
      await navigator.clipboard.writeText(url);
      say('Tautan Komikita disalin.');
    } catch (e: any) { if (e?.name !== 'AbortError') say('Tidak bisa membagikan.'); }
  };

  const favCount = mounted ? favorites.length : 0;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: '#1B1A20', color: '#fff', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div style={{ maxWidth: 448, margin: '0 auto', paddingBottom: 'calc(40px + env(safe-area-inset-bottom, 0px))' }}>

        {/* Header */}
        <div style={{ position: 'sticky', top: 0, zIndex: 2, background: '#1B1A20', display: 'flex', alignItems: 'center', gap: 10, padding: 'max(env(safe-area-inset-top, 0px), 14px) 12px 10px' }}>
          <button onClick={goBack} aria-label="Kembali" style={{ background: 'none', border: 0, padding: 8, display: 'flex', cursor: 'pointer', color: '#fff' }}>
            <ArrowLeft size={26} strokeWidth={2} />
          </button>
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: -1.2, lineHeight: 1.1 }}>Pengaturan</h1>
        </div>

        {/* Akun */}
        <Label>Akun</Label>
        <Group>
          {user ? (
            <Row
              href="/profile"
              chevron
              icon={user.photo
                ? <img src={user.photo} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
                : <span style={{ width: 34, height: 34, borderRadius: '50%', background: '#3A3940', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{user.name.charAt(0).toUpperCase()}</span>}
              title={user.name}
              sub="Masuk dengan Google"
            />
          ) : (
            <Row
              onClick={handleLogin}
              chevron
              icon={<span style={{ width: 34, height: 34, borderRadius: '50%', background: '#3A3940', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>?</span>}
              title={ready ? 'Belum masuk' : 'Memuat...'}
              sub={loggingIn ? 'Membuka Google...' : 'Masuk dengan Google'}
            />
          )}
          {user && <Row border icon={<Hash size={22} color={ICON} />} title="ID akun" right={<span style={{ fontFamily: 'monospace', letterSpacing: 2 }}>{numericId(user.uid)}</span>} onClick={copyUid} />}
          {!isPremium && <Row border icon={<Crown size={22} color={ICON} />} title="Jadi Premium" sub="Bebas iklan, unduh massal" chevron onClick={() => say('Fitur Premium segera hadir.')} />}
        </Group>

        {/* Tampilan */}
        <Label>Tampilan</Label>
        <Group>
          <Row icon={<Palette size={22} color={ICON} />} title="Tema" sub="Komikita · Gelap" />
          <Row border icon={<Globe size={22} color={ICON} />} title="Bahasa" right="Indonesia" />
        </Group>

        {/* Baca */}
        <Label>Baca</Label>
        <Group>
          <Row icon={<Smartphone size={22} color={ICON} />} title="Mode baca bawaan" right="Webtoon" />
          <Row border icon={<ImageIcon size={22} color={ICON} />} title="Gambar kualitas rendah" sub="Hemat kuota di jaringan seluler"
            toggle={{ on: mounted && settings.lowQuality, onChange: (v) => settings.setSetting('lowQuality', v) }} />
          <Row border icon={<Download size={22} color={ICON} />} title="Unduh hanya lewat Wi-Fi"
            toggle={{ on: mounted && settings.wifiOnly, onChange: (v) => settings.setSetting('wifiOnly', v) }} />
        </Group>

        {/* Notifikasi */}
        <Label>Notifikasi</Label>
        <Group>
          <Row href="/history" chevron icon={<Bookmark size={22} color={ICON} />} title="Judul yang diikuti" sub="Favorit di Koleksi kamu" right={String(favCount)} />
          <Row border icon={<Bell size={22} color={ICON} />} title="Chapter baru" sub="Untuk judul yang kamu ikuti"
            toggle={{ on: mounted && settings.notifChapter, onChange: (v) => settings.setSetting('notifChapter', v) }} />
          <Row border icon={<Reply size={22} color={ICON} />} title="Balasan untuk komentarku"
            toggle={{ on: mounted && settings.notifReply, onChange: (v) => settings.setSetting('notifReply', v) }} />
          <Row border icon={<Info size={22} color={ICON} />} title="Berita dan info musim"
            toggle={{ on: mounted && settings.notifNews, onChange: (v) => settings.setSetting('notifNews', v) }} />
        </Group>

        {/* Data */}
        <Label>Data</Label>
        <Group>
          <Row icon={<RefreshCw size={22} color={ICON} />} title="Cadangkan dan ekspor" sub="Simpan favorit dan riwayat ke file" chevron onClick={exportData} />
          <Row border icon={<Upload size={22} color={ICON} />} title="Impor cadangan" sub="Gabungkan dari file cadangan Komikita" chevron onClick={() => fileRef.current?.click()} />
          <Row border icon={<Trash2 size={22} color={ICON} />} title="Hapus cache" right={mounted ? `${cacheKb} KB` : ''} onClick={clearCache} />
        </Group>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden
          onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) importData(f); }} />

        {/* Developer */}
        {isDev && (
          <>
            <Label>Developer</Label>
            <Group>
              <Row icon={<Wrench size={22} color={ICON} />} title="Panel Developer" sub="Kelola user, item, dan hadiah" chevron onClick={() => router.push('/profile?dev=1')} />
            </Group>
          </>
        )}

        {/* Dukung */}
        <Label>Dukung Komikita</Label>
        <Group>
          <Row icon={<Share2 size={22} color={ICON} />} title="Bagikan Komikita" chevron onClick={share} />
          <Row border icon={<Bug size={22} color={ICON} />} title="Laporkan bug" chevron onClick={() => window.open('https://github.com/risadalfarisi837-ops/Komiku/issues/new', '_blank')} />
        </Group>

        {/* Tentang */}
        <Label>Tentang</Label>
        <Group>
          <Row icon={<img src="/icon-192.png" alt="" style={{ width: 30, height: 30, borderRadius: 8 }} />} title="Versi Komikita" right={pkg.version} />
          <Row border icon={<Info size={22} color={ICON} />} title="Tentang Komikita" chevron onClick={() => setAboutOpen(true)} />
        </Group>

        {user && (
          <div style={{ marginTop: 26 }}>
            <Group>
              <Row danger icon={<LogOut size={22} color={DANGER} />} title="Keluar" onClick={() => setLogoutOpen(true)} />
            </Group>
          </div>
        )}
      </div>

      <Dialog open={logoutOpen} onClose={() => setLogoutOpen(false)} title="Keluar dari akun?">
        <div style={dialogText}>Favorit dan riwayat bacamu di perangkat ini tetap tersimpan.</div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button onClick={() => setLogoutOpen(false)} style={{ ...dialogBtn, background: '#1F1E24', color: '#fff' }}>Batal</button>
          <button onClick={handleLogout} style={{ ...dialogBtn, background: 'rgba(255,92,92,.16)', color: DANGER }}>Keluar</button>
        </div>
      </Dialog>

      <Dialog open={aboutOpen} onClose={() => setAboutOpen(false)} title="Tentang Komikita">
        <div style={dialogText}>
          Komikita adalah aplikasi web untuk membaca komik manga, manhwa, dan manhua gratis dalam bahasa Indonesia. Data dan gambar komik berasal dari MangaDex.
        </div>
        <button onClick={() => setAboutOpen(false)} style={{ ...dialogBtn, width: '100%', marginTop: 16, background: '#1F1E24', color: '#fff' }}>Tutup</button>
      </Dialog>

      {toast && (
        <div role="status" style={{ position: 'fixed', left: 16, right: 16, bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))', zIndex: 90, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ background: '#3A3940', color: '#fff', padding: '12px 18px', borderRadius: 16, fontSize: 16, fontWeight: 800, letterSpacing: -0.3, maxWidth: 400, textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,.4)' }}>{toast}</div>
        </div>
      )}
    </div>
  );
}
