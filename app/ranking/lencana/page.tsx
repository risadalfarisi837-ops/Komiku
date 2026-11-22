'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStats } from '@/lib/store';
import { currentSeason, fmt, POINTS_PER_CHAPTER, DAILY_BONUS, NIGHT_BONUS } from '@/lib/season';
import {
  TRACKS, TrackName, byTrack, heldLencana, loadBest, recordHeld, mergeBest, isUnlocked, findLencana,
  loadEquipped, saveEquipped, RARITY_COLOR, TRACK_INFO, Lencana,
} from '@/lib/lencana';
import { LencanaIcon } from '@/components/LencanaBadge';
import { getFirebase, getUser } from '@/lib/leaderboard';

const CORAL = '#FF6B6B';
const CARD = '#2A2931';
const MUTED = '#8F8D9B';
const UNDERLINE: Record<TrackName, string> = { Noble: '#3B5BC9', Murim: '#0E8A6A', Demon: '#8A1F34' };

const Back = () => (
  <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 5l-7 7 7 7" /></svg>
);

function TabIcon({ t, on }: { t: TrackName; on: boolean }) {
  const col = t === 'Noble' ? '#27479E' : t === 'Murim' ? '#0F6B55' : '#8A1F34';
  const fill = on ? col : '#3A3940';
  const mark = on ? '#fff' : MUTED;
  const line = { stroke: on ? '#8D7BFF' : 'rgba(255,255,255,.25)', strokeWidth: 1.4, strokeLinejoin: 'round' as const };
  return (
    <svg width={26} height={26} viewBox="0 0 24 24">
      {t === 'Noble' && <><path d="M12 2.5l8 3v6c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10v-6l8-3z" fill={fill} {...line} /><path d="M7.5 14.5V9.5l2.2 2L12 8l2.3 3.5 2.2-2v5z" fill={on ? '#F5C84B' : mark} /></>}
      {t === 'Murim' && <><path d="M8.5 2.5h7l6 6v7l-6 6h-7l-6-6v-7z" fill={fill} {...line} stroke={on ? '#8D7BFF' : 'rgba(255,255,255,.25)'} /><circle cx={12} cy={9.3} r={1.9} fill={mark} /><path d="M7.8 16.5c0-2.6 1.9-4.2 4.2-4.2s4.2 1.6 4.2 4.2z" fill={mark} /></>}
      {t === 'Demon' && <><path d="M3.5 3l4.5 3h8l4.5-3-1.2 8c0 5.5-3.2 9.2-7.3 10.5C7.9 20.2 4.7 16.5 4.7 11z" fill={fill} {...line} stroke={on ? '#C25AFF' : 'rgba(255,255,255,.25)'} /><circle cx={9} cy={11} r={1.5} fill={mark} /><circle cx={15} cy={11} r={1.5} fill={mark} /></>}
    </svg>
  );
}

function RarityDot({ color }: { color: string }) {
  return (
    <span style={{ width: 16, height: 16, borderRadius: '50%', border: `2.5px solid ${color}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 16px' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
    </span>
  );
}

export default function LencanaPage() {
  const router = useRouter();
  const season = currentSeason();
  const season_ = useUserStats((s) => s.season);
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<TrackName>('Noble');
  const [best, setBest] = useState(loadBest());
  const [equipped, setEquipped] = useState<string | null>(null);
  const [info, setInfo] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const pts = mounted && season_.id === season.id ? season_.points : 0;
  const held = heldLencana(pts);

  useEffect(() => {
    if (!mounted) return;
    setBest(recordHeld(held));
    const eq = loadEquipped();
    setEquipped(eq || held.id);
    setTab(held.track);

    // Data dari server: lencana yang dibuka/dipasang developer ikut muncul
    let stop = false;
    (async () => {
      try {
        const user = await getUser();
        if (!user || stop) return;
        const { db } = await getFirebase();
        const u = (await db.ref(`users/${user.uid}`).get()).val() || {};
        if (stop) return;
        if (u.lencanaBest) setBest(mergeBest(u.lencanaBest));
        if (u.lencana && findLencana(u.lencana)) { setEquipped(u.lencana); saveEquipped(u.lencana); }
      } catch {}
    })();
    return () => { stop = true; };
  }, [mounted, held.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const equip = async (l: Lencana) => {
    setEquipped(l.id);
    saveEquipped(l.id);
    try {
      const user = await getUser();
      if (!user) return;
      const { db } = await getFirebase();
      await db.ref(`users/${user.uid}`).update({ lencana: l.id });
      // Perbarui baris papan peringkat musim ini (kalau sudah ada)
      const lb = db.ref(`leaderboard/s${season.id}/${user.uid}`);
      if ((await lb.get()).exists()) await lb.child('lencana').set(l.id);
    } catch {}
  };

  const list = byTrack(tab);
  const info_ = TRACK_INFO[tab];
  const onTrack = held.track === tab;

  return (
    <div style={{ background: '#1B1A20', color: '#fff', minHeight: '100vh', paddingBottom: 40 }}>
      <style>{`button { font-family: inherit; cursor: pointer; } .no-scrollbar::-webkit-scrollbar { display: none; }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 12px 10px', gap: 12 }}>
        <button onClick={() => router.back()} aria-label="Kembali" style={{ background: 'none', border: 0, padding: 6, display: 'flex' }}><Back /></button>
        <div style={{ flex: 1, fontSize: 25, fontWeight: 800, letterSpacing: -0.8 }}>Lencana</div>
        <button onClick={() => setInfo(true)} aria-label="Info" style={{ background: 'none', border: 0, padding: 8, display: 'flex' }}>
          <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round"><circle cx={12} cy={12} r={9.5} /><line x1={12} y1={11} x2={12} y2={17} /><circle cx={12} cy={7.6} r={0.6} fill="#fff" /></svg>
        </button>
      </div>

      {/* Tab jalur */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,.12)' }}>
        {TRACKS.map((t) => {
          const on = tab === t;
          return (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, background: 'none', border: 0, color: on ? '#fff' : MUTED, fontSize: 21, fontWeight: 800, letterSpacing: -0.6, padding: '10px 0 0' }}>
              <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 6px 12px' }}>
                <TabIcon t={t} on={on} />{t}
                {on && <span style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, borderRadius: '3px 3px 0 0', background: UNDERLINE[t] }} />}
              </span>
            </button>
          );
        })}
      </div>

      {/* Deskripsi jalur */}
      <div style={{ padding: '16px 16px 14px', color: MUTED, fontSize: 18, fontWeight: 800, lineHeight: 1.35, letterSpacing: -0.5 }}>
        {info_.desc}, dari {info_.first} sampai {info_.last}.{' '}
        {onTrack ? `Kamu ada di jalur ini dan memegang ${held.name}.` : 'Lencana dari musim-musim lalu tetap terbuka.'}
      </div>

      {/* Grid lencana */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '0 14px', alignItems: 'start' }}>
        {list.map((l) => {
          const open = isUnlocked(l, best);
          const on = equipped === l.id && open;
          return (
            <button
              key={l.id}
              onClick={() => open && equip(l)}
              style={{
                position: 'relative', background: CARD, borderRadius: 18, padding: '16px 4px 14px', border: on ? `2px solid ${CORAL}` : '2px solid transparent',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: '#fff', minHeight: 158,
              }}
            >
              <LencanaIcon l={l} locked={!open} size={74} />
              <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.15, marginTop: 6, color: open ? '#fff' : '#77757F', textAlign: 'center', wordBreak: 'break-word' }}>{l.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 17, fontWeight: 800, letterSpacing: -0.4, color: open ? '#fff' : '#77757F' }}>
                <RarityDot color={RARITY_COLOR[l.rarity]} />{l.rarity}
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: MUTED, letterSpacing: -0.3 }}>Tingkat {l.tier}</div>
              {on && (
                <span style={{ marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 4, background: CORAL, color: '#fff', padding: '2px 14px 3px', borderRadius: 99, fontSize: 16, fontWeight: 800 }}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>Dipakai
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Lembar info */}
      {info && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div onClick={() => setInfo(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.6)' }} />
          <div style={{ position: 'relative', background: '#16151A', borderRadius: '28px 28px 0 0', padding: '14px 20px 30px', width: 'min(100%, 448px)', margin: '0 auto' }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.2)', margin: '0 auto 16px' }} />
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -1 }}>Cara dapat lencana</div>
            <div style={{ color: '#D6D4DE', fontWeight: 700, fontSize: 15, lineHeight: 1.6, marginTop: 8 }}>
              • {POINTS_PER_CHAPTER} poin tiap chapter baru dibaca<br />
              • +{DAILY_BONUS} poin untuk chapter pertama tiap hari<br />
              • +{NIGHT_BONUS} poin kalau baca jam 22.00–04.59<br />
              • Poinmu sekarang: {fmt(pts)}<br />
              • Lencana dari musim lalu tetap terbuka<br />
              • Ketuk lencana yang terbuka untuk memakainya
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
