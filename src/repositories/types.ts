import { Word } from "@/data/words";
import { WordProgress } from "@/services/progressService";

export interface IWordsRepository {
  getAll(): Promise<Word[]>;
  getByIds(ids: string[]): Promise<Word[]>;
}

export interface IProgressRepository {
  load(): Promise<Record<string, WordProgress>>;
  save(progress: Record<string, WordProgress>): Promise<void>;
  // saveOne saves a single entry — more efficient for Supabase (one row vs full JSON)
  saveOne(wp: WordProgress): Promise<void>;
}
