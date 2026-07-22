"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { progressService, WordProgress } from "@/services/progressService";
import { progressRepo, wordsRepo } from "@/repositories";
import { statsService } from "@/services/statsService";
import { settingsService } from "@/services/settingsService";
import { buildAnswerArray } from "@/utils/random";
import { MultiData } from "@/types/session";
import { Word } from "@/data/words";

// In-memory cache — survives re-renders, cleared on full page reload
const cache = {
  progress: null as Record<string, WordProgress> | null,
  words: null as Word[] | null,
  wordMap: null as Map<string, Word> | null,
  maxStackSize: 30,
};

async function ensureLoaded() {
  if (!cache.progress) {
    cache.progress = await progressRepo.load();
    const settings = await settingsService.load();
    cache.maxStackSize = settings.maxStackSize;
  }
  if (!cache.words) {
    cache.words = await wordsRepo.getAll();
    cache.wordMap = new Map(cache.words.map((w) => [w.id, w]));

    const active = progressService.getActive(cache.progress!);
    if (active.length < 10) {
      const starter = cache.words.slice(0, 10);
      starter.forEach((w) => {
        cache.progress = progressService.activate(cache.progress!, w.id);
      });
      progressRepo.save(cache.progress!);
    }
  }
}

type Options = {
  difficultOnly?: boolean;
};

export function useSession(options: Options = {}) {
  const { difficultOnly = false } = options;
  const [data, setData] = useState<MultiData | null>(null);
  const [activeCount, setActiveCount] = useState(0);
  const [empty, setEmpty] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    runSession();
    return () => {
      isMounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runSession = useCallback(async () => {
    try {
      await ensureLoaded();

      const progress = cache.progress!;
      const wordMap = cache.wordMap!;

      let pool = progressService.getActive(progress);
      if (difficultOnly) {
        pool = pool.filter((wp) => wp.difficult);
        if (pool.length === 0) {
          if (isMounted.current) setEmpty(true);
          return;
        }
      }

      if (pool.length < 3) {
        const allActive = progressService.getActive(progress);
        if (allActive.length < 3) {
          console.warn("[useSession] Not enough active words.");
          return;
        }
      }

      const allActive = progressService.getActive(progress);
      const allActiveData = allActive
        .map((wp) => wordMap.get(wp.wordId))
        .filter((w): w is Word => !!w);

      const poolData = difficultOnly
        ? pool.map((wp) => wordMap.get(wp.wordId)).filter((w): w is Word => !!w)
        : allActiveData;

      if (poolData.length === 0) return;

      // Pick correct word from pool, distractors from all active
      const correctIdx = Math.floor(Math.random() * poolData.length);
      const chosenWord = poolData[correctIdx];
      const chosenProgress = pool.find((wp) => wp.wordId === chosenWord.id)!;
      const sentenceIndex = chosenProgress.sentenceIndex % chosenWord.sentences.length;

      // Pick 2 distractors from all active (different from correct)
      const distractorPool = allActiveData.filter((w) => w.id !== chosenWord.id);
      const d1 = distractorPool[Math.floor(Math.random() * distractorPool.length)];
      const d2Candidates = distractorPool.filter((w) => w.id !== d1?.id);
      const d2 = d2Candidates[Math.floor(Math.random() * d2Candidates.length)];

      if (!d1 || !d2) return;

      const answerArray = buildAnswerArray(chosenWord, d1, d2);

      if (isMounted.current) {
        setEmpty(false);
        setActiveCount(allActiveData.length);
        setData({
          word: chosenWord,
          sentence: chosenWord.sentences[sentenceIndex],
          progress: chosenProgress,
          answerArray,
        });
      }
    } catch (error) {
      console.error("[useSession] Error:", error);
    }
  }, [difficultOnly]);

  const applyAndAdvance = useCallback(
    (updater: (wp: WordProgress) => WordProgress) => {
      if (!data || !cache.progress) return;

      const oldWp = cache.progress[data.progress.wordId];
      const updated = updater(oldWp);
      cache.progress = { ...cache.progress, [updated.wordId]: updated };

      // Add a new word when leveling up (up to maxStackSize)
      const didLevelUp = updated.level > oldWp.level || updated.state === "mastered";
      if (didLevelUp && cache.words) {
        const currentActive = progressService.getActive(cache.progress).length;
        if (currentActive < cache.maxStackSize) {
          const inProgress = new Set(Object.keys(cache.progress));
          const nextWord = cache.words.find((w) => !inProgress.has(w.id));
          if (nextWord) {
            cache.progress = progressService.activate(cache.progress, nextWord.id);
          }
        }
      }

      progressRepo.save(cache.progress);
      statsService.recordAnswer();
      runSession();
    },
    [data, runSession]
  );

  const swipeRight = useCallback(
    () => applyAndAdvance(progressService.markCorrect),
    [applyAndAdvance]
  );
  const swipeUp = useCallback(
    () => applyAndAdvance(progressService.markFastForward),
    [applyAndAdvance]
  );
  const swipeLeft = useCallback(
    () => applyAndAdvance(progressService.markWrong),
    [applyAndAdvance]
  );
  const swipeDown = useCallback(
    () => applyAndAdvance(progressService.markDifficult),
    [applyAndAdvance]
  );

  return { runSession, swipeRight, swipeUp, swipeLeft, swipeDown, data, activeCount, empty };
}
