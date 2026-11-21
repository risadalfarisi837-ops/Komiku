'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useHistory, useFavorites, HistoryItem, FavoriteItem } from '@/lib/store';
import { Clock, Heart, Download, Search, ArrowUpDown, List, LayoutGrid, Check } from 'lucide-react';

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

// ─── Tab (segmented pill) ─────────────────────────────────────────────────────
function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { key: Tab; label: string }[] = [
    { key: 'favorite', label: 'Favorit' },
    { key: 'history',  label: 'Riwayat' },
    { key: 'download', label: 'Unduhan' },
  ];
  return (
    <div className="flex w-full p-1.5 rounded-full border border-white/5" style={{ background: '#2A2931' }}>
      {tabs.map((t) => {
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className="flex-1 py-3 text-[17px] font-extrabold rounded-full transition-all"
            style={{ color: isActive ? '#fff' : '#8F8D9B', background: isActive ? '#1B1A20' : 'transparent' }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Search Bar ───────────────────────────────────────────────────────────────
function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      autoFocus
      type="text"
      placeholder="Search..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-[#2A2931] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-white/25 transition-colors"
    />
  );
}

// ─── Info chapter terbaru tiap favorit (di-cache di localStorage) ─────────────
type Meta = { latestNum: number | null; latestLabel: string; latestAt: number; fetchedAt: number };
const META_KEY = 'komiku-fav-meta';
const META_TTL = 6 * 3600 * 1000;
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const uuidOf = (l: string) => (l || '').match(UUID_RE)?.[0].toLowerCase() || l;
const numOf = (v: string) => { const m = String(v || '').match(/\d+(\.\d+)?/); return m ? parseFloat(m[0]) : null; };

function formatShortDate(ts: number) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

type FavView = { item: FavoriteItem; added: number; latestLabel: string; latestAt: number; unread: number; reading: boolean; lastReadAt: number };
type Sort = 'added' | 'recent' | 'title' | 'new';
const SORT_LABEL: Record<Sort, string> = { added: 'Baru ditambahkan', recent: 'Terakhir dibaca', title: 'Judul A–Z', new: 'Chapter baru terbanyak' };
const SORT_ORDER: Sort[] = ['added', 'recent', 'title', 'new'];

function Badge({ n }: { n: number }) {
  if (n <= 0) return null;
  return (
    <span className="absolute top-2 right-2 z-10 text-white text-[15px] font-extrabold leading-none px-2.5 py-1.5 rounded-full" style={{ background: 'var(--accent)' }}>
      {n > 99 ? '99+' : n}
    </span>
  );
}

// ─── History Card ─────────────────────────────────────────────────────────────
function HistoryCard({
  item,
}: {
  item: HistoryItem;
}) {
  const inner = (
    <div className="bg-[#2A2931] rounded-2xl p-4 border border-white/5 flex gap-4 items-center active:scale-[0.98] transition-all" style={{marginBottom:12}}>
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

  return <Link href={`/chapter?url=${encodeURIComponent(item.chapterLink)}&thumb=${encodeURIComponent(item.mangaThumb||'')}&mangaTitle=${encodeURIComponent(item.mangaTitle||'')}`}>{inner}</Link>;
}

// ─── Favorite Card (grid / list) ──────────────────────────────────────────────
function FavoriteCard({ v, mode }: { v: FavView; mode: 'grid' | 'list' }) {
  const href = `/manga?url=${encodeURIComponent(v.item.link)}`;
  const sub = v.latestLabel ? `${v.latestLabel}${v.latestAt ? ` · ${formatShortDate(v.latestAt)}` : ''}` : '';

  if (mode === 'list') {
    return (
      <Link href={href} className="flex gap-4 items-center bg-[#2A2931] rounded-2xl p-3 border border-white/5">
        <div className="relative shrink-0 rounded-xl overflow-hidden bg-[#252830]" style={{ width: 64, height: 88 }}>
          <Badge n={v.unread} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={v.item.thumb} alt="" className="w-full h-full object-cover block" loading="lazy" referrerPolicy="no-referrer" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base text-white font-bold leading-tight line-clamp-2">{v.item.title}</p>
          {sub && <p className="text-sm text-gray-400 font-semibold mt-1.5">{sub}</p>}
        </div>
      </Link>
    );
  }

  return (
    <Link href={href} className="flex flex-col min-w-0">
      <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-[#252830]">
        <Badge n={v.unread} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={v.item.thumb} alt={v.item.title} className="w-full h-full object-cover block" loading="lazy" referrerPolicy="no-referrer" />
      </div>
      <p className="text-white text-[17px] font-extrabold leading-tight line-clamp-2 mt-2.5 px-0.5" style={{ overflowWrap: 'break-word' }}>{v.item.title}</p>
      {v.latestLabel && <p className="text-[#8F8D9B] text-[15px] font-bold mt-1 px-0.5">{v.latestLabel}</p>}
      {v.latestAt > 0 && <p className="text-[#8F8D9B] text-[15px] font-bold px-0.5">· {formatShortDate(v.latestAt)}</p>}
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
      <Link href="/" className="mt-6 px-6 py-3 bg-[#2A2931] text-white font-bold text-sm rounded-full">Jelajahi Manga</Link>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HistoryPage() {
  const { history } = useHistory();
  const { favorites } = useFavorites();

  const [activeTab, setActiveTab] = useState<Tab>('favorite');
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [filter, setFilter] = useState<'all' | 'reading' | 'unread'>('all');
  const [sort, setSort] = useState<Sort>('added');
  const [mode, setMode] = useState<'grid' | 'list'>('grid');
  const [meta, setMeta] = useState<Record<string, Meta>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try { setMeta(JSON.parse(localStorage.getItem(META_KEY) || '{}')); } catch { /* abaikan */ }
  }, []);

  // Ambil chapter terbaru tiap favorit (3 request paralel, di-cache 6 jam)
  const favKey = favorites.map(f => f.link).join('|');
  useEffect(() => {
    if (!mounted || favorites.length === 0) return;
    let cancelled = false;
    const stale = favorites.filter(f => !meta[f.link] || Date.now() - meta[f.link].fetchedAt > META_TTL);
    if (stale.length === 0) return;
    const queue = [...stale];
    const next: Record<string, Meta> = {};
    const worker = async () => {
      while (queue.length && !cancelled) {
        const f = queue.shift()!;
        let m: Meta = { latestNum: null, latestLabel: '', latestAt: 0, fetchedAt: Date.now() };
        try {
          const res = await fetch(`/api/manga/detail?url=${encodeURIComponent(f.link)}`);
          const json = await res.json();
          const c = json?.success ? json.data?.chapters?.[0] : null;
          if (c) {
            const n = numOf(c.num);
            m = { latestNum: n, latestLabel: n != null ? `Ch. ${c.num}` : (c.title || ''), latestAt: c.at ? Date.parse(c.at) : 0, fetchedAt: Date.now() };
          }
        } catch { /* simpan kosong, coba lagi setelah TTL */ }
        next[f.link] = m;
      }
    };
    Promise.all([worker(), worker(), worker()]).then(() => {
      if (cancelled) return;
      setMeta(prev => {
        const merged = { ...prev, ...next };
        try { localStorage.setItem(META_KEY, JSON.stringify(merged)); } catch { /* abaikan */ }
        return merged;
      });
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, favKey]);

  const favViews: FavView[] = useMemo(() => favorites.map((item, i) => {
    const id = uuidOf(item.link);
    const reads = history.filter(h => (h.mangaLink && uuidOf(h.mangaLink) === id) || h.mangaTitle === item.title);
    const readNum = reads.reduce<number | null>((mx, h) => {
      const n = numOf(h.chapterNumber);
      return n == null ? mx : mx == null ? n : Math.max(mx, n);
    }, null);
    const m = meta[item.link];
    const unread = m?.latestNum != null && readNum != null ? Math.max(0, Math.floor(m.latestNum) - Math.floor(readNum)) : 0;
    return {
      item, added: i,
      latestLabel: m?.latestLabel || '', latestAt: m?.latestAt || 0,
      unread, reading: reads.length > 0,
      lastReadAt: reads.reduce((mx, h) => Math.max(mx, h.readAt), 0),
    };
  }), [favorites, history, meta]);

  if (!mounted) return <div className="min-h-screen bg-[#1B1A20]" />;

  const handleTabChange = (t: Tab) => {
    setActiveTab(t);
    setSearch('');
    setShowSearch(false);
  };

  const q = search.toLowerCase();

  const filteredHistory = history.filter(h =>
    h.mangaTitle.toLowerCase().includes(q) ||
    (h.chapterTitle || '').toLowerCase().includes(q)
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

  const readingCount = favViews.filter(v => v.reading).length;
  const newCount = favViews.filter(v => v.unread > 0).length;

  const shownFavs = favViews
    .filter(v => v.item.title.toLowerCase().includes(q))
    .filter(v => filter === 'all' ? true : filter === 'reading' ? v.reading : !v.reading)
    .sort((a, b) => {
      if (sort === 'added') return b.added - a.added;
      if (sort === 'recent') return b.lastReadAt - a.lastReadAt || b.added - a.added;
      if (sort === 'title') return a.item.title.localeCompare(b.item.title);
      return b.unread - a.unread || b.added - a.added;
    });

  const cycleSort = () => setSort(SORT_ORDER[(SORT_ORDER.indexOf(sort) + 1) % SORT_ORDER.length]);

  const chips: { key: 'all' | 'reading' | 'unread'; label: string; n: number }[] = [
    { key: 'all', label: 'Semua', n: favViews.length },
    { key: 'reading', label: 'Sedang dibaca', n: readingCount },
    { key: 'unread', label: 'Belum dibaca', n: favViews.length - readingCount },
  ];

  return (
    <div className="bg-[#1B1A20] min-h-screen text-white max-w-md mx-auto pb-40">
      {/* Header: search + sort */}
      <div className="flex items-center justify-end gap-6 px-5 pt-6 pb-4">
        <button onClick={() => { setShowSearch(s => !s); if (showSearch) setSearch(''); }} aria-label="Cari">
          <Search className="w-7 h-7" />
        </button>
        {activeTab === 'favorite' && (
          <button onClick={cycleSort} aria-label="Urutkan">
            <ArrowUpDown className="w-7 h-7" />
          </button>
        )}
      </div>

      <div className="px-4">
        <TabBar active={activeTab} onChange={handleTabChange} />
        {showSearch && <div className="mt-3"><SearchBar value={search} onChange={setSearch} /></div>}
      </div>

      {/* Content */}
      <div className="px-4 pt-5">
        {activeTab === 'favorite' && (
          favorites.length === 0
            ? <EmptyState tab="favorite" />
            : <>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                  {chips.map(c => {
                    const on = filter === c.key;
                    return (
                      <button
                        key={c.key}
                        onClick={() => setFilter(c.key)}
                        className="shrink-0 flex items-center gap-2 px-5 py-3 rounded-full text-[17px] font-extrabold border"
                        style={on
                          ? { background: '#ECEAF2', color: '#1B1A20', borderColor: '#ECEAF2' }
                          : { background: 'transparent', color: '#ECEAF2', borderColor: 'rgba(255,255,255,0.18)' }}
                      >
                        {on && <Check className="w-5 h-5" strokeWidth={3} />}
                        {c.label} · {c.n}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between mt-6 mb-4">
                  <p className="text-[17px] font-extrabold min-w-0 truncate">
                    {newCount > 0 && <>{newCount} punya chapter baru<span className="text-[#8F8D9B]"> &nbsp;·&nbsp; </span></>}
                    <button onClick={cycleSort} className="text-[#8F8D9B]">{SORT_LABEL[sort]}</button>
                  </p>
                  <button onClick={() => setMode(m => m === 'grid' ? 'list' : 'grid')} aria-label="Ganti tampilan" className="text-[#8F8D9B] shrink-0 ml-3">
                    {mode === 'grid' ? <List className="w-7 h-7" /> : <LayoutGrid className="w-7 h-7" />}
                  </button>
                </div>

                {shownFavs.length === 0
                  ? <p className="text-center text-gray-500 py-16 text-sm">Tidak ada hasil</p>
                  : mode === 'grid'
                    ? <div className="grid grid-cols-3 gap-x-3 gap-y-5">
                        {shownFavs.map(v => <FavoriteCard key={v.item.link} v={v} mode="grid" />)}
                      </div>
                    : <div className="flex flex-col gap-3">
                        {shownFavs.map(v => <FavoriteCard key={v.item.link} v={v} mode="list" />)}
                      </div>}
              </>
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
                        <div className="bg-[#2A2931] text-white text-xs font-black px-3 py-1.5 rounded-lg">{label}</div>
                        <div className="flex-1 h-px bg-white/5" />
                      </div>
                      <div className="space-y-0">
                        {items.map(item => (
                          <HistoryCard key={item.chapterLink} item={item} />
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
