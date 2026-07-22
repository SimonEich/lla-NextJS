import { progressRepo } from "@/repositories";

export type WordProgress = {
  wordId: string;
  level: number;
  correctCount: number;
  sentenceIndex: number;
  difficult: boolean;
  state: "inactive" | "active" | "mastered";
};

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

  markCorrect(wp: WordProgress): WordProgress {
    const newCount = wp.correctCount + 1;
    const levelUp = newCount >= 3;
    const newLevel = levelUp ? wp.level + 1 : wp.level;
    const mastered = newLevel > 5;
    return {
      ...wp,
      correctCount: levelUp ? 0 : newCount,
      level: mastered ? 5 : newLevel,
      sentenceIndex: wp.sentenceIndex + 1,
      state: mastered ? "mastered" : "active",
    };
  },

  markWrong(wp: WordProgress): WordProgress {
    return {
      ...wp,
      correctCount: 0,
      sentenceIndex: wp.sentenceIndex + 1,
    };
  },

  markFastForward(wp: WordProgress): WordProgress {
    const newLevel = wp.level + 1;
    const mastered = newLevel > 5;
    return {
      ...wp,
      level: mastered ? 5 : newLevel,
      correctCount: 0,
      sentenceIndex: wp.sentenceIndex + 1,
      state: mastered ? "mastered" : "active",
      difficult: false,
    };
  },

  markDifficult(wp: WordProgress): WordProgress {
    return {
      ...wp,
      difficult: true,
      correctCount: 0,
      sentenceIndex: wp.sentenceIndex + 1,
    };
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
