import type {Metadata} from 'next';
import './globals.css';
import Link from 'next/link';
import { Home, Compass, Search, User } from 'lucide-react';

import BottomNav from '@/components/BottomNav';
import RegisterSW from '@/components/RegisterSW';
import PageScale from '@/components/PageScale';
import GiftWatcher from '@/components/GiftWatcher';

export const metadata: Metadata = {
  title: 'Komikita',
  description: 'Baca komik manga, manhwa, manhua gratis dan lengkap',
  manifest: '/manifest.json',
  themeColor: '#1B1A20',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.ico',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="id">
      <body className="font-sans bg-[#1B1A20] text-white flex flex-col min-h-screen items-center" suppressHydrationWarning>
        <div className="w-full max-w-md bg-[#1B1A20] relative shadow-sm overflow-x-hidden flex flex-col">
          
          <main className="w-full relative pb-28">
            <PageScale>{children}</PageScale>
          </main>

          <BottomNav />
          <RegisterSW />
          <GiftWatcher />
        </div>
      </body>
    </html>
  );
}
