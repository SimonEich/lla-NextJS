const KEY = "practice_stats";

type Stats = {
  // ISO date strings (YYYY-MM-DD) when the user practiced
  practiceDates: string[];
  // answers count per date
  dailyCounts: Record<string, number>;
};

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function load(): Stats {
  if (typeof window === "undefined") return { practiceDates: [], dailyCounts: {} };
  const raw = window.localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : { practiceDates: [], dailyCounts: {} };
}

function save(stats: Stats): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(stats));
}

export const statsService = {
  async recordAnswer(): Promise<void> {
    const stats = load();
    const date = today();
    if (!stats.practiceDates.includes(date)) {
      stats.practiceDates.push(date);
    }
    stats.dailyCounts[date] = (stats.dailyCounts[date] ?? 0) + 1;
    save(stats); // fire-and-forget
  },

  async getStats(): Promise<{
    streak: number;
    todayCount: number;
    weekCounts: number[]; // last 7 days, oldest first
    totalAnswers: number;
  }> {
    const stats = load();
    const date = today();

    // Streak: count consecutive days backwards from today
    let streak = 0;
    const check = new Date();
    while (true) {
      const d = `${check.getFullYear()}-${String(check.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(check.getDate()).padStart(2, "0")}`;
      if (stats.practiceDates.includes(d)) {
        streak++;
        check.setDate(check.getDate() - 1);
      } else {
        break;
      }
    }

    // Last 7 days counts
    const weekCounts: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
      weekCounts.push(stats.dailyCounts[key] ?? 0);
    }

    const totalAnswers = Object.values(stats.dailyCounts).reduce((a, b) => a + b, 0);

    return {
      streak,
      todayCount: stats.dailyCounts[date] ?? 0,
      weekCounts,
      totalAnswers,
    };
  },
};
