// 🔌 Switch backends here — swap local ↔ supabase without touching any other file.
// Local storage is the default so the app fully works offline out of the box.
// See supabaseProgressRepository.ts for the table schema you'll need first.
import { localProgressRepository } from "./localProgressRepository";
import { localWordsRepository } from "./localWordsRepository";
// import { supabaseProgressRepository } from "./supabaseProgressRepository";

export const progressRepo = localProgressRepository;
export const wordsRepo = localWordsRepository;
