'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, MessageSquare, Moon, CalendarCheck, Gem, Ticket, Check } from 'lucide-react';
import { getFirebase } from '@/lib/firebase-client';
import { useMissions, MISSIONS, periodKey, type Mission } from '@/lib/missions';
import CheckInCard from '@/components/CheckInCard';
import { fmtC } from '@/lib/season';

const ICONS: Record<Mission['stat'], any> = { read: BookOpen, comment: MessageSquare, night: Moon, days: CalendarCheck };

// Sisa waktu sampai reset (harian: tengah malam, mingguan: Senin 00.00)
function resetIn(scope: 'd' | 'w') {
  const now = new Date();
  const e = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (scope === 'd') e.setDate(e.getDate() + 1);
  else e.setDate(e.getDate() + (8 - (e.getDay() || 7)));
  return fmtLeft(e.getTime() - now.getTime());
}
function fmtLeft(ms: number) {
  const h = Math.max(0, Math.floor(ms / 3600000));
  return h >= 24 ? Math.floor(h / 24) + ' hari ' + (h % 24) + ' jam' : h + ' jam ' + Math.floor((ms % 3600000) / 60000) + ' menit';
}

export default function MisiPage() {
  const router = useRouter();
  const store = useMissions();
  const [mounted, setMounted] = useState(false);
  const [fb, setFb] = useState<any>(null);
  const [uid, setUid] = useState('');
  const [bal, setBal] = useState({ koin: 0, token: 0 });
  const [busy, setBusy] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    let stop = false;
    let off: (() => void) | undefined;
    let balRef: any = null;
    getFirebase().then((f: any) => {
      if (stop) return;
      setFb(f);
      off = f.auth.onAuthStateChanged((u: any) => {
        if (balRef) { balRef.off(); balRef = null; }
        if (stop) return;
        if (!u) { setUid(''); return; }
        setUid(u.uid);
        balRef = f.db.ref('users/' + u.uid);
        balRef.on('value', (snap: any) => {
          const v = snap.val() || {};
          setBal({ koin: Number(v.koin) || 0, token: Number(v.token) || 0 });
        });
      });
    }).catch(() => {});
    return () => { stop = true; if (off) off(); if (balRef) balRef.off(); };
  }, []);

  const say = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2200); };

  const claim = async (m: Mission) => {
    if (!fb || !uid || busy) return;
    setBusy(m.id);
    try {
      const pk = periodKey(m.scope);
      // tandai klaim di server dulu (transaction) supaya nggak bisa dobel dari 2 perangkat
      const mark = await fb.db.ref('users/' + uid + '/missions/' + pk + '_' + m.id).transaction((cur: any) => (cur ? undefined : Date.now()));
      if (!mark.committed) { store.markClaimed(m); say('Sudah diklaim'); return; }
      if (m.crystal) await fb.db.ref('users/' + uid + '/koin').transaction((cur: any) => (Number(cur) || 0) + m.crystal!);
      if (m.token) await fb.db.ref('users/' + uid + '/token').transaction((cur: any) => (Number(cur) || 0) + m.token!);
      store.markClaimed(m);
      say('+' + (m.crystal ? m.crystal + ' Crystal' : m.token + ' Token'));
    } catch (e: any) {
      say('Gagal klaim: ' + (e?.message || 'coba lagi'));
    } finally { setBusy(''); }
  };

  const section = (scope: 'd' | 'w', title: string) => (
    <div className="px-5 pt-7">
      <div className="flex items-baseline justify-between pb-3">
        <h2 className="text-2xl font-extrabold">{title}</h2>
        <span className="text-base font-bold text-white/45">Reset {resetIn(scope)} lagi</span>
      </div>
      <div className="space-y-3">
        {MISSIONS.filter((m) => m.scope === scope).map((m) => {
          const Icon = ICONS[m.stat];
          const pg = mounted ? Math.min(store.progress(m), m.target) : 0;
          const done = pg >= m.target;
          const got = mounted && !!store.claimed[periodKey(m.scope) + ':' + m.id];
          return (
            <div key={m.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: done ? 'rgba(52,211,153,.18)' : 'rgba(255,255,255,.08)' }}>
                  <Icon className="w-6 h-6" color={done ? '#34D399' : '#fff'} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xl font-extrabold leading-tight">{m.title}</p>
                  <p className="text-sm font-bold text-white/45 truncate">{m.sub}</p>
                </div>
                <div className="shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 bg-black/30 text-base font-extrabold" style={{ color: m.crystal ? '#f1c40f' : '#7dd3fc' }}>
                  {m.crystal ? <Gem className="w-4 h-4" /> : <Ticket className="w-4 h-4" />}
                  {m.crystal || m.token}
                </div>
              </div>
              <div className="mt-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: (pg / m.target) * 100 + '%', background: done ? '#34D399' : '#FF6B6B' }} />
                  </div>
                  <p className="mt-1 text-sm font-bold text-white/50">{pg}/{m.target}</p>
                </div>
                {got ? (
                  <span className="flex items-center gap-1 px-4 py-2 rounded-full text-base font-extrabold text-emerald-400 bg-emerald-400/10"><Check className="w-4 h-4" />Diklaim</span>
                ) : (
                  <button
                    disabled={!done || busy === m.id}
                    onClick={() => (uid ? claim(m) : say('Login dulu untuk klaim hadiah'))}
                    className="px-5 py-2 rounded-full text-base font-extrabold text-white disabled:opacity-40 active:scale-95 transition-transform"
                    style={{ background: '#FF6B6B' }}
                  >{busy === m.id ? '...' : 'Klaim'}</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen text-white max-w-md mx-auto pb-16 -mb-28" style={{ background: 'radial-gradient(ellipse at top, #151c34 0%, #0b0f1d 60%, #070a14 100%)' }}>
      <div className="flex items-center gap-4 px-6 pt-8 pb-5">
        <button onClick={() => router.back()} aria-label="Kembali" className="p-1"><ArrowLeft className="w-7 h-7" /></button>
        <h1 className="text-4xl font-extrabold tracking-tight">Misi</h1>
      </div>

      <div className="mx-5 flex rounded-3xl border border-white/10 bg-white/5 py-4">
        <div className="flex-1 text-center">
          <p className="text-3xl font-extrabold flex items-center justify-center gap-2" style={{ color: '#f1c40f' }}><Gem className="w-6 h-6" />{fmtC(bal.koin)}</p>
          <p className="text-base font-bold text-white/50">Crystal</p>
        </div>
        <div className="w-px bg-white/10" />
        <div className="flex-1 text-center">
          <p className="text-3xl font-extrabold flex items-center justify-center gap-2" style={{ color: '#7dd3fc' }}><Ticket className="w-6 h-6" />{fmtC(bal.token)}</p>
          <p className="text-base font-bold text-white/50">Token</p>
        </div>
      </div>

      <div className="px-5 pt-5"><CheckInCard /></div>

      {section('d', 'Misi harian')}
      {section('w', 'Misi mingguan')}

      <p className="px-6 pt-6 text-sm font-bold text-white/35">Progres baca dihitung dari chapter baru di perangkat ini. Login untuk mengklaim hadiah. Pengguna Premium dapat +1 Token di setiap komentar, tanpa batas.</p>

      {toast && (
        <div className="fixed bottom-10 inset-x-0 z-[60] flex justify-center pointer-events-none">
          <span className="px-5 py-3 rounded-full bg-black/85 text-white text-base font-bold">{toast}</span>
        </div>
      )}
    </div>
  );
}
