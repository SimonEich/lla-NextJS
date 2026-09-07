"use client";

import { useRouter } from "next/navigation";
import { useStats } from "@/hooks/useStats";

const DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

export default function HomeScreen() {
  const router = useRouter();
  const { stats } = useStats();

  const learnedPct = stats ? Math.round((stats.masteredWords / Math.max(stats.totalWords, 1)) * 100) : 0;
  const maxWeek = stats ? Math.max(...stats.weekCounts, 1) : 1;

  const todayDowIdx = (new Date().getDay() + 6) % 7;
  const weekLabels = Array.from({ length: 7 }, (_, i) => DAYS[(todayDowIdx - 6 + i + 7) % 7]);

  return (
    <div className="flex-1 overflow-y-auto px-6 pb-12">
      <div className="mt-6 mb-2 flex items-start justify-between">
        <div>
          <p className="text-5xl font-extrabold tracking-tight text-ink">lla</p>
          <p className="mt-0.5 text-base text-muted">Lerne Spanisch</p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/settings")}
          className="mt-2 p-2 text-2xl"
          aria-label="Einstellungen"
        >
          ⚙️
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {/* Vocabulary progress */}
        <div className="flex flex-col gap-3 rounded-[20px] bg-white p-5 shadow-[0_3px_10px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-muted-2">Vokabular</p>
            <p className="text-[28px] font-extrabold text-ink">{learnedPct}%</p>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-[#f0f0f0]">
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-500"
              style={{ width: `${learnedPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-muted-2">{stats?.masteredWords ?? "–"} gemeistert</p>
            <p className="text-[13px] text-muted-2">{stats?.totalWords ?? "–"} gesamt</p>
          </div>
        </div>

        {/* Stat chips */}
        <div className="flex gap-3">
          <div className="flex flex-1 flex-col items-center gap-1 rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <p className="text-[22px] font-extrabold text-ink">{stats?.activeWords ?? "–"}</p>
            <p className="text-[11px] font-medium text-muted-2">Im Stapel</p>
          </div>
          <div className="flex flex-1 flex-col items-center gap-1 rounded-2xl bg-brand p-4">
            <p className="text-[22px] font-extrabold text-white">{stats?.streak ?? 0} 🔥</p>
            <p className="text-[11px] font-medium text-white/70">Tage Serie</p>
          </div>
          <div className="flex flex-1 flex-col items-center gap-1 rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <p className="text-[22px] font-extrabold text-ink">{stats?.masteredWords ?? 0}</p>
            <p className="text-[11px] font-medium text-muted-2">Gemeistert</p>
          </div>
        </div>

        {/* Weekly bar chart */}
        <div className="flex flex-col gap-3 rounded-[20px] bg-white p-5 shadow-[0_3px_10px_rgba(0,0,0,0.05)]">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-muted-2">Letzte 7 Tage</p>
          <div className="flex h-[100px] items-end gap-1.5">
            {(stats?.weekCounts ?? Array(7).fill(0)).map((count, i) => (
              <div key={i} className="flex h-full flex-1 flex-col items-center justify-end">
                <p className="mb-0.5 text-[10px] text-muted-2">{count > 0 ? count : ""}</p>
                <div className="flex h-[72px] w-[70%] flex-col justify-end">
                  <div
                    className="min-h-[3px] w-full rounded"
                    style={{
                      height: `${Math.round((count / maxWeek) * 100)}%`,
                      backgroundColor: i === 6 ? "#0F6E56" : "#c8e6df",
                    }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-muted-2">{weekLabels[i]}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={() => router.push("/learn")}
          className="rounded-[18px] bg-ink py-[18px] text-lg font-bold text-white"
        >
          Lernen starten
        </button>

        {stats && stats.difficultWords > 0 && (
          <button
            type="button"
            onClick={() => router.push("/difficult")}
            className="rounded-[18px] border-[1.5px] border-border bg-white py-4 text-base font-semibold text-ink"
          >
            Schwierige Wörter · {stats.difficultWords}
          </button>
        )}

        {stats && stats.examPoolWords > 0 && (
          <button
            type="button"
            onClick={() => router.push("/exam")}
            className="rounded-[18px] border-[1.5px] border-border bg-white py-4 text-base font-semibold text-ink"
          >
            Alle Wörter prüfen
          </button>
        )}

        <button
          type="button"
          onClick={() => router.push("/words")}
          className="rounded-[18px] border-[1.5px] border-border bg-white py-4 text-base font-semibold text-ink"
        >
          Alle Wörter durchsuchen
        </button>

        <div className="mt-1 flex items-center justify-center">
          <p className="text-xs text-[#ccc]">{stats?.totalAnswers ?? 0} Antworten gesamt</p>
        </div>
      </div>
    </div>
  );
}
