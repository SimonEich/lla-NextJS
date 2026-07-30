import { Word } from "@/data/words";
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
  // Verbs only, level 5 only: which forms (infinitive + each person) have
  // already been typed correctly at least once. Cleared whenever the word
  // leaves level 5 without mastering (lapse) or is (re-)sent there fresh.
  formsDone?: string[];
};

// The form currently being tested at level 5 for a verb — computed by
// useSession alongside `sentence`/`answerArray`, and threaded through to the
// mark* functions on swipe so they know which form to credit.
export type VerbFormContext = {
  label: string;
  expected: string;
  requiredForms: string[];
};

export const INFINITIVE_FORM = "infinitivo";

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

// All forms a verb's level-5 challenge must cover: the infinitive plus every
// distinct person conjugation found in its example sentences (normally the
// 6 grammatical persons — derived dynamically rather than hardcoded so it
// stays correct if a word ever has fewer/different sentences).
function getRequiredVerbForms(word: Word): string[] {
  const persons = Array.from(
    new Set(word.sentences.map((s) => s.pers_pron_form).filter((p): p is string => !!p))
  );
  return [INFINITIVE_FORM, ...persons];
}

// Marks `verbForm.label` as done and masters the word once every required
// form has been covered at least once. Returns null if verbForm isn't
// provided (caller should fall back to the plain, non-verb path).
function applyVerbFormProgress(
  wp: WordProgress,
  verbForm: VerbFormContext | undefined
): WordProgress | null {
  if (!verbForm) return null;
  const formsDone = Array.from(new Set([...(wp.formsDone ?? []), verbForm.label]));
  const allDone = verbForm.requiredForms.every((f) => formsDone.includes(f));
  if (allDone) {
    return {
      ...wp,
      formsDone,
      level: 5,
      correctCount: 0,
      sentenceIndex: wp.sentenceIndex + 1,
      state: "mastered",
      ...scheduleReview(INITIAL_REVIEW_DAYS),
    };
  }
  return { ...wp, formsDone, sentenceIndex: wp.sentenceIndex + 1 };
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
      formsDone: [],
    };
  },

  // Exposed so callers (e.g. a one-time migration for words mastered before
  // spaced repetition existed) can (re)schedule a review without duplicating
  // the interval math.
  scheduleReview,
  getRequiredVerbForms,

  markCorrect(wp: WordProgress, verbForm?: VerbFormContext): WordProgress {
    if (wp.state === "mastered") {
      // This was a due review, not a first-time answer — recalling it
      // correctly pushes the next review further out.
      return { ...wp, ...scheduleReview((wp.reviewInterval ?? INITIAL_REVIEW_DAYS) * 2) };
    }

    const verbResult = applyVerbFormProgress(wp, verbForm);
    if (verbResult) return verbResult;

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
        formsDone: [],
        nextReviewAt: undefined,
        reviewInterval: undefined,
      };
    }
    // A wrong answer doesn't credit the tested form — it stays outstanding
    // and will be asked again in rotation.
    return {
      ...wp,
      correctCount: 0,
      sentenceIndex: wp.sentenceIndex + 1,
    };
  },

  markFastForward(wp: WordProgress, verbForm?: VerbFormContext): WordProgress {
    if (wp.state === "mastered") {
      // "Easy" on a review — an even stronger recall signal than a plain
      // correct answer, so push the interval out further.
      return { ...wp, ...scheduleReview((wp.reviewInterval ?? INITIAL_REVIEW_DAYS) * 3) };
    }

    // "Easy" on a verb's level-5 form is just as much a demonstration of
    // knowing it as a plain correct answer — credit the same way, rather
    // than instantly mastering and skipping the remaining forms.
    const verbResult = applyVerbFormProgress(wp, verbForm);
    if (verbResult) return verbResult;

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
        formsDone: [],
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
  // Doesn't master the word outright; for verbs it still has to correctly
  // type every conjugation form (see formsDone) before mastering.
  jumpToLevel5(wp: WordProgress): WordProgress {
    return {
      ...wp,
      level: 5,
      correctCount: 0,
      sentenceIndex: wp.sentenceIndex + 1,
      difficult: false,
      state: "active",
      formsDone: [],
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
      formsDone: [],
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
        formsDone: [],
      },
    };
  },

  // count active words
  getActiveCount(progress: Record<string, WordProgress>): number {
    return Object.values(progress).filter((wp) => wp.state === "active").length;
  },
};
