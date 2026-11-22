'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUserStats } from '@/lib/store';
import { currentSeason } from '@/lib/season';
import { heldLencana, findLencana, loadEquipped, saveEquipped } from '@/lib/lencana';
import { LencanaPill } from '@/components/LencanaBadge';
import { getFirebase, getUser, pushSeasonScore } from '@/lib/leaderboard';

const CORAL = '#FF6B6B';
const CARD = '#2A2931';
const MUTED = '#8F8D9B';
const MAX_NAME = 50;

const Back = () => (
  <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 5l-7 7 7 7" /></svg>
);

// Kecilkan foto jadi 256px supaya muat disimpan di database
function resizeToDataUrl(file: File, max = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(1, max / Math.min(img.width, img.height));
      const w = Math.round(img.width * s), h = Math.round(img.height * s);
      const side = Math.min(w, h);
      const c = document.createElement('canvas');
      c.width = side; c.height = side;
      c.getContext('2d')!.drawImage(img, (w - side) / -2, (h - side) / -2, w, h);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Gambar tidak bisa dibaca')); };
    img.src = url;
  });
}

export default function EditProfilPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const season = currentSeason();
  const seasonStats = useUserStats((s) => s.season);

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState('');
  const [orig, setOrig] = useState({ name: '', photo: '' });
  const [equippedId, setEquippedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => { setMounted(true); setEquippedId(loadEquipped()); }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const u = await getUser();
        if (!alive) return;
        if (!u) { setLoading(false); return; }
        setUid(u.uid);
        setEmail(u.email || '');
        let n = u.displayName || '';
        let p = u.photoURL || '';
        try {
          const { db } = await getFirebase();
          const v = (await db.ref(`users/${u.uid}`).get()).val();
          if (v?.displayName) n = v.displayName;
          if (v?.photoURL !== undefined) p = v.photoURL;
          if (v?.email) setEmail(v.email);
          if (v?.lencana) { setEquippedId(v.lencana); saveEquipped(v.lencana); }
        } catch {}
        if (!alive) return;
        setName(n); setPhoto(p); setOrig({ name: n, photo: p });
      } finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  const pts = mounted && seasonStats.id === season.id ? seasonStats.points : 0;
  const lencana = findLencana(equippedId) || heldLencana(pts);
  const trimmed = name.trim();
  const dirty = trimmed !== orig.name || photo !== orig.photo;
  const valid = trimmed.length >= 2 && trimmed.length <= MAX_NAME;
  const canSave = dirty && valid && !saving && !!uid;

  const pickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setErr('');
    try { setPhoto(await resizeToDataUrl(f)); } catch (x: any) { setErr(x.message || 'Gagal memuat foto'); }
  };

  const save = async () => {
    if (!canSave || !uid) return;
    setSaving(true); setErr('');
    try {
      const { db } = await getFirebase();
      await db.ref(`users/${uid}`).update({ displayName: trimmed, photoURL: photo });
      setOrig({ name: trimmed, photo });
      pushSeasonScore();
      router.back();
    } catch (x: any) {
      setErr('Gagal menyimpan: ' + (x?.message || 'coba lagi'));
    } finally { setSaving(false); }
  };

  const initials = (trimmed || 'U').slice(0, 2).toUpperCase();

  return (
    <div style={{ background: '#1B1A20', color: '#fff', minHeight: '100vh', paddingBottom: 120 }}>
      <style>{`button { font-family: inherit; cursor: pointer; } input { font-family: inherit; }`}</style>

      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 12px 10px', gap: 12 }}>
        <button onClick={() => router.back()} aria-label="Kembali" style={{ background: 'none', border: 0, padding: 6, display: 'flex' }}><Back /></button>
        <div style={{ fontSize: 25, fontWeight: 800, letterSpacing: -0.8 }}>Edit profil</div>
      </div>

      {loading ? (
        <div style={{ padding: '80px 20px', textAlign: 'center', color: MUTED, fontWeight: 700 }}>Memuat...</div>
      ) : !uid ? (
        <div style={{ padding: '70px 24px', textAlign: 'center', color: MUTED, fontWeight: 700, lineHeight: 1.5 }}>
          Masuk dulu untuk mengedit profil.
          <div style={{ marginTop: 18 }}>
            <Link href="/profile" style={{ display: 'inline-block', background: CORAL, color: '#fff', padding: '10px 26px', borderRadius: 99, fontWeight: 800, textDecoration: 'none' }}>Masuk</Link>
          </div>
        </div>
      ) : (
        <>
          {/* Foto */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
            <div style={{ position: 'relative', width: 126, height: 126 }}>
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="" referrerPolicy="no-referrer" style={{ width: 126, height: 126, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ width: 126, height: 126, borderRadius: '50%', background: '#4A2A2E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 46, fontWeight: 800 }}>{initials}</div>
              )}
              <button onClick={() => fileRef.current?.click()} aria-label="Ganti foto" style={{ position: 'absolute', right: -6, bottom: -4, width: 44, height: 44, borderRadius: '50%', background: CORAL, border: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x={3.5} y={3.5} width={17} height={17} rx={3.5} /><circle cx={9} cy={9} r={1.6} /><path d="M20 15.5l-4.5-4.5L6 20.5" /></svg>
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={pickFile} style={{ display: 'none' }} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 44, marginTop: 18 }}>
            <button onClick={() => fileRef.current?.click()} style={{ background: 'none', border: 0, color: CORAL, fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>Ganti foto</button>
            <button onClick={() => setPhoto('')} disabled={!photo} style={{ background: 'none', border: 0, color: CORAL, fontSize: 20, fontWeight: 800, letterSpacing: -0.5, opacity: photo ? 1 : 0.4 }}>Hapus foto</button>
          </div>

          <div style={{ padding: '0 16px' }}>
            {/* Nama */}
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.7, margin: '34px 0 8px' }}>Nama tampilan</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, MAX_NAME))}
              style={{ width: '100%', boxSizing: 'border-box', background: '#2A2931', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: '16px 18px', color: '#fff', fontSize: 22, fontWeight: 800, letterSpacing: -0.6, outline: 'none' }}
            />
            <div style={{ color: MUTED, fontSize: 17, fontWeight: 800, letterSpacing: -0.4, lineHeight: 1.3, marginTop: 8 }}>
              Tampil di komentar dan papan peringkat. {name.length} dari {MAX_NAME} karakter.
            </div>

            {/* Email */}
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.7, margin: '22px 0 8px' }}>Email</div>
            <div style={{ background: '#2A2931', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: '16px 18px', color: MUTED, fontSize: 22, fontWeight: 800, letterSpacing: -0.6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email || '—'}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: MUTED, fontSize: 18, fontWeight: 800, letterSpacing: -0.4, marginTop: 10 }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><rect x={5} y={11} width={14} height={9} rx={2} /><path d="M8 11V8a4 4 0 018 0v3" /></svg>
              Dari akun Google-mu
            </div>

            {/* Lencana */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: CARD, borderRadius: 18, padding: '18px 20px', marginTop: 18 }}>
              <LencanaPill l={lencana} />
              <div style={{ flex: 1, fontSize: 19, fontWeight: 800, letterSpacing: -0.5, color: MUTED, lineHeight: 1.25 }}>Lencana yang dipakai</div>
              <Link href="/ranking/lencana" style={{ color: CORAL, fontSize: 20, fontWeight: 800, letterSpacing: -0.5, textDecoration: 'none', padding: '4px 8px' }}>Ganti</Link>
            </div>

            {err && <div style={{ color: CORAL, fontSize: 15, fontWeight: 700, marginTop: 14 }}>{err}</div>}
          </div>

          {/* Tombol simpan */}
          <div style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 0, width: 'min(100%, 448px)', padding: '12px 16px calc(14px + env(safe-area-inset-bottom, 0px))', background: 'linear-gradient(180deg, rgba(27,26,32,0), #1B1A20 40%)', zIndex: 40 }}>
            <button onClick={save} disabled={!canSave} style={{ width: '100%', height: 62, borderRadius: 31, border: 0, background: canSave ? CORAL : '#6F3A40', color: canSave ? '#fff' : '#9A7479', fontSize: 23, fontWeight: 800, letterSpacing: -0.6 }}>
              {saving ? 'Menyimpan...' : 'Simpan perubahan'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
