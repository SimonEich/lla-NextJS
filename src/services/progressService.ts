import { progressRepo } from "@/repositories";

export type WordProgress = {
  wordId: string;
  level: number;
  correctCount: number;
  sentenceIndex: number;
  difficult: boolean;
  state: "inactive" | "active" | "mastered";
  // Only set while state === "mastered" — when the word is next due for a
  // spaced-repetition review, and how many days the current interval spans.
  nextReviewAt?: number;
  reviewInterval?: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const INITIAL_REVIEW_DAYS = 1;
const MAX_REVIEW_DAYS = 90;

function scheduleReview(
  days: number,
  now: number = Date.now()
): Pick<WordProgress, "nextReviewAt" | "reviewInterval"> {
  const reviewInterval = Math.min(days, MAX_REVIEW_DAYS);
  return { reviewInterval, nextReviewAt: now + reviewInterval * DAY_MS };
}

export const progressService = {
  async load(): Promise<Record<string, WordProgress>> {
    return progressRepo.load();
  },

  async save(progress: Record<string, WordProgress>): Promise<void> {
    await progressRepo.save(progress);
  },

  getDefault(wordId: string): WordProgress {
    return {
      wordId,
      level: 1,
      correctCount: 0,
      sentenceIndex: 0,
      difficult: false,
      state: "inactive",
    };
  },

  // Exposed so callers (e.g. a one-time migration for words mastered before
  // spaced repetition existed) can (re)schedule a review without duplicating
  // the interval math.
  scheduleReview,

  markCorrect(wp: WordProgress): WordProgress {
    if (wp.state === "mastered") {
      // This was a due review, not a first-time answer — recalling it
      // correctly pushes the next review further out.
      return { ...wp, ...scheduleReview((wp.reviewInterval ?? INITIAL_REVIEW_DAYS) * 2) };
    }
    const newCount = wp.correctCount + 1;
    const levelUp = newCount >= 3;
    const newLevel = levelUp ? wp.level + 1 : wp.level;
    const mastered = newLevel > 5;
    const base: WordProgress = {
      ...wp,
      correctCount: levelUp ? 0 : newCount,
      level: mastered ? 5 : newLevel,
      sentenceIndex: wp.sentenceIndex + 1,
      state: mastered ? "mastered" : "active",
    };
    return mastered ? { ...base, ...scheduleReview(INITIAL_REVIEW_DAYS) } : base;
  },

  markWrong(wp: WordProgress): WordProgress {
    if (wp.state === "mastered") {
      // Forgot a review word — demote it back into active learning instead
      // of leaving it on the review schedule.
      return {
        ...wp,
        state: "active",
        level: 1,
        correctCount: 0,
        sentenceIndex: wp.sentenceIndex + 1,
        nextReviewAt: undefined,
        reviewInterval: undefined,
      };
    }
    return {
      ...wp,
      correctCount: 0,
      sentenceIndex: wp.sentenceIndex + 1,
    };
  },

  markFastForward(wp: WordProgress): WordProgress {
    if (wp.state === "mastered") {
      // "Easy" on a review — an even stronger recall signal than a plain
      // correct answer, so push the interval out further.
      return { ...wp, ...scheduleReview((wp.reviewInterval ?? INITIAL_REVIEW_DAYS) * 3) };
    }
    const newLevel = wp.level + 1;
    const mastered = newLevel > 5;
    const base: WordProgress = {
      ...wp,
      level: mastered ? 5 : newLevel,
      correctCount: 0,
      sentenceIndex: wp.sentenceIndex + 1,
      state: mastered ? "mastered" : "active",
      difficult: false,
    };
    return mastered ? { ...base, ...scheduleReview(INITIAL_REVIEW_DAYS) } : base;
  },

  markDifficult(wp: WordProgress): WordProgress {
    if (wp.state === "mastered") {
      // Struggled to recall a review word — send it back to active
      // learning and flag it difficult so it also shows up in that list.
      return {
        ...wp,
        state: "active",
        level: 1,
        correctCount: 0,
        sentenceIndex: wp.sentenceIndex + 1,
        difficult: true,
        nextReviewAt: undefined,
        reviewInterval: undefined,
      };
    }
    return {
      ...wp,
      difficult: true,
      correctCount: 0,
      sentenceIndex: wp.sentenceIndex + 1,
    };
  },

  // "I already know this" quick-skip — jumps straight to the hardest level
  // instead of grinding through multiple-choice/fill-blank/word-tap first.
  // Doesn't master the word outright; it still has to be answered correctly
  // at level 5 like any other word.
  jumpToLevel5(wp: WordProgress): WordProgress {
    return {
      ...wp,
      level: 5,
      correctCount: 0,
      sentenceIndex: wp.sentenceIndex + 1,
      difficult: false,
      state: "active",
    };
  },

  // Marking a word "known" from the word list masters it outright and
  // enters it into the same spaced-repetition review cycle as words
  // mastered through normal practice.
  markKnown(wordId: string): WordProgress {
    return {
      wordId,
      level: 5,
      correctCount: 0,
      sentenceIndex: 0,
      difficult: false,
      state: "mastered",
      ...scheduleReview(INITIAL_REVIEW_DAYS),
    };
  },

  // Mastered words whose review date has arrived — eligible to resurface
  // in a normal learning session alongside the active stack.
  getDueReviews(progress: Record<string, WordProgress>, now: number = Date.now()): WordProgress[] {
    return Object.values(progress).filter(
      (wp) => wp.state === "mastered" && wp.nextReviewAt !== undefined && wp.nextReviewAt <= now
    );
  },

  // get all active word progress objects
  getActive(progress: Record<string, WordProgress>): WordProgress[] {
    return Object.values(progress).filter((wp) => wp.state === "active");
  },

  // activate a single word
  activate(
    progress: Record<string, WordProgress>,
    wordId: string
  ): Record<string, WordProgress> {
    return {
      ...progress,
      [wordId]: {
        wordId,
        state: "active",
        level: 1,
        correctCount: 0,
        sentenceIndex: 0,
        difficult: false,
      },
    };
  },

  // count active words
  getActiveCount(progress: Record<string, WordProgress>): number {
    return Object.values(progress).filter((wp) => wp.state === "active").length;
  },
};
