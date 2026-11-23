'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

function useFirebasePhoto() {
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  useEffect(() => {
    const tryGetPhoto = () => {
      if (typeof window === 'undefined' || !(window as any).firebase) return;
      try {
        const auth = (window as any).firebase.auth();
        auth.onAuthStateChanged(async (u: any) => { setPhotoURL(u?.photoURL ?? null); if (!u) return; try { const v = (await (window as any).firebase.database().ref("users/" + u.uid + "/photoURL").get()).val(); if (typeof v === "string") setPhotoURL(v || null); } catch {} });
      } catch {}
    };
    if ((window as any).firebase) {
      tryGetPhoto();
    } else {
      const interval = setInterval(() => {
        if ((window as any).firebase) { clearInterval(interval); tryGetPhoto(); }
      }, 300);
      return () => clearInterval(interval);
    }
  }, []);
  return photoURL;
}

type IconProps = { color: string; filled: boolean };
const svg = { width: 26, height: 26, viewBox: '0 0 24 24', fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

const HomeIcon = ({ color, filled }: IconProps) => (
  <svg {...svg} fill={filled ? color : 'none'} stroke={color} strokeWidth={2}>
    <path d="M12 3L3.5 10.2V20a1 1 0 001 1H9v-6h6v6h4.5a1 1 0 001-1v-9.8L12 3z" />
  </svg>
);
const CompassIcon = ({ color, filled }: IconProps) => (
  <svg {...svg} stroke={color} strokeWidth={2}>
    <circle cx="12" cy="12" r="9.5" />
    <polygon points="16 8 14 14 8 16 10 10 16 8" fill={filled ? color : 'none'} />
  </svg>
);
const RankingIcon = ({ color }: IconProps) => (
  <svg {...svg} stroke={color} strokeWidth={2}>
    <rect x="3" y="12" width="5" height="9" rx="1" />
    <rect x="9.5" y="3" width="5" height="18" rx="1" />
    <rect x="16" y="8" width="5" height="13" rx="1" />
  </svg>
);
const LibraryIcon = ({ color }: IconProps) => (
  <svg {...svg} stroke={color} strokeWidth={2}>
    <rect x="3" y="4" width="4" height="16" rx="1" />
    <rect x="9" y="4" width="4" height="16" rx="1" />
    <path d="M15.5 5.2l3.8-1 3 14.6-3.8 1z" />
  </svg>
);
const PersonIcon = ({ color }: IconProps) => (
  <svg {...svg} stroke={color} strokeWidth={2}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1" />
  </svg>
);

const links = [
  { href: '/',          Icon: HomeIcon,    label: 'Beranda' },
  { href: '/schedule',  Icon: CompassIcon, label: 'Jelajah' },
  { href: '/ranking',   Icon: RankingIcon, label: 'Peringkat' },
  { href: '/history',   Icon: LibraryIcon, label: 'Koleksi' },
  { href: '/profile',   Icon: PersonIcon,  label: 'Profil' },
];

function BottomNavInner() {
  const pathname = usePathname();
  const photoURL = useFirebasePhoto();

  if (pathname.startsWith('/chapter') || pathname.startsWith('/manga') || pathname.startsWith('/search') || pathname.startsWith('/notifikasi') || pathname.startsWith('/profile/edit') || pathname.startsWith('/ranking/lencana') || pathname.startsWith('/premium') || pathname.startsWith('/misi') || pathname.startsWith('/komikstore/pet')) return null;

  return (
    <nav
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', justifyContent: 'center',
        background: 'var(--nav)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 6px)',
      }}
    >
      <div style={{ display: 'flex', width: '100%', maxWidth: 448, padding: '8px 6px 0' }}>
        {links.map(({ href, Icon, label }) => {
          const active = pathname === href;
          const color = active ? '#fff' : 'var(--muted)';
          const isProfile = href === '/profile';
          return (
            <Link key={href} href={href} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, textDecoration: 'none' }}>
              <div style={{ width: 62, height: 36, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', background: active ? 'rgba(255,107,107,0.28)' : 'transparent', transition: 'background .2s' }}>
                {isProfile && photoURL ? (
                  <img src={photoURL} alt="" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', outline: active ? '2px solid #fff' : 'none', opacity: active ? 1 : 0.7 }} />
                ) : (
                  <Icon color={color} filled={active} />
                )}
              </div>
              <span style={{ fontSize: 11.5, fontWeight: active ? 800 : 700, color, paddingBottom: 6 }}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function BottomNav(props: any) {
  const __hideNav = (usePathname() || '').startsWith('/komikstore');
  if (__hideNav) return null;
  return <BottomNavInner {...props} />;
}
