'use client';

import { useEffect, useState } from 'react';
import { getFirebase } from '@/lib/firebase-client';
import { weekKey } from '@/lib/missions';

// Cek-in harian mingguan (Senin–Minggu). Hari yang terlewat tidak bisa diklaim belakangan.
const DAYS = ['S', 'S', 'R', 'K', 'J', 'S', 'M'];
const REWARD: { c?: number; t?: number }[] = [{ c: 5 }, { c: 5 }, { c: 10 }, { c: 10 }, { c: 15 }, { c: 15 }, { c: 30, t: 1 }];
const todayIdx = () => (new Date().getDay() + 6) % 7;
const label = (r: { c?: number; t?: number }) => [r.c ? '+' + r.c + ' Crystal' : '', r.t ? '+' + r.t + ' Token' : ''].filter(Boolean).join(' & ');

function Star({ size, style }: { size: number; style: any }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ position: 'absolute', pointerEvents: 'none', animation: 'ciTwinkle 3s ease-in-out infinite', ...style }}>
      <path d="M12 0 L14.2 9.8 L24 12 L14.2 14.2 L12 24 L9.8 14.2 L0 12 L9.8 9.8 Z" fill="#cffafe" />
    </svg>
  );
}

export default function CheckInCard() {
  const [fb, setFb] = useState<any>(null);
  const [uid, setUid] = useState('');
  const [got, setGot] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const today = todayIdx();

  useEffect(() => {
    let stop = false;
    let off: (() => void) | undefined;
    let ref: any = null;
    getFirebase().then((f: any) => {
      if (stop) return;
      setFb(f);
      off = f.auth.onAuthStateChanged((u: any) => {
        if (ref) { ref.off(); ref = null; }
        if (stop) return;
        if (!u) { setUid(''); setGot([]); return; }
        setUid(u.uid);
        ref = f.db.ref('users/' + u.uid + '/checkin/' + weekKey());
        ref.on('value', (snap: any) => setGot(Object.keys(snap.val() || {}).map(Number)));
      });
    }).catch(() => {});
    return () => { stop = true; if (off) off(); if (ref) ref.off(); };
  }, []);

  const say = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2200); };
  const done = got.includes(today);

  const claim = async () => {
    if (!uid) { say('Login dulu untuk cek-in'); return; }
    if (!fb || busy || done) return;
    setBusy(true);
    try {
      const mark = await fb.db.ref('users/' + uid + '/checkin/' + weekKey() + '/' + today).transaction((cur: any) => (cur ? undefined : Date.now()));
      if (mark.committed) {
        const r = REWARD[today];
        if (r.c) await fb.db.ref('users/' + uid + '/koin').transaction((cur: any) => (Number(cur) || 0) + r.c!);
        if (r.t) await fb.db.ref('users/' + uid + '/token').transaction((cur: any) => (Number(cur) || 0) + r.t!);
        say(label(r));
      }
    } catch (e: any) { say('Gagal: ' + (e?.message || 'coba lagi')); }
    finally { setBusy(false); }
  };

  const R = 40, C = 2 * Math.PI * R;
  const frac = got.length / 7;

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 26, padding: '18px 16px 16px', color: '#fff', border: '1.5px solid rgba(94,234,212,0.45)', background: 'radial-gradient(120% 140% at 0% 0%, #1f7a8c 0%, #0f4c5c 45%, #082a36 100%)', boxShadow: '0 8px 30px rgba(8,145,178,0.25)' }}>
      <style>{`@keyframes ciTwinkle { 0%,100% { opacity: .25; transform: scale(.8) } 50% { opacity: 1; transform: scale(1.1) } }`}</style>
      <Star size={16} style={{ top: 10, left: 130, animationDelay: '0s' }} />
      <Star size={12} style={{ top: 70, right: 10, animationDelay: '1s' }} />
      <Star size={14} style={{ bottom: 12, left: 10, animationDelay: '2s' }} />
      <Star size={10} style={{ bottom: 50, right: 40, animationDelay: '1.5s' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ position: 'relative', width: 92, height: 92, flexShrink: 0 }}>
          <svg width="92" height="92" viewBox="0 0 92 92" style={{ transform: 'rotate(-90deg)' }}>
            <defs><linearGradient id="ciG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#5eead4" /><stop offset="1" stopColor="#facc15" /></linearGradient></defs>
            <circle cx="46" cy="46" r={R} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="9" />
            <circle cx="46" cy="46" r={R} fill="none" stroke="url(#ciG)" strokeWidth="9" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - frac)} style={{ transition: 'stroke-dashoffset .6s' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800 }}>{got.length}/7</div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'inline-block', background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '3px 9px', fontSize: 12, fontWeight: 800, letterSpacing: 0.6 }}>✦ EVENT MINGGUAN</span>
          <div style={{ fontSize: 25, fontWeight: 800, letterSpacing: -0.7, marginTop: 4 }}>Cek-in Harian</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.65)', marginTop: 1 }}>
            {!uid ? 'Login untuk mulai cek-in' : done ? 'Hadiah hari ini sudah diambil' : '1 quest siap diklaim · ' + label(REWARD[today])}
          </div>
        </div>

        <button onClick={claim} disabled={busy || done} style={{ flexShrink: 0, border: 0, borderRadius: 99, height: 44, padding: '0 18px', fontSize: 16, fontWeight: 800, letterSpacing: 0.4, cursor: done ? 'default' : 'pointer', background: done ? 'rgba(255,255,255,0.14)' : '#d1faf5', color: done ? 'rgba(255,255,255,0.6)' : '#083344', opacity: busy ? 0.6 : 1 }}>
          {done ? '✓ SELESAI' : busy ? '...' : 'KLAIM'}
        </button>
      </div>

      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', marginTop: 18, padding: '0 6px' }}>
        <div style={{ position: 'absolute', top: 14, left: 20, right: 20, height: 3, borderRadius: 3, background: 'rgba(94,234,212,0.35)' }} />
        {DAYS.map((d, i) => {
          const ok = got.includes(i);
          const isToday = i === today;
          return (
            <div key={i} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, width: 30 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: ok ? '#22d3ee' : isToday ? '#d1faf5' : '#0b3a47', border: isToday && !ok ? '2px solid #5eead4' : ok ? 'none' : '1.5px solid rgba(94,234,212,0.4)', boxShadow: isToday && !ok ? '0 0 0 4px rgba(94,234,212,0.25)' : 'none', color: '#083344', fontSize: 15, fontWeight: 800 }}>
                {ok ? '✓' : i === 6 ? '🎁' : ''}
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: isToday ? '#fff' : 'rgba(255,255,255,0.6)' }}>{d}</span>
            </div>
          );
        })}
      </div>

      {toast && <div style={{ position: 'absolute', left: 0, right: 0, bottom: 8, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}><span style={{ background: 'rgba(0,0,0,0.8)', padding: '6px 14px', borderRadius: 99, fontSize: 14, fontWeight: 800 }}>{toast}</span></div>}
    </div>
  );
}
