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
        auth.onAuthStateChanged((u: any) => setPhotoURL(u?.photoURL ?? null));
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

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'white' : '#4B5563'} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L3 9.5V20a1 1 0 001 1h5v-6h6v6h5a1 1 0 001-1V9.5L12 2z"/>
  </svg>
);

const CompassIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? 'white' : '#4B5563'} strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10"/>
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill={active ? 'white' : '#4B5563'} stroke="none"/>
  </svg>
);

const RankingIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? 'white' : '#4B5563'} strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="14" width="4" height="8" rx="1"/>
    <rect x="9" y="9" width="4" height="13" rx="1"/>
    <rect x="16" y="4" width="4" height="18" rx="1"/>
  </svg>
);

const ArchiveIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? 'white' : '#4B5563'} strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <polyline points="21 8 21 21 3 21 3 8"/>
    <rect x="1" y="3" width="22" height="5" rx="1"/>
    <line x1="10" y1="12" x2="14" y2="12"/>
  </svg>
);

const PersonIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? 'white' : '#4B5563'} strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

export default function BottomNav() {
  const pathname = usePathname();
  const photoURL = useFirebasePhoto();

  if (pathname.startsWith('/chapter') || pathname.startsWith('/manga') || pathname.startsWith('/search')) return null;

  const links = [
    { href: '/',          Icon: HomeIcon,    label: '' },
    { href: '/schedule',  Icon: CompassIcon, label: '' },
    { href: '/favorites', Icon: RankingIcon, label: '' },
    { href: '/history',   Icon: ArchiveIcon, label: '' },
    { href: '/profile',   Icon: PersonIcon,  label: '' },
  ];

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      background: '#0D0D10',
      borderTop: '1px solid rgba(255,255,255,0.05)',
      display: 'flex', alignItems: 'center',
      paddingBottom: 'max(env(safe-area-inset-bottom), 0px)',
    }}> 
      {links.map(({ href, Icon }) => {
        const isActive = pathname === href;
        const isProfile = href === '/profile';
        return (
          <Link key={href} href={href} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '14px 0', textDecoration: 'none' }}>
            {isProfile && photoURL ? (
              <div className={`w-6 h-6 rounded-full overflow-hidden transition-all ${isActive ? 'ring-2 ring-white' : 'opacity-50'}`}>
                <img src={photoURL} alt="pp" className="w-full h-full object-cover" />
              </div>
            ) : (
              <Icon active={isActive} />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
