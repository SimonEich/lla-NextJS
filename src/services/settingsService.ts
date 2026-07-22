const KEY = "app_settings";

export type AppSettings = {
  maxStackSize: number; // 5–50
};

const DEFAULTS: AppSettings = {
  maxStackSize: 30,
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
