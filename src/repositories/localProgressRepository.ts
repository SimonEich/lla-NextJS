import { IProgressRepository } from "./types";

const KEY = "word_progress";

export const localProgressRepository: IProgressRepository = {
  async load() {
    if (typeof window === "undefined") return {};
    const raw = window.localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  },

  async save(progress) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(KEY, JSON.stringify(progress));
  },

  // For local storage saveOne just does a full save (no row concept)
  async saveOne(wp) {
    const current = await this.load();
    await this.save({ ...current, [wp.wordId]: wp });
  },
};
