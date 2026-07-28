import { Word } from "@/data/words";
import { IWordsRepository } from "./types";

// The words dataset is generated to public/words.json at dev/build time
// (see scripts/generate-words-json.ts) instead of being bundled as a JS
// array literal — that used to force every route to parse/execute a 3MB+
// chunk before it could render. Fetching it as JSON is lazy and much
// cheaper to parse, and it's still precached by the service worker for
// offline use like any other static asset.
let wordsPromise: Promise<Word[]> | null = null;

function loadWords(): Promise<Word[]> {
  if (!wordsPromise) {
    wordsPromise = fetch("/words.json").then((res) => res.json());
  }
  return wordsPromise;
}

export const localWordsRepository: IWordsRepository = {
  async getAll() {
    return loadWords();
  },

  async getByIds(ids) {
    const words = await loadWords();
    const map = new Map(words.map((w) => [w.id, w]));
    return ids.map((id) => map.get(id)).filter((w): w is Word => !!w);
  },
};
