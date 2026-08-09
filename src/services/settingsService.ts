const KEY = "app_settings";

export type AppSettings = {
  maxStackSize: number; // 5–50
  // When off, mastered/review words never resurface in a normal learning
  // session — only words that aren't mastered yet are shown.
  spacedRepetitionEnabled: boolean;
};

const DEFAULTS: AppSettings = {
  maxStackSize: 30,
  spacedRepetitionEnabled: true,
};

export const settingsService = {
  async load(): Promise<AppSettings> {
    if (typeof window === "undefined") return DEFAULTS;
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  },

  async save(settings: AppSettings): Promise<void> {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(KEY, JSON.stringify(settings));
  },
};
