'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import GiftEffect from '@/components/GiftEffect';
import GiftVisual from '@/components/GiftVisual';
import { getFirebase } from '@/lib/firebase-client';
import { giftTitle, GIFT_TYPE_LABEL } from '@/lib/gifts';

// Pengamat global (dipasang di layout): memutar animasi di layar penerima saat
//  1. ada hadiah baru dari Developer (Crystal, level, EXP, poin, border, wallpaper, efek), dan
//  2. Premium baru saja aktif (setelah pesanan disetujui atau diberikan Developer).
// Yang sudah pernah diputar dicatat di perangkat supaya tidak muncul dua kali.

type Fx = { id: number; title: string; sub?: string; duration: number; visual?: ReactNode };

const giftSeenKey = (uid: string) => `komiku-gift-seen:${uid}`;
const premSeenKey = (uid: string) => `komiku-prem-seen:${uid}`;

function describeGift(g: any): { title: string; sub: string } {
  const from = g.from || 'Developer';
  const isNumber = g.type === 'koin' || g.type === 'level' || g.type === 'exp' || g.type === 'poin';
  const title = isNumber ? giftTitle(g.type, Number(g.amount) || 0) : (g.itemName || GIFT_TYPE_LABEL[g.type as keyof typeof GIFT_TYPE_LABEL] || 'Hadiah baru');
  const kind = isNumber ? '' : `${GIFT_TYPE_LABEL[g.type as keyof typeof GIFT_TYPE_LABEL] || 'Hadiah'} · `;
  const msg = g.message ? ` “${g.message}”` : '';
  return { title, sub: `${kind}Hadiah dari ${from}.${msg} Klaim di Notifikasi.` };
}

export default function GiftWatcher() {
  const [queue, setQueue] = useState<Fx[]>([]);
  const counter = useRef(0);
  const fx = queue[0] || null;

  useEffect(() => {
    let alive = true;
    let unAuth: (() => void) | null = null;
    let detach: (() => void) | null = null;
    const push = (f: Omit<Fx, 'id'>) => { if (alive) setQueue((q) => [...q, { ...f, id: ++counter.current }]); };

    (async () => {
      try {
        const { auth, db } = await getFirebase();
        unAuth = auth.onAuthStateChanged((u: any) => {
          detach?.(); detach = null;
          if (!u || !alive) return;
          const uid: string = u.uid;
          const gRef = db.ref(`users/${uid}/gifts`);
          const pRef = db.ref(`users/${uid}/premiumUntil`);

          const onGifts = (snap: any) => {
            const v = snap.val() || {};
            const unclaimed = Object.entries(v)
              .filter(([, g]: any) => g && !g.claimed)
              .map(([id, g]: any) => ({ id, ...g }));
            const ids = unclaimed.map((g) => g.id);
            let seen: string[] | null = null;
            try { const raw = localStorage.getItem(giftSeenKey(uid)); seen = raw ? JSON.parse(raw) : null; } catch {}
            try { localStorage.setItem(giftSeenKey(uid), JSON.stringify(ids)); } catch {}
            if (seen === null) return; // pertama kali: jangan putar hadiah lama
            unclaimed
              .filter((g) => !seen!.includes(g.id))
              .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
              .forEach((g) => { const d = describeGift(g); push({ title: d.title, sub: d.sub, duration: 3800, visual: <GiftVisual type={g.type} itemKey={g.itemKey} photo={u.photoURL || ''} /> }); });
          };

          const onPremium = (snap: any) => {
            const val = Number(snap.val()) || 0;
            let prev: number | null = null;
            try { const raw = localStorage.getItem(premSeenKey(uid)); prev = raw === null ? null : Number(raw); } catch {}
            // simpan nilai tertinggi: nilai sesaat 0 (saat data pengguna ditulis ulang) tidak boleh menurunkan catatan
            try { localStorage.setItem(premSeenKey(uid), String(Math.max(prev ?? 0, val))); } catch {}
            if (prev === null) return; // pertama kali: hanya catat
            if (val > prev && val > Date.now()) {
              const until = new Date(val).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
              push({ title: 'Premium aktif!', sub: `Aktif sampai ${until}. Terima kasih sudah mendukung Komiku!`, duration: 4500, visual: <GiftVisual type="premium" /> });
            }
          };

          gRef.on('value', onGifts);
          pRef.on('value', onPremium);
          detach = () => { gRef.off('value', onGifts); pRef.off('value', onPremium); };
        });
      } catch {}
    })();

    return () => { alive = false; detach?.(); unAuth?.(); };
  }, []);

  // getar singkat saat animasi mulai (kalau perangkat mendukung)
  useEffect(() => {
    if (fx) { try { navigator.vibrate?.([70, 40, 70]); } catch {} }
  }, [fx?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <GiftEffect
      key={fx?.id ?? 0}
      show={!!fx}
      title={fx?.title}
      sub={fx?.sub}
      duration={fx?.duration}
      visual={fx?.visual}
      onDone={() => setQueue((q) => q.slice(1))}
    />
  );
}
