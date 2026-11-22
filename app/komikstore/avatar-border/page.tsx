'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getFirebase } from '@/lib/firebase-client';
import BorderShopModal, { BORDER_CATALOG } from '@/components/BorderSheet';

const Modal: any = BorderShopModal;

export default function AvatarBorderPage() {
  const router = useRouter();
  const [fb, setFb] = useState<any>(null);
  const [uid, setUid] = useState('');
  const [ready, setReady] = useState(false);
  const [d, setD] = useState<any>({});

  useEffect(() => {
    let stop = false;
    let off: (() => void) | undefined;
    getFirebase().then((f: any) => {
      if (stop) return;
      setFb(f);
      off = f.auth.onAuthStateChanged(async (u: any) => {
        if (stop) return;
        if (!u) { setUid(''); setReady(true); return; }
        setUid(u.uid);
        try {
          const v = (await f.db.ref('users/' + u.uid).get()).val() || {};
          if (!stop) setD({ ...v, photoURL: v.photoURL || u.photoURL || '' });
        } catch {}
        if (!stop) setReady(true);
      });
    }).catch(() => setReady(true));
    return () => { stop = true; if (off) off(); };
  }, []);

  const ref = () => fb.db.ref('users/' + uid);

  const equip = async (key: string | null) => {
    if (!fb || !uid) return;
    const k = key || '';
    await ref().update({ activeBorder: k });
    setD((p: any) => ({ ...p, activeBorder: k }));
  };

  const buy = async (key: string, harga?: number) => {
    if (!fb || !uid) return;
    const price = (BORDER_CATALOG as any)[key]?.harga ?? harga ?? 0;
    const cur = ((await ref().get()).val() || {}).koin || 0;
    if (cur < price) return;
    await ref().update({ koin: cur - price, ['ownedBorders/' + key]: true, activeBorder: key });
    setD((p: any) => ({
      ...p,
      koin: cur - price,
      ownedBorders: { ...(p.ownedBorders || {}), [key]: true },
      activeBorder: key,
    }));
  };

  const owned = Object.keys(d.ownedBorders || {}).filter((k) => d.ownedBorders[k]);

  return (
    <div className="fixed inset-0 overflow-hidden text-white"
      style={{ background: 'radial-gradient(ellipse at top,#151c34 0%,#0b0f1d 60%,#070a14 100%)' }}>
      <div className="flex items-center gap-4 px-5 pt-8">
        <button onClick={() => router.back()} className="active:scale-90 transition-transform">
          <ArrowLeft className="w-7 h-7" />
        </button>
        <h1 className="text-2xl font-black">Avatar Border</h1>
      </div>
      {ready && !uid && <p className="px-5 pt-10 text-white/60">Login dulu buat ganti border.</p>}
      {ready && uid && (
        <Modal open onClose={() => router.back()} photoURL={d.photoURL} activeBorder={d.activeBorder || ''}
          ownedBorders={owned} koin={d.koin || 0} uid={uid} onEquip={equip} onBuy={buy} />
      )}
    </div>
  );
}
