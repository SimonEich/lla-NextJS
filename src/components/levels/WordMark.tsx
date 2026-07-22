"use client";

import { useState } from "react";
import { MultiData } from "@/types/session";
import { Card } from "@/components/ui/Card";

type Props = {
  data: MultiData;
  onAnswer: (correct: boolean) => void;
};

export function WordMark({ data, onAnswer }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const { sentence } = data;

  // Split sentence into tokens, preserving punctuation as part of the word
  const tokens = sentence.target.split(" ");

  function handlePress(token: string) {
    if (selected) return;
    // Strip punctuation for comparison
    const clean = token.replace(/[.,!?;:]/g, "");
    const isCorrect = clean.toLowerCase() === sentence.target_word_form.toLowerCase();
    setSelected(token);
    setTimeout(() => {
      setSelected(null);
      onAnswer(isCorrect);
    }, 200);
  }

  return (
    <div className="flex flex-1 flex-col bg-app-bg px-5 pt-5 pb-12">
      <Card flex>
        <p className="mb-2 text-center text-4xl font-bold text-ink">{data.word.native}</p>
        <p className="mb-5 text-center text-sm text-muted-2">Tippe das richtige Wort an</p>
        <div className="flex flex-wrap justify-center gap-2 px-3">
          {tokens.map((token, i) => {
            const clean = token.replace(/[.,!?;:]/g, "");
            const isTarget = clean.toLowerCase() === sentence.target_word_form.toLowerCase();
            let bg = "bg-[#f0f0f0]";
            if (selected === token) {
              bg = isTarget ? "bg-correct-bg" : "bg-wrong-bg";
            }
            return (
              <button
                key={i}
                type="button"
                onClick={() => handlePress(token)}
                className={`rounded-[10px] px-3.5 py-2.5 text-2xl font-semibold text-ink transition-colors ${bg}`}
              >
                {token}
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
