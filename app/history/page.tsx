'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useHistory, useFavorites, HistoryItem, FavoriteItem } from '@/lib/store';
import { BookOpen, Clock, Heart, Download, Search } from 'lucide-react';

function formatDate(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const same = (a: Date, b: Date) =>
    a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  if (same(d, today)) return 'Hari Ini';
  if (same(d, yesterday)) return 'Kemarin';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

type Tab = 'favorite' | 'history' | 'download';

// ─── Tab Bar dengan glow effect ───────────────────────────────────────────────
function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { key: Tab; label: string }[] = [
    { key: 'favorite', label: 'Favorite' },
    { key: 'history',  label: 'History'  },
    { key: 'download', label: 'Download' },
  ];
  return (
    <div className="flex w-full relative" style={{ background: '#0D0D10' }}>
      {tabs.map((t) => {
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className="flex-1 py-3.5 text-sm font-bold transition-all relative overflow-hidden"
            style={{ color: isActive ? '#fff' : '#9ca3af' }}
          >
            {/* Glow background - radial gradient merah */}
            {isActive && (
              <span
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse 120% 150% at 50% -10%, #1C1F26 0%, #13151a 30%, transparent 70%)',
                }}
              />
            )}
            <span className="relative z-10">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Search Bar ───────────────────────────────────────────────────────────────
function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <input
        type="text"
        placeholder="Search..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-[#1A1A1F] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-white/25 transition-colors"
      />
      <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#1A1A1F] border border-white/10 shrink-0">
        <Search className="w-4 h-4 text-gray-400" />
      </button>
    </div>
  );
}

// ─── History Card ─────────────────────────────────────────────────────────────
function HistoryCard({
  item,
}: {
  item: HistoryItem;
}) {
  const inner = (
    <div className="bg-[#1A1D24] rounded-2xl p-4 border border-white/5 flex gap-4 items-center active:scale-[0.98] transition-all" style={{marginBottom:12}}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <div style={{width:64,height:88,minWidth:64,maxWidth:64,flexShrink:0,borderRadius:12,overflow:"hidden",background:"#252830"}}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.mangaThumb} alt="" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}} loading="lazy" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display="none"; }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base text-white font-bold leading-tight line-clamp-2">{item.mangaTitle}</p>
        <p className="text-sm text-gray-300 font-semibold mt-1.5">{item.chapterTitle || item.chapterNumber}</p>
      </div>
    </div>
  );

  return <Link href={`/chapter?url=${encodeURIComponent(item.chapterLink)}`}>{inner}</Link>;
}

// ─── Favorite Grid Card ───────────────────────────────────────────────────────
function FavoriteGridCard({ item }: { item: FavoriteItem }) {
  return (
    <Link href={`/manga?url=${encodeURIComponent(item.link)}`}>
      <div className="flex flex-col gap-1.5">
        <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-[#1A1A1F]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.thumb} alt={item.title} className="w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
        </div>
        <p className="text-white text-xs font-semibold line-clamp-2 leading-tight px-0.5">{item.title}</p>
      </div>
    </Link>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ tab }: { tab: Tab }) {
  const cfg = {
    favorite: { icon: <Heart className="w-8 h-8 text-gray-600" />, title: 'Belum ada favorit', desc: 'Tandai manga favoritmu agar muncul di sini' },
    history:  { icon: <Clock className="w-8 h-8 text-gray-600" />,  title: 'Belum ada riwayat', desc: 'Mulai baca manga dan riwayatnya akan muncul di sini' },
    download: { icon: <Download className="w-8 h-8 text-gray-600" />, title: 'Belum ada unduhan', desc: 'Download manga untuk dibaca secara offline' },
  }[tab];
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#1A1A1F] flex items-center justify-center mb-4 border border-white/5">
        {cfg.icon}
      </div>
      <p className="text-white font-bold">{cfg.title}</p>
      <p className="text-gray-500 text-sm mt-1">{cfg.desc}</p>
      <Link href="/" className="mt-6 px-6 py-3 bg-[#1C1F26] text-white font-bold text-sm rounded-full">Jelajahi Manga</Link>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HistoryPage() {
  const { history } = useHistory();
  const { favorites } = useFavorites();

  const [activeTab, setActiveTab] = useState<Tab>('history');
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <div className="min-h-screen bg-[#0D0D10]" />;

  const handleTabChange = (t: Tab) => {
    setActiveTab(t);
    setSearch('');
  };


  const filteredHistory = history.filter(h =>
    h.mangaTitle.toLowerCase().includes(search.toLowerCase()) ||
    (h.chapterTitle || '').toLowerCase().includes(search.toLowerCase())
  );

  const grouped = (() => {
    const map = new Map<string, HistoryItem[]>();
    for (const item of filteredHistory) {
      const label = formatDate(item.readAt);
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(item);
    }
    return Array.from(map.entries());
  })();

  const filteredFavorites = favorites.filter(f =>
    f.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-[#0D0D10] min-h-screen text-white max-w-md mx-auto pb-40">
      {/* Sticky Tab */}
      <div className="sticky top-0 z-40 bg-[#0D0D10]">
        <TabBar active={activeTab} onChange={handleTabChange} />

        {/* Search bar - below tabs */}
        <div className="px-4 pt-2 pb-2">
          <SearchBar value={search} onChange={setSearch} />
        </div>


      </div>

      {/* Content */}
      <div className="px-4 pt-1">
        {activeTab === 'favorite' && (
          filteredFavorites.length === 0
            ? <EmptyState tab="favorite" />
            : <div className="grid grid-cols-3 gap-3">
                {filteredFavorites.map((item, i) => <FavoriteGridCard key={i} item={item} />)}
              </div>
        )}

        {activeTab === 'history' && (
          history.length === 0
            ? <EmptyState tab="history" />
            : grouped.length === 0
              ? <p className="text-center text-gray-500 py-16 text-sm">Tidak ada hasil pencarian</p>
              : <div className="space-y-4">
                  {grouped.map(([label, items]) => (
                    <div key={label}>
                      <div className="flex items-center gap-3 my-3">
                        <div className="bg-[#1C1F26] text-white text-xs font-black px-3 py-1.5 rounded-lg">{label}</div>
                        <div className="flex-1 h-px bg-white/5" />
                      </div>
                      <div className="space-y-0">
                        {items.map(item => (
                          <HistoryCard
                            key={item.chapterLink}
                            item={item}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
        )}

        {activeTab === 'download' && <EmptyState tab="download" />}
      </div>


    </div>
  );
}
