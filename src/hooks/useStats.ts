"use client";

import { useState, useEffect, useCallback } from "react";
import { statsService } from "@/services/statsService";
import { progressRepo, wordsRepo } from "@/repositories";

export type AppStats = {
  totalWords: number;
  masteredWords: number;
  activeWords: number;
  difficultWords: number;
  streak: number;
  todayCount: number;
  weekCounts: number[];
  totalAnswers: number;
};

export function useStats() {
  const [stats, setStats] = useState<AppStats | null>(null);

  const load = useCallback(async () => {
    const [progress, words, practiceStats] = await Promise.all([
      progressRepo.load(),
      wordsRepo.getAll(),
      statsService.getStats(),
    ]);

    const allProgress = Object.values(progress);
    const mastered = allProgress.filter((wp) => wp.state === "mastered").length;
    const active = allProgress.filter((wp) => wp.state === "active").length;
    const difficult = allProgress.filter((wp) => wp.difficult).length;

    setStats({
      totalWords: words.length,
      masteredWords: mastered,
      activeWords: active,
      difficultWords: difficult,
      streak: practiceStats.streak,
      todayCount: practiceStats.todayCount,
      weekCounts: practiceStats.weekCounts,
      totalAnswers: practiceStats.totalAnswers,
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { stats, reload: load };
}
