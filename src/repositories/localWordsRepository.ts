import { words } from "@/data/words";
import { IWordsRepository } from "./types";

// Build a lookup map once at module load — O(1) per getByIds call
const wordMap = new Map(words.map((w) => [w.id, w]));

export const localWordsRepository: IWordsRepository = {
  async getAll() {
    return words;
  },

  async getByIds(ids) {
    return ids.map((id) => wordMap.get(id)).filter(Boolean) as typeof words;
  },
};
