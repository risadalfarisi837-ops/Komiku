import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Settings {
  lowQuality: boolean;
  wifiOnly: boolean;
  notifChapter: boolean;
  notifReply: boolean;
  notifNews: boolean;
}

interface SettingsStore extends Settings {
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

export const useSettings = create<SettingsStore>()(
  persist(
    (set) => ({
      lowQuality: false,
      wifiOnly: false,
      notifChapter: true,
      notifReply: true,
      notifNews: true,
      setSetting: (key, value) => set({ [key]: value } as Partial<SettingsStore>),
    }),
    { name: 'komiku-settings' }
  )
);
