import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── XP / Level System ────────────────────────────────────────────────────────
const EXP_PER_LEVEL = 200;
const XP_PER_CHAPTER = 10;

export interface UserStats {
  exp: number;
  level: number;
  koin: number;
  chaptersRead: number;
}

interface UserStatsStore {
  stats: UserStats;
  addExp: (amount?: number) => void;
  addKoin: (amount: number) => void;
}

export const useUserStats = create<UserStatsStore>()(
  persist(
    (set, get) => ({
      stats: { exp: 0, level: 1, koin: 0, chaptersRead: 0 },
      addExp: (amount = XP_PER_CHAPTER) => {
        const { exp, level, koin, chaptersRead } = get().stats;
        const newExp = exp + amount;
        const newLevel = Math.floor(newExp / EXP_PER_LEVEL) + 1;
        set({ stats: { exp: newExp, level: newLevel, koin, chaptersRead: chaptersRead + 1 } });
      },
      addKoin: (amount) => {
        const s = get().stats;
        set({ stats: { ...s, koin: s.koin + amount } });
      },
    }),
    { name: 'komiku-user-stats' }
  )
);

// ─── Favorites ────────────────────────────────────────────────────────────────
export interface FavoriteItem {
  title: string;
  link: string;
  thumb: string;
  desc?: string;
}

interface FavoriteStore {
  favorites: FavoriteItem[];
  toggleFavorite: (item: FavoriteItem) => void;
  isFavorite: (link: string) => boolean;
}

export const useFavorites = create<FavoriteStore>()(
  persist(
    (set, get) => ({
      favorites: [],
      toggleFavorite: (item) => {
        const favs = get().favorites;
        const exists = favs.find(f => f.link === item.link);
        if (exists) {
          set({ favorites: favs.filter(f => f.link !== item.link) });
        } else {
          set({ favorites: [...favs, item] });
        }
      },
      isFavorite: (link) => !!get().favorites.find(f => f.link === link),
    }),
    { name: 'komiku-favorites' }
  )
);

// ─── Reading History ──────────────────────────────────────────────────────────
export interface HistoryItem {
  mangaTitle: string;
  mangaLink: string;
  mangaThumb: string;
  chapterTitle: string;
  chapterLink: string;
  chapterNumber: string;
  pageRead: number;
  totalPages: number;
  readAt: number;
}

interface HistoryStore {
  history: HistoryItem[];
  addHistory: (item: Omit<HistoryItem, 'readAt'>) => void;
  updateProgress: (chapterLink: string, pageRead: number, totalPages: number) => void;
  removeHistory: (chapterLink: string) => void;
  clearAll: () => void;
  getProgress: (chapterLink: string) => { pageRead: number; totalPages: number } | null;
}

export const useHistory = create<HistoryStore>()(
  persist(
    (set, get) => ({
      history: [],
      addHistory: (item) => {
        const now = Date.now();
        const existing = get().history.find(h => h.chapterLink === item.chapterLink);
        if (existing) {
          set({
            history: [
              { ...existing, ...item, readAt: now },
              ...get().history.filter(h => h.chapterLink !== item.chapterLink),
            ],
          });
        } else {
          set({ history: [{ ...item, readAt: now }, ...get().history.slice(0, 199)] });
        }
      },
      updateProgress: (chapterLink, pageRead, totalPages) => {
        set({
          history: get().history.map(h =>
            h.chapterLink === chapterLink ? { ...h, pageRead, totalPages, readAt: Date.now() } : h
          ),
        });
      },
      removeHistory: (chapterLink) =>
        set({ history: get().history.filter(h => h.chapterLink !== chapterLink) }),
      clearAll: () => set({ history: [] }),
      getProgress: (chapterLink) => {
        const h = get().history.find(h => h.chapterLink === chapterLink);
        return h ? { pageRead: h.pageRead, totalPages: h.totalPages } : null;
      },
    }),
    { name: 'komiku-history' }
  )
);
