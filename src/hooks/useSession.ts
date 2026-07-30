"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  progressService,
  WordProgress,
  VerbFormContext,
  INFINITIVE_FORM,
} from "@/services/progressService";
import { progressRepo, wordsRepo } from "@/repositories";
import { statsService } from "@/services/statsService";
import { settingsService } from "@/services/settingsService";
import { buildAnswerArray } from "@/utils/random";
import { MultiData } from "@/types/session";
import { Word, Sentence } from "@/data/words";

// For a verb still climbing to mastery at level 5, picks which required
// form (infinitive or a person) to test next — rotating fairly through
// whatever's still outstanding — and the sentence to display alongside it.
function pickVerbForm(
  word: Word,
  wp: WordProgress
): { verbForm: VerbFormContext; sentence: Sentence } {
  const requiredForms = progressService.getRequiredVerbForms(word);
  const done = wp.formsDone ?? [];
  const remaining = requiredForms.filter((f) => !done.includes(f));
  const pool = remaining.length > 0 ? remaining : requiredForms;
  const label = pool[wp.sentenceIndex % pool.length];

  if (label === INFINITIVE_FORM) {
    // No single person-conjugated sentence fits "the infinitive" — show an
    // example sentence for flavor/context, but strip its person label so
    // the feedback screen doesn't hint at the wrong form.
    const sentence: Sentence = { ...word.sentences[0], pers_pron_form: undefined };
    return { verbForm: { label, expected: word.target, requiredForms }, sentence };
  }

  const sentence = word.sentences.find((s) => s.pers_pron_form === label) ?? word.sentences[0];
  return {
    verbForm: { label, expected: sentence.target_word_form, requiredForms },
    sentence,
  };
}

const REPEAT_COOLDOWN = 5;

// In-memory cache — survives re-renders, cleared on full page reload
const cache = {
  progress: null as Record<string, WordProgress> | null,
  words: null as Word[] | null,
  wordMap: null as Map<string, Word> | null,
  maxStackSize: 30,
  // Most recently asked word ids, most recent last — used so a word only
  // reappears after at least REPEAT_COOLDOWN other words have been asked.
  history: [] as string[],
};

// Call after writing to progressRepo from outside this hook (e.g. the word
// list's "mark as known" toggle) so the next session picks up the change
// instead of working off a stale in-memory snapshot.
export function invalidateProgressCache() {
  cache.progress = null;
  cache.history = [];
}

async function ensureLoaded() {
  if (!cache.progress) {
    cache.progress = await progressRepo.load();
    const settings = await settingsService.load();
    cache.maxStackSize = settings.maxStackSize;

    // Backfill review scheduling for words mastered before spaced
    // repetition existed (or marked "known" directly), so they don't get
    // stuck out of rotation forever.
    let backfilled = false;
    for (const wp of Object.values(cache.progress)) {
      if (wp.state === "mastered" && wp.nextReviewAt === undefined) {
        cache.progress[wp.wordId] = { ...wp, ...progressService.scheduleReview(1) };
        backfilled = true;
      }
    }
    if (backfilled) progressRepo.save(cache.progress);
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

      const activeList = progressService.getActive(progress);
      // Mastered words whose review date has arrived resurface alongside
      // the active stack in a normal learning session.
      const dueReviews = difficultOnly ? [] : progressService.getDueReviews(progress);

      let pool: WordProgress[];
      if (difficultOnly) {
        pool = activeList.filter((wp) => wp.difficult);
        if (pool.length === 0) {
          if (isMounted.current) setEmpty(true);
          return;
        }
      } else {
        pool = [...activeList, ...dueReviews];
      }

      const eligible = [...activeList, ...dueReviews];
      if (pool.length < 3 && eligible.length < 3) {
        console.warn("[useSession] Not enough active words.");
        return;
      }

      const eligibleData = eligible
        .map((wp) => wordMap.get(wp.wordId))
        .filter((w): w is Word => !!w);

      const poolData = difficultOnly
        ? pool.map((wp) => wordMap.get(wp.wordId)).filter((w): w is Word => !!w)
        : eligibleData;

      if (poolData.length === 0) return;

      // Pick correct word from pool, but not one asked in the last
      // REPEAT_COOLDOWN rounds — shrink the window if the pool is too
      // small to honor it fully rather than stalling the session.
      const cooldownWindow = Math.max(0, Math.min(REPEAT_COOLDOWN, poolData.length - 1));
      const banned = new Set(cooldownWindow > 0 ? cache.history.slice(-cooldownWindow) : []);
      const candidates = poolData.filter((w) => !banned.has(w.id));
      const pickPool = candidates.length > 0 ? candidates : poolData;

      const correctIdx = Math.floor(Math.random() * pickPool.length);
      const chosenWord = pickPool[correctIdx];
      const chosenProgress = pool.find((wp) => wp.wordId === chosenWord.id)!;

      // Verbs still climbing to mastery at level 5 must type every
      // conjugation form at least once — pick the next outstanding one and
      // align the displayed sentence with it. Due reviews (state ===
      // "mastered") skip this and use the normal rotation below.
      let sentence: Sentence;
      let verbForm: VerbFormContext | undefined;
      if (chosenWord.kind === "verb" && chosenProgress.level === 5 && chosenProgress.state === "active") {
        const picked = pickVerbForm(chosenWord, chosenProgress);
        sentence = picked.sentence;
        verbForm = picked.verbForm;
      } else {
        sentence = chosenWord.sentences[chosenProgress.sentenceIndex % chosenWord.sentences.length];
      }

      cache.history.push(chosenWord.id);
      if (cache.history.length > 50) cache.history = cache.history.slice(-50);

      // Pick 2 distractors from the eligible pool (different from correct)
      const distractorPool = eligibleData.filter((w) => w.id !== chosenWord.id);
      const d1 = distractorPool[Math.floor(Math.random() * distractorPool.length)];
      const d2Candidates = distractorPool.filter((w) => w.id !== d1?.id);
      const d2 = d2Candidates[Math.floor(Math.random() * d2Candidates.length)];

      if (!d1 || !d2) return;

      const answerArray = buildAnswerArray(chosenWord, d1, d2);

      if (isMounted.current) {
        setEmpty(false);
        setActiveCount(activeList.length);
        setData({
          word: chosenWord,
          sentence,
          progress: chosenProgress,
          answerArray,
          verbForm,
        });
      }
    } catch (error) {
      console.error("[useSession] Error:", error);
    }
  }, [difficultOnly]);

  const applyAndAdvance = useCallback(
    (updater: (wp: WordProgress, verbForm?: VerbFormContext) => WordProgress) => {
      if (!data || !cache.progress) return;

      const oldWp = cache.progress[data.progress.wordId];
      const updated = updater(oldWp, data.verbForm);
      cache.progress = { ...cache.progress, [updated.wordId]: updated };

      // Add a new word when leveling up (up to maxStackSize) — but only for
      // a genuinely NEW mastery, not every time an already-mastered review
      // word gets answered again.
      const newlyMastered = updated.state === "mastered" && oldWp.state !== "mastered";
      const didLevelUp = updated.level > oldWp.level || newlyMastered;
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
  const jumpToLevel5 = useCallback(
    () => applyAndAdvance(progressService.jumpToLevel5),
    [applyAndAdvance]
  );

  return {
    runSession,
    swipeRight,
    swipeUp,
    swipeLeft,
    swipeDown,
    jumpToLevel5,
    data,
    activeCount,
    empty,
  };
}
