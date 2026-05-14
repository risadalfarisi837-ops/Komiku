import type {Metadata} from 'next';
import './globals.css';
import Link from 'next/link';
import { Home, Compass, Search, User } from 'lucide-react';

import BottomNav from '@/components/BottomNav';

export const metadata: Metadata = {
  title: 'Komiku',
  description: 'Baca komik manga, manhwa, manhua gratis dan lengkap',
  manifest: '/manifest.json',
  themeColor: '#0A0B0E',
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
      <body className="bg-[#0D0D10] text-white flex flex-col min-h-screen items-center" suppressHydrationWarning>
        <div className="w-full max-w-md bg-[#0D0D10] relative shadow-sm overflow-x-hidden flex flex-col">
          
          <main className="w-full relative pb-24">
            {children}
          </main>

          <BottomNav />
        </div>
      </body>
    </html>
  );
}
