import { Sentence, Word } from "@/data/words";
import { VerbFormContext, WordProgress } from "@/services/progressService";

export type MultiData = {
  word: Word;
  sentence: Sentence;
  progress: WordProgress;
  answerArray: Word[]; // shuffled: correct + 2 distractors
  // Only set for verbs at level 5 (and still actively being learned, not a
  // due review) — which specific form (infinitive or a person) is being
  // tested this round, out of everything still required for mastery.
  verbForm?: VerbFormContext;
};
