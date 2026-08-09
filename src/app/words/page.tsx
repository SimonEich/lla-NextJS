"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { progressRepo, wordsRepo } from "@/repositories";
import { progressService, WordProgress } from "@/services/progressService";
import { invalidateProgressCache } from "@/hooks/useSession";
import { Word, WordKind } from "@/data/words";

const KIND_LABELS: Record<WordKind, string> = {
  verb: "Verb",
  noun: "Nomen",
  adjective: "Adjektiv",
  adverb: "Adverb",
  prep: "Präp.",
  phrase: "Phrase",
};

type StatusFilter = "all" | "new" | "active" | "known";

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Alle" },
  { key: "new", label: "Neu" },
  { key: "active", label: "Aktiv" },
  { key: "known", label: "Gelernt" },
];

function statusOf(wp: WordProgress | undefined): StatusFilter {
  if (!wp || wp.state === "inactive") return "new";
  if (wp.state === "mastered") return "known";
  return "active";
}

// "Gemeistert" is more meaningful than "Level 5" once a word is mastered —
// the level number only matters while still actively climbing toward that.
function levelLabel(wp: WordProgress | undefined): string | null {
  if (!wp || wp.state === "inactive") return null;
  if (wp.state === "mastered") return "Gemeistert";
  return `Level ${wp.level}`;
}

const PAGE_SIZE = 100;

export default function WordListScreen() {
  const router = useRouter();
  const [words, setWords] = useState<Word[] | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, WordProgress>>({});
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([wordsRepo.getAll(), progressRepo.load()]).then(([w, p]) => {
      setWords(w);
      setProgressMap(p);
    });
  }, []);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, filter]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((c) => c + PAGE_SIZE);
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [words, query, filter]);

  const filtered = useMemo(() => {
    if (!words) return [];
    const q = query.trim().toLowerCase();
    return words.filter((w) => {
      if (filter !== "all" && statusOf(progressMap[w.id]) !== filter) return false;
      if (!q) return true;
      return w.native.toLowerCase().includes(q) || w.target.toLowerCase().includes(q);
    });
  }, [words, progressMap, query, filter]);

  const visible = filtered.slice(0, visibleCount);

  const toggleKnown = useCallback(
    async (wordId: string) => {
      const current = progressMap[wordId];
      if (current?.state === "mastered") {
        const next = { ...progressMap };
        delete next[wordId];
        setProgressMap(next);
        await progressRepo.save(next);
      } else {
        const wp = progressService.markKnown(wordId);
        setProgressMap((prev) => ({ ...prev, [wordId]: wp }));
        await progressRepo.saveOne(wp);
      }
      invalidateProgressCache();
    },
    [progressMap]
  );

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="Alle Wörter" />
      <div className="flex flex-col gap-3 px-6 pt-4 pb-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Wort suchen..."
          className="w-full rounded-2xl border-[1.5px] border-border bg-white px-4 py-2.5 text-base text-ink outline-none placeholder:text-muted-2"
        />
        <div className="flex gap-2 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`shrink-0 rounded-full border-[1.5px] px-3.5 py-1.5 text-sm font-semibold ${
                filter === f.key
                  ? "border-brand bg-brand text-white"
                  : "border-border bg-white text-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {words && (
          <p className="text-xs text-muted-2">
            {filtered.length} von {words.length} Wörtern
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-8">
        {!words ? (
          <div className="flex flex-1 items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-brand" />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {visible.map((w) => {
              const status = statusOf(progressMap[w.id]);
              const level = levelLabel(progressMap[w.id]);
              return (
                <div
                  key={w.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/words/detail?id=${w.id}`)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter" && e.key !== " ") return;
                    e.preventDefault();
                    router.push(`/words/detail?id=${w.id}`);
                  }}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-left shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-base font-semibold text-ink">{w.native}</p>
                      <span className="shrink-0 rounded-full bg-[#f0f0f0] px-2 py-0.5 text-[10px] font-medium text-muted-2">
                        {KIND_LABELS[w.kind]}
                      </span>
                      {level && (
                        <span className="shrink-0 rounded-full bg-correct-bg px-2 py-0.5 text-[10px] font-semibold text-brand">
                          {level}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-sm text-muted">{w.target}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleKnown(w.id);
                    }}
                    aria-label={status === "known" ? "Als ungelernt markieren" : "Als gelernt markieren"}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[1.5px] text-lg ${
                      status === "known"
                        ? "border-brand bg-correct-bg text-brand"
                        : "border-border bg-white text-muted-2"
                    }`}
                  >
                    {status === "known" ? "✓" : ""}
                  </button>
                </div>
              );
            })}
            {visible.length === 0 && (
              <p className="py-12 text-center text-sm text-muted-2">Keine Wörter gefunden.</p>
            )}
            {visibleCount < filtered.length && <div ref={sentinelRef} className="h-1" />}
          </div>
        )}
      </div>
    </div>
  );
}
