import { Sentence, Word } from "@/data/words";
import { WordProgress } from "@/services/progressService";

export type MultiData = {
  word: Word;
  sentence: Sentence;
  progress: WordProgress;
  answerArray: Word[]; // shuffled: correct + 2 distractors
};
