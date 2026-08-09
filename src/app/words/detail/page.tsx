"use client";

import { useState, useEffect } from "react";
import { AppHeader } from "@/components/AppHeader";
import { wordsRepo } from "@/repositories";
import { Word, WordKind } from "@/data/words";

const KIND_LABELS: Record<WordKind, string> = {
  verb: "Verb",
  noun: "Nomen",
  adjective: "Adjektiv",
  adverb: "Adverb",
  prep: "Präp.",
  phrase: "Phrase",
};

export default function WordDetailScreen() {
  const [word, setWord] = useState<Word | null | undefined>(undefined);

  useEffect(() => {
    // No dynamic route (this is a fully static export — a [id] segment
    // would need every word id pre-rendered at build time) — read the id
    // from the query string client-side instead, same as everything else
    // in this app resolves words/progress after mount.
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) {
      setWord(null);
      return;
    }
    wordsRepo.getByIds([id]).then((words) => setWord(words[0] ?? null));
  }, []);

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title={word?.native ?? "Wort"} backLabel="Wörter" backHref="/words" />

      <div className="flex-1 overflow-y-auto px-6 pb-8">
        {word === undefined ? (
          <div className="flex flex-1 items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-brand" />
          </div>
        ) : word === null ? (
          <p className="py-12 text-center text-sm text-muted-2">Wort nicht gefunden.</p>
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-2 rounded-[20px] bg-white p-5 shadow-[0_3px_10px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-ink">{word.native}</p>
                <span className="shrink-0 rounded-full bg-[#f0f0f0] px-2 py-0.5 text-[11px] font-medium text-muted-2">
                  {KIND_LABELS[word.kind]}
                </span>
              </div>
              <p className="text-lg text-muted">{word.target}</p>
            </div>

            <p className="text-xs font-bold tracking-wide text-muted-2">
              BEISPIELSÄTZE · {word.sentences.length}
            </p>

            <div className="flex flex-col gap-3">
              {word.sentences.map((sentence, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-1.5 rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                >
                  <p className="text-sm text-muted">{sentence.native}</p>
                  <p className="text-[17px] font-semibold text-ink">{sentence.target}</p>
                  {sentence.pers_pron_form && (
                    <p className="text-xs text-muted-2">
                      {sentence.pers_pron_form}: {sentence.target_word_form}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
